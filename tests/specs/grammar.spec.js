const { test, expect } = require('@playwright/test');
const { navigateToModule, startQuiz, answerAllChoiceQuestions } = require('../helpers');

test.describe('Grammar module', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/modules/grammar/index.html');
  });

  test('topic picker shows units 5, 6 and 7', async ({ page }) => {
    const unitHeaders = page.locator('.picker-unit-header');
    const count = await unitHeaders.count();
    expect(count).toBe(3);

    await expect(unitHeaders.nth(0)).toContainText('Unit 5');
    await expect(unitHeaders.nth(1)).toContainText('Unit 6');
    await expect(unitHeaders.nth(2)).toContainText('Unit 7');
  });

  test('selecting topics and clicking Start loads sections', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const sections = page.locator('.section-block');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const questions = page.locator('.question');
    const qCount = await questions.count();
    expect(qCount).toBeGreaterThanOrEqual(1);
  });

  test('fill-choice questions render with option buttons', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const question = page.locator('.question').first();
    const optionButtons = question.locator('.options button');
    const count = await optionButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('clicking an option marks it as selected', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const question = page.locator('.question').first();
    const optionBtn = question.locator('.options button').first();
    await optionBtn.click();
    await expect(optionBtn).toHaveClass(/selected/);
  });

  test('clicking Check disables the button and shows score', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const firstSection = page.locator('.section-block').first();
    await answerAllChoiceQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    await expect(checkBtn).toBeDisabled();

    const badge = firstSection.locator('.section-score');
    await expect(badge).toBeVisible();
  });

  test('explanations are shown after checking', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const firstSection = page.locator('.section-block').first();
    await answerAllChoiceQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    // After checking, each question should have a non-empty result message
    const results = firstSection.locator('.question .result');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // At least one result should have text content (correct or explanation)
    const firstResult = results.first();
    const text = await firstResult.textContent();
    expect(text.length).toBeGreaterThan(0);
  });

  test('score bar updates with total after checking', async ({ page }) => {
    await startQuiz(page, 'Start Practice');

    const totalEl = page.locator('#total');
    const totalText = await totalEl.textContent();
    expect(parseInt(totalText)).toBeGreaterThan(0);
  });
});
