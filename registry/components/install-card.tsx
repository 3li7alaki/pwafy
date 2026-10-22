import { useEffect, useState } from "react";
import { Copy, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promptInstall, useInstallPath } from "@/lib/install";

// Two weeks: long enough not to nag, short enough that someone who meant "later" sees it again.
const quietFor = 14 * 24 * 60 * 60 * 1000;

/**
 * Counts days the app was opened in a browser, once per day. The card waits for the second, so a first look at
 * a shared link is never interrupted by an install pitch. (tashkeela)
 */
function returning(key: string) {
  try {
    const today = new Date().toDateString();
    const [count = 0, last = ""] = JSON.parse(localStorage.getItem(`${key}:visits`) ?? "[]") as [number?, string?];
    const next = last === today ? count : count + 1;
    localStorage.setItem(`${key}:visits`, JSON.stringify([next, today]));
    return next >= 2;
  } catch {
    return false;
  }
}

function quiet(key: string) {
  try {
    return Date.now() - Number(localStorage.getItem(`${key}:install-dismissed`) ?? 0) < quietFor;
  } catch {
    return false;
  }
}

type InstallCardProps = {
  /** The app's name, as it will read under the home screen icon. */
  name: string;
  /** The app icon, shown at 44px with iOS's corner radius. */
  icon: string;
  pitch?: string;
  /** Prefix for the localStorage keys, so two apps on one origin keep separate counts. */
  storageKey?: string;
};

/** "Add to home screen", in whatever form this browser supports (lib/install.ts). */
export function InstallCard({ name, icon, pitch = "Opens full screen like an app, and loads instantly.", storageKey = "pwafy" }: InstallCardProps) {
  const path = useInstallPath();
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  // Storage is read after mount. In a state initializer it differs between the server render and the first client
  // render, and React throws #418 and repaints the page. (barada)
  useEffect(() => {
    setShow(returning(storageKey) && !quiet(storageKey));
  }, [storageKey]);
  if (!show || path === "none") return null;

  const later = () => {
    try {
      localStorage.setItem(`${storageKey}:install-dismissed`, String(Date.now()));
    } catch {
      // Private mode: hidden for this visit only.
    }
    setShow(false);
  };
  const install = async () => {
    if (await promptInstall()) setShow(false);
  };
  const copyLink = () => navigator.clipboard.writeText(window.location.href).then(() => setCopied(true), () => setCopied(false));

  return (
    <section aria-label={`Add ${name} to your home screen`} className="relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <button type="button" onClick={later} aria-label="Not now" className="absolute top-2 right-2 grid size-10 place-items-center rounded-full text-muted-foreground active:scale-90">
        <X aria-hidden strokeWidth={2} className="size-5" />
      </button>
      <div className="flex items-center gap-3 pr-8">
        <img src={icon} alt="" className="size-11 shrink-0 rounded-[22.27%]" />
        <div className="flex flex-col">
          <h2 className="font-semibold">Add {name} to your home screen</h2>
          <p className="text-sm text-muted-foreground">{pitch}</p>
        </div>
      </div>
      {path === "prompt" && (
        <Button className="h-11 rounded-xl text-base font-semibold" onClick={() => void install()}>Install</Button>
      )}
      {path === "ios" && (
        <ol className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2">
            <Step n={1} />
            Tap <Share aria-label="Share" strokeWidth={2} className="size-4 text-foreground" /> Share in the browser bar
          </li>
          <li className="flex items-center gap-2">
            <Step n={2} />
            Choose <SquarePlus aria-hidden strokeWidth={2} className="size-4 text-foreground" /> <span className="font-semibold">Add to Home Screen</span>
          </li>
        </ol>
      )}
      {path === "in-app" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">This app's browser can't install it. Open the link in Safari or Chrome first, from the menu or by pasting it.</p>
          <Button variant="secondary" className="h-11 rounded-xl text-base" onClick={() => void copyLink()}>
            <Copy aria-hidden strokeWidth={2} />
            {copied ? "Copied. Paste it in Safari or Chrome." : "Copy link"}
          </Button>
        </div>
      )}
    </section>
  );
}

function Step({ n }: { n: number }) {
  return <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary tabular-nums">{n}</span>;
}
