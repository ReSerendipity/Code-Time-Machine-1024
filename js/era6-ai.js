(function (CTM) {
  "use strict";

  const PALETTES = {
    minimal: {
      name: "极简",
      bg: "#0b0f14",
      bg2: "#111a22",
      accent: "#8ff0ff",
      accent2: "#ffffff",
      ink: "#eaf4ff",
      muted: "#8a9bb0",
    },
    retro: {
      name: "复古",
      bg: "#1a120b",
      bg2: "#2b1c10",
      accent: "#e0a458",
      accent2: "#b3402f",
      ink: "#f6e8d3",
      muted: "#b59a7a",
    },
    cyber: {
      name: "赛博",
      bg: "#05060a",
      bg2: "#100a1f",
      accent: "#8ff0ff",
      accent2: "#c084fc",
      ink: "#f2f5ff",
      muted: "#98a0bf",
    },
  };

  const GOALS = {
    tool: {
      label: "做工具",
      defaultPrompt: "做一个帮室友记外卖钱的小工具",
      steps: (prompt) => [
        `先写一句验收标准：「${prompt}」做到什么算完成。`,
        "只做最小闭环：一个入口、一个核心动作、一个结果页。",
        "用 localStorage 存数据，先不接后端；找 3 个真实用户试用。",
        "在 1024 之前上线，把反馈写进下一版。",
      ],
    },
    bug: {
      label: "修 Bug",
      defaultPrompt: "修一个只在周五出现的 Bug",
      steps: (prompt) => [
        `先复现：把「${prompt}」的触发条件缩成 3 步以内。`,
        "再定位：从第一个异常开始看，不要从最后一个报错开始。",
        "只改一处，补一条回归测试，再跑一遍全链路。",
        "把这次 Bug 写成团队检查项，让它只发生一次。",
      ],
    },
    story: {
      label: "讲故事",
      defaultPrompt: "讲一个关于 1024 的故事",
      steps: (prompt) => [
        `先定一句话：你想让谁听见「${prompt}」。`,
        "搭结构：开头 3 秒、一个转折、一个结尾。",
        "用具体细节替换形容词；删掉第一段的一半。",
        "发布后读 10 条评论，再写下一版。",
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
    return lines.length;
  };

  CTM.drawAiBackdrop = function drawAiBackdrop(ctx, width, height, palette, seed) {
    const rand = seeded(seed || 1024);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, palette.bg);
    bg.addColorStop(1, palette.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const orbs = [
      { x: width * 0.16, y: height * 0.2, r: width * 0.45, color: palette.accent },
      { x: width * 0.88, y: height * 0.36, r: width * 0.4, color: palette.accent2 },
      { x: width * 0.46, y: height * 0.95, r: width * 0.5, color: palette.accent },
    ];
    orbs.forEach((orb, index) => {
      const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
      gradient.addColorStop(0, `${orb.color}${index === 1 ? "33" : "22"}`);
      gradient.addColorStop(1, `${orb.color}00`);
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
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(width * 0.76, height * 0.28, width * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width * 0.76, height * 0.28, width * 0.23, 0, Math.PI * 2);
    ctx.stroke();

    for (let index = 0; index < 46; index += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const size = 1 + rand() * 3;
      ctx.fillStyle = index % 4 === 0 ? `${palette.accent2}88` : `${palette.accent}66`;
      ctx.fillRect(x, y, size, size);
    }

    for (let index = 0; index < 8; index += 1) {
      const y = height * (0.1 + rand() * 0.8);
      const x = rand() * width * 0.8;
      const w = width * (0.1 + rand() * 0.3);
      ctx.strokeStyle = `${palette.accent}22`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.stroke();
    }

    ctx.fillStyle = `${palette.ink}0d`;
    ctx.font = `800 ${Math.round(width * 0.7)}px "Arial Black", "PingFang SC", sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("1024", width * 0.96, height * 0.86);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  };

  const drawPoster = (canvas, data, width, height) => {
    const w = width || 1080;
    const h = height || 1440;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const palette = PALETTES[data.style] || PALETTES.cyber;
    CTM.drawAiBackdrop(ctx, w, h, palette, data.seed || 1024);

    const pad = Math.round(w * 0.075);
    ctx.fillStyle = palette.muted;
    ctx.font = '600 22px "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = "left";
    ctx.fillText("LOCAL GENERATION / 2026", pad, pad + 10);
    ctx.textAlign = "right";
    ctx.fillText("TRAE 1024", w - pad, pad + 10);
    ctx.textAlign = "left";

    ctx.strokeStyle = `${palette.accent}66`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + 38);
    ctx.lineTo(w - pad, pad + 38);
    ctx.stroke();

    ctx.fillStyle = palette.muted;
    ctx.font = '600 24px "SFMono-Regular", Consolas, monospace';
    ctx.fillText(`目标 · ${GOALS[data.goal] ? GOALS[data.goal].label : "做工具"}`, pad, pad + 96);
    ctx.fillText(`风格 · ${palette.name}`, pad, pad + 132);

    ctx.fillStyle = palette.accent;
    ctx.font = `800 ${Math.round(w * 0.16)}px "Arial Black", "PingFang SC", sans-serif`;
    ctx.fillText("//", pad, h * 0.34);

    ctx.fillStyle = palette.ink;
    const size = String(data.prompt || "").length > 28 ? Math.round(w * 0.058) : Math.round(w * 0.075);
    ctx.font = `700 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    wrapText(ctx, data.prompt || "等待你的指令。", pad, h * 0.43, w - pad * 2, Math.round(size * 1.45), 5);

    ctx.strokeStyle = `${palette.accent2}88`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, h * 0.66);
    ctx.lineTo(pad + w * 0.2, h * 0.66);
    ctx.stroke();

    ctx.fillStyle = palette.muted;
    ctx.font = '500 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("一句话需求，四个时代之后，变成一份可以执行的计划。", pad, h * 0.72);

    ctx.fillStyle = palette.accent;
    ctx.font = '700 26px "SFMono-Regular", Consolas, monospace';
    ctx.fillText("NO NETWORK · NO API KEY", pad, h - pad - 54);

    ctx.fillStyle = palette.muted;
    ctx.font = '500 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("代码时间机器 / 1024Builder作品秀", pad, h - pad - 16);

    ctx.fillStyle = `${palette.accent2}22`;
    ctx.fillRect(w - pad - 120, h - pad - 118, 120, 120);
    ctx.strokeStyle = `${palette.accent2}99`;
    ctx.lineWidth = 2;
    ctx.strokeRect(w - pad - 120, h - pad - 118, 120, 120);
    ctx.fillStyle = palette.accent2;
    ctx.font = '700 20px "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.fillText("BUILD", w - pad - 60, h - pad - 66);
    ctx.fillText("1024", w - pad - 60, h - pad - 38);
    ctx.textAlign = "left";
  };

  const generatePlan = (goal, style, prompt, seed, regenCount) => {
    const goalData = GOALS[goal] || GOALS.tool;
    const palette = PALETTES[style] || PALETTES.cyber;
    return {
      goal,
      style,
      prompt,
      seed,
      regenCount,
      planTitle: `你的 Build：${prompt}`,
      steps: goalData.steps(prompt),
      paletteName: palette.name,
    };
  };

  const goalsHtml = Object.entries(GOALS)
    .map(
      ([id, goal], index) =>
        `<button class="chip ${index === 0 ? "is-on" : ""}" type="button" data-goal="${id}" aria-pressed="${index === 0}">${goal.label}</button>`
    )
    .join("");

  const stylesHtml = Object.entries(PALETTES)
    .map(
      ([id, palette], index) =>
        `<button class="chip ${id === "cyber" ? "is-on" : ""}" type="button" data-style="${id}" aria-pressed="${id === "cyber"}">${palette.name}</button>`
    )
    .join("");

  CTM.eras.push({
    id: "ai",
    label: "AI",
    year: 2026,
    theme: "ai",
    icon: "ai",
    place: "你的桌前 · 2026",
    intro: "你不再需要记住所有语法。你只需要说清楚，你想 Build 什么。",
    task: "给 AI 一句需求，生成一份 Build 计划",
    taskDesc: "选择目标和风格，写下你的需求。生成计划，再采纳它。所有生成都在本地完成。",
    sources: [
      "2021 年，GitHub Copilot 进入技术预览，AI 开始直接参与代码补全。",
      "2022 年，ChatGPT 让自然语言成为新的编程接口；2026 年，AI 原生编程成为日常。",
      "工具从“写代码”变成“说清楚要什么”，但对需求的判断、对结果的验收，仍然属于 Builder。",
    ],
    sceneHtml: `<div class="ai-scene">
      <div class="ai-orb" aria-hidden="true"></div>
      <div class="ai-poster-wrap">
        <canvas class="ai-poster" data-ai-poster></canvas>
      </div>
      <div class="ai-caption"><span>LOCAL GENERATION</span> / 不联网，也能生成</div>
    </div>`,
    panelHtml: `<div class="prompt-console">
        <div class="control-label">目标</div>
        <div class="chip-row" data-goals>${goalsHtml}</div>
        <div class="control-label">风格</div>
        <div class="chip-row" data-styles>${stylesHtml}</div>
        <label class="control-label" for="ai-prompt">一句话需求</label>
        <textarea id="ai-prompt" class="prompt-input" maxlength="60" data-prompt placeholder="例如：做一个帮室友记外卖钱的小工具"></textarea>
        <div class="suggestion-row" data-suggestions>
          <button class="suggestion" type="button" data-suggest="tool">做一个帮室友记外卖钱的小工具</button>
          <button class="suggestion" type="button" data-suggest="bug">修一个只在周五出现的 Bug</button>
          <button class="suggestion" type="button" data-suggest="story">讲一个关于 1024 的故事</button>
        </div>
        <div class="ai-actions">
          <button class="btn btn-primary" type="button" data-generate>生成</button>
          <button class="btn btn-ghost" type="button" data-regen disabled>再生成一次</button>
        </div>
      </div>
      <div class="ai-plan" data-plan>
        <div class="plan-title">等待你的指令。</div>
        <div class="plan-step"><span class="step-num">01</span><span>写下一句需求，AI 会把它拆成 4 步。</span></div>
        <div class="plan-step"><span class="step-num">02</span><span>生成后再决定要不要采纳。</span></div>
      </div>
      <button class="btn btn-primary ai-adopt" type="button" data-adopt disabled>采纳这份计划</button>
      <p class="ai-note">本地生成，不调用真实大模型；这是对“AI 协作”的一个可玩模拟。</p>`,
    mount(scene, panel, api) {
      const canvas = scene.querySelector("[data-ai-poster]");
      const goalsEl = panel.querySelector("[data-goals]");
      const stylesEl = panel.querySelector("[data-styles]");
      const promptInput = panel.querySelector("[data-prompt]");
      const suggestionsEl = panel.querySelector("[data-suggestions]");
      const generateBtn = panel.querySelector("[data-generate]");
      const regenBtn = panel.querySelector("[data-regen]");
      const planEl = panel.querySelector("[data-plan]");
      const adoptBtn = panel.querySelector("[data-adopt]");

      const local = {
        goal: "tool",
        style: "cyber",
        prompt: "",
        seed: 1024,
        regenCount: 0,
        generated: null,
        locked: false,
        completeTimer: null,
        cancelled: false,
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

      const renderPlan = () => {
        if (!local.generated) {
          planEl.innerHTML = `<div class="plan-title">等待你的指令。</div>
            <div class="plan-step"><span class="step-num">01</span><span>写下一句需求，AI 会把它拆成 4 步。</span></div>
            <div class="plan-step"><span class="step-num">02</span><span>生成后再决定要不要采纳。</span></div>`;
          adoptBtn.disabled = true;
          regenBtn.disabled = true;
          return;
        }
        const plan = local.generated;
        planEl.innerHTML = `<div class="plan-title">${CTM.utils.escapeHtml(plan.planTitle)}</div>${plan.steps
          .map(
            (step, index) =>
              `<div class="plan-step"><span class="step-num">0${index + 1}</span><span>${CTM.utils.escapeHtml(
                step
              )}</span></div>`
          )
          .join("")}`;
        adoptBtn.disabled = local.locked;
        regenBtn.disabled = local.locked;
      };

      const renderPoster = (data) => {
        drawPoster(canvas, data || {
          goal: local.goal,
          style: local.style,
          prompt: promptInput.value.trim() || "等待你的指令。",
          seed: local.seed,
        });
      };

      const invalidate = () => {
        local.generated = null;
        renderPlan();
      };

      const onGoalClick = (event) => {
        const button = event.target.closest("[data-goal]");
        if (!button || local.locked) return;
        local.goal = button.dataset.goal;
        renderChips();
        invalidate();
        renderPoster();
        api.feedback(`目标：${GOALS[local.goal].label}。`, "");
        CTM.audio.click();
      };

      const onStyleClick = (event) => {
        const button = event.target.closest("[data-style]");
        if (!button || local.locked) return;
        local.style = button.dataset.style;
        renderChips();
        if (local.generated) {
          local.generated.style = local.style;
          local.generated.paletteName = PALETTES[local.style].name;
          renderPoster(local.generated);
        } else {
          renderPoster();
        }
        api.feedback(`风格：${PALETTES[local.style].name}。`, "");
        CTM.audio.click();
      };

      const onPromptInput = () => {
        if (local.locked) return;
        local.prompt = promptInput.value;
        if (local.generated) invalidate();
      };

      const onSuggestion = (event) => {
        const button = event.target.closest("[data-suggest]");
        if (!button || local.locked) return;
        local.goal = button.dataset.suggest;
        const text = GOALS[local.goal].defaultPrompt;
        promptInput.value = text;
        local.prompt = text;
        renderChips();
        invalidate();
        renderPoster();
        api.feedback("需求已填入。点“生成”看计划。", "");
        CTM.audio.click();
      };

      const doGenerate = (isRegen) => {
        if (local.locked) return;
        let prompt = promptInput.value.trim();
        if (!prompt) {
          prompt = GOALS[local.goal].defaultPrompt;
          promptInput.value = prompt;
        }
        local.prompt = prompt;
        local.seed = Math.floor(Math.random() * 1e9) + 1;
        if (isRegen) local.regenCount += 1;
        local.generated = generatePlan(local.goal, local.style, prompt, local.seed, local.regenCount);
        renderPlan();
        renderPoster(local.generated);
        api.feedback(isRegen ? "换了一种写法。可以继续换，或采纳。" : "生成完成。看看这份计划，再决定要不要采纳。", "ok");
        CTM.audio.chime();
      };

      const onGenerate = () => doGenerate(false);
      const onRegen = () => doGenerate(true);

      const onAdopt = () => {
        if (local.locked || !local.generated) {
          if (!local.locked) api.feedback("先生成一份计划，再采纳。", "error");
          return;
        }
        local.locked = true;
        adoptBtn.disabled = true;
        generateBtn.disabled = true;
        regenBtn.disabled = true;
        promptInput.disabled = true;
        goalsEl.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
        stylesEl.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
        suggestionsEl.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });

        const prompt = local.generated.prompt;
        CTM.state.ai = {
          goal: local.generated.goal,
          style: local.generated.style,
          prompt,
          seed: local.generated.seed,
          plan: local.generated.steps.slice(),
        };

        const expression = 5 + (prompt.length >= 12 ? 2 : 0) + (local.regenCount > 0 ? 1 : 0);
        const score = {
          direction: 17,
          expression: Math.min(8, expression),
        };
        const successHtml = `AI 没有替你做决定。它只是把你的一句需求，变成了一份可以执行的计划：<b>${CTM.utils.escapeHtml(
          prompt
        )}</b>。`;
        api.feedback("已采纳。这份计划会跟你一起回到 2026。", "ok");
        CTM.audio.success();
        local.completeTimer = setTimeout(
          () => !local.cancelled && api.complete(score, { ...CTM.state.ai }, successHtml),
          700
        );
      };

      goalsEl.addEventListener("click", onGoalClick);
      stylesEl.addEventListener("click", onStyleClick);
      promptInput.addEventListener("input", onPromptInput);
      suggestionsEl.addEventListener("click", onSuggestion);
      generateBtn.addEventListener("click", onGenerate);
      regenBtn.addEventListener("click", onRegen);
      adoptBtn.addEventListener("click", onAdopt);

      renderChips();
      renderPlan();
      renderPoster();

      return () => {
        local.cancelled = true;
        if (local.completeTimer) clearTimeout(local.completeTimer);
        goalsEl.removeEventListener("click", onGoalClick);
        stylesEl.removeEventListener("click", onStyleClick);
        promptInput.removeEventListener("input", onPromptInput);
        suggestionsEl.removeEventListener("click", onSuggestion);
        generateBtn.removeEventListener("click", onGenerate);
        regenBtn.removeEventListener("click", onRegen);
        adoptBtn.removeEventListener("click", onAdopt);
      };
    },
  });
})(window.CTM = window.CTM || {});
