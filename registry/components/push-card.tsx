import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enablePush, ensurePushSubscription, usePushPermission } from "@/lib/push";

// Two weeks, like the install card: long enough not to nag, short enough that "later" comes round again.
const quietFor = 14 * 24 * 60 * 60 * 1000;

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode: forgotten after this visit, which only means asking or saving once more.
  }
}

type PushCardProps = {
  /** The server's VAPID public key. Empty or missing hides the card: a server without keys cannot send. */
  publicKey?: string;
  /** Saves the subscription on the server. Called again whenever this phone's subscription changes. */
  onSubscribe: (subscription: PushSubscriptionJSON) => Promise<void>;
  title?: string;
  pitch?: string;
  /** Prefix for the localStorage keys, so two apps on one origin keep separate state. */
  storageKey?: string;
};

/**
 * Asks once to turn notifications on, and keeps the server holding this phone's current subscription after
 * that. Shows nothing on an iPhone in a browser tab (the install card comes first) or once the answer is no.
 */
export function PushCard({
  publicKey, onSubscribe, title = "Turn on notifications", pitch = "Hear about it the moment something needs you.", storageKey = "pwafy",
}: PushCardProps) {
  const permission = usePushPermission();
  const [quiet, setQuiet] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const saved = `${storageKey}:push-endpoint`;

  // Storage after mount, never in a state initializer: React #418 on a server render (barada).
  useEffect(() => {
    setQuiet(Date.now() - Number(read(`${storageKey}:push-dismissed`) ?? 0) < quietFor);
  }, [storageKey]);

  // Allowed already: make sure the server has this phone's subscription. Browsers drop and renew them, and a
  // permission given in the settings app never came through the card.
  useEffect(() => {
    if (permission !== "granted" || !publicKey) return;
    let live = true;
    ensurePushSubscription(publicKey)
      .then(async (subscription) => {
        if (!live || subscription.endpoint === read(saved)) return;
        await onSubscribe(subscription);
        write(saved, subscription.endpoint ?? "");
      })
      .catch(() => {
        // Offline or no worker: the next open tries again.
      });
    return () => {
      live = false;
    };
  }, [permission, publicKey, onSubscribe, saved]);

  if (permission !== "ask" || !publicKey || quiet) return null;

  const later = () => {
    write(`${storageKey}:push-dismissed`, String(Date.now()));
    setQuiet(true);
  };
  // enablePush runs first in the tap, with nothing awaited before it, or Safari shows no permission sheet.
  const turnOn = () => {
    setBusy(true);
    setFailed(false);
    enablePush(publicKey)
      .then(async (subscription) => {
        if (!subscription) return;
        await onSubscribe(subscription);
        write(saved, subscription.endpoint ?? "");
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  return (
    <section aria-label={title} className="relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <button type="button" onClick={later} aria-label="Not now" className="absolute top-2 right-2 grid size-10 place-items-center rounded-full text-muted-foreground active:scale-90">
        <X aria-hidden strokeWidth={2} className="size-5" />
      </button>
      <div className="flex items-center gap-3 pr-8">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Bell aria-hidden strokeWidth={2} className="size-5" />
        </div>
        <div className="flex flex-col">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{pitch}</p>
        </div>
      </div>
      {failed && <p role="alert" className="text-sm text-destructive">Couldn't turn them on. Check your connection and try again.</p>}
      <Button className="h-11 rounded-xl text-base font-semibold" disabled={busy} onClick={turnOn}>Turn on notifications</Button>
    </section>
  );
}
