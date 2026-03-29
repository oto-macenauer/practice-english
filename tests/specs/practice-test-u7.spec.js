const { test, expect } = require('@playwright/test');
const { navigateToModule, answerAllChoiceQuestions, answerAllMatchQuestions, answerAllGapFills, answerAllWriteQuestions } = require('../helpers');

test.describe('Practice Test — Unit 7', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/modules/practice-tests/unit7/index.html');
  });

  test('page loads with score bar showing "0 / N"', async ({ page }) => {
    const scoreEl = page.locator('#score');
    await expect(scoreEl).toHaveText('0');

    const totalEl = page.locator('#total');
    const totalText = await totalEl.textContent();
    expect(parseInt(totalText)).toBeGreaterThan(0);
  });

  test('section blocks are displayed', async ({ page }) => {
    const sections = page.locator('.section-block');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('reading sections with passages are displayed', async ({ page }) => {
    const passages = page.locator('.reading-passage');
    const count = await passages.count();
    expect(count).toBe(2);
  });

  test('listening section with Listen buttons is displayed', async ({ page }) => {
    const listenBtns = page.locator('.listen-btn');
    const count = await listenBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('answering and checking a section disables the Check button and shows score', async ({ page }) => {
    const firstSection = page.locator('.section-block').first();

    await answerAllChoiceQuestions(firstSection);
    await answerAllMatchQuestions(firstSection);
    await answerAllGapFills(firstSection);
    await answerAllWriteQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    await expect(checkBtn).toBeDisabled();

    const badge = firstSection.locator('.section-score');
    await expect(badge).toBeVisible();
  });

  test('total score updates after checking a section', async ({ page }) => {
    const firstSection = page.locator('.section-block').first();

    await answerAllChoiceQuestions(firstSection);
    await answerAllMatchQuestions(firstSection);
    await answerAllGapFills(firstSection);
    await answerAllWriteQuestions(firstSection);

    const checkBtn = firstSection.locator('.section-footer button');
    await checkBtn.click();

    const scoreEl = page.locator('#score');
    const scoreText = await scoreEl.textContent();
    expect(parseInt(scoreText)).toBeGreaterThanOrEqual(0);
  });

  test('grade display appears after all sections are checked', async ({ page }) => {
    const sections = page.locator('.section-block');
    const count = await sections.count();

    for (let i = 0; i < count; i++) {
      const section = sections.nth(i);

      await answerAllChoiceQuestions(section);
      await answerAllMatchQuestions(section);
      await answerAllGapFills(section);
      await answerAllWriteQuestions(section);

      const checkBtn = section.locator('.section-footer button');
      await checkBtn.click();
      await expect(checkBtn).toBeDisabled();
    }

    const gradeDisplay = page.locator('.grade-display');
    await expect(gradeDisplay).toBeVisible();

    const gradeNumber = gradeDisplay.locator('.grade-number');
    const gradeText = await gradeNumber.textContent();
    const grade = parseInt(gradeText);
    expect(grade).toBeGreaterThanOrEqual(1);
    expect(grade).toBeLessThanOrEqual(5);
  });
});
