import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const shouldSkipWebServer = process.env.SKIP_WEBSERVER === '1' || process.env.SKIP_WEBSERVER === 'true';

// ponytail: single CDP endpoint builder, add more browsers (firefox/webkit) the same way when needed
function bsProject(name: string, browser: string) {
  const caps = encodeURIComponent(JSON.stringify({
    browser,
    browser_version: 'latest',
    os: 'Windows',
    os_version: '11',
    name: 'ClinicOS E2E',
    build: process.env.GITHUB_RUN_ID ?? 'local',
    'browserstack.username': process.env.BROWSERSTACK_USERNAME,
    'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY,
  }));
  return { name, use: { connectOptions: { wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${caps}` } } };
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    headless: isCI ? true : false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env.PLAYWRIGHT_BROWSERSTACK === '1' && process.env.BROWSERSTACK_USERNAME ? [bsProject('bs-chrome', 'chrome')] : []),
  ],

  webServer: shouldSkipWebServer
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
