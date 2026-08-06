import {defineConfig, devices} from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173/max-and-gym/';

export default defineConfig({
    testDir: './tests',
    outputDir: 'artifacts/playwright/test-results',
    timeout: 45_000,
    expect: {timeout: 8_000},
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['line'], ['html', {outputFolder: 'artifacts/playwright/report', open: 'never'}]] : 'line',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        serviceWorkers: 'allow',
    },
    webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
        command: `"${process.execPath}" scripts/preview.mjs`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
    projects: [
        {name: 'chromium-360', use: {...devices['Desktop Chrome'], viewport: {width: 360, height: 800}}},
        {name: 'chromium-412', use: {...devices['Desktop Chrome'], viewport: {width: 412, height: 915}}},
    ],
});
