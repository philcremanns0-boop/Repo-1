// Verkleinert & konvertiert Fotos für das Web:  npm run photos -- <Ordner-mit-Originalen>
// Ausgabe → src/photos/*.webp  (max. 1800 px lange Kante, Qualität 82, EXIF-Drehung angewandt)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error('Usage: npm run photos -- <Ordner mit Originalfotos>');
  process.exit(1);
}
const out = path.resolve(import.meta.dirname, '../src/photos');
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(src).filter((f) => /\.(jpe?g|png|webp|heic|avif|tiff?)$/i.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
let i = 0;
for (const f of files) {
  i++;
  const name = `photo-${String(i).padStart(2, '0')}.webp`;
  const info = await sharp(path.join(src, f)).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(out, name));
  console.log(`${f} → src/photos/${name}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
console.log(`\n${i} Foto(s) fertig. Sie erscheinen automatisch im Museum.`);
