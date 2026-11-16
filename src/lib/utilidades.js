// Funciones puras, sin dependencias de Astro: se usan en la web, en la validación y en los tests.

/** Convierte un enlace normal de Spotify en la URL de su reproductor embebido. */
export function spotify(url = '') {
  const m = String(url ?? '').match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(episode|show|playlist|track)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
}

/** Primeras palabras de un texto (sin formato) para los pósits de reseñas. */
export function extracto(texto = '', max = 90) {
  const limpio = String(texto ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [texto](enlace) → texto
    .replace(/[*_#>\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return limpio.length > max ? limpio.slice(0, max).replace(/\s\S*$/, '') + '…' : limpio;
}

/**
 * Lee lo que la dueña pega en el panel para el formulario de Brevo: puede ser el código
 * de inserción completo (HTML) o solo la dirección. Devuelve lo necesario para enviar
 * el formulario desde nuestro propio diseño.
 */
export function analizarBrevo(valor = '') {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;
  const accion = texto.match(/https:\/\/[a-z0-9.-]*sibforms\.com\/serve\/[A-Za-z0-9_\-=+/%.]+/i)?.[0] ?? null;
  const nombre = texto.match(/name=["'](FIRSTNAME|NOMBRE|PRENOM|NAME)["']/i)?.[1] ?? null;
  return {
    accion,
    campoNombre: nombre,
    tieneOptIn: /name=["']OPT_IN["']/i.test(texto),
    tieneCaptcha: /g-recaptcha|data-sitekey|hcaptcha|turnstile/i.test(texto),
  };
}

// ---------- Imágenes responsive ----------
// Las versiones las crea scripts/optimizar-imagenes.mjs tras compilar; el componente <Img>
// las enlaza en `srcset`. Ambos usan estas funciones para coincidir exactamente.
export const ANCHOS = [160, 320, 640, 768, 1024, 1600];
const REDIMENSIONABLE = /\.(jpe?g|png|webp|avif)$/i;

/** Anchos que tendrá una imagen según su ancho original (nunca se agranda). */
export function anchosPara(anchoOriginal) {
  if (!anchoOriginal) return [];
  const menores = ANCHOS.filter((w) => w < anchoOriginal);
  return anchoOriginal <= ANCHOS.at(-1) ? [...menores, anchoOriginal] : menores;
}

/** Ruta de la versión WebP de una imagen subida: /uploads/x.jpg → /uploads/_v/480/x.webp */
export function rutaVariante(src, ancho) {
  if (!esRedimensionable(src)) return null;
  const relativa = src.slice('/uploads/'.length).replace(REDIMENSIONABLE, '.webp');
  return `/uploads/_v/${ancho}/${relativa}`;
}

export const esRedimensionable = (src = '') =>
  typeof src === 'string' && src.startsWith('/uploads/') && !src.startsWith('/uploads/_v/') && REDIMENSIONABLE.test(src);

/** Valor del atributo srcset (rutas codificadas: el srcset separa por espacios). */
export function srcsetPara(src, anchoOriginal) {
  if (!esRedimensionable(src)) return undefined;
  const lista = anchosPara(anchoOriginal);
  return lista.length ? lista.map((w) => `${encodeURI(rutaVariante(src, w))} ${w}w`).join(', ') : undefined;
}

export const emailValido = (s = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s));
export const urlValida = (s = '') => { try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };
