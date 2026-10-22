import { useSyncExternalStore } from "react";
import { isStandalone } from "@/lib/standalone";

/**
 * Getting the app onto the home screen. Each browser does it differently, so the card picks one of:
 * - "prompt": Chromium fired beforeinstallprompt, so one tap opens the native install sheet.
 * - "ios": Safari (or another iOS browser, which all share its Add to Home Screen since iOS 16.4) has no API,
 *   so the card shows the two taps.
 * - "in-app": an app's built-in browser (Instagram, Facebook, Snapchat, TikTok, Line) cannot install at all,
 *   so the card says to open the link in the real browser first.
 * - "none": installed already, or a browser with no path we can describe (desktop, Firefox on Android).
 */
export type InstallPath = "prompt" | "ios" | "in-app" | "none";

// UA markers for in-app browsers; WhatsApp opens links in the system browser view, which can share out to Safari.
const inApp = /FBAN|FBAV|Instagram|Snapchat|musical_ly|BytedanceWebview|Line\//i;

export function installPath(env: { userAgent: string; maxTouchPoints: number; standalone: boolean; canPrompt: boolean }): InstallPath {
  if (env.standalone) return "none";
  if (inApp.test(env.userAgent)) return "in-app";
  if (env.canPrompt) return "prompt";
  // iPadOS reports a Mac user agent; touch points tell them apart.
  const ios = /iPhone|iPad|iPod/.test(env.userAgent) || (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1);
  return ios ? "ios" : "none";
}

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: PromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Call once in the client entry, before React mounts: Chromium fires beforeinstallprompt early and only once. */
export function captureInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser's own mini-infobar away so the card is the one place install is offered.
    event.preventDefault();
    deferred = event as PromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    notify();
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => void listeners.delete(onChange);
}

function current(): InstallPath {
  if (installed) return "none";
  return installPath({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, standalone: isStandalone(), canPrompt: deferred !== null });
}

/**
 * The install path for this browser right now, re-rendering when Chromium hands over its prompt. The server
 * snapshot is "none", so server-rendered apps hydrate without a mismatch (barada, React #418).
 */
export function useInstallPath(): InstallPath {
  return useSyncExternalStore(subscribe, current, () => "none");
}

/** Opens Chromium's install sheet; the event is single use, so it is dropped either way. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  deferred = null;
  notify();
  try {
    await event.prompt();
    return (await event.userChoice).outcome === "accepted";
  } catch {
    // The browser refuses when the gesture expired or the engine declines. Nothing is broken; no sheet this time. (barada)
    return false;
  }
}
