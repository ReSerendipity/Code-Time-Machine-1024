(function (CTM) {
  "use strict";

  const BLOCKS = [
    { id: "title", label: "标题", required: true },
    { id: "bio", label: "简介", required: true },
    { id: "link", label: "链接", required: true },
    { id: "counter", label: "访客计数器", required: true },
    { id: "guestbook", label: "留言簿", required: false },
    { id: "marquee", label: "跑马灯", required: false },
  ];

  const BACKGROUNDS = [
    { id: "stars", label: "星空" },
    { id: "clouds", label: "云朵" },
    { id: "checker", label: "棋盘" },
  ];

  CTM.eras.push({
    id: "web",
    label: "Web",
    year: 1991,
    theme: "web",
    icon: "web",
    place: "CERN · 一台 NeXT 工作站",
    intro: "世界刚刚学会互相链接。你有一个空白的页面，和一点点想被看见的冲动。",
    task: "拼出你的第一个个人主页",
    taskDesc: "添加标题、简介、链接和访客计数器，选一个背景，然后发布。留言簿和跑马灯是加分项。",
    sources: [
      "1989 年，Tim Berners-Lee 在 CERN 提出 World Wide Web 的构想；1991 年，第一个网站在 CERN 上线。",
      "早期的个人主页常见访客计数器、留言簿、Under Construction 图标和跑马灯，它们构成了 Web 的少年时代。",
      "2007 年 iPhone 发布后，Web 从桌面走进每个人的口袋，移动端成为新的默认。",
    ],
    sceneHtml: `<div class="web-scene">
      <div class="browser-window">
        <div class="browser-bar">
          <span class="browser-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="browser-title" data-browser-title>Netscape Navigator - Untitled</span>
        </div>
        <div class="browser-page bg-stars" data-preview></div>
      </div>
    </div>`,
    panelHtml: `<div class="control-label">页面模块 / 点击添加</div>
      <div class="web-blocks" data-blocks>${BLOCKS.map(
        (block) =>
          `<button class="block-chip" type="button" data-block="${block.id}" aria-pressed="false">${block.label}${
            block.required ? '<span class="req"> *</span>' : ""
          }</button>`
      ).join("")}</div>
      <div class="web-fields">
        <div class="field">
          <label for="web-title-input">标题</label>
          <input id="web-title-input" type="text" maxlength="36" value="我的第一个主页" data-title>
        </div>
        <div class="field">
          <label for="web-bio-input">简介</label>
          <textarea id="web-bio-input" maxlength="90" data-bio>你好，世界。我正在 Build 一点小东西。</textarea>
        </div>
        <div class="field">
          <label for="web-link-input">链接</label>
          <input id="web-link-input" type="text" maxlength="50" value="https://example.com" data-link>
        </div>
      </div>
      <div class="control-label">背景</div>
      <div class="bg-picker" data-bg-picker>${BACKGROUNDS.map(
        (bg) =>
          `<button class="bg-swatch ${bg.id} ${bg.id === "stars" ? "is-on" : ""}" type="button" data-bg="${bg.id}" aria-label="${bg.label}" aria-pressed="${bg.id === "stars"}"></button>`
      ).join("")}</div>
      <div class="btn-row">
        <button class="btn btn-primary" type="button" data-publish disabled>发布</button>
        <button class="btn btn-quiet" type="button" data-web-reset>清空</button>
      </div>
      <p class="hint-text">发布需要：标题、简介、链接、访客计数器。带 * 的模块是必选。</p>`,
    mount(scene, panel, api) {
      const previewEl = scene.querySelector("[data-preview]");
      const browserTitleEl = scene.querySelector("[data-browser-title]");
      const blocksEl = panel.querySelector("[data-blocks]");
      const bgPickerEl = panel.querySelector("[data-bg-picker]");
      const titleInput = panel.querySelector("[data-title]");
      const bioInput = panel.querySelector("[data-bio]");
      const linkInput = panel.querySelector("[data-link]");
      const publishBtn = panel.querySelector("[data-publish]");
      const resetBtn = panel.querySelector("[data-web-reset]");
      const blockButtons = Array.from(blocksEl.querySelectorAll("[data-block]"));
      const bgButtons = Array.from(bgPickerEl.querySelectorAll("[data-bg]"));

      const defaultBio = `你好，世界。我是 ${CTM.state.traveler || "匿名 Builder"}，正在 Build 一点小东西。`;

      const local = {
        blocks: new Set(),
        title: "我的第一个主页",
        bio: defaultBio,
        link: "https://example.com",
        bg: "stars",
        published: false,
        locked: false,
      };

      bioInput.value = defaultBio;

      const requiredReady = () =>
        ["title", "bio", "link", "counter"].every((id) => local.blocks.has(id)) &&
        local.title.trim() &&
        local.bio.trim() &&
        local.link.trim();

      const updatePublishState = () => {
        publishBtn.disabled = local.locked || !requiredReady();
      };

      const renderPreview = () => {
        const title = CTM.utils.escapeHtml(local.title || "未命名主页");
        const bio = CTM.utils.escapeHtml(local.bio || "这里还没有简介。");
        const link = CTM.utils.escapeHtml(local.link || "https://example.com");
        const hits = local.published ? "0001024" : "0000000";
        const parts = [];

        if (local.published) {
          parts.push('<div class="published-banner">WELCOME TO MY HOMEPAGE!</div>');
        }
        if (local.blocks.has("title")) {
          parts.push(`<h1 class="web-title">${title}</h1>`);
        }
        if (local.blocks.has("marquee")) {
          parts.push('<div class="web-marquee"><span>Welcome to my homepage! 本站正在建设中，欢迎常来。</span></div>');
        }
        if (local.blocks.has("bio")) {
          parts.push(`<p class="web-bio">${bio}</p>`);
        }
        if (local.blocks.has("link")) {
          parts.push(`<a class="web-link" href="#" data-web-link>${link}</a>`);
        }
        if (local.blocks.has("counter")) {
          parts.push(`<div class="hit-counter">VISITORS <b data-hits>${hits}</b></div>`);
        }
        if (local.blocks.has("guestbook")) {
          parts.push('<button class="web-guestbook" type="button" data-guestbook>留言簿</button>');
        }
        if (!local.blocks.size) {
          parts.push('<div class="web-empty">空白页面。<br>从右边添加一个标题开始。</div>');
        }
        parts.push(
          `<div class="construction ${local.published ? "is-hidden" : ""}" aria-hidden="${local.published}">UNDER CONSTRUCTION</div>`
        );

        previewEl.className = `browser-page bg-${local.bg}`;
        previewEl.innerHTML = parts.join("");
        browserTitleEl.textContent = `Netscape Navigator - ${local.title || "Untitled"}`;
        updatePublishState();
      };

      const renderControls = () => {
        blockButtons.forEach((button) => {
          const on = local.blocks.has(button.dataset.block);
          button.classList.toggle("is-on", on);
          button.setAttribute("aria-pressed", String(on));
        });
        bgButtons.forEach((button) => {
          const on = button.dataset.bg === local.bg;
          button.classList.toggle("is-on", on);
          button.setAttribute("aria-pressed", String(on));
        });
        updatePublishState();
      };

      const setBusy = (busy) => {
        blockButtons.forEach((button) => {
          button.disabled = busy;
        });
        bgButtons.forEach((button) => {
          button.disabled = busy;
        });
        titleInput.disabled = busy;
        bioInput.disabled = busy;
        linkInput.disabled = busy;
        resetBtn.disabled = busy;
        publishBtn.disabled = busy || !requiredReady();
      };

      const onBlockClick = (event) => {
        const button = event.target.closest("[data-block]");
        if (!button || local.locked) return;
        const id = button.dataset.block;
        if (local.blocks.has(id)) {
          local.blocks.delete(id);
        } else {
          local.blocks.add(id);
        }
        renderPreview();
        renderControls();
        CTM.audio.click();
        api.feedback(
          `已${local.blocks.has(id) ? "添加" : "移除"}「${button.textContent.replace("*", "").trim()}」。`,
          ""
        );
      };

      const onInput = () => {
        if (local.locked) return;
        local.title = titleInput.value;
        local.bio = bioInput.value;
        local.link = linkInput.value;
        renderPreview();
        updatePublishState();
      };

      const onBgClick = (event) => {
        const button = event.target.closest("[data-bg]");
        if (!button || local.locked) return;
        local.bg = button.dataset.bg;
        renderPreview();
        renderControls();
        CTM.audio.click();
      };

      const onPreviewClick = (event) => {
        if (event.target.closest("[data-web-link]")) {
          event.preventDefault();
          api.toast("这是你的主页链接。1991 年的人会把它抄在名片上。");
          CTM.audio.beep();
          return;
        }
        if (event.target.closest("[data-guestbook]")) {
          api.toast("留言簿收到 1 条留言：「这个主页很有 90 年代的味道。」");
          CTM.audio.modem();
        }
      };

      const onPublish = () => {
        if (local.locked) return;
        if (!requiredReady()) {
          api.feedback("还差模块或内容。发布需要标题、简介、链接和访客计数器。", "error");
          CTM.audio.error();
          return;
        }
        local.locked = true;
        local.published = true;
        setBusy(true);
        renderPreview();
        CTM.audio.modem();
        api.feedback("正在发布到 1991 年的 Web……", "");

        setTimeout(() => {
          renderPreview();
          api.feedback("发布成功。你的主页有了第一个访客。", "ok");
        }, 700);

        const optionalPoints =
          (local.blocks.has("guestbook") ? 3 : 0) +
          (local.blocks.has("marquee") ? 2 : 0) +
          (local.bio.trim().length > 20 ? 2 : 0) +
          (local.bg !== "stars" ? 1 : 0);
        const score = {
          expression: Math.min(20, 12 + optionalPoints),
          manual: 5,
        };
        const successHtml = `你的主页在 1991 年的 Web 上发布了。你是第 <b>1024</b> 位访客，也是第一位作者。${optionalPoints > 0 ? "还加了几个很有年代感的小配件。" : ""}`;
        setTimeout(
          () =>
            api.complete(
              score,
              {
                blocks: Array.from(local.blocks),
                bg: local.bg,
                title: local.title,
                bio: local.bio,
                link: local.link,
              },
              successHtml
            ),
          1400
        );
      };

      const onReset = () => {
        if (local.locked) return;
        local.blocks = new Set();
        local.title = "我的第一个主页";
        local.bio = defaultBio;
        local.link = "https://example.com";
        local.bg = "stars";
        local.published = false;
        titleInput.value = local.title;
        bioInput.value = local.bio;
        linkInput.value = local.link;
        renderPreview();
        renderControls();
        api.feedback("页面已清空。重新拼一个吧。", "");
        CTM.audio.click();
      };

      blocksEl.addEventListener("click", onBlockClick);
      bgPickerEl.addEventListener("click", onBgClick);
      titleInput.addEventListener("input", onInput);
      bioInput.addEventListener("input", onInput);
      linkInput.addEventListener("input", onInput);
      previewEl.addEventListener("click", onPreviewClick);
      publishBtn.addEventListener("click", onPublish);
      resetBtn.addEventListener("click", onReset);

      renderPreview();
      renderControls();

      return () => {
        blocksEl.removeEventListener("click", onBlockClick);
        bgPickerEl.removeEventListener("click", onBgClick);
        titleInput.removeEventListener("input", onInput);
        bioInput.removeEventListener("input", onInput);
        linkInput.removeEventListener("input", onInput);
        previewEl.removeEventListener("click", onPreviewClick);
        publishBtn.removeEventListener("click", onPublish);
        resetBtn.removeEventListener("click", onReset);
      };
    },
  });
})(window.CTM = window.CTM || {});
