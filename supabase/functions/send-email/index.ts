import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;
const SMTP_USER = Deno.env.get("SMTP_USER") || "marketing@ailem.uz";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const SENDER_EMAIL = "noreply@baibang.uz";
const SENDER_NAME = "百邦";
const SITE_URL = "https://baibang.uz";

type Locale = "uz" | "zh" | "ru";

const translations: Record<
  string,
  Record<Locale, { subject: string; heading: string; body: string; button: string; footer: string }>
> = {
  signup: {
    uz: {
      subject: "百邦 — Roʻyxatdan oʻtishni tasdiqlang",
      heading: "Emailni tasdiqlang",
      body: "Roʻyxatdan oʻtganingiz uchun rahmat! Hisobingizni tasdiqlash uchun quyidagi tugmani bosing.",
      button: "Emailni tasdiqlash",
      footer: "Agar siz roʻyxatdan oʻtmagan boʻlsangiz, bu xabarni eʼtiborsiz qoldiring.",
    },
    zh: {
      subject: "百邦 — 确认注册",
      heading: "确认您的邮箱",
      body: "感谢您的注册！请点击下方按钮确认您的账户。",
      button: "确认邮箱",
      footer: "如果您没有创建账户，请忽略此邮件。",
    },
    ru: {
      subject: "百邦 — Подтвердите регистрацию",
      heading: "Подтвердите ваш email",
      body: "Спасибо за регистрацию! Нажмите кнопку ниже, чтобы подтвердить аккаунт.",
      button: "Подтвердить email",
      footer: "Если вы не создавали аккаунт, проигнорируйте это письмо.",
    },
  },
  recovery: {
    uz: {
      subject: "百邦 — Parolni tiklash",
      heading: "Parolni tiklash",
      body: "Parolingizni tiklash soʻrovi qabul qilindi. Yangi parol oʻrnatish uchun quyidagi tugmani bosing.",
      button: "Parolni tiklash",
      footer: "Agar siz bu soʻrovni yubormagan boʻlsangiz, bu xabarni eʼtiborsiz qoldiring.",
    },
    zh: {
      subject: "百邦 — 重置密码",
      heading: "重置密码",
      body: "我们收到了重置密码的请求。请点击下方按钮设置新密码。",
      button: "重置密码",
      footer: "如果您没有请求重置密码，请忽略此邮件。",
    },
    ru: {
      subject: "百邦 — Сброс пароля",
      heading: "Сброс пароля",
      body: "Мы получили запрос на сброс пароля. Нажмите кнопку ниже, чтобы установить новый пароль.",
      button: "Сбросить пароль",
      footer: "Если вы не запрашивали сброс пароля, проигнорируйте это письмо.",
    },
  },
  magiclink: {
    uz: {
      subject: "百邦 — Kirish havolasi",
      heading: "Kirish havolasi",
      body: "Hisobingizga kirish uchun quyidagi tugmani bosing.",
      button: "Kirish",
      footer: "Agar siz bu soʻrovni yubormagan boʻlsangiz, bu xabarni eʼtiborsiz qoldiring.",
    },
    zh: {
      subject: "百邦 — 登录链接",
      heading: "登录链接",
      body: "点击下方按钮登录您的账户。",
      button: "登录",
      footer: "如果您没有请求此链接，请忽略此邮件。",
    },
    ru: {
      subject: "百邦 — Ссылка для входа",
      heading: "Ссылка для входа",
      body: "Нажмите кнопку ниже, чтобы войти в свой аккаунт.",
      button: "Войти",
      footer: "Если вы не запрашивали эту ссылку, проигнорируйте это письмо.",
    },
  },
  email_change: {
    uz: {
      subject: "百邦 — Email manzilni oʻzgartirish",
      heading: "Email manzilni tasdiqlang",
      body: "Email manzilingizni oʻzgartirish uchun quyidagi tugmani bosing.",
      button: "Tasdiqlash",
      footer: "Agar siz bu soʻrovni yubormagan boʻlsangiz, bu xabarni eʼtiborsiz qoldiring.",
    },
    zh: {
      subject: "百邦 — 更改邮箱",
      heading: "确认更改邮箱",
      body: "点击下方按钮确认更改您的邮箱地址。",
      button: "确认更改",
      footer: "如果您没有请求更改邮箱，请忽略此邮件。",
    },
    ru: {
      subject: "百邦 — Изменение email",
      heading: "Подтвердите изменение email",
      body: "Нажмите кнопку ниже, чтобы подтвердить изменение адреса электронной почты.",
      button: "Подтвердить",
      footer: "Если вы не запрашивали это изменение, проигнорируйте это письмо.",
    },
  },
};

