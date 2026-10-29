# 代码时间机器 · The Code Time Machine

> 从打孔纸带到 AI 编程，六次回到 Build 的现场。

TRAE 社区 1024 狂欢周 · 玩法二「TRAE 1024 作品秀」参赛作品。

**在线 Demo：** https://reserendipity.github.io/Code-Time-Machine-1024/
**GitHub 公开仓库（Apache-2.0）：** https://github.com/ReSerendipity/Code-Time-Machine-1024

## 一分钟体验

- **直接双击** `code-time-machine.html`，离线可玩。
- 或在本目录启动静态服务：

```bash
python -m http.server 8080
# 打开 http://localhost:8080
```

- 建议桌面全屏体验；手机 390px 宽度已验证可玩。
- 在任意页面输入 `1024`，可以进入隐藏频道。

## 这是什么

一台藏在 1024 号机房的旧终端，带你回到六个编程时代：

1. **1804 · 打孔卡**：用 5 位二进制打出代号首字母。
2. **1945 · 寄存器**：从 6 条指令里选 4 条，让 `A + B` 输出 7。
3. **1972 · Unix / C**：用管道从日志里抓出真正的 500 错误。
4. **1991 · Web**：拼出你的第一个个人主页并发布。
5. **2007 · 移动 / 云**：在预算内让 1024 个请求平稳落地。
6. **2026 · AI**：给 AI 一句需求，生成一份 Build 计划和生成式海报。

走完六站，得到你的 **Builder 类型、四维雷达、时代适配度、可下载海报和分享链接**。

## 核心特性

- 六个时代，六套视觉系统，六种交互。
- 每个时代 30-60 秒，不需要读说明书。
- 每站盖章后自动弹出一张**时代档案卡**：80–120 字史料 + 该时代 Canvas 插图 + 出处链接，点“收下”继续。
- 结果可晒：Builder 类型 + 雷达 + 1080×1440 海报。
- 分享链接可查看好友档案；所有数据只在本地。
- 单文件、零外部依赖、零网络请求（除首次加载页面）。
- 支持键盘操作、`prefers-reduced-motion`、移动端。
- 隐藏结局：输入 `1024`。

## 技术说明

- 原生 HTML / CSS / JavaScript，无框架、无构建依赖。
- Canvas 2D：时间隧道、26.5 秒结尾动画、时代档案卡插图、雷达、海报、未来粒子。
- Web Audio API：合成音效，无音频文件。
- localStorage：进度保存、刷新继续。
- URL hash：分享结果，不做后端。
- 系统字体：无外部字体 / 图片 / 图标库。

### 构建单文件版

```bash
node build.js
# 生成 code-time-machine.html
```

`build.js` 会把 `styles.css` 和 `js/*.js` 内联成一个可离线打开的 HTML。

### 文件结构

```
.
├── index.html                  # 开发版入口
├── styles.css                  # 全局样式与六套时代皮肤
├── js/
│   ├── core.js                 # 状态、存储、UI、图标、分享编码
│   ├── audio.js                # Web Audio 合成音效
│   ├── era1-punch.js           # 打孔卡
│   ├── era2-register.js        # 寄存器
│   ├── era3-unix.js            # Unix 管道
│   ├── era4-web.js             # 早期 Web 主页
│   ├── era5-cloud.js           # 移动 / 云压测
│   ├── era6-ai.js              # AI 本地生成与海报
│   ├── agent.js                # Agent 接管 / 作弊演示光标
│   ├── archive.js              # 时代档案卡：史料、插图、出处
│   ├── finale.js               # 26.5 秒结尾动画
│   ├── result.js               # 类型算法、雷达、海报、分享
│   └── main.js                 # 启动、路由、隧道、完成弹窗
├── build.js                    # 单文件构建
├── code-time-machine.html      # 交付用单文件（可直接双击）
├── shots/                      # 桌面、移动、海报、隐藏结局截图
├── 1024-代码时间机器-计划书.md
├── 论坛发帖草稿.md
└── 演示脚本.md
```

## 测试记录

已用 Playwright + Edge 完成以下验证：

- 桌面 1440×900：启动 → 6 个时代 → 结果 → 海报下载 → 分享链接 → 隐藏结局，全流程通过。
- 移动 390×844：启动页、打孔卡、完成印章、共享档案，无横向溢出。
- 单文件 `file://`：启动 → 6 个时代 → 结果 → 海报下载 → 分享链接 → 移动端，全流程通过。
- 六张时代档案卡：桌面 1440×900 与移动 390×844 均无溢出；“收下”与“先继续”两条路径正常。
- 刷新继续、开始新旅行确认、帮助弹窗、史料弹窗均通过。
- 控制台无 JavaScript 错误。

