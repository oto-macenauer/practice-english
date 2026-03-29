/**
 * Shared utilities for Practice English modules.
 */

// Ensure trailing slash on directory URLs so relative paths resolve correctly.
// Static servers like `serve` may serve /modules/unit6 without redirecting to
// /modules/unit6/, which breaks relative resource loading.
(function () {
  const p = location.pathname;
  if (!p.endsWith("/") && !p.includes(".")) {
    location.replace(p + "/" + location.search + location.hash);
  }
})();

const App = (() => {
  /**
   * Pick a random element from an array.
   */
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Shuffle an array in place (Fisher-Yates) and return it.
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Show feedback element with a message.
   */
  function showFeedback(el, correct, message) {
    el.textContent = message;
    el.className = "feedback " + (correct ? "correct" : "incorrect");
  }

  /**
   * Hide a feedback element.
   */
  function hideFeedback(el) {
    el.className = "feedback";
    el.textContent = "";
  }

  /**
   * Load a JSON data file relative to the current page.
   */
  async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  // ========== Score Persistence ==========

  /**
   * Save a score to localStorage, keeping the best result (highest %).
   * For practice tests, pass an optional `grade` (1–5).
   */
  function saveScore(module, unit, section, score, total, grade) {
    const key = "scores";
    const scores = JSON.parse(localStorage.getItem(key) || "{}");
    const id = module + "/" + unit + "/" + section;
    const existing = scores[id];
    if (!existing || score / total > existing.score / existing.total) {
      scores[id] = { score: score, total: total, date: new Date().toISOString() };
      if (grade !== undefined) scores[id].grade = grade;
    }
    localStorage.setItem(key, JSON.stringify(scores));
  }

  /**
   * Return scores for a module prefix, or all scores if no argument.
   */
  function getScores(module) {
    const scores = JSON.parse(localStorage.getItem("scores") || "{}");
    if (!module) return scores;
    const filtered = {};
    for (const [k, v] of Object.entries(scores)) {
      if (k.startsWith(module + "/")) filtered[k] = v;
    }
    return filtered;
  }

  /**
   * Clear all saved scores.
   */
  function clearScores() {
    localStorage.removeItem("scores");
  }

  // ========== Difficulty ==========

  function getDifficulty() {
    return localStorage.getItem("difficulty") || "medium";
  }

  function setDifficulty(level) {
    localStorage.setItem("difficulty", level);
  }

  function getQuestionCount(level) {
    return { easy: 3, medium: 5, hard: 10 }[level || getDifficulty()] || 5;
  }

  /**
   * Build and return a difficulty-selector element.
   * Call this inside renderPicker() and append it before the Start button.
   */
  function buildDifficultySelector() {
    const wrap = document.createElement("div");
    wrap.className = "difficulty-selector";

    const label = document.createElement("span");
    label.textContent = "Difficulty:";
    wrap.appendChild(label);

    const current = getDifficulty();
    ["easy", "medium", "hard"].forEach((lvl) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "diff-btn" + (lvl === current ? " active" : "");
      btn.dataset.level = lvl;
      btn.textContent = lvl.charAt(0).toUpperCase() + lvl.slice(1);
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        setDifficulty(lvl);
      });
      wrap.appendChild(btn);
    });

    return wrap;
  }

  return { pickRandom, shuffle, showFeedback, hideFeedback, loadJSON, saveScore, getScores, clearScores, getDifficulty, setDifficulty, getQuestionCount, buildDifficultySelector };
})();
