import { useSyncExternalStore } from "react";

/** True when the app runs from the home screen rather than a browser tab. Older iOS only sets navigator.standalone. */
export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Display mode is fixed for the life of the document, so there is nothing to subscribe to.
const never = () => () => {};

/**
 * isStandalone for render. The server snapshot is false, so a server-rendered first paint and the hydration
 * render agree. Reading the browser in a state initializer instead made them differ and threw React #418 (barada).
 */
export function useStandalone() {
  return useSyncExternalStore(never, isStandalone, () => false);
}
