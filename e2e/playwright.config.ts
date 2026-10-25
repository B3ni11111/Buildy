import { defineConfig, devices } from '@playwright/test';

/**
 * buildy end-to-end tests. They run against the local Docker stack (`docker compose up`), which must
 * have the dev sign-in on (DEV_LOGIN / VITE_DEV_LOGIN, set in docker-compose.override.yml).
 * Each spec creates its own throwaway building through the API and deletes it afterwards, so the
 * tests never touch real data or the "Dev Playground" building.
 */
export default defineConfig({
  testDir: './tests',
  // One shared database: run the specs one at a time.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BUILDY_APP_URL ?? 'http://localhost:8080',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
});
