// Mapa del sitio para buscadores. Si se añade una página nueva, añádela aquí.
import { servicios } from '../lib/datos.js';

const RUTAS = [
  '/', '/sobre-mi', '/servicios', ...servicios.map((s) => s.href),
  '/recursos', '/contacto', '/privacidad', '/aviso-legal',
];

export function GET({ site }) {
  const urls = RUTAS.map((r) => `  <url><loc>${new URL(r, site).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
