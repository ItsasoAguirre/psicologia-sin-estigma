import { describe, it, expect } from 'vitest';
import { spotify, extracto, analizarBrevo, emailValido, urlValida, anchosPara, rutaVariante, srcsetPara } from '../../src/lib/utilidades.js';

describe('imágenes responsive', () => {
  it('no agranda imágenes pequeñas', () => {
    expect(anchosPara(700)).toEqual([160, 320, 640, 700]);
    expect(anchosPara(120)).toEqual([120]);
  });
  it('limita las grandes a 1600', () => expect(anchosPara(4000)).toEqual([160, 320, 640, 1024, 1600]));
  it('ruta de la versión WebP', () => {
    expect(rutaVariante('/uploads/retiros/foto 1.JPG', 320)).toBe('/uploads/_v/320/retiros/foto 1.webp');
    expect(rutaVariante('/uploads/icono.svg', 480)).toBeNull();
    expect(rutaVariante('https://otra.com/a.jpg', 480)).toBeNull();
  });
  it('srcset con espacios codificados', () => {
    expect(srcsetPara('/uploads/foto 1.jpg', 500)).toBe('/uploads/_v/160/foto%201.webp 160w, /uploads/_v/320/foto%201.webp 320w, /uploads/_v/500/foto%201.webp 500w');
    expect(srcsetPara('/uploads/a.gif', 500)).toBeUndefined();
  });
});

describe('spotify', () => {
  it('convierte un enlace de episodio en reproductor', () => {
    expect(spotify('https://open.spotify.com/episode/54kefDZXojTIH2VAEJdNSP?si=abc'))
      .toBe('https://open.spotify.com/embed/episode/54kefDZXojTIH2VAEJdNSP');
  });
  it('acepta enlaces con idioma (intl-es)', () => {
    expect(spotify('https://open.spotify.com/intl-es/episode/ABC123')).toBe('https://open.spotify.com/embed/episode/ABC123');
  });
  it('devuelve null si no es de Spotify', () => {
    expect(spotify('https://www.ivoox.com/algo')).toBeNull();
    expect(spotify('')).toBeNull();
    expect(spotify(undefined)).toBeNull();
  });
});

describe('extracto', () => {
  it('no corta textos cortos', () => expect(extracto('Hola, Sonia')).toBe('Hola, Sonia'));
  it('corta por palabra completa y añade puntos suspensivos', () => {
    const r = extracto('palabra '.repeat(30), 20);
    expect(r.endsWith('…')).toBe(true);
    expect(r).not.toMatch(/\s…$/);
    expect(r.length).toBeLessThanOrEqual(21);
  });
  it('quita el formato markdown', () => expect(extracto('**Muy** _bien_')).toBe('Muy bien'));
  it('deja solo el texto de los enlaces', () => {
    expect(extracto('Escríbenos a [mi correo](mailto:a@b.es) ya')).toBe('Escríbenos a mi correo ya');
  });
});

describe('analizarBrevo', () => {
  const codigo = `<div class="sib-form"><form id="sib-form" method="POST"
    action="https://3a1b2c.sibforms.com/serve/MUIFAAbC-dEf_123==" data-type="subscription">
    <input type="text" id="NOMBRE" name="NOMBRE" /><input type="text" id="EMAIL" name="EMAIL" />
    <input type="checkbox" value="1" id="OPT_IN" name="OPT_IN" /></form></div>`;

  it('saca la dirección y los campos del código de Brevo', () => {
    expect(analizarBrevo(codigo)).toEqual({
      accion: 'https://3a1b2c.sibforms.com/serve/MUIFAAbC-dEf_123==',
      campoNombre: 'NOMBRE',
      tieneOptIn: true,
      tieneCaptcha: false,
    });
  });
  it('acepta solo la dirección', () => {
    expect(analizarBrevo('https://xyz.sibforms.com/serve/ABC').accion).toBe('https://xyz.sibforms.com/serve/ABC');
  });
  it('detecta el captcha', () => {
    expect(analizarBrevo(codigo + '<div class="g-recaptcha" data-sitekey="x"></div>').tieneCaptcha).toBe(true);
  });
  it('devuelve null si está vacío y sin acción si no es de Brevo', () => {
    expect(analizarBrevo('')).toBeNull();
    expect(analizarBrevo('<iframe src="https://otra.com"></iframe>').accion).toBeNull();
  });
});

describe('validaciones básicas', () => {
  it('emails', () => {
    expect(emailValido('psicologiasinestigma@cop.es')).toBe(true);
    expect(emailValido('sin-arroba.es')).toBe(false);
  });
  it('urls', () => {
    expect(urlValida('https://instagram.com/x')).toBe(true);
    expect(urlValida('instagram.com/x')).toBe(false);
    expect(urlValida('javascript:alert(1)')).toBe(false);
  });
});
