(function (CTM) {
  "use strict";

  const INSTRUCTIONS = {
    loadA: { text: "LOAD A 3", effect: "A ← 3" },
    loadB: { text: "LOAD B 4", effect: "B ← 4" },
    add: { text: "ADD A B", effect: "A ← A + B" },
    out: { text: "OUT A", effect: "交出 A" },
    sub: { text: "SUB A B", effect: "A ← A - B" },
    jmp: { text: "JMP 0", effect: "跳回第 1 行" },
  };

  const ORDER = ["loadA", "loadB", "add", "out", "sub", "jmp"];
  const SOLUTION = ["loadA", "loadB", "add", "out"];
  const tubes = Array.from({ length: 9 }, () => '<span class="tube"></span>').join("");

  CTM.eras.push({
    id: "register",
    label: "寄存器",
    year: 1945,
    theme: "register",
    icon: "register",
    place: "宾夕法尼亚 · ENIAC",
    sources: [
      "1945 年，ENIAC 在宾夕法尼亚大学建成，是最早的通用电子计算机之一，早期编程依靠开关与接线。",
      "1952 年，Grace Hopper 的 A-0 系统让机器第一次能“翻译”人类写下的符号，被视为早期编译器。",
      "1972 年，Dennis Ritchie 在贝尔实验室发明 C 语言，让“写程序”从硬件接线变成可移植的表达。",
    ],
    render(root, api) {
      root.innerHTML = `<div class="room room-register">
        <div class="machine-plate">ENIAC · 1945<span>Console 02 · 第 2 站</span></div>
        <div class="crt-bay">
          <div class="stencil">任务：把 3 和 4 加起来，交给 OUT<span>目标 OUT = 7</span></div>
          <div class="crt-monitor">
            <div class="crt-top">
              <div class="tube-row" aria-hidden="true">${tubes}</div>
              <div class="crt-tag">PROGRAM CONTROL</div>
            </div>
            <div class="crt-screen">
              <div class="registers">
                <div class="reg" data-reg="A"><div class="reg-name">A</div><div class="reg-val" data-val="A">0</div></div>
                <div class="reg" data-reg="B"><div class="reg-name">B</div><div class="reg-val" data-val="B">0</div></div>
                <div class="reg" data-reg="OUT"><div class="reg-name">OUT</div><div class="reg-val" data-val="OUT">--</div></div>
              </div>
              <div class="crt-log" data-log aria-live="polite">&gt; READY. 等待指令。</div>
            </div>
          </div>
          <div class="machine-brief">
            <b>这台机器怎么跑</b>
            <ul>
              <li>接线板的 01 → 04 就是执行顺序，机器只会从上往下，一行一次。</li>
              <li>A 和 B 是寄存器，初值都是 <code>0</code>；不 LOAD 进去就是 0。</li>
              <li>OUT 是“把结果交出去”，所以它必须接在最后一行。</li>
            </ul>
          </div>
        </div>
        <div class="console-desk">
          <div class="desk-label">接线板 · 4 行程序</div>
          <div class="patch-bay" data-program></div>
          <div class="desk-label">指令开关 · 点一下接一行</div>
          <div class="switchboard" data-tray>${ORDER.map(
            (id) => `<button class="switch" type="button" data-instr="${id}">
              <i></i>
              <span class="switch-body">
                <span class="switch-text">${INSTRUCTIONS[id].text}</span>
                <span class="switch-effect">${INSTRUCTIONS[id].effect}</span>
              </span>
            </button>`
          ).join("")}</div>
          <div class="console-hint" data-hint hidden></div>
          <div class="console-actions">
            <button class="big-red" type="button" data-run>运行</button>
            <button class="console-btn" type="button" data-step>单步</button>
            <button class="console-btn" type="button" data-reset>重置</button>
            <button class="console-btn" type="button" data-sources>史料</button>
          </div>
        </div>
      </div>`;

      const screen = root.querySelector(".crt-screen");
      const logEl = root.querySelector("[data-log]");
      const hintEl = root.querySelector("[data-hint]");
      const regEls = {
        A: root.querySelector('[data-val="A"]'),
        B: root.querySelector('[data-val="B"]'),
        OUT: root.querySelector('[data-val="OUT"]'),
      };
      const programEl = root.querySelector("[data-program]");
      const trayEl = root.querySelector("[data-tray]");
      const runBtn = root.querySelector("[data-run]");
      const stepBtn = root.querySelector("[data-step]");
      const resetBtn = root.querySelector("[data-reset]");

      const local = {
        program: [],
        registers: { A: 0, B: 0, OUT: null },
        errors: 0,
        stepIndex: 0,
        running: false,
        locked: false,
        timer: null,
        cancelled: false,
      };

      const reduced = api.reduced;

      const log = (line) => {
        logEl.textContent = logEl.textContent === "> READY. 等待指令。" ? line : `${logEl.textContent}\n${line}`;
        logEl.scrollTop = logEl.scrollHeight;
      };

      const setReg = (name, value) => {
        local.registers[name] = value;
        const el = regEls[name];
        el.textContent = value === null ? "--" : String(value);
        const wrapper = el.closest(".reg");
        wrapper.classList.remove("is-hot");
        void wrapper.offsetWidth;
        wrapper.classList.add("is-hot");
        setTimeout(() => wrapper.classList.remove("is-hot"), 650);
      };

      const setBusy = (busy) => {
        runBtn.disabled = busy;
        stepBtn.disabled = busy;
        resetBtn.disabled = busy;
        trayEl.querySelectorAll(".switch").forEach((button) => {
          button.disabled = busy;
        });
        programEl.querySelectorAll("button").forEach((button) => {
          button.disabled = busy;
        });
      };

      const renderProgram = () => {
        const slots = [];
        for (let index = 0; index < 4; index += 1) {
          const id = local.program[index];
          if (!id) {
            slots.push(
              `<div class="patch"><span class="patch-index">0${index + 1}</span><span class="patch-text patch-empty">空行 · 什么都不做</span></div>`
            );
            continue;
          }
          slots.push(`<div class="patch is-wired">
            <span class="patch-index">0${index + 1}</span>
            <span class="patch-text">${INSTRUCTIONS[id].text}</span>
            <span class="patch-effect">${INSTRUCTIONS[id].effect}</span>
            <span class="patch-actions">
              <button class="mini-btn" type="button" data-move="up" data-index="${index}" aria-label="上移">↑</button>
              <button class="mini-btn" type="button" data-move="down" data-index="${index}" aria-label="下移">↓</button>
              <button class="mini-btn" type="button" data-remove="${index}" aria-label="移除">×</button>
            </span>
          </div>`);
        }
        programEl.innerHTML = slots.join("");
      };

      const renderTray = () => {
        trayEl.querySelectorAll(".switch").forEach((button) => {
          const used = local.program.includes(button.dataset.instr);
          button.classList.toggle("is-on", used);
          button.disabled = used || local.running || local.locked;
        });
      };

      const renderAll = () => {
        renderProgram();
        renderTray();
        setBusy(local.running || local.locked);
      };

      const resetMachine = (clearLog) => {
        setReg("A", 0);
        setReg("B", 0);
        setReg("OUT", null);
        local.stepIndex = 0;
        if (clearLog) logEl.textContent = "> READY. 等待指令。";
      };

      const diagnose = () => {
        const program = local.program;
        const at = (id) => program.indexOf(id);
        if (at("jmp") !== -1) {
          return "JMP 0 把执行顺序拽回第 1 行，机器一直在转，永远走不到 OUT。这关用不上它。";
        }
        if (at("out") === -1) {
          return "没有 OUT A：机器算完了，但没人把结果交出去，OUT 还是空的。";
        }
        if (at("out") !== program.length - 1) {
          return `OUT 接在第 0${at("out") + 1} 行，它后面还有指令。OUT 要放在最后一行：先算完，再输出。`;
        }
        if (at("loadA") === -1 || at("loadB") === -1) {
          return "A 和 B 的初值都是 0。先把 3 和 4 分别 LOAD 进去，才有数可加。";
        }
        if (at("add") === -1 && at("sub") === -1) {
          return "两个数都装好了，但没有把它们合起来的指令。ADD A B 会把 A + B 的结果放回 A。";
        }
        if (at("add") !== -1 && at("add") < at("loadB")) {
          return "ADD 执行的时候 B 还是 0 —— 机器不会替你把后面的步骤提前。先 LOAD B 4，再 ADD A B。";
        }
        if (at("add") < at("loadA")) {
          return "ADD 执行的时候 A 还是 0。先 LOAD A 3，再 ADD A B。";
        }
        if (at("sub") !== -1) {
          return "SUB A B 是相减，越减越小。要得到 7，这里应该是 ADD A B。";
        }
        return `输出是 ${local.registers.OUT === null ? "--" : local.registers.OUT}，不是 7。逐行看屏幕上的执行记录，哪一步的数第一次不对，问题就在那一行。`;
      };

      const showHint = () => {
        const plan =
          local.errors >= 2
            ? `<div class="hint-plan">可以照这个顺序接一遍：${SOLUTION.map((id) => INSTRUCTIONS[id].text).join(
                " → "
              )}。接错了用每行右边的 ↑ ↓ 换位置，或者 × 拆掉重接。</div>`
            : "";
        hintEl.innerHTML = `<div class="hint-head">为什么不对</div><div class="hint-cause">${CTM.utils.escapeHtml(
          diagnose()
        )}</div>${plan}`;
        hintEl.hidden = false;
      };

      const executeInstruction = (id) => {
        switch (id) {
          case "loadA":
            setReg("A", 3);
            log("A ← 3");
            CTM.audio.relay();
            return { jumped: false };
          case "loadB":
            setReg("B", 4);
            log("B ← 4");
            CTM.audio.relay();
            return { jumped: false };
          case "add":
            setReg("A", local.registers.A + local.registers.B);
            log(`A ← A + B = ${local.registers.A}${local.registers.B === 0 ? "   ← B 还是 0" : ""}`);
            CTM.audio.relay();
            return { jumped: false };
          case "out":
            setReg("OUT", local.registers.A);
            log(`OUT ← A = ${local.registers.OUT}`);
            CTM.audio.relay();
            return { jumped: false };
          case "sub":
            setReg("A", local.registers.A - local.registers.B);
            log(`A ← A - B = ${local.registers.A}`);
            CTM.audio.relay();
            return { jumped: false };
          case "jmp":
            log("PC ← 0  (回到第 1 行)");
            CTM.audio.error();
            return { jumped: true };
          default:
            return { jumped: false };
        }
      };

      const finish = () => {
        local.running = false;
        renderAll();
        if (local.registers.OUT === 7) {
          local.locked = true;
          hintEl.hidden = true;
          screen.classList.add("is-passed");
          renderAll();
          log("OUTPUT: 7 / PROGRAM PASSED.");
          CTM.audio.success();
          const score = { systems: Math.max(8, 20 - local.errors * 4), manual: 5 };
          local.timer = setTimeout(
            () =>
              !local.cancelled &&
              api.complete(score, { program: local.program.slice(), errors: local.errors }, { continueLabel: "前往 1972 →" }),
            900
          );
          return;
        }
        local.errors += 1;
        const output = local.registers.OUT === null ? "--" : local.registers.OUT;
        log(`OUTPUT: ${output} / TARGET: 7`);
        showHint();
        if (local.errors === 1) api.cheat("顺序错了不代表你不会 —— 机器只会从上往下执行。可以让 Agent 替你接线。");
        CTM.audio.error();
      };

      const runAll = async () => {
        if (local.running || local.locked) return;
        if (!local.program.length) {
          api.toast("先在下面的指令开关上点一行。");
          return;
        }
        if (local.program.length < 4) {
          api.toast(`机器有 4 行，现在只接了 ${local.program.length} 行。空行会直接跳过。`);
          return;
        }
        local.running = true;
        resetMachine(true);
        renderAll();
        log(`> RUN ${local.program.length} INSTRUCTIONS`);
        await CTM.utils.sleep(reduced ? 120 : 360);
        let jumped = false;
        for (const id of local.program) {
          if (jumped) break;
          const result = executeInstruction(id);
          if (result.jumped) {
            jumped = true;
            break;
          }
          await CTM.utils.sleep(reduced ? 80 : 420);
        }
        if (jumped) {
          local.running = false;
          local.errors += 1;
          renderAll();
          showHint();
          return;
        }
        finish();
      };

      const stepOnce = async () => {
        if (local.running || local.locked) return;
        if (!local.program.length) {
          api.toast("先接指令，再单步执行。");
          return;
        }
        if (local.stepIndex === 0) resetMachine(true);
        local.running = true;
        renderAll();
        const id = local.program[local.stepIndex];
        if (!id) {
          local.running = false;
          finish();
          return;
        }
        const result = executeInstruction(id);
        local.stepIndex += 1;
        await CTM.utils.sleep(reduced ? 80 : 260);
        if (result.jumped) {
          local.running = false;
          local.errors += 1;
          renderAll();
          showHint();
          return;
        }
        if (local.stepIndex >= local.program.length) {
          finish();
          return;
        }
        local.running = false;
        renderAll();
      };

      const onProgramClick = (event) => {
        if (local.running || local.locked) return;
        const move = event.target.closest("[data-move]");
        if (move) {
          const index = Number(move.dataset.index);
          const target = move.dataset.move === "up" ? index - 1 : index + 1;
          if (target < 0 || target >= local.program.length) return;
          const temp = local.program[index];
          local.program[index] = local.program[target];
          local.program[target] = temp;
          renderAll();
          CTM.audio.click();
          return;
        }
        const remove = event.target.closest("[data-remove]");
        if (remove) {
          local.program.splice(Number(remove.dataset.remove), 1);
          renderAll();
          CTM.audio.glitch();
        }
      };

      const onTrayClick = (event) => {
        const button = event.target.closest("[data-instr]");
        if (!button || local.running || local.locked) return;
        if (local.program.length >= 4) {
          api.toast("接线板只有 4 行。先用 × 拆掉一行。");
          return;
        }
        local.program.push(button.dataset.instr);
        renderAll();
        CTM.audio.relay();
      };

      const onReset = () => {
        if (local.running) return;
        local.program = [];
        local.errors = 0;
        local.locked = false;
        local.running = false;
        hintEl.hidden = true;
        screen.classList.remove("is-passed");
        resetMachine(true);
        renderAll();
        api.toast("机器已重置。");
        CTM.audio.click();
      };

      programEl.addEventListener("click", onProgramClick);
      trayEl.addEventListener("click", onTrayClick);
      runBtn.addEventListener("click", runAll);
      stepBtn.addEventListener("click", stepOnce);
      resetBtn.addEventListener("click", onReset);

      renderAll();

      return () => {
        local.cancelled = true;
        if (local.timer) clearTimeout(local.timer);
        programEl.removeEventListener("click", onProgramClick);
        trayEl.removeEventListener("click", onTrayClick);
        runBtn.removeEventListener("click", runAll);
        stepBtn.removeEventListener("click", stepOnce);
        resetBtn.removeEventListener("click", onReset);
      };
    },
  });
})(window.CTM = window.CTM || {});
