(function (CTM) {
  "use strict";

  const $ = CTM.$;
  const $$ = CTM.$$;
  const state = CTM.state;
  const ui = CTM.ui;
  const audio = CTM.audio;
  const utils = CTM.utils;
  const ERAS = CTM.eras;

  let currentCleanup = null;
  let currentEraIndex = -1;
  let eraCompleted = false;
  let starting = false;
  let futureReturn = { screen: "landing", theme: "landing" };
  let futureActive = false;
  let futureRaf = null;
  let bootStarted = false;
  let keyBuffer = "";

  const pad2 = (value) => String(value).padStart(2, "0");
  const escapeHtml = utils.escapeHtml;

  function restoreSaved() {
    const saved = CTM.storage.load();
    if (!saved) {
      audio.restore(false);
      updateContinueUI();
      return;
    }

    state.traveler = typeof saved.traveler === "string" ? saved.traveler : "";
    state.eraIndex = utils.clamp(saved.eraIndex, 0, ERAS.length);
    state.stamps = Array.isArray(saved.stamps)
      ? Array.from(
          new Set(
            saved.stamps
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value) && value >= 0 && value < ERAS.length)
          )
        )
      : [];
    const scores = saved.scores || {};
    state.scores = {
      manual: Math.max(0, Number(scores.manual) || 0),
      systems: Math.max(0, Number(scores.systems) || 0),
      expression: Math.max(0, Number(scores.expression) || 0),
      direction: Math.max(0, Number(scores.direction) || 0),
    };
    state.eraScores = Array.from({ length: ERAS.length }, (_, index) => {
      const entry = saved.eraScores && saved.eraScores[index];
      return entry && typeof entry === "object" ? entry : null;
    });
    state.choices = saved.choices && typeof saved.choices === "object" ? saved.choices : {};
    state.ai = saved.ai && typeof saved.ai === "object" ? saved.ai : null;
    state.sound = Boolean(saved.sound);
    state.started = Boolean(saved.started) || state.stamps.length > 0 || Boolean(saved.completed);
    state.completed = Boolean(saved.completed) || state.stamps.length >= ERAS.length;
    state.startedAt = Number(saved.startedAt) || null;
    state.finishedAt = Number(saved.finishedAt) || null;
    if (state.completed) {
      state.eraIndex = ERAS.length;
      if (state.stamps.length < ERAS.length) {
        state.stamps = ERAS.map((_, index) => index);
      }
    }

    audio.restore(state.sound);
    const input = $("#traveler");
    if (input && state.traveler) input.value = state.traveler;
    updateContinueUI();
  }

  function updateContinueUI() {
    const wrap = $("#continue-wrap");
    const button = $("#continue-btn");
    const meta = $("#continue-meta");
    if (!wrap || !button || !meta) return;
    const hasProgress = state.started || state.stamps.length > 0 || state.completed;
    wrap.hidden = !hasProgress;
    if (!hasProgress) return;
    if (state.completed) {
      button.textContent = "查看上次档案";
    } else {
      button.textContent = `继续上次旅行（第 ${Math.min(state.eraIndex + 1, ERAS.length)} 站）`;
    }
    meta.textContent = `${state.traveler || "匿名 Builder"} · ${state.stamps.length}/${ERAS.length} 枚印章`;
  }

  function typeBootLog() {
    if (bootStarted) return;
    bootStarted = true;
    const el = $("#boot-log");
    if (!el) return;
    const lines = [
      "> BOOT 1024://TIME-MACHINE",
      "> MEMORY 1024K ............ OK",
      "> TIMELINE MODULE ......... OK",
      "> BUILD HISTORY .......... 6 ERAS FOUND",
      "> 正在校准时间坐标...",
    ];
    const cursor = document.createElement("span");
    cursor.className = "boot-cursor";
    cursor.setAttribute("aria-hidden", "true");

    if (utils.prefersReduced()) {
      el.textContent = lines.join("\n");
      el.appendChild(cursor);
      const status = $("#console-status");
      if (status) status.textContent = "ONLINE";
      return;
    }

    el.textContent = "";
    el.appendChild(cursor);
    let lineIndex = 0;
    let charIndex = 0;

    const step = () => {
      if (lineIndex >= lines.length) {
        const status = $("#console-status");
        if (status) status.textContent = "ONLINE";
        return;
      }
      if (charIndex === 0 && lineIndex > 0) {
        el.insertBefore(document.createTextNode("\n"), cursor);
      }
      const line = lines[lineIndex];
      if (charIndex < line.length) {
        el.insertBefore(document.createTextNode(line[charIndex]), cursor);
        charIndex += 1;
        window.setTimeout(step, 14);
      } else {
        lineIndex += 1;
        charIndex = 0;
        window.setTimeout(step, 170);
      }
    };
    window.setTimeout(step, 260);
  }

  function initLandingCanvas() {
    const canvas = $("#landing-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let particles = [];
    let raf = null;

    const seed = () => {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      width = Math.max(320, rect.width);
      height = Math.max(480, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 700 ? 38 : 70;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.08 + Math.random() * 0.32,
        size: 9 + Math.random() * 7,
        char: Math.random() < 0.5 ? "0" : "1",
        alpha: 0.06 + Math.random() * 0.16,
        warm: Math.random() < 0.22,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.y -= particle.speed;
        if (particle.y < -20) {
          particle.y = height + 20;
          particle.x = Math.random() * width;
        }
        ctx.font = `${particle.size}px "SFMono-Regular", Consolas, monospace`;
        ctx.fillStyle = particle.warm
          ? `rgba(224,164,88,${particle.alpha})`
          : `rgba(143,240,255,${particle.alpha})`;
        ctx.fillText(particle.char, particle.x, particle.y);
      });
      if (!utils.prefersReduced()) {
        raf = requestAnimationFrame(draw);
      }
    };

    const onResize = () => {
      seed();
      if (utils.prefersReduced()) draw();
    };

    seed();
    draw();
    window.addEventListener("resize", onResize);
    if (utils.prefersReduced()) {
      if (raf) cancelAnimationFrame(raf);
    }
  }

  function playTunnel(fromYear, toYear, label, duration) {
    return new Promise((resolve) => {
      const overlay = $("#tunnel");
      const canvas = $("#tunnel-canvas");
      const yearEl = $("#tunnel-year");
      const labelEl = $("#tunnel-label");
      const skipBtn = $("#tunnel-skip");
      if (!overlay || !canvas || !yearEl || !labelEl) {
        resolve();
        return;
      }

      const reduced = utils.prefersReduced();
      const total = duration || (reduced ? 260 : 2200);
      let done = false;
      let raf = null;
      let skipHandler = null;
      let keyHandler = null;

      overlay.hidden = false;
      labelEl.textContent = label || "正在校准时间坐标";
      yearEl.textContent = String(fromYear);
      audio.warp();

      const finish = () => {
        if (done) return;
        done = true;
        if (raf) cancelAnimationFrame(raf);
        if (skipHandler) skipBtn.removeEventListener("click", skipHandler);
        if (keyHandler) document.removeEventListener("keydown", keyHandler);
        overlay.hidden = true;
        resolve();
      };

      if (reduced) {
        yearEl.textContent = String(toYear);
        window.setTimeout(finish, total);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        finish();
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      const stars = Array.from({ length: 170 }, () => ({
        x: (Math.random() * 2 - 1) * width,
        y: (Math.random() * 2 - 1) * height,
        z: 1 + Math.random() * width,
        color: Math.random() < 0.2 ? "224,164,88" : Math.random() < 0.4 ? "192,132,252" : "143,240,255",
      }));

      skipHandler = finish;
      skipBtn.addEventListener("click", skipHandler);
      keyHandler = (event) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") finish();
      };
      document.addEventListener("keydown", keyHandler);

      const start = performance.now();
      const frame = (now) => {
        if (done) return;
        const progress = Math.min(1, (now - start) / total);
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        yearEl.textContent = String(Math.round(fromYear + (toYear - fromYear) * eased));

        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, width, height);

        stars.forEach((star) => {
          star.z -= width * 0.016;
          if (star.z <= 1) {
            star.z = width;
            star.x = (Math.random() * 2 - 1) * width;
            star.y = (Math.random() * 2 - 1) * height;
          }
          const k = 280 / star.z;
          const previous = 280 / (star.z + 16);
          const px = width / 2 + star.x * previous;
          const py = height / 2 + star.y * previous;
          const sx = width / 2 + star.x * k;
          const sy = height / 2 + star.y * k;
          if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) return;
          const alpha = Math.min(1, 1 - star.z / width) * 0.8;
          ctx.strokeStyle = `rgba(${star.color},${alpha})`;
          ctx.lineWidth = Math.max(0.5, (1 - star.z / width) * 2);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        });

        const glow = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.min(width, height) * 0.46
        );
        glow.addColorStop(0, "rgba(143,240,255,0.06)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        if (progress < 1) {
          raf = requestAnimationFrame(frame);
        } else {
          finish();
        }
      };
      raf = requestAnimationFrame(frame);
    });
  }

  function mountEra(index) {
    if (!ERAS.length) return;
    if (index >= ERAS.length) {
      showResultFromState();
      return;
    }
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }

    eraCompleted = false;
    currentEraIndex = index;
    state.eraIndex = index;
    state.started = true;
    if (!state.startedAt) state.startedAt = Date.now();
    CTM.storage.save();

    const era = ERAS[index];
    ui.setTheme(era.theme);
    ui.showScreen("era");
    ui.updatePassport();

    const root = $("#era-root");
    if (!root) return;
    root.innerHTML = `<div class="era-shell">
      <header class="era-head">
        <div class="era-kicker">STATION ${pad2(index + 1)} / ${era.year} · ${escapeHtml(era.place)}</div>
        <div class="era-head-row">
          <h2 class="era-title" id="era-title">${escapeHtml(era.label)}</h2>
          <button class="btn btn-quiet" type="button" data-source>史料</button>
        </div>
        <p class="era-intro">${escapeHtml(era.intro)}</p>
      </header>
      <div class="era-grid">
        <div class="scene" data-scene>${era.sceneHtml}</div>
        <div class="panel">
          <div class="task-card">
            <div class="task-label">YOUR TASK / ${pad2(index + 1)}</div>
            <h3 class="task-title">${escapeHtml(era.task)}</h3>
            <p class="task-desc">${escapeHtml(era.taskDesc)}</p>
            <div class="feedback" data-feedback aria-live="polite"></div>
          </div>
          <div class="panel-controls">${era.panelHtml}</div>
        </div>
      </div>
    </div>`;

    const scene = root.querySelector("[data-scene]");
    const panel = root.querySelector(".panel-controls");
    const feedback = root.querySelector("[data-feedback]");
    const sourceButton = root.querySelector("[data-source]");
    if (sourceButton) sourceButton.addEventListener("click", () => openSources(era));

    const api = {
      sound: audio,
      reduced: utils.prefersReduced(),
      toast: ui.toast,
      feedback(message, type) {
        if (!feedback) return;
        feedback.textContent = message || "";
        feedback.className = `feedback${type ? ` is-${type}` : ""}`;
      },
      complete(score, choice, successHtml) {
        completeEra(index, score, choice, successHtml);
      },
    };

    try {
      currentCleanup = era.mount(scene, panel, api) || null;
    } catch (error) {
      console.error(error);
      if (panel) {
        panel.innerHTML = '<p class="hint-text">这一站加载失败。请刷新页面重试。</p>';
      }
    }

    window.scrollTo({ top: 0, behavior: utils.prefersReduced() ? "auto" : "smooth" });
  }

  function completeEra(index, score, choice, successHtml) {
    if (eraCompleted) return;
    if (!ui.recordEra(index, score, choice)) return;
    eraCompleted = true;

    const era = ERAS[index];
    const nextIndex = index + 1;
    state.eraIndex = Math.min(nextIndex, ERAS.length);
    state.completed = nextIndex >= ERAS.length;
    if (state.completed) state.finishedAt = Date.now();
    CTM.storage.save();
    ui.updatePassport();

    ui.modal(
      `<div class="stamp-big">${CTM.icons[era.icon] || ""}<span>${era.year}</span></div>
      <div class="modal-kicker">STAMP ${pad2(index + 1)} / ${pad2(ERAS.length)} · ${escapeHtml(era.label)}</div>
      <h2 class="modal-title" id="modal-title">第 ${index + 1} 枚印章</h2>
      <div class="modal-success">${successHtml}</div>
      <div class="modal-actions">
        <button class="btn btn-primary" type="button" data-next>${
          state.completed ? "查看我的时间旅行档案" : "继续时间旅行"
        }</button>
      </div>`,
      {
        dismissible: false,
        onMount(card, close) {
          const nextButton = card.querySelector("[data-next]");
          if (!nextButton) return;
          nextButton.addEventListener("click", async () => {
            nextButton.disabled = true;
            close();
            if (state.completed) {
              await playTunnel(era.year, 2026, "正在编译你的时间旅行档案");
              showResultFromState();
            } else {
              const nextEra = ERAS[nextIndex];
              await playTunnel(era.year, nextEra.year, `正在前往 ${nextEra.year} · ${nextEra.label}`);
              mountEra(nextIndex);
            }
          });
        },
      }
    );
  }

  function showResultFromState() {
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    ui.closeModal();
    eraCompleted = true;
    state.eraIndex = ERAS.length;
    state.completed = true;
    if (!state.finishedAt) state.finishedAt = Date.now();
    CTM.storage.save();
    const data = CTM.result.compute();
    ui.setTheme("result");
    ui.showScreen("result");
    CTM.result.show(data);
    audio.chime();
  }

  function showResultFromData(data) {
    if (!data) {
      goHome();
      ui.toast("分享链接无效。");
      return;
    }
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    ui.closeModal();
    ui.setTheme("result");
    ui.showScreen("result");
    CTM.result.show(data);
    audio.chime();
  }

  function stopFutureParticles() {
    futureActive = false;
    if (futureRaf) cancelAnimationFrame(futureRaf);
    futureRaf = null;
  }

  function goHome() {
    ui.closeModal();
    stopFutureParticles();
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    if (window.location.hash.startsWith("#r=")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    ui.setTheme("landing");
    ui.showScreen("landing");
    updateContinueUI();
    const status = $("#console-status");
    if (status) status.textContent = "READY";
  }

  function resetAndHome() {
    ui.closeModal();
    stopFutureParticles();
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    CTM.storage.clear();
    ui.resetState(true);
    audio.updateButtons();
    const eraRoot = $("#era-root");
    if (eraRoot) eraRoot.innerHTML = "";
    const resultRoot = $("#result-root");
    if (resultRoot) resultRoot.innerHTML = "";
    const traveler = $("#traveler");
    if (traveler) traveler.value = "";
    const wrap = $("#continue-wrap");
    if (wrap) wrap.hidden = true;
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    ui.setTheme("landing");
    ui.showScreen("landing");
    const status = $("#console-status");
    if (status) status.textContent = "READY";
    ui.toast("已重置。可以开始新的时间旅行。");
  }

  function openHelp() {
    ui.modal(
      `<button class="modal-close" type="button" data-modal-close aria-label="关闭">×</button>
      <div class="modal-kicker">HOW IT WORKS</div>
      <h2 class="modal-title" id="modal-title">一场 6 站的时间旅行</h2>
      <div class="help-content">
        <p>每一站对应一个编程时代，30-60 秒可完成。完成一站，旅行护照上会多一枚印章。</p>
        <ul class="help-list">
          <li>全部交互都可以用鼠标或键盘完成，不依赖拖拽。</li>
          <li>最后一站会生成你的 Builder 类型、四维雷达和一张可下载的海报。</li>
          <li>所有数据只保存在你的浏览器里，不会上传。</li>
          <li>AI 时代使用本地生成模拟，不调用真实大模型，也不消耗 API Key。</li>
        </ul>
        <h3>彩蛋</h3>
        <p>在任意页面输入 <kbd>1024</kbd>，可以进入一个隐藏频道。</p>
        <h3>作品</h3>
        <p>TRAE 1024Builder作品秀 / 代码时间机器。从打孔卡到 Prompt，工具在变，Build 不变。</p>
      </div>`,
      { dismissible: true }
    );
  }

  function openSources(era) {
    const sources = Array.isArray(era.sources) ? era.sources : [];
    ui.modal(
      `<button class="modal-close" type="button" data-modal-close aria-label="关闭">×</button>
      <div class="modal-kicker">SOURCE NOTES / ${era.year}</div>
      <h2 class="modal-title" id="modal-title">${escapeHtml(era.label)} · 史料小注</h2>
      <div class="help-content">
        <ul class="help-list">${sources.map((source) => `<li>${escapeHtml(source)}</li>`).join("")}</ul>
        <p>史料用于交代时代背景，交互为示意性玩法。发布帖会附上参考来源。</p>
      </div>`,
      { dismissible: true }
    );
  }

  async function beginJourney(name) {
    if (starting) return;
    starting = true;
    const startButton = $("#start-btn");
    if (startButton) startButton.disabled = true;
    ui.resetState(true);
    state.traveler = name;
    state.started = true;
    state.startedAt = Date.now();
    state.eraIndex = 0;
    state.completed = false;
    CTM.storage.save();
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    ui.updatePassport();
    const status = $("#console-status");
    if (status) status.textContent = "ONLINE";
    audio.click();
    await playTunnel(2026, ERAS[0].year, "正在校准时间坐标 · 1804", 2400);
    mountEra(0);
    starting = false;
    if (startButton) startButton.disabled = false;
  }

  function onStartSubmit(event) {
    event.preventDefault();
    if (starting) return;
    const input = $("#traveler");
    const name = (input && input.value.trim()) || "匿名 Builder";
    if (state.started && state.stamps.length > 0) {
      ui.modal(
        `<button class="modal-close" type="button" data-modal-close aria-label="关闭">×</button>
        <div class="modal-kicker">NEW JOURNEY</div>
        <h2 class="modal-title" id="modal-title">开始新的时间旅行？</h2>
        <div class="modal-success">当前进度是 ${state.stamps.length}/6 枚印章，开始新旅行会覆盖它。你也可以取消，然后使用“继续上次旅行”。</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" data-modal-close>取消</button>
          <button class="btn btn-primary" type="button" data-confirm>开始新旅行</button>
        </div>`,
        {
          dismissible: true,
          onMount(card, close) {
            const confirm = card.querySelector("[data-confirm]");
            if (confirm) {
              confirm.addEventListener("click", () => {
                close();
                beginJourney(name);
              });
            }
          },
        }
      );
      return;
    }
    beginJourney(name);
  }

  async function continueJourney() {
    if (starting) return;
    if (state.completed || state.eraIndex >= ERAS.length) {
      showResultFromState();
      return;
    }
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    starting = true;
    const button = $("#continue-btn");
    if (button) button.disabled = true;
    audio.click();
    const era = ERAS[Math.max(0, Math.min(state.eraIndex, ERAS.length - 1))];
    await playTunnel(2026, era.year, `正在回到第 ${state.eraIndex + 1} 站 · ${era.label}`, 1600);
    mountEra(state.eraIndex);
    starting = false;
    if (button) button.disabled = false;
  }

  function leaveFuture() {
    stopFutureParticles();
    const screen = futureReturn.screen === "future" ? "landing" : futureReturn.screen;
    ui.setTheme(futureReturn.theme || "landing");
    ui.showScreen(screen);
    updateContinueUI();
  }

  function startFutureParticles() {
    stopFutureParticles();
    const canvas = $("#future-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) * 0.5);
    glow.addColorStop(0, "rgba(143,240,255,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.fillStyle = "#fff";
    octx.font = `900 ${Math.min(width * 0.48, height * 0.56)}px "Arial Black", "PingFang SC", sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText("1024", width / 2, height / 2);
    const image = octx.getImageData(0, 0, width, height).data;
    const points = [];
    const step = Math.max(4, Math.round(width / 280));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (image[(y * width + x) * 4 + 3] > 128) points.push({ x, y });
      }
    }
    for (let index = points.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const temp = points[index];
      points[index] = points[swap];
      points[swap] = temp;
    }

    const particles = Array.from({ length: 1024 }, (_, index) => {
      const point = points.length ? points[index % points.length] : { x: width / 2, y: height / 2 };
      const jitter = points.length && index >= points.length ? 2 : 0;
      return {
        sx: Math.random() * width,
        sy: Math.random() * height,
        tx: point.x + (Math.random() * 2 - 1) * jitter,
        ty: point.y + (Math.random() * 2 - 1) * jitter,
        color: index % 5 === 0 ? "192,132,252" : index % 3 === 0 ? "224,164,88" : "143,240,255",
        size: 0.9 + Math.random() * 1.3,
      };
    });

    const drawParticles = (progress) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      const halo = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.min(width, height) * 0.52
      );
      halo.addColorStop(0, "rgba(143,240,255,0.07)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.035 + progress * 0.025;
      ctx.fillStyle = "#8ff0ff";
      ctx.font = `900 ${Math.min(width * 0.48, height * 0.56)}px "Arial Black", "PingFang SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("1024", width / 2, height / 2);
      ctx.restore();

      particles.forEach((particle) => {
        const x = particle.sx + (particle.tx - particle.sx) * progress;
        const y = particle.sy + (particle.ty - particle.sy) * progress;
        ctx.fillStyle = `rgba(${particle.color},${0.35 + progress * 0.45})`;
        ctx.fillRect(x, y, particle.size, particle.size);
      });
    };

    if (utils.prefersReduced()) {
      drawParticles(1);
      return;
    }

    futureActive = true;
    const start = performance.now();
    const duration = 2500;
    const frame = (now) => {
      if (!futureActive) return;
      const raw = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - raw, 3);
      drawParticles(eased);
      if (raw < 1) {
        futureRaf = requestAnimationFrame(frame);
      } else {
        futureActive = false;
        futureRaf = null;
      }
    };
    futureRaf = requestAnimationFrame(frame);
  }

  function showFuture() {
    if (!$("#modal-root").hidden) return;
    if (!$("#tunnel").hidden) return;
    const active = document.querySelector(".screen.is-active");
    const screen = active ? active.id.replace("screen-", "") : "landing";
    if (screen !== "future") {
      futureReturn = { screen, theme: document.body.dataset.era || "landing" };
    }
    ui.closeModal();
    ui.setTheme("future");
    ui.showScreen("future");
    startFutureParticles();
    audio.chime();
  }

  function bindEvents() {
    const brand = $("#brand");
    if (brand) brand.addEventListener("click", goHome);
    const help = $("#help-open");
    if (help) help.addEventListener("click", openHelp);
    ["sound-toggle", "sound-toggle-2"].forEach((id) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener("click", () => {
          audio.toggle();
        });
      }
    });

    const form = $("#start-form");
    if (form) form.addEventListener("submit", onStartSubmit);
    const continueButton = $("#continue-btn");
    if (continueButton) continueButton.addEventListener("click", continueJourney);
    const restart = $("#restart-btn");
    if (restart) restart.addEventListener("click", resetAndHome);
    const futureBack = $("#future-back");
    if (futureBack) futureBack.addEventListener("click", leaveFuture);

    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target && target.closest && target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (!/^[0-9]$/.test(event.key)) {
        keyBuffer = "";
        return;
      }
      keyBuffer = (keyBuffer + event.key).slice(-4);
      if (keyBuffer === "1024") {
        keyBuffer = "";
        showFuture();
      }
    });
  }

  function init() {
    bindEvents();
    restoreSaved();
    typeBootLog();
    initLandingCanvas();
    audio.updateButtons();
    ui.showScreen("landing");

    if (window.location.hash.startsWith("#r=")) {
      const data = CTM.result.decode(window.location.hash.slice(3));
      if (data) {
        showResultFromData(data);
      } else {
        ui.toast("分享链接无效或已损坏。");
      }
      return;
    }

    updateContinueUI();
  }

  CTM.goHome = goHome;
  CTM.resetAndHome = resetAndHome;
  CTM.mountEra = mountEra;
  CTM.showFuture = showFuture;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window.CTM = window.CTM || {});
