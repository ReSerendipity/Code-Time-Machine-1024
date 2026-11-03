# 架构 — Code-Time-Machine-1024

> 治理定位：`delivery=service`、`lifecycle=maintenance`（`governance/desired-state.json`）。
> 本文按 2026-11-03 的实际目录结构生成；数据流与边界须由维护者在实现变更时同步复核。

## 1. 定位

**Live Demo:** https://reserendipity.github.io/Code-Time-Machine-1024/

## 2. 组件与依赖方向

```text
支撑层：docs/ (9)、.github/ (3)
其他层：js/ (12)
根级层：根级文件 (8)
```

| 组件 | 目录 | 文件数 | 代表文件 |
|---|---|---|---|
| `js` | `js/` | 12 | `js/agent.js`, `js/audio.js`, `js/core.js` |
| `docs` | `docs/` | 9 | `docs/.nojekyll`, `docs/agent-contract.md`, `docs/assets/readme-code-time-machine-1024-1-landing-20261026.png` |
| 根级文件 | `/` | 8 | `.editorconfig`, `.gitignore`, `LICENSE` |

依赖方向：入口层（应用 / 页面）调用领域层（业务模块），领域层依赖基础设施层（脚本、配置、模型资产）；反向引用不允许。

## 3. 数据流

浏览器加载静态页 → 选择纪元主题 → JS 模块切换视觉与交互；无后端。

## 4. 外部依赖

| 依赖 | 用途 | 不可用时 |
|---|---|---|
| 浏览器 | 纯静态运行 | 无 JS 则页面不可交互 |

## 5. 边界与非目标

- 不承担其他仓的职责；跨仓协作只走文档与接口约定。
- 运行时不把密钥写入仓库或日志。
- 不入库：密钥 / token / 口令 / 连接串、本机绝对路径、`local/` 与 `AGENTS.md`、构建产物。
- 治理正文只在 `ReSerendipity/.github/governance`，本仓不复制规则正文。

## 6. 变更影响面

| 改什么 | 必须同步 | 由谁校验 |
|---|---|---|
| 目录结构 / 入口 | 本文「组件与依赖方向」与「数据流」 | 维护者 |
| CI 与门禁 | 本仓 `README.md` 的测试命令；治理仓 §20 远端载体口径 | `audit-drift.py` |
| 依赖清单 | 锁文件与 `.github/dependabot.yml` 的生态段 | Dependabot / `lock-consistency` |
| README 展示图 | §8.1 真实性红线（图必须来自真实运行） | 治理仓 `readme-image-provenance` |
