// Generate every brand asset from the transparent SVG master.
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");
async function generate() {
  const master = await fs.readFile(path.join(root, "public/logo.svg"));
  const outputs = [
    ["logo.png", 1024],
    ["favicon-16x16.png", 16],
    ["favicon-32x32.png", 32],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ];
  for (const [name, size] of outputs)
    await sharp(master)
      .resize(size, size)
      .png()
      .toFile(path.join(root, "public", name));
  await fs.writeFile(path.join(root, "public/favicon.svg"), master);
  const maskable = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="0" fill="#171719"/><svg x="96" y="96" width="320" height="320" viewBox="0 0 64 64">${master
      .toString()
      .trim()
      .replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg></svg>`,
  );
  for (const [name, size] of [
    ["icon-maskable-512.png", 512],
    ["apple-touch-icon.png", 180],
  ])
    await sharp(maskable)
      .resize(size, size)
      .png()
      .toFile(path.join(root, "public", name));
  const badge = master
    .toString()
    .replace(/<circle[^>]*\/>/, "")
    .replace("#FF9100", "#FFFFFF");
  await sharp(Buffer.from(badge))
    .resize(96, 96)
    .png()
    .toFile(path.join(root, "public/notification-badge.png"));
  const images = await Promise.all(
    [16, 32, 48].map((size) =>
      sharp(master).resize(size, size).png().toBuffer(),
    ),
  );
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((buffer, i) => {
    const at = 6 + i * 16;
    header[at] = [16, 32, 48][i];
    header[at + 1] = header[at];
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(buffer.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += buffer.length;
  });
  await fs.writeFile(
    path.join(root, "public/favicon.ico"),
    Buffer.concat([header, ...images]),
  );
  const card = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#131316"/><rect x="64" y="64" width="1072" height="502" rx="24" fill="#1b1b1e" stroke="#353539"/><svg x="112" y="144" width="144" height="144" viewBox="0 0 64 64">${master
      .toString()
      .trim()
      .replace(
        /^<svg[^>]*>|<\/svg>$/g,
        "",
      )}</svg><text x="112" y="374" font-family="sans-serif" font-weight="700" font-size="76" fill="#f0efed">FPND</text><text x="112" y="440" font-family="sans-serif" font-size="32" fill="#b0b0b5">Firebase Push Notification Demo</text><text x="112" y="492" font-family="sans-serif" font-size="24" fill="#ffad33">Your notification workspace.</text></svg>`,
  );
  await sharp(card).png().toFile(path.join(root, "public/social-card.png"));
  console.log("Generated brand assets from public/logo.svg");
}
generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
