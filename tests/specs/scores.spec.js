const { test, expect } = require('@playwright/test');
const { navigateToModule } = require('../helpers');

test.describe('Score tracking (localStorage)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await navigateToModule(page, '/');
    await page.evaluate(() => localStorage.clear());
  });

  test('App.saveScore stores data in localStorage', async ({ page }) => {
    const stored = await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit6', 'animals', 5, 10);
      return JSON.parse(localStorage.getItem('scores'));
    });

    expect(stored).toBeTruthy();
    expect(stored['vocabulary/unit6/animals']).toBeTruthy();
    expect(stored['vocabulary/unit6/animals'].score).toBe(5);
    expect(stored['vocabulary/unit6/animals'].total).toBe(10);
    expect(stored['vocabulary/unit6/animals'].date).toBeTruthy();
  });

  test('App.saveScore keeps the best score (highest %)', async ({ page }) => {
    const stored = await page.evaluate(() => {
      App.saveScore('grammar', 'unit5', 'tenses', 3, 10);
      App.saveScore('grammar', 'unit5', 'tenses', 8, 10);
      return JSON.parse(localStorage.getItem('scores'));
    });

    expect(stored['grammar/unit5/tenses'].score).toBe(8);
    expect(stored['grammar/unit5/tenses'].total).toBe(10);
  });

  test('App.saveScore does not overwrite a better score with a worse one', async ({ page }) => {
    const stored = await page.evaluate(() => {
      App.saveScore('grammar', 'unit5', 'tenses', 9, 10);
      App.saveScore('grammar', 'unit5', 'tenses', 4, 10);
      return JSON.parse(localStorage.getItem('scores'));
    });

    expect(stored['grammar/unit5/tenses'].score).toBe(9);
  });

  test('App.saveScore stores grade when provided', async ({ page }) => {
    const stored = await page.evaluate(() => {
      App.saveScore('practice-tests', 'unit6', '_total', 40, 50, 2);
      return JSON.parse(localStorage.getItem('scores'));
    });

    expect(stored['practice-tests/unit6/_total'].grade).toBe(2);
  });

  test('App.getScores retrieves all stored scores', async ({ page }) => {
    const scores = await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit5', 'food', 7, 10);
      App.saveScore('grammar', 'unit6', 'modals', 4, 5);
      return App.getScores();
    });

    expect(Object.keys(scores)).toHaveLength(2);
    expect(scores['vocabulary/unit5/food']).toBeTruthy();
    expect(scores['grammar/unit6/modals']).toBeTruthy();
  });

  test('App.getScores filters by module prefix', async ({ page }) => {
    const vocabScores = await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit5', 'food', 7, 10);
      App.saveScore('vocabulary', 'unit6', 'animals', 8, 10);
      App.saveScore('grammar', 'unit6', 'modals', 4, 5);
      return App.getScores('vocabulary');
    });

    expect(Object.keys(vocabScores)).toHaveLength(2);
    expect(vocabScores['vocabulary/unit5/food']).toBeTruthy();
    expect(vocabScores['vocabulary/unit6/animals']).toBeTruthy();
  });

  test('App.getScores returns empty object when no scores exist', async ({ page }) => {
    const scores = await page.evaluate(() => App.getScores());
    expect(Object.keys(scores)).toHaveLength(0);
  });

  test('App.clearScores removes all scores', async ({ page }) => {
    const scores = await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit5', 'food', 7, 10);
      App.saveScore('grammar', 'unit6', 'modals', 4, 5);
      App.clearScores();
      return App.getScores();
    });

    expect(Object.keys(scores)).toHaveLength(0);
    const raw = await page.evaluate(() => localStorage.getItem('scores'));
    expect(raw).toBeNull();
  });
});

test.describe('Homepage progress UI', () => {
  test('Clear progress link is hidden when no scores exist', async ({ page }) => {
    await navigateToModule(page, '/');
    await page.evaluate(() => localStorage.clear());
    await navigateToModule(page, '/');

    const wrap = page.locator('#clear-progress-wrap');
    await expect(wrap).toHaveCSS('display', 'none');
  });

  test('Clear progress link is shown when scores exist', async ({ page }) => {
    // Set a score before navigating to homepage
    await navigateToModule(page, '/');
    await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit6', 'animals', 8, 10);
    });

    // Reload so the homepage script picks up the scores
    await navigateToModule(page, '/');

    const wrap = page.locator('#clear-progress-wrap');
    await expect(wrap).toHaveCSS('display', 'inline');

    const link = page.locator('#clear-progress');
    await expect(link).toBeVisible();
    await expect(link).toHaveText('Clear progress');
  });

  test('Card progress badges appear after scoring', async ({ page }) => {
    await navigateToModule(page, '/');
    await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit6', 'animals', 8, 10);
      App.saveScore('grammar', 'unit5', 'tenses', 5, 5);
    });

    // Reload to render badges
    await navigateToModule(page, '/');

    const vocabBadge = page.locator('[data-module="vocabulary"] .card-progress');
    await expect(vocabBadge).not.toHaveText('');

    const grammarBadge = page.locator('[data-module="grammar"] .card-progress');
    await expect(grammarBadge).not.toHaveText('');

    // Modules with no scores should have empty badges
    const spellingBadge = page.locator('[data-module="spelling"] .card-progress');
    await expect(spellingBadge).toHaveText('');
  });

  test('Card progress badge shows correct format for regular modules', async ({ page }) => {
    await navigateToModule(page, '/');
    await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit6', 'animals', 8, 10);
    });
    await navigateToModule(page, '/');

    const badge = page.locator('[data-module="vocabulary"] .card-progress');
    // Format: "1 topic · 80%"
    await expect(badge).toContainText('1 topic');
    await expect(badge).toContainText('80%');
  });

  test('Card progress badge shows grade for practice tests', async ({ page }) => {
    await navigateToModule(page, '/');
    await page.evaluate(() => {
      App.saveScore('practice-tests', 'unit6', '_total', 40, 50, 2);
    });
    await navigateToModule(page, '/');

    const badge = page.locator('[data-module="practice-tests"] .card-progress');
    await expect(badge).toContainText('U6');
    await expect(badge).toContainText('Grade 2');
  });

  test('Clicking Clear progress removes scores after confirm', async ({ page }) => {
    await navigateToModule(page, '/');
    await page.evaluate(() => {
      App.saveScore('vocabulary', 'unit6', 'animals', 8, 10);
    });
    await navigateToModule(page, '/');

    // Accept the confirm dialog
    page.on('dialog', dialog => dialog.accept());

    await page.locator('#clear-progress').click();

    // After reload, scores should be gone
    await page.waitForLoadState('networkidle');

    const scores = await page.evaluate(() => localStorage.getItem('scores'));
    expect(scores).toBeNull();
  });
});
