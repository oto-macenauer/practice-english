const { expect } = require('@playwright/test');

/**
 * Navigate to a module page and wait for it to load.
 */
async function navigateToModule(page, modulePath) {
  await page.goto(modulePath);
  await page.waitForLoadState('networkidle');
}

/**
 * Click the Start button in a topic picker (after checkboxes are set).
 * @param {import('@playwright/test').Page} page
 * @param {string} buttonText - Text of the start button (e.g. "Start Practice")
 */
async function startQuiz(page, buttonText = 'Start') {
  const btn = page.locator(`button:has-text("${buttonText}")`);
  await btn.click();
  await page.waitForSelector('.section-block');
}

/**
 * Answer a fill-choice question by clicking the first option.
 */
async function answerFirstOption(page, questionLocator) {
  const btn = questionLocator.locator('.options button').first();
  await btn.click();
}

/**
 * Click a section's Check button and verify it becomes disabled.
 */
async function checkSection(page, sectionTitle) {
  const btn = page.locator(`button:has-text("Check ${sectionTitle}")`);
  await btn.click();
  await expect(btn).toBeDisabled();
}

/**
 * Answer all fill-choice questions in a section block by clicking the first option.
 */
async function answerAllChoiceQuestions(sectionBlock) {
  const questions = sectionBlock.locator('.question');
  const count = await questions.count();
  for (let i = 0; i < count; i++) {
    const q = questions.nth(i);
    const optionBtn = q.locator('.options button').first();
    if (await optionBtn.count() > 0) {
      await optionBtn.click();
    }
  }
}

/**
 * Answer all match (select) questions in a section block by choosing the first non-empty option.
 */
async function answerAllMatchQuestions(sectionBlock) {
  const selects = sectionBlock.locator('select.match-select');
  const count = await selects.count();
  for (let i = 0; i < count; i++) {
    const sel = selects.nth(i);
    const options = sel.locator('option');
    const optCount = await options.count();
    if (optCount > 1) {
      const value = await options.nth(1).getAttribute('value');
      await sel.selectOption(value);
    }
  }
}

/**
 * Answer all gap-fill selects in a section block.
 */
async function answerAllGapFills(sectionBlock) {
  const selects = sectionBlock.locator('select.gap-select');
  const count = await selects.count();
  for (let i = 0; i < count; i++) {
    const sel = selects.nth(i);
    const options = sel.locator('option');
    const optCount = await options.count();
    if (optCount > 1) {
      const value = await options.nth(1).getAttribute('value');
      await sel.selectOption(value);
    }
  }
}

/**
 * Answer all fill-write (text input) questions in a section block.
 */
async function answerAllWriteQuestions(sectionBlock) {
  const inputs = sectionBlock.locator('input[type="text"]');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill('test answer');
  }
}

module.exports = {
  navigateToModule,
  startQuiz,
  answerFirstOption,
  checkSection,
  answerAllChoiceQuestions,
  answerAllMatchQuestions,
  answerAllGapFills,
  answerAllWriteQuestions,
};
