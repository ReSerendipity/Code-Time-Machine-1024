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
    sources: [
      "1989 年，Tim Berners-Lee 在 CERN 提出 World Wide Web 的构想；1991 年，第一个网站在 CERN 上线。",
      "早期的个人主页常见访客计数器、留言簿、Under Construction 图标和跑马灯，它们构成了 Web 的少年时代。",
      "2007 年 iPhone 发布后，Web 从桌面走进每个人的口袋，移动端成为新的默认。",
    ],
    render(root, api) {
      const traveler = CTM.state.traveler || "匿名 Builder";
      const defaultBio = `你好，世界。我是 ${traveler}，正在 Build 一点小东西。`;
      root.innerHTML = `<div class="room room-web">
        <div class="desktop">
          <div class="desktop-icons" aria-hidden="true">
            <div class="dicon"><span class="dicon-glyph">▣</span>My Computer</div>
            <div class="dicon"><span class="dicon-glyph">✉</span>Inbox</div>
            <div class="dicon"><span class="dicon-glyph">◈</span>Network</div>
          </div>
          <div class="browser-window">
            <div class="browser-bar">
              <span class="browser-dots" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="browser-title" data-browser-title>Netscape Navigator - Untitled</span>
            </div>
            <div class="browser-page bg-stars" data-preview></div>
          </div>
          <div class="toolbox">
            <div class="toolbox-head">Page Builder 91<span>第 4 站 · 1991</span></div>
            <div class="toolbox-body">
              <div class="tb-label">页面模块 / 点击添加</div>
              <div class="web-blocks" data-blocks>${BLOCKS.map(
                (block) =>
                  `<button class="block-chip" type="button" data-block="${block.id}" aria-pressed="false">${block.label}${
                    block.required ? '<span class="req"> *</span>' : ""
                  }</button>`
              ).join("")}</div>
              <div class="web-fields">
                <div class="field"><label for="web-title-input">标题</label><input id="web-title-input" type="text" maxlength="36" value="我的第一个主页" data-title></div>
                <div class="field"><label for="web-bio-input">简介</label><textarea id="web-bio-input" maxlength="90" data-bio>${CTM.utils.escapeHtml(defaultBio)}</textarea></div>
                <div class="field"><label for="web-link-input">链接</label><input id="web-link-input" type="text" maxlength="50" value="https://example.com" data-link></div>
              </div>
              <div class="tb-label">背景</div>
              <div class="bg-picker" data-bg-picker>${BACKGROUNDS.map(
                (bg) =>
                  `<button class="bg-swatch ${bg.id} ${bg.id === "stars" ? "is-on" : ""}" type="button" data-bg="${bg.id}" aria-label="${bg.label}" aria-pressed="${bg.id === "stars"}"></button>`
              ).join("")}</div>
              <div class="toolbox-actions">
                <button class="upload-btn" type="button" data-publish disabled>发布</button>
                <button class="tb-btn" type="button" data-web-reset>清空</button>
                <button class="tb-btn" type="button" data-sources>史料</button>
              </div>
            </div>
          </div>
        </div>
        <div class="taskbar"><span>第 4 站 · 1991 · CERN</span><span class="taskbar-clock">03:07</span></div>
      </div>`;

      const previewEl = root.querySelector("[data-preview]");
      const browserTitleEl = root.querySelector("[data-browser-title]");
      const blocksEl = root.querySelector("[data-blocks]");
      const bgPickerEl = root.querySelector("[data-bg-picker]");
      const titleInput = root.querySelector("[data-title]");
      const bioInput = root.querySelector("[data-bio]");
      const linkInput = root.querySelector("[data-link]");
      const publishBtn = root.querySelector("[data-publish]");
      const resetBtn = root.querySelector("[data-web-reset]");
      const blockButtons = Array.from(blocksEl.querySelectorAll("[data-block]"));
      const bgButtons = Array.from(bgPickerEl.querySelectorAll("[data-bg]"));

      const local = {
        blocks: new Set(),
        title: "我的第一个主页",
        bio: defaultBio,
        link: "https://example.com",
        bg: "stars",
        published: false,
        locked: false,
        timer: null,
        cancelled: false,
      };

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
        if (local.published) parts.push('<div class="published-banner">WELCOME TO MY HOMEPAGE!</div>');
        if (local.blocks.has("title")) parts.push(`<h1 class="web-title">${title}</h1>`);
        if (local.blocks.has("marquee"))
          parts.push('<div class="web-marquee"><span>Welcome to my homepage! 本站正在建设中，欢迎常来。</span></div>');
        if (local.blocks.has("bio")) parts.push(`<p class="web-bio">${bio}</p>`);
        if (local.blocks.has("link")) parts.push(`<a class="web-link" href="#" data-web-link>${link}</a>`);
        if (local.blocks.has("counter")) parts.push(`<div class="hit-counter">VISITORS <b data-hits>${hits}</b></div>`);
        if (local.blocks.has("guestbook")) parts.push('<button class="web-guestbook" type="button" data-guestbook>留言簿</button>');
        if (!local.blocks.size) parts.push('<div class="web-empty">空白页面。<br>从右边的 Page Builder 添加一个标题。</div>');
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
        if (local.blocks.has(id)) local.blocks.delete(id);
        else local.blocks.add(id);
        renderPreview();
        renderControls();
        CTM.audio.click();
      };

      const onInput = () => {
        if (local.locked) return;
        local.title = titleInput.value;
        local.bio = bioInput.value;
        local.link = linkInput.value;
        renderPreview();
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
          api.toast("还差模块或内容。");
          CTM.audio.error();
          return;
        }
        local.locked = true;
        local.published = true;
        setBusy(true);
        CTM.audio.modem();
        setTimeout(() => {
          if (local.cancelled) return;
          renderPreview();
          root.querySelector(".desktop").classList.add("is-published");
        }, 700);
        const optionalPoints =
          (local.blocks.has("guestbook") ? 3 : 0) +
          (local.blocks.has("marquee") ? 2 : 0) +
          (local.bio.trim().length > 20 ? 2 : 0) +
          (local.bg !== "stars" ? 1 : 0);
        const score = { expression: Math.min(20, 12 + optionalPoints), manual: 5 };
        local.timer = setTimeout(
          () =>
            !local.cancelled &&
            api.complete(
              score,
              { blocks: Array.from(local.blocks), bg: local.bg },
              { continueLabel: "前往 2007 →" }
            ),
          1500
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
        local.cancelled = true;
        if (local.timer) clearTimeout(local.timer);
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
