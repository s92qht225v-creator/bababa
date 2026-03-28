/**
 * Edge Function: remind-profile
 * Sends email to workers who haven't filled their profile,
 * encouraging them to complete it to increase their job chances.
 */

const SMTP_USER = Deno.env.get("SMTP_USER") || "marketing@ailem.uz";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const SENDER_EMAIL = "noreply@baibang.uz";
const SENDER_NAME = "百邦 BAIBANG";
const SITE_URL = "https://baibang.uz";

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

function buildProfileReminderHtml(name: string): string {
  const profileUrl = `${SITE_URL}/uz/worker/profile`;
  const jobsUrl = `${SITE_URL}/uz/jobs`;

  return `<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#ed2024;padding:24px;text-align:center">
    <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px">百邦</span>
    <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:2px">BAIBANG</div>
  </div>
  <div style="padding:32px 28px">
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Assalomu alaykum${name ? ', ' + name : ''}!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6">
      Siz <strong>baibang.uz</strong> platformasida roʻyxatdan oʻtgansiz, lekin profilingiz hali toʻldirilmagan.
    </p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:24px">
      <h3 style="margin:0 0 12px;font-size:16px;color:#dc2626">Nima uchun profilni toʻldirish muhim?</h3>
      <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#4b5563;line-height:1.8">
        <li>Ish beruvchilar sizning profilingizni koʻrib, <strong>bevosita taklif yuborishi</strong> mumkin</li>
        <li>Toʻliq profil ariza topshirganda <strong>ishga qabul qilinish imkoniyatini oshiradi</strong></li>
        <li>Xitoy tili darajangiz (HSK) va tajribangiz ish beruvchilarga koʻrinadi</li>
        <li>Hozirda <strong>7 ta faol ish oʻrni</strong> mavjud — ulardan biri sizga mos boʻlishi mumkin!</li>
      </ul>
    </div>

    <p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.6">
      Profilingizni toʻldirish atigi <strong>2-3 daqiqa</strong> vaqtingizni oladi. Quyidagi maʻlumotlarni kiriting:
    </p>

    <div style="margin:16px 0 24px;font-size:14px;color:#4b5563;line-height:1.8">
      ✅ Kasbingiz va tajribangiz<br>
      ✅ Xitoy tili darajangiz (HSK)<br>
      ✅ Telefon raqamingiz<br>
      ✅ Qisqacha oʻzingiz haqingizda
    </div>

    <div style="text-align:center;margin:28px 0">
      <a href="${profileUrl}" style="display:inline-block;background:#ed2024;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none">Profilni toʻldirish</a>
    </div>

    <div style="text-align:center;margin:16px 0">
      <a href="${jobsUrl}" style="font-size:13px;color:#ed2024;text-decoration:none">Mavjud ish oʻrinlarini koʻrish →</a>
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
    // 1. Get all active workers
    const workersRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?role=eq.worker&is_active=eq.true&select=id,email,full_name`,
      { headers }
    );
    const workers = await workersRes.json();

    // 2. Get all worker_profiles with key fields
    const wpRes = await fetch(
      `${supabaseUrl}/rest/v1/worker_profiles?select=user_id,profession,phone`,
      { headers }
    );
    const wpData = await wpRes.json();
    const workerProfiles = Array.isArray(wpData) ? wpData : [];
    const wpMap = new Map(workerProfiles.map((wp: any) => [wp.user_id, wp]));

    // 3. Find workers with NO worker_profile at all (skip partially filled)
    const incomplete = (workers || []).filter((w: any) => {
      return !wpMap.has(w.id);
    });

    if (incomplete.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "All workers have complete profiles", sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Send emails
    const subject = "百邦 — Profilingizni toʻldiring va ish imkoniyatini oshiring!";
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const worker of incomplete) {
      if (!worker.email) { failed++; continue; }
      try {
        const html = buildProfileReminderHtml(worker.full_name || "");
        await sendSmtp(worker.email, subject, html);
        sent++;
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        failed++;
        errors.push(`${worker.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalWorkers: workers.length,
        incompleteProfiles: incomplete.length,
        sent,
        failed,
        errors: errors.slice(0, 10),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("remind-profile error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
