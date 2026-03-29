const { test, expect } = require('@playwright/test');
const { navigateToModule, startQuiz, answerAllChoiceQuestions } = require('../helpers');

test.describe('Listening module', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/modules/listening/index.html');
  });

  test('topic picker shows units with sections', async ({ page }) => {
    const unitHeaders = page.locator('.picker-unit-header');
    const count = await unitHeaders.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const topics = page.locator('.picker-topic');
    const topicCount = await topics.count();
    expect(topicCount).toBeGreaterThanOrEqual(1);
  });

  test('starting a quiz shows Listen buttons', async ({ page }) => {
    await startQuiz(page, 'Start Listening');

    const listenBtns = page.locator('.listen-btn');
    const count = await listenBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('each question has visible question text and option buttons', async ({ page }) => {
    await startQuiz(page, 'Start Listening');

    const questions = page.locator('.question');
    const count = await questions.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstQ = questions.first();

    // Should have question text
    const questionText = firstQ.locator('p');
    await expect(questionText.first()).toBeVisible();

    // Should have option buttons
    const options = firstQ.locator('.options button');
    const optCount = await options.count();
    expect(optCount).toBeGreaterThanOrEqual(2);
  });

  test('selecting an option and clicking Check shows feedback', async ({ page }) => {
    await startQuiz(page, 'Start Listening');

    const firstSection = page.locator('.section-block').first();
    await answerAllChoiceQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    await expect(checkBtn).toBeDisabled();

    // Result feedback should appear
    const results = firstSection.locator('.question .result');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const text = await results.first().textContent();
    expect(text.length).toBeGreaterThan(0);
  });

  test('score updates after checking', async ({ page }) => {
    await startQuiz(page, 'Start Listening');

    const firstSection = page.locator('.section-block').first();
    await answerAllChoiceQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    // Score element should have a value
    const scoreEl = page.locator('#score');
    const scoreText = await scoreEl.textContent();
    expect(parseInt(scoreText)).toBeGreaterThanOrEqual(0);
  });
});
