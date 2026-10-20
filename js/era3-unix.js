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

  const COMMANDS = [
    { cmd: "grep ERROR", man: "只留下含 ERROR 的行" },
    { cmd: "grep 500", man: "只留下含 500 的行" },
    { cmd: "grep 404", man: "只留下含 404 的行" },
    { cmd: "wc -l", man: "数还剩几行" },
    { cmd: "sort", man: "把行排个序" },
    { cmd: "uniq -c", man: "合并重复行并计数" },
  ];

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
        <div class="unix-brief">
          <b>值班单</b>
          <p>昨天的部署出问题了。数一数：日志里<b>状态码 500 并且标了 ERROR</b> 的请求有几条。把工具用 <code>|</code> 串起来，最后一个工具的输出就是答案。</p>
        </div>
        <div class="teletype">
          <div class="tt-head">unix@bell-labs:~/logs<span>第 3 站 · 1972</span></div>
          <div class="paper-tape" data-log>${LOG_LINES.map(
            (line, index) => `<div class="log-line" data-line="${index}">${CTM.utils.escapeHtml(line)}</div>`
          ).join("")}</div>
          <div class="pipe-line" data-pipeline aria-live="polite"></div>
          <div class="printout" data-output aria-live="polite">&gt; 等待管道运行。</div>
        </div>
        <div class="kbd">
          <div class="kbd-label">工具架 · 点一下接到管道后面</div>
          <div class="kbd-row" data-tray>${COMMANDS.map(
            (item) => `<button class="key" type="button" data-cmd="${item.cmd}">
              <span class="key-text">${item.cmd}</span>
              <span class="key-man">${item.man}</span>
            </button>`
          ).join("")}</div>
          <div class="kbd-row kbd-actions">
            <button class="enter-key" type="button" data-run>运行管道</button>
            <button class="kbd-btn" type="button" data-undo>撤销最后一个</button>
            <button class="kbd-btn" type="button" data-reset>重置</button>
            <button class="kbd-btn" type="button" data-sources>man 页 · 史料</button>
          </div>
        </div>
        <div class="unix-hint" data-hint hidden></div>
      </div>`;

      const teletype = root.querySelector(".teletype");
      const hintEl = root.querySelector("[data-hint]");
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

      const has = (command) => local.pipeline.includes(command);

      const diagnose = (count) => {
        if (count === 7) return "结果是 7 —— 你数的是整份日志。先缩小范围（grep），再数行数（wc -l）。";
        if (count === 4 && has("grep 500") && !has("grep ERROR")) {
          return "多出来的那一行是 GET /api/slow：它的状态码是 200，只是耗时 500ms。grep 按字符匹配，看到「500」就留下。再补一道 grep ERROR，把 OK 的行筛掉。";
        }
        if (count === 4 && has("grep ERROR") && !has("grep 500")) {
          return "多出来的那一行是 GET /missing：它确实写着 ERROR，但状态码是 404。你要的是 500，再补一道 grep 500。";
        }
        if (count === 5) return "5 行里混进了 404 和 500ms。两条筛选都要：ERROR 和 500 同时命中的那几行才是答案。";
        if (count === 0) return "结果是 0：两道 grep 之间互相筛空了。检查你接的关键字，日志里同时出现「500」和「ERROR」的行是有的。";
        return `结果是 ${count}，不是 3。把最后的 wc -l 去掉再运行一次，就能看见到底是哪几行被留下了 —— 这也是真实的调试方法。`;
      };

      const showHint = (cause) => {
        const plan =
          local.errors >= 2
            ? `<div class="hint-plan">一条能跑通的管道：<code>cat access.log | grep ERROR | grep 500 | wc -l</code>。
               <button class="hint-assist" type="button" data-assist>让 Agent 接手这一关</button></div>`
            : "";
        hintEl.innerHTML = `<div class="hint-head">为什么不对</div><div class="hint-cause">${CTM.utils.escapeHtml(
          cause
        )}</div>${plan}`;
        hintEl.hidden = false;
      };

      hintEl.addEventListener("click", (event) => {
        if (!event.target.closest("[data-assist]") || local.locked) return;
        api.assist();
      });

      const runPipeline = () => {
        if (local.locked) return;
        if (local.pipeline.length <= 1) {
          api.toast("管道里只有 cat。把工具接到它后面。");
          CTM.audio.error();
          return;
        }
        const { lines, count } = evaluate();
        clearHighlights();
        if (count === null) {
          outputEl.textContent = lines.length ? lines.join("\n") : "(空)";
          showHint("管道有输出，但还没有数行数。最后接一个 wc -l，它会把上面交下来的行数列成一个数字。");
          CTM.audio.teletype();
          return;
        }
        outputEl.textContent = String(count);
        CTM.audio.teletype();
        if (count === 3) {
          local.locked = true;
          hintEl.hidden = true;
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
        showHint(diagnose(count));
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
        outputEl.textContent = "> 已撤销最后一个工具。";
        clearHighlights();
        hintEl.hidden = true;
        CTM.audio.glitch();
      };

      const onReset = () => {
        if (local.locked) return;
        local.pipeline = ["cat access.log"];
        local.errors = 0;
        renderPipeline();
        outputEl.textContent = "> 管道已重置。等待运行。";
        clearHighlights();
        hintEl.hidden = true;
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
