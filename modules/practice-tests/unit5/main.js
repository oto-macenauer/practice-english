(async () => {
  const IMG = "../../../images/topics/";
  const SECTION_META = {
    materials:           { icon: "🧱", color: "amber",   image: IMG + "unit5-passive.webp" },
    properties:          { icon: "⚖️", color: "teal" },
    "made-of":           { icon: "🔧", color: "blue",    image: IMG + "unit5-passive.webp" },
    suggestions:         { icon: "💡", color: "purple" },
    "describing-clothes":{ icon: "👗", color: "rose" },
    listening:           { icon: "🎧", color: "sky" },
    icarus:              { icon: "🪶", color: "orange" },
    "theatre-workshop":  { icon: "🎭", color: "emerald" },
  };

  const READING_PICK = 2;

  const data = await App.loadJSON("data.json");
  const PICK = data.questionsPerSection || 5;
  const area = document.getElementById("test-area");
  const scoreEl = document.getElementById("score");
  const totalEl = document.getElementById("total");

  const nonReadingSections = data.sections.filter(s => s.type !== "reading");
  const readingSections = App.shuffle(
    data.sections.filter(s => s.type === "reading")
  ).slice(0, READING_PICK);
  const activeSections = [...nonReadingSections, ...readingSections];

  let totalCorrect = 0;
  let totalQuestions = 0;
  let sectionsChecked = 0;

  activeSections.forEach((section) => {
    const meta = SECTION_META[section.id] || { icon: "📄", color: "blue" };

    const block = document.createElement("div");
    block.className = "section-block";
    block.dataset.color = meta.color;

    // --- image banner ---
    if (meta.image) {
      const img = document.createElement("img");
      img.className = "section-img";
      img.src = meta.image;
      img.alt = "";
      block.appendChild(img);
    }

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

    const items = [];

    if (section.type === "fill-choice") {
      const questions = App.shuffle([...section.questions]).slice(0, PICK);
      questions.forEach((q, qi) => {
        body.appendChild(buildChoiceQuestion(qi, q, items));
      });
    }

    if (section.type === "match") {
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

    if (section.type === "listen-comprehension") {
      const questions = App.shuffle([...section.questions]).slice(0, PICK);
      questions.forEach((q, qi) => {
        body.appendChild(buildListenQuestion(qi, q, items));
      });
    }

    if (section.type === "reading") {
      const passageDiv = document.createElement("div");
      passageDiv.className = "reading-passage";
      passageDiv.innerHTML = section.passage
        .split("\n\n")
        .map((p) => `<p>${esc(p)}</p>`)
        .join("");
      body.appendChild(passageDiv);

      const questions = App.shuffle([...section.questions]).slice(0, PICK);
      questions.forEach((q, qi) => {
        body.appendChild(buildChoiceQuestion(qi, q, items));
      });
    }

    block.appendChild(body);

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

      sectionsChecked++;
      if (sectionsChecked === activeSections.length) {
        showGrade(totalCorrect, totalQuestions);
      }
    });

    area.appendChild(block);
  });

  totalEl.textContent = totalQuestions;

  function showGrade(correct, total) {
    const pct = Math.round((correct / total) * 100);
    let grade, label, color;

    if (pct >= 90) {
      grade = 1; label = "Excellent"; color = "#16a34a";
    } else if (pct >= 75) {
      grade = 2; label = "Very Good"; color = "#2563eb";
    } else if (pct >= 60) {
      grade = 3; label = "Good"; color = "#f59e0b";
    } else if (pct >= 30) {
      grade = 4; label = "Sufficient"; color = "#f97316";
    } else {
      grade = 5; label = "Insufficient"; color = "#dc2626";
    }

    const gradeDiv = document.createElement("div");
    gradeDiv.className = "grade-display";
    gradeDiv.style.borderColor = color;
    gradeDiv.innerHTML =
      `<div class="grade-number" style="background:${color}">${grade}</div>` +
      `<div class="grade-info">` +
        `<div class="grade-label" style="color:${color}">${label}</div>` +
        `<div class="grade-pct">${pct}% — ${correct} out of ${total} correct</div>` +
      `</div>`;

    area.appendChild(gradeDiv);
    gradeDiv.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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

  function buildListenQuestion(index, q, items) {
    const div = document.createElement("div");
    div.className = "question";
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "0.5rem";
    row.style.marginBottom = "0.5rem";
    const num = document.createElement("span");
    num.textContent = (index + 1) + ".";
    num.style.fontWeight = "600";
    row.appendChild(num);
    const listenBtn = document.createElement("button");
    listenBtn.className = "listen-btn";
    listenBtn.type = "button";
    listenBtn.innerHTML = '<span class="speaker-icon">🔊</span> Listen';
    listenBtn.addEventListener("click", () => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(q.sentence);
      u.lang = "en-GB"; u.rate = 0.85;
      const v = window.speechSynthesis.getVoices();
      const ev = v.find(x => x.lang.startsWith("en-GB")) || v.find(x => x.lang.startsWith("en"));
      if (ev) u.voice = ev;
      u.onstart = () => listenBtn.classList.add("speaking");
      u.onend = () => listenBtn.classList.remove("speaking");
      u.onerror = () => listenBtn.classList.remove("speaking");
      window.speechSynthesis.speak(u);
    });
    row.appendChild(listenBtn);
    div.appendChild(row);
    const qp = document.createElement("p");
    qp.textContent = q.question;
    qp.style.fontWeight = "500";
    qp.style.marginBottom = "0.5rem";
    div.appendChild(qp);
    const optBox = document.createElement("div");
    optBox.className = "options";
    const result = document.createElement("div");
    result.className = "result";
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
    div.appendChild(optBox);
    div.appendChild(result);
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

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function normalize(str) {
    return str.toLowerCase().replace(/['']/g, "'").replace(/\s+/g, " ").trim();
  }
})();
