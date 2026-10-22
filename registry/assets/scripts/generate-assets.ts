// Icons, favicon, maskable icon and every Apple splash screen from one logo and one background colour
// (pwa-assets.config.ts). Run from the app root after the logo changes: `bun scripts/generate-assets.ts`.
// Writes public/ and the links in index.html between <!-- pwa-assets:start --> and <!-- pwa-assets:end -->.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { generateAssets } from "@vite-pwa/assets-generator/api/generate-assets";
import { generateHtmlMarkup } from "@vite-pwa/assets-generator/api/generate-html-markup";
import { instructions } from "@vite-pwa/assets-generator/api/instructions";
import { logo as logoPath, preset } from "../pwa-assets.config";

// A smaller cut of the logo for tab-sized icons, relative to the app root, or the logo itself.
const faviconPath = logoPath;
// The corner wherever the logo shows unmasked (splash screens, plain icons, favicon). 114/512 is within 0.1%
// of the iOS icon mask, so the splash tile matches the icon on the home screen (tashkeela).
const TILE_CORNER = 114 / 512;

const root = new URL("../", import.meta.url);
const publicDir = fileURLToPath(new URL("public/", root));
await mkdir(publicDir, { recursive: true });

const logo = await readFile(new URL(logoPath, root), "utf8");
const box = logo.match(/viewBox="([^"]+)"/)?.[1].split(/[\s,]+/).map(Number);
if (!box || box.length !== 4 || box.some(Number.isNaN)) throw new Error(`${logoPath}: needs a viewBox to round its corners`);
const [x, y, w, h] = box;
const tile = logo
  .replace(/<svg[^>]*>/, (open) =>
    `${open}<clipPath id="pwafy-tile"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${TILE_CORNER * w}"/></clipPath><g clip-path="url(#pwafy-tile)">`)
  .replace(/<\/svg>\s*$/, "</g></svg>\n");

const options = {
  imageName: "logo.svg",
  preset,
  faviconPreset: "2023",
  htmlLinks: { xhtml: true, includeId: false },
  basePath: "/",
  resolveSvgName: () => "favicon.svg",
} as const;
// Rounded wherever the logo shows unmasked; the OS masks apple and maskable itself, so those stay full bleed.
const rounded = await instructions({ ...options, imageResolver: () => Buffer.from(tile) });
const fullBleed = await instructions({ ...options, imageResolver: () => Buffer.from(logo) });
const faviconSvg = faviconPath === logoPath ? tile : await readFile(new URL(faviconPath, root), "utf8");
const favicon = await instructions({ ...options, imageResolver: () => Buffer.from(faviconSvg) });
const assets = { ...rounded, apple: fullBleed.apple, maskable: fullBleed.maskable, favicon: favicon.favicon };

// One splash screen at a time: all forty at once ran out of memory on the large iPad sizes (tashkeela).
const { appleSplashScreen, ...icons } = assets;
await generateAssets({ ...icons, appleSplashScreen: {} }, true, publicDir);
for (const [name, splash] of Object.entries(appleSplashScreen)) {
  await generateAssets(
    { ...icons, transparent: {}, maskable: {}, apple: {}, favicon: {}, appleSplashScreen: { [name]: splash } },
    true,
    publicDir,
  );
}
await writeFile(new URL("public/favicon.svg", root), faviconSvg);

const htmlPath = new URL("index.html", root);
const html = await readFile(htmlPath, "utf8");
const markers = /( *)<!-- pwa-assets:start -->[\s\S]*?<!-- pwa-assets:end -->/;
if (!markers.test(html)) throw new Error("index.html: add <!-- pwa-assets:start --> and <!-- pwa-assets:end --> inside <head>");
await writeFile(
  htmlPath,
  html.replace(markers, (_, indent: string) =>
    [`${indent}<!-- pwa-assets:start -->`, ...generateHtmlMarkup(assets).map((link) => `${indent}${link}`), `${indent}<!-- pwa-assets:end -->`].join("\n")),
);
console.log(`Generated PWA icons and ${Object.keys(appleSplashScreen).length} Apple splash screens.`);
