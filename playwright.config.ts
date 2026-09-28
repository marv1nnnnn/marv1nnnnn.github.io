import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    launchOptions: executablePath ? { executablePath } : undefined,
    // The music starts at a visitor's first touch; the tests are a visitor who turned it off,
    // except where they test the sound (home.spec.ts).
    storageState: { cookies: [], origins: [{ origin: BASE_URL, localStorage: [{ name: 'tape-sound', value: 'off' }] }] },
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // The static export, served as GitHub Pages serves it: the dev server compiles each page
        // on its first visit, which can outlast a test's wait for a navigation.
        command: `pnpm build && node scripts/serve-out.js`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
