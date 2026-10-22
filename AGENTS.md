# pwafy: working in this repo

> Make an installed web app feel like an app.

This file is for agents working **on** pwafy. How another agent **uses** pwafy lives in
`skills/pwa/SKILL.md`. What pwafy is for, and what it refuses to become, is
`docs/principles.md`. Read that before adding anything.

*Draft written by Claude on 2026-10-22 for the owner to edit. It is the owner's file from
here on: agents propose changes to it, they do not make them.*

## One purpose

Make a web app installed on a phone feel native, and never relearn a pitfall. An item that is
not about how an installed app looks, moves, or survives the phone does not belong here.

## Layout

```text
registry.json         the catalog the shadcn CLI reads from GitHub, no build step
registry/lib/         lib files, laid out as they land in an app (@/lib/*)
registry/components/  component files, same (@/components/*)
stubs/                typecheck stand-ins for the app's own shadcn button and cn, never shipped
checks/*.check.ts     one runnable check per piece of pure logic, node:assert, no framework
skills/pwa/SKILL.md   the rules and pitfalls, for any stack (human-owned)
docs/principles.md    the goal and the boundaries
```

## Check

```bash
pnpm install
pnpm typecheck        # tsc, strict, over registry/, stubs/ and checks/
pnpm check            # every checks/*.check.ts
```

Item files import exactly what the app will have (`@/lib/standalone`, `@/components/ui/button`),
so the CLI copies them unchanged. Items depend on each other by GitHub address
(`3li7alaki/pwafy/standalone`), which resolves only once the commit is pushed.

Feel is checked by a human on a real phone, through a consuming app: pull the item into it,
snap it with vision at 390 wide, then try it in the hand. No gesture test suite.

## Rules

- **Items take callbacks, never an app's data layer.** `onRefresh`, `items`, `onInstall`. An
  item that imports TanStack Query or a router is an item only one app can use.
- **Items use the app's shadcn primitives** through `@/components/ui/*` and list them in
  `registryDependencies`, so each app keeps its own style.
- **Every pitfall names its origin** (the app it bit) in the skill or in a comment where the
  code defends against it.
- **Reuse before writing.** vite-plugin-pwa for the service worker, Base UI Drawer for
  sheets, `curb audit` for mobile render checks. Never vaul: it is unmaintained.
- **Versions come from the registry**, never memory: `latest-version npm <pkg>`. Pins are exact.
- **Skills and this file are human-owned.** Agents draft; the owner edits and commits.
- No em or en dashes anywhere, code and copy included.
