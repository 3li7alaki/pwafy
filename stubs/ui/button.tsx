import type { ComponentProps } from "react";

/** Typecheck stand-in for the app's own shadcn Button, which items render with. Never shipped. */
export function Button({ variant: _variant, size: _size, ...props }: ComponentProps<"button"> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  return <button {...props} />;
}
