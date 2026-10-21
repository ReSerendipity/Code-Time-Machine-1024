(function (CTM) {
  "use strict";

  const DURATION = 24000;
  const BLACK_AT = 0.868;
  const REVEAL_AT = 0.9;

  const BEATS = [
    {
      key: "punch",
      to: 0.115,
      year: 1804,
      tag: "JACQUARD LOOM · 里昂",
      readout: "5 BIT · 26 LETTERS",
      caption: "1804 · 里昂 —— 一个孔，决定一块布的花样",
      sound: "paperRustle",
      pal: { ink: "#f2d0a4", hot: "#ffcf8a", deep: "#160f09", line: "rgba(224,164,88,0.5)" },
      camera: { zoom: [1.06, 1.16], rot: [0, 0], pan: [0, 10] },
    },
    {
      key: "relay",
      to: 0.285,
      year: 1945,
      tag: "ENIAC · 宾夕法尼亚",
      readout: "18,000 TUBES · 30 TONS",
      caption: "1945 · 宾夕法尼亚 —— 同一个孔，成了一次通断",
      sound: "copperHum",
      pal: { ink: "#b7ffd0", hot: "#8dffb4", deep: "#03110a", line: "rgba(108,255,158,0.45)" },
      camera: { zoom: [1.14, 0.92], rot: [0, -1.2], pan: [10, -14] },
    },
    {
      key: "unix",
      to: 0.44,
      year: 1972,
      tag: "UNIX V1 · 贝尔实验室",
      readout: "PIPE | · ONE THING WELL",
      caption: "1972 · 贝尔实验室 —— 孔翻成字符，字符排成工具",
      sound: "phosphor",
      pal: { ink: "#f0c674", hot: "#fff0c2", deep: "#0b0b08", line: "rgba(240,198,116,0.45)" },
      camera: { zoom: [0.92, 1.04], rot: [-1.2, 0], pan: [-14, 6] },
    },
    {
      key: "web",
      to: 0.6,
      year: 1991,
      tag: "WWW · CERN",
      readout: "HTML 1.0 · 1 PAGE",
      caption: "1991 · CERN —— 字符有了颜色，谁都能发一份主页",
      sound: "datastream",
      pal: { ink: "#00e5ff", hot: "#9ff6ff", deep: "#0a0c2a", line: "rgba(0,229,255,0.42)" },
      camera: { zoom: [1.02, 0.9], rot: [0, -2.2], pan: [6, -10] },
    },
    {
      key: "cloud",
      to: 0.745,
      year: 2007,
      tag: "CLOUD · 旧金山",
      readout: "1024 REQ/S · 3 NODES",
      caption: "2007 · 旧金山 —— 主页装进口袋，请求飞向机房",
      sound: "fanArray",
      pal: { ink: "#6fc3ff", hot: "#a8e4ff", deep: "#06121f", line: "rgba(111,195,255,0.42)" },
      camera: { zoom: [0.9, 0.78], rot: [-2.2, -0.6], pan: [-10, 14] },
    },
    {
      key: "agent",
      to: BLACK_AT,
      year: 2026,
      tag: "AGENT · 你的桌前",
      readout: "LOCAL · NO API KEY",
      caption: "2026 · 你的桌前 —— 你说一句话，机器开始动手",
      sound: "aiShimmer",
      pal: { ink: "#e6d5ff", hot: "#c084fc", deep: "#05060a", line: "rgba(192,132,252,0.45)" },
      camera: { zoom: [0.78, 1.1], rot: [-0.6, 0], pan: [14, 0] },
    },
    {
      key: "reveal",
      to: 1.001,
      year: 2026,
      tag: "1804 → 2026",
      readout: "222 YEARS · 6 ERAS · 1024",
      caption: "你刚刚走完的 222 年。",
      sound: "impact",
      pal: { ink: "#eef2f8", hot: "#8ff0ff", deep: "#05070b", line: "rgba(143,240,255,0.4)" },
      camera: { zoom: [1.1, 0.56], rot: [0, 0], pan: [0, 0] },
    },
  ];

  const STATIONS = [
    { year: "1804", color: "#e0a458" },
    { year: "1945", color: "#6cff9e" },
    { year: "1972", color: "#f0c674" },
    { year: "1991", color: "#00e5ff" },
    { year: "2007", color: "#6fc3ff" },
    { year: "2026", color: "#c084fc" },
  ];

  const MONO = '"SFMono-Regular", Consolas, "Courier New", monospace';
  const SANS = '"PingFang SC", "Microsoft YaHei", sans-serif';

  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (value) => (value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2);
  const easeOut = (value) => 1 - Math.pow(1 - value, 3);
  const sub = (start, end, value) => clamp01((value - start) / (end - start));

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

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function label(ctx, value, x, y, size, color, align, spacing) {
    ctx.font = `600 ${size}px ${MONO}`;
    ctx.fillStyle = color;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    if (spacing) ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(value, x, y);
    if (spacing) ctx.letterSpacing = "0px";
    ctx.textAlign = "left";
  }

  /* ---------- 材质 ---------- */

  function makeNoise(size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const image = ctx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.random() * 255;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  }

  let grainPattern = null;
  let grainTile = null;

  function grain(ctx, w, h, tile, alpha) {
    if (grainTile !== tile) {
      grainPattern = ctx.createPattern(tile, "repeat");
      grainTile = tile;
    }
    const pattern = grainPattern;
    if (!pattern) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function vignette(ctx, w, h, strength) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.24, w / 2, h / 2, Math.max(w, h) * 0.78);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function rgbOf(color) {
    if (color[0] === "#") {
      const hex = color.length === 4 ? color.slice(1).split("").map((c) => c + c).join("") : color.slice(1);
      const value = parseInt(hex, 16);
      return `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}`;
    }
    const match = String(color).match(/rgba?\(([^)]+)\)/);
    if (match) return match[1].split(",").slice(0, 3).join(",");
    return "255,255,255";
  }

  function glowAt(ctx, x, y, radius, color, alpha) {
    const rgb = rgbOf(color);
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(0.45, `rgba(${rgb},${alpha * 0.35})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function scanlines(ctx, w, h, alpha, step) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";
    for (let y = 0; y < h; y += step || 3) ctx.fillRect(0, y, w, 1);
    ctx.restore();
  }

  function dust(ctx, w, h, p, color) {
    const count = 46;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < count; i += 1) {
      const seed = i * 127.31;
      const x = ((Math.sin(seed) * 0.5 + 0.5) * w + p * 26 * (1 + (i % 5) * 0.3)) % w;
      const y = ((Math.cos(seed * 1.7) * 0.5 + 0.5) * h - p * 12 * (1 + (i % 3) * 0.4) + h) % h;
      const size = 0.6 + (i % 4) * 0.5;
      ctx.globalAlpha = 0.1 + ((i * 37) % 20) / 130;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  /* 纸背光的光束：几条半透明的多边形，够用且很便宜 */
  function shafts(ctx, w, h, x, p, color) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i += 1) {
      const spread = 0.16 + i * 0.05;
      const wobble = Math.sin(p * 4 + i) * 0.01;
      ctx.globalAlpha = 0.05 + i * 0.012;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(w * (0.5 + spread + wobble), h);
      ctx.lineTo(w * (0.5 + spread + 0.09 + wobble), h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 六段画面 ---------- */

  function sceneTape(ctx, w, h, p, pal, hole) {
    const tapeH = Math.min(h * 0.4, 268);
    const top = h / 2 - tapeH / 2;
    const shift = -(p * w * 0.12) - w * 0.03;
    const step = Math.max(40, w * 0.04);

    // 纸：上暗下亮，再压一层“只有孔附近亮”的遮罩 —— 背光就是这么来的
    const paper = ctx.createLinearGradient(0, top, 0, top + tapeH);
    paper.addColorStop(0, "#b6a077");
    paper.addColorStop(0.4, "#d9c8a2");
    paper.addColorStop(1, "#eee1c5");
    ctx.fillStyle = paper;
    ctx.fillRect(-w, top, w * 3, tapeH);

    const lit = ctx.createRadialGradient(hole.x, hole.y, 10, hole.x, hole.y, Math.min(w, h) * 0.3);
    lit.addColorStop(0, "rgba(255,242,210,0.34)");
    lit.addColorStop(0.26, "rgba(255,232,185,0.16)");
    lit.addColorStop(1, "rgba(0,0,0,0.66)");
    ctx.fillStyle = lit;
    ctx.fillRect(-w, top, w * 3, tapeH);

    // 纸纤维
    ctx.save();
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 70; i += 1) {
      const y = top + ((i * 41.7) % tapeH);
      ctx.strokeStyle = i % 3 === 0 ? "rgba(120,90,50,0.6)" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      const x0 = -w + ((i * 97) % (w * 2)) + shift * 0.4;
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + 40 + (i % 7) * 26, y + Math.sin(i * 1.7) * 1.5);
      ctx.stroke();
    }
    ctx.restore();

    // 经线：横向平行，压在纸上
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#fff6e2";
    for (let x = -w; x < w * 2; x += 11) {
      ctx.beginPath();
      ctx.moveTo(x + shift * 0.55, top);
      ctx.lineTo(x + shift * 0.55, top + tapeH);
      ctx.stroke();
    }
    ctx.restore();

    // 孔位
    const bits = "0100101001010010";
    const holeCol = 7;
    for (let column = 0; column < 46; column += 1) {
      const x = shift + column * step;
      if (x < -step || x > w + step) continue;
      const bit = bits[column % bits.length] === "1" ? 1 : 0;
      for (let row = 0; row < 2; row += 1) {
        if (row !== bit || column === holeCol) continue;
        const cy = top + tapeH * (row === 0 ? 0.32 : 0.68);
        glowAt(ctx, x, cy, 22, "#ffe0a8", 0.16);
        circle(ctx, x, cy, 7.4, "rgba(26,18,10,0.97)");
        ctx.save();
        ctx.strokeStyle = "rgba(255,226,170,0.45)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(x, cy, 8, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 上下横梁
    const beam = ctx.createLinearGradient(0, top - 40, 0, top - 8);
    beam.addColorStop(0, "#6b4623");
    beam.addColorStop(0.6, "#40260f");
    beam.addColorStop(1, "#201206");
    ctx.fillStyle = beam;
    roundRect(ctx, -w, top - 44, w * 3, 36, 3);
    ctx.fill();
    ctx.fillStyle = "#2a1709";
    roundRect(ctx, -w, top + tapeH + 8, w * 3, 30, 3);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#a8763d";
    for (let y = top - 38; y < top - 10; y += 7) {
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.lineTo(w * 2, y + Math.sin(y) * 1.4);
      ctx.stroke();
    }
    ctx.restore();

    // 打孔臂：砸在孔位旁边
    const armX = hole.x - step * 0.35;
    const cycle = (p * 9) % 1;
    const drop = cycle < 0.22 ? Math.sin((cycle / 0.22) * Math.PI) : 0;
    ctx.fillStyle = "#1c1409";
    roundRect(ctx, armX - 9, top - 200 + drop * 92, 18, 168, 4);
    ctx.fill();
    ctx.fillStyle = "#7d5a2e";
    roundRect(ctx, armX - 26, top - 208 + drop * 92, 52, 14, 4);
    ctx.fill();
    const head = ctx.createLinearGradient(armX - 12, 0, armX + 12, 0);
    head.addColorStop(0, "#d9ab68");
    head.addColorStop(0.5, "#8a5f30");
    head.addColorStop(1, "#4a2f14");
    ctx.fillStyle = head;
    roundRect(ctx, armX - 12, top - 34 + drop * 88, 24, 30, 3);
    ctx.fill();
    if (drop > 0.35) {
      const power = clamp01((drop - 0.35) / 0.65);
      glowAt(ctx, armX, top + 6, 120 * power, "#fff2d0", 0.42 * power);
      ring(ctx, armX, top + 6, 14 + power * 46, `rgba(255,235,190,${0.5 * (1 - power)})`, 1.5);
      for (let i = 0; i < 7; i += 1) {
        const angle = -Math.PI * 0.5 + (i - 3) * 0.42;
        const dist = 20 + power * 60;
        const px = armX + Math.cos(angle) * dist;
        const py = top + 6 + Math.sin(angle) * dist;
        ctx.save();
        ctx.globalAlpha = (1 - power) * 0.7;
        ctx.fillStyle = "#f6e8cc";
        ctx.translate(px, py);
        ctx.rotate(angle + power);
        ctx.fillRect(-1.6, -1, 3.2, 2);
        ctx.restore();
      }
    }
  }

  function sceneRelay(ctx, w, h, p, pal, hole) {
    const close = ease(sub(0.22, 0.6, p));
    const cy = hole.y;
    const gap = mix(26, 2, close);

    // 机房墙面：面板 + 铆钉 + 线束，低对比做背景
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 6; i += 1) {
      const pw = w / 5.4;
      const x = -w * 0.1 + i * pw;
      const g = ctx.createLinearGradient(x, 0, x + pw, 0);
      g.addColorStop(0, "rgba(10,26,16,0.9)");
      g.addColorStop(1, "rgba(4,14,9,0.9)");
      ctx.fillStyle = g;
      ctx.fillRect(x + 6, h * 0.06, pw - 12, h * 0.88);
      ctx.strokeStyle = "rgba(108,255,158,0.1)";
      ctx.strokeRect(x + 6, h * 0.06, pw - 12, h * 0.88);
      ctx.fillStyle = "rgba(108,255,158,0.16)";
      for (let k = 0; k < 5; k += 1) {
        circle(ctx, x + 18, h * (0.14 + k * 0.17), 1.5, "rgba(108,255,158,0.2)");
        circle(ctx, x + pw - 18, h * (0.14 + k * 0.17), 1.5, "rgba(108,255,158,0.2)");
      }
    }
    ctx.restore();

    // 继电器框架
    const fx = hole.x - 250;
    const fy = cy - 92;
    const fw = 500;
    const fh = 184;
    const frame = ctx.createLinearGradient(0, fy, 0, fy + fh);
    frame.addColorStop(0, "rgba(28,46,32,0.96)");
    frame.addColorStop(1, "rgba(9,18,12,0.96)");
    ctx.fillStyle = frame;
    roundRect(ctx, fx, fy, fw, fh, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(108,255,158,0.25)";
    ctx.lineWidth = 1;
    roundRect(ctx, fx, fy, fw, fh, 8);
    ctx.stroke();
    ctx.strokeStyle = "rgba(108,255,158,0.12)";
    ctx.beginPath();
    ctx.moveTo(fx + 14, fy + 34);
    ctx.lineTo(fx + fw - 14, fy + 34);
    ctx.stroke();
    label(ctx, "RELAY 02 / NORMALLY OPEN", fx + 18, fy + 18, 9, "rgba(108,255,158,0.5)", "left", 1.8);

    // 线圈
    ctx.save();
    for (let i = 0; i < 16; i += 1) {
      const x = hole.x - 108 + i * 13.5;
      const coil = ctx.createLinearGradient(0, fy + 28, 0, fy + 56);
      coil.addColorStop(0, "rgba(216,162,106,0.6)");
      coil.addColorStop(1, "rgba(74,44,24,0.7)");
      ctx.fillStyle = coil;
      roundRect(ctx, x, fy + 28, 9, 26, 4);
      ctx.fill();
    }
    ctx.restore();

    // 触点：两条铜臂 + 中间的缺口
    const armY = cy - 9;
    const arm = ctx.createLinearGradient(0, armY, 0, armY + 18);
    arm.addColorStop(0, "#f0c48a");
    arm.addColorStop(0.45, "#a9713c");
    arm.addColorStop(1, "#4c2c15");
    [hole.x - 44 - gap, hole.x + 44 + gap].forEach((edge, index) => {
      const width = 150;
      const x = index === 0 ? edge - width : edge;
      ctx.fillStyle = arm;
      roundRect(ctx, x, armY, width, 18, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(255,230,190,0.32)";
      ctx.fillRect(x + 6, armY + 2, width - 12, 2);
      // 触点端头
      ctx.fillStyle = "#ffd9a0";
      circle(ctx, index === 0 ? edge - 4 : edge + 4, cy, 5, "#ffcf8a");
    });

    // 火花
    if (close > 0.82) {
      const spark = 1 - Math.abs(p - 0.72) * 8;
      if (spark > 0) {
        ctx.save();
        ctx.globalAlpha = clamp01(spark);
        ctx.strokeStyle = "#fff6dc";
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 4; k += 1) {
          ctx.beginPath();
          ctx.moveTo(hole.x - gap, cy + (k - 2) * 3);
          ctx.lineTo(hole.x + gap, cy + (k - 1.4) * 3);
          ctx.stroke();
        }
        ctx.restore();
        glowAt(ctx, hole.x, cy, 70, "#ffe0a8", 0.45 * spark);
      }
    }

    // 真空管：逐步点亮
    const lit = close > 0.78 ? sub(0.58, 0.96, p) : 0;
    for (let i = 0; i < 9; i += 1) {
      const x = hole.x - 168 + i * 42;
      const on = i / 9 < lit;
      const glass = ctx.createLinearGradient(0, fy - 104, 0, fy - 44);
      glass.addColorStop(0, on ? "rgba(255,228,174,0.95)" : "rgba(58,42,24,0.55)");
      glass.addColorStop(0.55, on ? "rgba(255,177,90,0.9)" : "rgba(36,23,8,0.5)");
      glass.addColorStop(1, on ? "rgba(138,58,12,0.85)" : "rgba(20,12,4,0.5)");
      ctx.fillStyle = glass;
      roundRect(ctx, x - 11, fy - 106, 22, 62, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,220,170,0.22)";
      ctx.lineWidth = 1;
      roundRect(ctx, x - 11, fy - 106, 22, 62, 10);
      ctx.stroke();
      if (on) {
        ctx.fillStyle = "rgba(255,245,220,0.9)";
        ctx.fillRect(x - 1, fy - 98, 2, 44);
        glowAt(ctx, x, fy - 76, 56, "#ffb45a", 0.42);
      }
    }

    // 示波器扫描线（数据可视化）
    const cx = fx + fw - 150;
    const cy2 = fy + fh - 34;
    ctx.strokeStyle = "rgba(108,255,158,0.22)";
    ctx.strokeRect(cx, cy2 - 22, 132, 32);
    ctx.strokeStyle = "rgba(140,255,184,0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const value = Math.sin(t * 12 + p * 20) * 6 + (close > 0.8 ? 2 : 0);
      const x = cx + 4 + t * 124;
      const y = cy2 - 6 + value;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function sceneUnix(ctx, w, h, p, pal, hole) {
    const line = "WRITE PROGRAMS THAT DO ONE THING AND DO IT WELL.";
    const shown = Math.floor(easeOut(sub(0.06, 0.72, p)) * line.length);
    const size = Math.min(34, w / 24);

    scanlines(ctx, w, h, 0.16, 3);

    ctx.font = `700 ${size}px ${MONO}`;
    const textW = ctx.measureText(line).width;
    let x = w / 2 - textW / 2;
    const y = hole.y;
    ctx.textBaseline = "middle";
    for (let i = 0; i < line.length; i += 1) {
      const charW = ctx.measureText(line[i]).width;
      if (i < shown) {
        if (i === line.indexOf("ONE")) {
          circle(ctx, x + charW / 2, y, size * 0.36, "rgba(20,15,8,0.95)");
          ring(ctx, x + charW / 2, y, size * 0.36, pal.ink, 2);
        } else {
          ctx.fillStyle = pal.ink;
          ctx.shadowColor = "rgba(240,198,116,0.45)";
          ctx.shadowBlur = 7;
          ctx.fillText(line[i], x, y);
          ctx.shadowBlur = 0;
        }
      }
      x += charW;
    }

    const cursorOn = shown < line.length && Math.floor(p * 14) % 2 === 0;
    if (cursorOn) {
      ctx.fillStyle = pal.hot;
      ctx.fillRect(x + 2, y - size * 0.44, size * 0.46, size * 0.88);
      glowAt(ctx, x + 2, y, 16, "#fff0c2", 0.22);
    }

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, y + size * 1.72);
    ctx.lineTo(w * 0.8, y + size * 1.72);
    ctx.stroke();
    ctx.restore();
  }

  function sceneWeb(ctx, w, h, p, pal, hole) {
    const bw = Math.min(w * 0.58, 660);
    const bh = Math.min(h * 0.5, 380);
    const grow = easeOut(sub(0.04, 0.5, p));
    const tilt = (1 - ease(sub(0.1, 0.6, p))) * 0.16;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-tilt);
    ctx.translate(-w / 2, -h / 2);
    const x = w / 2 - bw / 2;
    const y = h / 2 - bh / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,229,255,0.35)";
    ctx.shadowBlur = 60;
    ctx.fillStyle = "#f4f4f4";
    roundRect(ctx, x, y, bw, bh, 5);
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, x, y, bw, bh, 5);
    ctx.clip();

    const chrome = ctx.createLinearGradient(0, y, 0, y + 30);
    chrome.addColorStop(0, "#dcdcdc");
    chrome.addColorStop(1, "#b6b6b6");
    ctx.fillStyle = chrome;
    ctx.fillRect(x, y, bw, 30);
    ctx.fillStyle = "#0a2a8a";
    ctx.fillRect(x, y, bw * grow, 30);
    label(ctx, "Netscape Navigator", x + 12, y + 15, 11, "#fff", "left", 0.4);

    // 星空的页面
    const page = ctx.createLinearGradient(x, y, x, y + bh);
    page.addColorStop(0, "#05060f");
    page.addColorStop(1, "#0d1030");
    ctx.fillStyle = page;
    ctx.fillRect(x, y + 30, bw, bh - 30);
    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 70; i += 1) {
      const sx = x + ((i * 97) % bw);
      const sy = y + 30 + ((i * 53) % (bh - 30));
      ctx.fillStyle = i % 7 === 0 ? "#ffe066" : "#ffffff";
      ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    ctx.restore();

    if (grow > 0.3) {
      const titleSize = Math.round(bh * 0.13);
      ctx.font = `700 ${titleSize}px ${SANS}`;
      ctx.fillStyle = "#ffe066";
      ctx.textBaseline = "middle";
      ctx.fillText("我的第一个主页", x + 34, y + 34 + titleSize);
      ctx.strokeStyle = "rgba(255,224,102,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 34, y + 34 + titleSize * 1.8);
      ctx.lineTo(x + 34 + bw * 0.42, y + 34 + titleSize * 1.8);
      ctx.stroke();
    }

    if (grow > 0.55) {
      const slide = (1 - easeOut(sub(0.55, 1, p))) * bw;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = "rgba(255,80,80,0.5)";
      ctx.strokeRect(x + 34, y + bh * 0.52, bw - 68, 30);
      ctx.font = `600 15px ${SANS}`;
      ctx.fillStyle = "#ff8a8a";
      ctx.textBaseline = "middle";
      ctx.fillText("Welcome to my homepage! 本站正在建设中，欢迎常来。", x + bw - 34 - slide, y + bh * 0.52 + 15);
      ctx.restore();
    }

    if (grow > 0.72) {
      ctx.fillStyle = "#000";
      ctx.strokeStyle = "#19ff5a";
      ctx.lineWidth = 1;
      ctx.fillRect(x + 34, y + bh - 74, 214, 38);
      ctx.strokeRect(x + 34, y + bh - 74, 214, 38);
      label(ctx, "VISITORS", x + 44, y + bh - 55, 10, "#19ff5a", "left", 0.8);
      const digits = "0001024";
      for (let i = 0; i < digits.length; i += 1) {
        const dx = x + 132 + i * 14;
        if (i === 3) {
          circle(ctx, dx + 4, y + bh - 55, 5.5, "rgba(0,0,0,1)");
          ring(ctx, dx + 4, y + bh - 55, 5.5, "#19ff5a", 1.6);
        } else {
          label(ctx, digits[i], dx, y + bh - 55, 14, "#19ff5a");
        }
      }
      label(ctx, "UNDER CONSTRUCTION", x + bw - 34, y + bh - 55, 9, "rgba(255,255,255,0.55)", "right", 1.4);
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(0,229,255,0.5)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, bw, bh, 5);
    ctx.stroke();
    ctx.restore();
  }

  function sceneCloud(ctx, w, h, p, pal, hole) {
    const cy = hole.y;
    const phoneW = 86;
    const phoneH = 168;
    const px = w * 0.26;

    ctx.save();
    ctx.shadowColor = "rgba(111,195,255,0.45)";
    ctx.shadowBlur = 40;
    const body = ctx.createLinearGradient(px - phoneW / 2, 0, px + phoneW / 2, 0);
    body.addColorStop(0, "#2a2a2a");
    body.addColorStop(0.5, "#101010");
    body.addColorStop(1, "#050505");
    ctx.fillStyle = body;
    roundRect(ctx, px - phoneW / 2, cy - phoneH / 2, phoneW, phoneH, 16);
    ctx.fill();
    ctx.restore();

    const screen = ctx.createLinearGradient(0, cy - phoneH / 2, 0, cy + phoneH / 2);
    screen.addColorStop(0, "#12314a");
    screen.addColorStop(1, "#050b12");
    ctx.fillStyle = screen;
    roundRect(ctx, px - phoneW / 2 + 7, cy - phoneH / 2 + 16, phoneW - 14, phoneH - 32, 10);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(px - phoneW / 2 + 7, cy - phoneH / 2 + 16);
    ctx.lineTo(px + phoneW / 2 - 7, cy - phoneH / 2 + 16);
    ctx.lineTo(px - phoneW / 2 + 7, cy + phoneH / 2 - 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    label(ctx, "1024", px, cy - 6, 18, "#bfe9ff", "center", 1);

    const rackX = w * 0.64;
    const racks = 5;
    for (let i = 0; i < racks; i += 1) {
      const x = rackX + i * 62;
      const on = easeOut(sub(0.2 + i * 0.1, 0.46 + i * 0.1, p));
      ctx.fillStyle = "#0d2740";
      ctx.strokeStyle = "rgba(111,195,255,0.45)";
      ctx.lineWidth = 1;
      roundRect(ctx, x, cy - 78, 46, 156, 5);
      ctx.fill();
      ctx.stroke();
      for (let k = 0; k < 9; k += 1) {
        const ledOn = on > 0.1 && Math.sin(p * 26 + i * 2 + k) > -0.2;
        ctx.fillStyle = ledOn ? (k % 3 === 0 ? "#6cff9e" : "#6fc3ff") : "#152b3f";
        ctx.fillRect(x + 8, cy - 64 + k * 16, 4, 4);
      }
      if (on > 0.2) glowAt(ctx, x + 40, cy, 46, "rgba(111,195,255,0.35)", on * 0.5);
    }

    ctx.strokeStyle = "rgba(111,195,255,0.22)";
    ctx.beginPath();
    ctx.moveTo(px + phoneW / 2, cy);
    ctx.lineTo(rackX, cy);
    ctx.stroke();

    for (let i = 0; i < 14; i += 1) {
      const t = (p * 2.2 + i / 14) % 1;
      const x = px + phoneW / 2 + easeOut(t) * (rackX - px - phoneW / 2);
      const y = cy + Math.sin(t * 6 + i) * 10;
      ctx.save();
      ctx.globalAlpha = 0.75 * (1 - t * 0.5);
      ctx.fillStyle = "#8ff0ff";
      ctx.fillRect(x, y, 16 + t * 22, 2);
      ctx.globalAlpha = 0.9;
      circle(ctx, x + 16 + t * 22, y + 1, 2.6, "#e8fbff");
      ctx.restore();
    }

    // 负载曲线（数据可视化）
    const cw = Math.min(w * 0.3, 300);
    const cx = rackX - 10;
    const cyy = cy + 118;
    ctx.strokeStyle = "rgba(111,195,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cyy);
    ctx.lineTo(cx + cw, cyy);
    ctx.stroke();
    ctx.strokeStyle = "rgba(143,240,255,0.85)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const value = Math.min(1, easeOut(t) * 1.2) * (0.55 + 0.45 * Math.sin(t * 7 + p * 6) * 0.25);
      const x = cx + t * cw;
      const y = cyy - value * 46;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    label(ctx, "1024 REQ/S", cx, cyy + 16, 10, "rgba(143,240,255,0.7)", "left", 0.8);
  }

  function sceneAgent(ctx, w, h, p, pal, hole, prompt) {
    const cw = Math.min(w * 0.62, 760);
    const ch = Math.min(h * 0.58, 430);
    const x = Math.max(w * 0.04, hole.x - cw * 0.24);
    const y = h / 2 - ch / 2;
    const typed = Math.floor(easeOut(sub(0.06, 0.4, p)) * prompt.length);
    const reveal = sub(0.44, 0.92, p);

    const enter = easeOut(sub(0, 0.16, p));
    ctx.save();
    ctx.globalAlpha = 0.55 + enter * 0.45;
    ctx.translate(x + cw / 2, y + ch / 2);
    ctx.scale(0.97 + enter * 0.03, 0.97 + enter * 0.03);
    ctx.translate(-(x + cw / 2), -(y + ch / 2));
    ctx.shadowColor = "rgba(192,132,252,0.22)";
    ctx.shadowBlur = 26;
    ctx.fillStyle = "rgba(9,9,16,0.94)";
    roundRect(ctx, x, y, cw, ch, 18);
    ctx.fill();
    ctx.restore();

    const tint = ctx.createLinearGradient(x, y, x + cw, y + ch);
    tint.addColorStop(0, "rgba(143,240,255,0.07)");
    tint.addColorStop(1, "rgba(192,132,252,0.07)");
    ctx.fillStyle = tint;
    roundRect(ctx, x, y, cw, ch, 18);
    ctx.fill();

    ctx.strokeStyle = "rgba(192,132,252,0.4)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, cw, ch, 18);
    ctx.stroke();

    label(ctx, "AGENT · LOCAL", x + 26, y + 30, 10, "rgba(192,132,252,0.85)", "left", 2.2);
    ctx.strokeStyle = "rgba(192,132,252,0.26)";
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 48);
    ctx.lineTo(x + cw - 26, y + 48);
    ctx.stroke();

    // 提示词：右对齐，字号按长度收，保证不出框
    const shown = prompt.slice(0, typed);
    const maxW = cw - 150;
    let fontSize = 19;
    ctx.font = `600 ${fontSize}px ${SANS}`;
    while (fontSize > 12 && ctx.measureText(prompt).width > maxW) {
      fontSize -= 1;
      ctx.font = `600 ${fontSize}px ${SANS}`;
    }
    const right = x + cw - 34;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f2f5ff";
    ctx.fillText(shown, right, y + 92);
    if (typed < prompt.length && Math.floor(p * 16) % 2 === 0) {
      const tw = ctx.measureText(shown).width;
      ctx.fillStyle = pal.hot;
      ctx.fillRect(right - tw - 4, y + 92 - fontSize * 0.66, 2, fontSize * 1.32);
    }
    label(ctx, "你", right, y + 64, 10, "rgba(200,214,255,0.55)", "right", 2);

    // 孔就是 AI 的思考点：钉在同一个位置
    const pulse = 1 + Math.sin(p * 38) * 0.08;
    glowAt(ctx, hole.x, hole.y, 54, "#8ff0ff", 0.22 * pulse);
    ring(ctx, hole.x, hole.y, 15 + pulse * 2, "rgba(143,240,255,0.4)", 1);
    label(ctx, "正在拆这份计划", hole.x + 46, hole.y, 11, "rgba(200,214,255,0.72)", "left", 0.6);

    if (reveal > 0) {
      for (let i = 0; i < 4; i += 1) {
        const on = reveal * 4.4 > i;
        const ly = y + ch - 148 + i * 32;
        ctx.fillStyle = on ? "rgba(200,170,255,0.62)" : "rgba(192,132,252,0.14)";
        const barW = on ? (cw - 96) * (0.62 + ((i * 37) % 30) / 100) : 24;
        ctx.fillRect(x + 34, ly, barW, 3.5);
        if (on) label(ctx, `0${i + 1}`, x + cw - 34, ly + 3, 9, "rgba(143,240,255,0.55)", "right", 1);
      }
    }
  }


  /* ---------- 揭示：整条时间线 ---------- */

  const MICRO = [
    function tape(ctx, x, y, w, h, loop, color) {
      ctx.fillStyle = "#b8a37c";
      ctx.fillRect(x, y + h * 0.28, w, h * 0.44);
      const shift = -loop * w * 0.5;
      for (let c = 0; c < 12; c += 1) {
        const cx = x + shift + c * (w / 7);
        const bit = (c * 5 + 3) % 3 === 0 ? 1 : 0;
        for (let r = 0; r < 2; r += 1) {
          if (r !== bit) continue;
          circle(ctx, cx, y + h * (r === 0 ? 0.38 : 0.62), Math.max(1.6, h * 0.028), "rgba(28,20,10,0.92)");
        }
      }
      const drop = Math.max(0, Math.sin(loop * Math.PI * 2));
      ctx.fillStyle = "#8a5f30";
      ctx.fillRect(x + w * 0.5 - 2, y + h * 0.02 + (1 - drop) * h * 0.1, 4, h * 0.24);
      if (drop > 0.85) glowAt(ctx, x + w * 0.5, y + h * 0.3, h * 0.3, "#ffe0a8", 0.5);
    },
    function relay(ctx, x, y, w, h, loop, color) {
      const close = (Math.sin(loop * Math.PI * 2 - 1.2) + 1) / 2;
      const gap = mix(w * 0.06, 2, close);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = color;
      ctx.fillRect(x + w * 0.18, y + h * 0.44, w * 0.26 - gap / 2, Math.max(3, h * 0.07));
      ctx.fillRect(x + w * 0.56 + gap / 2, y + h * 0.44, w * 0.26 - gap / 2, Math.max(3, h * 0.07));
      glowAt(ctx, x + w * 0.5, y + h * 0.48, h * 0.3, color, close * 0.5);
      ctx.fillStyle = close > 0.6 ? "#ffe4ae" : "rgba(90,70,40,0.8)";
      circle(ctx, x + w * 0.5, y + h * 0.2, Math.max(3, h * 0.06), close > 0.6 ? "#ffe4ae" : "rgba(90,70,40,0.8)");
      ctx.globalAlpha = 1;
    },
    function unix(ctx, x, y, w, h, loop, color) {
      const text = "$ grep ERROR";
      const shown = Math.floor(((loop * 1.6) % 1.2) * text.length);
      ctx.font = `600 ${Math.max(7, h * 0.16)}px ${MONO}`;
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(text.slice(0, Math.min(shown, text.length)), x + w * 0.08, y + h * 0.38);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let i = 0; i < 3; i += 1) ctx.fillRect(x + w * 0.08, y + h * (0.56 + i * 0.1), w * (0.5 - i * 0.1), 1.5);
      if (Math.floor(loop * 8) % 2 === 0) {
        ctx.fillStyle = color;
        ctx.fillRect(
          x + w * 0.08 + Math.min(shown, text.length) * h * 0.09,
          y + h * 0.3,
          Math.max(1.5, w * 0.012),
          h * 0.18
        );
      }
    },
    function web(ctx, x, y, w, h, loop, color) {
      ctx.fillStyle = "rgba(240,240,240,0.82)";
      ctx.fillRect(x + w * 0.12, y + h * 0.16, w * 0.76, h * 0.66);
      ctx.fillStyle = "#0a2a8a";
      ctx.fillRect(x + w * 0.12, y + h * 0.16, w * 0.76, h * 0.11);
      ctx.fillStyle = "#ffe066";
      ctx.font = `700 ${Math.max(6, h * 0.14)}px ${SANS}`;
      ctx.textBaseline = "middle";
      ctx.fillText("我的主页", x + w * 0.14, y + h * 0.42);
      const hits = Math.floor((loop * 1024) % 1024);
      ctx.fillStyle = "#0a0";
      ctx.font = `600 ${Math.max(6, h * 0.11)}px ${MONO}`;
      ctx.fillText(String(hits).padStart(7, "0"), x + w * 0.14, y + h * 0.65);
      if (color) ctx.globalAlpha = 1;
    },
    function cloud(ctx, x, y, w, h, loop, color) {
      for (let i = 0; i < 4; i += 1) {
        const rx = x + w * (0.44 + i * 0.14);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, y + h * 0.24, w * 0.1, h * 0.5);
        for (let k = 0; k < 4; k += 1) {
          const on = Math.sin(loop * Math.PI * 6 + i + k) > 0;
          ctx.fillStyle = on ? color : "rgba(111,195,255,0.2)";
          ctx.fillRect(rx + 2, y + h * (0.3 + k * 0.1), 2, 2);
        }
      }
      for (let i = 0; i < 4; i += 1) {
        const t = (loop + i * 0.25) % 1;
        const px = x + w * 0.16 + t * w * 0.3;
        ctx.fillStyle = "#8ff0ff";
        ctx.fillRect(px, y + h * 0.48 + Math.sin(t * 6 + i) * h * 0.06, Math.max(3, w * 0.04), 1.6);
      }
    },
    function agent(ctx, x, y, w, h, loop, color) {
      if (Math.floor(loop * 6) % 2 === 0) {
        ctx.fillStyle = color;
        ctx.fillRect(x + w * 0.2, y + h * 0.22, 3.5, h * 0.22);
        glowAt(ctx, x + w * 0.2, y + h * 0.33, h * 0.22, color, 0.4);
      }
      ctx.fillStyle = "rgba(200,170,255,0.7)";
      for (let i = 0; i < 3; i += 1) {
        const on = loop * 3.4 > i;
        ctx.globalAlpha = on ? 1 : 0.16;
        ctx.fillRect(x + w * 0.16, y + h * (0.56 + i * 0.12), w * (on ? 0.6 - i * 0.08 : 0.12), 2);
      }
      ctx.globalAlpha = 1;
    },
  ];

  function sceneReveal(ctx, w, h, p, t, traveler) {
    const left = w * 0.05;
    const right = w * 0.95;
    const gap = w * 0.014;
    const fw = (right - left - gap * 5) / 6;
    const fh = fw * 0.62;
    const y = h * 0.4 - fh / 2;
    const grow = easeOut(sub(0.02, 0.42, p));

    // 胶片带：托住六格
    const stripH = 14;
    const strip = ctx.createLinearGradient(left, 0, right, 0);
    strip.addColorStop(0, "rgba(224,164,88,0.55)");
    strip.addColorStop(0.5, "rgba(240,198,116,0.3)");
    strip.addColorStop(1, "rgba(192,132,252,0.55)");
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = strip;
    ctx.fillRect(left, y + fh - stripH / 2, (right - left) * grow, stripH);
    ctx.globalAlpha = 0.5;
    for (let x = left; x < left + (right - left) * grow; x += 15) {
      circle(ctx, x + 7, y + fh - stripH / 2 + 3, 1.5, "#05070b");
      circle(ctx, x + 7, y + fh + stripH / 2 - 3, 1.5, "#05070b");
    }
    ctx.restore();

    STATIONS.forEach((station, index) => {
      const a = easeOut(sub(0.04 + index * 0.045, 0.26 + index * 0.045, p));
      if (a <= 0) return;
      const x = left + index * (fw + gap);
      const rise = (1 - a) * 18;

      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(0, rise);

      ctx.fillStyle = "rgba(8,10,14,0.95)";
      ctx.fillRect(x, y, fw, fh);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, fw, fh);
      ctx.clip();
      const loop = (t * 0.5 + index * 0.17) % 1;
      ctx.translate(x + 7, y + 7);
      ctx.scale((fw - 14) / fw, (fh - 14) / fh);
      MICRO[index](ctx, 0, 0, fw, fh, loop, station.color);
      ctx.restore();

      ctx.strokeStyle = station.color;
      ctx.globalAlpha = a * 0.8;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, fw, fh);
      ctx.globalAlpha = a * 0.18;
      const sheen = ctx.createLinearGradient(x, y, x + fw, y + fh);
      sheen.addColorStop(0, "rgba(255,255,255,0.5)");
      sheen.addColorStop(0.4, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, fw, fh * 0.5);

      ctx.globalAlpha = a * 0.55;
      ctx.strokeStyle = station.color;
      ctx.beginPath();
      ctx.moveTo(x, y + fh + 22);
      ctx.lineTo(x, y + fh + 12);
      ctx.stroke();
      ctx.globalAlpha = a;
      label(ctx, station.year, x, y + fh + 36, 12, station.color, "left", 1.6);
      ctx.restore();
    });

    const measure = easeOut(sub(0.36, 0.58, p));
    if (measure > 0) {
      const my = y - 40;
      ctx.save();
      ctx.globalAlpha = measure * 0.65;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, my);
      ctx.lineTo(left + (right - left) * measure, my);
      ctx.stroke();
      ctx.restore();
      label(ctx, "222 YEARS · 6 ERAS", w / 2, my - 16, 10, "rgba(255,255,255,0.55)", "center", 3);
    }

    const titleP = easeOut(sub(0.3, 0.5, p));
    const titleOut = 1 - sub(0.56, 0.66, p);
    const cardP = easeOut(sub(0.58, 0.72, p));

    if (titleP > 0 && titleOut > 0) {
      const size = Math.min(w * 0.05, 44);
      ctx.save();
      ctx.globalAlpha = titleP * titleOut;
      ctx.font = `800 ${size}px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f6f9ff";
      ctx.shadowColor = "rgba(143,240,255,0.25)";
      ctx.shadowBlur = 16;
      ctx.fillText("工具在变，Build 不变。", w / 2, y + fh + 84 - (1 - titleP) * 10);
      ctx.restore();
    }

    if (cardP > 0) {
      const cy = y + fh + 116;
      ctx.save();
      ctx.globalAlpha = cardP;
      const nameSize = Math.min(w * 0.052, 46);
      ctx.font = `800 ${nameSize}px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f8fbff";
      ctx.shadowColor = "rgba(143,240,255,0.3)";
      ctx.shadowBlur = 20;
      ctx.fillText("代码时间机器", w / 2, cy);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 90, cy + nameSize * 0.92);
      ctx.lineTo(w / 2 + 90, cy + nameSize * 0.92);
      ctx.stroke();

      label(ctx, "CODE TIME MACHINE · TRAE 1024", w / 2, cy + nameSize * 1.34, 9, "rgba(255,255,255,0.45)", "center", 2.6);
      label(ctx, traveler || "TRAE Builder", w / 2, cy + nameSize * 1.95, 13, "rgba(143,240,255,0.85)", "center", 2);
      ctx.restore();
    }
  }

  /* ---------- 主绘制 ---------- */

  function pad2(value) {
    return String(Math.round(value)).padStart(2, "0");
  }

  function hud(ctx, w, h, beat, p, t, index) {
    if (beat.key === "reveal") return;
    const small = Math.min(w * 0.009, 12);
    const yearSize = Math.min(w * 0.085, 84);

    // 章节号
    label(ctx, `${pad2(index + 1)} — 06`, w * 0.05, h * 0.108, small, "rgba(255,255,255,0.4)", "left", 3.2);

    // 年份：黑体，不是等宽体
    ctx.save();
    ctx.font = `800 ${yearSize}px ${SANS}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.shadowColor = "rgba(255,255,255,0.16)";
    ctx.shadowBlur = 22;
    ctx.fillText(String(beat.year), w * 0.05 - 3, h * 0.108 + yearSize * 0.92);
    ctx.restore();

    // 年份下方的细线 + 时代标签
    const lineY = h * 0.108 + yearSize * 1.12;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.05, lineY);
    ctx.lineTo(w * 0.05 + yearSize * 2.1, lineY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = `600 ${Math.min(w * 0.011, 14)}px ${SANS}`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "1.6px";
    ctx.fillText(beat.tag, w * 0.05, lineY + 20);
    ctx.letterSpacing = "0px";
    ctx.restore();

    // 右上角：读数方块
    const boxW = Math.min(w * 0.2, 250);
    const boxX = w * 0.95 - boxW;
    const boxY = h * 0.108;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, 34);
    ctx.restore();
    label(ctx, "READOUT", boxX + 10, boxY + 12, 7, "rgba(255,255,255,0.4)", "left", 2.4);
    label(ctx, beat.readout, boxX + 10, boxY + 25, Math.min(w * 0.0085, 11), "rgba(255,255,255,0.75)", "left", 1.2);

    // 底部时间标尺
    const left = w * 0.05;
    const right = w * 0.95;
    const y = h - 104;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    for (let i = 0; i <= 24; i += 1) {
      const x = left + ((right - left) / 24) * i;
      const tall = i % 4 === 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - (tall ? 7 : 3));
      ctx.stroke();
    }
    const head = easeOut(clamp01(t / REVEAL_AT));
    const hx = left + (right - left) * head;
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "rgba(143,240,255,0.75)";
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(hx, y);
    ctx.stroke();
    ctx.fillStyle = "#8ff0ff";
    ctx.fillRect(hx - 1, y - 9, 2, 12);
    ctx.restore();
    label(ctx, "1804", left, y + 14, 8, "rgba(255,255,255,0.35)", "left", 1.2);
    label(ctx, "2026", right, y + 14, 8, "rgba(255,255,255,0.35)", "right", 1.2);
  }

  function createEngine(canvas) {
    const ctx = canvas.getContext("2d");
    const scene = document.createElement("canvas");
    const sceneCtx = scene.getContext("2d");
    const bloom = document.createElement("canvas");
    const bloomCtx = bloom.getContext("2d");
    const noise = [makeNoise(160), makeNoise(160), makeNoise(160)];
    const canBlur = typeof bloomCtx.filter === "string";

    return {
      canvas,
      ctx,
      scene,
      sceneCtx,
      bloom,
      bloomCtx,
      noise,
      dof: null,
      dofCtx: null,
      canBlur,
      resize(width, height) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        scene.width = canvas.width;
        scene.height = canvas.height;
        bloom.width = Math.max(1, Math.round(width / 3));
        bloom.height = Math.max(1, Math.round(height / 3));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      },
    };
  }

  function drawScene(engine, w, h, t, prompt, traveler) {
    const { sceneCtx } = engine;
    sceneCtx.setTransform(engine.canvas.width / w, 0, 0, engine.canvas.height / h, 0, 0);
    sceneCtx.clearRect(0, 0, w, h);

    let index = 0;
    while (index < BEATS.length - 1 && t > BEATS[index].to) index += 1;
    const beat = BEATS[index];
    const from = index === 0 ? 0 : BEATS[index - 1].to;
    const p = clamp01((t - from) / (beat.to - from));
    const pal = beat.pal;

    const bg = sceneCtx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, pal.deep);
    bg.addColorStop(0.6, pal.deep);
    bg.addColorStop(1, "#05060a");
    sceneCtx.fillStyle = bg;
    sceneCtx.fillRect(0, 0, w, h);

    const hole = { x: w / 2 + Math.sin(t * 30) * 4, y: h / 2 + Math.cos(t * 26) * 3 };

    if (index < BEATS.length - 1) {
      const scenes = [sceneTape, sceneRelay, sceneUnix, sceneWeb, sceneCloud, sceneAgent];
      const camera = beat.camera;
      const zoom = mix(camera.zoom[0], camera.zoom[1], ease(p));
      const rot = mix(camera.rot[0], camera.rot[1], ease(p));
      const pan = mix(camera.pan[0], camera.pan[1], ease(p));

      sceneCtx.save();
      sceneCtx.translate(w / 2 + pan, h / 2 + pan * 0.2);
      sceneCtx.rotate((rot * Math.PI) / 180);
      sceneCtx.scale(zoom, zoom);
      sceneCtx.translate(-w / 2, -h / 2);
      if (index === 5) scenes[index](sceneCtx, w, h, p, pal, hole, prompt);
      else scenes[index](sceneCtx, w, h, p, pal, hole);
      sceneCtx.restore();

      // 孔：钉在屏幕上的那个点
      const holeAlpha = 1 - sub(0.9, 1, p);
      sceneCtx.save();
      sceneCtx.globalAlpha = holeAlpha;
      glowAt(sceneCtx, hole.x, hole.y, 46, pal.ink, 0.3);
      circle(sceneCtx, hole.x, hole.y, 9, "rgba(6,5,4,0.97)");
      ring(sceneCtx, hole.x, hole.y, 9, pal.ink, 1.8);
      ring(sceneCtx, hole.x, hole.y, 15 + Math.sin(t * 60) * 1.6, pal.line, 1);
      sceneCtx.restore();
    } else {
      sceneReveal(sceneCtx, w, h, p, t, traveler);
    }

    dust(sceneCtx, w, h, t * 6, pal.ink);
    scanlines(sceneCtx, w, h, index === 2 ? 0.2 : 0.06, 3);
    hud(sceneCtx, w, h, beat, p, t, index);
    return { beat, p, index };
  }

  function composite(engine, w, h, t, pal) {
    const { ctx, scene, bloom, bloomCtx } = engine;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
    ctx.setTransform(engine.canvas.width / w, 0, 0, engine.canvas.height / h, 0, 0);

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(scene, 0, 0, engine.canvas.width, engine.canvas.height, 0, 0, w, h);

    // 边缘虚化：远景/边缘进模糊层，中心保持锐利，模拟浅景深
    if (!engine.dof) {
      engine.dof = document.createElement("canvas");
      engine.dofCtx = engine.dof.getContext("2d");
    }
    if (engine.dof.width !== engine.canvas.width) {
      engine.dof.width = engine.canvas.width;
      engine.dof.height = engine.canvas.height;
    }
    const dofCtx = engine.dofCtx;
    dofCtx.setTransform(1, 0, 0, 1, 0, 0);
    dofCtx.clearRect(0, 0, engine.dof.width, engine.dof.height);
    dofCtx.save();
    if (engine.canBlur) dofCtx.filter = "blur(9px)";
    dofCtx.drawImage(scene, 0, 0);
    dofCtx.restore();
    dofCtx.globalCompositeOperation = "destination-in";
    const mask = dofCtx.createRadialGradient(
      engine.dof.width / 2,
      engine.dof.height * 0.52,
      Math.min(engine.dof.width, engine.dof.height) * 0.36,
      engine.dof.width / 2,
      engine.dof.height * 0.52,
      Math.min(engine.dof.width, engine.dof.height) * 0.78
    );
    mask.addColorStop(0, "rgba(0,0,0,0)");
    mask.addColorStop(0.6, "rgba(0,0,0,0.25)");
    mask.addColorStop(1, "rgba(0,0,0,0.72)");
    dofCtx.fillStyle = mask;
    dofCtx.fillRect(0, 0, engine.dof.width, engine.dof.height);
    dofCtx.globalCompositeOperation = "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(engine.dof, 0, 0);
    ctx.setTransform(engine.canvas.width / w, 0, 0, engine.canvas.height / h, 0, 0);

    // bloom
    bloomCtx.clearRect(0, 0, bloom.width, bloom.height);
    bloomCtx.save();
    if (engine.canBlur) bloomCtx.filter = "blur(7px) brightness(1.22)";
    bloomCtx.drawImage(scene, 0, 0, scene.width, scene.height, 0, 0, bloom.width, bloom.height);
    bloomCtx.restore();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.3;
    ctx.drawImage(bloom, 0, 0, bloom.width, bloom.height, 0, 0, w, h);
    ctx.globalAlpha = 0.12;
    ctx.drawImage(bloom, 0, 0, bloom.width, bloom.height, -w * 0.003, -h * 0.003, w * 1.006, h * 1.006);

    // 逐镜调色：暗部偏冷、亮部偏该时代的主色
    if (pal) {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 1;
      const cold = ctx.createLinearGradient(0, h, 0, 0);
      cold.addColorStop(0, "rgba(104,126,150,0.26)");
      cold.addColorStop(0.55, "rgba(190,200,215,0.08)");
      cold.addColorStop(1, "rgba(255,255,255,0.02)");
      ctx.fillStyle = cold;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "screen";
      const warm = ctx.createRadialGradient(w * 0.52, h * 0.42, 0, w * 0.52, h * 0.42, Math.max(w, h) * 0.72);
      warm.addColorStop(0, `rgba(${rgbOf(pal.ink)},0.1)`);
      warm.addColorStop(1, `rgba(${rgbOf(pal.ink)},0)`);
      ctx.fillStyle = warm;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const tile = engine.noise[Math.floor(performance.now() / 70) % engine.noise.length];
    grain(ctx, w, h, tile, 0.09);

    const topScrim = ctx.createLinearGradient(0, 0, 0, h * 0.24);
    topScrim.addColorStop(0, "rgba(0,0,0,0.62)");
    topScrim.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topScrim;
    ctx.fillRect(0, 0, w, h * 0.24);
    const bottomScrim = ctx.createLinearGradient(0, h * 0.8, 0, h);
    bottomScrim.addColorStop(0, "rgba(0,0,0,0)");
    bottomScrim.addColorStop(1, "rgba(0,0,0,0.66)");
    ctx.fillStyle = bottomScrim;
    ctx.fillRect(0, h * 0.8, w, h * 0.2);
    vignette(ctx, w, h, 0.6);

    // 段间闪白
    let nearest = 1;
    BEATS.forEach((beat) => {
      nearest = Math.min(nearest, Math.abs(t - beat.to));
    });
    if (nearest < 0.009) {
      const power = 1 - nearest / 0.009;
      ctx.fillStyle = `rgba(255,255,255,${power * 0.16})`;
      ctx.fillRect(0, 0, w, h);
    }

    // 黑场：只剩一个孔
    if (t > BLACK_AT && t < REVEAL_AT) {
      const dip =
        t < (BLACK_AT + REVEAL_AT) / 2
          ? sub(BLACK_AT, (BLACK_AT + REVEAL_AT) / 2, t)
          : 1 - sub((BLACK_AT + REVEAL_AT) / 2, REVEAL_AT, t);
      ctx.fillStyle = `rgba(0,0,0,${dip * 0.97})`;
      ctx.fillRect(0, 0, w, h);
      const beat = 1 + Math.sin(t * 160) * 0.06;
      const cx = w / 2;
      const cy = h / 2;
      circle(ctx, cx, cy, 10 * beat, "rgba(0,0,0,1)");
      ring(ctx, cx, cy, 10 * beat, `rgba(255,255,255,${0.5 * dip})`, 1.2);
      glowAt(ctx, cx, cy, 70, "#8ff0ff", 0.22 * dip);
    }
    ctx.restore();
  }

  function play(prompt, traveler) {
    return new Promise((resolve) => {
      const canvas = document.getElementById("finale-canvas");
      const caption = document.getElementById("finale-caption");
      const skipBtn = document.getElementById("finale-skip");
      if (!canvas || !caption) {
        resolve();
        return;
      }
      const engine = createEngine(canvas);
      if (!engine.ctx) {
        resolve();
        return;
      }

      let width = window.innerWidth;
      let height = Math.max(window.innerHeight, 420);
      const size = () => {
        width = window.innerWidth;
        height = Math.max(window.innerHeight, 420);
        engine.resize(width, height);
      };

      CTM.ui.setTheme("finale");
      CTM.ui.showScreen("finale");
      size();

      const reduced = CTM.utils.prefersReduced();
      let raf = null;
      let done = false;
      let lastBeat = -1;
      let heartbeatDone = false;
      const startedAt = performance.now();

      const finish = () => {
        if (done) return;
        done = true;
        if (raf) cancelAnimationFrame(raf);
        if (safety) window.clearTimeout(safety);
        skipBtn.removeEventListener("click", finish);
        document.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", onResize);
        if (CTM.audio && CTM.audio.finaleStop) CTM.audio.finaleStop();
        resolve();
      };

      const safety = window.setTimeout(finish, DURATION + 3000);

      const onKey = (event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") finish();
      };
      const onResize = () => {
        size();
        if (reduced) {
          const built = drawScene(engine, width, height, 1, prompt, traveler);
          composite(engine, width, height, 1, built.beat.pal);
          caption.textContent = built.beat.caption;
        }
      };

      skipBtn.addEventListener("click", finish);
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);

      if (CTM.audio && CTM.audio.finaleStart) CTM.audio.finaleStart(DURATION / 1000, BLACK_AT * DURATION);

      if (reduced) {
        const built = drawScene(engine, width, height, 1, prompt, traveler);
        composite(engine, width, height, 1, built.beat.pal);
        caption.textContent = built.beat.caption;
        window.setTimeout(finish, 1800);
        return;
      }

      const frame = (now) => {
        if (done) return;
        const t = clamp01((now - startedAt) / DURATION);
        const built = drawScene(engine, width, height, t, prompt, traveler);
        composite(engine, width, height, t, built.beat.pal);

        if (!heartbeatDone && t >= BLACK_AT) {
          heartbeatDone = true;
          if (CTM.audio && CTM.audio.heartbeat) CTM.audio.heartbeat();
        }

        let index = 0;
        while (index < BEATS.length - 1 && t > BEATS[index].to) index += 1;
        if (index !== lastBeat) {
          lastBeat = index;
          caption.textContent = BEATS[index].caption;
          caption.classList.remove("is-in");
          void caption.offsetWidth;
          caption.classList.add("is-in");
          if (CTM.audio && CTM.audio.sceneHit) CTM.audio.sceneHit(BEATS[index].sound);
        }

        if (t < 1) raf = requestAnimationFrame(frame);
        else finish();
      };
      raf = requestAnimationFrame(frame);
    });
  }

  CTM.finale = { play, DURATION };
})(window.CTM = window.CTM || {});
