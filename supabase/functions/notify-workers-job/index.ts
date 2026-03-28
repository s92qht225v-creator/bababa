/**
 * Edge Function: notify-workers-job
 * Sends an email to all workers about the latest job posting.
 * Invoke via: supabase functions invoke notify-workers-job --no-verify-jwt
 * Or via admin panel / API call.
 */

const SMTP_USER = Deno.env.get("SMTP_USER") || "marketing@ailem.uz";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const SENDER_EMAIL = "noreply@baibang.uz";
const SENDER_NAME = "百邦 BAIBANG";
const SITE_URL = "https://baibang.uz";

// ── SMTP helpers (reused from send-email) ──

function buildRawEmail(to: string, subject: string, html: string): string {
  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "");
  const lines = [
    `From: ${SENDER_NAME} <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(html))),
    ``,
    `--${boundary}--`,
  ];
  return lines.join("\r\n");
}

async function sendSmtp(to: string, subject: string, html: string): Promise<void> {
  const conn = await Deno.connectTls({ hostname: "smtp.zoho.eu", port: 465 });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    let result = "";
    while (true) {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      if (!n) break;
      result += decoder.decode(buf.subarray(0, n));
      const lines = result.trim().split("\r\n");
      const lastLine = lines[lines.length - 1];
      if (/^\d{3} /.test(lastLine) || /^\d{3}\r?$/.test(lastLine)) break;
    }
    return result;
  }

  async function write(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readResponse();
  }

  await readResponse();
  await write("EHLO baibang.uz");

  const authStart = await write("AUTH LOGIN");
  if (!authStart.startsWith("334")) { conn.close(); throw new Error("AUTH rejected: " + authStart); }
  const userRes = await write(btoa(SMTP_USER));
  if (!userRes.startsWith("334")) { conn.close(); throw new Error("Username rejected: " + userRes); }
  const authRes = await write(btoa(SMTP_PASS));
  if (!authRes.startsWith("235")) { conn.close(); throw new Error("Auth failed: " + authRes); }

  await write(`MAIL FROM:<${SENDER_EMAIL}>`);
  await write(`RCPT TO:<${to}>`);
  await write("DATA");

  const raw = buildRawEmail(to, subject, html);
  await conn.write(encoder.encode(raw + "\r\n.\r\n"));
  const dataRes = await readResponse();
  if (!dataRes.startsWith("250")) { conn.close(); throw new Error("Send failed: " + dataRes); }

  await write("QUIT");
  conn.close();
}

// ── Email template ──

interface JobInfo {
  title: string;
  company: string;
  location: string;
  salary: string;
  slug: string;
  description: string;
}

function buildJobEmailHtml(job: JobInfo): string {
  const jobUrl = `${SITE_URL}/uz/jobs/${job.slug}`;
  const allJobsUrl = `${SITE_URL}/uz/jobs`;

  return `<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#ed2024;padding:24px;text-align:center">
    <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px">百邦</span>
    <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:2px">BAIBANG</div>
  </div>
  <div style="padding:32px 28px">
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Yangi ish o'rni! 🎉</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6">
      Platformamizda yangi ish e'loni joylandi. Quyidagi ma'lumotlarni ko'rib chiqing:
    </p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px">
      <h3 style="margin:0 0 12px;font-size:18px;color:#111827">${job.title}</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#6b7280;width:30%">🏢 Kompaniya:</td>
          <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600">${job.company}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#6b7280">📍 Joylashuv:</td>
          <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600">${job.location}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#6b7280">💰 Maosh:</td>
          <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600">${job.salary}</td>
        </tr>
      </table>
      ${job.description ? `<p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5;border-top:1px solid #e5e7eb;padding-top:12px">${job.description}</p>` : ''}
    </div>

    <div style="text-align:center;margin:28px 0">
      <a href="${jobUrl}" style="display:inline-block;background:#ed2024;color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none">Batafsil ko'rish</a>
    </div>

    <div style="text-align:center;margin:16px 0">
      <a href="${allJobsUrl}" style="font-size:13px;color:#ed2024;text-decoration:none">Barcha ish o'rinlarini ko'rish →</a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">
      Bu xabar baibang.uz platformasida roʻyxatdan oʻtganingiz uchun yuborildi.
    </p>
  </div>
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb">
    <span style="font-size:12px;color:#9ca3af">© 2026 百邦 · baibang.uz</span>
  </div>
</div>`;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Fetch the latest active job with company info
    const jobRes = await fetch(
      `${supabaseUrl}/rest/v1/jobs?status=eq.active&order=created_at.desc&limit=1&select=id,title_uz,description_uz,slug,salary_min,salary_max,salary_currency,location_id,company:companies(name_original),location:locations(city)`,
      { headers }
    );
    const jobs = await jobRes.json();
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ error: "No active jobs found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const job = jobs[0];
    const company = job.company?.name_original ?? "—";
    const city = job.location?.city ?? "—";
    const salaryMin = job.salary_min ? Number(job.salary_min).toLocaleString() : "0";
    const salaryMax = job.salary_max ? Number(job.salary_max).toLocaleString() : "0";
    const salary = `$${salaryMin}–$${salaryMax} ${job.salary_currency ?? ""}`.trim();
    const description = (job.description_uz ?? "").substring(0, 200);

    const jobInfo: JobInfo = {
      title: job.title_uz ?? "Yangi ish o'rni",
      company,
      location: city,
      salary,
      slug: job.slug,
      description,
    };

    // 2. Fetch all worker emails
    const workersRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?role=eq.worker&is_active=eq.true&select=email,full_name`,
      { headers }
    );
    const workers = await workersRes.json();
    if (!workers || workers.length === 0) {
      return new Response(JSON.stringify({ error: "No workers found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Send emails to all workers
    const subject = `百邦 — Yangi ish: ${jobInfo.title} (${jobInfo.company})`;
    const html = buildJobEmailHtml(jobInfo);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const worker of workers) {
      if (!worker.email) {
        failed++;
        continue;
      }
      try {
        await sendSmtp(worker.email, subject, html);
        sent++;
        // Small delay to avoid SMTP rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        failed++;
        errors.push(`${worker.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        job: jobInfo.title,
        totalWorkers: workers.length,
        sent,
        failed,
        errors: errors.slice(0, 10),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("notify-workers-job error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
