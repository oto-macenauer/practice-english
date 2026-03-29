const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 30000,
  retries: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../test-results' }],
  ],
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python -m http.server 8080',
    cwd: path.resolve(__dirname, '..'),
    port: 8080,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
