// Se ejecuta tras `astro build` sobre dist/uploads:
//  1. Crea versiones WebP de cada imagen en los anchos que enlaza el componente <Img>
//     (dist/uploads/_v/<ancho>/<ruta>.webp).
//  2. Reduce las originales demasiado grandes (fotos de móvil subidas desde el panel).
import sharp from 'sharp';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, relative, extname } from 'node:path';
import { anchosPara, rutaVariante } from '../src/lib/utilidades.js';

sharp.cache(false);
const MAX = 1800;
const dir = process.argv[2] ?? 'dist/uploads';

async function archivos(d) {
  const lista = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { if (e.name !== '_v') lista.push(...await archivos(p)); }
    else lista.push(p);
  }
  return lista;
}

let versiones = 0;
let reducidas = 0;
for (const p of await archivos(dir).catch((e) => (e.code === 'ENOENT' ? [] : Promise.reject(e)))) {
  const ext = extname(p).toLowerCase();
  const src = '/uploads/' + relative(dir, p).split('\\').join('/');
  if (!rutaVariante(src, 1)) continue;
  const original = await readFile(p);
  const meta = await sharp(original, { failOn: 'none' }).metadata();
  const girada = (meta.orientation ?? 1) >= 5;
  const ancho = girada ? meta.height : meta.width;

  // 1. Versiones WebP (antes de reducir la original, para coincidir con lo que calcula <Img>)
  for (const w of anchosPara(ancho)) {
    const destino = join(dir, '..', rutaVariante(src, w).slice(1));
    await mkdir(dirname(destino), { recursive: true });
    await sharp(original, { failOn: 'none' }).rotate().resize({ width: w }).webp({ quality: 78 }).toFile(destino);
    versiones++;
  }

  // 2. Original más ligera (se mantiene como alternativa para navegadores antiguos)
  if (original.length < 250_000) continue;
  const img = sharp(original, { failOn: 'none' }).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  const buf = ext === '.png' ? await img.png({ compressionLevel: 9, palette: true, quality: 85 }).toBuffer()
    : ext === '.webp' ? await img.webp({ quality: 80 }).toBuffer()
    : await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  if (buf.length < original.length) { await writeFile(p, buf); reducidas++; }
}
console.log(`🖼️  ${versiones} versiones WebP creadas, ${reducidas} originales reducidas.`);
