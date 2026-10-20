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
  let eraCompleted = false;
  let starting = false;
  let futureReturn = { screen: "landing", theme: "landing" };
  let futureActive = false;
  let futureRaf = null;
  let bootStarted = false;
  let keyBuffer = "";
  let timerId = null;
  let lastTickMinute = null;
  let takingOver = false;
  let cheatRefused = null;

  const escapeHtml = utils.escapeHtml;

  function remainingMs() {
    if (!state.deadlineAt) return null;
    return Math.max(0, state.deadlineAt - Date.now());
  }

  function renderCountdown() {
    const box = $("#countdown");
    const value = $("#countdown-value");
    if (!box || !value) return;
    const left = remainingMs();
    if (left === null || state.completed) {
      box.hidden = true;
      return;
    }
    const total = Math.ceil(left / 1000);
    box.hidden = false;
    box.classList.toggle("is-warning", total <= 120 && total > 30);
    box.classList.toggle("is-critical", total <= 30);
    value.textContent = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    return total;
  }

  function stopTimer() {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    stopTimer();
    if (!state.deadlineAt || state.completed) {
      renderCountdown();
      return;
    }
    lastTickMinute = null;
    timerId = window.setInterval(() => {
      const total = renderCountdown();
      if (total === null) return;
      if (total <= 30 && total > 0) {
        const minute = Math.floor(total / 60);
        if (minute !== lastTickMinute) {
          lastTickMinute = minute;
          audio.tick();
        }
      }
      if (total <= 0) {
        stopTimer();
        triggerTakeover();
      }
    }, 250);
    renderCountdown();
  }

  async function triggerTakeover() {
    if (takingOver || state.completed) return;
    takingOver = true;
    CTM.agent.mode = "takeover";
    const from = Math.min(state.eraIndex, ERAS.length - 1);
    await CTM.agent.takeover(from, {
      async enter(index) {
        if (index !== state.eraIndex || $("#screen-era").classList.contains("is-active") === false || eraCompleted) {
          mountEra(index);
          await utils.sleep(260);
        }
      },
      async waitForStamp(index) {
        for (let attempt = 0; attempt < 90; attempt += 1) {
          if (CTM.agent.mode !== "takeover") return;
          if ($("#era-continue")) return;
          await utils.sleep(120);
        }
      },
      async advance(index) {
        if (index >= ERAS.length - 1) {
          await finishJourney();
          return;
        }
        await playTunnel(ERAS[index].year, ERAS[index + 1].year, `AGENT · 前往 ${ERAS[index + 1].year}`, 900);
        mountEra(index + 1);
        await utils.sleep(240);
      },
    });
    takingOver = false;
    if (!state.completed) startTimer();
  }

  function restoreSaved() {
    const saved = CTM.storage.load();
    if (!saved) {
      audio.restore(state.sound);
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
    state.deadlineAt = Number(saved.deadlineAt) || null;
    state.takeover = Array.isArray(saved.takeover)
      ? saved.takeover.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value < ERAS.length)
      : [];
    state.sound = Number(saved.v) >= 2 ? Boolean(saved.sound) : true;
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
    meta.textContent = `${state.traveler || CTM.DEFAULT_TRAVELER} · ${state.stamps.length}/${ERAS.length} 枚印章`;
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
        if (safety) window.clearTimeout(safety);
        if (skipHandler) skipBtn.removeEventListener("click", skipHandler);
        if (keyHandler) document.removeEventListener("keydown", keyHandler);
        overlay.hidden = true;
        resolve();
      };

      /* 标签页被切走时 requestAnimationFrame 会停摆，用墙钟时间兜底 */
      const safety = window.setTimeout(finish, total + 1500);

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
    if (CTM.agent.mode !== "takeover") CTM.agent.mode = "idle";
    CTM.agent.hide();
    state.eraIndex = index;
    state.started = true;
    if (!state.startedAt) state.startedAt = Date.now();
    CTM.storage.save();

    const era = ERAS[index];
    ui.setTheme(era.theme);
    ui.showScreen("era");
    ui.updatePassport();
    removeContinueCard();
    removeCheatCard();

    const root = $("#era-root");
    if (!root) return;
    root.innerHTML = "";

    const api = {
      sound: audio,
      reduced: utils.prefersReduced(),
      toast: ui.toast,
      openSources() {
        openSources(era);
      },
      assist() {
        CTM.agent.assistCurrent(index);
      },
      cheat(reason) {
        showCheatCard(index, reason);
      },
      complete(score, choice, options) {
        completeEra(index, score, choice, options || {});
      },
    };

    try {
      currentCleanup = era.render(root, api) || null;
    } catch (error) {
      console.error(error);
      root.innerHTML = '<p class="hint-text">这一站加载失败。请刷新页面重试。</p>';
    }

    $$("[data-sources]", root).forEach((button) => {
      button.addEventListener("click", () => openSources(era));
    });

    window.scrollTo({ top: 0, behavior: utils.prefersReduced() ? "auto" : "smooth" });
  }

  function removeContinueCard() {
    const existing = $("#era-continue");
    if (existing) existing.remove();
  }

  function removeCheatCard() {
    const existing = $("#cheat-card");
    if (existing) existing.remove();
    document.body.classList.remove("has-cheat");
  }

  /* 第一次答错后给一个诚实的作弊口：可以自动填，但档案会记下来 */
  function showCheatCard(index, reason) {
    if (state.stamps.includes(index) || cheatRefused === index) return;
    removeCheatCard();
    const era = ERAS[index];
    const card = document.createElement("div");
    card.className = "cheat-card";
    card.id = "cheat-card";
    card.innerHTML = `<div class="cc-kicker">CHEAT CODE · ${era.year}</div>
      <div class="cc-body">
        <div class="cc-text">${escapeHtml(
          reason || "卡住了？可以让 Agent 帮你把这一关填完。"
        )}<span class="cc-note">档案会写明这一站是代打的</span></div>
        <div class="cc-actions">
          <button class="cc-go" type="button" data-cheat-go>自动帮我填</button>
          <button class="cc-no" type="button" data-cheat-no>我再想想</button>
        </div>
      </div>`;
    document.body.appendChild(card);
    document.body.classList.add("has-cheat");

    card.querySelector("[data-cheat-no]").addEventListener("click", () => {
      cheatRefused = index;
      removeCheatCard();
      audio.click();
    });
    card.querySelector("[data-cheat-go]").addEventListener("click", async () => {
      removeCheatCard();
      cheatRefused = index;
      CTM.agent.mode = "assist";
      await CTM.agent.assistCurrent(index);
    });
    audio.error();
  }

  function showContinueCard(index, label) {
    removeContinueCard();
    const era = ERAS[index];
    const isLast = index >= ERAS.length - 1;
    const card = document.createElement("div");
    card.className = "era-continue";
    card.id = "era-continue";
    card.innerHTML = `<div class="ec-stamp">${CTM.icons[era.icon] || ""}<span>${era.year}</span></div>
      <div class="ec-text">
        <b>${escapeHtml(era.label)}</b>
        <span>STAMP ${index + 1} / ${ERAS.length}</span>
      </div>
      <button class="ec-btn" type="button">${escapeHtml(label)}</button>`;
    document.body.appendChild(card);

    const button = card.querySelector(".ec-btn");
    let busy = false;
    button.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      card.classList.add("is-leaving");
      audio.click();
      const nextIndex = index + 1;
      const nextEra = ERAS[nextIndex];
      removeContinueCard();
      if (isLast) {
        await finishJourney();
      } else {
        await playTunnel(era.year, nextEra.year, `正在前往 ${nextEra.year} · ${nextEra.label}`);
        mountEra(nextIndex);
      }
    });
    window.setTimeout(() => button.focus({ preventScroll: true }), 60);
  }

  async function finishJourney() {
    stopTimer();
    state.eraIndex = ERAS.length;
    state.completed = true;
    if (!state.finishedAt) state.finishedAt = Date.now();
    CTM.storage.save();
    const prompt = state.ai && state.ai.prompt ? state.ai.prompt : "";
    await CTM.finale.play(prompt);
    showResultFromState();
  }

  function completeEra(index, score, choice, options) {
    if (eraCompleted) return;
    const takenOver = CTM.agent.mode !== "idle";
    const finalScore = takenOver
      ? Object.assign({}, score, { direction: (Number(score && score.direction) || 0) + 3 })
      : score;
    if (!ui.recordEra(index, finalScore, choice, takenOver)) return;
    eraCompleted = true;
    if (CTM.agent.mode === "assist") CTM.agent.mode = "idle";

    const era = ERAS[index];
    const nextIndex = index + 1;
    const completed = nextIndex >= ERAS.length;
    state.eraIndex = Math.min(nextIndex, ERAS.length);
    state.completed = completed;
    if (completed) state.finishedAt = Date.now();
    CTM.storage.save();
    ui.updatePassport();

    const stamp = $(`#passport-track .p-stamp:nth-child(${index + 1})`);
    if (stamp) {
      stamp.classList.add("is-fresh");
      window.setTimeout(() => stamp.classList.remove("is-fresh"), 1200);
    }

    const room = $("#era-root .room");
    if (room) room.classList.add("is-done");
    audio.stamp();

    const label =
      options.continueLabel ||
      (completed ? "查看我的时间旅行档案" : `前往 ${ERAS[nextIndex].year} →`);
    showContinueCard(index, label);
  }

  function showResultFromState() {
    stopTimer();
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    ui.closeModal();
    removeContinueCard();
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
    removeContinueCard();
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
    removeContinueCard();
    stopTimer();
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
    removeContinueCard();
    stopTimer();
    CTM.agent.mode = "idle";
    CTM.agent.cancel();
    stopFutureParticles();
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }
    CTM.storage.clear();
    ui.resetState();
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
        <p>每一站是一间不同的房间：1804 的织机工坊、1945 的控制台、1972 的电传机、1991 的桌面、2007 的云仪表盘、2026 的对话框。30-60 秒可完成一站，完成后护照上会多一枚印章。</p>
        <ul class="help-list">
          <li>全程限时 <b>1024 秒</b>，从你按下“启动时间机器”开始算。顶栏右侧有倒计时。</li>
          <li>时间用完会自动进入 <b>Agent 接管</b>：AI 接手剩下的站，把答案接给你看。档案会如实写明哪几站是它替你 Build 的，指挥维度按接管行为计分 —— 你也可以随时点“我来”拿回控制权。</li>
          <li>第一次答错，会弹出 <b>CHEAT CODE</b>：可以让 Agent 自动帮你填这一关。用了作弊，档案会如实写明这一站是代打的，指挥维度按接管行为计分；不想用点“我再想想”，同一关不会再劝你。</li>
          <li>通关后会有一段 24 秒的结尾动画：同一个孔，从 1804 年的纸带一路变成 2026 年的光标。</li>
          <li>全部交互都可以用鼠标或键盘完成，不依赖拖拽。</li>
          <li>每一站都有自己的声音：打孔、继电器、电传打印、拨号上网、机房风扇、生成提示音。右上角可以随时静音。</li>
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
    ui.resetState();
    cheatRefused = null;
    state.traveler = name;
    state.started = true;
    state.startedAt = Date.now();
    state.eraIndex = 0;
    state.completed = false;
    state.deadlineAt = Date.now() + CTM.TIME_LIMIT_MS;
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
    startTimer();
    starting = false;
    if (startButton) startButton.disabled = false;
  }

  function onStartSubmit(event) {
    event.preventDefault();
    if (starting) return;
    const input = $("#traveler");
    const name = (input && input.value.trim()) || CTM.DEFAULT_TRAVELER;
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
    startTimer();
    if (remainingMs() === 0) triggerTakeover();
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
    const agentCancel = $("#agent-cancel");
    if (agentCancel) {
      agentCancel.addEventListener("click", () => {
        CTM.agent.cancel();
        takingOver = false;
        removeContinueCard();
        mountEra(Math.min(state.eraIndex, ERAS.length - 1));
        startTimer();
        ui.toast("时间还给你。剩下的自己来。");
      });
    }

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
