/** Typecheck stand-in for the app's shadcn `cn` (clsx plus tailwind-merge). Never shipped. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
