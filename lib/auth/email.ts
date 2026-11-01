import { getEnv } from "@/lib/env";
import { HttpError } from "@/lib/http";

// Sends the verification code through the first configured provider, using
// plain fetch (no SDKs):
//   1. BREVO_API_KEY  -> Brevo (free tier, works with a single verified sender
//      address, no own domain needed). EMAIL_FROM must be that address.
//   2. RESEND_API_KEY -> Resend (needs a verified domain to email anyone).
//   3. Neither, in development only -> the code is printed to the server console.

export interface EmailSender {
  sendVerificationCode(to: string, code: string): Promise<void>;
}

const RESEND_DEFAULT_FROM = "CAi <onboarding@resend.dev>";

const subject = (code: string) => `Tu código CAi: ${code}`;
const text = (code: string) =>
  `Tu código de verificación es ${code}. Vence en 10 minutos.\n\nSi no creaste una cuenta en CAi, ignora este correo.`;

const sendFailed = () => new HttpError(502, "No pudimos enviar el correo. Inténtalo de nuevo en un momento.");

/** Splits `"Name <email@x.com>"` or `"email@x.com"` into its parts. */
export function parseSender(from: string): { name?: string; email: string } | null {
  const match = from.trim().match(/^(?:"?([^"<]*?)"?\s*<([^<>\s]+@[^<>\s]+)>|([^<>\s]+@[^<>\s]+))$/);
  if (!match) return null;
  const email = match[2] ?? match[3];
  const name = match[1]?.trim();
  return name ? { name, email } : { email };
}

const consoleSender: EmailSender = {
  async sendVerificationCode(to, code) {
    console.info(`[auth] código de verificación para ${to}: ${code}`);
  },
};

export function brevoSender(apiKey: string, sender: { name?: string; email: string }): EmailSender {
  return {
    async sendVerificationCode(to, code) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": apiKey, accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ sender, to: [{ email: to }], subject: subject(code), textContent: text(code) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        // Brevo's error body is `{ code, message }` (e.g. an unverified sender); it never echoes the key.
        const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
        console.error("[auth] brevo failed", response.status, body.code, body.message);
        throw sendFailed();
      }
    },
  };
}

function resendSender(apiKey: string, from: string): EmailSender {
  return {
    async sendVerificationCode(to, code) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject: subject(code), text: text(code) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.error("[auth] resend failed", response.status);
        throw sendFailed();
      }
    },
  };
}

export function getEmailSender(): EmailSender {
  const env = getEnv();
  if (env.BREVO_API_KEY) {
    const sender = env.EMAIL_FROM ? parseSender(env.EMAIL_FROM) : null;
    if (!sender) {
      throw new HttpError(503, "Falta EMAIL_FROM con el correo verificado en Brevo (ej.: CAi <tu@correo.com>)");
    }
    return brevoSender(env.BREVO_API_KEY, sender);
  }
  if (env.RESEND_API_KEY) return resendSender(env.RESEND_API_KEY, env.EMAIL_FROM ?? RESEND_DEFAULT_FROM);
  if (process.env.NODE_ENV !== "production") return consoleSender;
  throw new HttpError(503, "El envío de correos no está configurado (falta BREVO_API_KEY o RESEND_API_KEY)");
}
