(function (CTM) {
  "use strict";

  let ctx = null;
  let master = null;

  const audio = {
    enabled: false,

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
        master.gain.value = 0.55;
        master.connect(ctx.destination);
      } catch (error) {
        ctx = null;
        master = null;
      }
    },

    restore(enabled) {
      audio.enabled = Boolean(enabled);
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
        if (slideTo) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
        }
        const level = Math.max(0.0001, volume == null ? 0.04 : volume);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(start + duration + 0.03);
      } catch (error) {
        /* audio is best effort */
      }
    },

    click() {
      audio.tone(420, 0.05, "square", 0.018);
    },

    beep() {
      audio.tone(880, 0.08, "sine", 0.025);
    },

    punch() {
      audio.tone(92, 0.09, "square", 0.055);
      audio.tone(170, 0.045, "triangle", 0.025, 0.01);
    },

    error() {
      audio.tone(150, 0.16, "sawtooth", 0.035);
      audio.tone(110, 0.18, "sawtooth", 0.03, 0.09);
    },

    success() {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        audio.tone(frequency, 0.2, "sine", 0.035, index * 0.075);
      });
    },

    chime() {
      audio.tone(1046.5, 0.18, "sine", 0.03);
      audio.tone(1568, 0.16, "sine", 0.018, 0.05);
    },

    warp() {
      audio.tone(180, 0.9, "sawtooth", 0.022, 0, 48);
      audio.tone(900, 0.55, "sine", 0.012, 0.05, 180);
    },

    modem() {
      [420, 760, 1120, 640, 980, 1320].forEach((frequency, index) => {
        audio.tone(frequency, 0.07, "square", 0.018, index * 0.08);
      });
    },

    glitch() {
      audio.tone(240, 0.05, "square", 0.02);
      audio.tone(120, 0.05, "square", 0.02, 0.06);
    },
  };

  CTM.audio = audio;
})(window.CTM = window.CTM || {});
