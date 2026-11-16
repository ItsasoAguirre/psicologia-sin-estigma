// Reduce Caveat (fuente variable de 73 KB) a un solo grosor (700) y a los caracteres latinos
// que usa la web. Se ejecuta a mano una vez: `node scripts/recortar-fuentes.mjs`.
// El original viene de Google Fonts (licencia SIL OFL 1.1, que permite modificarla).
import subsetFont from 'subset-font';
import { writeFile } from 'node:fs/promises';

// Latín básico y Latin-1 (á é í ó ú ñ ü ç ¿ ¡ « » €…) y puntuación tipográfica (– — ‘ ’ “ ” …)
const rangos = [[0x20, 0x7e], [0xa0, 0xff], [0x2010, 0x2027], [0x2030, 0x203a], [0x20ac, 0x20ac]];
const texto = rangos.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i))).join('');

// Descarga la versión variable original (subconjunto latino) desde Google Fonts.
const css = await (await fetch('https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' },
})).text();
const url = css.match(/\/\* latin \*\/[^}]*?url\((https:[^)]+\.woff2)\)/)?.[1];
if (!url) throw new Error('No se encontró la fuente Caveat en Google Fonts');
const origen = Buffer.from(await (await fetch(url)).arrayBuffer());
const recortada = await subsetFont(origen, texto, { targetFormat: 'woff2', variationAxes: { wght: 700 } });
await writeFile('public/fonts/caveat-700.woff2', recortada);
console.log(`Caveat: ${(origen.length / 1024).toFixed(1)} KB → ${(recortada.length / 1024).toFixed(1)} KB`);
