import { useLayoutEffect } from "react";

/**
 * The boot screen (index.html #boot, outside #root) stays up until the first real screen is there, so opening
 * the app goes splash, logo, app, with nothing in between. Inside #root, React's first render replaced it with
 * whatever came first: an empty route while its code-split chunk loaded, or a blank loading placeholder. That
 * gap was the flash between the splash and the app (tashkeela).
 *
 * It goes once the app says its first screen rendered (`bootReady`) and nothing still holds it (a screen that
 * is only a loading placeholder holds it). Holds are counted on the next frame, after the commit's layout
 * effects, so a placeholder that mounts in the same render as the route still counts.
 */
export function createBoot(hide: () => void, nextFrame: (fn: () => void) => void) {
  let holds = 0;
  let ready = false;
  let gone = false;
  const check = () => {
    if (gone || !ready || holds > 0) return;
    gone = true;
    hide();
  };
  return {
    ready() {
      ready = true;
      nextFrame(check);
    },
    hold() {
      holds++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        holds--;
        nextFrame(check);
      };
    },
  };
}

function hideBootScreen() {
  const boot = document.getElementById("boot");
  if (!boot) return;
  boot.classList.add("out");
  // transitionend never fires with reduced motion (no transition), so a timer removes it either way.
  setTimeout(() => boot.remove(), 300);
}

const boot = createBoot(hideBootScreen, (fn) => requestAnimationFrame(fn));

/**
 * Call once from the client entry, before React mounts. A boot screen must never outlive a broken start: a
 * chunk that fails to load would otherwise leave the logo up forever over the error, so it goes after 10s
 * regardless, past any real cold start on 3G.
 */
export function startBoot() {
  setTimeout(hideBootScreen, 10_000);
}

/** The first screen has rendered. Wire it to your router, e.g. TanStack Router's first `onRendered` event. */
export function bootReady() {
  boot.ready();
}

/** Keeps the boot screen up while `active`, for a screen that would only show a loading placeholder. */
export function useBootHold(active: boolean) {
  useLayoutEffect(() => (active ? boot.hold() : undefined), [active]);
}
