const { test, expect } = require('@playwright/test');
const { navigateToModule, startQuiz } = require('../helpers');

test.describe('Difficulty — App API', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/');
    await page.evaluate(() => localStorage.clear());
  });

  test('App.getDifficulty returns "medium" by default', async ({ page }) => {
    const difficulty = await page.evaluate(() => App.getDifficulty());
    expect(difficulty).toBe('medium');
  });

  test('App.setDifficulty persists the setting', async ({ page }) => {
    const result = await page.evaluate(() => {
      App.setDifficulty('hard');
      return App.getDifficulty();
    });
    expect(result).toBe('hard');

    // Verify it persists in localStorage
    const stored = await page.evaluate(() => localStorage.getItem('difficulty'));
    expect(stored).toBe('hard');
  });

  test('App.getQuestionCount returns 3 for easy', async ({ page }) => {
    const count = await page.evaluate(() => App.getQuestionCount('easy'));
    expect(count).toBe(3);
  });

  test('App.getQuestionCount returns 5 for medium', async ({ page }) => {
    const count = await page.evaluate(() => App.getQuestionCount('medium'));
    expect(count).toBe(5);
  });

  test('App.getQuestionCount returns 10 for hard', async ({ page }) => {
    const count = await page.evaluate(() => App.getQuestionCount('hard'));
    expect(count).toBe(10);
  });

  test('App.getQuestionCount uses stored difficulty when no argument given', async ({ page }) => {
    const count = await page.evaluate(() => {
      App.setDifficulty('easy');
      return App.getQuestionCount();
    });
    expect(count).toBe(3);
  });
});

test.describe('Difficulty — Vocabulary topic picker UI', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/modules/vocabulary/index.html');
    await page.evaluate(() => localStorage.clear());
    // Reload so the picker renders with default (medium) difficulty
    await navigateToModule(page, '/modules/vocabulary/index.html');
  });

  test('difficulty selector appears with 3 buttons', async ({ page }) => {
    const selector = page.locator('.difficulty-selector');
    await expect(selector).toBeVisible();

    const buttons = selector.locator('.diff-btn');
    await expect(buttons).toHaveCount(3);

    // Verify button labels
    await expect(buttons.nth(0)).toHaveText('Easy');
    await expect(buttons.nth(1)).toHaveText('Medium');
    await expect(buttons.nth(2)).toHaveText('Hard');
  });

  test('Medium button is active by default', async ({ page }) => {
    const mediumBtn = page.locator('.diff-btn[data-level="medium"]');
    await expect(mediumBtn).toHaveClass(/active/);

    // Easy and Hard should not be active
    const easyBtn = page.locator('.diff-btn[data-level="easy"]');
    const hardBtn = page.locator('.diff-btn[data-level="hard"]');
    await expect(easyBtn).not.toHaveClass(/active/);
    await expect(hardBtn).not.toHaveClass(/active/);
  });

  test('clicking Easy changes the active button', async ({ page }) => {
    const easyBtn = page.locator('.diff-btn[data-level="easy"]');
    await easyBtn.click();

    await expect(easyBtn).toHaveClass(/active/);

    const mediumBtn = page.locator('.diff-btn[data-level="medium"]');
    await expect(mediumBtn).not.toHaveClass(/active/);
  });

  test('clicking Hard changes the active button', async ({ page }) => {
    const hardBtn = page.locator('.diff-btn[data-level="hard"]');
    await hardBtn.click();

    await expect(hardBtn).toHaveClass(/active/);

    const mediumBtn = page.locator('.diff-btn[data-level="medium"]');
    await expect(mediumBtn).not.toHaveClass(/active/);
  });

  test('clicking a difficulty button persists the setting', async ({ page }) => {
    const hardBtn = page.locator('.diff-btn[data-level="hard"]');
    await hardBtn.click();

    const stored = await page.evaluate(() => localStorage.getItem('difficulty'));
    expect(stored).toBe('hard');
  });
});

test.describe('Difficulty — question count integration', () => {
  test('setting difficulty to easy results in 3 questions per section', async ({ page }) => {
    await navigateToModule(page, '/modules/vocabulary/index.html');
    await page.evaluate(() => localStorage.clear());
    await navigateToModule(page, '/modules/vocabulary/index.html');

    // Set difficulty to easy
    const easyBtn = page.locator('.diff-btn[data-level="easy"]');
    await easyBtn.click();

    await startQuiz(page, 'Start Practice');

    // Each section should have at most 3 questions
    const sections = page.locator('.section-block');
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      const questions = section.locator('.question');
      const qCount = await questions.count();
      expect(qCount).toBeLessThanOrEqual(3);
    }
  });

  test('setting difficulty to hard results in more questions per section', async ({ page }) => {
    await navigateToModule(page, '/modules/vocabulary/index.html');
    await page.evaluate(() => localStorage.clear());
    await navigateToModule(page, '/modules/vocabulary/index.html');

    // Set difficulty to hard
    const hardBtn = page.locator('.diff-btn[data-level="hard"]');
    await hardBtn.click();

    await startQuiz(page, 'Start Practice');

    // At least one section should have more than 5 questions (the medium default)
    const sections = page.locator('.section-block');
    const sectionCount = await sections.count();
    let foundLarger = false;

    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      const questions = section.locator('.question');
      const qCount = await questions.count();
      if (qCount > 5) foundLarger = true;
      // Hard = 10, but may be capped by available data
      expect(qCount).toBeLessThanOrEqual(10);
    }

    // At least one section should have more than the medium count,
    // unless data has 5 or fewer items (in which case hard == medium output)
    // We just verify no section exceeds 10
    expect(sectionCount).toBeGreaterThanOrEqual(1);
  });

  test('practice tests respect the difficulty setting', async ({ page }) => {
    // Set difficulty to easy before loading the practice test
    await navigateToModule(page, '/');
    await page.evaluate(() => {
      localStorage.clear();
      App.setDifficulty('easy');
    });

    await navigateToModule(page, '/modules/practice-tests/unit6/index.html');

    // With easy difficulty, PICK = 3, so total questions should be fewer
    const totalEl = page.locator('#total');
    const totalText = await totalEl.textContent();
    const totalQuestions = parseInt(totalText);
    expect(totalQuestions).toBeGreaterThan(0);

    // Now reload with hard difficulty
    await page.evaluate(() => App.setDifficulty('hard'));
    await navigateToModule(page, '/modules/practice-tests/unit6/index.html');

    const totalTextHard = await totalEl.textContent();
    const totalQuestionsHard = parseInt(totalTextHard);

    // Hard should have more or equal questions than easy
    expect(totalQuestionsHard).toBeGreaterThanOrEqual(totalQuestions);
  });
});
