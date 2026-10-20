(function (CTM) {
  "use strict";

  const bitsForLetter = (letter) => {
    const value = letter.charCodeAt(0) - 64;
    return value
      .toString(2)
      .padStart(5, "0")
      .split("")
      .map(Number);
  };

  const options = Array.from({ length: 26 }, (_, index) => {
    const letter = String.fromCharCode(65 + index);
    return `<option value="${letter}">${letter}</option>`;
  }).join("");

  const holesHtml = Array.from({ length: 5 }, (_, column) => {
    return `<div class="hole-col">
      <button class="hole" type="button" data-col="${column}" data-bit="0" aria-label="第 ${column + 1} 位，打 0"><small>0</small></button>
      <button class="hole" type="button" data-col="${column}" data-bit="1" aria-label="第 ${column + 1} 位，打 1"><small>1</small></button>
    </div>`;
  }).join("");

  CTM.eras.push({
    id: "punch",
    label: "打孔卡",
    year: 1804,
    theme: "punch",
    icon: "punch",
    place: "里昂 · 织布工坊",
    intro: "织机在等一张卡片。你把想法打成孔，机器就会记住。",
    task: "打出你代号的首字母",
    taskDesc: "选择 A-Z 中的一个字母，用 5 位二进制在卡片上打孔。读卡器会检查你的孔位。",
    sources: [
      "1804 年，Jacquard 提花机用打孔卡控制织布图案，被视为早期可编程机器的代表。",
      "1890 年，Herman Hollerith 的制表机用打孔卡处理美国人口普查数据，后来发展成为 IBM。",
      "5 位二进制可以表示 32 个状态，足够放下 26 个英文字母。",
    ],
    sceneHtml: `<div class="punch-scene">
      <div class="loom" data-loom aria-hidden="true">
        <div class="loom-beam"></div>
        <div class="loom-beam bottom"></div>
        <div class="threads"></div>
        <div class="shuttle"></div>
      </div>
      <div class="punch-card" data-card>
        <div class="punch-card-head">
          <span class="punch-card-title">JACQUARD 1024 / PUNCH CARD</span>
          <span class="punch-letter" data-letter>B</span>
        </div>
        <div class="binary-readout">
          <span data-target-code>00010</span>
          <small>目标编码 · 5 BIT</small>
        </div>
        <div class="hole-grid" data-holes>${holesHtml}</div>
        <div class="woven-stamp">WOVEN</div>
      </div>
    </div>`,
    panelHtml: `<div class="letter-picker">
        <label for="punch-letter">首字母</label>
        <select id="punch-letter" data-letter-select>${options}</select>
        <span class="picker-note">A=00001 · B=00010 · …</span>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" type="button" data-read>读卡</button>
        <button class="btn btn-ghost" type="button" data-reset>重置孔位</button>
      </div>
      <details class="codebook">
        <summary>5 位编码怎么打？</summary>
        <p>每一位对应卡片上的一列：0 打上面的孔，1 打下面的孔。A=00001，B=00010，C=00011，以此类推，Z=11010。</p>
      </details>`,
    mount(scene, panel, api) {
      const card = scene.querySelector("[data-card]");
      const loom = scene.querySelector("[data-loom]");
      const letterEl = scene.querySelector("[data-letter]");
      const targetEl = scene.querySelector("[data-target-code]");
      const select = panel.querySelector("[data-letter-select]");
      const readBtn = panel.querySelector("[data-read]");
      const resetBtn = panel.querySelector("[data-reset]");
      const holeButtons = Array.from(scene.querySelectorAll(".hole"));

      const travelerInitial = (CTM.state.traveler.match(/[A-Za-z]/) || ["B"])[0].toUpperCase();
      const local = {
        letter: travelerInitial,
        target: bitsForLetter(travelerInitial),
        current: [null, null, null, null, null],
        errors: 0,
        locked: false,
      };

      select.value = local.letter;
      letterEl.textContent = local.letter;
      targetEl.textContent = local.target.join("");

      const clearHints = () => {
        holeButtons.forEach((button) => button.classList.remove("is-target"));
      };

      const renderHoles = () => {
        holeButtons.forEach((button) => {
          const column = Number(button.dataset.col);
          const bit = Number(button.dataset.bit);
          button.classList.toggle("is-punched", local.current[column] === bit);
          button.setAttribute("aria-pressed", String(local.current[column] === bit));
        });
      };

      const resetHoles = () => {
        local.current = [null, null, null, null, null];
        renderHoles();
        clearHints();
      };

      const onChangeLetter = () => {
        if (local.locked) return;
        local.letter = select.value;
        local.target = bitsForLetter(local.letter);
        letterEl.textContent = local.letter;
        targetEl.textContent = local.target.join("");
        resetHoles();
        api.feedback(`目标换成了 ${local.letter}：${local.target.join("")}。`, "");
        CTM.audio.click();
      };

      const onHoleClick = (event) => {
        if (local.locked) return;
        const button = event.currentTarget;
        const column = Number(button.dataset.col);
        const bit = Number(button.dataset.bit);
        local.current[column] = bit;
        renderHoles();
        clearHints();
        CTM.audio.punch();
        api.feedback(`第 ${column + 1} 位已打 ${bit}。`, "");
      };

      const onRead = () => {
        if (local.locked) return;
        if (local.current.some((value) => value === null)) {
          api.feedback("还有孔位没打。每一列都要选 0 或 1。", "error");
          CTM.audio.error();
          return;
        }

        const correct = local.current.every((value, index) => value === local.target[index]);
        if (!correct) {
          local.errors += 1;
          card.classList.remove("is-shaking");
          void card.offsetWidth;
          card.classList.add("is-shaking");
          setTimeout(() => card.classList.remove("is-shaking"), 420);
          CTM.audio.error();

          if (local.errors >= 3) {
            holeButtons.forEach((button) => {
              const column = Number(button.dataset.col);
              const bit = Number(button.dataset.bit);
              if (local.target[column] === bit) button.classList.add("is-target");
            });
            api.feedback("读卡失败。提示：描边的孔位就是目标编码。", "error");
          } else {
            api.feedback("读卡失败：孔位和编码不一致。再对一遍 0 和 1。", "error");
          }

          if (local.errors >= 5) {
            api.feedback(`读卡失败。目标编码是 ${local.target.join("")}，照着打一遍。`, "error");
          }
          return;
        }

        local.locked = true;
        clearHints();
        card.classList.add("is-woven");
        loom.classList.add("is-running");
        readBtn.disabled = true;
        resetBtn.disabled = true;
        select.disabled = true;
        api.feedback("读卡通过。织机开始工作。", "ok");
        CTM.audio.success();

        const score = {
          manual: Math.max(8, 20 - local.errors * 3),
          systems: 5,
        };
        const successHtml = `你打出了 <b>${local.letter}</b> 的 5 位编码 <code>${local.target.join(
          ""
        )}</code>。在 1804 年，这张卡会决定一匹布的图案。`;
        setTimeout(() => api.complete(score, { letter: local.letter, errors: local.errors }, successHtml), 950);
      };

      const onReset = () => {
        if (local.locked) return;
        resetHoles();
        api.feedback("孔位已清空。每一列重新选一次。", "");
        CTM.audio.click();
      };

      select.addEventListener("change", onChangeLetter);
      holeButtons.forEach((button) => button.addEventListener("click", onHoleClick));
      readBtn.addEventListener("click", onRead);
      resetBtn.addEventListener("click", onReset);

      return () => {
        select.removeEventListener("change", onChangeLetter);
        holeButtons.forEach((button) => button.removeEventListener("click", onHoleClick));
        readBtn.removeEventListener("click", onRead);
        resetBtn.removeEventListener("click", onReset);
      };
    },
  });
})(window.CTM = window.CTM || {});
