// Comprueba el contenido real de la web y que el validador detecta los errores típicos
// que se pueden cometer desde el panel.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import YAML from 'yaml';
import { validar } from '../../scripts/validar-contenido.mjs';

const RAIZ = resolve(import.meta.dirname, '../..');
const PUBLICO = join(RAIZ, 'public');
const config = YAML.parse(readFileSync(join(RAIZ, 'public/admin/config.yml'), 'utf8'));

describe('contenido actual', () => {
  it('no tiene errores', () => {
    const { errores } = validar();
    expect(errores).toEqual([]);
  });
});

describe('panel (config.yml)', () => {
  // Si un dato existe en el contenido pero no en el panel, la dueña no podría editarlo
  // (y el panel lo borraría al guardar).
  const sinCampo = (campos, datos, ruta, faltan) => {
    for (const [clave, valor] of Object.entries(datos ?? {})) {
      const campo = campos.find((c) => c.name === clave);
      if (!campo) { faltan.push(`${ruta}.${clave}`); continue; }
      if (campo.widget === 'object') sinCampo(campo.fields, valor, `${ruta}.${clave}`, faltan);
      if (campo.widget === 'list' && campo.fields) valor.forEach((v, i) => sinCampo(campo.fields, v, `${ruta}.${clave}[${i}]`, faltan));
    }
  };

  it('todos los datos de cada página se pueden editar desde el panel', () => {
    const faltan = [];
    for (const col of config.collections) {
      for (const f of col.files ?? []) sinCampo(f.fields, JSON.parse(readFileSync(join(RAIZ, f.file), 'utf8')), f.file, faltan);
      if (col.folder) {
        for (const a of readdirSync(join(RAIZ, col.folder))) {
          sinCampo(col.fields, JSON.parse(readFileSync(join(RAIZ, col.folder, a), 'utf8')), `${col.folder}/${a}`, faltan);
        }
      }
    }
    expect(faltan).toEqual([]);
  });

  it('usa el modo borradores con vista previa', () => {
    expect(config.publish_mode).toBe('editorial_workflow');
    expect(config.locale).toBe('es');
    expect(config.media_folder).toBe('public/uploads');
  });
});

describe('el validador detecta errores', () => {
  let raiz;
  beforeEach(() => {
    raiz = mkdtempSync(join(tmpdir(), 'pse-'));
    cpSync(join(RAIZ, 'src/content'), join(raiz, 'src/content'), { recursive: true });
    cpSync(join(RAIZ, 'public/admin'), join(raiz, 'public/admin'), { recursive: true });
  });
  afterEach(() => rmSync(raiz, { recursive: true, force: true }));

  const editar = (archivo, cambio) => {
    const ruta = join(raiz, archivo);
    const datos = JSON.parse(readFileSync(ruta, 'utf8'));
    cambio(datos);
    writeFileSync(ruta, JSON.stringify(datos));
  };
  const errores = () => validar({ raiz, publico: PUBLICO }).errores.join('\n');

  it('campo obligatorio vacío', () => {
    editar('src/content/paginas/inicio.json', (d) => { d.hero.titulo = ''; });
    expect(errores()).toMatch(/Inicio.*Título grande.*vacío/);
  });

  it('imagen que no existe', () => {
    editar('src/content/paginas/retiros.json', (d) => { d.fotos.push('/uploads/no-existe.jpg'); });
    expect(errores()).toMatch(/no-existe\.jpg no existe/);
  });

  it('enlace de Spotify incorrecto', () => {
    editar('src/content/paginas/inicio.json', (d) => { d.podcast.episodios[0].url = 'https://youtube.com/watch?v=1'; });
    expect(errores()).toMatch(/no es un enlace de Spotify válido/);
  });

  it('correo mal escrito', () => {
    editar('src/content/ajustes/general.json', (d) => { d.email = 'psicologia.cop.es'; });
    expect(errores()).toMatch(/no parece un correo válido/);
  });

  it('código de Brevo que no es un formulario', () => {
    editar('src/content/ajustes/general.json', (d) => { d.brevo_newsletter = '<p>hola</p>'; });
    expect(errores()).toMatch(/formulario de Brevo/);
  });

  it('reseña sin texto', () => {
    editar('src/content/resenas/01-jelen.json', (d) => { d.texto = ' '; });
    expect(errores()).toMatch(/Reseña «Jelen».*Reseña.*vacío/);
  });

  it('JSON roto', () => {
    writeFileSync(join(raiz, 'src/content/paginas/contacto.json'), '{ roto');
    expect(errores()).toMatch(/contacto\.json no se puede leer/);
  });

  it('acepta un formulario de Brevo correcto', () => {
    editar('src/content/ajustes/general.json', (d) => {
      d.brevo_newsletter = '<form method="POST" action="https://abc.sibforms.com/serve/MUIF123"><input name="EMAIL"></form>';
    });
    expect(errores()).toBe('');
  });
});
