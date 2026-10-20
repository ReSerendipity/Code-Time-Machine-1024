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

  const tubes = Array.from({ length: 7 }, () => '<span class="tube"></span>').join("");

  CTM.eras.push({
    id: "register",
    label: "寄存器",
    year: 1945,
    theme: "register",
    icon: "register",
    place: "宾夕法尼亚 · ENIAC",
    intro: "一整间屋子的真空管，只为了做一次加法。你得把想法拆成机器听得懂的几条指令。",
    task: "让寄存器 A + B，输出 7",
    taskDesc: "从 6 条指令里选 4 条，按正确顺序放进程序。机器只认识顺序。",
    sources: [
      "1945 年，ENIAC 在宾夕法尼亚大学建成，是最早的通用电子计算机之一，早期编程依靠开关与接线。",
      "1952 年，Grace Hopper 的 A-0 系统让机器第一次能“翻译”人类写下的符号，被视为早期编译器。",
      "1972 年，Dennis Ritchie 在贝尔实验室发明 C 语言，让“写程序”从硬件接线变成可移植的表达。",
    ],
    sceneHtml: `<div class="register-scene">
      <div class="crt-monitor">
        <div class="crt-top">
          <div class="tube-row" aria-hidden="true">${tubes}</div>
          <div class="crt-tag">ENIAC / 1024</div>
        </div>
        <div class="crt-screen">
          <div class="registers">
            <div class="reg" data-reg="A">
              <div class="reg-name">A</div>
              <div class="reg-val" data-val="A">0</div>
            </div>
            <div class="reg" data-reg="B">
              <div class="reg-name">B</div>
              <div class="reg-val" data-val="B">0</div>
            </div>
            <div class="reg" data-reg="OUT">
              <div class="reg-name">OUT</div>
              <div class="reg-val" data-val="OUT">--</div>
            </div>
          </div>
          <div class="crt-log" data-log aria-live="polite">&gt; READY. 等待指令。</div>
        </div>
      </div>
    </div>`,
    panelHtml: `<div class="control-label">程序 / 4 SLOTS</div>
      <div class="program-list" data-program></div>
      <div class="control-label">指令池</div>
      <div class="instr-grid" data-tray>${ORDER.map((id) => {
        return `<button class="instr" type="button" data-instr="${id}">${INSTRUCTIONS[id].text}</button>`;
      }).join("")}</div>
      <div class="btn-row">
        <button class="btn btn-primary" type="button" data-run>运行</button>
        <button class="btn btn-ghost" type="button" data-step>单步</button>
        <button class="btn btn-quiet" type="button" data-reset>重置</button>
      </div>
      <p class="hint-text">目标：让 OUT 显示 7。机器只认识顺序，不认识你的意图。</p>`,
    mount(scene, panel, api) {
      const logEl = scene.querySelector("[data-log]");
      const regEls = {
        A: scene.querySelector('[data-val="A"]'),
        B: scene.querySelector('[data-val="B"]'),
        OUT: scene.querySelector('[data-val="OUT"]'),
      };
      const programEl = panel.querySelector("[data-program]");
      const trayEl = panel.querySelector("[data-tray]");
      const runBtn = panel.querySelector("[data-run]");
      const stepBtn = panel.querySelector("[data-step]");
      const resetBtn = panel.querySelector("[data-reset]");

      const local = {
        program: [],
        registers: { A: 0, B: 0, OUT: null },
        errors: 0,
        stepIndex: 0,
        running: false,
        locked: false,
      };

      const reduced = api.reduced;

      const log = (line) => {
        if (!logEl) return;
        logEl.textContent = logEl.textContent === "> READY. 等待指令。" ? line : `${logEl.textContent}\n${line}`;
        logEl.scrollTop = logEl.scrollHeight;
      };

      const setReg = (name, value) => {
        local.registers[name] = value;
        const el = regEls[name];
        if (!el) return;
        el.textContent = value === null ? "--" : String(value);
        const wrapper = el.closest(".reg");
        if (wrapper) {
          wrapper.classList.remove("is-hot");
          void wrapper.offsetWidth;
          wrapper.classList.add("is-hot");
          setTimeout(() => wrapper.classList.remove("is-hot"), 650);
        }
      };

      const setBusy = (busy) => {
        runBtn.disabled = busy;
        stepBtn.disabled = busy;
        resetBtn.disabled = busy;
        trayEl.querySelectorAll(".instr").forEach((button) => {
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
            slots.push(`<div class="prog-slot"><span class="slot-index">0${index + 1}</span><span class="slot-text">—</span></div>`);
            continue;
          }
          slots.push(`<div class="prog-slot is-filled">
            <span class="slot-index">0${index + 1}</span>
            <span class="slot-text">${INSTRUCTIONS[id].text}</span>
            <span class="slot-actions">
              <button class="mini-btn" type="button" data-move="up" data-index="${index}" aria-label="上移" ${local.running || local.locked ? "disabled" : ""}>↑</button>
              <button class="mini-btn" type="button" data-move="down" data-index="${index}" aria-label="下移" ${local.running || local.locked ? "disabled" : ""}>↓</button>
              <button class="mini-btn" type="button" data-remove="${index}" aria-label="移除" ${local.running || local.locked ? "disabled" : ""}>×</button>
            </span>
          </div>`);
        }
        programEl.innerHTML = slots.join("");
      };

      const renderTray = () => {
        trayEl.querySelectorAll(".instr").forEach((button) => {
          const used = local.program.includes(button.dataset.instr);
          button.classList.toggle("is-used", used);
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
        if (clearLog && logEl) {
          logEl.textContent = "> READY. 等待指令。";
        }
      };

      const executeInstruction = (id) => {
        switch (id) {
          case "loadA":
            setReg("A", 3);
            log("A ← 3");
            return { jumped: false };
          case "loadB":
            setReg("B", 4);
            log("B ← 4");
            return { jumped: false };
          case "add":
            setReg("A", local.registers.A + local.registers.B);
            log(`A ← A + B = ${local.registers.A}`);
            return { jumped: false };
          case "out":
            setReg("OUT", local.registers.A);
            log(`OUT ← A = ${local.registers.OUT}`);
            return { jumped: false };
          case "sub":
            setReg("A", local.registers.A - local.registers.B);
            log(`A ← A - B = ${local.registers.A}`);
            return { jumped: false };
          case "jmp":
            log("PC ← 0  (死循环)");
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
          renderAll();
          api.feedback("OUTPUT: 7。程序通过。", "ok");
          log("OUTPUT: 7 / PROGRAM PASSED.");
          CTM.audio.success();
          const score = {
            systems: Math.max(8, 20 - local.errors * 4),
            manual: 5,
          };
          const successHtml = `你用 4 条指令让机器输出了 <b>7</b>。1945 年的人，就是这样和机器说话的。你犯了 ${local.errors} 次错误。`;
          setTimeout(() => api.complete(score, { program: local.program.slice(), errors: local.errors }, successHtml), 700);
          return;
        }

        local.errors += 1;
        const output = local.registers.OUT === null ? "--" : local.registers.OUT;
        log(`OUTPUT: ${output} / TARGET: 7`);
        if (local.errors >= 2) {
          api.feedback("机器没得到 7。提示：先 LOAD A，再 LOAD B，然后 ADD A B，最后 OUT A。", "error");
        } else {
          api.feedback(`输出是 ${output}，不是 7。检查一下指令的顺序。`, "error");
        }
        CTM.audio.error();
      };

      const runAll = async () => {
        if (local.running || local.locked) return;
        if (!local.program.length) {
          api.feedback("先从指令池里选指令。", "error");
          return;
        }
        if (local.program.length < 4) {
          api.feedback(`机器需要 4 条指令，现在只有 ${local.program.length} 条。`, "error");
          return;
        }
        local.running = true;
        resetMachine(true);
        renderAll();
        log(`> RUN ${local.program.length} INSTRUCTIONS`);
        await CTM.utils.sleep(reduced ? 120 : 380);

        let jumped = false;
        for (const id of local.program) {
          if (jumped) break;
          const result = executeInstruction(id);
          if (result.jumped) {
            jumped = true;
            break;
          }
          await CTM.utils.sleep(reduced ? 80 : 440);
        }

        if (jumped) {
          local.running = false;
          local.errors += 1;
          renderAll();
          api.feedback("JMP 0 把程序计数器带回了起点，机器过热了。换一条指令吧。", "error");
          CTM.audio.error();
          return;
        }
        finish();
      };

      const stepOnce = async () => {
        if (local.running || local.locked) return;
        if (!local.program.length) {
          api.feedback("先选指令，再单步执行。", "error");
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
        await CTM.utils.sleep(reduced ? 80 : 300);
        if (result.jumped) {
          local.running = false;
          local.errors += 1;
          renderAll();
          api.feedback("JMP 0 让程序计数器回到了起点。机器过热。", "error");
          CTM.audio.error();
          return;
        }
        if (local.stepIndex >= local.program.length) {
          finish();
          return;
        }
        local.running = false;
        renderAll();
        api.feedback(`已执行 ${local.stepIndex} / ${local.program.length} 条。继续单步，或直接运行。`, "");
      };

      const onProgramClick = (event) => {
        if (local.running || local.locked) return;
        const move = event.target.closest("[data-move]");
        if (move) {
          const index = Number(move.dataset.index);
          const dir = move.dataset.move;
          const target = dir === "up" ? index - 1 : index + 1;
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
          api.feedback("程序只有 4 个槽位。先移除一条，再选新的。", "error");
          return;
        }
        local.program.push(button.dataset.instr);
        renderAll();
        CTM.audio.click();
      };

      const onReset = () => {
        if (local.running) return;
        local.program = [];
        local.errors = 0;
        local.stepIndex = 0;
        local.locked = false;
        local.running = false;
        resetMachine(true);
        renderAll();
        api.feedback("机器已重置。先从指令池里选 4 条。", "");
        CTM.audio.click();
      };

      programEl.addEventListener("click", onProgramClick);
      trayEl.addEventListener("click", onTrayClick);
      runBtn.addEventListener("click", runAll);
      stepBtn.addEventListener("click", stepOnce);
      resetBtn.addEventListener("click", onReset);

      renderAll();

      return () => {
        programEl.removeEventListener("click", onProgramClick);
        trayEl.removeEventListener("click", onTrayClick);
        runBtn.removeEventListener("click", runAll);
        stepBtn.removeEventListener("click", stepOnce);
        resetBtn.removeEventListener("click", onReset);
      };
    },
  });
})(window.CTM = window.CTM || {});
