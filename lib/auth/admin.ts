// NOT IMPLEMENTED (MVP)
//
// Admin authorization. In the MVP `/admin` and every `/api/admin/*` route are
// OPEN: this function never throws. It exists as the single place where real
// authorization will be plugged in (role ADMIN on the user, derived from
// ADMIN_EMAILS once email auth exists). Every admin page and route handler
// MUST call it so that switching it on later is a one-file change.
//
// Do NOT deploy this demo with real data or real subscribers.
// See docs/DECISIONS.md -> "Acceso admin abierto".

export class AdminForbiddenError extends Error {
  constructor() {
    super("Admin access required");
    this.name = "AdminForbiddenError";
  }
}

export interface AdminContext {
  /** Who is acting as admin. Always the demo actor in the MVP. */
  actor: "demo";
}

export async function requireAdmin(): Promise<AdminContext> {
  // Future implementation:
  //   const user = await getCurrentUser();
  //   if (!user || user.role !== "ADMIN") throw new AdminForbiddenError();
  //   return { actor: user.id };
  return { actor: "demo" };
}

/** True when admin routes are unprotected. Used to render the warning banner. */
export const ADMIN_IS_OPEN = true;
