# pwafy: what it is for

## The goal

Every web app that lands on a phone home screen feels like an app on the first install: a
bottom bar under the thumb, pull to refresh, sheets that drag, safe areas respected, and none
of the Safari traps we already fell into once.

## How it ships

pwafy is a [shadcn GitHub registry](https://ui.shadcn.com/docs/registry/github). An app pulls
an item with `npx shadcn add 3li7alaki/pwafy/<item>`, the source lands in the app, and from
then on the app owns it.

There is no npm package and no runtime dependency on this repository. A fix here reaches an app
only when someone pulls it again, on purpose. That is the trade: no app is ever broken by
pwafy changing under it, and no two apps are forced to upgrade together.

## What lives where

- **Items** (`registry/`): code that has to feel right in the hand. Tab bar, pull to refresh,
  install prompt, sheet, update prompt, share, haptics, base CSS.
- **The skill** (`skills/pwa/SKILL.md`): the rules and pitfalls, for any stack, including apps
  that cannot take a React item (vision's gallery is one HTML file).
- **Somebody else's tool**: anything already done well.
  - `vite-plugin-pwa` writes the service worker and manifest.
  - Base UI's Drawer is the sheet.

  pwafy calls these, never rewrites them.

## Who it is for

Apps built on React 19, Tailwind 4 and motion. Items render with the app's own shadcn
primitives (`@/components/ui/button`), so they take the app's style, base-nova or new-york,
without a fork. An item never imports the app's data layer: it takes a callback
(`onRefresh`, `items`) and the app wires its own.

## What pwafy is not

- **Not a framework.** No router, no data layer, no design system, no app shell you must
  adopt whole.
- **Not an iOS clone.** Konsta UI copies stock iOS pixel for pixel. pwafy borrows its
  measurements and keeps each app's own look.
- **Not the serving layer.** Putting an app on the phone over the tailnet is box setup and
  lives in dotfiles.
- **Not a test suite for feel.** Whether a gesture feels native is judged by a human on a
  real phone. Code checks stop at the type checker.

## Lessons it encodes

Each one came from a real app and becomes a rule in the skill or code in an item:

- Safari drops the share sheet when anything is awaited before `navigator.share`. Share runs
  inside the tap; a link that needs a fetch first takes a second tap. (tashkeela)
- Native pull to refresh fights a custom one. `overscroll-behavior: none` on `html`, and the
  custom one runs only in standalone mode. (barada)
- Safari suspends sockets in background tabs and every event in the gap is lost. Reconnect on
  `visibilitychange`, then resync, because reconnecting alone heals nothing. (barada)
- iOS keeps a home-screen app's storage apart from Safari's. A login or pairing done in Safari
  does not exist in the installed app. (collie)
- Agent-driven Chrome tabs are `document.hidden`, so motion stalls and screenshots show
  half-finished animations. Measure the DOM instead. (tashkeela)
