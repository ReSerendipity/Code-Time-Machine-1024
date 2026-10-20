(function (CTM) {
  "use strict";

  const PALETTES = {
    minimal: { name: "极简", bg: "#0b0f14", bg2: "#111a22", accent: "#8ff0ff", accent2: "#ffffff", ink: "#eaf4ff", muted: "#8a9bb0" },
    retro: { name: "复古", bg: "#1a120b", bg2: "#2b1c10", accent: "#e0a458", accent2: "#b3402f", ink: "#f6e8d3", muted: "#b59a7a" },
    cyber: { name: "赛博", bg: "#05060a", bg2: "#100a1f", accent: "#8ff0ff", accent2: "#c084fc", ink: "#f2f5ff", muted: "#98a0bf" },
  };

  const GOALS = {
    tool: {
      label: "做工具",
      defaultPrompt: "做一个帮室友记外卖钱的小工具",
      plans: [
        (prompt) => [
          `先写一句验收标准：「${prompt}」做到什么算完成。`,
          "只做最小闭环：一个入口、一个核心动作、一个结果页。",
          "用 localStorage 存数据，先不接后端；找 3 个真实用户试用。",
          "在 1024 之前上线，把反馈写进下一版。",
        ],
        (prompt) => [
          `先找出最烦人的那一步：「${prompt}」只帮人省这一步，别的都不做。`,
          "界面砍到一屏：一个输入、一个按钮、一个结果。",
          "数据先存本地，导出和同步留到下一版。",
          "上线前让 1 个人当面用一次，记下他卡住的位置。",
        ],
      ],
    },
    bug: {
      label: "修 Bug",
      defaultPrompt: "修一个只在周五出现的 Bug",
      plans: [
        (prompt) => [
          `先复现：把「${prompt}」的触发条件缩成 3 步以内。`,
          "再定位：从第一个异常开始看，不要从最后一个报错开始。",
          "只改一处，补一条回归测试，再跑一遍全链路。",
          "把这次 Bug 写成团队检查项，让它只发生一次。",
        ],
        (prompt) => [
          `先写下你的假设：「${prompt}」最可能坏在哪一步，然后想办法证明它是错的。`,
          "加一行日志比猜一小时有用 —— 先把现场抓下来。",
          "只做最小改动，别顺手重构；重构另开一次提交。",
          "补一句“下次怎样更快发现它”，写进检查清单。",
        ],
      ],
    },
    story: {
      label: "讲故事",
      defaultPrompt: "讲一个关于 1024 的故事",
      plans: [
        (prompt) => [
          `先定一句话：你想让谁听见「${prompt}」。`,
          "搭结构：开头 3 秒、一个转折、一个结尾。",
          "用具体细节替换形容词；删掉第一段的一半。",
          "发布后读 10 条评论，再写下一版。",
        ],
        (prompt) => [
          `先选一个场景：一个时间、一个地点、一个人 ——「${prompt}」从这里开始。`,
          "开头别解释背景，先给一个动作。",
          "把最动人的那个数字或物件留到结尾。",
          "念出声改一遍，拗口的句子当场删掉。",
        ],
      ],
    },
  };

  CTM.AI_PALETTES = PALETTES;

  const seeded = (seed) => {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
    const chars = Array.from(String(text));
    const lines = [];
    let line = "";
    for (const char of chars) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
        if (lines.length === maxLines - 1) break;
      } else {
        line = test;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
  };

  CTM.drawAiBackdrop = function drawAiBackdrop(ctx, width, height, palette, seed) {
    const rand = seeded(seed || 1024);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, palette.bg);
    bg.addColorStop(1, palette.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    [
      { x: width * 0.16, y: height * 0.2, r: width * 0.45, c: palette.accent },
      { x: width * 0.88, y: height * 0.36, r: width * 0.4, c: palette.accent2 },
      { x: width * 0.46, y: height * 0.95, r: width * 0.5, c: palette.accent },
    ].forEach((orb, index) => {
      const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      gradient.addColorStop(0, `${orb.c}${index === 1 ? "33" : "22"}`);
      gradient.addColorStop(1, `${orb.c}00`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 72) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 72) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = `${palette.accent}55`;
    ctx.beginPath();
    ctx.arc(width * 0.76, height * 0.28, width * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width * 0.76, height * 0.28, width * 0.23, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 46; index += 1) {
      ctx.fillStyle = index % 4 === 0 ? `${palette.accent2}88` : `${palette.accent}66`;
      ctx.fillRect(rand() * width, rand() * height, 1 + rand() * 3, 1 + rand() * 3);
    }
    ctx.fillStyle = `${palette.ink}0d`;
    ctx.font = `800 ${Math.round(width * 0.7)}px "Arial Black", "PingFang SC", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("1024", width * 0.96, height * 0.86);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  };

  const drawPoster = (canvas, data) => {
    const width = 1080;
    const height = 1440;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const palette = PALETTES[data.style] || PALETTES.cyber;
    CTM.drawAiBackdrop(ctx, width, height, palette, data.seed || 1024);
    const pad = 80;
    ctx.fillStyle = palette.muted;
    ctx.font = '600 22px "SFMono-Regular", Consolas, monospace';
    ctx.fillText("LOCAL GENERATION / 2026", pad, pad);
    ctx.textAlign = "right";
    ctx.fillText("TRAE 1024", width - pad, pad);
    ctx.textAlign = "left";
    ctx.fillStyle = palette.accent;
    ctx.font = `800 ${Math.round(width * 0.16)}px "Arial Black", sans-serif`;
    ctx.fillText("//", pad, height * 0.34);
    ctx.fillStyle = palette.ink;
    const size = String(data.prompt || "").length > 28 ? 62 : 80;
    ctx.font = `700 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    wrapText(ctx, data.prompt || "等待你的指令。", pad, height * 0.43, width - pad * 2, size * 1.45, 5);
    ctx.fillStyle = palette.muted;
    ctx.font = '500 24px "PingFang SC", sans-serif';
    ctx.fillText(`目标 · ${GOALS[data.goal] ? GOALS[data.goal].label : "做工具"}　风格 · ${palette.name}`, pad, height * 0.7);
    ctx.fillStyle = palette.accent;
    ctx.font = '700 26px "SFMono-Regular", Consolas, monospace';
    ctx.fillText("NO NETWORK · NO API KEY", pad, height - pad - 40);
  };

  const generatePlan = (goal, style, prompt, seed, regenCount) => {
    const goalData = GOALS[goal] || GOALS.tool;
    const variant = regenCount % goalData.plans.length;
    return {
      goal,
      style,
      prompt,
      seed,
      regenCount,
      variant,
      variants: goalData.plans.length,
      planTitle: `你的 Build：${prompt}`,
      steps: goalData.plans[variant](prompt),
    };
  };

  CTM.eras.push({
    id: "ai",
    label: "AI",
    year: 2026,
    theme: "ai",
    icon: "ai",
    place: "你的桌前 · 2026",
    sources: [
      "2021 年，GitHub Copilot 进入技术预览，AI 开始直接参与代码补全。",
      "2022 年，ChatGPT 让自然语言成为新的编程接口；2026 年，AI 原生编程成为日常。",
      "工具从“写代码”变成“说清楚要什么”，但对需求的判断、对结果的验收，仍然属于 Builder。",
    ],
    render(root, api) {
      root.innerHTML = `<div class="room room-ai">
        <div class="chat-shell">
          <div class="chat-head">TRAE · 2026<span>第 6 站 · 你的桌前</span></div>
          <div class="chat-log" data-chat>
            <div class="msg ai"><span class="msg-avatar">AI</span><div class="msg-body">告诉我你想 Build 什么。我会把它拆成一份可以执行的计划。<em>（本地生成，不调用真实模型）</em></div></div>
          </div>
          <div class="chat-composer">
            <div class="composer-chips">
              <div class="chip-set" data-goals>
                <span class="chip-label">目标</span>
                ${Object.entries(GOALS)
                  .map(
                    ([id, goal], index) =>
                      `<button class="chip ${index === 0 ? "is-on" : ""}" type="button" data-goal="${id}" aria-pressed="${index === 0}">${goal.label}</button>`
                  )
                  .join("")}
              </div>
              <div class="chip-set" data-styles>
                <span class="chip-label">风格</span>
                ${Object.entries(PALETTES)
                  .map(
                    ([id, palette]) =>
                      `<button class="chip ${id === "cyber" ? "is-on" : ""}" type="button" data-style="${id}" aria-pressed="${id === "cyber"}">${palette.name}</button>`
                  )
                  .join("")}
              </div>
            </div>
            <textarea class="composer-input" maxlength="60" data-prompt placeholder="例如：做一个帮室友记外卖钱的小工具"></textarea>
            <div class="suggestion-row" data-suggestions>
              <button class="suggestion" type="button" data-suggest="tool">做一个帮室友记外卖钱的小工具</button>
              <button class="suggestion" type="button" data-suggest="bug">修一个只在周五出现的 Bug</button>
              <button class="suggestion" type="button" data-suggest="story">讲一个关于 1024 的故事</button>
            </div>
            <div class="composer-actions">
              <button class="btn btn-primary" type="button" data-generate>生成</button>
              <button class="btn btn-ghost" type="button" data-regen disabled>再生成一次</button>
              <button class="btn btn-ghost" type="button" data-adopt disabled>采纳这份计划</button>
              <button class="btn btn-quiet" type="button" data-sources>史料</button>
            </div>
          </div>
        </div>
        <div class="chat-attachment">
          <div class="attach-label">生成式海报</div>
          <canvas class="ai-poster" data-ai-poster></canvas>
        </div>
      </div>`;

      const chat = root.querySelector("[data-chat]");
      const canvas = root.querySelector("[data-ai-poster]");
      const goalsEl = root.querySelector("[data-goals]");
      const stylesEl = root.querySelector("[data-styles]");
      const promptInput = root.querySelector("[data-prompt]");
      const suggestionsEl = root.querySelector("[data-suggestions]");
      const generateBtn = root.querySelector("[data-generate]");
      const regenBtn = root.querySelector("[data-regen]");
      const adoptBtn = root.querySelector("[data-adopt]");

      const local = { goal: "tool", style: "cyber", seed: 1024, regenCount: 0, generated: null, locked: false, timer: null, cancelled: false };

      const addMessage = (role, html) => {
        const el = document.createElement("div");
        el.className = `msg ${role}`;
        el.innerHTML = `<span class="msg-avatar">${role === "ai" ? "AI" : "你"}</span><div class="msg-body">${html}</div>`;
        chat.appendChild(el);
        chat.scrollTop = chat.scrollHeight;
        return el;
      };

      const renderChips = () => {
        goalsEl.querySelectorAll("[data-goal]").forEach((button) => {
          const on = button.dataset.goal === local.goal;
          button.classList.toggle("is-on", on);
          button.setAttribute("aria-pressed", String(on));
        });
        stylesEl.querySelectorAll("[data-style]").forEach((button) => {
          const on = button.dataset.style === local.style;
          button.classList.toggle("is-on", on);
          button.setAttribute("aria-pressed", String(on));
        });
      };

      const renderPoster = (data) => {
        drawPoster(canvas, data || { goal: local.goal, style: local.style, prompt: promptInput.value.trim() || "等待你的指令。", seed: local.seed });
      };

      const doGenerate = (isRegen) => {
        if (local.locked) return;
        let prompt = promptInput.value.trim();
        if (!prompt) {
          prompt = GOALS[local.goal].defaultPrompt;
          promptInput.value = prompt;
        }
        local.seed = Math.floor(Math.random() * 1e9) + 1;
        if (isRegen) local.regenCount += 1;
        local.generated = generatePlan(local.goal, local.style, prompt, local.seed, local.regenCount);
        addMessage("user", CTM.utils.escapeHtml(prompt));
        const planEl = addMessage("ai", `<div class="plan-title">${CTM.utils.escapeHtml(local.generated.planTitle)}</div>${local.generated.steps
          .map(
            (step, index) =>
              `<div class="plan-step"><span class="step-num">0${index + 1}</span><span>${CTM.utils.escapeHtml(step)}</span></div>`
          )
          .join("")}<div class="plan-foot">本地模板生成 · 方案 ${local.generated.variant + 1}/${local.generated.variants} · 「再生成一次」会换一套做法</div>`);
        planEl.classList.add("is-plan");
        renderPoster(local.generated);
        adoptBtn.disabled = false;
        regenBtn.disabled = false;
        CTM.audio.generate();
      };

      const onGoalClick = (event) => {
        const button = event.target.closest("[data-goal]");
        if (!button || local.locked) return;
        local.goal = button.dataset.goal;
        renderChips();
        renderPoster();
        CTM.audio.click();
      };

      const onStyleClick = (event) => {
        const button = event.target.closest("[data-style]");
        if (!button || local.locked) return;
        local.style = button.dataset.style;
        renderChips();
        if (local.generated) {
          local.generated.style = local.style;
          renderPoster(local.generated);
        } else {
          renderPoster();
        }
        CTM.audio.click();
      };

      const onSuggestion = (event) => {
        const button = event.target.closest("[data-suggest]");
        if (!button || local.locked) return;
        local.goal = button.dataset.suggest;
        promptInput.value = GOALS[local.goal].defaultPrompt;
        renderChips();
        renderPoster();
        CTM.audio.click();
      };

      const onAdopt = () => {
        if (local.locked || !local.generated) return;
        local.locked = true;
        adoptBtn.disabled = true;
        generateBtn.disabled = true;
        regenBtn.disabled = true;
        promptInput.disabled = true;
        goalsEl.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
        });
        stylesEl.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
        });
        suggestionsEl.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
        });
        const prompt = local.generated.prompt;
        CTM.state.ai = { goal: local.generated.goal, style: local.generated.style, prompt, seed: local.generated.seed, plan: local.generated.steps.slice() };
        addMessage("ai", `<div class="adopted">已采纳。这份计划会跟你一起回到 2026。</div>`);
        root.querySelector(".chat-shell").classList.add("is-adopted");
        const expression = 5 + (prompt.length >= 12 ? 2 : 0) + (local.regenCount > 0 ? 1 : 0);
        const score = { direction: 17, expression: Math.min(8, expression) };
        CTM.audio.success();
        local.timer = setTimeout(
          () => !local.cancelled && api.complete(score, { ...CTM.state.ai }, { continueLabel: "回到 2026，查看档案" }),
          900
        );
      };

      goalsEl.addEventListener("click", onGoalClick);
      stylesEl.addEventListener("click", onStyleClick);
      suggestionsEl.addEventListener("click", onSuggestion);
      generateBtn.addEventListener("click", () => doGenerate(false));
      regenBtn.addEventListener("click", () => doGenerate(true));
      adoptBtn.addEventListener("click", onAdopt);

      renderChips();
      renderPoster();

      return () => {
        local.cancelled = true;
        if (local.timer) clearTimeout(local.timer);
        goalsEl.removeEventListener("click", onGoalClick);
        stylesEl.removeEventListener("click", onStyleClick);
        suggestionsEl.removeEventListener("click", onSuggestion);
        generateBtn.removeEventListener("click", doGenerate);
        regenBtn.removeEventListener("click", doGenerate);
        adoptBtn.removeEventListener("click", onAdopt);
      };
    },
  });
})(window.CTM = window.CTM || {});
