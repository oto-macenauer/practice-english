const { test, expect } = require('@playwright/test');
const { navigateToModule, startQuiz, answerAllWriteQuestions } = require('../helpers');

test.describe('Spelling module', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/modules/spelling/index.html');
  });

  test('topic picker shows units 5, 6 and 7', async ({ page }) => {
    const unitHeaders = page.locator('.picker-unit-header');
    const count = await unitHeaders.count();
    expect(count).toBe(3);

    const text = await unitHeaders.allTextContents();
    expect(text.join(' ')).toContain('Unit 5');
    expect(text.join(' ')).toContain('Unit 6');
    expect(text.join(' ')).toContain('Unit 7');
  });

  test('selecting topics and clicking Start loads sections', async ({ page }) => {
    await startQuiz(page, 'Start Spelling');

    const sections = page.locator('.section-block');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('each question has a Listen button and a text input', async ({ page }) => {
    await startQuiz(page, 'Start Spelling');

    const questions = page.locator('.question');
    const qCount = await questions.count();
    expect(qCount).toBeGreaterThanOrEqual(1);

    // Check first question has a Listen button
    const firstQ = questions.first();
    const listenBtn = firstQ.locator('.listen-btn');
    await expect(listenBtn).toBeVisible();
    await expect(listenBtn).toContainText('Listen');

    // Check first question has a text input
    const input = firstQ.locator('input[type="text"]');
    await expect(input).toBeVisible();
  });

  test('each question shows a hint', async ({ page }) => {
    await startQuiz(page, 'Start Spelling');

    const firstQ = page.locator('.question').first();
    // Hint is a <p> with muted text inside the question
    const hintText = await firstQ.locator('p').textContent();
    expect(hintText.length).toBeGreaterThan(0);
  });

  test('typing an answer and clicking Check shows correct/wrong feedback', async ({ page }) => {
    await startQuiz(page, 'Start Spelling');

    const firstSection = page.locator('.section-block').first();
    const firstQ = firstSection.locator('.question').first();

    // Type a wrong answer
    const input = firstQ.locator('input[type="text"]');
    await input.fill('xyzwrongword');

    // Answer remaining questions so we can check the section
    await answerAllWriteQuestions(firstSection);

    // Click Check button
    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    // Result feedback should appear
    const result = firstQ.locator('.result');
    await expect(result).not.toHaveText('');
    // The wrong answer should show the fail class with the correct answer
    await expect(result).toHaveClass(/fail/);
  });

  test('score bar updates after checking', async ({ page }) => {
    await startQuiz(page, 'Start Spelling');

    // Total should be set (number of questions)
    const totalEl = page.locator('#total');
    const totalText = await totalEl.textContent();
    expect(parseInt(totalText)).toBeGreaterThan(0);

    // Answer all questions in first section and check
    const firstSection = page.locator('.section-block').first();
    await answerAllWriteQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    // Check button should be disabled
    await expect(checkBtn).toBeDisabled();

    // Section score badge should appear
    const badge = firstSection.locator('.section-score');
    await expect(badge).toBeVisible();
  });
});
