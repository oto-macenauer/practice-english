const { test, expect } = require('@playwright/test');
const { navigateToModule } = require('../helpers');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Practice English');
  });

  test('all 6 module cards are visible', async ({ page }) => {
    const cards = page.locator('.card-grid .card');
    await expect(cards).toHaveCount(6);

    const expectedModules = ['Vocabulary', 'Grammar', 'Spelling', 'Reading', 'Listening', 'Practice Tests'];
    for (const name of expectedModules) {
      await expect(page.locator(`.card-grid .card h2:has-text("${name}")`)).toBeVisible();
    }
  });

  test('each card image loads without errors', async ({ page }) => {
    const images = page.locator('.card-grid .card img.card-img');
    const count = await images.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible();
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('each card links to the correct module URL', async ({ page }) => {
    const expectedLinks = [
      { text: 'Vocabulary', href: 'modules/vocabulary/index.html' },
      { text: 'Grammar', href: 'modules/grammar/index.html' },
      { text: 'Spelling', href: 'modules/spelling/index.html' },
      { text: 'Reading', href: 'modules/reading/index.html' },
      { text: 'Listening', href: 'modules/listening/index.html' },
      { text: 'Practice Tests', href: 'modules/practice-tests/index.html' },
    ];

    for (const { text, href } of expectedLinks) {
      const card = page.locator(`.card-grid a.card:has(h2:has-text("${text}"))`);
      await expect(card).toHaveAttribute('href', href);
    }
  });

  test('navigation bar has all module links', async ({ page }) => {
    const nav = page.locator('header nav');
    const links = nav.locator('a');
    await expect(links).toHaveCount(6);

    const expectedNavLinks = ['Vocabulary', 'Grammar', 'Spelling', 'Reading', 'Listening', 'Practice Tests'];
    for (const name of expectedNavLinks) {
      await expect(nav.locator(`a:has-text("${name}")`)).toBeVisible();
    }
  });
});
