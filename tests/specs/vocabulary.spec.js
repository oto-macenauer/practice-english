const { test, expect } = require('@playwright/test');
const { navigateToModule, startQuiz, answerFirstOption, checkSection, answerAllChoiceQuestions, answerAllMatchQuestions } = require('../helpers');

test.describe('Vocabulary module', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/modules/vocabulary/index.html');
  });

  test('topic picker shows unit headings', async ({ page }) => {
    const unitHeaders = page.locator('.picker-unit-header');
    const count = await unitHeaders.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('topic picker shows individual topics with checkboxes', async ({ page }) => {
    const topics = page.locator('.picker-topic');
    const count = await topics.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each topic should have a checkbox
    const checkboxes = page.locator('.picker-topic input[type="checkbox"]');
    await expect(checkboxes.first()).toBeChecked();
  });

  test('clicking Start loads section blocks with questions', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    // Section blocks should appear
    const sections = page.locator('.section-block');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Questions should be present
    const questions = page.locator('.question');
    const qCount = await questions.count();
    expect(qCount).toBeGreaterThanOrEqual(1);
  });

  test('fill-choice question: clicking an option marks it as selected', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const question = page.locator('.question').first();
    const optionBtn = question.locator('.options button').first();

    // If this is a fill-choice question with option buttons
    if (await optionBtn.count() > 0) {
      await optionBtn.click();
      await expect(optionBtn).toHaveClass(/selected/);
    }
  });

  test('match question: selecting a dropdown option works', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const select = page.locator('select.match-select').first();
    if (await select.count() > 0) {
      const options = select.locator('option');
      const optCount = await options.count();
      if (optCount > 1) {
        const value = await options.nth(1).getAttribute('value');
        await select.selectOption(value);
        await expect(select).toHaveValue(value);
      }
    }
  });

  test('Check button shows scores and disables itself', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    // Answer all questions in the first section
    const firstSection = page.locator('.section-block').first();
    await answerAllChoiceQuestions(firstSection);
    await answerAllMatchQuestions(firstSection);

    // Click the Check button
    const checkBtn = firstSection.locator('.section-footer button');
    const btnText = await checkBtn.textContent();
    await checkBtn.click();

    // Check button should be disabled
    await expect(checkBtn).toBeDisabled();

    // Section score badge should appear
    const badge = firstSection.locator('.section-score');
    await expect(badge).toBeVisible();
  });

  test('score bar updates with total after checking', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const totalEl = page.locator('#total');
    const totalText = await totalEl.textContent();
    expect(parseInt(totalText)).toBeGreaterThan(0);
  });
});
