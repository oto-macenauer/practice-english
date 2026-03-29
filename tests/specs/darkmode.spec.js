const { test, expect } = require('@playwright/test');
const { navigateToModule } = require('../helpers');

test.describe('Dark mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any saved theme before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('theme'));
  });

  test('theme toggle button is visible on the homepage', async ({ page }) => {
    await navigateToModule(page, '/');
    const toggle = page.locator('nav button.theme-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', 'Toggle dark mode');
  });

  test('theme toggle button exists on the vocabulary module page', async ({ page }) => {
    await navigateToModule(page, '/modules/vocabulary/index.html');
    const toggle = page.locator('nav button.theme-toggle');
    await expect(toggle).toBeVisible();
  });

  test('clicking the toggle sets data-theme="dark" on the html element', async ({ page }) => {
    await navigateToModule(page, '/');
    const toggle = page.locator('nav button.theme-toggle');
    await toggle.click();
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');
  });

  test('clicking the toggle again sets data-theme="light"', async ({ page }) => {
    await navigateToModule(page, '/');
    const toggle = page.locator('nav button.theme-toggle');
    // First click -> dark
    await toggle.click();
    // Second click -> light
    await toggle.click();
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');
  });

  test('theme persists in localStorage', async ({ page }) => {
    await navigateToModule(page, '/');
    const toggle = page.locator('nav button.theme-toggle');
    await toggle.click();
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe('dark');
  });

  test('App.initTheme defaults to light when no preference is set', async ({ page }) => {
    // Emulate light color scheme to ensure no system dark preference
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => localStorage.removeItem('theme'));
    // Reload so initTheme runs fresh
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('light');
  });

  test('App.initTheme respects saved theme over system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');
  });

  test('dark mode CSS variables change the background color', async ({ page }) => {
    await navigateToModule(page, '/');

    // Get light mode background
    const lightBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );

    // Toggle to dark
    await page.locator('nav button.theme-toggle').click();

    // Get dark mode background
    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );

    // They must differ
    expect(lightBg).not.toBe(darkBg);
    // Dark background should be the dark value (#0f172a = rgb(15, 23, 42))
    expect(darkBg).toBe('rgb(15, 23, 42)');
  });
});
