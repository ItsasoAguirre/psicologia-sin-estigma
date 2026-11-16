// Reduce el tamaño de las imágenes subidas desde el panel antes de publicar.
// Se ejecuta automáticamente tras `astro build` sobre la carpeta dist/uploads.
import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

sharp.cache(false);
const MAX = 1800;
const dir = process.argv[2] ?? 'dist/uploads';

async function walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { await walk(p); continue; }
    const ext = extname(e.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
    const original = await readFile(p);
    const before = original.length;
    if (before < 250_000) continue;
    const img = sharp(original, { failOn: 'none' }).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
    const buf = ext === '.png' ? await img.png({ compressionLevel: 9, palette: true, quality: 85 }).toBuffer()
      : ext === '.webp' ? await img.webp({ quality: 80 }).toBuffer()
      : await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    if (buf.length < before) await writeFile(p, buf);
  }
}
await walk(dir).catch((e) => { if (e.code !== 'ENOENT') throw e; });
