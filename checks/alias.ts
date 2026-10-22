import { registerHooks } from "node:module";

// Resolves "@/" the way tsconfig paths do, so a check imports registry files exactly as an app will.
const root = new URL("../registry/", import.meta.url);

registerHooks({
  resolve(specifier, context, next) {
    if (!specifier.startsWith("@/")) return next(specifier, context);
    const path = specifier.slice(2);
    return next(new URL(/\.\w+$/.test(path) ? path : `${path}.ts`, root).href, context);
  },
});
