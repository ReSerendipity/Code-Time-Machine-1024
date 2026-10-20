(function (CTM) {
  "use strict";

  const INSTRUCTIONS = {
    loadA: { text: "LOAD A 3", op: "loadA" },
    loadB: { text: "LOAD B 4", op: "loadB" },
    add: { text: "ADD A B", op: "add" },
    out: { text: "OUT A", op: "out" },
    sub: { text: "SUB A B", op: "sub" },
    jmp: { text: "JMP 0", op: "jmp" },
  };

  const ORDER = ["loadA", "loadB", "add", "out", "sub", "jmp"];
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
          <div class="stencil">目标：OUT = 7</div>
        </div>
        <div class="console-desk">
          <div class="patch-bay" data-program></div>
          <div class="switchboard" data-tray>${ORDER.map(
            (id) => `<button class="switch" type="button" data-instr="${id}"><i></i>${INSTRUCTIONS[id].text}</button>`
          ).join("")}</div>
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
            slots.push(`<div class="patch"><span class="patch-index">0${index + 1}</span><span class="patch-text">—</span></div>`);
            continue;
          }
          slots.push(`<div class="patch is-wired">
            <span class="patch-index">0${index + 1}</span>
            <span class="patch-text">${INSTRUCTIONS[id].text}</span>
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
            log(`A ← A + B = ${local.registers.A}`);
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
            log("PC ← 0  (死循环)");
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
          screen.classList.add("is-passed");
          renderAll();
          log("OUTPUT: 7 / PROGRAM PASSED.");
          CTM.audio.success();
          const score = { systems: Math.max(8, 20 - local.errors * 4), manual: 5 };
          local.timer = setTimeout(
            () =>
              !local.cancelled &&
              api.complete(score, { program: local.program.slice(), errors: local.errors }, { continueLabel: "前往 1972 →" }),
            800
          );
          return;
        }
        local.errors += 1;
        const output = local.registers.OUT === null ? "--" : local.registers.OUT;
        log(`OUTPUT: ${output} / TARGET: 7`);
        api.toast(local.errors >= 2 ? "提示：先 LOAD A，再 LOAD B，然后 ADD A B，最后 OUT A。" : `输出是 ${output}，不是 7。`);
        CTM.audio.error();
      };

      const runAll = async () => {
        if (local.running || local.locked) return;
        if (!local.program.length) {
          api.toast("先从开关板选指令。");
          return;
        }
        if (local.program.length < 4) {
          api.toast(`机器需要 4 条指令，现在只有 ${local.program.length} 条。`);
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
          api.toast("JMP 0 把程序计数器带回了起点，机器过热了。");
          return;
        }
        finish();
      };

      const stepOnce = async () => {
        if (local.running || local.locked) return;
        if (!local.program.length) {
          api.toast("先选指令，再单步执行。");
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
          api.toast("JMP 0 让程序计数器回到了起点。机器过热。");
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
          api.toast("接线板只有 4 个槽位。");
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
