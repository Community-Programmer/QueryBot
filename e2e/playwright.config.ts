import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests.
 *
 * These run against the full Docker Compose stack rather than a mocked backend,
 * so they exercise the real auth cookies, the real ownership checks and the
 * real nginx proxy. Start it with `make up` before running them.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,

  // A `.only` left in the source should fail CI rather than silently narrowing
  // the suite to a single test.
  forbidOnly: !!process.env.CI,

  // One retry in CI absorbs genuine flakiness; locally a failure should be
  // reproducible, so none.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Analysis runs invoke a real model and are slow.
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // A representative mobile viewport, since the playground layout is
    // responsive and the rail collapses below `lg`.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
