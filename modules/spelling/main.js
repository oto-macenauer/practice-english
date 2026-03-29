(async () => {
  const data = await App.loadJSON("data.json");
  const PICK = data.questionsPerSection || 10;
  const area = document.getElementById("test-area");
  const scoreBar = document.getElementById("score-bar");
  const scoreEl = document.getElementById("score");
  const totalEl = document.getElementById("total");

  scoreBar.style.display = "none";

  // Check speech synthesis support
  const speechSupported = "speechSynthesis" in window;

  // ========== Topic picker ==========

  renderPicker();

  function renderPicker() {
    const picker = document.createElement("div");
    picker.className = "topic-picker";

    if (!speechSupported) {
      const warn = document.createElement("div");
      warn.className = "no-speech-warning";
      warn.textContent =
        "Your browser does not support speech synthesis. Spelling exercises may not work. Please try Chrome, Edge or Safari.";
      picker.appendChild(warn);
    }

    const heading = document.createElement("p");
    heading.className = "picker-heading";
    heading.textContent = "Select the topics you want to practise:";
    picker.appendChild(heading);

    const allCheckboxes = [];

    data.units.forEach((unit) => {
      const card = document.createElement("div");
      card.className = "picker-unit";
      card.dataset.color = unit.color;

      const header = document.createElement("label");
      header.className = "picker-unit-header";
      const unitCb = document.createElement("input");
      unitCb.type = "checkbox";
      unitCb.checked = true;
      header.appendChild(unitCb);
      header.appendChild(document.createTextNode(" " + unit.title));
      card.appendChild(header);

      const list = document.createElement("div");
      list.className = "picker-topics";

      const sectionCbs = [];

      unit.sections.forEach((section) => {
        const count = section.words ? section.words.length : 0;

        const label = document.createElement("label");
        label.className = "picker-topic";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = true;
        cb.dataset.unitId = unit.id;
        cb.dataset.sectionId = section.id;
        label.appendChild(cb);

        const icon = document.createElement("span");
        icon.className = "topic-icon";
        icon.textContent = section.icon || "\u270d\ufe0f";
        label.appendChild(icon);

        const name = document.createElement("span");
        name.className = "topic-name";
        name.textContent = section.title;
        label.appendChild(name);

        const badge = document.createElement("span");
        badge.className = "topic-count";
        badge.textContent = count + " words";
        label.appendChild(badge);

        list.appendChild(label);
        sectionCbs.push(cb);
        allCheckboxes.push(cb);

        cb.addEventListener("change", () => {
          unitCb.checked = sectionCbs.every((c) => c.checked);
          unitCb.indeterminate =
            !unitCb.checked && sectionCbs.some((c) => c.checked);
          updateStartBtn();
        });
      });

      unitCb.addEventListener("change", () => {
        sectionCbs.forEach((c) => (c.checked = unitCb.checked));
        unitCb.indeterminate = false;
        updateStartBtn();
      });

      card.appendChild(list);
      picker.appendChild(card);
    });

    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary btn-start";
    startBtn.textContent = "Start Spelling";
    picker.appendChild(startBtn);

    function updateStartBtn() {
      const anyChecked = allCheckboxes.some((c) => c.checked);
      startBtn.disabled = !anyChecked;
    }

    startBtn.addEventListener("click", () => {
      const selected = allCheckboxes
        .filter((c) => c.checked)
        .map((c) => ({
          unitId: c.dataset.unitId,
          sectionId: c.dataset.sectionId,
        }));
      picker.remove();
      startQuiz(selected);
    });

    area.appendChild(picker);
  }

  // ========== Quiz ==========

  function startQuiz(selected) {
    scoreBar.style.display = "";

    let totalCorrect = 0;
    let totalQuestions = 0;

    const sections = [];
    selected.forEach(({ unitId, sectionId }) => {
      const unit = data.units.find((u) => u.id === unitId);
      if (!unit) return;
      const section = unit.sections.find((s) => s.id === sectionId);
      if (section) sections.push(section);
    });

    sections.forEach((section) => {
      const block = document.createElement("div");
      block.className = "section-block";
      block.dataset.color = section.color || "blue";

      // header
      const hdr = document.createElement("div");
      hdr.className = "section-header";
      hdr.innerHTML =
        `<div class="section-title"><span class="icon">${section.icon || "\u270d\ufe0f"}</span><h2>${esc(section.title)}</h2></div>` +
        `<span class="section-score"></span>`;
      block.appendChild(hdr);

      // body
      const body = document.createElement("div");
      body.className = "section-body";
      body.innerHTML = `<p class="instructions">${esc(section.instructions)}</p>`;

      const items = [];

      if (section.type === "spell") {
        const words = App.shuffle([...section.words]).slice(0, PICK);
        words.forEach((w, wi) => {
          body.appendChild(buildSpellQuestion(wi, w, items));
        });
      }

      block.appendChild(body);

      // footer
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

        const badge = hdr.querySelector(".section-score");
        badge.textContent = `${sectionScore} / ${items.length}`;
        badge.style.display = "inline-block";

        scoreEl.textContent = totalCorrect;

        checkBtn.disabled = true;
        checkBtn.textContent = `${sectionScore} / ${items.length} correct`;

        const unitId = selected.find((s) => s.sectionId === section.id)?.unitId || "unknown";
        App.saveScore("spelling", unitId, section.id, sectionScore, items.length);
      });

      area.appendChild(block);
    });

    totalEl.textContent = totalQuestions;
  }

  // ========== Builders ==========

  function buildSpellQuestion(index, w, items) {
    const div = document.createElement("div");
    div.className = "question";

    // Listen button row
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "0.5rem";
    row.style.marginBottom = "0.5rem";

    const num = document.createElement("span");
    num.textContent = (index + 1) + ".";
    num.style.fontWeight = "600";
    row.appendChild(num);

    const listenBtn = createListenButton(w.word);
    row.appendChild(listenBtn);

    div.appendChild(row);

    // Hint text
    const hintP = document.createElement("p");
    hintP.textContent = w.hint;
    hintP.style.color = "var(--color-text-muted)";
    hintP.style.fontSize = "0.9rem";
    hintP.style.marginBottom = "0.5rem";
    div.appendChild(hintP);

    // Text input
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type the word\u2026";
    input.autocomplete = "off";
    input.spellcheck = false;
    div.appendChild(input);

    // Result
    const result = document.createElement("div");
    result.className = "result";
    div.appendChild(result);

    items.push({
      check() {
        const answer = normalize(input.value);
        const expected = normalize(w.word);
        const correct = answer === expected;

        input.disabled = true;
        result.textContent = correct
          ? "\u2713 Correct!"
          : `\u2717 Answer: ${w.word}`;
        result.className = "result " + (correct ? "ok" : "fail");
        return correct;
      },
    });

    return div;
  }

  // ========== Speech Synthesis ==========

  function createListenButton(text) {
    const btn = document.createElement("button");
    btn.className = "listen-btn";
    btn.type = "button";
    btn.innerHTML = '<span class="speaker-icon">\ud83d\udd0a</span> Listen';

    btn.addEventListener("click", () => {
      speak(text, btn);
    });

    return btn;
  }

  function speak(text, btn) {
    if (!speechSupported) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.8;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Female")
    ) || voices.find((v) => v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => btn.classList.add("speaking");
    utterance.onend = () => btn.classList.remove("speaking");
    utterance.onerror = () => btn.classList.remove("speaking");

    window.speechSynthesis.speak(utterance);
  }

  // ========== Helpers ==========

  function normalize(str) {
    return str.toLowerCase().trim();
  }

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
})();
