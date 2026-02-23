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

  return { pickRandom, shuffle, showFeedback, hideFeedback, loadJSON };
})();
