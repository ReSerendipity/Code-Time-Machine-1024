(function (CTM) {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const prefersReduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const escapeHtml = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const base64Encode = (str) => {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  const base64Decode = (str) => {
    let normalized = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const encodeShare = (payload) => base64Encode(JSON.stringify(payload));
  const decodeShare = (value) => {
    try {
      const parsed = JSON.parse(base64Decode(value));
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      return null;
    }
  };

  const formatDuration = (start, end) => {
    if (!start) return "—";
    const totalSeconds = Math.max(0, Math.round(((end || Date.now()) - start) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const initialScores = () => ({ manual: 0, systems: 0, expression: 0, direction: 0 });

  const state = {
    traveler: "",
    eraIndex: 0,
    stamps: [],
    scores: initialScores(),
    eraScores: [null, null, null, null, null, null],
    choices: {},
    ai: null,
    sound: true,
    started: false,
    completed: false,
    startedAt: null,
    finishedAt: null,
    shared: false,
  };

  CTM.$ = $;
  CTM.$$ = $$;
  CTM.state = state;
  CTM.eras = CTM.eras || [];
  CTM.utils = {
    clamp,
    sleep,
    prefersReduced,
    escapeHtml,
    base64Encode,
    base64Decode,
    encodeShare,
    decodeShare,
    formatDuration,
  };

  CTM.icons = {
    punch:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1" fill="currentColor" stroke="none"/></svg>',
    register:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/></svg>',
    unix:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6l5 5-5 5"/><path d="M11 17h9"/></svg>',
    web:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18"/><circle cx="6" cy="6" r=".7" fill="currentColor" stroke="none"/><circle cx="8.5" cy="6" r=".7" fill="currentColor" stroke="none"/><circle cx="11" cy="6" r=".7" fill="currentColor" stroke="none"/></svg>',
    cloud:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.3 9.1 4.5 4.5 0 0 1 17 18H7z"/><path d="M12 12v5M9.8 14.2 12 12l2.2 2.2"/></svg>',
    ai:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="2.5"/></svg>',
  };

  const STORAGE_KEY = "ctm-1024-v1";

  CTM.storage = {
    save() {
      try {
        const payload = {
          v: 2,
          traveler: state.traveler,
          eraIndex: state.eraIndex,
          stamps: state.stamps,
          scores: state.scores,
          eraScores: state.eraScores,
          choices: state.choices,
          ai: state.ai,
          sound: state.sound,
          started: state.started,
          completed: state.completed,
          startedAt: state.startedAt,
          finishedAt: state.finishedAt,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        /* storage can be unavailable in private mode */
      }
    },
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (error) {
        return null;
      }
    },
    clear() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* ignore */
      }
    },
  };

  const ui = {
    showScreen(name) {
      $$(".screen").forEach((screen) => screen.classList.remove("is-active"));
      const target = document.getElementById(`screen-${name}`);
      if (target) target.classList.add("is-active");

      document.body.classList.toggle("is-landing", name === "landing");
      document.body.classList.toggle("is-era", name === "era");
      document.body.classList.toggle("is-result", name === "result");
      document.body.classList.toggle("is-future", name === "future");

      const passport = $("#passport");
      if (passport) passport.hidden = name !== "era";
      const topProgress = $("#top-progress");
      if (topProgress) topProgress.hidden = name !== "era";

      window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
    },

    setTheme(theme) {
      document.body.dataset.era = theme || "landing";
    },

    toast(message, duration) {
      const el = $("#toast");
      if (!el) return;
      el.textContent = message;
      el.classList.add("is-visible");
      clearTimeout(ui._toastTimer);
      ui._toastTimer = setTimeout(() => el.classList.remove("is-visible"), duration || 2400);
    },

    modal(html, options) {
      const opts = options || {};
      const root = $("#modal-root");
      if (!root) return function noop() {};
      root.innerHTML = `<div class="modal-backdrop"></div><div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</div>`;
      root.hidden = false;

      const close = () => ui.closeModal();
      const backdrop = $(".modal-backdrop", root);
      if (opts.dismissible !== false && backdrop) {
        backdrop.addEventListener("click", close);
      }
      $$("[data-modal-close]", root).forEach((button) => {
        button.addEventListener("click", close);
      });

      const onKey = (event) => {
        if (event.key === "Escape" && opts.dismissible !== false) close();
      };
      document.addEventListener("keydown", onKey);
      ui._modalKeyHandler = onKey;

      if (typeof opts.onMount === "function") {
        opts.onMount($(".modal-card", root), close);
      }

      const focusTarget = root.querySelector("button, [href], input, textarea, select");
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 60);
      }
      return close;
    },

    closeModal() {
      const root = $("#modal-root");
      if (!root) return;
      root.hidden = true;
      root.innerHTML = "";
      if (ui._modalKeyHandler) {
        document.removeEventListener("keydown", ui._modalKeyHandler);
        ui._modalKeyHandler = null;
      }
    },

    updatePassport() {
      const track = $("#passport-track");
      if (!track) return;
      track.innerHTML = CTM.eras
        .map((era, index) => {
          const done = state.stamps.includes(index);
          const current = !state.completed && index === state.eraIndex;
          return `<div class="p-stamp ${done ? "is-done" : ""} ${current ? "is-current" : ""}" title="${escapeHtml(
            era.label
          )} · ${era.year}" aria-label="${escapeHtml(era.label)} ${era.year}${done ? "，已完成" : ""}">
            <span class="p-icon">${CTM.icons[era.icon] || ""}</span>
            <span class="p-meta">
              <span class="p-year">${era.year}</span>
              <span class="p-label">${escapeHtml(era.label)}</span>
            </span>
          </div>`;
        })
        .join("");

      const topProgress = $("#top-progress");
      if (topProgress) {
        const total = CTM.eras.length || 6;
        const current = state.completed ? total : Math.min(state.eraIndex + 1, total);
        topProgress.innerHTML = `<span class="tp-count">${String(current).padStart(2, "0")} / ${String(
          total
        ).padStart(2, "0")}</span><span class="tp-bar"><i style="width:${
          (current / total) * 100
        }%"></i></span>`;
      }
    },

    addScore(score) {
      Object.keys(state.scores).forEach((key) => {
        state.scores[key] += Number(score && score[key]) || 0;
      });
    },

    recordEra(index, score, choice) {
      if (state.stamps.includes(index)) return false;
      state.stamps.push(index);
      state.eraScores[index] = Object.assign(initialScores(), score || {});
      ui.addScore(score || {});
      state.choices[index] = choice || null;
      CTM.storage.save();
      ui.updatePassport();
      return true;
    },

    resetState() {
      state.traveler = "";
      state.eraIndex = 0;
      state.stamps = [];
      state.scores = initialScores();
      state.eraScores = [null, null, null, null, null, null];
      state.choices = {};
      state.ai = null;
      state.started = false;
      state.completed = false;
      state.startedAt = null;
      state.finishedAt = null;
      state.shared = false;
    },
  };

  CTM.ui = ui;
})(window.CTM = window.CTM || {});
