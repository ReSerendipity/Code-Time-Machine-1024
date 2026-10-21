(function (CTM) {
  "use strict";

  let ctx = null;
  let master = null;
  let noiseBuffer = null;

  const audio = {
    enabled: true,

    get ctxState() {
      return ctx ? ctx.state : "idle";
    },

    init() {
      if (ctx) {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        ctx = new AudioCtx();
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
        const length = Math.floor(ctx.sampleRate * 1.2);
        noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      } catch (error) {
        ctx = null;
        master = null;
      }
    },

    restore(enabled) {
      audio.enabled = enabled !== false;
      audio.updateButtons();
    },

    setEnabled(enabled) {
      audio.enabled = Boolean(enabled);
      if (audio.enabled) {
        audio.init();
        audio.beep();
      }
      audio.updateButtons();
      if (CTM.state) {
        CTM.state.sound = audio.enabled;
        if (CTM.storage) CTM.storage.save();
      }
    },

    toggle() {
      audio.setEnabled(!audio.enabled);
    },

    updateButtons() {
      const label = audio.enabled ? "声音：开" : "声音：关";
      ["sound-toggle", "sound-toggle-2"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute("aria-pressed", String(audio.enabled));
        el.setAttribute("aria-label", audio.enabled ? "关闭音效" : "开启音效");
        const text = el.querySelector(".sound-label");
        if (text) text.textContent = label;
        if (id === "sound-toggle-2") el.textContent = label;
      });
    },

    tone(frequency, duration, type, volume, delay, slideTo) {
      if (!audio.enabled) return;
      if (!ctx) audio.init();
      if (!ctx || !master) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      try {
        const start = ctx.currentTime + (delay || 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(Math.max(20, frequency), start);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
        const level = Math.max(0.0001, volume == null ? 0.12 : volume);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + duration + 0.03);
      } catch (error) {
        /* audio is best effort */
      }
    },

    noise(duration, volume, delay, filterFrequency, filterType, sweepTo) {
      if (!audio.enabled) return;
      if (!ctx) audio.init();
      if (!ctx || !master || !noiseBuffer) return;
      try {
        const start = ctx.currentTime + (delay || 0);
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType || "bandpass";
        filter.frequency.setValueAtTime(filterFrequency || 1200, start);
        if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
        filter.Q.value = 0.9;
        const gain = ctx.createGain();
        const level = Math.max(0.0001, volume == null ? 0.12 : volume);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        source.start(start);
        source.stop(start + duration + 0.03);
      } catch (error) {
        /* audio is best effort */
      }
    },

    click() {
      audio.tone(520, 0.05, "square", 0.05);
    },

    beep() {
      audio.tone(920, 0.09, "sine", 0.08);
    },

    /* 倒计时最后 30 秒的挂钟滴答 */
    tick() {
      audio.tone(1180, 0.035, "square", 0.07);
      audio.tone(760, 0.05, "square", 0.05, 0.06);
    },

    /* ---- 结尾动画的音景：一条贯穿全片的 riser + 每个时代的声音标记 ---- */
    finaleStart(duration) {
      if (!audio.enabled) return;
      if (!ctx) audio.init();
      if (!ctx || !master || !noiseBuffer) return;
      audio.finaleStop();
      const start = ctx.currentTime;
      try {
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.Q.value = 1.2;
        band.frequency.setValueAtTime(170, start);
        band.frequency.exponentialRampToValueAtTime(2800, start + duration * 0.94);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + duration * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.085, start + duration * 0.9);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.97);
        source.connect(band);
        band.connect(gain);
        gain.connect(master);
        source.start(start);
        source.stop(start + duration);

        const sub = ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.setValueAtTime(37, start);
        sub.frequency.linearRampToValueAtTime(56, start + duration * 0.9);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.0001, start);
        subGain.gain.exponentialRampToValueAtTime(0.055, start + duration * 0.85);
        subGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.96);
        sub.connect(subGain);
        subGain.connect(master);
        sub.start(start);
        sub.stop(start + duration);

        audio.finaleNodes = [source, sub];
      } catch (error) {
        audio.finaleNodes = [];
      }
    },

    finaleStop() {
      (audio.finaleNodes || []).forEach((node) => {
        try {
          node.stop();
        } catch (error) {
          /* already stopped */
        }
      });
      audio.finaleNodes = [];
    },

    heartbeat() {
      audio.tone(58, 0.18, "sine", 0.22);
      audio.tone(46, 0.24, "sine", 0.16, 0.24);
    },

    impact() {
      audio.noise(0.7, 0.2, 0, 1400, "lowpass", 110);
      audio.tone(44, 1.2, "sine", 0.22);
      audio.tone(880, 0.6, "triangle", 0.045, 0.02);
      audio.tone(1320, 0.5, "sine", 0.03, 0.06);
    },

    sceneHit(name) {
      if (!audio.enabled) return;
      switch (name) {
        case "paperRustle":
          audio.noise(0.55, 0.05, 0, 1800, "bandpass", 900);
          audio.noise(0.35, 0.035, 0.2, 3400, "highpass");
          audio.tone(70, 0.35, "triangle", 0.05);
          break;
        case "copperHum":
          audio.tone(118, 1.2, "sawtooth", 0.03);
          audio.tone(59, 1.4, "sine", 0.05);
          audio.relay();
          break;
        case "phosphor":
          audio.teletype();
          audio.noise(0.9, 0.018, 0.1, 5200, "highpass");
          break;
        case "datastream":
          audio.modem();
          audio.noise(0.6, 0.025, 0.25, 2400, "bandpass", 5400);
          break;
        case "fanArray":
          audio.fan();
          audio.noise(1.1, 0.03, 0, 380, "lowpass");
          break;
        case "aiShimmer":
          audio.generate();
          audio.tone(880, 0.55, "sine", 0.028, 0.05, 1320);
          break;
        case "impact":
          audio.impact();
          break;
        default:
          break;
      }
    },

    /* 1804 打孔卡：机械打孔 + 织机 */
    punch() {
      audio.noise(0.05, 0.22, 0, 2600, "highpass");
      audio.tone(82, 0.12, "square", 0.16);
      audio.tone(180, 0.05, "triangle", 0.07, 0.01);
    },

    loom() {
      audio.noise(0.7, 0.08, 0, 900, "bandpass", 320);
      [220, 277, 330].forEach((f, i) => audio.tone(f, 0.18, "triangle", 0.05, i * 0.12));
    },

    /* 1945 寄存器：继电器 + CRT */
    relay() {
      audio.noise(0.03, 0.16, 0, 3200, "highpass");
      audio.tone(140, 0.04, "square", 0.07);
    },

    crtHum() {
      audio.tone(120, 0.5, "sawtooth", 0.025);
    },

    /* 1972 Unix：电传打字机 */
    teletype() {
      for (let i = 0; i < 7; i += 1) {
        audio.noise(0.025, 0.14, i * 0.045, 2400 + Math.random() * 1200, "highpass");
      }
    },

    /* 1991 Web：拨号握手 */
    modem() {
      [420, 760, 1120, 640, 980, 1320, 180, 240].forEach((frequency, index) => {
        audio.tone(frequency, 0.12, "square", 0.05, index * 0.11);
      });
      audio.noise(0.5, 0.05, 0.9, 1800, "bandpass", 600);
    },

    /* 2007 云：服务器风扇 + 上线 */
    fan() {
      audio.noise(1.2, 0.06, 0, 420, "lowpass", 900);
      audio.tone(70, 1.2, "sawtooth", 0.03);
    },

    scaleUp() {
      [330, 440, 550, 660, 880].forEach((f, i) => audio.tone(f, 0.16, "triangle", 0.07, i * 0.09));
    },

    /* 2026 AI：生成 */
    generate() {
      audio.noise(0.9, 0.07, 0, 300, "bandpass", 4200);
      [392, 523, 659, 784, 1046].forEach((f, i) => audio.tone(f, 0.22, "sine", 0.06, i * 0.1));
    },

    stamp() {
      audio.noise(0.08, 0.2, 0, 1500, "lowpass");
      audio.tone(110, 0.14, "square", 0.12);
    },

    warp() {
      audio.noise(0.9, 0.1, 0, 200, "lowpass", 3200);
      audio.tone(180, 0.9, "sawtooth", 0.05, 0, 48);
      audio.tone(900, 0.55, "sine", 0.03, 0.05, 180);
    },

    error() {
      audio.tone(160, 0.16, "sawtooth", 0.09);
      audio.tone(110, 0.2, "sawtooth", 0.08, 0.1);
    },

    success() {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        audio.tone(frequency, 0.24, "sine", 0.09, index * 0.08);
        audio.tone(frequency * 2, 0.18, "triangle", 0.03, index * 0.08);
      });
    },

    chime() {
      audio.tone(1046.5, 0.22, "sine", 0.07);
      audio.tone(1568, 0.2, "sine", 0.04, 0.06);
    },

    glitch() {
      audio.tone(240, 0.05, "square", 0.05);
      audio.noise(0.05, 0.08, 0.05, 3000, "highpass");
    },
  };

  CTM.audio = audio;
})(window.CTM = window.CTM || {});
