# matrix-vision-3d

用 three.js 做的交互式 3D 可视化：把「3×3 矩阵对基向量与空间网格的线性变换」直观地演示出来。一边调节矩阵，一边实时看到空间被拉伸、剪切。

## 特性

- **实时联动**：拖动滑块或输入数值，向量与整个立方格阵立即按 `M·v` 变换
- **箭头不失真**：向量渲染为实体箭头（圆柱 + 圆锥），长度随变换变化，但横截面不会被压扁
- **自由视角**：`Alt` + 拖拽旋转、`Alt` + 滚轮缩放、`W`/`A`/`S`/`D` 移动
- **向量列表**：默认含三个基向量，可自由添加 / 删除向量、修改坐标与颜色
- **网格分向开关**：三个方向的网格线可独立显隐
- **单文件交付**：构建产物是一个自包含 HTML，双击即可离线打开，无需服务器

## 快速开始

### 方式一：直接使用单文件（无需开发环境）

从 [Releases](https://github.com/Lotus77770/matrix-vision-3d/releases) 下载构建好的 HTML，双击打开即可。整个页面只有一个文件，不依赖网络。

### 方式二：自己构建

```bash
npm install
npm run build
```

产物为 `dist/index.html`（约 563 KB，JS / CSS 已全部内联）。

### 方式三：本地开发

```bash
npm install
npm run dev       # 开发服务器（含 HMR）
npm run preview   # 本地预览构建产物，默认 http://localhost:4173
```

## 操作说明

| 操作 | 效果 |
| --- | --- |
| `Alt` + 鼠标拖拽 | 旋转视角 |
| `Alt` + 滚轮 | 缩放 |
| `W` `A` `S` `D` | 前后左右移动 |
| 鼠标悬停在向量上 | 显示它变换后的坐标 |

左上角的控制台面板可折叠。默认矩阵为单位矩阵，此时画面等于未变换状态。

## 数学约定

记矩阵 M（3×3），空间中任一点 / 向量 v 变换后为 **M·v**。

- 基向量 e₁=(1,0,0)、e₂=(0,1,0)、e₃=(0,0,1) 变换后即为矩阵的三列
- 网格的所有顶点同样按 **M·v** 变换，因此网格整体发生线性变换（拉伸 / 剪切）
- 画面上只显示变换后的结果，不保留变换前的原始基向量

## 技术栈

Vite 8（Rolldown 内核）· three.js 0.186（仅核心库，未使用 addons）· 原生 JavaScript · vite-plugin-singlefile

## 项目结构

```text
index.html        页面 DOM 骨架
src/main.js       全部逻辑：场景搭建、矩阵联动、视角控制、控制台 UI
src/style.css     全部样式
vite.config.js    启用 viteSingleFile()，把 JS / CSS 内联进 HTML
docs/             文档（含立项时的需求与验收方案，内容与代码现状一致）
dist/             构建产物（已 gitignore）
```

## 版本与发布

版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)（SemVer），以 git tag 为准（形如 `v0.1.0`）；变更记录见 [CHANGELOG.md](./CHANGELOG.md)。

发布时把构建出的单 HTML 作为 Release 附件提供。

## 更多文档

- [docs/需求-立项版.md](./docs/需求-立项版.md) —— 需求与分阶段验收方案（内容与代码现状一致）
- [AGENTS.md](./AGENTS.md) —— 面向 AI 编码代理的项目指南

## 许可证

本项目基于 [MIT 许可证](./LICENSE) 开源。
