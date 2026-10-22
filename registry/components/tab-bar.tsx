import type { ComponentType, ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// tashkeela's micro spring, so the pill glides rather than snaps between tabs.
const pillSpring = { type: "spring", stiffness: 200, damping: 25, mass: 0.6 } as const;

/**
 * A floating bar under the thumb. Router agnostic: each child is the app's own link, holding a TabBarIcon.
 *
 * ```tsx
 * <TabBar>
 *   <Link to="/" className={tabBarItem} viewTransition={false} activeOptions={{ exact: true }}>
 *     {({ isActive }) => <TabBarIcon icon={House} label="Home" active={isActive} />}
 *   </Link>
 * </TabBar>
 * ```
 *
 * Turn view transitions off on tab links: a tab switches instantly like a native one, and a page crossfade
 * leaves the old pill fading in place while the new one glides, two pills for a beat. (tashkeela)
 */
export function TabBar({ label = "Main", className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <nav
      aria-label={label}
      data-tab-bar
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/70 p-1.5 shadow-[0_8px_32px_oklch(0%_0_0/0.35)] backdrop-blur-xl backdrop-saturate-150",
          className,
        )}
      >
        {children}
      </div>
    </nav>
  );
}

/** Classes for each tab's link: a 48px target, over Apple's 44, that dips when pressed. */
export const tabBarItem =
  "relative grid size-12 place-items-center rounded-full text-muted-foreground transition-[color,transform] duration-150 active:scale-90";

type Icon = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;

/** What goes inside a tab's link. `pill` names the shared layout, so two bars on one page need two names. */
export function TabBarIcon({ icon: Icon, label, active, badge, pill = "tab-bar-pill" }: {
  icon: Icon;
  label: string;
  active: boolean;
  badge?: ReactNode;
  pill?: string;
}) {
  return (
    <>
      {active && <motion.span layoutId={pill} transition={pillSpring} className="absolute inset-0 rounded-full bg-accent" />}
      <Icon aria-hidden strokeWidth={2} className={cn("relative size-[22px]", active && "text-primary")} />
      <span className="sr-only">{label}</span>
      {badge}
    </>
  );
}

/** A dot on a tab while something waits there. `label` is what a screen reader hears instead. */
export function TabBarDot({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
      <span className="sr-only">{label}</span>
    </>
  );
}
