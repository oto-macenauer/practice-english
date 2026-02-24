(async () => {
  const data = await App.loadJSON("data.json");
  const PICK = data.questionsPerSection || 5;
  const area = document.getElementById("test-area");
  const scoreBar = document.getElementById("score-bar");
  const scoreEl = document.getElementById("score");
  const totalEl = document.getElementById("total");

  scoreBar.style.display = "none";

  // ========== Topic picker ==========

  renderPicker();

  function renderPicker() {
    const picker = document.createElement("div");
    picker.className = "topic-picker";

    const heading = document.createElement("p");
    heading.className = "picker-heading";
    heading.textContent = "Select the passages you want to read:";
    picker.appendChild(heading);

    const allCheckboxes = [];

    data.units.forEach((unit) => {
      const card = document.createElement("div");
      card.className = "picker-unit";
      card.dataset.color = unit.color;

      // Unit header with toggle-all checkbox
      const header = document.createElement("label");
      header.className = "picker-unit-header";
      const unitCb = document.createElement("input");
      unitCb.type = "checkbox";
      unitCb.checked = true;
      header.appendChild(unitCb);
      header.appendChild(document.createTextNode(" " + unit.title));
      card.appendChild(header);

      // Individual topic checkboxes
      const list = document.createElement("div");
      list.className = "picker-topics";

      const sectionCbs = [];

      unit.sections.forEach((section) => {
        const count = section.questions ? section.questions.length : 0;

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
        icon.textContent = section.icon || "📖";
        label.appendChild(icon);

        const name = document.createElement("span");
        name.className = "topic-name";
        name.textContent = section.title;
        label.appendChild(name);

        const badge = document.createElement("span");
        badge.className = "topic-count";
        badge.textContent = count + " questions";
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

    // Start button
    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary btn-start";
    startBtn.textContent = "Start Reading";
    picker.appendChild(startBtn);

    function updateStartBtn() {
      const anyChecked = allCheckboxes.some((c) => c.checked);
      startBtn.disabled = !anyChecked;
    }

    startBtn.addEventListener("click", () => {
      const selected = allCheckboxes
        .filter((c) => c.checked)
        .map((c) => ({ unitId: c.dataset.unitId, sectionId: c.dataset.sectionId }));
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

    // Collect the selected sections from data
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
        `<div class="section-title"><span class="icon">${section.icon || "📖"}</span><h2>${esc(section.title)}</h2></div>` +
        `<span class="section-score"></span>`;
      block.appendChild(hdr);

      // body
      const body = document.createElement("div");
      body.className = "section-body";
      body.innerHTML = `<p class="instructions">${esc(section.instructions)}</p>`;

      const items = [];

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
      });

      area.appendChild(block);
    });

    totalEl.textContent = totalQuestions;
  }

  // ========== Builders ==========

  function buildChoiceQuestion(index, q, items) {
    const div = document.createElement("div");
    div.className = "question";
    div.innerHTML = `<p>${index + 1}. ${esc(q.question)}</p><div class="options"></div><div class="result"></div>`;
    const optBox = div.querySelector(".options");
    const result = div.querySelector(".result");
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
        return correct;
      },
    });

    return div;
  }

  // ========== Helpers ==========

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
})();
