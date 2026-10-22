// Erzeugt die PNG-Icons für Manifest / iOS aus public/icon.svg:  node scripts/make-icons.mjs
import sharp from 'sharp';
import fs from 'node:fs';
const pub = new URL('../public/', import.meta.url).pathname;
const svg = fs.readFileSync(pub + 'icon.svg');
const out = async (name, size, pad = 0) => {
  const inner = Math.round(size * (1 - pad * 2));
  const base = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#2a2430' } })
    .composite([{ input: base, gravity: 'centre' }]).png().toFile(pub + name);
};
await out('icon-192.png', 192);
await out('icon-512.png', 512);
await out('icon-maskable-512.png', 512, 0.12); // Android „maskable“: Motiv in der sicheren Zone
await out('apple-touch-icon.png', 180);
console.log('icons ok');
