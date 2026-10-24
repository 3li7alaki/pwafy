import assert from "node:assert/strict";
import { keyBytes, pushPermission } from "@/lib/push";

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const android = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
const tab = { maxTouchPoints: 5, standalone: false, hasPush: false };

assert.equal(pushPermission({ ...tab, userAgent: iphone }), "install-first", "iPhone tab hides PushManager");
assert.equal(pushPermission({ ...tab, userAgent: ipad }), "install-first", "iPad reports a Mac UA");
assert.equal(pushPermission({ ...tab, userAgent: ipad, maxTouchPoints: 0 }), "unsupported", "a real Mac");
assert.equal(pushPermission({ ...tab, userAgent: iphone, standalone: true }), "unsupported", "installed on iOS before 16.4");
assert.equal(pushPermission({ ...tab, userAgent: android, hasPush: true, permission: "default" }), "ask");
assert.equal(pushPermission({ ...tab, userAgent: android, hasPush: true, permission: "denied" }), "denied");

const bytes = Uint8Array.from({ length: 65 }, (_, i) => (i * 37 + 4) % 256);
const key = Buffer.from(bytes).toString("base64url");
assert.deepEqual(Array.from(keyBytes(key)), Array.from(bytes), "unpadded base64url, as web-push prints it");
