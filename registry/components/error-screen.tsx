import { useState } from "react";
import { Bug, Copy, House, RefreshCw, RotateCw, SearchX, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorDetails, errorKind, type ErrorKind } from "@/lib/errors";

type ErrorScreenProps = {
  /** What was thrown. Leave it out with kind "missing" for an unknown URL. */
  error?: unknown;
  /** Forces the kind, for a not-found route. Otherwise errorKind decides from the error. */
  kind?: ErrorKind;
  /** Re-runs what failed: the router's reset, plus a reload of its data. Left out, Try again reloads the page. */
  onRetry?: () => void;
  /** Leaves for the first screen. The installed app has no address bar, so this is the only way out. */
  onHome: () => void;
  homeLabel?: string;
  /** Who the copied details go to, as the person would say it. */
  reportTo?: string;
  /** Build id for the copied details, so a report names the deploy it came from. */
  build?: string;
};

const copy: Record<ErrorKind, { icon: LucideIcon; title: string; body: string }> = {
  offline: { icon: WifiOff, title: "You're offline", body: "This screen needs a connection to load. Try again once you have signal." },
  update: { icon: RefreshCw, title: "There's a new version", body: "The app was updated while it was open, and this screen needs the new one. Reload to get it." },
  missing: { icon: SearchX, title: "This page isn't here", body: "The link may be old, or what it pointed to was removed." },
  broken: { icon: Bug, title: "This screen broke", body: "That's a bug, not something you did. Try again, and if it keeps happening, send the details to {reportTo}." },
};

/** A full screen for a route that threw or a URL that matches nothing: what happened, and a way on. */
export function ErrorScreen({ error, kind: forced, onRetry, onHome, homeLabel = "Go home", reportTo = "whoever runs the app", build }: ErrorScreenProps) {
  const [copied, setCopied] = useState(false);
  const kind = forced ?? errorKind(error, navigator.onLine);
  const { icon: Icon, title, body } = copy[kind];
  const message = error instanceof Error ? error.message : error === undefined ? "" : String(error);
  const reload = () => window.location.reload();
  const copyDetails = () => {
    const text = errorDetails(error, { url: window.location.href, build, userAgent: navigator.userAgent, at: new Date() });
    navigator.clipboard.writeText(text).then(() => setCopied(true), () => setCopied(false));
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
          <Icon aria-hidden strokeWidth={2} className="size-6" />
        </div>
        <h1 className="text-[1.3125rem]">{title}</h1>
        <p className="max-w-[32ch] text-muted-foreground">{body.replace("{reportTo}", reportTo)}</p>
        {kind === "broken" && message && (
          <p className="max-w-full rounded-xl bg-card px-3 py-2 font-mono text-xs break-words text-muted-foreground">{message}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {kind === "update" && (
          <Button className="h-12 w-full text-base" onClick={reload}>
            <RotateCw aria-hidden strokeWidth={2} />
            Reload the app
          </Button>
        )}
        {(kind === "offline" || kind === "broken") && (
          <Button className="h-12 w-full text-base" onClick={onRetry ?? reload}>
            <RotateCw aria-hidden strokeWidth={2} />
            Try again
          </Button>
        )}
        {kind === "broken" && (
          <Button variant="secondary" className="h-12 w-full text-base" onClick={copyDetails}>
            <Copy aria-hidden strokeWidth={2} />
            {copied ? "Copied. Paste it in a message." : "Copy error details"}
          </Button>
        )}
        <Button variant={kind === "missing" ? "default" : "ghost"} className="h-12 w-full text-base" onClick={onHome}>
          <House aria-hidden strokeWidth={2} />
          {homeLabel}
        </Button>
      </div>
    </main>
  );
}
