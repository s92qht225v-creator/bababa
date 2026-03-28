/**
 * Edge Function: notify-new-message
 * Sends an email notification when someone receives a new message.
 */

const SMTP_USER = Deno.env.get("SMTP_USER") || "marketing@ailem.uz";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const SENDER_EMAIL = "noreply@baibang.uz";
const SENDER_NAME = "百邦 BAIBANG";
const SITE_URL = "https://baibang.uz";

type Locale = "uz" | "zh" | "ru";

const t: Record<Locale, {
  subject: (sender: string) => string;
  heading: (sender: string) => string;
  body: string;
  button: string;
  footer: string;
}> = {
  uz: {
    subject: (s) => `百邦 — ${s} sizga xabar yubordi`,
    heading: (s) => `${s} sizga xabar yubordi`,
    body: "Platformada yangi xabar oldingiz. Xabarni oʻqish va javob berish uchun quyidagi tugmani bosing.",
    button: "Xabarni oʻqish",
    footer: "Bu xabar baibang.uz platformasida sizga yangi xabar kelgani uchun yuborildi.",
  },
  zh: {
    subject: (s) => `百邦 — ${s} 给您发了消息`,
    heading: (s) => `${s} 给您发了一条消息`,
    body: "您在平台上收到了一条新消息。点击下方按钮查看并回复。",
    button: "查看消息",
    footer: "此邮件是因为您在 baibang.uz 上收到了新消息而发送的。",
  },
  ru: {
    subject: (s) => `百邦 — ${s} отправил(а) вам сообщение`,
    heading: (s) => `${s} отправил(а) вам сообщение`,
    body: "Вы получили новое сообщение на платформе. Нажмите кнопку ниже, чтобы прочитать и ответить.",
    button: "Прочитать сообщение",
    footer: "Это письмо отправлено, потому что вам пришло новое сообщение на baibang.uz.",
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

function buildMessageEmailHtml(
  locale: Locale,
  senderName: string,
  messagePreview: string,
  receiverRole: string,
): string {
  const tr = t[locale];
  const messagesUrl = receiverRole === "worker"
    ? `${SITE_URL}/${locale}/worker/messages`
    : `${SITE_URL}/${locale}/employer/messages`;

  return `<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#ed2024;padding:24px;text-align:center">
    <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px">百邦</span>
    <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:2px">BAIBANG</div>
  </div>
  <div style="padding:32px 28px">
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827">${tr.heading(senderName)}</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6">${tr.body}</p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic">"${messagePreview}"</p>
      <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">— ${senderName}</p>
    </div>

    <div style="text-align:center;margin:28px 0">
      <a href="${messagesUrl}" style="display:inline-block;background:#ed2024;color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none">${tr.button}</a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">${tr.footer}</p>
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
    const {
      receiverEmail,
      receiverName,
      receiverRole,
      senderName,
      messagePreview,
      locale,
    } = await req.json();

    if (!receiverEmail || !senderName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lang: Locale = (locale === "zh" || locale === "ru") ? locale : "uz";
    const preview = (messagePreview || "").substring(0, 150);
    const role = receiverRole || "worker";
    const subject = t[lang].subject(senderName);
    const html = buildMessageEmailHtml(lang, senderName, preview, role);

    await sendSmtp(receiverEmail, subject, html);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("notify-new-message error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
