# CLAUDE.md

## Project overview

Practice English is a static vanilla JavaScript educational app for English language practice. It runs on GitHub Pages at https://oto-macenauer.github.io/practice-english/ with zero build steps. It is a PWA installable on mobile/tablet.

## Tech stack

- HTML5 / CSS3 / Vanilla JS — no frameworks, no bundlers
- CSS custom properties for theming (see `:root` in `css/style.css`)
- Web Speech Synthesis API for listening exercises
- PWA with manifest.json and service worker (sw.js)
- Data stored in JSON files per module
- Python tools for image generation and screenshots (in `tools/`)

## Project structure

- `index.html` — homepage with module cards
- `css/style.css` — shared styles
- `js/app.js` — shared utilities (shuffle, feedback, JSON loading)
- `modules/` — each module has `index.html`, `main.js`, `data.json`
- `modules/practice-tests/unit{5,6,7}/` — practice tests with grading
- `images/` — generated illustrations (modules/, topics/, icons/, screenshots/)
- `tools/` — Python scripts for image generation and Playwright screenshots
- `manifest.json` + `sw.js` — PWA configuration

## Key conventions

- All paths in manifest.json and sw.js use `/practice-english/` prefix (GitHub Pages base URL)
- Question types: `fill-choice`, `match`, `fill-write`, `reading`, `gap-fill`, `listen-comprehension`
- Section data uses `type` field to determine rendering
- Practice tests randomly pick 2 reading sections and show 5 questions per section
- Listening exercises use Speech Synthesis API — the student listens and answers a comprehension question (never "type what you heard")
- Answer option lengths must be balanced (no "longest answer is correct" pattern)
- Button selected state uses light blue background with dark blue text (not white on blue) for mobile accessibility

## Testing requirements

**Before pushing any changes, you MUST run the Playwright tests and verify they pass.**

```bash
# Run all tests (auto-starts local server on port 8080)
npx playwright test --config tests/playwright.config.js

# Run a specific test file
npx playwright test --config tests/playwright.config.js tests/specs/home.spec.js

# View HTML report after tests complete
npx playwright show-report test-results
```

If tests fail:
1. Read the failure output to understand what broke
2. Fix the issue
3. Re-run the tests
4. Only push when all tests are green

If you add new functionality, add corresponding test cases in `tests/specs/`.

## Adding content

When adding a new unit or exercise:
1. Add data to the relevant `data.json` (vocabulary, reading, listening)
2. Add a practice test in `modules/practice-tests/unitN/`
3. Update `modules/practice-tests/index.html` with a card link
4. Ensure the practice test JS has SECTION_META entries for new sections
5. Run tests to verify nothing is broken

## Image generation

Images are generated via `tools/generate_images.py` using Together AI or Google Gemini API. API keys are stored in `.env` (gitignored). Run `python tools/generate_images.py --force` to regenerate. Images are committed as static assets.

## Do not

- Do not add "type what you heard" listening exercises — use comprehension questions only
- Do not use white text on blue background for selected buttons (mobile accessibility issue)
- Do not reference songs or materials not available in the app
- Do not make the longest answer option always the correct one
- Do not push without running tests
