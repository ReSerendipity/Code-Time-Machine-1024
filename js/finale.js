(function (CTM) {
  "use strict";

  const DURATION = 24000;
  const BEATS = [
    { to: 0.145, year: 1804, caption: "1804 · 里昂 —— 一个孔，决定一块布的花样", sound: "punch" },
    { to: 0.29, year: 1945, caption: "1945 · 宾夕法尼亚 —— 同一个孔，成了一次通断", sound: "relay" },
    { to: 0.44, year: 1972, caption: "1972 · 贝尔实验室 —— 孔翻成字符，字符排成工具", sound: "teletype" },
    { to: 0.585, year: 1991, caption: "1991 · CERN —— 字符有了颜色，谁都能发一份主页", sound: "modem" },
    { to: 0.73, year: 2007, caption: "2007 · 旧金山 —— 主页装进口袋，请求飞向机房", sound: "fan" },
    { to: 0.9, year: 2026, caption: "2026 · 你的桌前 —— 你说一句话，机器开始动手", sound: "generate" },
    { to: 1.001, year: null, caption: "从纸带到光标，222 年。", sound: "chime" },
  ];

  const INK = "#0a0806";
  const MONO = '"SFMono-Regular", Consolas, "Courier New", monospace';
  const SANS = '"PingFang SC", "Microsoft YaHei", sans-serif';

  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const ease = (value) => (value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2);
  const sub = (start, end, value) => clamp01((value - start) / (end - start));

  function circle(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function text(ctx, value, x, y, font, color, align) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x, y);
    ctx.textAlign = "left";
  }

  /* 贯穿全片的“一个孔”：每段换一个身份，但半径和位置连续 */
  function heroHole(ctx, x, y, r, color, glow) {
    if (glow) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      halo.addColorStop(0, glow);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    }
    circle(ctx, x, y, r, color);
  }

  /* 1804：纸带 + 打孔臂 */
  function sceneTape(ctx, w, h, p) {
    const tapeH = Math.min(h * 0.34, 210);
    const y = h / 2 - tapeH / 2;
    ctx.fillStyle = "#efe6cf";
    ctx.fillRect(0, y, w, tapeH);
    ctx.strokeStyle = "rgba(58,47,28,0.18)";
    ctx.lineWidth = 1;
    for (let row = 1; row < 4; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y + (tapeH / 4) * row);
      ctx.lineTo(w, y + (tapeH / 4) * row);
      ctx.stroke();
    }

    const step = 54;
    const shift = -((1 - p) * w * 0.55);
    const bits = "10010";
    for (let column = 0; shift + column * step < w + step; column += 1) {
      const x = shift + column * step;
      if (x < -step) continue;
      const punched = bits[column % 5] === "1";
      for (let row = 0; row < 2; row += 1) {
        const cy = y + tapeH * (row === 0 ? 0.33 : 0.67);
        const isHero = column === 6 && row === (punched ? 0 : 1);
        if (punched || isHero) {
          heroHole(ctx, x, cy, 9, "rgba(20,15,8,0.92)", isHero ? "rgba(255,226,170,0.55)" : null);
        } else {
          circle(ctx, x, cy, 9, "rgba(58,47,28,0.12)");
        }
      }
    }

    const arm = 0.5 + 0.5 * Math.sin(p * Math.PI * 7);
    const armX = shift + 6 * step;
    ctx.fillStyle = "#8a6a3a";
    ctx.fillRect(armX - 7, y - 96 + arm * 74, 14, 96);
    ctx.fillStyle = "#e0a458";
    ctx.fillRect(armX - 12, y - 100 + arm * 74, 24, 10);
    text(ctx, "JACQUARD · 1804", 32, 46, `600 12px ${MONO}`, "rgba(242,208,164,0.55)");
  }

  /* 1945：孔变成触点 */
  function sceneRelay(ctx, w, h, p) {
    const close = ease(sub(0.25, 0.62, p));
    const gap = 26 * (1 - close);
    const cy = h / 2;
    const cx = w / 2;

    ctx.strokeStyle = "rgba(108,255,158,0.22)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i += 1) {
      const x = (w / 7) * i + 24;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.16);
      ctx.lineTo(x, h * 0.84);
      ctx.stroke();
    }

    ctx.fillStyle = "#0b1a10";
    ctx.strokeStyle = "rgba(108,255,158,0.4)";
    roundRect(ctx, cx - 150, cy - 74, 300, 148, 10, "#0b1a10", "rgba(108,255,158,0.4)");
    ctx.fillStyle = "rgba(108,255,158,0.75)";
    ctx.fillRect(cx - 118, cy - 6, 74 - gap / 2, 12);
    ctx.fillRect(cx + 44 + gap / 2, cy - 6, 74 - gap / 2, 12);
    heroHole(ctx, cx, cy, 11, close ? "#b7ffd0" : "#04120a", close ? "rgba(108,255,158,0.5)" : null);

    const lit = close > 0.85 ? sub(0.62, 0.95, p) : 0;
    for (let i = 0; i < 9; i += 1) {
      const x = cx - 128 + i * 32;
      const on = i / 9 < lit;
      roundRect(ctx, x - 8, h * 0.16 - 26, 16, 40, 6, on ? "#ffcf8a" : "#3a2a18", null);
    }
    text(ctx, "ENIAC · 1945", 32, 46, `600 12px ${MONO}`, "rgba(108,255,158,0.5)");
  }

  /* 1972：孔翻成字符 */
  function sceneTeletype(ctx, w, h, p) {
    const line = "WRITE PROGRAMS THAT DO ONE THING AND DO IT WELL.";
    const shown = Math.floor(ease(sub(0.1, 0.85, p)) * line.length);
    const size = Math.min(30, w / 26);
    ctx.font = `700 ${size}px ${MONO}`;
    const textW = ctx.measureText(line).width;
    let x = w / 2 - textW / 2;
    const y = h / 2;
    const holeIndex = line.indexOf("ONE");

    for (let i = 0; i < line.length; i += 1) {
      const charW = ctx.measureText(line[i]).width;
      if (i < shown) {
        const isHole = i === holeIndex;
        if (isHole) {
          heroHole(ctx, x + charW / 2, y, size * 0.34, "rgba(20,15,8,0.9)", "rgba(240,198,116,0.5)");
          ctx.strokeStyle = "#f0c674";
          ctx.lineWidth = 2;
          circle(ctx, x + charW / 2, y, size * 0.34);
        } else {
          ctx.fillStyle = "#f0c674";
          ctx.textBaseline = "middle";
          ctx.fillText(line[i], x, y);
        }
      }
      x += charW;
    }

    ctx.fillStyle = "rgba(240,198,116,0.06)";
    ctx.fillRect(0, y + size * 1.6, w, 2);
    const cursor = shown < line.length && Math.floor(p * 12) % 2 === 0;
    if (cursor) {
      ctx.fillStyle = "#fff0c2";
      ctx.fillRect(x, y - size * 0.45, size * 0.55, size * 0.9);
    }
    text(ctx, "UNIX · 1972", 32, 46, `600 12px ${MONO}`, "rgba(240,198,116,0.55)");
  }

  /* 1991：字符变成网页，孔变成计数器的一位 */
  function sceneWeb(ctx, w, h, p) {
    const bw = Math.min(w * 0.62, 620);
    const bh = Math.min(h * 0.56, 330);
    const x = w / 2 - bw / 2;
    const y = h / 2 - bh / 2;
    const grow = ease(sub(0.05, 0.6, p));

    roundRect(ctx, x, y, bw, bh, 4, "#fff", "#8d8d8d");
    ctx.fillStyle = "#d8d8d8";
    ctx.fillRect(x, y, bw, 24);
    ctx.fillStyle = "#0a2a8a";
    ctx.fillRect(x, y, bw * grow, 24);
    text(ctx, "Netscape Navigator", x + 10, y + 12, `600 11px ${SANS}`, "#fff");

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + 24, bw, bh - 24);
    ctx.clip();

    const titleSize = Math.round(bh * 0.16);
    if (grow > 0.25) {
      text(ctx, "我的第一个主页", x + 26, y + 24 + titleSize, `700 ${titleSize}px ${SANS}`, "#000080");
      ctx.strokeStyle = "#000080";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 26, y + 24 + titleSize * 1.75);
      ctx.lineTo(x + 26 + bw * 0.42, y + 24 + titleSize * 1.75);
      ctx.stroke();
    }
    if (grow > 0.55) {
      const slide = (1 - ease(sub(0.55, 1, p))) * bw;
      text(
        ctx,
        "Welcome to my homepage! 本站正在建设中，欢迎常来。",
        x + bw - slide,
        y + bh * 0.46,
        `600 13px ${SANS}`,
        "#b30000"
      );
      ctx.strokeStyle = "rgba(179,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 26, y + bh * 0.46 - 13, bw - 52, 26);
    }
    if (grow > 0.75) {
      const digits = "0001024";
      roundRect(ctx, x + 26, y + bh - 62, 176, 34, 2, "#000", "#0a0");
      text(ctx, "VISITORS", x + 34, y + bh - 45, `600 10px ${MONO}`, "#0f0");
      for (let i = 0; i < digits.length; i += 1) {
        const dx = x + 116 + i * 13;
        if (i === 3) heroHole(ctx, dx + 4, y + bh - 45, 5, "#0f0", "rgba(0,255,0,0.45)");
        text(ctx, digits[i], dx, y + bh - 45, `700 13px ${MONO}`, "#0f0");
      }
      text(ctx, "under construction", x + bw - 30, y + bh - 45, `700 11px ${MONO}`, "#111", "right");
    }
    ctx.restore();

    text(ctx, "WWW · 1991", 32, 46, `600 12px ${MONO}`, "rgba(0,229,255,0.55)");
  }

  /* 2007：孔变成请求包 */
  function sceneCloud(ctx, w, h, p) {
    const cy = h / 2;
    const phoneW = 74;
    const phoneH = 140;
    const px = w * 0.24;
    roundRect(ctx, px - phoneW / 2, cy - phoneH / 2, phoneW, phoneH, 14, "#101820", "rgba(111,195,255,0.5)");
    roundRect(ctx, px - phoneW / 2 + 7, cy - phoneH / 2 + 14, phoneW - 14, phoneH - 28, 8, "#0a2036", null);

    const rackX = w * 0.62;
    for (let i = 0; i < 4; i += 1) {
      const on = ease(sub(0.25 + i * 0.12, 0.5 + i * 0.12, p)) > 0.5;
      const x = rackX + i * 46;
      roundRect(ctx, x, cy - 52, 34, 104, 5, "#0d2740", "rgba(111,195,255,0.35)");
      ctx.fillStyle = on ? "#6cff9e" : "#28405a";
      ctx.fillRect(x + 24, cy - 46, 5, 5);
    }

    ctx.strokeStyle = "rgba(111,195,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + phoneW / 2, cy);
    ctx.lineTo(rackX, cy);
    ctx.stroke();

    for (let i = 0; i < 6; i += 1) {
      const t = (p * 1.5 + i / 6) % 1;
      const x = px + phoneW / 2 + t * (rackX - px - phoneW / 2);
      const y = cy + Math.sin(t * Math.PI) * -18;
      heroHole(ctx, x, y, 6, "rgba(143,240,255,0.95)", "rgba(143,240,255,0.35)");
    }
    text(ctx, "CLOUD · 2007", 32, 46, `600 12px ${MONO}`, "rgba(111,195,255,0.6)");
  }

  /* 2026：孔变成思考中的光点，打出玩家自己写的提示词 */
  function sceneChat(ctx, w, h, p, prompt) {
    const cw = Math.min(w * 0.7, 660);
    const x = w / 2 - cw / 2;
    const shown = Math.floor(ease(sub(0.08, 0.5, p)) * prompt.length);
    const y = h * 0.36;

    roundRect(ctx, x, h * 0.2, cw, h * 0.6, 14, "rgba(255,255,255,0.035)", "rgba(143,240,255,0.28)");
    text(ctx, "你", x + cw - 46, y - 26, `600 11px ${MONO}`, "#98a0bf", "center");
    const line = shown < prompt.length ? prompt.slice(0, shown + 1) : prompt;
    text(ctx, line, x + cw - 62, y, `600 15px ${SANS}`, "#eef2ff", "right");
    if (shown < prompt.length) {
      const caret = Math.floor(p * 10) % 2 === 0;
      if (caret) {
        const lw = ctx.measureText(line).width;
        ctx.fillStyle = "#8ff0ff";
        ctx.fillRect(x + cw - 62 - lw - 3, y - 9, 2, 18);
      }
    }

    const reveal = sub(0.52, 0.95, p);
    if (reveal > 0) {
      heroHole(ctx, x + 34, y + 52, 7, "#8ff0ff", "rgba(143,240,255,0.45)");
      text(ctx, "AI 正在拆这份计划", x + 50, y + 52, `600 12px ${SANS}`, "#98a0bf");
      for (let i = 0; i < 4; i += 1) {
        const on = reveal * 4 > i;
        const ly = y + 86 + i * 26;
        ctx.fillStyle = on ? "rgba(192,132,252,0.85)" : "rgba(192,132,252,0.16)";
        ctx.fillRect(x + 30, ly, (cw - 70) * (on ? 1 : 0.2), 8);
      }
    }
    text(ctx, "AGENT · 2026", 32, 46, `600 12px ${MONO}`, "rgba(192,132,252,0.6)");
  }

  /* 收束：六格胶片带，最左是孔，最右是光标 */
  function sceneStrip(ctx, w, h, p) {
    const frames = [
      { year: "1804", tint: "#e0a458" },
      { year: "1945", tint: "#6cff9e" },
      { year: "1972", tint: "#f0c674" },
      { year: "1991", tint: "#00e5ff" },
      { year: "2007", tint: "#6fc3ff" },
      { year: "2026", tint: "#c084fc" },
    ];
    const gap = 14;
    const fw = Math.min((w - gap * 7) / 6, 150);
    const fh = fw * 1.15;
    const total = fw * 6 + gap * 5;
    let x = w / 2 - total / 2;
    const y = h / 2 - fh / 2 - 20;

    frames.forEach((frame, index) => {
      const appear = ease(sub(0.05 + index * 0.09, 0.3 + index * 0.09, p));
      if (appear <= 0) return;
      ctx.globalAlpha = appear;
      roundRect(ctx, x, y, fw, fh, 8, "rgba(255,255,255,0.04)", "rgba(255,255,255,0.14)");
      text(ctx, frame.year, x + fw / 2, y + fh - 20, `700 13px ${MONO}`, frame.tint, "center");
      if (index === 0) heroHole(ctx, x + fw / 2, y + fh * 0.42, 9, frame.tint, "rgba(224,164,88,0.4)");
      else if (index === 5) {
        ctx.fillStyle = frame.tint;
        ctx.fillRect(x + fw / 2 - 2, y + fh * 0.28, 4, fh * 0.3);
      } else {
        ctx.fillStyle = frame.tint;
        ctx.globalAlpha = appear * 0.5;
        for (let row = 0; row < 3; row += 1) ctx.fillRect(x + 16, y + 20 + row * 12, (fw - 32) * (0.4 + row * 0.2), 4);
      }
      ctx.globalAlpha = 1;
      x += fw + gap;
    });

    const lineP = ease(sub(0.45, 0.85, p));
    if (lineP > 0) {
      const startX = w / 2 - total / 2 + fw / 2;
      const endX = w / 2 + total / 2 - fw / 2;
      ctx.strokeStyle = "rgba(143,240,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, y + fh * 0.42);
      ctx.lineTo(startX + (endX - startX) * lineP, y + fh * 0.42);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const titleA = ease(sub(0.6, 0.95, p));
    if (titleA > 0) {
      ctx.globalAlpha = titleA;
      const size = Math.min(w * 0.05, 40);
      text(ctx, "工具在变，Build 不变。", w / 2, y + fh + 62, `800 ${size}px ${SANS}`, "#eef2f8", "center");
      ctx.globalAlpha = 1;
    }
  }

  function drawFrame(ctx, w, h, t, prompt) {
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#05070b");
    bg.addColorStop(1, "#0b0a14");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    let index = 0;
    while (index < BEATS.length - 1 && t > BEATS[index].to) index += 1;
    const from = index === 0 ? 0 : BEATS[index - 1].to;
    const local = clamp01((t - from) / (BEATS[index].to - from));

    const scenes = [sceneTape, sceneRelay, sceneTeletype, sceneWeb, sceneCloud, sceneChat, sceneStrip];
    scenes[index](ctx, w, h, local, prompt);

    /* 段与段之间用“沉入黑场”交接，避免两个场景叠成脏影 */
    const dip = ease(sub(0.88, 1, local));
    if (dip > 0 && index < BEATS.length - 1) {
      ctx.fillStyle = `rgba(5,7,11,${dip})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function play(prompt) {
    return new Promise((resolve) => {
      const screen = document.getElementById("screen-finale");
      const canvas = document.getElementById("finale-canvas");
      const caption = document.getElementById("finale-caption");
      const skipBtn = document.getElementById("finale-skip");
      if (!screen || !canvas || !caption) {
        resolve();
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve();
        return;
      }

      let width = 0;
      let height = 0;
      const size = () => {
        width = window.innerWidth;
        height = Math.max(window.innerHeight, 420);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      CTM.ui.setTheme("finale");
      CTM.ui.showScreen("finale");
      size();

      const reduced = CTM.utils.prefersReduced();
      let raf = null;
      let done = false;
      let lastBeat = -1;
      let startedAt = performance.now();

      const finish = () => {
        if (done) return;
        done = true;
        if (raf) cancelAnimationFrame(raf);
        if (safety) window.clearTimeout(safety);
        skipBtn.removeEventListener("click", finish);
        document.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", onResize);
        resolve();
      };

      /* 面板被切走时 rAF 会停摆，用墙钟时间兜底，不让玩家卡在动画里 */
      const safety = window.setTimeout(finish, DURATION + 3000);

      const onKey = (event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") finish();
      };

      const onResize = () => {
        size();
        if (reduced) drawFrame(ctx, width, height, 1, prompt);
      };

      skipBtn.addEventListener("click", finish);
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);

      if (reduced) {
        caption.textContent = BEATS[BEATS.length - 1].caption;
        drawFrame(ctx, width, height, 1, prompt);
        window.setTimeout(finish, 1800);
        return;
      }

      const frame = (now) => {
        if (done) return;
        const t = clamp01((now - startedAt) / DURATION);
        drawFrame(ctx, width, height, t, prompt);

        let index = 0;
        while (index < BEATS.length - 1 && t > BEATS[index].to) index += 1;
        if (index !== lastBeat) {
          lastBeat = index;
          caption.textContent = BEATS[index].caption;
          caption.classList.remove("is-in");
          void caption.offsetWidth;
          caption.classList.add("is-in");
          const sound = BEATS[index].sound;
          if (sound && CTM.audio[sound]) CTM.audio[sound]();
        }

        if (t < 1) raf = requestAnimationFrame(frame);
        else finish();
      };
      raf = requestAnimationFrame(frame);
    });
  }

  CTM.finale = { play, DURATION };
})(window.CTM = window.CTM || {});
