import { useSyncExternalStore } from "react";
import { isStandalone } from "@/lib/standalone";

/**
 * Where this phone stands on notifications. The card acts on one of:
 * - "unsupported": no web push here (an in-app browser, an old Safari, a desktop without a service worker).
 * - "install-first": iOS or iPadOS in a browser tab. Push works only from the home screen (iOS 16.4 and later),
 *   and the tab hides PushManager altogether, so the install card comes first.
 * - "ask": never asked. One tap asks.
 * - "granted": allowed. The app still makes sure it holds a subscription, since a browser can drop one.
 * - "denied": refused. Asking again does nothing; only the phone's settings undo it.
 */
export type PushPermission = "unsupported" | "install-first" | "ask" | "granted" | "denied";

export function pushPermission(env: {
  userAgent: string; maxTouchPoints: number; standalone: boolean; hasPush: boolean; permission?: NotificationPermission;
}): PushPermission {
  // iPadOS reports a Mac user agent; touch points tell them apart (lib/install.ts).
  const ios = /iPhone|iPad|iPod/.test(env.userAgent) || (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1);
  if (!env.hasPush || !env.permission) return ios && !env.standalone ? "install-first" : "unsupported";
  if (env.permission === "default") return "ask";
  return env.permission;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Coming back from the phone's settings is when a refusal can turn into an allow, or the reverse.
  document.addEventListener("visibilitychange", onChange);
  return () => {
    listeners.delete(onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function current(): PushPermission {
  const hasPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  return pushPermission({
    userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, standalone: isStandalone(),
    hasPush, permission: hasPush ? Notification.permission : undefined,
  });
}

/** pushPermission for render. The server snapshot is "unsupported", so a server render hydrates without #418. */
export function usePushPermission(): PushPermission {
  return useSyncExternalStore(subscribe, current, () => "unsupported");
}

/** A VAPID public key, base64url as servers print it, as the bytes PushManager wants. */
export function keyBytes(base64url: string) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (char) => char.charCodeAt(0));
}

/**
 * The active worker's registration. `ready` never settles when registration failed (private mode refuses it),
 * so this gives up after 10s, far past a real install on a slow phone, instead of leaving the tap spinning.
 */
function registration() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("No service worker, so no notifications.")), 10_000)),
  ]);
}

const sameKey = (a: ArrayBuffer | null, b: Uint8Array) => a !== null && a.byteLength === b.length && new Uint8Array(a).every((byte, i) => byte === b[i]);

/**
 * This phone's subscription, made if there is none. Needs permission already granted. A subscription made with
 * another key (the server rotated its keys) is replaced, since subscribe refuses a second key outright.
 */
export async function ensurePushSubscription(publicKey: string): Promise<PushSubscriptionJSON> {
  const worker = await registration();
  const key = keyBytes(publicKey);
  const existing = await worker.pushManager.getSubscription();
  if (existing && sameKey(existing.options.applicationServerKey, key)) return existing.toJSON();
  await existing?.unsubscribe();
  // userVisibleOnly: every push shows a notification. Chrome refuses anything else, and Safari revokes a site
  // that pushes without showing one.
  return (await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })).toJSON();
}

/**
 * Asks, then subscribes. Call it straight from the tap: Safari only shows the permission sheet for a user
 * gesture, so nothing may be awaited before requestPermission. Null when the person said no.
 */
export async function enablePush(publicKey: string): Promise<PushSubscriptionJSON | null> {
  const permission = await Notification.requestPermission();
  notify();
  if (permission !== "granted") return null;
  return ensurePushSubscription(publicKey);
}

/** Stops this phone's pushes at the browser. The server's copy dies on its next send (404 or 410). */
export async function disablePush() {
  try {
    await (await (await registration()).pushManager.getSubscription())?.unsubscribe();
  } catch {
    // No worker or no subscription: nothing to stop.
  }
}
