import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const ajustes = JSON.parse(readFileSync('src/content/ajustes/general.json', 'utf8'));

const PAGINAS = [
  '/', '/sobre-mi', '/servicios', '/servicios/psicoterapia', '/servicios/asesoramiento',
  '/servicios/supervisiones', '/servicios/actividades-grupales', '/servicios/retiros',
  '/recursos', '/contacto', '/privacidad', '/aviso-legal',
];

const esMovil = (testInfo) => testInfo.project.name === 'movil';

test.describe('todas las páginas', () => {
  for (const ruta of PAGINAS) {
    test(`${ruta} carga bien, sin errores y sin desbordar`, async ({ page, baseURL }) => {
      const errores = [];
      page.on('pageerror', (e) => errores.push(e.message));
      page.on('console', (m) => {
        // Solo errores de nuestra web (no de Spotify, Google Fonts, etc.)
        if (m.type() === 'error' && (m.location().url ?? '').startsWith(baseURL)) errores.push(m.text());
      });
      const r = await page.goto(ruta);
      expect(r.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page).toHaveTitle(/Psicología sin estigma/);
      // Ninguna imagen rota
      const rotas = await page.locator('main img').evaluateAll((imgs) =>
        imgs.filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src));
      expect(rotas).toEqual([]);
      // Sin scroll horizontal (importante en móvil)
      const desborda = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(desborda).toBe(false);
      expect(errores).toEqual([]);
    });
  }
});

test('ningún enlace interno ni imagen está roto', async ({ page, request }, testInfo) => {
  test.skip(esMovil(testInfo), 'basta con comprobarlo una vez');
  const urls = new Set();
  for (const ruta of PAGINAS) {
    await page.goto(ruta);
    const encontradas = await page.evaluate(() => [
      ...[...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')),
      ...[...document.querySelectorAll('img[src^="/"]')].map((i) => i.getAttribute('src')),
      ...[...document.querySelectorAll('[data-ampliar]')].map((b) => b.getAttribute('data-ampliar')),
    ]);
    encontradas.forEach((u) => urls.add(u.split('#')[0] || '/'));
  }
  const rotas = [];
  for (const u of urls) {
    const r = await request.get(u);
    if (r.status() !== 200) rotas.push(`${u} → ${r.status()}`);
  }
  expect(rotas).toEqual([]);
});

test('menú: Servicios despliega y navega', async ({ page }, testInfo) => {
  await page.goto('/');
  if (esMovil(testInfo)) await page.getByRole('button', { name: 'Menú' }).click();
  await page.getByRole('button', { name: /Servicios/ }).click();
  await page.locator('#submenu-servicios').getByRole('link', { name: 'Retiros' }).click();
  await expect(page).toHaveURL(/\/servicios\/retiros/);
});

test('reseñas: un pósit abre la reseña completa y se cierra', async ({ page }) => {
  await page.goto('/');
  const posit = page.locator('.posit').first();
  const nombre = (await posit.locator('.posit__nombre').textContent()).trim();
  await posit.click();
  const dialogo = page.locator('dialog.resena-dialogo');
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toContainText(`Reseña de ${nombre}`);
  await dialogo.getByRole('button', { name: 'Cerrar' }).click();
  await expect(dialogo).toBeHidden();
});

test('podcast: Spotify solo se carga al pulsar (un botón por episodio)', async ({ page }) => {
  const inicio = JSON.parse(readFileSync('src/content/paginas/inicio.json', 'utf8'));
  await page.route(/spotify(cdn)?\.com|scdn\.co/, (r) => r.abort());
  const peticionesSpotify = [];
  page.on('request', (r) => { if (/spotify/.test(r.url())) peticionesSpotify.push(r.url()); });
  await page.goto('/');
  await page.locator('#podcast').scrollIntoViewIfNeeded();
  await expect(page.locator('#podcast [data-spotify]')).toHaveCount(inicio.podcast.episodios.length);
  await expect(page.locator('#podcast iframe')).toHaveCount(0);
  expect(peticionesSpotify, 'no debe contactar con Spotify antes de pulsar').toEqual([]);
  await page.locator('#podcast [data-spotify] button').first().click();
  await expect(page.locator('#podcast iframe[src*="open.spotify.com/embed/episode/"]')).toHaveCount(1);
});

test('retiros: el carrusel avanza y se puede pausar', async ({ page }) => {
  await page.goto('/servicios/retiros');
  const contador = page.locator('[data-n]');
  await expect(contador).toHaveText('1');
  await page.getByRole('button', { name: 'Foto siguiente' }).click();
  await expect(contador).toHaveText('2');
  const pausa = page.locator('[data-pausa]');
  const antes = await pausa.getAttribute('aria-label');
  await pausa.click();
  await expect(pausa).not.toHaveAttribute('aria-label', antes);
});

test('psicoterapia: el desplegable de pistas se abre', async ({ page }) => {
  await page.goto('/servicios/psicoterapia');
  const pistas = page.locator('details.pistas');
  await expect(pistas.locator('.pistas__lista')).toBeHidden();
  await pistas.locator('summary').click();
  await expect(pistas.locator('.pistas__lista')).toBeVisible();
});

test('newsletter: formulario de Brevo (o aviso si aún no está configurado)', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('form[data-newsletter]');
  if (!ajustes.brevo_newsletter?.trim()) {
    await expect(form).toHaveCount(0);
    await expect(page.locator('#newsletter')).toContainText(ajustes.email);
    return;
  }
  // Simulamos la respuesta de Brevo para no crear suscripciones reales.
  await page.route(/sibforms\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>ok</p>' }));
  await form.getByLabel('Correo electrónico').fill('prueba@example.com');
  // Sin aceptar la política de privacidad no se puede enviar
  expect(await form.evaluate((f) => f.checkValidity())).toBe(false);
  await form.locator('input[name="OPT_IN"]').check();
  expect(await form.evaluate((f) => f.checkValidity())).toBe(true);
  await form.getByRole('button').click();
  await expect(form.locator('.nl__estado')).toHaveAttribute('data-tipo', 'ok');
});

test('panel de edición disponible en /admin', async ({ request }) => {
  const r = await request.get('/admin');
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain('decap-cms');
  expect((await request.get('/admin/config.yml')).status()).toBe(200);
});
