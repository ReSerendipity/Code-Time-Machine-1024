(function (CTM) {
  "use strict";

  const $ = CTM.$;
  const sleep = CTM.utils.sleep;

  const runner = { cancelled: false };

  function ensureCursor() {
    let cursor = document.getElementById("agent-cursor");
    if (cursor) return cursor;
    cursor = document.createElement("div");
    cursor.id = "agent-cursor";
    cursor.className = "agent-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="ac-ring"></span><span class="ac-tag">AGENT</span>';
    document.body.appendChild(cursor);
    return cursor;
  }

  function hideCursor() {
    const cursor = document.getElementById("agent-cursor");
    if (cursor) cursor.classList.remove("is-on");
  }

  async function moveTo(el) {
    if (!el) return;
    const cursor = ensureCursor();
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    cursor.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    cursor.classList.add("is-on");
    await sleep(150);
  }

  async function tap(el) {
    if (!el || el.disabled) return false;
    await moveTo(el);
    if (runner.cancelled) return false;
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    await sleep(120);
    return true;
  }

  async function type(el, value) {
    if (!el) return;
    await moveTo(el);
    el.focus();
    let shown = "";
    const chars = Array.from(value);
    for (let index = 0; index < chars.length; index += 1) {
      if (runner.cancelled) return;
      shown += chars[index];
      el.value = shown;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      if (index % 3 === 0) await sleep(18);
    }
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(160);
  }

  async function slide(el, value) {
    if (!el) return;
    await moveTo(el);
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(140);
  }

  const SCRIPTS = {
    async punch() {
      await tap($("[data-reset]"));
      const code = ($("[data-target-code]") || {}).textContent || "00010";
      const holes = Array.from(document.querySelectorAll(".hole"));
      for (let column = 0; column < 5; column += 1) {
        const bit = code[column] === "1" ? "1" : "0";
        await tap(holes.find((hole) => hole.dataset.col === String(column) && hole.dataset.bit === bit));
      }
      await tap($("[data-read]"));
    },
    async register() {
      await tap($("[data-reset]"));
      for (const id of ["loadA", "loadB", "add", "out"]) {
        await tap(document.querySelector(`[data-instr="${id}"]`));
      }
      await tap($("[data-run]"));
    },
    async unix() {
      await tap($("[data-reset]"));
      for (const cmd of ["grep ERROR", "grep 500", "wc -l"]) {
        await tap(document.querySelector(`[data-cmd="${cmd}"]`));
      }
      await tap($("[data-run]"));
    },
    async web() {
      await tap($("[data-web-reset]"));
      for (const block of ["title", "bio", "link", "counter"]) {
        await tap(document.querySelector(`[data-block="${block}"]`));
      }
      await tap($("[data-publish]"));
    },
    async cloud() {
      await tap($("[data-cloud-reset]"));
      await slide($("[data-servers]"), 3);
      const cache = $("[data-cache]");
      if (cache && !cache.checked) await tap(cache.closest(".switch-row") || cache);
      await tap($("[data-cloud-run]"));
    },
    async ai() {
      const prompt = `帮 ${CTM.state.traveler || CTM.DEFAULT_TRAVELER} 把这六站的体验做成一个 1024 之前能上线的分享小工具`;
      await type($("[data-prompt]"), prompt);
      await tap($("[data-generate]"));
      await sleep(400);
      await tap($("[data-adopt]"));
    },
  };

  async function solveEra(era) {
    const script = SCRIPTS[era.id];
    if (!script) return;
    await script();
  }

  function banner(on) {
    const el = document.getElementById("agent-banner");
    if (!el) return;
    el.hidden = !on;
    if (!on) hideCursor();
  }

  async function takeover(startIndex, hooks) {
    runner.cancelled = false;
    CTM.agent.mode = "takeover";
    banner(true);
    CTM.audio.glitch();
    for (let index = startIndex; index < CTM.eras.length; index += 1) {
      if (runner.cancelled) break;
      await hooks.enter(index);
      if (runner.cancelled) break;
      await solveEra(CTM.eras[index]);
      await hooks.waitForStamp(index);
      if (runner.cancelled) break;
      await sleep(420);
      await hooks.advance(index);
    }
    banner(false);
    const cancelled = runner.cancelled;
    runner.cancelled = false;
    if (CTM.agent.mode === "takeover") CTM.agent.mode = "idle";
    return cancelled;
  }

  async function assistCurrent(index) {
    runner.cancelled = false;
    CTM.agent.mode = "assist";
    CTM.audio.glitch();
    await solveEra(CTM.eras[index]);
  }

  CTM.agent = {
    mode: "idle",
    takeover,
    assistCurrent,
    cancel() {
      runner.cancelled = true;
      CTM.agent.mode = "idle";
      banner(false);
    },
  };
})(window.CTM = window.CTM || {});
