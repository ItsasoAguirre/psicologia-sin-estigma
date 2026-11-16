import { defineConfig } from 'astro/config';

// Cambia `site` por el dominio definitivo cuando lo tengáis.
export default defineConfig({
  site: 'https://psicologiasinestigma.netlify.app',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  // CSS dentro del HTML: menos peticiones que bloquean el primer pintado.
  build: { inlineStylesheets: 'always' },
});