function buildConfirmationUrl(
  siteUrl: string,
  tokenHash: string,
  type: string,
  redirectTo?: string
): string {
  const params = new URLSearchParams({ token_hash: tokenHash, type });
  if (redirectTo) params.set("next", redirectTo);
  return `${siteUrl}/auth/confirm?${params.toString()}`;
}

function buildEmailHtml(
  t: { heading: string; body: string; button: string; footer: string },
  actionUrl: string
): string {
  return `<div style="max-width:520px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#ed2024;padding:24px;text-align:center">
    <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px">百邦</span>
  </div>
  <div style="padding:32px 28px">
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827">${t.heading}</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6">${t.body}</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${actionUrl}" style="display:inline-block;background:#ed2024;color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none">${t.button}</a>
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5">${t.footer}</p>
  </div>
  <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb">
    <span style="font-size:12px;color:#9ca3af">© 2026 百邦 · baibang.uz</span>
  </div>
</div>`;
}

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
  // Use port 465 (direct TLS) since Deno Deploy doesn't support STARTTLS
  const conn = await Deno.connectTls({ hostname: "smtp.zoho.eu", port: 465 });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Read a complete SMTP response (handles multiline like 250-xxx / 250 xxx)
  async function readResponse(): Promise<string> {
    let result = "";
    while (true) {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      if (!n) break;
      result += decoder.decode(buf.subarray(0, n));
      // SMTP response is complete when last line matches: 3-digit code + space
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

  // Greeting
  await readResponse();
  await write("EHLO baibang.uz");

  // AUTH LOGIN (334 = server ready for next credential)
  const authStart = await write("AUTH LOGIN");
  if (!authStart.startsWith("334")) {
    conn.close();
    throw new Error("SMTP AUTH LOGIN rejected: " + authStart);
  }
  const userRes = await write(btoa(SMTP_USER));
  if (!userRes.startsWith("334")) {
    conn.close();
    throw new Error("SMTP username rejected: " + userRes);
  }
  const authRes = await write(btoa(SMTP_PASS));
  if (!authRes.startsWith("235")) {
    conn.close();
    throw new Error("SMTP auth failed: " + authRes);
  }

  // MAIL FROM / RCPT TO / DATA
  await write(`MAIL FROM:<${SENDER_EMAIL}>`);
  await write(`RCPT TO:<${to}>`);
  await write("DATA");

  const raw = buildRawEmail(to, subject, html);
  await conn.write(encoder.encode(raw + "\r\n.\r\n"));
  const dataRes = await readResponse();
  if (!dataRes.startsWith("250")) {
    conn.close();
    throw new Error("SMTP send failed: " + dataRes);
  }

  await write("QUIT");
  conn.close();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature
    // Supabase sends secret as "v1,whsec_xxx" — standardwebhooks needs "whsec_xxx"
    const secret = hookSecret.startsWith("v1,") ? hookSecret.slice(3) : hookSecret;
    const wh = new Webhook(secret);
    wh.verify(payload, headers);

    const {
      user,
      email_data: { email_action_type, token_hash, token_hash_new, redirect_to },
    } = JSON.parse(payload);

    // Look up user's language preference
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let locale: Locale = "uz";
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=language_preference`,
        {
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      const profiles = await res.json();
      if (profiles?.[0]?.language_preference) {
        const pref = profiles[0].language_preference;
        if (pref === "zh" || pref === "ru" || pref === "uz") {
          locale = pref;
        }
      }
    } catch {
      // Default to uz
    }

    // Get translation
    let translationKey = email_action_type;
    if (translationKey === "invite") translationKey = "signup";
    const t = translations[translationKey]?.[locale] || translations.signup[locale];

    // Build confirmation URL
    let confirmType = "signup";
    if (email_action_type === "recovery") confirmType = "recovery";
    else if (email_action_type === "magiclink") confirmType = "magiclink";
    else if (email_action_type === "email_change") confirmType = "email_change";

    const hash = email_action_type === "email_change" ? token_hash_new : token_hash;
    const actionUrl = buildConfirmationUrl(SITE_URL, hash, confirmType, redirect_to);

    // Send via raw SMTP
    await sendSmtp(user.email, t.subject, buildEmailHtml(t, actionUrl));

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message + "\n" + err.stack : String(err);
    console.error("send-email error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