测试脚本：`test-flow.js`、`test-continue.js`、`test-singlefile.js`、`test-singleflow.js`。运行前需 `npm install playwright-core`，并使用本机 Edge。

## 隐私与离线

- 不收集、不上传任何数据。
- 旅行者代号、进度只写入浏览器 `localStorage`。
- 海报在本地 Canvas 生成。
- AI 时代是**本地模板生成**，不调用真实大模型、不消耗 API Key。
- 单文件版可断网运行。

## 兼容性

- 推荐 Chrome / Edge / Safari 最新版。
- 需要 Canvas、Web Audio、localStorage、`TextEncoder`。
- 音频默认静音，点击“声音”后才会初始化 Web Audio。
- `prefers-reduced-motion` 下会关闭隧道和粒子动画。

## TRAE 使用记录（参赛必填）

玩法二要求写“TRAE 在创作中发挥的作用”。请只写实际发生过的过程。下面是一个可直接执行的记录模板：

```text
我实际用 TRAE 做了：
1. 代码审查：让 TRAE 审查 <文件>，找出 3 个可改进点。我采纳了 <哪一条>，修改前 / 修改后是 <对比>。
2. 文案生成：让 TRAE 为 <某个时代> 生成 5 条文案变体。我选了第 <n> 条，并改成了最终版本：<最终文案>。
3. 调试 / 验收：让 TRAE 帮我复现并修复 <具体问题>，我验证的结果是 <结果>。
4. 省下的时间：<具体数字或感受>。
5. 一个具体的前后对比：<截图 / 代码 / 文案>。
```

建议至少真实完成上面 3 件事，并保留对话截图。**不要编造没有发生的步骤。**

## 史料参考

- Jacquard loom: https://en.wikipedia.org/wiki/Jacquard_loom
- Herman Hollerith: https://en.wikipedia.org/wiki/Herman_Hollerith
- ENIAC: https://en.wikipedia.org/wiki/ENIAC
- Grace Hopper / A-0: https://en.wikipedia.org/wiki/Grace_Hopper
- C language: https://en.wikipedia.org/wiki/C_(programming_language)
- Unix: https://en.wikipedia.org/wiki/Unix
- The Art of Unix Programming: http://www.catb.org/esr/writings/taoup/html/
- World Wide Web: https://home.cern/science/computing/birth-web
- First website: http://info.cern.ch/hypertext/WWW/TheProject.html
- iPhone (1st generation): https://en.wikipedia.org/wiki/IPhone_(1st_generation)
- GitHub Copilot: https://en.wikipedia.org/wiki/GitHub_Copilot
- ChatGPT: https://en.wikipedia.org/wiki/ChatGPT

史料用于交代时代背景，交互为示意性玩法。

## 提交清单

- [ ] 在论坛【案例与作品】板块发帖。
- [ ] 标题使用「【1024Builder作品秀】代码时间机器：从打孔纸带到 AI 编程，用 6 个时代回答“Build 是什么”」。
- [ ] 带话题 `#1024Builder作品秀#`。
- [ ] 正文包含作品介绍、截图 / 录屏、Demo 链接、TRAE 作用。
- [ ] 上传 6-8 张截图（建议：启动页、6 个时代、结果页、海报）。
- [x] Demo：https://reserendipity.github.io/Code-Time-Machine-1024/
- [x] GitHub 公开仓库（Apache-2.0）：https://github.com/ReSerendipity/Code-Time-Machine-1024
- [ ] 补齐 TRAE 实际使用记录（不能编造）。
- [ ] 发布后回复每一条评论，并在结尾抛问题：“你最适合哪个时代？”
- [ ] 10/23 活动结束前保持互动。

## 已知限制

- AI 时代是本地规则模拟，不是真实大模型输出；这是为了离线、零成本、可复现。
- 从 `file://` 打开的分享链接只在同一台机器有效；论坛请使用在线 Demo 链接。
- 分享链接把结果编码在 URL 中，不包含任何个人信息；昵称也只在本地。
- 结果类型由六站的选择和完成质量计算；同一套操作会得到同一个结果。

## 致谢

- 灵感来自六个真实的编程时代，以及每一个仍在 Build 的人。
- 作品为 TRAE 社区 1024 狂欢周而作。
- 从打孔卡到 Prompt，工具在变，Build 不变。
