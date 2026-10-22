# Prior art

What already exists for making a web app feel native on a phone, researched 2026-10-22. Re-check
activity before depending on anything here: steal the idea, not the dependency.

## The gap

No shadcn registry found ships a tab bar, pull to refresh, install prompt and service worker
update prompt together. Registries like shadcnstore cover dashboards and landing pages; mobile
app primitives are missing.

## Used

- **[vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa)**: active (pushed
  2026-10-09). Writes the service worker and manifest. pwafy's update prompt sits on its
  `virtual:pwa-register` hook instead of a hand-rolled service worker.
- **Base UI Drawer**: ships in `@base-ui/react` 1.9.0, already in tashkeela and barada. The
  `sheet` item is built on it.

## Borrowed from, not depended on

- **[Konsta UI](https://github.com/konstaui/konsta)**: active (v5.5.0, 2026-09-28). Pixel
  perfect iOS and Material components on Tailwind, for React, Vue and Svelte. Adopting it makes
  every app look like stock iOS and fights shadcn styling. Its measurements (tab bar height,
  hairlines, press states) are the reference for ours.
- **[pwa-install](https://github.com/khmyznikov/pwa-install)**: active (pushed 2026-09-14). An
  install dialog web component. Its matrix of which browser installs how is the reference for
  the `install` item; the card itself stays in each app's own look.
- **[ios-haptics](https://npmjs.com/package/ios-haptics)**: clicks a hidden label for an
  `<input type="checkbox" switch>`, and Safari answers with a haptic tick. Undocumented side
  effect of the switch control (Safari 17.4). One source says iOS 26.5 patched it, unconfirmed.
  The `haptics` item ships it as optional and silent on failure.
- **[ShowMyMoney PR #10](https://github.com/ghostface2232/ShowMyMoney/pull/10)**: an iOS-styled
  web app with a silent refresh after returning from background, and sheets that do not
  auto-focus a field on touch devices.

## Ruled out

- **[vaul](https://github.com/emilkowalski/vaul)**: the drawer under shadcn's own Drawer. Its
  README says "This repo is unmaintained."
- **Framework7, Ionic**: whole frameworks with their own router and app shell. Wrong layer.
- **[Silk](https://github.com/silk-hq/silk)**: native-feeling sheets, advanced examples behind a
  commercial license.
- **tailwindcss-safe-area**: Tailwind 4 does it with `env()` in arbitrary values, one line each.
