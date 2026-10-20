(function (CTM) {
  "use strict";

  const LOG_LINES = [
    '10.0.0.12 - [24/Oct/2026:03:07:01] "GET /api/build HTTP/1.1" 200 512 OK',
    '10.0.0.18 - [24/Oct/2026:03:07:02] "POST /api/deploy HTTP/1.1" 500 128 ERROR',
    '10.0.0.24 - [24/Oct/2026:03:07:03] "GET /assets/app.js HTTP/1.1" 200 1024 OK',
    '10.0.0.31 - [24/Oct/2026:03:07:04] "GET /api/slow HTTP/1.1" 200 500ms OK',
    '10.0.0.42 - [24/Oct/2026:03:07:05] "GET /missing HTTP/1.1" 404 64 ERROR',
    '10.0.0.57 - [24/Oct/2026:03:07:06] "GET /api/status HTTP/1.1" 500 64 ERROR',
    '10.0.0.63 - [24/Oct/2026:03:07:07] "DELETE /api/cache HTTP/1.1" 500 32 ERROR',
  ];

  const COMMANDS = ["grep ERROR", "grep 500", "grep 404", "wc -l", "sort", "uniq -c"];

  CTM.eras.push({
    id: "unix",
    label: "Unix / C",
    year: 1972,
    theme: "unix",
    icon: "unix",
    place: "贝尔实验室 · Unix 机房",
    sources: [
      "1972 年，Dennis Ritchie 在贝尔实验室发明 C 语言；Unix 也诞生于同一间实验室。",
      "Unix 管道由 Doug McIlroy 在 1973 年推动实现，让一个小工具的输出直接成为另一个小工具的输入。",
      "“Write programs that do one thing and do it well.” 是 Unix 哲学最常被引用的一句话。",
    ],
    render(root, api) {
      root.innerHTML = `<div class="room room-unix">
        <div class="teletype">
          <div class="tt-head">unix@bell-labs:~/logs<span>第 3 站 · 1972</span></div>
          <div class="paper-tape" data-log>${LOG_LINES.map(
            (line, index) => `<div class="log-line" data-line="${index}">${CTM.utils.escapeHtml(line)}</div>`
          ).join("")}</div>
          <div class="pipe-line" data-pipeline aria-live="polite"></div>
          <div class="printout" data-output aria-live="polite">&gt; 等待管道运行。</div>
        </div>
        <div class="kbd">
          <div class="kbd-row" data-tray>${COMMANDS.map(
            (cmd) => `<button class="key" type="button" data-cmd="${cmd}">${cmd}</button>`
          ).join("")}</div>
          <div class="kbd-row kbd-actions">
            <button class="enter-key" type="button" data-run>运行管道</button>
            <button class="kbd-btn" type="button" data-undo>撤销</button>
            <button class="kbd-btn" type="button" data-reset>重置</button>
            <button class="kbd-btn" type="button" data-sources>man 页 · 史料</button>
          </div>
        </div>
        <div class="man-note">提示：先缩小范围，再数行数。<code>wc -l</code> 只数最后剩下的行。</div>
      </div>`;

      const teletype = root.querySelector(".teletype");
      const pipelineEl = root.querySelector("[data-pipeline]");
      const outputEl = root.querySelector("[data-output]");
      const trayEl = root.querySelector("[data-tray]");
      const runBtn = root.querySelector("[data-run]");
      const undoBtn = root.querySelector("[data-undo]");
      const resetBtn = root.querySelector("[data-reset]");
      const lineEls = Array.from(root.querySelectorAll(".log-line"));

      const local = { pipeline: ["cat access.log"], errors: 0, locked: false, timer: null, cancelled: false };

      const renderPipeline = () => {
        const parts = local.pipeline.map(
          (command) => `<span class="pipe-cmd">${CTM.utils.escapeHtml(command)}</span>`
        );
        pipelineEl.innerHTML = parts.join('<span class="pipe-sep">|</span>');
      };

      const setBusy = (busy) => {
        runBtn.disabled = busy;
        undoBtn.disabled = busy;
        resetBtn.disabled = busy;
        trayEl.querySelectorAll("button").forEach((button) => {
          button.disabled = busy;
        });
      };

      const clearHighlights = () => lineEls.forEach((el) => el.classList.remove("is-hit"));

      const evaluate = () => {
        let lines = LOG_LINES.slice();
        let count = null;
        for (const command of local.pipeline.slice(1)) {
          if (command === "grep ERROR") lines = lines.filter((line) => line.includes("ERROR"));
          else if (command === "grep 500") lines = lines.filter((line) => line.includes("500"));
          else if (command === "grep 404") lines = lines.filter((line) => line.includes("404"));
          else if (command === "sort") lines = lines.slice().sort();
          else if (command === "uniq -c") {
            const counts = new Map();
            lines.forEach((line) => counts.set(line, (counts.get(line) || 0) + 1));
            lines = Array.from(counts.entries()).map(([line, amount]) => `${amount} ${line}`);
          } else if (command === "wc -l") count = lines.length;
        }
        return { lines, count };
      };

      const highlightSuccess = () => {
        lineEls.forEach((el, index) => {
          if (LOG_LINES[index].includes("500") && LOG_LINES[index].includes("ERROR")) el.classList.add("is-hit");
        });
      };

      const runPipeline = () => {
        if (local.locked) return;
        if (local.pipeline.length <= 1) {
          api.toast("管道里只有 cat。把命令接上去。");
          CTM.audio.error();
          return;
        }
        const { lines, count } = evaluate();
        clearHighlights();
        if (count === null) {
          outputEl.textContent = lines.length ? lines.join("\n") : "(空)";
          api.toast("管道有输出，但还没有数行数。最后接一个 wc -l。");
          CTM.audio.teletype();
          return;
        }
        outputEl.textContent = String(count);
        CTM.audio.teletype();
        if (count === 3) {
          local.locked = true;
          setBusy(true);
          teletype.classList.add("is-printed");
          highlightSuccess();
          const steps = local.pipeline.length - 1;
          const score = {
            systems: Math.max(8, 20 - Math.max(0, steps - 3) * 3 - local.errors * 2),
            expression: 5,
          };
          local.timer = setTimeout(
            () =>
              !local.cancelled &&
              api.complete(score, { pipeline: local.pipeline.slice(), errors: local.errors }, { continueLabel: "前往 1991 →" }),
            900
          );
          return;
        }
        local.errors += 1;
        api.toast(count === 4 ? "结果是 4。有一条 500 只是耗时 500ms，还有一条 404 也带 ERROR。" : `结果是 ${count}，不是 3。`);
      };

      const onTrayClick = (event) => {
        const button = event.target.closest("[data-cmd]");
        if (!button || local.locked) return;
        local.pipeline.push(button.dataset.cmd);
        renderPipeline();
        outputEl.textContent = "> 管道已更新，等待运行。";
        clearHighlights();
        CTM.audio.click();
      };

      const onUndo = () => {
        if (local.locked || local.pipeline.length <= 1) return;
        local.pipeline.pop();
        renderPipeline();
        outputEl.textContent = "> 已撤销最后一条命令。";
        clearHighlights();
        CTM.audio.glitch();
      };

      const onReset = () => {
        if (local.locked) return;
        local.pipeline = ["cat access.log"];
        local.errors = 0;
        renderPipeline();
        outputEl.textContent = "> 管道已重置。等待运行。";
        clearHighlights();
        CTM.audio.click();
      };

      trayEl.addEventListener("click", onTrayClick);
      runBtn.addEventListener("click", runPipeline);
      undoBtn.addEventListener("click", onUndo);
      resetBtn.addEventListener("click", onReset);
      renderPipeline();

      return () => {
        local.cancelled = true;
        if (local.timer) clearTimeout(local.timer);
        trayEl.removeEventListener("click", onTrayClick);
        runBtn.removeEventListener("click", runPipeline);
        undoBtn.removeEventListener("click", onUndo);
        resetBtn.removeEventListener("click", onReset);
      };
    },
  });
})(window.CTM = window.CTM || {});
