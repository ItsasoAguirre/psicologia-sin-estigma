// Comprueba que el contenido editado desde el panel es correcto antes de publicar.
// Usa public/admin/config.yml como "esquema": lo que el panel pide, la web lo necesita.
// Se ejecuta en cada build (si hay errores, no se publica nada) y en los tests.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { spotify, analizarBrevo, emailValido, urlValida } from '../src/lib/utilidades.js';

const RAIZ = resolve(fileURLToPath(import.meta.url), '../..');

const vacio = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

/**
 * @param {{ config?: string, raiz?: string, publico?: string }} op
 * @returns {{ errores: string[], avisos: string[] }}
 */
export function validar(op = {}) {
  const raiz = op.raiz ?? RAIZ;
  const publico = op.publico ?? join(raiz, 'public');
  const config = YAML.parse(readFileSync(op.config ?? join(raiz, 'public/admin/config.yml'), 'utf8'));
  const errores = [];
  const avisos = [];

  const leer = (archivo, donde) => {
    try { return JSON.parse(readFileSync(join(raiz, archivo), 'utf8')); }
    catch (e) { errores.push(`${donde}: el archivo ${archivo} no se puede leer (${e.message}).`); return null; }
  };

  const revisarCampo = (campo, valor, ruta) => {
    const etiqueta = `${ruta} → «${campo.label}»`;
    const w = campo.widget ?? 'string';
    if (vacio(valor)) {
      if (campo.required !== false && w !== 'boolean') errores.push(`${etiqueta} está vacío y es obligatorio.`);
      if (campo.name === 'transcripcion') avisos.push(`${etiqueta} está vacía: las personas ciegas no podrán leer esa reseña.`);
      return;
    }
    switch (w) {
      case 'string': case 'text': case 'markdown':
        if (typeof valor !== 'string') { errores.push(`${etiqueta} debería ser texto.`); return; }
        if (/<script/i.test(valor) && !campo.name.startsWith('brevo_')) errores.push(`${etiqueta} contiene código <script>, que no está permitido.`);
        break;
      case 'number':
        if (typeof valor !== 'number' || Number.isNaN(valor)) errores.push(`${etiqueta} debería ser un número.`);
        break;
      case 'boolean':
        if (typeof valor !== 'boolean') errores.push(`${etiqueta} debería ser sí/no.`);
        break;
      case 'select': {
        const ops = (campo.options ?? []).map((o) => (typeof o === 'object' ? o.value : o));
        if (!ops.includes(valor)) errores.push(`${etiqueta} tiene un valor no válido («${valor}»).`);
        break;
      }
      case 'image':
        if (typeof valor !== 'string') errores.push(`${etiqueta} no es una imagen válida.`);
        else if (valor.startsWith('/')) {
          if (!existsSync(join(publico, decodeURI(valor)))) errores.push(`${etiqueta}: la imagen ${valor} no existe. Vuelve a subirla.`);
        } else if (!urlValida(valor)) errores.push(`${etiqueta}: «${valor}» no es una imagen válida.`);
        break;
      case 'object':
        if (typeof valor !== 'object' || Array.isArray(valor)) { errores.push(`${etiqueta} tiene un formato incorrecto.`); return; }
        for (const f of campo.fields ?? []) revisarCampo(f, valor[f.name], etiqueta);
        break;
      case 'list':
        if (!Array.isArray(valor)) { errores.push(`${etiqueta} debería ser una lista.`); return; }
        valor.forEach((item, i) => {
          const r = `${etiqueta} (elemento ${i + 1})`;
          if (campo.field) revisarCampo({ ...campo.field, label: campo.field.label ?? 'Elemento' }, item, r);
          else if (campo.fields) for (const f of campo.fields) revisarCampo(f, item?.[f.name], r);
        });
        break;
    }
    revisarEspecial(campo, valor, etiqueta);
  };

  const revisarEspecial = (campo, valor, etiqueta) => {
    if (typeof valor !== 'string' || !valor.trim()) return;
    const n = campo.name;
    if (n === 'email' && !emailValido(valor)) errores.push(`${etiqueta}: «${valor}» no parece un correo válido.`);
    if (['enlace', 'instagram_url'].includes(n) && !urlValida(valor)) errores.push(`${etiqueta}: «${valor}» no es un enlace válido (debe empezar por https://).`);
    if (n === 'url' && /spotify/i.test(campo.label) && !spotify(valor)) errores.push(`${etiqueta}: «${valor}» no es un enlace de Spotify válido. Cópialo desde Spotify → Compartir → Copiar enlace.`);
    if (n === 'brevo_newsletter') {
      const b = analizarBrevo(valor);
      if (!b?.accion) errores.push(`${etiqueta}: no se encuentra la dirección del formulario de Brevo en lo que has pegado. Copia el código HTML completo del formulario.`);
      else if (b.tieneCaptcha) avisos.push(`${etiqueta}: el formulario de Brevo tiene captcha activado. Desactívalo en Brevo o las suscripciones desde la web fallarán.`);
    }
    if (n === 'brevo_contacto' && !valor.trim().startsWith('<') && !urlValida(valor)) errores.push(`${etiqueta}: pega el código de inserción de Brevo o su enlace (https://…).`);
  };

  for (const col of config.collections ?? []) {
    if (col.files) {
      for (const f of col.files) {
        const donde = `${col.label} › ${f.label}`;
        const datos = leer(f.file, donde);
        if (datos) for (const campo of f.fields) revisarCampo(campo, datos[campo.name], donde);
      }
    } else if (col.folder) {
      const dir = join(raiz, col.folder);
      const archivos = existsSync(dir) ? readdirSync(dir).filter((a) => a.endsWith('.json')) : [];
      for (const a of archivos) {
        const datos = leer(`${col.folder}/${a}`, col.label);
        if (!datos) continue;
        const donde = `${col.label_singular ?? col.label} «${datos[col.identifier_field ?? 'title'] ?? a}»`;
        for (const campo of col.fields) revisarCampo(campo, datos[campo.name], donde);
      }
    }
  }
  return { errores, avisos };
}

// Uso por línea de comandos: `npm run validar`
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errores, avisos } = validar();
  for (const a of avisos) console.warn(`⚠️  ${a}`);
  if (errores.length) {
    console.error(`\n❌ Hay ${errores.length} problema(s) en el contenido. La web NO se ha publicado:\n`);
    for (const e of errores) console.error(`   • ${e}`);
    console.error('\nCorrígelo desde el panel y vuelve a publicar.\n');
    process.exit(1);
  }
  console.log(`✅ Contenido correcto${avisos.length ? ` (con ${avisos.length} aviso(s))` : ''}.`);
}
