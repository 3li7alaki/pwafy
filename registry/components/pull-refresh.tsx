import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { LoaderCircle } from "lucide-react";
import { useStandalone } from "@/lib/standalone";
import { cn } from "@/lib/utils";

// Travel of the circle in px, after resistance. Android's SwipeRefreshLayout (WhatsApp) fires at 64dp and
// parks the spinner there; past it the pull stiffens and stops 72px further down.
const trigger = 64;
const size = 40;
// ease-out-quart at the base duration; exits run at about 75% of it.
const ease = [0.25, 1, 0.5, 1] as const;
// Keeps a full turn on screen when the server answers in 50ms, so the refresh reads as having happened.
const minSpin = 600;

/** Free at first, stiffer the further you pull, never past `dimension`. */
function rubberBand(distance: number, dimension: number) {
  return (1 - 1 / ((distance * 0.55) / dimension + 1)) * dimension;
}

type PullToRefreshProps = {
  /** Refetch what the screen shows. The circle spins until it settles. */
  onRefresh: () => Promise<unknown>;
  /** Runs instead of onRefresh when the pull lands offline, for example to toast. */
  onOffline?: () => void;
  /**
   * Defaults to installed apps only, which get no native pull to refresh on iOS or Android. Pass true to run in
   * a browser tab too; the page then needs `overscroll-behavior: none` so the browser's own pull stays out.
   */
  enabled?: boolean;
  /** What turns inside the circle. A spinner by default; tashkeela spins a football. */
  children?: ReactNode;
  className?: string;
};

/**
 * Pull down at the top of a screen to refresh, the way WhatsApp does: the page stays put, a circle slides down
 * with the finger, and letting go past the mark refreshes. Render it once, near the root. (tashkeela)
 */
export function PullToRefresh({ onRefresh, onOffline, enabled, children, className }: PullToRefreshProps) {
  const standalone = useStandalone();
  const on = enabled ?? standalone;
  const travel = useMotionValue(0);
  const shrink = useMotionValue(1);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);
  // The listeners bind once per enable, so they read the latest callbacks through a ref.
  const latest = useRef({ onRefresh, onOffline });
  useEffect(() => {
    latest.current = { onRefresh, onOffline };
  });
  const y = useTransform(travel, (value) => value - size);
  const opacity = useTransform(travel, [0, trigger * 0.4], [0, 1]);
  const pullScale = useTransform(travel, [0, trigger], [0.7, 1]);
  const scale = useTransform(() => pullScale.get() * shrink.get());
  const rotate = useTransform(travel, (value) => value * 5);

  useEffect(() => {
    if (!on) return;
    let start: { x: number; y: number } | null = null;
    let pulling = false;
    let armed = false;

    const back = () => void animate(travel, 0, { duration: 0.21, ease });

    const refresh = async () => {
      busy.current = true;
      setRefreshing(true);
      animate(travel, trigger, { duration: 0.28, ease });
      try {
        await Promise.all([latest.current.onRefresh(), new Promise((done) => setTimeout(done, minSpin))]);
      } finally {
        // Android scales the circle away in place rather than sliding it back up.
        await animate(shrink, 0, { duration: 0.21, ease });
        travel.jump(0);
        shrink.jump(1);
        busy.current = false;
        setRefreshing(false);
      }
    };

    const onStart = (event: TouchEvent) => {
      start = null;
      if (busy.current || event.touches.length !== 1 || window.scrollY > 0) return;
      // An open sheet owns the gesture, and so does any list scrolled inside the page.
      if (document.querySelector("[role='dialog']") || scrolledAncestor(event.target as Element | null)) return;
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      pulling = false;
      armed = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!start) return;
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (!pulling) {
        // Sideways first (a carousel, a swipe deck) or upward is a scroll, not a pull.
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) return void (start = null);
        if (dy < 6) return;
        pulling = true;
        // Rebase so the circle starts from where the finger is, with no jump.
        start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      event.preventDefault();
      // Android's drag rate: the circle moves half as far as the finger, then stiffens past the mark.
      const drag = Math.max(0, event.touches[0].clientY - start.y) * 0.5;
      const distance = drag <= trigger ? drag : trigger + rubberBand(drag - trigger, 72);
      travel.set(distance);
      // Android only: iOS has no vibrate, the haptics item covers it.
      if (!armed && distance >= trigger) navigator.vibrate?.(8);
      armed = distance >= trigger;
    };

    const onEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) return;
      if (!start || !pulling) return void (start = null);
      start = null;
      if (!armed) return back();
      if (!navigator.onLine) {
        latest.current.onOffline?.();
        return back();
      }
      void refresh();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    // Not passive: preventDefault is what stops iOS scrolling the page while the circle follows the finger.
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [on, travel, shrink]);

  if (!on) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-40 flex justify-center">
      <motion.div
        style={{ y, opacity, scale }}
        className={cn("grid size-10 place-items-center rounded-full border border-border bg-background text-foreground shadow-[0_6px_20px_-6px_oklch(0%_0_0/0.6)]", className)}
      >
        <motion.div style={{ rotate }}>
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}
          >
            {children ?? <LoaderCircle strokeWidth={2.5} className="size-5" />}
          </motion.div>
        </motion.div>
      </motion.div>
      <span role="status" className="sr-only">{refreshing ? "Refreshing" : ""}</span>
    </div>
  );
}

function scrolledAncestor(element: Element | null) {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    if (node.scrollTop > 0) return true;
  }
  return false;
}
