# Psicología sin estigma · web

Web estática (sin servidor) hecha con [Astro](https://astro.build), con un panel de edición
([Decap CMS](https://decapcms.org)) para que la dueña cambie textos, fotos, reseñas y recursos sin tocar código.

## Cómo funciona

```
 Panel /admin                GitHub                                 Netlify
 ────────────                ──────                                 ───────
 «Guardar»  ───────────▶ borrador (rama cms/… + pull request) ──▶ vista previa privada
                              │  ├─ Tests: contenido, unitarios, Playwright
                              │  └─ Revisión con Claude → comentario en español (email)
 «Publicar» ───────────▶ se fusiona en main ──────────────────▶ web publicada (1-2 min)
```

- **Contenido** en `src/content/` (JSON) e **imágenes** en `public/uploads/`. Sin base de datos.
- **Borradores con vista previa**: el panel usa el *flujo editorial*. Cada cambio guardado es un
  borrador con su propio enlace de vista previa; nada llega a la web hasta pulsar «Publicar».
- **Nunca se publica contenido roto**: `npm run build` valida el contenido antes de compilar. Si
  algo está mal (campo obligatorio vacío, imagen inexistente, enlace de Spotify o email
  incorrecto…), Netlify no publica y la web sigue como estaba.
- **Imágenes**: las que se suben desde el panel se reducen solas al publicar.
- **Newsletter**: formulario con el diseño de la web que envía los datos al formulario de Brevo
  que ya existe (se pega su código en *Ajustes generales*). El contacto también puede usar Brevo.
- **Podcast**: basta con pegar el enlace de Spotify de cada episodio.

## Verificación automática

| Qué | Dónde | Cuándo |
|---|---|---|
| Validación del contenido (`scripts/validar-contenido.mjs`) | Netlify y GitHub Actions | Cada borrador y cada publicación |
| Tests unitarios (Vitest, `tests/unit`) | GitHub Actions | Cada borrador y cada publicación |
| Tests de navegador (Playwright, `tests/e2e`, escritorio y móvil) | GitHub Actions | Cada borrador y cada publicación |
| Revisión editorial (Claude: skill `verificar-cambios` + subagente `revisor-contenido`) | GitHub Actions | Cada borrador hecho desde el panel |

La validación usa `public/admin/config.yml` como esquema: si el panel pide un campo, se comprueba.
Los mensajes de error están escritos para la dueña ("Páginas › Inicio → Podcast → Enlace de Spotify…").

La revisión con Claude es **opcional** (necesita una clave de API de Anthropic, con coste por uso).
Revisa erratas, privacidad en reseñas e imágenes (apellidos, teléfonos en capturas…), coherencia de
datos de contacto y enlaces, y respeta el lenguaje inclusivo de la web. Deja un comentario en el
borrador, que GitHub envía por email a la dueña.

Desde Claude Code, en local: `/verificar-cambios`.

## Puesta en marcha (una sola vez, la hace la persona técnica)

1. **GitHub**: crea la cuenta/organización y un repositorio (p. ej. `psicologia-sin-estigma`), y sube el proyecto.
   La carpeta `referencias/` está ignorada a propósito (pesa ~40 MB y ya está importada en `public/uploads`).
2. **Netlify** (gratis): *Add new site → Import from Git →* elige el repositorio. Lee `netlify.toml`;
   las vistas previas de cada borrador (*Deploy Previews*) vienen activadas por defecto.
3. **Login del panel con GitHub**:
   - En GitHub: *Settings → Developer settings → OAuth Apps → New OAuth App*.
     - Homepage URL: la URL de Netlify (o el dominio final).
     - Authorization callback URL: `https://api.netlify.com/auth/done`
   - En Netlify: *Site configuration → Access & security → OAuth → Install provider → GitHub*, con el Client ID y el Client Secret.
4. En `public/admin/config.yml`, `repo` apunta a `ItsasoAguirre/psicologia-sin-estigma` (cámbialo si el repositorio pasa a la cuenta de la dueña) y ajusta `site_url` y `display_url`.
   En `astro.config.mjs`, cambia `site`.
5. **Cuenta de la dueña**: una cuenta gratuita de GitHub, añadida como *collaborator* con permiso de escritura.
   Que active las notificaciones por email de GitHub para recibir las revisiones.
6. **Protección de `main`** (recomendado): *Settings → Branches → Add rule → main → Require status checks →*
   «Tests (contenido, unitarios y navegador)». Así el botón «Publicar» no funciona si los tests fallan.
7. **Revisión con Claude** (opcional): *Settings → Secrets and variables → Actions → New secret*
   `ANTHROPIC_API_KEY`. Sin ella, todo lo demás funciona igual.
8. **Brevo**: en el panel → *Ajustes generales → Formulario de la newsletter*, pega el código HTML del
   formulario de suscripción que ya usa. Si ese formulario tiene captcha, desactívalo en Brevo
   (la web ya incluye protección contra bots).
9. **Dominio**: en Netlify → *Domain management*, añade el dominio actual y cambia sus DNS donde esté
   registrado. Hasta ese momento la web antigua sigue funcionando donde esté alojada ahora.

## Guía para la dueña

1. Entra en **`tu-web.com/admin`** e inicia sesión con tu cuenta de GitHub.
2. Elige qué cambiar a la izquierda:
   - **Páginas**: cada página de la web.
   - **Reseñas de terapia**: los pósits de inicio. *Publicada* desactivado = oculta sin borrarla. *Orden* = posición.
   - **Recursos**: libros, artículos, vídeos… con tipo (sirve de filtro), enlace e imagen.
   - **Ajustes generales**: correo, teléfono, horario, Instagram, colegiada y formularios de Brevo.
3. Haz los cambios y pulsa **Guardar**. Se crea un **borrador**: todavía no está en la web.
4. Pulsa **Ver vista previa** (arriba; tarda 1-2 minutos en estar lista) para ver la web con tus cambios.
5. Si todo está bien, cambia el estado a **Listo** y pulsa **Publicar → Publicar ahora**. En 1-2 minutos está en la web.
6. Todos tus borradores están en la pestaña **Flujo editorial**.
7. Si te llega un email de GitHub con una revisión ❌, corrige lo que indica en el panel y vuelve a guardar.

## Para desarrollar

```bash
npm install
npx playwright install chromium   # una vez, para los tests de navegador
npm run dev        # web en http://localhost:4321
npm run cms        # (otra terminal) panel en http://localhost:4321/admin sin GitHub (en local no hay borradores)
npm run validar    # comprueba el contenido
npm test           # tests unitarios
npm run test:e2e   # tests de navegador (compila la web antes)
npm run verificar  # todo lo anterior
```

## Pendiente

- Fotos de **Sobre mí** (ahora se muestra el logo).
- Contenido de **Recursos** (hay un recurso de ejemplo para sustituir).
- Código de los formularios de **Brevo** (newsletter y contacto).
- Textos de **Aviso legal** y **Política de privacidad** (obligatorios por LSSI/RGPD; la newsletter enlaza a la política).
