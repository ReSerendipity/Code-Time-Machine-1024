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
    { id: "grep ERROR", label: "grep ERROR" },
    { id: "grep 500", label: "grep 500" },
    { id: "grep 404", label: "grep 404" },
    { id: "wc -l", label: "wc -l" },
    { id: "sort", label: "sort" },
    { id: "uniq -c", label: "uniq -c" },
  ];

  CTM.eras.push({
    id: "unix",
    label: "Unix / C",
    year: 1972,
    theme: "unix",
    icon: "unix",
    place: "贝尔实验室 · Unix 机房",
    intro: "小工具，组合起来，就是一套系统。你不需要一把万能锤，只需要一根接得起来的管道。",
    task: "从日志里找出所有 500 错误，并数一数",
    taskDesc: "用管道把 cat、grep、wc 组合起来。注意：不是所有带 500 的行都是错误。",
    sources: [
      "1972 年，Dennis Ritchie 在贝尔实验室发明 C 语言；Unix 也诞生于同一间实验室。",
      "Unix 管道由 Doug McIlroy 在 1973 年推动实现，让一个小工具的输出直接成为另一个小工具的输入。",
      "“Write programs that do one thing and do it well.” 是 Unix 哲学最常被引用的一句话。",
    ],
    sceneHtml: `<div class="unix-scene">
      <div class="term-window">
        <div class="term-bar">
          <span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="term-title">unix@bell-labs:~/logs</span>
        </div>
        <div class="term-body" data-log>${LOG_LINES.map(
          (line, index) => `<div class="log-line" data-line="${index}">${CTM.utils.escapeHtml(line)}</div>`
        ).join("")}</div>
        <div class="pipeline-bar" data-pipeline aria-live="polite"></div>
        <div class="term-output" data-output aria-live="polite">&gt; 等待管道运行。</div>
      </div>
    </div>`,
    panelHtml: `<div class="control-label">可用命令 / 点击接入管道</div>
      <div class="command-tray" data-tray>${COMMANDS.map(
        (cmd) => `<button class="cmd" type="button" data-cmd="${cmd.id}">${cmd.label}</button>`
      ).join("")}</div>
      <div class="btn-row">
        <button class="btn btn-primary" type="button" data-run>运行管道</button>
        <button class="btn btn-ghost" type="button" data-undo>撤销</button>
        <button class="btn btn-quiet" type="button" data-reset>重置</button>
      </div>
      <p class="hint-text">提示：先缩小范围，再数行数。<code>wc -l</code> 只数最后剩下的行。</p>`,
    mount(scene, panel, api) {
      const logEl = scene.querySelector("[data-log]");
      const pipelineEl = scene.querySelector("[data-pipeline]");
      const outputEl = scene.querySelector("[data-output]");
      const trayEl = panel.querySelector("[data-tray]");
      const runBtn = panel.querySelector("[data-run]");
      const undoBtn = panel.querySelector("[data-undo]");
      const resetBtn = panel.querySelector("[data-reset]");
      const lineEls = Array.from(scene.querySelectorAll(".log-line"));

      const local = {
        pipeline: ["cat access.log"],
        errors: 0,
        locked: false,
      };

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

      const clearHighlights = () => {
        lineEls.forEach((el) => el.classList.remove("is-hit"));
      };

      const setOutput = (text) => {
        outputEl.textContent = text;
      };

      const evaluate = () => {
        let lines = LOG_LINES.slice();
        let count = null;
        for (const command of local.pipeline.slice(1)) {
          if (command === "grep ERROR") {
            lines = lines.filter((line) => line.includes("ERROR"));
          } else if (command === "grep 500") {
            lines = lines.filter((line) => line.includes("500"));
          } else if (command === "grep 404") {
            lines = lines.filter((line) => line.includes("404"));
          } else if (command === "sort") {
            lines = lines.slice().sort();
          } else if (command === "uniq -c") {
            const counts = new Map();
            lines.forEach((line) => counts.set(line, (counts.get(line) || 0) + 1));
            lines = Array.from(counts.entries()).map(([line, amount]) => `${amount} ${line}`);
          } else if (command === "wc -l") {
            count = lines.length;
          }
        }
        return { lines, count };
      };

      const highlightSuccess = () => {
        lineEls.forEach((el, index) => {
          if (LOG_LINES[index].includes("500") && LOG_LINES[index].includes("ERROR")) {
            el.classList.add("is-hit");
          }
        });
      };

      const runPipeline = () => {
        if (local.locked) return;
        if (local.pipeline.length <= 1) {
          api.feedback("管道里只有 cat。先点下面的命令，把它接起来。", "error");
          CTM.audio.error();
          return;
        }

        const { lines, count } = evaluate();
        clearHighlights();

        if (count === null) {
          setOutput(lines.length ? lines.join("\n") : "(空)");
          api.feedback("管道有输出，但还没有数行数。最后接一个 wc -l。", "error");
          return;
        }

        setOutput(String(count));

        if (count === 3) {
          local.locked = true;
          setBusy(true);
          highlightSuccess();
          api.feedback("3 次 500 错误。管道跑通了。", "ok");
          CTM.audio.success();
          const steps = local.pipeline.length - 1;
          const score = {
            systems: Math.max(8, 20 - Math.max(0, steps - 3) * 3 - local.errors * 2),
            expression: 5,
          };
          const successHtml = `你找到了 <b>3 次 500 错误</b>。1972 年的 Unix 说：小工具，组合起来就很大。你的管道用了 ${steps} 个步骤。`;
          setTimeout(
            () => api.complete(score, { pipeline: local.pipeline.slice(), errors: local.errors }, successHtml),
            700
          );
          return;
        }

        local.errors += 1;
        if (count === 4) {
          const usedError = local.pipeline.includes("grep ERROR");
          const used500 = local.pipeline.includes("grep 500");
          if (usedError && used500) {
            api.feedback("结果是 4。再检查一下：有一条 500 只是耗时 500ms，不是错误。", "error");
          } else {
            api.feedback("结果是 4。日志里既有 404 ERROR，也有一条 200 的 500ms。把两个条件都加上。", "error");
          }
        } else if (count === 0) {
          api.feedback("管道没有拿到任何行。检查一下 grep 的条件。", "error");
        } else {
          api.feedback(`结果是 ${count}，不是 3。再缩小一次范围。`, "error");
        }
        CTM.audio.error();
      };

      const onTrayClick = (event) => {
        const button = event.target.closest("[data-cmd]");
        if (!button || local.locked) return;
        local.pipeline.push(button.dataset.cmd);
        renderPipeline();
        setOutput("> 管道已更新，等待运行。");
        clearHighlights();
        api.feedback(`已接入 ${button.dataset.cmd}。点“运行管道”看结果。`, "");
        CTM.audio.click();
      };

      const onUndo = () => {
        if (local.locked || local.pipeline.length <= 1) return;
        local.pipeline.pop();
        renderPipeline();
        setOutput("> 已撤销最后一条命令。");
        clearHighlights();
        api.feedback("已撤销最后一条命令。", "");
        CTM.audio.glitch();
      };

      const onReset = () => {
        if (local.locked) return;
        local.pipeline = ["cat access.log"];
        local.errors = 0;
        renderPipeline();
        setOutput("> 管道已重置。等待运行。");
        clearHighlights();
        api.feedback("管道已重置。从 cat 重新开始。", "");
        CTM.audio.click();
      };

      trayEl.addEventListener("click", onTrayClick);
      runBtn.addEventListener("click", runPipeline);
      undoBtn.addEventListener("click", onUndo);
      resetBtn.addEventListener("click", onReset);
      renderPipeline();

      return () => {
        trayEl.removeEventListener("click", onTrayClick);
        runBtn.removeEventListener("click", runPipeline);
        undoBtn.removeEventListener("click", onUndo);
        resetBtn.removeEventListener("click", onReset);
      };
    },
  });
})(window.CTM = window.CTM || {});
