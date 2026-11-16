---
name: verificar-cambios
description: Verifica los cambios de contenido de la web (hechos desde el panel /admin o a mano) y redacta un informe en español sencillo para la dueña, sin jerga técnica. Úsala cuando haya cambios en src/content/ o public/uploads/, cuando se pida revisar, comprobar o verificar un borrador o una publicación, o desde la GitHub Action "Verificar cambios".
---

# Verificar cambios

La dueña de la web no tiene conocimientos técnicos. Edita desde el panel (Decap CMS) y cada
borrador se convierte en una pull request en una rama `cms/...`. Tu trabajo es decirle, en
pocas líneas y en su idioma, si su cambio está bien y qué tocar si no lo está.

## 1. Qué ha cambiado

- **En CI** (te pasan el número de PR): `gh pr diff <N> --name-only` y `gh pr diff <N>`.
- **En local**: `git status --short` y `git diff` (o `git diff main...HEAD` en una rama).

Clasifica los archivos:
- `src/content/**` y `public/uploads/**` → **contenido** (lo hace ella).
- `public/admin/config.yml` → configuración del panel.
- Todo lo demás → código (lo hace la persona técnica; no lo explicas a la dueña).

## 2. Comprobaciones automáticas

1. `npm run validar` → errores bloqueantes (la web no se publicaría) y avisos.
2. `npm test` → tests unitarios.
3. Playwright (`npm run test:e2e`) **solo en local** y solo si ha cambiado código; en CI ya lo
   ejecuta el job `tests` y te pasan su resultado. Si el resultado es `failure` y la validación
   pasa, di que hay un problema técnico y que ya lo revisará la persona técnica; no lo
   atribuyas a ella.

## 3. Revisión editorial

Si ha cambiado contenido, lanza el subagente **revisor-contenido** con la lista de archivos
cambiados y el diff. No repitas su trabajo; usa sus hallazgos.

## 4. Informe

Escribe `informe.md` (en CI) o responde directamente (en local) con este formato, en español,
tuteando, cálido y breve. Máximo ~15 líneas. Nada de rutas de archivo, JSON, "commit", "PR" ni "build".

```markdown
### ✅ Todo correcto  |  ⚠️ Se puede publicar, pero revisa esto  |  ❌ Hay que corregir algo antes de publicar

**Qué has cambiado:** <una frase: "la reseña de Ana", "las fotos de Retiros"…>

**Para corregir** (solo si hay errores)
- <Dónde en el panel> → <qué pasa> → <qué hacer>

**Sugerencias** (opcional, máximo 3)
- <Dónde en el panel> → <sugerencia>
```

Traduce cada archivo a su lugar en el panel:

| Archivo | En el panel |
|---|---|
| `src/content/paginas/<nombre>.json` | Páginas › <nombre de la página> |
| `src/content/resenas/*.json` | Reseñas de terapia › <nombre> |
| `src/content/recursos/*.json` | Recursos › <título> |
| `src/content/ajustes/general.json` | Ajustes generales |
| `public/uploads/*` | Medios (imágenes subidas) |

## Reglas

- **No modifiques contenido** en CI: solo informas. En local, propón el cambio y aplícalo solo si te lo piden.
- Distingue bien: ❌ solo para lo que impide publicar o es claramente un error (errata evidente,
  dato de contacto mal, información privada de pacientes). El estilo es suyo: no lo "corrijas".
- El lenguaje inclusivo (les, une misme, juntes, cuidades…) es intencionado. Nunca lo marques.
- Si todo está bien, dilo en una línea y no inventes sugerencias.
