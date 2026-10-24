import assert from "node:assert/strict";
import { errorDetails, errorKind } from "@/lib/errors";

// A lazy chunk a deploy removed, in each engine's words, asks for a reload.
for (const message of [
  "Failed to fetch dynamically imported module: https://x/assets/a.js",
  "Importing a module script failed.",
  "error loading dynamically imported module: https://x/assets/a.js",
  "Unable to preload CSS for /assets/a.css",
]) assert.equal(errorKind(new TypeError(message), true), "update", message);
assert.equal(errorKind(new TypeError("Importing a module script failed."), false), "offline", "a missing chunk offline is the connection");
assert.equal(errorKind(new TypeError("Load failed"), true), "offline", "WebKit's failed fetch");
assert.equal(errorKind(Object.assign(new Error("x"), { status: 0 }), true), "offline", "no response at all");
assert.equal(errorKind(Object.assign(new Error("x"), { status: 404 }), true), "missing");
assert.equal(errorKind(new TypeError("Cannot read properties of undefined"), true), "broken");

const details = errorDetails(new TypeError("boom"), { url: "https://app/x", build: "b1", userAgent: "UA", at: new Date(0) });
assert.deepEqual(details.split("\n").slice(0, 5), ["TypeError: boom", "Page: https://app/x", "Build: b1", "Time: 1970-01-01T00:00:00.000Z", "Browser: UA"]);
