# Practice English

A static vanilla JavaScript application for English language practice. Designed to be deployed on GitHub Pages with zero build steps. Installable as a PWA on mobile and tablet.

## Live Site

Deployed via GitHub Pages from the `main` branch root (`/`).

## Project Structure

```
practice-english/
├── index.html                    # Landing page with module navigation
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker (offline support)
├── css/
│   └── style.css                 # Shared styles (variables, layout, components)
├── js/
│   └── app.js                    # Shared utilities (shuffle, feedback, data loading)
├── images/
│   ├── icons/                    # PWA icons (192/512, regular + maskable)
│   ├── modules/                  # Homepage module card images
│   ├── topics/                   # Section banner illustrations
│   └── screenshots/              # PWA install screenshots
├── modules/
│   ├── vocabulary/               # Word matching, definitions, context exercises
│   ├── grammar/                  # Grammar exercises (placeholder)
│   ├── spelling/                 # Spelling exercises (placeholder)
│   ├── reading/                  # Reading comprehension with passages
│   ├── listening/                # Listening comprehension with Speech Synthesis API
│   └── practice-tests/
│       ├── unit5/                # Unit 5 test (materials, passive voice, suggestions)
│       ├── unit6/                # Unit 6 test (modals, maps, subjects, technology)
│       └── unit7/                # Unit 7+ test (look like, zero conditional, jobs, adjectives)
├── tools/
│   ├── generate_images.py        # AI image generation script (Together AI / Gemini)
│   ├── take_screenshots.py       # PWA screenshot capture (Playwright)
│   └── requirements.txt          # Python dependencies
└── sources/                      # Textbook reference photos (gitignored)
```

## Modules

| Module         | Description                                                      | Status       |
| -------------- | ---------------------------------------------------------------- | ------------ |
| Vocabulary     | Word–definition matching, fill-in-choice, context exercises      | Units 5-7    |
| Grammar        | Sentence correction, fill-in-the-blank, tense practice           | Placeholder  |
| Spelling       | Dictation-style exercises with speech synthesis                  | Placeholder  |
| Reading        | Short passages with comprehension questions                      | Units 5-7    |
| Listening      | Listen and answer comprehension questions (Speech Synthesis API) | Units 5-7    |
| Practice Tests | Full unit tests with grading (vocabulary, grammar, reading, listening) | Units 5-7 |

## Tech Stack

- **HTML5 / CSS3 / Vanilla JS** — no frameworks, no build tools
- **CSS custom properties** for theming
- **Web Speech Synthesis API** for listening exercises
- **PWA** — installable with offline support
- **ES modules–ready** — `app.js` exposes a global `App` utility object

## Adding a New Module

1. Create a folder under `modules/<module-name>/`.
2. Add an `index.html` that follows the existing module template (shared header/nav, links to `../../css/style.css` and `../../js/app.js`).
3. Optionally add module-specific JS (`modules/<module-name>/main.js`) and data files (JSON) in the same folder.
4. Add a card link on the landing page (`index.html`) and a nav link in every page header.

## Data Format Convention

Each module can store exercise data in a JSON file within its folder (e.g. `modules/vocabulary/data.json`). Load it at runtime with:

```js
const data = await App.loadJSON("data.json");
```

## Image Generation

The `tools/generate_images.py` script generates illustrations using AI (Together AI or Google Gemini). See the script header for usage. Images are committed to the repo as static assets.

## Deployment

1. Push to the `main` branch.
2. In the repository **Settings → Pages**, set source to **Deploy from a branch** and select `main` / `/ (root)`.
3. The site will be available at `https://<username>.github.io/practice-english/`.

## Development

Open `index.html` directly in a browser, or use any local static server:

```bash
# Python
python -m http.server 8000

# Node (npx)
npx serve .
```

## License

This project is released into the public domain under the [Unlicense](LICENSE).
