import { getEnv } from "@/lib/env";
import { HttpError } from "@/lib/http";

// Sends the verification code. With RESEND_API_KEY it uses Resend's HTTP API
// (plain fetch, no SDK). Without it, in development only, the code is printed
// to the server console so the flow can be tested locally.

export interface EmailSender {
  sendVerificationCode(to: string, code: string): Promise<void>;
}

const consoleSender: EmailSender = {
  async sendVerificationCode(to, code) {
    console.info(`[auth] código de verificación para ${to}: ${code}`);
  },
};

function resendSender(apiKey: string, from: string): EmailSender {
  return {
    async sendVerificationCode(to, code) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `Tu código CAi: ${code}`,
          text: `Tu código de verificación es ${code}. Vence en 10 minutos.\n\nSi no creaste una cuenta en CAi, ignora este correo.`,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.error("[auth] resend failed", response.status);
        throw new HttpError(502, "No pudimos enviar el correo. Inténtalo de nuevo en un momento.");
      }
    },
  };
}

export function getEmailSender(): EmailSender {
  const env = getEnv();
  if (env.RESEND_API_KEY) return resendSender(env.RESEND_API_KEY, env.EMAIL_FROM);
  if (process.env.NODE_ENV !== "production") return consoleSender;
  throw new HttpError(503, "El envío de correos no está configurado (falta RESEND_API_KEY)");
}
