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
    sources: [
      "1804 年，Jacquard 提花机用打孔卡控制织布图案，被视为早期可编程机器的代表。",
      "1890 年，Herman Hollerith 的制表机用打孔卡处理美国人口普查数据，后来发展成为 IBM。",
      "5 位二进制可以表示 32 个状态，足够放下 26 个英文字母。",
    ],
    render(root, api) {
      root.innerHTML = `<div class="room room-punch">
        <div class="room-sign">里昂 · 1804<span>Jacquard 工坊 · 第 1 站</span></div>
        <div class="punch-workbench">
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
            <div class="card-instruction">
              <span class="ci-derive" data-derivation>B 是字母表第 2 个 · 2 写成 5 位二进制 = 00010</span>
              <span class="ci-how">每一列选一个孔：读到 <code>0</code> 打上面，读到 <code>1</code> 打下面</span>
            </div>
            <div class="binary-readout"><span data-target-code>00010</span></div>
            <div class="hole-grid" data-holes>${holesHtml}</div>
            <div class="woven-stamp">WOVEN</div>
          </div>
          <div class="bench">
            <div class="bench-slot">
              <label for="punch-letter">代号首字母</label>
              <select id="punch-letter" data-letter-select>${options}</select>
            </div>
            <button class="lever" type="button" data-read>读卡</button>
            <button class="bench-btn" type="button" data-reset>重置孔位</button>
            <button class="bench-note" type="button" data-sources>编码表 · 史料</button>
          </div>
        </div>
      </div>`;

      const card = root.querySelector("[data-card]");
      const loom = root.querySelector("[data-loom]");
      const letterEl = root.querySelector("[data-letter]");
      const targetEl = root.querySelector("[data-target-code]");
      const derivationEl = root.querySelector("[data-derivation]");
      const select = root.querySelector("[data-letter-select]");
      const readBtn = root.querySelector("[data-read]");
      const resetBtn = root.querySelector("[data-reset]");
      const holeButtons = Array.from(root.querySelectorAll(".hole"));

      const travelerInitial = (CTM.state.traveler.match(/[A-Za-z]/) || ["B"])[0].toUpperCase();
      const local = {
        letter: travelerInitial,
        target: bitsForLetter(travelerInitial),
        current: [null, null, null, null, null],
        errors: 0,
        locked: false,
        timer: null,
        cancelled: false,
      };

      const renderTarget = () => {
        const code = local.target.join("");
        const order = local.letter.charCodeAt(0) - 64;
        letterEl.textContent = local.letter;
        targetEl.textContent = code;
        derivationEl.textContent = `${local.letter} 是字母表第 ${order} 个 · ${order} 写成 5 位二进制 = ${code}`;
      };

      select.value = local.letter;
      renderTarget();

      const clearHints = () => holeButtons.forEach((button) => button.classList.remove("is-target"));

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
        renderTarget();
        resetHoles();
        api.toast(`目标换成了 ${local.letter}：${local.target.join("")}`);
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
      };

      const onRead = () => {
        if (local.locked) return;
        if (local.current.some((value) => value === null)) {
          api.toast("还有孔位没打。每一列都要选 0 或 1。");
          CTM.audio.error();
          return;
        }
        const correct = local.current.every((value, index) => value === local.target[index]);
        if (!correct) {
          local.errors += 1;
          if (local.errors === 1) api.cheat("5 位二进制不用自己会算 —— 可以让 Agent 替你打孔。");
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
        CTM.audio.loom();
        const score = { manual: Math.max(8, 20 - local.errors * 3), systems: 5 };
        local.timer = setTimeout(
          () =>
            !local.cancelled &&
            api.complete(score, { letter: local.letter, errors: local.errors }, { continueLabel: "前往 1945 →" }),
          1000
        );
      };

      const onReset = () => {
        if (local.locked) return;
        resetHoles();
        api.toast("孔位已清空。");
        CTM.audio.click();
      };

      select.addEventListener("change", onChangeLetter);
      holeButtons.forEach((button) => button.addEventListener("click", onHoleClick));
      readBtn.addEventListener("click", onRead);
      resetBtn.addEventListener("click", onReset);

      return () => {
        local.cancelled = true;
        if (local.timer) clearTimeout(local.timer);
        select.removeEventListener("change", onChangeLetter);
        holeButtons.forEach((button) => button.removeEventListener("click", onHoleClick));
        readBtn.removeEventListener("click", onRead);
        resetBtn.removeEventListener("click", onReset);
      };
    },
  });
})(window.CTM = window.CTM || {});
