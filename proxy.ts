import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE, signDeviceId, verifyDeviceCookie } from "@/lib/session/cookie";

/**
 * Ensures every request carries a valid signed device cookie. The user row
 * itself is created lazily by `getCurrentUser()` so this never touches the DB.
 */
export async function proxy(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Misconfigured deployment: let the page render and surface the error.
    return NextResponse.next();
  }

  const existing = request.cookies.get(DEVICE_COOKIE)?.value;
  if (existing && (await verifyDeviceCookie(existing, secret))) {
    return NextResponse.next();
  }

  const value = await signDeviceId(crypto.randomUUID(), secret);

  // Forward the new cookie to this same request so server components and
  // route handlers see it on the very first visit.
  const headers = new Headers(request.headers);
  const cookieHeader = headers.get("cookie");
  headers.set("cookie", cookieHeader ? `${cookieHeader}; ${DEVICE_COOKIE}=${value}` : `${DEVICE_COOKIE}=${value}`);

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set({
    name: DEVICE_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, the service worker and PWA files.
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|robots.txt).*)",
  ],
};
