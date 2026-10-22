---
name: pwa
description: Make a web app feel native once it is installed on a phone. Use when building or changing a PWA, an app meant for "Add to Home Screen", a mobile web shell with a bottom tab bar, pull to refresh, bottom sheets, an install prompt, or a service worker update flow; when a mobile web bug smells like Safari or iOS (share sheet does nothing, header under the notch, page rubber-bands, sounds silent, socket dead after backgrounding); and before calling any mobile web UI done.
---

# pwa

*Draft written by Claude on 2026-10-22 for the owner to edit. It is the owner's file from here
on: agents propose changes to it, they do not make them.*

An installed web app gets judged against the native apps next to it on the home screen. Every
trap below bit a real app once. Each one names that app, so you can read how it was fixed.

## Pull the pieces, do not rewrite them

React 19, Tailwind 4 and motion apps pull items from the pwafy registry. The source lands in the
app and the app owns it:

```bash
npx shadcn add 3li7alaki/pwafy/tab-bar
```

| item | reach for it when | wiring |
|---|---|---|
| `tab-bar` | the app has 2 to 5 top-level screens | your router's `Link` with `className={tabBarItem}`, `TabBarIcon` inside, view transitions off |
| `pull-refresh` | a screen shows server data that can go stale | `onRefresh` returns the refetch promise; installed apps only unless `enabled` |
| `install` | people should keep coming back | `captureInstallPrompt()` in the client entry, before React mounts |
| `standalone` | anything should differ between a tab and the installed app | `useStandalone()` in render, never `matchMedia` in a state initializer |

An app that cannot take a React item (vision's gallery is one HTML file) still follows every
rule below, and ports the item's logic by hand.

## New app checklist

1. `vite-plugin-pwa` writes the service worker and manifest, and `@vite-pwa/assets-generator`
   makes the icons. Never hand-roll either. (tashkeela)
2. Call `captureInstallPrompt()` and `navigator.storage?.persist()` before React mounts. The
   first is caught once or never; the second keeps the installed app's data from eviction.
   (tashkeela)
3. Pull `tab-bar`, `pull-refresh` and `install`, and set `overscroll-behavior: none` and
   `touch-action: manipulation` on `body`.
4. Run `curb audit <url>`. It measures tap targets, input zoom, viewport units and overflow
   at phone width, so this skill does not repeat those rules.
5. Install it on a real iPhone and a real Android before calling it done. A desktop browser in
   device mode has no home screen, no notch and no Safari.

## Layout traps

- **`dvh`, never `h-screen` or `100vh`.** Safari's `100vh` is taller than the visible page, so
  the bottom of the screen sits under the toolbar. (barada)
- **Safe-area padding goes on the header, not on `body`.** The header's background then runs
  under the status bar and Dynamic Island while its content stays below them. (barada)
- **Toasts float above the tab bar, never on it.** `:root:has([data-tab-bar])` raises the toast
  offset by the bar's height. `TabBar` sets `data-tab-bar` for exactly this. (tashkeela)
- **Never `transition-all`.** Safari evaluates every animatable property and stutters. Name the
  properties. (barada)
- **No `will-change` on decoration.** Each one is a compositor layer, and on mobile Safari they
  cost scroll smoothness. (barada)

## Gesture and navigation traps

- **The browser's pull fights yours.** `overscroll-behavior: none` on `body`, and the custom
  pull to refresh only where it is on. (tashkeela, barada)
- **An edge swipe back already animates.** Skip the router's view transition when `popstate`
  reports `hasUAVisualTransition`, or the page plays twice. (tashkeela)
- **Back closes an open sheet.** Opening one pushes a same-URL history entry, and Back pops it.
  Turn scroll restoration on so Back lands where the list was. (tashkeela)
- **Tab switches skip view transitions.** A crossfade leaves the old pill fading in place while
  the new one glides. (tashkeela)
- **Never the HTML5 drag API.** It has no touch support. Use dnd-kit with `touch-none` on the
  draggable items. (barada)

## Safari and iOS traps

- **`navigator.share` runs inside the tap, with no `await` before it.** Safari silently drops
  the share sheet otherwise. A link that needs a fetch first takes a second tap. (tashkeela)
- **Audio needs a gesture first.** iOS keeps `AudioContext` locked until a touch, so unlock or
  preload sounds on the first `touchstart`. (barada)
- **iOS has no `navigator.vibrate`.** It is a silent no-op there. The `haptics` item, when it
  lands, uses an undocumented switch-control trick that may already be patched.
- **Base UI's iOS drawer backdrop needs a positioned `body`.** Set
  `document.body.style.position = "relative"` before mounting. (tashkeela)
- **Read the browser after mount, or through `useSyncExternalStore`.** A user agent or
  `matchMedia` test in a state initializer differs between the server render and hydration, and
  React throws #418. (barada)

## Installed app traps

- **Home-screen storage is not Safari's.** A login or a pairing done in Safari does not exist in
  the installed app. Do it inside the installed app. (collie)
- **A resumed app never checks for a new build.** Browsers check on a real page load only. Call
  `registration.update()` on `visibilitychange` when visible and online. (tashkeela)
- **Only prompt for an update found mid-session.** One found in the first seconds after load
  is a deploy that landed before the visit; it activates on the next load without a word.
  (barada)
- **The service worker never intercepts navigations or API calls.** A cached redirect loops
  forever. A failed registration is a warning, not an error: private mode refuses it. (barada)
- **Sockets die in the background.** Reconnect on `visibilitychange`, then resync, because every
  event sent during the gap is gone. (barada)

## Checking it

- **Agent-driven Chrome tabs are `document.hidden`.** Motion stalls, so screenshots show faded
  lists and half-slid toasts. Measure the DOM instead of trusting the picture. (tashkeela)
- **Snap it with vision at 390 wide**, then hand it to a human. Feel is judged in the hand.
- **Chrome caches favicons hard.** An old icon after regenerating assets is the cache, not the
  build. (tashkeela)
- **Maskable icons keep their markings inside the safe zone**, or Android crops them into a
  circle. (tashkeela)
