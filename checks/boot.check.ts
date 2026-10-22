import assert from "node:assert/strict";
import { createBoot } from "@/lib/boot";

// A manual frame queue: the boot screen decides on the frame after a render, never during it.
function setup() {
  const frames: (() => void)[] = [];
  let hidden = 0;
  const boot = createBoot(() => hidden++, (fn) => frames.push(fn));
  const frame = () => frames.splice(0).forEach((fn) => fn());
  return { boot, frame, hidden: () => hidden };
}

{
  const t = setup();
  t.boot.ready();
  assert.equal(t.hidden(), 0, "never during the render that made the screen");
  t.frame();
  assert.equal(t.hidden(), 1, "a screen with nothing loading drops it on the next frame");
}

{
  const t = setup();
  t.boot.ready();
  const release = t.boot.hold();   // a loading placeholder's layout effect, same commit as the first screen
  t.frame();
  assert.equal(t.hidden(), 0, "a placeholder from the same render keeps it up");
  release();
  t.frame();
  assert.equal(t.hidden(), 1, "until its data is there");
}

{
  const t = setup();
  const release = t.boot.hold();
  release();
  release();   // a stray second release must not take another screen's hold with it
  t.frame();
  assert.equal(t.hidden(), 0, "nothing hides it before the first screen rendered");
  t.boot.ready();
  t.boot.ready();
  t.frame();
  assert.equal(t.hidden(), 1, "and it hides once");
}

{
  const t = setup();
  t.boot.ready();
  const a = t.boot.hold();
  const b = t.boot.hold();
  a();
  t.frame();
  assert.equal(t.hidden(), 0, "a second hold keeps it up after the first lets go");
  b();
  t.frame();
  assert.equal(t.hidden(), 1);
}
