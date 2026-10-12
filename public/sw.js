// @ts-check
/// <reference lib="webworker" />

// Hand-written service worker for the CAi PWA.
// Responsibilities: receive Web Push messages and open the app on click.
// It deliberately has NO caching / offline logic (see docs/DECISIONS.md). If
// offline support is wanted later, Serwist can be layered on top of this file.

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

const DEFAULT_ICON = "/icons/icon-192.png";
const DEFAULT_BADGE = "/icons/badge-96.png";

sw.addEventListener("install", () => {
  sw.skipWaiting();
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim());
});

/**
 * @typedef {Object} PushPayload
 * @property {string} [title]
 * @property {string} [body]
 * @property {string} [url]
 * @property {string} [tag]
 * @property {string} [icon]
 */

/**
 * @param {PushEvent} event
 * @returns {PushPayload}
 */
function readPayload(event) {
  /** @type {PushPayload} */
  const fallback = { title: "CAi", body: "Tienes una novedad en la app del CAi.", url: "/" };
  if (!event.data) return fallback;
  try {
    const json = event.data.json();
    return typeof json === "object" && json !== null ? { ...fallback, ...json } : fallback;
  } catch {
    try {
      return { ...fallback, body: event.data.text() || fallback.body };
    } catch {
      return fallback;
    }
  }
}

sw.addEventListener("push", (event) => {
  const payload = readPayload(event);
  // IMPORTANT: every push MUST end with a visible notification. iOS revokes the
  // subscription when a push arrives and nothing is shown.
  const shown = sw.registration.showNotification(payload.title || "CAi", {
    body: payload.body,
    icon: payload.icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: payload.tag,
    data: { url: payload.url || "/" },
  });
  event.waitUntil(shown);
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", sw.location.origin).href;
  const focusOrOpen = sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (new URL(client.url).origin === sw.location.origin && "focus" in client) {
        if ("navigate" in client) {
          return client.navigate(target).then((c) => (c ? c.focus() : client.focus()));
        }
        return client.focus();
      }
    }
    return sw.clients.openWindow(target);
  });
  event.waitUntil(focusOrOpen);
});
