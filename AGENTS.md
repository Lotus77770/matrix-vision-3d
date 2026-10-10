# AGENTS.md

面向 AI 编码代理的项目指南：只记录「怎么在此仓库里安全地改代码」——约定、坑与禁忌。人类读者请优先看 [README.md](./README.md)。

项目是什么、技术栈、目录结构等事实性内容以 [README.md](./README.md) 为准，本文件不再重复；需求与分阶段验收清单见 [docs/需求-立项版.md](./docs/需求-立项版.md)（内容与代码现状一致）。

## 常用命令

```bash
npm install
npm run dev       # 开发服务器 + HMR
npm run build     # 产出自包含单文件 dist/index.html（约 563 KB）
npm run preview   # 本地预览构建产物（默认 http://localhost:4173）
```

## 代码与样式约定

- **命名风格**：JS 常量用 `UPPER_SNAKE_CASE`（如 `CONFIG`、`DEFAULT_VIEW`）；函数与变量用 camelCase；CSS 类名用 kebab-case（如 `grid-toggle`）；DOM id 用小写连字符（如 `vector-tooltip`）。
- **视觉令牌分两处**：3D 世界参数（尺寸、颜色、取值范围）统一放 `CONFIG`；界面（CSS）的颜色、圆角、间距统一用 `:root` 自定义属性，新增样式请复用变量，不要散落硬编码色值。
- **保持原生**：不引入框架或 TypeScript，一律原生 ESM；`src/main.js` 为单一逻辑文件，除非确有需要不拆分。

## 关键约定

- **参数集中在 `CONFIG`**：[src/main.js](src/main.js) 顶部的 `CONFIG` 是所有几何尺寸、颜色、矩阵取值范围的唯一来源。新增可调参数请放这里，不要散落在各处。
- **矩阵是行主序**：`matrixValues[行][列]`。但 `applyMatrix(m3)` 内部读 `m3.elements` 时是**列主序**（three 的约定）。改动这段时务必别搞反。
- **所有变换必须走 `applyMatrix()`**：它是"矩阵 → 场景"的唯一入口。UI 侧任何数值改动都应调用它来触发实时联动。
- **基向量箭头不做剪切**：`updateArrow()` 采用「先沿自身轴拉伸、再旋转到目标方向」，保持横截面为圆形。不要把矩阵直接套在箭头 group 上，否则箭头会被压扁。
- **只有一个 canvas、一台相机**：`#viewport` 常驻全屏 `#stage`，控制台只是浮在其上的面板。不要新增第二个渲染器或相机。
- **网格分三族**：`gridFamilies.{x,y,z}` 可独立显隐。隐藏只影响显示，不影响变换结果。
- **WebGL 的 `lineWidth` 恒为 1 像素**：需要"粗线"必须用圆柱几何体（坐标轴、刻度、箭头都是这样实现的），不要指望 `LineBasicMaterial.linewidth`。
- **调试入口**：`window.__scene3d` 暴露了 `scene` / `camera` / `renderer` / `controller` / `vectorList` / `addVector` / `applyMatrix` 等，可在控制台直接操作。

## 不要做

- 不要提交 `node_modules/` 或 `dist/`；不要删掉 `package-lock.json`（它锁定 three 与 vite 的版本）。
- 不要手动编辑 `dist/index.html`——它每次构建都会被覆盖。
- 不要移除 `vite.config.js` 里的 `viteSingleFile()`——单 HTML 交付能力依赖它。
- 未确认前不要新增运行时依赖。除 three 外，本项目刻意保持零运行时依赖。

## 环境注意（Windows）

- 当前 shell 为 **PowerShell 5，不支持 `&&` / `||`**，请用 `;` 分隔命令。
- git 默认把中文文件名显示成八进制转义（`core.quotepath`），只影响显示，不影响文件名。
- 单 HTML 产物可用 `file://` 双击直接打开；但浏览器自动化工具通常只支持 `http(s)`，验证时请用 `npm run preview`。

## 提交规范

Conventional Commits，例如 `feat: ...` / `fix: ...` / `docs: ...` / `chore: ...`。
