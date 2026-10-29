(function (CTM) {
  "use strict";

  const MONO = '"SFMono-Regular", Consolas, "Courier New", monospace';
  const SANS = '"PingFang SC", "Microsoft YaHei", sans-serif';

  const DATA = {
    punch: {
      kicker: "JACQUARD LOOM · 里昂",
      title: "一张纸带，换一种花样",
      excerpt:
        "1804 年，Joseph-Marie Jacquard 在里昂展示用打孔卡控制的提花机。每张卡片上的一排孔决定哪些经线被抬起，梭子带着一根纬线穿过，纸带往前走一格；整条纸带就是一串可替换的指令。换一条纸带，同一台织机就能织出不同的花样。",
      sources: [
        { label: "Wikipedia · Jacquard loom", url: "https://en.wikipedia.org/wiki/Jacquard_loom" },
        { label: "Wikipedia · Herman Hollerith", url: "https://en.wikipedia.org/wiki/Herman_Hollerith" },
      ],
    },
    register: {
      kicker: "ENIAC · 宾夕法尼亚",
      title: "把程序接进电路",
      excerpt:
        "1945 年，ENIAC 在宾夕法尼亚大学建成，约 18,000 只真空管、30 吨重。早期编程不是敲键盘，而是插拔电缆、设置开关：每换一个问题，都要重新接线。它证明了电子计算可以足够快，也让「通用计算机」从概念变成一台真正能运行的机器。",
      sources: [
        { label: "Wikipedia · ENIAC", url: "https://en.wikipedia.org/wiki/ENIAC" },
        { label: "Wikipedia · Grace Hopper", url: "https://en.wikipedia.org/wiki/Grace_Hopper" },
      ],
    },
    unix: {
      kicker: "UNIX V1 · 贝尔实验室",
      title: "只做一件事，并把它做好",
      excerpt:
        "1972 年，Dennis Ritchie 与 Ken Thompson 在贝尔实验室让 Unix 跑起来。Unix 把复杂的任务拆成一组只做一件事的小工具，再用管道串起来；「do one thing and do it well」后来成了 Unix 世界的共同语法。",
      sources: [
        { label: "Wikipedia · Unix", url: "https://en.wikipedia.org/wiki/Unix" },
        { label: "The Art of Unix Programming", url: "http://www.catb.org/esr/writings/taoup/html/" },
      ],
    },
    web: {
      kicker: "WWW · CERN",
      title: "第一页，欢迎常来",
      excerpt:
        "1989 年，Tim Berners-Lee 在 CERN 写下 World Wide Web 的提案；1991 年 8 月，第一个网站在 CERN 上线。它把文档、链接和服务器拼成一张可以跳转的网：任何人都能发布一页，也能从另一页点过来。个人主页和访客计数器，是 Web 少年时代的标志。",
      sources: [
        { label: "CERN · The birth of the Web", url: "https://home.cern/science/computing/birth-web" },
        { label: "The first website", url: "http://info.cern.ch/hypertext/WWW/TheProject.html" },
      ],
    },
    cloud: {
      kicker: "CLOUD · 旧金山",
      title: "装进口袋的 Web",
      excerpt:
        "2007 年 6 月，第一代 iPhone 在旧金山发布，Web 从桌面走进每个人的口袋；同一时期，AWS 的弹性计算让「先上线、再扩容」成为可能。移动端成为新的默认，云把机房变成按需取用的资源。缓存、队列、限流、自动扩缩容，成了 Builder 的必修课。",
      sources: [
        {
          label: "Wikipedia · iPhone (1st generation)",
          url: "https://en.wikipedia.org/wiki/IPhone_(1st_generation)",
        },
        { label: "Wikipedia · Cloud computing", url: "https://en.wikipedia.org/wiki/Cloud_computing" },
      ],
    },
    ai: {
      kicker: "AGENT · 你的桌前",
      title: "说清楚，再验收",
      excerpt:
        "2021 年，GitHub Copilot 进入技术预览，AI 开始参与代码补全；2022 年，ChatGPT 让自然语言成为新的编程接口。2026 年，AI 原生编程成为日常：你说清楚要什么，机器给出计划与结果。但判断什么值得做、验收什么算完成，仍然属于 Builder。",
      sources: [
        { label: "Wikipedia · GitHub Copilot", url: "https://en.wikipedia.org/wiki/GitHub_Copilot" },
        { label: "Wikipedia · ChatGPT", url: "https://en.wikipedia.org/wiki/ChatGPT" },
      ],
    },
  };

  let root = null;
  let cleanup = null;

  const pad2 = (value) => String(value).padStart(2, "0");
  const esc = (value) => CTM.utils.escapeHtml(String(value == null ? "" : value));

  function ensureRoot() {
    if (root) return root;
    root = document.createElement("div");
    root.id = "archive-root";
    root.className = "archive-root";
    root.hidden = true;
    document.body.appendChild(root);
    return root;
  }

  function sourcesHtml(sources) {
    return (sources || [])
      .map(
        (source) =>
          `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`
      )
      .join('<span class="archive-link-sep" aria-hidden="true">/</span>');
  }

  function close() {
    if (typeof cleanup === "function") cleanup();
  }

  function show(era, index, options) {
    if (!era || !DATA[era.id]) return function noop() {};
    const opts = options || {};
    close();
    ensureRoot();

    const total = CTM.eras.length || 6;
    const isLast = index >= total - 1;
    const next = isLast ? null : CTM.eras[index + 1];
    const acceptText = isLast ? "收下，查看档案" : `收下，前往 ${next.year}`;
    const autoClose = Number(opts.autoClose) || 0;
    const data = DATA[era.id];
    const actionsHtml = autoClose
      ? '<p class="archive-auto">Agent 接管中 · 这段史料会自动收进档案</p>'
      : `<div class="archive-actions">
            <button class="archive-accept" type="button" data-archive-accept>${esc(acceptText)} <span aria-hidden="true">→</span></button>
            <button class="archive-later" type="button" data-archive-close>先继续</button>
          </div>`;

    root.innerHTML = `
      <div class="archive-backdrop" data-archive-close></div>
      <article class="archive-card" data-era="${esc(era.theme)}" role="dialog" aria-modal="true" aria-labelledby="archive-title">
        <button class="archive-close" type="button" data-archive-close aria-label="关闭史料">×</button>
        <div class="archive-visual">
          <canvas class="archive-canvas" aria-hidden="true"></canvas>
          <div class="archive-seal" aria-hidden="true">
            <span class="as-icon">${CTM.icons[era.icon] || ""}</span>
            <span class="as-year">${era.year}</span>
            <span class="as-tag">ARCHIVED</span>
          </div>
        </div>
        <div class="archive-body">
          <div class="archive-plate">
            <span class="archive-kicker">TIME ARCHIVE · ${pad2(index + 1)} / ${pad2(total)}</span>
            <span class="archive-place">${esc(era.place || "")}</span>
          </div>
          <div class="archive-eyebrow">${esc(data.kicker)}</div>
          <h2 class="archive-title" id="archive-title">${esc(data.title)}</h2>
          <p class="archive-excerpt">${esc(data.excerpt)}</p>
          <div class="archive-source">
            <span class="archive-source-label">SOURCE</span>
            <span class="archive-links">${sourcesHtml(data.sources)}</span>
          </div>
          ${actionsHtml}
        </div>
      </article>`;
    root.hidden = false;
    document.body.classList.add("has-archive");

    let closed = false;
    let timer = null;
    const onKey = (event) => {
      if (event.key === "Escape") dismiss(false);
    };

    const dismiss = (accepted) => {
      if (closed) return;
      closed = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      root.hidden = true;
      root.innerHTML = "";
      document.body.classList.remove("has-archive");
      cleanup = null;
      if (accepted) {
        if (typeof opts.onAccept === "function") opts.onAccept();
      } else if (typeof opts.onClose === "function") {
        opts.onClose();
      }
    };

    cleanup = () => {
      if (closed) return;
      closed = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      root.hidden = true;
      root.innerHTML = "";
      document.body.classList.remove("has-archive");
      cleanup = null;
    };

    root.querySelectorAll("[data-archive-close]").forEach((button) => {
      button.addEventListener("click", () => dismiss(false));
    });
    const accept = root.querySelector("[data-archive-accept]");
    if (accept) accept.addEventListener("click", () => dismiss(true));
    document.addEventListener("keydown", onKey);

    if (autoClose > 0) {
      timer = window.setTimeout(() => dismiss(false), autoClose);
    }

    const canvas = root.querySelector(".archive-canvas");
    if (canvas) {
      window.requestAnimationFrame(() => drawMotif(canvas, era.id));
    }
    if (accept) {
      window.setTimeout(() => accept.focus({ preventScroll: true }), 80);
    }

    return dismiss;
  }

  /* ---------- 插图 ---------- */

  function circle(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }

  function ring(ctx, x, y, r, stroke, width) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width || 1;
    ctx.stroke();
  }

  function rrect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function label(ctx, value, x, y, size, color, align, spacing, font) {
    ctx.font = `${font || 600} ${size}px ${font === 700 ? SANS : MONO}`;
    ctx.fillStyle = color;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    if (spacing) ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(value, x, y);
    if (spacing) ctx.letterSpacing = "0px";
    ctx.textAlign = "left";
  }

  function bg(ctx, w, h, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function glow(ctx, x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  function scanlines(ctx, w, h, alpha, step) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";
    for (let y = 0; y < h; y += step || 3) ctx.fillRect(0, y, w, 1);
    ctx.restore();
  }

  const MOTIFS = {
    punch(ctx, w, h) {
      bg(ctx, w, h, "#1a120b", "#3a2716");
      const top = h * 0.3;
      const tapeH = h * 0.4;
      const paper = ctx.createLinearGradient(0, top, 0, top + tapeH);
      paper.addColorStop(0, "#8d7856");
      paper.addColorStop(0.45, "#c7b28b");
      paper.addColorStop(1, "#e2d0a9");
      ctx.fillStyle = paper;
      ctx.fillRect(0, top, w, tapeH);

      ctx.save();
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 26; i += 1) {
        const y = top + ((i * 37) % tapeH);
        ctx.strokeStyle = i % 3 === 0 ? "rgba(90,60,30,0.7)" : "rgba(255,255,255,0.5)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo((i * 83) % w, y);
        ctx.lineTo(((i * 83) % w) + 30 + (i % 5) * 14, y + Math.sin(i) * 1.2);
        ctx.stroke();
      }
      ctx.restore();

      const cols = 18;
      const step = w / cols;
      for (let c = 0; c < cols; c += 1) {
        const x = step * (c + 0.5);
        const bit = (c * 5 + 3) % 3 === 0 ? 1 : 0;
        const y = top + tapeH * (bit ? 0.34 : 0.68);
        glow(ctx, x, y, step * 0.7, "#ffe9bd", 0.24);
        circle(ctx, x, y, Math.max(2.4, h * 0.02), "#2a1b0e");
        circle(ctx, x, y, Math.max(1.6, h * 0.013), "#ffe9bd");
      }

      glow(ctx, w / 2, h * 0.5, h * 0.42, "#ffe9bd", 0.45);
      circle(ctx, w / 2, h * 0.5, Math.max(4.5, h * 0.03), "#fff3d2");
      ring(ctx, w / 2, h * 0.5, Math.max(6, h * 0.038), "#2a1b0e", 2);
      ring(ctx, w / 2, h * 0.5, Math.max(10, h * 0.06), "rgba(255,226,170,0.35)", 1);

      ctx.fillStyle = "#3b2410";
      ctx.fillRect(0, top - 8, w, 6);
      ctx.fillRect(0, top + tapeH + 2, w, 6);
      ctx.fillStyle = "#4a2f14";
      rrect(ctx, w / 2 - 4, 0, 8, top - 12, 3);
      ctx.fill();
      rrect(ctx, w / 2 - 9, top - 14, 18, 8, 2);
      ctx.fill();
    },

    register(ctx, w, h) {
      bg(ctx, w, h, "#03110a", "#0a2a18");
      ctx.save();
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 6; i += 1) {
        const pw = w / 5.5;
        const x = -w * 0.08 + i * pw;
        const g = ctx.createLinearGradient(x, 0, x + pw, 0);
        g.addColorStop(0, "rgba(10,40,24,0.9)");
        g.addColorStop(1, "rgba(3,18,11,0.9)");
        ctx.fillStyle = g;
        ctx.fillRect(x, h * 0.06, pw - 8, h * 0.88);
        ctx.strokeStyle = "rgba(108,255,158,0.14)";
        ctx.strokeRect(x, h * 0.06, pw - 8, h * 0.88);
      }
      ctx.restore();

      const fw = w * 0.58;
      const fh = h * 0.38;
      const fx = (w - fw) / 2;
      const fy = h * 0.36;
      const frame = ctx.createLinearGradient(0, fy, 0, fy + fh);
      frame.addColorStop(0, "rgba(28,52,34,0.98)");
      frame.addColorStop(1, "rgba(8,22,13,0.98)");
      ctx.fillStyle = frame;
      rrect(ctx, fx, fy, fw, fh, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(108,255,158,0.32)";
      ctx.lineWidth = 1;
      rrect(ctx, fx, fy, fw, fh, 6);
      ctx.stroke();
      label(ctx, "RELAY 02 / NORMALLY OPEN", fx + 10, fy + 10, 6, "rgba(108,255,158,0.55)", "left", 1.2);

      for (let i = 0; i < 9; i += 1) {
        const x = fx + fw * 0.18 + i * (fw * 0.078);
        const lit = i < 3;
        const glass = ctx.createLinearGradient(0, fy - 32, 0, fy - 6);
        glass.addColorStop(0, lit ? "rgba(255,228,174,0.95)" : "rgba(58,42,24,0.6)");
        glass.addColorStop(0.55, lit ? "rgba(255,177,90,0.9)" : "rgba(36,23,8,0.6)");
        glass.addColorStop(1, lit ? "rgba(138,58,12,0.85)" : "rgba(20,12,4,0.6)");
        ctx.fillStyle = glass;
        rrect(ctx, x - 5, fy - 34, 10, 26, 5);
        ctx.fill();
        if (lit) glow(ctx, x, fy - 24, 22, "#ffb45a", 0.38);
      }

      const gap = fw * 0.035;
      const armY = fy + fh * 0.55;
      const arm = ctx.createLinearGradient(0, armY, 0, armY + 10);
      arm.addColorStop(0, "#f0c48a");
      arm.addColorStop(0.5, "#a9713c");
      arm.addColorStop(1, "#4c2c15");
      ctx.fillStyle = arm;
      rrect(ctx, fx + fw * 0.16, armY, fw * 0.28 - gap, 9, 2);
      ctx.fill();
      rrect(ctx, fx + fw * 0.56 + gap, armY, fw * 0.28 - gap, 9, 2);
      ctx.fill();
      glow(ctx, w / 2, h * 0.56, h * 0.22, "#ffe0a8", 0.4);
      circle(ctx, w / 2, h * 0.56, Math.max(4, h * 0.026), "#fff2cf");
      ring(ctx, w / 2, h * 0.56, Math.max(6, h * 0.036), "#ffe0a8", 1);
      ctx.strokeStyle = "rgba(255,246,220,0.85)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(w / 2 - gap, h * 0.56 + (i - 2) * 2);
        ctx.lineTo(w / 2 + gap, h * 0.56 + (i - 1.4) * 2);
        ctx.stroke();
      }

      const sx = fx + fw - 92;
      const sy = fy + fh - 18;
      ctx.strokeStyle = "rgba(108,255,158,0.28)";
      ctx.strokeRect(sx, sy - 18, 76, 24);
      ctx.strokeStyle = "rgba(140,255,184,0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 32; i += 1) {
        const t = i / 32;
        const y = sy - 6 + Math.sin(t * 10) * 4;
        if (i === 0) ctx.moveTo(sx + 3 + t * 70, y);
        else ctx.lineTo(sx + 3 + t * 70, y);
      }
      ctx.stroke();
    },

    unix(ctx, w, h) {
      bg(ctx, w, h, "#080806", "#15140d");
      scanlines(ctx, w, h, 0.14, 3);
      const size = Math.max(11, Math.min(18, w * 0.026));
      glow(ctx, w * 0.36, h * 0.4, w * 0.3, "rgba(240,198,116,0.18)", 0.5);
      ctx.font = `700 ${size}px ${MONO}`;
      ctx.fillStyle = "#f0c674";
      ctx.textBaseline = "middle";
      ctx.fillText("$ grep ERROR", w * 0.08, h * 0.34);

      ctx.fillStyle = "rgba(216,178,92,0.55)";
      for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(w * 0.08, h * (0.52 + i * 0.1), w * (0.38 - i * 0.06), 1.6);
      }
      label(ctx, "ERROR", w * 0.08, h * 0.52, Math.max(7, size * 0.62), "#6cff9e", "left", 0.6);
      ctx.fillStyle = "#f0c674";
      ctx.fillRect(w * 0.08, h * 0.34 - size * 0.7, Math.max(2, w * 0.004), size * 1.4);

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([3, 7]);
      ctx.strokeStyle = "rgba(240,198,116,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.8);
      ctx.lineTo(w * 0.92, h * 0.8);
      ctx.stroke();
      ctx.restore();
    },

    web(ctx, w, h) {
      bg(ctx, w, h, "#070b2a", "#111a4f");
      const bw = w * 0.72;
      const bh = h * 0.68;
      const bx = (w - bw) / 2;
      const by = h * 0.16;
      ctx.save();
      ctx.shadowColor = "rgba(0,229,255,0.35)";
      ctx.shadowBlur = 26;
      ctx.fillStyle = "#f2f2f2";
      rrect(ctx, bx, by, bw, bh, 4);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#0a2a8a";
      ctx.fillRect(bx, by, bw, Math.max(14, bh * 0.16));
      label(ctx, "Netscape Navigator", bx + 8, by + Math.max(7, bh * 0.08), Math.max(6, w * 0.009), "#fff", "left", 0.4);
      const page = ctx.createLinearGradient(0, by, 0, by + bh);
      page.addColorStop(0, "#05060f");
      page.addColorStop(1, "#0d1030");
      ctx.fillStyle = page;
      ctx.fillRect(bx, by + Math.max(14, bh * 0.16), bw, bh);
      ctx.save();
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 24; i += 1) {
        ctx.fillStyle = i % 6 === 0 ? "#ffe066" : "#fff";
        ctx.fillRect(bx + ((i * 37) % bw), by + Math.max(16, bh * 0.18) + ((i * 23) % (bh * 0.6)), 1.4, 1.4);
      }
      ctx.restore();
      const titleSize = Math.max(9, Math.min(22, bw * 0.055));
      ctx.font = `700 ${titleSize}px ${SANS}`;
      ctx.fillStyle = "#ffe066";
      ctx.textBaseline = "middle";
      ctx.fillText("我的第一个主页", bx + bw * 0.08, by + bh * 0.38);
      ctx.strokeStyle = "rgba(255,80,80,0.65)";
      ctx.strokeRect(bx + bw * 0.08, by + bh * 0.56, bw * 0.84, bh * 0.13);
      label(ctx, "Welcome to my homepage!", bx + bw * 0.12, by + bh * 0.625, Math.max(6, w * 0.009), "#ff8a8a", "left", 0.2);
      ctx.fillStyle = "#000";
      ctx.strokeStyle = "#19ff5a";
      ctx.fillRect(bx + bw * 0.08, by + bh * 0.78, bw * 0.3, bh * 0.13);
      ctx.strokeRect(bx + bw * 0.08, by + bh * 0.78, bw * 0.3, bh * 0.13);
      label(ctx, "0001024", bx + bw * 0.2, by + bh * 0.845, Math.max(6, w * 0.01), "#19ff5a", "left", 0.8);
      ctx.strokeStyle = "rgba(0,229,255,0.5)";
      ctx.lineWidth = 1;
      rrect(ctx, bx, by, bw, bh, 4);
      ctx.stroke();
    },

    cloud(ctx, w, h) {
      bg(ctx, w, h, "#06121f", "#0a1e32");
      const px = w * 0.16;
      const pw = Math.max(26, w * 0.07);
      const ph = h * 0.5;
      const body = ctx.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
      body.addColorStop(0, "#2a2a2a");
      body.addColorStop(0.5, "#101010");
      body.addColorStop(1, "#050505");
      ctx.fillStyle = body;
      rrect(ctx, px - pw / 2, h / 2 - ph / 2, pw, ph, 8);
      ctx.fill();
      const screen = ctx.createLinearGradient(0, h / 2 - ph / 2, 0, h / 2 + ph / 2);
      screen.addColorStop(0, "#12314a");
      screen.addColorStop(1, "#050b12");
      ctx.fillStyle = screen;
      rrect(ctx, px - pw / 2 + 3, h / 2 - ph / 2 + 7, pw - 6, ph - 14, 5);
      ctx.fill();
      label(ctx, "1024", px, h / 2, Math.max(7, w * 0.011), "#bfe9ff", "center", 0.6);

      const rackX = w * 0.56;
      for (let i = 0; i < 3; i += 1) {
        const x = rackX + i * w * 0.1;
        ctx.fillStyle = "#0d2740";
        ctx.strokeStyle = "rgba(111,195,255,0.5)";
        rrect(ctx, x, h / 2 - ph * 0.38, w * 0.065, ph * 0.76, 3);
        ctx.fill();
        ctx.stroke();
        for (let k = 0; k < 5; k += 1) {
          ctx.fillStyle = k % 2 ? "#6fc3ff" : "#6cff9e";
          ctx.fillRect(x + 4, h / 2 - ph * 0.3 + k * 8, 2, 2);
        }
        glow(ctx, x + w * 0.032, h / 2, 20, "rgba(111,195,255,0.35)", 0.35);
      }

      ctx.strokeStyle = "rgba(143,240,255,0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(px + pw / 2, h / 2);
      ctx.lineTo(rackX, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      glow(ctx, w / 2, h / 2, 22, "#8ff0ff", 0.32);
      circle(ctx, w / 2, h / 2, Math.max(3, h * 0.025), "#e8fbff");

      const cx = rackX;
      const cy = h * 0.84;
      ctx.strokeStyle = "rgba(111,195,255,0.28)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + w * 0.26, cy);
      ctx.stroke();
      ctx.strokeStyle = "rgba(143,240,255,0.9)";
      ctx.beginPath();
      for (let i = 0; i <= 24; i += 1) {
        const t = i / 24;
        const y = cy - Math.min(1, t * 1.2) * h * 0.12 + Math.sin(t * 8) * 1.5;
        if (i === 0) ctx.moveTo(cx + t * w * 0.26, y);
        else ctx.lineTo(cx + t * w * 0.26, y);
      }
      ctx.stroke();
    },

    ai(ctx, w, h) {
      bg(ctx, w, h, "#05060a", "#0b0a18");
      const cw = w * 0.72;
      const ch = h * 0.58;
      const cx = (w - cw) / 2;
      const cy = h * 0.2;
      ctx.save();
      ctx.shadowColor = "rgba(192,132,252,0.28)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "rgba(9,9,16,0.96)";
      rrect(ctx, cx, cy, cw, ch, 10);
      ctx.fill();
      ctx.restore();
      const tint = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
      tint.addColorStop(0, "rgba(143,240,255,0.09)");
      tint.addColorStop(1, "rgba(192,132,252,0.1)");
      ctx.fillStyle = tint;
      rrect(ctx, cx, cy, cw, ch, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(192,132,252,0.45)";
      ctx.lineWidth = 1;
      rrect(ctx, cx, cy, cw, ch, 10);
      ctx.stroke();

      label(ctx, "AGENT · LOCAL", cx + 14, cy + 14, Math.max(6, w * 0.009), "rgba(192,132,252,0.9)", "left", 1.4);
      const promptSize = Math.max(8, Math.min(16, cw * 0.034));
      ctx.font = `600 ${promptSize}px ${SANS}`;
      ctx.fillStyle = "#f2f5ff";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("做一个每天提醒我妈量血压的小工具", cx + cw - 14, cy + ch * 0.28);
      ctx.textAlign = "left";

      for (let i = 0; i < 3; i += 1) {
        const y = cy + ch * 0.54 + i * ch * 0.13;
        label(ctx, `0${i + 1}`, cx + 14, y, Math.max(6, w * 0.009), "rgba(143,240,255,0.6)", "left", 1);
        ctx.fillStyle = i === 0 ? "rgba(200,170,255,0.8)" : "rgba(200,170,255,0.32)";
        ctx.fillRect(cx + 34, y - 1, cw * (0.52 - i * 0.06), 2);
      }

      glow(ctx, w / 2, h / 2, h * 0.3, "#8ff0ff", 0.28);
      circle(ctx, w / 2, h / 2, Math.max(4, h * 0.03), "#05060a");
      ring(ctx, w / 2, h / 2, Math.max(5, h * 0.038), "rgba(143,240,255,0.8)", 1.4);
      ring(ctx, w / 2, h / 2, Math.max(9, h * 0.06), "rgba(143,240,255,0.3)", 1);
    },
  };

  function drawMotif(canvas, id) {
    if (!canvas || !canvas.isConnected) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width || 640));
    const h = Math.max(120, Math.round(rect.height || 190));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    (MOTIFS[id] || MOTIFS.punch)(ctx, w, h);
  }

  CTM.archive = {
    show,
    close,
    isOpen() {
      return Boolean(root && !root.hidden);
    },
    data: DATA,
  };
})(window.CTM = window.CTM || {});
