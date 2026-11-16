# Psicología sin estigma

Web estática (Astro) editada por su dueña, sin conocimientos técnicos, desde Decap CMS en `/admin`.

- Contenido: `src/content/**.json` · Imágenes: `public/uploads/` · Panel: `public/admin/config.yml`.
- `config.yml` es el esquema: `scripts/validar-contenido.mjs` lo usa para validar el contenido.
  Si añades un dato a una página, añade su campo en `config.yml` (un test lo comprueba).
- Funciones puras en `src/lib/utilidades.js` (con tests). La carga de datos está en `src/lib/datos.js`.
- Textos de la web en español. El lenguaje inclusivo (les, une misme, juntes…) es intencionado.
- Web 100 % estática (Netlify sirve `dist/`): no añadas adaptadores SSR ni código de servidor,
  aunque la skill `astro` los mencione.
- Diseño: respeta la identidad existente (morados del logo, verde en servicios, cuaderno/pósits,
  tipografías Atkinson Hyperlegible + Caveat/Patrick Hand) y la accesibilidad (movimiento reducido,
  foco visible, sin sobreestimulación). Para cambios visuales usa la skill `frontend-design`.

## Skills del proyecto (`.claude/skills/`)

- `verificar-cambios` (propia) + subagente `revisor-contenido`: revisión de cambios de contenido.
- `frontend-design` (Anthropic, Apache 2.0): criterios de diseño visual.
- `astro` (astrolicious/agent-skills, MIT): referencia de Astro; consulta siempre docs.astro.build.

## Comandos

- `npm run dev` + `npm run cms` → web y panel en local (el panel en local no tiene borradores).
- `npm run verificar` → validación + tests unitarios + Playwright.
- Para revisar cambios de contenido usa la skill `/verificar-cambios`.

## Commits y PR

[Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/), en español:
`tipo(ámbito): descripción en minúscula, sin punto final`.

- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `ci`, `build`, `chore`.
- Ámbitos habituales: `contenido`, `cms`, `newsletter`, `retiros`, `tests`, el nombre de la página.
- Los cambios hechos desde el panel usan `chore(contenido): …` (configurado en `config.yml`).
- El título de la PR sigue el mismo formato; la descripción usa `.github/pull_request_template.md`.
