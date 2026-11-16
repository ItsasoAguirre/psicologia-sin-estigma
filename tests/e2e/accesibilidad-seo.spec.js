// Accesibilidad (WCAG 2.2 AA con axe-core) y SEO técnico. Se ejecuta con cada cambio,
// así que si un contenido nuevo rompe algo (p. ej. un título vacío), se detecta antes de publicar.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGINAS = [
  '/', '/sobre-mi', '/servicios', '/servicios/psicoterapia', '/servicios/asesoramiento',
  '/servicios/supervisiones', '/servicios/actividades-grupales', '/servicios/retiros',
  '/recursos', '/contacto', '/privacidad', '/aviso-legal',
];

const axe = (page) => new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
  .exclude('iframe'); // reproductores de Spotify y formularios externos

const resumen = (violaciones) => violaciones.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);

test.describe('accesibilidad (axe, WCAG 2.2 AA)', () => {
  for (const ruta of PAGINAS) {
    test(ruta, async ({ page }) => {
      await page.goto(ruta);
      expect(resumen((await axe(page).analyze()).violations)).toEqual([]);
    });
  }

  test('estados abiertos: menú, reseña y desplegable', async ({ page }, testInfo) => {
    await page.goto('/');
    if (testInfo.project.name === 'movil') await page.getByRole('button', { name: 'Menú' }).click();
    await page.getByRole('button', { name: /Servicios/ }).click();
    expect(resumen((await axe(page).analyze()).violations)).toEqual([]);

    await page.keyboard.press('Escape');
    await page.locator('.posit').first().click();
    expect(resumen((await axe(page).analyze()).violations)).toEqual([]);

    await page.goto('/servicios/psicoterapia');
    await page.locator('details.pistas summary').click();
    expect(resumen((await axe(page).analyze()).violations)).toEqual([]);
  });
});

test.describe('SEO técnico', () => {
  test('cada página tiene título, descripción y canónica propios', async ({ page }) => {
    const titulos = new Set();
    const descripciones = new Set();
    for (const ruta of PAGINAS) {
      await page.goto(ruta);
      const titulo = await page.title();
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      const canonica = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(titulo.length, `título de ${ruta}`).toBeGreaterThan(10);
      expect(desc?.length ?? 0, `descripción de ${ruta}`).toBeGreaterThan(50);
      expect(desc.length, `descripción de ${ruta}`).toBeLessThanOrEqual(161);
      expect(new URL(canonica).pathname.replace(/\/$/, '') || '/', `canónica de ${ruta}`).toBe(ruta);
      titulos.add(titulo);
      descripciones.add(desc);
    }
    expect(titulos.size, 'títulos repetidos').toBe(PAGINAS.length);
    expect(descripciones.size, 'descripciones repetidas').toBe(PAGINAS.length);
  });

  test('robots.txt y sitemap.xml', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const ruta of PAGINAS) expect(sitemap).toContain(`${ruta === '/' ? '/' : ruta}</loc>`);
    expect(sitemap).not.toContain('/admin');
  });

  test('datos estructurados válidos en la portada', async ({ page }) => {
    await page.goto('/');
    const json = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(json['@type']).toBe('ProfessionalService');
    expect(json.name).toBeTruthy();
    expect(json.email).toContain('@');
  });

  test('página 404 propia y no indexable', async ({ page }) => {
    const r = await page.goto('/esta-pagina-no-existe');
    expect(r.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Esta página no existe');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});
