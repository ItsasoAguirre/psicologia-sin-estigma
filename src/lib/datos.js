import { marked } from 'marked';

const cargar = (glob) => Object.fromEntries(Object.entries(glob).map(([k, v]) => [k.split('/').pop().replace('.json', ''), v]));

const paginas = cargar(import.meta.glob('../content/paginas/*.json', { eager: true, import: 'default' }));
export const ajustes = cargar(import.meta.glob('../content/ajustes/*.json', { eager: true, import: 'default' })).general;

export const pagina = (nombre) => paginas[nombre];

const ordenar = (a, b) => (a.orden ?? 999) - (b.orden ?? 999);
export const resenas = Object.values(import.meta.glob('../content/resenas/*.json', { eager: true, import: 'default' }))
  .filter((r) => r.publicada !== false)
  .sort(ordenar);
export const recursos = Object.values(import.meta.glob('../content/recursos/*.json', { eager: true, import: 'default' }))
  .filter((r) => r.publicado !== false)
  .sort(ordenar);

marked.use({ breaks: true });
/** Texto con formato (negritas, enlaces, listas…) escrito desde el panel. */
export const md = (texto = '') => marked.parse(texto ?? '');
export const mdLinea = (texto = '') => marked.parseInline(texto ?? '');

export { spotify, extracto } from './utilidades.js';

export const servicios = [
  { href: '/servicios/psicoterapia', texto: 'Psicoterapia' },
  { href: '/servicios/asesoramiento', texto: 'Asesoramiento puntual' },
  { href: '/servicios/supervisiones', texto: 'Supervisiones' },
  { href: '/servicios/actividades-grupales', texto: 'Actividades grupales' },
  { href: '/servicios/retiros', texto: 'Retiros' },
];
