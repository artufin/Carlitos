// NOT IMPLEMENTED (MVP)
//
// Real authentication design: one-time code by email, @uc.cl domain only,
// session in a signed httpOnly cookie, admin role from ADMIN_EMAILS.
// The `/login` screen is already the final UI; it just does not call this.
// See docs/DECISIONS.md -> "Auth real" for the migration plan from the
// anonymous device user to a real user.

export const ALLOWED_EMAIL_DOMAIN = "uc.cl";

export interface EmailSender {
  /** Sends the one-time code. The dev implementation would print it to the console. */
  sendLoginCode(to: string, code: string): Promise<void>;
}

export interface AuthService {
  /**
   * Validates the domain, stores a hashed `LoginCode` with a short expiry and
   * sends it through `EmailSender`.
   */
  requestCode(email: string): Promise<void>;
  /**
   * Verifies the code, consumes it, finds or creates the real user (merging
   * the current device user into it) and rotates the session cookie.
   */
  verifyCode(email: string, code: string, deviceId: string): Promise<{ userId: string }>;
}

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} is not implemented in the MVP`);
    this.name = "NotImplementedError";
  }
}

export function isAllowedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/** Placeholder implementations so the interfaces are exercised by the type checker. */
export const consoleEmailSender: EmailSender = {
  async sendLoginCode() {
    throw new NotImplementedError("EmailSender.sendLoginCode");
  },
};

export const authService: AuthService = {
  async requestCode() {
    throw new NotImplementedError("AuthService.requestCode");
  },
  async verifyCode() {
    throw new NotImplementedError("AuthService.verifyCode");
  },
};
