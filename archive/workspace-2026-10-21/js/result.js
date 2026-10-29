(function (CTM) {
  "use strict";

  const DIM_MAX = { manual: 30, systems: 60, expression: 33, direction: 27 };
  const DIM_LABELS = { manual: "手工", systems: "底层", expression: "表达", direction: "指挥" };

  const TYPE_DEFS = {
    manual: {
      name: "打孔卡匠人",
      en: "The Punch-Card Artisan",
      desc: "你相信精确。一个孔打错，整匹布都会说话。你愿意把一件小事做到没有毛边。",
      keywords: ["精确", "手感", "耐心"],
      era: "1804",
    },
    systems: {
      name: "寄存器魔术师",
      en: "The Register Magician",
      desc: "你喜欢把复杂拆成几条指令，然后让机器自己跑。你看得见顺序，也看得见顺序背后的代价。",
      keywords: ["拆解", "组合", "底层"],
      era: "1945",
    },
    expression: {
      name: "网页炼金术士",
      en: "The Web Alchemist",
      desc: "你把想法变成页面，把页面变成别人能看见的东西。你在意别人第一眼看见什么。",
      keywords: ["表达", "审美", "发布"],
      era: "1991",
    },
    direction: {
      name: "Prompt 指挥家",
      en: "The Prompt Conductor",
      desc: "你不写所有代码，但你决定什么值得被写。你把模糊的“想要”翻译成清晰的下一步。",
      keywords: ["判断", "指挥", "上线"],
      era: "2026",
    },
    "mechanical-poet": {
      name: "机械诗人",
      en: "The Mechanical Poet",
      desc: "你既能拧螺丝，也能写说明书。底层和手感你都懂，所以你做出来的东西既有骨架，也有温度。",
      keywords: ["精确", "拆解", "手感"],
      era: "1804",
    },
    "system-translator": {
      name: "系统翻译官",
      en: "The System Translator",
      desc: "你在机器和人之间来回翻译，让两边都听懂。你写的不只是代码，也是别人能接住的说明。",
      keywords: ["拆解", "表达", "组合"],
      era: "1972",
    },
    "product-alchemist": {
      name: "产品炼金术士",
      en: "The Product Alchemist",
      desc: "你关心用户，也关心实现；你把“想要”变成“可用”。你判断一个东西值不值得做，比怎么做更快。",
      keywords: ["表达", "判断", "上线"],
      era: "2026",
    },
    "pixel-artisan": {
      name: "像素工匠",
      en: "The Pixel Artisan",
      desc: "你愿意为一个像素、一行文案、一个按钮的位置多改三遍。你知道细节不会说话，但用户会感觉到。",
      keywords: ["精确", "表达", "审美"],
      era: "1991",
    },
    "fullstack-conductor": {
      name: "全栈指挥家",
      en: "The Full-Stack Conductor",
      desc: "你从打孔卡一路指挥到 Prompt，哪一段都能自己上。你不一定每样都最深，但你能让整件事发生。",
      keywords: ["判断", "精确", "上线"],
      era: "2007",
    },
    "architecture-pilot": {
      name: "架构驾驶员",
      en: "The Architecture Pilot",
      desc: "你先看容量、再看成本，最后才看代码。你知道系统不会因为一句口号变稳，只会因为一个决定变稳。",
      keywords: ["判断", "拆解", "底层"],
      era: "2007",
    },
    traveler: {
      name: "时间旅行者",
      en: "The Time Traveler",
      desc: "不属于某一个时代，只是一直在 Build。下一个时代，继续。",
      keywords: ["好奇", "跨界", "持续 Build"],
      era: "2026",
    },
  };

  const PAIR_TYPES = {
    "manual+systems": "mechanical-poet",
    "expression+systems": "system-translator",
    "direction+expression": "product-alchemist",
    "expression+manual": "pixel-artisan",
    "direction+manual": "fullstack-conductor",
    "direction+systems": "architecture-pilot",
  };

  const BEST_WHY = [
    "你适合 1804 年的里昂：那时候，耐心本身就是一种算力。",
    "你适合 1945 年的宾夕法尼亚：一整间屋子的真空管，也愿意听你的顺序。",
    "你适合 1972 年的贝尔实验室：小工具、管道、和一群不肯把问题留到明天的人。",
    "你适合 1991 年的 CERN：世界刚刚学会链接，你刚好想发布点什么。",
    "你适合 2007 年的旧金山：一只手就能握住整个互联网，而你在想怎么让它不崩。",
    "你适合 2026 年：工具已经足够多，缺的是知道要 Build 什么的人。",
  ];
  const TRAVELER_WHY = "你不属于某一个时代。2026 只是你下一次 Build 的起点。";

  const clampScore = (value, key) => CTM.utils.clamp(Number(value) || 0, 0, DIM_MAX[key]);
  const sumScores = (entry) => {
    if (!entry) return 0;
    return (
      (Number(entry.manual) || 0) +
      (Number(entry.systems) || 0) +
      (Number(entry.expression) || 0) +
      (Number(entry.direction) || 0)
    );
  };

  const normalizeScores = (scores) => ({
    manual: clampScore(scores && scores.manual, "manual"),
    systems: clampScore(scores && scores.systems, "systems"),
    expression: clampScore(scores && scores.expression, "expression"),
    direction: clampScore(scores && scores.direction, "direction"),
  });

  const normalizeEraScores = (eraScores) => {
    const list = Array.isArray(eraScores) ? eraScores : [];
    return Array.from({ length: 6 }, (_, index) => {
      const entry = list[index] || {};
      return {
        manual: Math.max(0, Number(entry.manual) || 0),
        systems: Math.max(0, Number(entry.systems) || 0),
        expression: Math.max(0, Number(entry.expression) || 0),
        direction: Math.max(0, Number(entry.direction) || 0),
      };
    });
  };

  const pickType = (pct) => {
    const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const second = sorted[1];
    const last = sorted[sorted.length - 1];
    if (top[1] - last[1] <= 12) return "traveler";
    if (top[1] - second[1] <= 8) {
      const key = [top[0], second[0]].sort().join("+");
      if (PAIR_TYPES[key]) return PAIR_TYPES[key];
    }
    return top[0];
  };

  const pickBest = (eraScores) => {
    let bestIndex = 5;
    let bestScore = -1;
    eraScores.forEach((entry, index) => {
      const total = sumScores(entry);
      if (total > bestScore) {
        bestScore = total;
        bestIndex = index;
      }
    });
    return bestIndex;
  };

  const buildData = (source) => {
    const scores = normalizeScores(source.scores);
    const eraScores = normalizeEraScores(source.eraScores);
    const pct = {
      manual: Math.round((scores.manual / DIM_MAX.manual) * 100),
      systems: Math.round((scores.systems / DIM_MAX.systems) * 100),
      expression: Math.round((scores.expression / DIM_MAX.expression) * 100),
      direction: Math.round((scores.direction / DIM_MAX.direction) * 100),
    };
    const typeId = pickType(pct);
    const type = TYPE_DEFS[typeId] || TYPE_DEFS.traveler;
    let bestIndex = pickBest(eraScores);
    if (typeId === "traveler") {
      bestIndex = 5;
    } else {
      const totals = eraScores.map(sumScores);
      const max = Math.max(...totals);
      const tied = totals.map((total, index) => (total === max ? index : -1)).filter((index) => index >= 0);
      const affinity = CTM.eras.findIndex((era) => String(era.year) === type.era);
      if (tied.includes(affinity)) bestIndex = affinity;
    }
    return {
      traveler: String(source.traveler || CTM.DEFAULT_TRAVELER).slice(0, 16),
      scores,
      eraScores,
      pct,
      typeId,
      type,
      bestIndex,
      bestEra: CTM.eras[bestIndex] || CTM.eras[5],
      bestWhy: typeId === "traveler" ? TRAVELER_WHY : BEST_WHY[bestIndex] || BEST_WHY[5],
      duration: source.duration || "—",
      ai: source.ai || null,
      stamps: Number(source.stamps) || 6,
      takeover: Array.isArray(source.takeover) ? source.takeover.map(Number).filter((n) => n >= 0 && n < 6) : [],
      shared: Boolean(source.shared),
    };
  };

  const compute = () =>
    buildData({
      traveler: CTM.state.traveler,
      scores: CTM.state.scores,
      eraScores: CTM.state.eraScores,
      duration: CTM.utils.formatDuration(CTM.state.startedAt, CTM.state.finishedAt),
      ai: CTM.state.ai,
      stamps: CTM.state.stamps.length,
      takeover: CTM.state.takeover,
      shared: false,
    });

  const decode = (input) => {
    const payload = typeof input === "string" ? CTM.utils.decodeShare(input) : input;
    if (!payload || payload.v !== 1) return null;
    const ai =
      payload.a && typeof payload.a === "object"
        ? {
            goal: payload.a.g || "tool",
            style: payload.a.s || "cyber",
            prompt: String(payload.a.p || "").slice(0, 60),
            seed: Number(payload.a.seed) || 1024,
          }
        : null;
    return buildData({
      traveler: typeof payload.n === "string" ? payload.n : CTM.DEFAULT_TRAVELER,
      scores: payload.s,
      eraScores: payload.e,
      duration: typeof payload.d === "string" ? payload.d : "—",
      ai,
      stamps: 6,
      takeover: Array.isArray(payload.t) ? payload.t : [],
      shared: true,
    });
  };

  const roundRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
    const chars = Array.from(String(text || ""));
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
    return lines;
  };

  const wrapSentences = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
    const sentences = String(text || "")
      .split("。")
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .map((sentence) => `${sentence}。`);
    let lineIndex = 0;
    for (const sentence of sentences) {
      const chars = Array.from(sentence);
      let line = "";
      for (const char of chars) {
        const test = line + char;
        if (ctx.measureText(test).width > maxWidth && line) {
          if (lineIndex >= maxLines) return;
          ctx.fillText(line, x, y + lineIndex * lineHeight);
          lineIndex += 1;
          line = char;
        } else {
          line = test;
        }
      }
      if (line && lineIndex < maxLines) {
        ctx.fillText(line, x, y + lineIndex * lineHeight);
        lineIndex += 1;
      }
      if (lineIndex >= maxLines) return;
    }
  };

  const drawRadarAt = (ctx, cx, cy, radius, pct, palette, options) => {
    const opts = options || {};
    const fontSize = opts.fontSize || 12;
    const labelColor = opts.labelColor || palette.muted;
    const accent = palette.accent;
    const accent2 = palette.accent2;
    const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
    const keys = ["manual", "systems", "expression", "direction"];
    const labels = ["手工", "底层", "表达", "指挥"];

    for (let ring = 1; ring <= 4; ring += 1) {
      const r = (radius * ring) / 4;
      ctx.beginPath();
      angles.forEach((angle, index) => {
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = ring === 4 ? `${accent}55` : "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    angles.forEach((angle) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
    });

    const points = keys.map((key, index) => {
      const value = CTM.utils.clamp(pct[key] || 0, 0, 100) / 100;
      return {
        x: cx + Math.cos(angles[index]) * radius * value,
        y: cy + Math.sin(angles[index]) * radius * value,
      };
    });

    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = `${accent}22`;
    ctx.fill();
    ctx.strokeStyle = accent2;
    ctx.lineWidth = opts.lineWidth || 2;
    ctx.stroke();

    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, opts.dotRadius || 3, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    });

    ctx.font = `600 ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = labelColor;
    const showValues = opts.showValues !== false;
    angles.forEach((angle, index) => {
      const label = showValues
        ? `${labels[index]} ${Math.round(pct[keys[index]] || 0)}`
        : labels[index];
      const lx = cx + Math.cos(angle) * (radius + fontSize * 1.3);
      const ly = cy + Math.sin(angle) * (radius + fontSize * 1.3);
      if (index === 0) {
        ctx.textAlign = "center";
        ctx.fillText(label, lx, ly - 4);
      } else if (index === 2) {
        ctx.textAlign = "center";
        ctx.fillText(label, lx, ly + fontSize + 4);
      } else if (index === 1) {
        ctx.textAlign = "left";
        ctx.fillText(label, lx + 4, ly + fontSize / 3);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(label, lx - 4, ly + fontSize / 3);
      }
    });
    ctx.textAlign = "left";
  };

  const drawRadar = (canvas, pct) => {
    if (!canvas) return;
    const size = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const palette = { accent: "#8ff0ff", accent2: "#c084fc", muted: "#98a0bf" };
    drawRadarAt(ctx, size / 2, size / 2, size * 0.3, pct, palette, {
      fontSize: 11,
      lineWidth: 2,
      dotRadius: 3,
    });
  };

  const drawPill = (ctx, text, x, y, palette) => {
    ctx.font = '500 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    const width = ctx.measureText(text).width + 34;
    roundRect(ctx, x, y - 25, width, 38, 19);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = `${palette.accent}44`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = palette.accent2;
    ctx.fillText(text, x + 17, y);
    return x + width + 10;
  };

  const drawPoster = (canvas, data) => {
    if (!canvas) return;
    const width = 1080;
    const height = 1440;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const palettes = CTM.AI_PALETTES || {};
    const palette = palettes[data.ai && data.ai.style] || palettes.cyber || {
      bg: "#05060a",
      bg2: "#100a1f",
      accent: "#8ff0ff",
      accent2: "#c084fc",
      ink: "#f2f5ff",
      muted: "#98a0bf",
    };

    if (typeof CTM.drawAiBackdrop === "function") {
      CTM.drawAiBackdrop(ctx, width, height, palette, (data.ai && data.ai.seed) || 1024);
    } else {
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);
    }

    const vignette = ctx.createRadialGradient(width / 2, height * 0.42, width * 0.2, width / 2, height * 0.5, width);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `${palette.accent}22`;
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    const pad = 72;
    ctx.fillStyle = palette.muted;
    ctx.font = '600 22px "SFMono-Regular", Consolas, monospace';
    ctx.textAlign = "left";
    ctx.fillText("TRAE 1024 / CODE TIME MACHINE", pad, 96);
    ctx.textAlign = "right";
    ctx.fillText("2026.10.24", width - pad, 96);
    ctx.textAlign = "left";

    ctx.fillStyle = palette.accent;
    ctx.font = '500 24px "SFMono-Regular", Consolas, monospace';
    ctx.fillText(`旅行者 / ${data.traveler}`, pad, 154);

    ctx.fillStyle = palette.ink;
    ctx.font = '800 78px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("我的 Builder", pad, 250);
    ctx.fillText("时间旅行档案", pad, 338);

    ctx.fillStyle = palette.accent2;
    ctx.font = '800 58px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(data.type.name, pad, 448);

    ctx.fillStyle = palette.muted;
    ctx.font = '600 22px "SFMono-Regular", Consolas, monospace';
    ctx.fillText(data.type.en, pad, 486);

    ctx.fillStyle = palette.muted;
    ctx.font = '500 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapSentences(ctx, data.type.desc, pad, 546, 540, 36, 4);

    drawRadarAt(ctx, 805, 552, 150, data.pct, palette, {
      fontSize: 17,
      lineWidth: 2.2,
      dotRadius: 4,
      labelColor: palette.muted,
      showValues: false,
    });

    const stampY = 790;
    const itemWidth = 140;
    const gap = 19;
    CTM.eras.forEach((era, index) => {
      const cx = pad + index * (itemWidth + gap) + itemWidth / 2;
      ctx.beginPath();
      ctx.arc(cx, stampY, 43, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.025)";
      ctx.fill();
      ctx.strokeStyle = `${palette.accent}aa`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, stampY, 36, 0, Math.PI * 2);
      ctx.strokeStyle = `${palette.accent}33`;
      ctx.stroke();
      ctx.fillStyle = palette.ink;
      ctx.font = '700 19px "SFMono-Regular", Consolas, monospace';
      ctx.textAlign = "center";
      ctx.fillText(String(era.year), cx, stampY + 7);
      ctx.fillStyle = palette.muted;
      ctx.font = '500 16px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(era.label, cx, stampY + 72);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = palette.accent;
    ctx.font = '600 18px "SFMono-Regular", Consolas, monospace';
    ctx.fillText("BEST ERA", pad, 940);
    ctx.fillStyle = palette.ink;
    ctx.font = '700 40px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${data.bestEra.year} · ${data.bestEra.label}`, pad, 992);
    ctx.fillStyle = palette.muted;
    ctx.font = '500 23px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapText(ctx, data.bestWhy, pad, 1038, 760, 34, 2);

    let pillX = pad;
    data.type.keywords.forEach((keyword) => {
      pillX = drawPill(ctx, keyword, pillX, 1114, palette);
    });

    ctx.fillStyle = palette.ink;
    ctx.font = '600 32px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapText(ctx, "从打孔卡到 Prompt，工具在变，Build 不变。", pad, 1206, 900, 46, 2);

    ctx.fillStyle = palette.muted;
    ctx.font = '500 19px "PingFang SC", "Microsoft YaHei", sans-serif';
    const aiLine = data.ai && data.ai.prompt ? `AI 时代需求：${data.ai.prompt}` : `完成 ${data.stamps}/6 个时代 · 用时 ${data.duration}`;
    wrapText(ctx, aiLine, pad, 1300, 920, 28, 1);

    ctx.strokeStyle = `${palette.accent}33`;
    ctx.beginPath();
    ctx.moveTo(pad, 1340);
    ctx.lineTo(width - pad, 1340);
    ctx.stroke();

    ctx.fillStyle = palette.muted;
    ctx.font = '500 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("代码时间机器 / TRAE 1024Builder作品秀", pad, 1374);
    ctx.textAlign = "right";
    ctx.fillStyle = palette.accent;
    ctx.font = '700 28px "SFMono-Regular", Consolas, monospace';
    ctx.fillText("1024", width - pad, 1378);
    ctx.textAlign = "left";
  };

  const makeShareUrl = (data) => {
    const payload = {
      v: 1,
      n: data.traveler,
      s: data.scores,
      e: data.eraScores,
      d: data.duration,
      t: data.takeover || [],
      a: data.ai
        ? {
            g: data.ai.goal,
            s: data.ai.style,
            p: data.ai.prompt,
            seed: data.ai.seed,
          }
        : null,
    };
    const base = window.location.href.split("#")[0];
    return `${base}#r=${CTM.utils.encodeShare(payload)}`;
  };

  const copyShare = (data) => {
    const url = makeShareUrl(data);
    const input = document.querySelector("[data-share-url]");
    const fallback = () => {
      if (input) {
        input.focus();
        input.select();
        try {
          const ok = document.execCommand("copy");
          if (ok) {
            CTM.ui.toast("分享链接已复制。");
            return;
          }
        } catch (error) {
          /* fall through */
        }
      }
      CTM.ui.toast("链接已生成，请手动复制。");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => CTM.ui.toast("分享链接已复制。"))
        .catch(fallback);
    } else {
      fallback();
    }
  };

  const downloadPoster = (data) => {
    const canvas = document.createElement("canvas");
    drawPoster(canvas, data);
    const safeName = String(data.type.name).replace(/[\\/:*?"<>|]/g, "");
    const filename = `1024-代码时间机器-${safeName}.png`;
    const openFallback = () => {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const win = window.open();
        if (win) {
          win.document.write(`<title>${filename}</title><img src="${dataUrl}" alt="我的 1024 时间旅行档案" style="max-width:100%">`);
          win.document.close();
        } else {
          CTM.ui.toast("浏览器拦截了新窗口，请允许弹窗后重试。");
        }
      } catch (error) {
        CTM.ui.toast("海报生成失败，请重试。");
      }
    };
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          openFallback();
          return;
        }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        CTM.ui.toast("海报已生成。若无自动下载，请长按图片保存。");
      }, "image/png");
    } else {
      openFallback();
    }
    CTM.audio.success();
  };

  const render = (data) => {
    const bars = CTM.eras
      .map((era, index) => {
        const total = sumScores(data.eraScores[index]);
        const pct = Math.round((total / 25) * 100);
        return `<div class="bar-row">
          <span class="bar-label">${era.year} ${era.label}</span>
          <span class="bar-track"><i class="bar-fill" data-bar="${pct}"></i></span>
          <span class="bar-val">${pct}%</span>
        </div>`;
      })
      .join("");

    const sharedBanner = data.shared
      ? `<div class="shared-banner">你正在查看 <b>${CTM.utils.escapeHtml(
          data.traveler
        )}</b> 的时间旅行档案。<button class="linkish" type="button" data-share-start>我也要时间旅行</button></div>`
      : "";

    const agentYears = (data.takeover || [])
      .map((index) => (CTM.eras[index] || {}).year)
      .filter(Boolean);
    const takeoverBanner = agentYears.length
      ? `<div class="takeover-note">
          <b>本局有 ${agentYears.length} 站由 Agent 接管 · ${agentYears.join(" / ")}</b>
          <span>这几站是 AI 替你 Build 的。档案如实记录，指挥维度按接管行为计分 —— 把活交出去，也是一种 Build。</span>
        </div>`
      : "";

    return `<div class="result-shell">
      ${sharedBanner}
      ${takeoverBanner}
      <header class="result-head">
        <div class="result-kicker">YOUR TIME TRAVEL REPORT / 2026</div>
        <h2 class="result-title" id="result-title">Builder 时间旅行档案</h2>
        <p class="result-sub">六枚印章，一个类型，一份可以带走的 1024 记忆。</p>
      </header>

      <div class="result-grid">
        <section class="result-card type-card" aria-label="你的 Builder 类型">
          <div class="type-kicker">BUILDER TYPE / ${CTM.utils.escapeHtml(data.type.era)}</div>
          <div class="type-name">${CTM.utils.escapeHtml(data.type.name)}</div>
          <div class="type-en">${CTM.utils.escapeHtml(data.type.en)}</div>
          <p class="type-desc">${CTM.utils.escapeHtml(data.type.desc).replace("。", "。<br>")}</p>
          <div class="type-stats">
            <div class="stat">完成时代<b>${data.stamps}/6</b></div>
            <div class="stat">用时<b>${CTM.utils.escapeHtml(data.duration)}</b></div>
            <div class="stat">最像<b>${CTM.utils.escapeHtml(data.type.era)}</b></div>
          </div>
        </section>

        <section class="result-card radar-card" aria-label="四维能力雷达">
          <div class="radar-title">四维 Builder 雷达</div>
          <canvas id="result-radar" class="radar-canvas" aria-label="手工、底层、表达、指挥四维雷达图"></canvas>
        </section>

        <section class="result-card" aria-label="时代适配度">
          <div class="radar-title">时代适配度</div>
          <div class="era-bars">${bars}</div>
          <div class="best-era">
            <span class="best-icon">${CTM.icons[data.bestEra.icon] || ""}</span>
            <div class="best-meta">
              <span class="best-label">BEST ERA / 最适合</span>
              <span class="best-name">${data.bestEra.year} · ${CTM.utils.escapeHtml(data.bestEra.label)}</span>
            </div>
          </div>
          <p class="best-why">${CTM.utils.escapeHtml(data.bestWhy)}</p>
          <div class="keywords">${data.type.keywords
            .map((keyword) => `<span class="keyword">${CTM.utils.escapeHtml(keyword)}</span>`)
            .join("")}</div>
        </section>

        <section class="result-card poster-card" aria-label="可下载的海报">
          <div class="poster-title">你的 1024 时间旅行海报</div>
          <canvas id="result-poster" class="poster-preview" aria-label="我的 Builder 时间旅行档案海报"></canvas>
        </section>
      </div>

      <p class="result-quote">从打孔卡到 Prompt，<span>下一站，由你写。</span></p>

      <div class="result-actions">
        <button class="btn btn-primary" type="button" data-download>下载海报</button>
        <button class="btn" type="button" data-copy>复制分享链接</button>
        ${
          data.shared
            ? '<button class="btn btn-ghost" type="button" data-share-start>我也要时间旅行</button>'
            : '<button class="btn btn-ghost" type="button" data-replay>再玩一次</button>'
        }
      </div>
      <div class="share-box">
        <input class="share-input" type="text" readonly data-share-url aria-label="分享链接">
        <button class="btn btn-quiet" type="button" data-copy>复制</button>
      </div>

      <p class="result-foot">
        数据只保存在你的浏览器里，不会上传。海报可以离线保存。<br>
        TRAE 1024Builder作品秀 / 代码时间机器
      </p>
    </div>`;
  };

  const mount = (data) => {
    const root = document.getElementById("result-root");
    if (!root) return;

    const radar = root.querySelector("#result-radar");
    drawRadar(radar, data.pct);

    const poster = root.querySelector("#result-poster");
    drawPoster(poster, data);

    const shareInput = root.querySelector("[data-share-url]");
    if (shareInput) shareInput.value = makeShareUrl(data);

    root.querySelectorAll("[data-bar]").forEach((bar) => {
      const width = CTM.utils.clamp(bar.dataset.bar, 0, 100);
      bar.style.width = "0%";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.width = `${width}%`;
        });
      });
    });

    root.querySelectorAll("[data-download]").forEach((button) => {
      button.addEventListener("click", () => downloadPoster(data));
    });
    root.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", () => copyShare(data));
    });
    root.querySelectorAll("[data-replay]").forEach((button) => {
      button.addEventListener("click", () => CTM.resetAndHome && CTM.resetAndHome());
    });
    root.querySelectorAll("[data-share-start]").forEach((button) => {
      button.addEventListener("click", () => CTM.goHome && CTM.goHome());
    });
  };

  const show = (data) => {
    const root = document.getElementById("result-root");
    if (!root) return;
    root.innerHTML = render(data);
    mount(data);
  };

  CTM.result = {
    compute,
    decode,
    render,
    mount,
    show,
    drawPoster,
    downloadPoster,
    copyShare,
    makeShareUrl,
    buildData,
  };
})(window.CTM = window.CTM || {});
