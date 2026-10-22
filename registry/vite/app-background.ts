import type { Plugin } from "vite";

/**
 * Every `%APP_BG%` in index.html becomes `background`, the same constant the splash images and the manifest use,
 * so the launch is one colour end to end: `html { background: %APP_BG% }` paints it before the stylesheet loads,
 * and `<meta name="theme-color" content="%APP_BG%">` (tashkeela: the splash was #151A18, the app #040705).
 *
 *   plugins: [appBackground(background), ...]
 */
export function appBackground(background: string): Plugin {
  return {
    name: "pwafy-app-background",
    // pre: before Vite's own %ENV% pass, which would warn about an unknown %APP_BG%.
    transformIndexHtml: { order: "pre", handler: (html) => html.replaceAll("%APP_BG%", background) },
  };
}
