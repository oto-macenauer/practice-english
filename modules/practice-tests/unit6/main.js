(async () => {
  const SECTION_META = {
    modals:        { icon: "📋", color: "blue" },
    maps:          { icon: "🗺️", color: "teal" },
    subjects:      { icon: "🏫", color: "purple" },
    "good-at":     { icon: "⭐", color: "orange" },
    "tech-vocab":  { icon: "💻", color: "indigo" },
    cappadocia:    { icon: "📖", color: "sky" },
    "the-project": { icon: "📚", color: "emerald" },
  };

  const data = await App.loadJSON("data.json");
  const PICK = data.questionsPerSection || 5;
  const area = document.getElementById("test-area");
  const scoreEl = document.getElementById("score");
  const totalEl = document.getElementById("total");

  let totalCorrect = 0;
  let totalQuestions = 0;

  data.sections.forEach((section) => {
    const meta = SECTION_META[section.id] || { icon: "📄", color: "blue" };

    const block = document.createElement("div");
    block.className = "section-block";
    block.dataset.color = meta.color;

    // --- header ---
    const hdr = document.createElement("div");
    hdr.className = "section-header";
    hdr.innerHTML =
      `<div class="section-title"><span class="icon">${meta.icon}</span><h2>${esc(section.title)}</h2></div>` +
      `<span class="section-score"></span>`;
    block.appendChild(hdr);

    // --- body ---
    const body = document.createElement("div");
    body.className = "section-body";
    body.innerHTML = `<p class="instructions">${esc(section.instructions)}</p>`;

    const items = []; // per-section answer trackers

    if (section.type === "fill-choice") {
      const questions = App.shuffle([...section.questions]).slice(0, PICK);
      questions.forEach((q, qi) => {
        body.appendChild(buildChoiceQuestion(qi, q, items));
      });
    }

    if (section.type === "match") {
      // Pick pairs with unique answers so the dropdown has no duplicates
      const shuffled = App.shuffle([...section.pairs]);
      const seen = new Set();
      const pairs = [];
      for (const p of shuffled) {
        if (!seen.has(p.answer) && pairs.length < PICK) {
          seen.add(p.answer);
          pairs.push(p);
        }
      }
      const answers = App.shuffle(pairs.map((p) => p.answer));
      pairs.forEach((p, pi) => {
        body.appendChild(buildMatchQuestion(pi, p, answers, section.id, items));
      });
    }

    if (section.type === "fill-write") {
      const questions = App.shuffle([...section.questions]).slice(0, PICK);
      questions.forEach((q, qi) => {
        body.appendChild(buildWriteQuestion(qi, q, items));
      });
    }

    if (section.type === "reading") {
      // Show passage
      const passageDiv = document.createElement("div");
      passageDiv.className = "reading-passage";
      passageDiv.innerHTML = section.passage
        .split("\n\n")
        .map((p) => `<p>${esc(p)}</p>`)
        .join("");
      body.appendChild(passageDiv);

      // Show questions (shuffled, picked)
      const questions = App.shuffle([...section.questions]).slice(0, PICK);
      questions.forEach((q, qi) => {
        body.appendChild(buildChoiceQuestion(qi, q, items));
      });
    }

    if (section.type === "gap-fill") {
      body.appendChild(buildGapFill(section, items));
    }

    block.appendChild(body);

    // --- footer with check button ---
    const footer = document.createElement("div");
    footer.className = "section-footer";
    const checkBtn = document.createElement("button");
    checkBtn.className = "btn btn-primary";
    checkBtn.textContent = "Check " + section.title;
    footer.appendChild(checkBtn);
    block.appendChild(footer);

    totalQuestions += items.length;

    checkBtn.addEventListener("click", () => {
      let sectionScore = 0;
      items.forEach((item) => {
        if (item.check()) sectionScore++;
      });
      totalCorrect += sectionScore;

      // Show section score badge
      const badge = hdr.querySelector(".section-score");
      badge.textContent = `${sectionScore} / ${items.length}`;
      badge.style.display = "inline-block";

      // Update total
      scoreEl.textContent = totalCorrect;

      checkBtn.disabled = true;
      checkBtn.textContent = `${sectionScore} / ${items.length} correct`;
    });

    area.appendChild(block);
  });

  totalEl.textContent = totalQuestions;

  // ========== Builders ==========

  function buildChoiceQuestion(index, q, items) {
    const prompt = q.sentence || q.question;
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `<p>${index + 1}. ${esc(prompt)}</p><div class="options"></div><div class="result"></div>` +
      (q.explanation ? `<div class="explanation">${esc(q.explanation)}</div>` : "");
    const optBox = div.querySelector(".options");
    const result = div.querySelector(".result");
    const explEl = div.querySelector(".explanation");
    let selected = null;

    App.shuffle([...q.options]).forEach((opt) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        optBox.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selected = opt;
      });
      optBox.appendChild(btn);
    });

    items.push({
      check() {
        const correct = selected === q.answer;
        optBox.querySelectorAll("button").forEach((b) => {
          b.classList.remove("selected");
          b.disabled = true;
          if (b.textContent === q.answer) b.classList.add("correct");
          else if (b.textContent === selected && !correct) b.classList.add("wrong");
        });
        result.textContent = correct ? "✓ Correct!" : `✗ Answer: ${q.answer}`;
        result.className = "result " + (correct ? "ok" : "fail");
        if (explEl) explEl.style.display = "block";
        return correct;
      },
    });

    return div;
  }

  function buildMatchQuestion(index, p, answers, sectionId, items) {
    const div = document.createElement("div");
    div.className = "question";
    const selectId = `match-${sectionId}-${index}`;
    div.innerHTML =
      `<p>${index + 1}. ${esc(p.prompt)}</p>` +
      `<select id="${selectId}" class="match-select"><option value="">– choose –</option>` +
      answers.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join("") +
      `</select><div class="result"></div>`;

    const sel = div.querySelector("select");
    const result = div.querySelector(".result");

    items.push({
      check() {
        const correct = sel.value === p.answer;
        result.textContent = correct ? "✓ Correct!" : `✗ Answer: ${p.answer}`;
        result.className = "result " + (correct ? "ok" : "fail");
        sel.disabled = true;
        return correct;
      },
    });

    return div;
  }

  function buildWriteQuestion(index, q, items) {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML =
      `<p>${index + 1}. ${esc(q.sentence)}</p>` +
      `<input type="text" placeholder="Type your answer…" autocomplete="off">` +
      `<div class="result"></div>`;

    const input = div.querySelector("input");
    const result = div.querySelector(".result");

    items.push({
      check() {
        const val = input.value.trim();
        const correct = normalize(val) === normalize(q.answer);
        result.textContent = correct ? "✓ Correct!" : `✗ Answer: ${q.answer}`;
        result.className = "result " + (correct ? "ok" : "fail");
        input.disabled = true;
        return correct;
      },
    });

    return div;
  }

  function buildGapFill(section, items) {
    const div = document.createElement("div");
    div.className = "gap-fill-container";

    const wordBank = App.shuffle([...section.wordBank]);

    // Build HTML: replace {N} with <select> dropdowns
    let html = esc(section.text);

    // Escape first, then add selects (we need to work with the escaped text)
    // Re-do: work on raw text, build segments manually
    html = section.text;
    const parts = html.split(/\{(\d+)\}/);
    // parts alternates: text, number, text, number, ...

    const container = document.createElement("div");
    container.className = "gap-fill-text";

    const selectEls = {}; // index -> select element

    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        // Text segment — convert newlines to <br> and escape
        const lines = part.split("\n");
        lines.forEach((line, li) => {
          if (li > 0) container.appendChild(document.createElement("br"));
          container.appendChild(document.createTextNode(line));
        });
      } else {
        // Blank number
        const blankIndex = parseInt(part) - 1;
        const sel = document.createElement("select");
        sel.className = "gap-select";
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "…";
        sel.appendChild(defaultOpt);

        wordBank.forEach((w) => {
          const opt = document.createElement("option");
          opt.value = w;
          opt.textContent = w;
          sel.appendChild(opt);
        });

        selectEls[blankIndex] = sel;
        container.appendChild(sel);
      }
    });

    div.appendChild(container);

    // Add result area
    const resultArea = document.createElement("div");
    resultArea.className = "gap-fill-results";
    div.appendChild(resultArea);

    // Register each blank as an item
    section.blanks.forEach((answer, idx) => {
      items.push({
        check() {
          const sel = selectEls[idx];
          if (!sel) return false;
          const correct = normalize(sel.value) === normalize(answer);
          sel.disabled = true;
          sel.classList.add(correct ? "correct" : "wrong");
          return correct;
        },
      });
    });

    return div;
  }

  // ========== Helpers ==========

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function normalize(str) {
    return str.toLowerCase().replace(/['']/g, "'").replace(/\s+/g, " ").trim();
  }
})();
