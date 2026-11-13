import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
test("brand assets match required sizes and retain transparency", async () => {
  const publicUrl = new URL("../public/", import.meta.url);
  assert.equal(
    await readFile(new URL("logo.svg", publicUrl), "utf8"),
    await readFile(new URL("favicon.svg", publicUrl), "utf8"),
  );
  for (const [name, width, height] of [
    ["logo.png", 1024, 1024],
    ["favicon-16x16.png", 16, 16],
    ["favicon-32x32.png", 32, 32],
    ["apple-touch-icon.png", 180, 180],
    ["icon-192.png", 192, 192],
    ["icon-512.png", 512, 512],
    ["icon-maskable-512.png", 512, 512],
    ["notification-badge.png", 96, 96],
    ["social-card.png", 1200, 630],
  ]) {
    const metadata = await sharp(
      await readFile(new URL(name, publicUrl)),
    ).metadata();
    assert.equal(metadata.width, width, name);
    assert.equal(metadata.height, height, name);
  }
  const { data, info } = await sharp(
    await readFile(new URL("logo.png", publicUrl)),
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(data[3], 0, "master corner is transparent");
  assert.equal(info.channels, 4);
  const ico = await readFile(new URL("favicon.ico", publicUrl));
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries())
    assert.equal(ico[6 + index * 16], size);
});
