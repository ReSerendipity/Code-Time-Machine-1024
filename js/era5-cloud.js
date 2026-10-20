(function (CTM) {
  "use strict";

  const TOTAL_REQUESTS = 1024;
  const BUDGET = 9;
  const SERVER_COST = 2;
  const CACHE_COST = 1;
  const SERVER_CAPACITY = 300;
  const CACHE_FACTOR = 0.6;

  CTM.eras.push({
    id: "cloud",
    label: "移动 / 云",
    year: 2007,
    theme: "cloud",
    icon: "cloud",
    place: "旧金山 · 一台刚发布的 iPhone",
    sources: [
      "2007 年，iPhone 发布，Web 从桌面走进每个人的口袋，移动端成为新的默认。",
      "云计算的弹性扩容让“先上线、再扩容”成为可能，但也让容量规划变成每个 Builder 的必修课。",
      "缓存、队列、限流、自动扩缩容，是应对突发流量的四种常见手段；本关只用了前两种。",
    ],
    render(root, api) {
      root.innerHTML = `<div class="room room-cloud">
        <div class="dash-head">Builder Cloud · 2007<span>第 5 站 · 旧金山</span></div>
        <div class="dash-grid">
          <div class="dash-phone">
            <div class="phone" data-phone>
              <div class="phone-notch" aria-hidden="true"></div>
              <div class="phone-screen">
                <div class="phone-status"><span data-phone-status>STANDBY</span><span>1024</span></div>
                <div class="app-icon">1024</div>
                <div class="app-name">BUILDER APP</div>
              </div>
            </div>
          </div>
          <div class="dash-chart">
            <div class="cloud-glow" aria-hidden="true"></div>
            <div class="server-racks" data-racks aria-hidden="true">
              <div class="rack"><span class="rack-led"></span></div>
              <div class="rack"><span class="rack-led"></span></div>
              <div class="rack"><span class="rack-led"></span></div>
              <div class="rack"><span class="rack-led"></span></div>
            </div>
            <canvas class="cloud-chart" data-chart></canvas>
            <div class="cloud-readout">
              <div class="readout">有效请求<b data-req>1024</b></div>
              <div class="readout">容量<b data-cap>600</b></div>
              <div class="readout">预计超时<b data-err>424</b></div>
            </div>
          </div>
          <div class="dash-settings">
            <div class="settings-head">Load Test<span>预算 $9</span></div>
            <div class="setting-row">
              <label for="cloud-servers">服务器 <b data-servers-label>2</b> 台</label>
              <input id="cloud-servers" type="range" min="1" max="4" step="1" value="2" data-servers>
            </div>
            <label class="setting-row switch-row"><input type="checkbox" data-cache> 开启缓存 <span>+$1 · 负载 -40%</span></label>
            <div class="setting-row budget-line">花费<b data-cost>$4</b></div>
            <div class="dash-actions">
              <button class="btn btn-primary" type="button" data-cloud-run>开始压测</button>
              <button class="btn btn-ghost" type="button" data-cloud-reset>重置</button>
              <button class="btn btn-quiet" type="button" data-sources>史料</button>
            </div>
            <div class="dash-note">目标：超时 &lt; 10 且花费 ≤ $9。</div>
          </div>
        </div>
      </div>`;

      const phone = root.querySelector("[data-phone]");
      const phoneStatus = root.querySelector("[data-phone-status]");
      const racks = Array.from(root.querySelectorAll(".rack"));
      const chart = root.querySelector("[data-chart]");
      const reqEl = root.querySelector("[data-req]");
      const capEl = root.querySelector("[data-cap]");
      const errEl = root.querySelector("[data-err]");
      const serversInput = root.querySelector("[data-servers]");
      const serversLabel = root.querySelector("[data-servers-label]");
      const cacheInput = root.querySelector("[data-cache]");
      const costEl = root.querySelector("[data-cost]");
      const runBtn = root.querySelector("[data-cloud-run]");
      const resetBtn = root.querySelector("[data-cloud-reset]");

      const local = {
        servers: 2,
        cache: false,
        running: false,
        locked: false,
        tested: false,
        errors: 0,
        raf: null,
        finishTimer: null,
        cancelled: false,
      };

      const reduced = api.reduced;
      const capacity = () => local.servers * SERVER_CAPACITY;
      const effectiveDemand = () => TOTAL_REQUESTS * (local.cache ? CACHE_FACTOR : 1);
      const cost = () => local.servers * SERVER_COST + (local.cache ? CACHE_COST : 0);
      const potentialErrors = () => Math.max(0, Math.ceil(effectiveDemand() - capacity()));

      const setReadout = (demand, cap, errors) => {
        reqEl.textContent = String(Math.round(demand));
        capEl.textContent = String(cap);
        errEl.textContent = String(errors);
      };

      const renderRacks = () => {
        racks.forEach((rack, index) => {
          rack.classList.toggle("is-off", index >= local.servers);
          rack.classList.toggle("is-hot", local.running && index < local.servers);
        });
      };

      const drawChart = (progress, demand, cap, errors, idle) => {
        const width = chart.clientWidth || 320;
        const height = chart.clientHeight || 104;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        chart.width = Math.round(width * dpr);
        chart.height = Math.round(height * dpr);
        const ctx = chart.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const pad = 8;
        const max = Math.max(TOTAL_REQUESTS, cap, demand, 1);
        const x = (value) => pad + (value / max) * (width - pad * 2);
        const y = (value) => height - pad - (value / max) * (height - pad * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i += 1) {
          const gy = pad + ((height - pad * 2) / 3) * i;
          ctx.beginPath();
          ctx.moveTo(pad, gy);
          ctx.lineTo(width - pad, gy);
          ctx.stroke();
        }
        const lineY = y(cap);
        ctx.strokeStyle = "rgba(177,140,255,0.7)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pad, lineY);
        ctx.lineTo(width - pad, lineY);
        ctx.stroke();
        ctx.setLineDash([]);
        const points = [];
        const steps = 48;
        for (let i = 0; i <= steps; i += 1) {
          const value = demand * ((i / steps) * progress);
          points.push({ x: x(value), y: y(value), value });
        }
        if (!idle) {
          ctx.fillStyle = "rgba(255,120,120,0.16)";
          points.forEach((point) => {
            if (point.value > cap) ctx.fillRect(point.x, y(point.value), Math.max(1, (width - pad * 2) / steps), y(cap) - y(point.value));
          });
        }
        ctx.strokeStyle = idle ? "rgba(111,195,255,0.35)" : "rgba(111,195,255,0.95)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.fillStyle = idle ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.55)";
        ctx.font = '9px "SFMono-Regular", Consolas, monospace';
        ctx.fillText("请求", pad + 2, pad + 10);
        ctx.fillText("容量", pad + 2, lineY - 4);
        if (errors > 0 && !idle) {
          ctx.fillStyle = "rgba(255,140,140,0.9)";
          ctx.textAlign = "right";
          ctx.fillText(`${errors} TIMEOUT`, width - pad, pad + 10);
          ctx.textAlign = "left";
        }
      };

      const updateIdle = () => {
        serversLabel.textContent = String(local.servers);
        costEl.textContent = `$${cost()}`;
        const demand = effectiveDemand();
        const cap = capacity();
        const errors = potentialErrors();
        setReadout(demand, cap, errors);
        renderRacks();
        if (!local.tested && !local.locked) {
          phone.classList.remove("is-live");
          phoneStatus.textContent = "STANDBY";
        }
        drawChart(1, demand, cap, errors, true);
      };

      const setBusy = (busy) => {
        serversInput.disabled = busy;
        cacheInput.disabled = busy;
        runBtn.disabled = busy;
        resetBtn.disabled = busy;
      };

      const finish = (errors) => {
        local.running = false;
        local.tested = true;
        local.errors = errors;
        renderRacks();
        if (errors < 10) {
          local.locked = true;
          setBusy(true);
          phone.classList.add("is-live");
          phoneStatus.textContent = "LIVE";
          CTM.audio.scaleUp();
          const systems = Math.min(15, 8 + (local.cache ? 4 : 0) + (local.servers >= 3 ? 3 : 0));
          const direction = Math.min(10, 5 + (cost() <= 7 ? 5 : 0));
          const score = { systems, direction };
          local.finishTimer = setTimeout(
            () =>
              !local.cancelled &&
              api.complete(score, { servers: local.servers, cache: local.cache, cost: cost(), errors }, { continueLabel: "前往 2026 →" }),
            900
          );
          return;
        }
        phoneStatus.textContent = "TIMEOUT";
        api.toast(`有 ${errors} 个请求超时。${local.cache ? "再加一台服务器。" : "试试开缓存，或者再加一台服务器。"}`);
        if (!local.cheated) {
          local.cheated = true;
          api.cheat("容量和预算本来就不该心算。可以让 Agent 替你配一套。");
        }
        CTM.audio.error();
        setBusy(false);
      };

      const runTest = () => {
        if (local.running || local.locked) return;
        local.running = true;
        local.tested = false;
        setBusy(true);
        runBtn.textContent = "压测中…";
        phoneStatus.textContent = "DEPLOYING";
        CTM.audio.fan();
        const demand = effectiveDemand();
        const cap = capacity();
        const errors = potentialErrors();
        const duration = reduced ? 250 : 4800;
        const start = performance.now();
        const frame = (now) => {
          if (local.cancelled) return;
          const progress = Math.min(1, (now - start) / duration);
          const currentDemand = demand * progress;
          const currentErrors = Math.min(errors, Math.ceil(Math.max(0, currentDemand - cap)));
          setReadout(currentDemand, cap, currentErrors);
          drawChart(progress, demand, cap, errors, false);
          renderRacks();
          if (progress < 1) local.raf = requestAnimationFrame(frame);
          else {
            setReadout(demand, cap, errors);
            drawChart(1, demand, cap, errors, false);
            runBtn.textContent = errors < 10 ? "已上线" : "再试一次";
            finish(errors);
          }
        };
        local.raf = requestAnimationFrame(frame);
      };

      const onServersInput = () => {
        if (local.running || local.locked) return;
        local.servers = Number(serversInput.value);
        updateIdle();
      };

      const onCacheChange = () => {
        if (local.running || local.locked) return;
        local.cache = cacheInput.checked;
        updateIdle();
      };

      const onReset = () => {
        if (local.running || local.locked) return;
        local.servers = 2;
        local.cache = false;
        local.tested = false;
        local.errors = 0;
        serversInput.value = "2";
        cacheInput.checked = false;
        runBtn.textContent = "开始压测";
        phone.classList.remove("is-live");
        updateIdle();
        api.toast("配置已重置。");
        CTM.audio.click();
      };

      serversInput.addEventListener("input", onServersInput);
      cacheInput.addEventListener("change", onCacheChange);
      runBtn.addEventListener("click", runTest);
      resetBtn.addEventListener("click", onReset);
      window.addEventListener("resize", updateIdle);

      updateIdle();

      return () => {
        local.cancelled = true;
        if (local.raf) cancelAnimationFrame(local.raf);
        if (local.finishTimer) clearTimeout(local.finishTimer);
        serversInput.removeEventListener("input", onServersInput);
        cacheInput.removeEventListener("change", onCacheChange);
        runBtn.removeEventListener("click", runTest);
        resetBtn.removeEventListener("click", onReset);
        window.removeEventListener("resize", updateIdle);
      };
    },
  });
})(window.CTM = window.CTM || {});
