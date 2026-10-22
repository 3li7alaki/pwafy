import assert from "node:assert/strict";
import { installPath } from "@/lib/install";

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const instagram = `${iphone} Instagram 350.0.0.0`;
const chromeAndroid = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
const firefoxAndroid = "Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0";
const browser = { maxTouchPoints: 5, standalone: false, canPrompt: false };

assert.equal(installPath({ ...browser, userAgent: iphone, standalone: true }), "none", "installed already");
assert.equal(installPath({ ...browser, userAgent: instagram, canPrompt: true }), "in-app", "in-app beats a prompt");
assert.equal(installPath({ ...browser, userAgent: chromeAndroid, canPrompt: true }), "prompt");
assert.equal(installPath({ ...browser, userAgent: firefoxAndroid }), "none", "Firefox: no prompt, not iOS");
assert.equal(installPath({ ...browser, userAgent: iphone }), "ios");
assert.equal(installPath({ ...browser, userAgent: ipad }), "ios", "iPadOS reports a Mac but has touch");
assert.equal(installPath({ ...browser, userAgent: ipad, maxTouchPoints: 0 }), "none", "a real Mac");
