import { combinePresetAndAppleSplashScreens, defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// The app's own background as sRGB hex: its page colour (surface-1), converted from oklch if the CSS uses it.
// The splash screens, the manifest, theme-color and the boot screen all take it from here, so opening the app
// is one colour end to end. A splash a shade off the app's ground reads as a flash (tashkeela: #151A18 splash
// against a #040705 app).
export const background = "#000000";

// Square, full-bleed art, relative to the app root. iOS and Android put their own corner masks on home screen
// icons, so the art itself has square corners; generate-assets rounds it wherever it shows unmasked.
export const logo = "brand/logo.svg";

export const preset = combinePresetAndAppleSplashScreens(
  {
    ...minimal2023Preset,
    // Full bleed: the OS crops it. The preset's default padding boxed the logo in a frame (tashkeela).
    apple: { sizes: [180], padding: 0, resizeOptions: { background, fit: "contain" } },
    // Launchers crop a maskable icon as small as an 80% circle, so the art keeps a margin of the background.
    maskable: { sizes: [512], padding: 0.3, resizeOptions: { background, fit: "contain" } },
  },
  {
    // Logo at 35% of the screen's shorter side; the default 70% read too big (tashkeela). The boot screen's
    // CSS (min(35vmin, 280px)) matches, so the splash hands over to it without the logo moving.
    padding: 0.65,
    resizeOptions: { background, fit: "contain" },
    name: (landscape, size) => `apple-splash-${landscape ? "landscape" : "portrait"}-${size.width}x${size.height}.png`,
    linkMediaOptions: { basePath: "/", addMediaScreen: true, xhtml: true },
  },
);

export default defineConfig({
  preset,
  images: [logo],
  headLinkOptions: { preset: "2023" },
});
