import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${PUERTO}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  // Se prueba la web compilada, igual que la que se publica.
  webServer: {
    command: `npm run build && npx astro preview --port ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
