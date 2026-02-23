# Practice English

A static vanilla JavaScript application for English language practice. Designed to be deployed on GitHub Pages with zero build steps.

## Live Site

Deployed via GitHub Pages from the `main` branch root (`/`).

## Project Structure

```
practice-english/
├── index.html                    # Landing page with module navigation
├── css/
│   └── style.css                 # Shared styles (variables, layout, components)
├── js/
│   └── app.js                    # Shared utilities (shuffle, feedback, data loading)
├── modules/
│   ├── vocabulary/
│   │   └── index.html            # Vocabulary exercises
│   ├── grammar/
│   │   └── index.html            # Grammar exercises
│   ├── spelling/
│   │   └── index.html            # Spelling exercises
│   └── reading/
│       └── index.html            # Reading comprehension exercises
└── README.md
```

## Modules

| Module       | Description                                                      | Status      |
| ------------ | ---------------------------------------------------------------- | ----------- |
| Vocabulary   | Word definitions, synonyms/antonyms, matching exercises          | Placeholder |
| Grammar      | Sentence correction, fill-in-the-blank, tense practice           | Placeholder |
| Spelling     | Dictation-style exercises, commonly misspelled words             | Placeholder |
| Reading      | Short passages with comprehension questions                      | Placeholder |

## Tech Stack

- **HTML5 / CSS3 / Vanilla JS** — no frameworks, no build tools
- **CSS custom properties** for theming
- **ES modules–ready** — `app.js` exposes a global `App` utility object; modules can add their own `<script>` tags
- **Responsive** — mobile-friendly grid layout

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

## Future Roadmap

- [ ] Implement vocabulary module (word–definition matching, multiple choice)
- [ ] Implement grammar module (fill-in-the-blank, error correction)
- [ ] Implement spelling module (audio dictation with Web Speech API)
- [ ] Implement reading module (passages + comprehension questions)
- [ ] Score tracking with localStorage
- [ ] Difficulty levels per module
- [ ] Dark mode toggle

## License

This project is released into the public domain under the [Unlicense](LICENSE).
