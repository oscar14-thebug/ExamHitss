import { defineConfig, devices } from '@playwright/test';

/**
 * Headless by default. Override with either:
 *   HEADED=1 npm test
 *   npm run test:headed   (uses Playwright's built-in --headed flag)
 */
const isHeaded = process.env.HEADED === '1' || process.env.HEADED === 'true';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],

  use: {
    baseURL: 'https://www.liverpool.com.mx',
    headless: !isHeaded,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: 'es-MX',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
