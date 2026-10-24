# pwafy

> Make an installed web app feel like an app.

[![License: MIT](https://img.shields.io/badge/license-MIT-black)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-support-ff5e5b?logo=kofi&logoColor=white)](https://ko-fi.com/3li7alaki)

You add a manifest, tap "Add to Home Screen", and open it. It looks like a website wearing an
app icon. The nav sits at the top where no thumb reaches, pulling down rubber-bands the whole
page, the notch eats the header, and the share button does nothing on an iPhone because
something was awaited before it.

None of these are hard. Each one is a small trap you only learn by falling in, and then you
fall in again on the next app because the fix lives in the last repo. pwafy is where the fixes
live now: the pieces that make an app feel native, and the list of traps they defend against.

## Install

Nothing to install. pwafy is a [shadcn GitHub registry](https://ui.shadcn.com/docs/registry/github),
so you pull an item straight into your app:

```bash
npx shadcn add 3li7alaki/pwafy/tab-bar
```

The source lands in your app and your app owns it. There is no package to upgrade and nothing
changes under you: a fix here reaches your app only when you pull it again.

Works with React 19, Tailwind 4 and motion. Items render with your own shadcn primitives, so
they take your style instead of bringing one.

## What is in it

| item | what it does | state |
|---|---|---|
| `tab-bar` | bottom bar under the thumb, safe-area aware, animated active tab | ready |
| `pull-refresh` | pull to refresh, standalone mode only, never fighting the browser's | ready |
| `install` | install prompt that knows Android's native prompt from iOS's Share sheet steps | ready |
| `standalone` | `useStandalone()`, whether the app runs installed, safe in a server render | ready |
| `app-assets` | icons, favicon, maskable icon and every Apple splash from one logo and one background, painted first by `index.html` too | ready |
| `error-screen` | the router's error and not-found screen: offline, new version, not found or a bug, each with a way on | ready |
| `push` | knows if this phone can get push, asks once from a card, keeps the server's subscription current, shows pushes | beta, not yet seen on a real phone |
| `sheet` | bottom sheet on Base UI Drawer, drag to dismiss | planned |
| `update-prompt` | "new version ready" on top of vite-plugin-pwa's service worker | planned |
| `share` | `navigator.share` that survives Safari, with copy-link fallback | planned |
| `haptics` | a tick on iOS through the switch-control trick, silent where it fails | planned |
| `base` | safe areas, `overscroll-behavior`, `dvh`, tap highlight, text size adjust | planned |

Agents building any PWA, React or not, load [`skills/pwa/SKILL.md`](skills/pwa/SKILL.md): the
rules and every trap, each with the app it came from.

## The rules it will not bend

- **Your app owns the code.** Items are copied in, never imported. No two apps upgrade together.
- **Items take callbacks, never your data layer.** `onRefresh`, not a TanStack Query import.
- **Your look, not iOS's.** Native feel means the right gestures and measurements, not a clone
  of Settings.app.
- **Every trap names the app it bit.** A rule with no origin is a guess.
- **Feel is judged in the hand.** A human on a real phone decides, not a test suite.

## What it is not

- Not a framework. No router, no data layer, no app shell you adopt whole.
- Not a service worker. That is [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa).
- Not an iOS clone. That is [Konsta UI](https://github.com/konstaui/konsta), and it is good at it.

## More

- [AGENTS.md](AGENTS.md) is the contract for agents working on pwafy.
- [skills/pwa/SKILL.md](skills/pwa/SKILL.md) is the contract for agents using it.
- [docs/principles.md](docs/principles.md) covers the boundaries and the lessons.
- [docs/prior-art.md](docs/prior-art.md) is what already exists and what pwafy takes from it.

## Support

pwafy is free and MIT licensed, and there is no pricing page. If it saved one app from feeling
like a website in a costume, that is worth about the price of a coffee.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/3li7alaki)

Need something like this built for your own stack? Commissions are open at
[ko-fi.com/3li7alaki](https://ko-fi.com/3li7alaki).

## License

MIT. See [LICENSE](LICENSE).
