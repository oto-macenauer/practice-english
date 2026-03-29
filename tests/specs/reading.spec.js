const { test, expect } = require('@playwright/test');
const { navigateToModule, startQuiz, answerAllChoiceQuestions } = require('../helpers');

test.describe('Reading module', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/modules/reading/index.html');
  });

  test('topic picker shows available passages', async ({ page }) => {
    const topics = page.locator('.picker-topic');
    const count = await topics.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('starting a quiz displays reading passages with questions', async ({ page }) => {
    await startQuiz(page, 'Start Reading');

    // Section blocks should appear
    const sections = page.locator('.section-block');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each section should have a reading passage
    const passages = page.locator('.reading-passage');
    const passageCount = await passages.count();
    expect(passageCount).toBeGreaterThanOrEqual(1);
  });

  test('passage text is visible', async ({ page }) => {
    await startQuiz(page, 'Start Reading');

    const passage = page.locator('.reading-passage').first();
    await expect(passage).toBeVisible();
    const text = await passage.textContent();
    expect(text.length).toBeGreaterThan(20);
  });

  test('multiple-choice questions are rendered below the passage', async ({ page }) => {
    await startQuiz(page, 'Start Reading');

    const firstSection = page.locator('.section-block').first();
    const questions = firstSection.locator('.question');
    const count = await questions.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each question should have option buttons
    const firstQ = questions.first();
    const options = firstQ.locator('.options button');
    const optCount = await options.count();
    expect(optCount).toBeGreaterThanOrEqual(2);
  });

  test('checking answers shows correct/wrong feedback', async ({ page }) => {
    await startQuiz(page, 'Start Reading');

    const firstSection = page.locator('.section-block').first();
    await answerAllChoiceQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    // Check button should be disabled
    await expect(checkBtn).toBeDisabled();

    // Result feedback should appear on questions
    const results = firstSection.locator('.question .result');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // At least one result should have text
    const firstResult = results.first();
    const text = await firstResult.textContent();
    expect(text.length).toBeGreaterThan(0);
  });
});
