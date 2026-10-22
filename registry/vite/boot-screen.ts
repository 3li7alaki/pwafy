import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

/**
 * Fills index.html's boot screen at build time: every `%BOOT_BG%` becomes `background` (the same constant the
 * splash images and the manifest use, so opening the app is one colour end to end), and `<!--boot-logo-->`
 * becomes the logo's own markup, so it paints with the HTML instead of after a fetch (tashkeela: the splash was
 * #151A18, the app #040705, and the boot logo was a network request).
 *
 *   plugins: [bootScreen({ background, logo: fileURLToPath(new URL("./brand/logo.svg", import.meta.url)) }), ...]
 */
export function bootScreen({ background, logo }: { background: string; logo: string }): Plugin {
  // Ids get a prefix so the logo's gradients and clip paths cannot collide with any the app renders while the
  // boot screen is still up.
  const markup = readFileSync(logo, "utf8")
    .replace(/<\?xml[^>]*>/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(id="|url\(#|href="#)([\w-]+)/g, "$1boot-$2")
    .replace(/>\s+</g, "><")
    .trim();
  return {
    name: "pwafy-boot-screen",
    // pre: before Vite's own %ENV% pass, which would warn about an unknown %BOOT_BG%.
    transformIndexHtml: {
      order: "pre",
      handler: (html) => html.replaceAll("%BOOT_BG%", background).replace("<!--boot-logo-->", markup),
    },
  };
}
