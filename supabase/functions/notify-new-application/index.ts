/**
 * Edge Function: notify-new-application
 * Sends an email to the employer when someone applies for their job.
 */

const SMTP_USER = Deno.env.get("SMTP_USER") || "marketing@ailem.uz";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const SENDER_EMAIL = "noreply@baibang.uz";
const SENDER_NAME = "百邦 BAIBANG";
const SITE_URL = "https://baibang.uz";

type Locale = "uz" | "zh" | "ru";

const t: Record<Locale, {
  subject: (job: string) => string;
  heading: string;
  body: (worker: string, job: string) => string;
  cover_note_label: string;
  button: string;
  footer: string;
}> = {
  uz: {
    subject: (job) => `百邦 — "${job}" ish oʻrniga yangi ariza`,
    heading: "Yangi ariza topshirildi!",
    body: (w, j) => `<strong>${w}</strong> sizning <strong>"${j}"</strong> ish oʻrningizga ariza topshirdi.`,
    cover_note_label: "Qoʻshimcha xat:",
    button: "Arizalarni koʻrish",
    footer: "Bu xabar baibang.uz platformasida ish oʻrningizga yangi ariza kelgani uchun yuborildi.",
  },
  zh: {
    subject: (job) => `百邦 — "${job}" 收到新申请`,
    heading: "收到新的求职申请！",
    body: (w, j) => `<strong>${w}</strong> 申请了您发布的 <strong>"${j}"</strong> 职位。`,
    cover_note_label: "附言：",
    button: "查看申请",
    footer: "此邮件是因为您在 baibang.uz 上的职位收到了新申请而发送的。",
  },
  ru: {
    subject: (job) => `百邦 — Новый отклик на "${job}"`,
    heading: "Новый отклик на вакансию!",
    body: (w, j) => `<strong>${w}</strong> откликнулся на вашу вакансию <strong>"${j}"</strong>.`,
    cover_note_label: "Сопроводительное письмо:",
    button: "Посмотреть отклики",
    footer: "Это письмо отправлено, потому что на вашу вакансию на baibang.uz поступил новый отклик.",
  },
};

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

function buildHtml(locale: Locale, workerName: string, jobTitle: string, coverNote: string | null, dashboardUrl: string): string {
  const l = t[locale];
  const coverNoteHtml = coverNote
    ? `<div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#4b5563;line-height:1.6">
        <strong style="color:#374151">${l.cover_note_label}</strong><br>
        ${coverNote.replace(/\n/g, '<br>')}
      </div>`
    : '';

  return `<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#ed2024;padding:24px;text-align:center">
    <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px">百邦</span>
    <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:2px">BAIBANG</div>
  </div>
  <div style="padding:32px 28px">
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827">${l.heading}</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6">${l.body(workerName, jobTitle)}</p>
    ${coverNoteHtml}
    <div style="text-align:center;margin:28px 0">
      <a href="${dashboardUrl}" style="display:inline-block;background:#ed2024;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none">${l.button}</a>
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">${l.footer}</p>
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

  try {
    const { employerEmail, employerName, workerName, jobTitle, coverNote, locale } = await req.json();

    if (!employerEmail) {
      return new Response(JSON.stringify({ error: "Missing employerEmail" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const l = (["uz", "zh", "ru"].includes(locale) ? locale : "uz") as Locale;
    const dashboardUrl = `${SITE_URL}/${l}/employer/dashboard`;
    const subject = t[l].subject(jobTitle || "Job");
    const html = buildHtml(l, workerName || "Someone", jobTitle || "—", coverNote || null, dashboardUrl);

    await sendSmtp(employerEmail, subject, html);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("notify-new-application error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
