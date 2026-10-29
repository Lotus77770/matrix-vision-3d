# Changelog

本文件记录项目的显著变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- 「重置为单位矩阵」过渡动画：矩阵数值逐帧插值归一（输入框数字随之滚动），相机插值球面参数沿弧线平滑飞回初始视角（theta 走最短角路径，飞行中段半径先拉远再落位），时长约 0.9 秒，参数集中在 `CONFIG.animation`
- 动画播放期间输入全部锁定：相机控制停用并清空按住的移动键，控制台 UI（含折叠按钮）整体禁用并变暗，落位后自动恢复
- 动画底座：`animationManager` 补间引擎（`run()` 返回 Promise）与 `playAnimation(name)` 统一动画入口，`window.__scene3d.playAnimation('reset')` 可在控制台或后续 AI MCP 演示中 await 串联

### Changed

- 控制台面板默认收起为折叠按钮
- 向量列表、网格线显示改为各自独立的折叠小节且默认收起，网格线显示移至向量列表下方
- 界面圆角与间距统一使用 CSS 变量，相机、灯光、轴标签和控制器参数统一收敛到 `CONFIG`
- `#viewport` 改为在 HTML 中直接嵌入 `#stage`，移除对运行时 DOM 搬移的依赖
- 自绘开关圆点的圆角不再使用裸值，改为引用 `--radius-pill` 令牌
- 单位矩阵常量重命名为 `IDENTITY_MAT3` / `IDENTITY_VALUES`
- 向量默认色与新增向量调色板、灯光位置、几何细分段数统一收敛到 `CONFIG`（等值搬移，无行为变化）

### Removed

- 控制台内的副标题说明文字

### Fixed

- `ViewController.update()` 中的 WASD 平移补上 `enabled` 检查，消除"输入锁定期间相机仍会被按住的移动键拖动"的隐患
- 控制台小节展开 / 收起时滚动条出现 / 消失导致的左右缩放抖动（为 `#console-card` 启用 `scrollbar-gutter: stable`）
- 输入框、按钮等 6 处 `font: … inherit` 简写按 CSS 规范无效（`inherit` 不能作字体族分量），导致字号 / 字体设置被整条丢弃；改为拆分出的 `font-family` / `font-size` / `line-height`
- 删除向量时释放其独占的几何体与材质，修复反复增删向量的 GPU 资源泄漏
- 矩阵与向量坐标输入框清空后失焦自动回填当前值，消除界面空白与内部状态不一致

## [0.1.0] - 2026-10-10

### Added

- 3D 场景：三条白色坐标轴（两端带 +X/-X/+Y/-Y/+Z/-Z 标签，随视角始终正对相机）与整数刻度、三个彩色实体基向量箭头、±3 三维立方格阵
- 基向量以实体箭头（圆柱 + 圆锥）渲染，长度随变换变化但横截面不会被压扁
- 3×3 矩阵控制台：每格支持输入框与滑块，数值变化实时作用于基向量与网格
- 自由视角控制：`Alt` + 拖拽旋转、`Alt` + 滚轮缩放、`W`/`A`/`S`/`D` 移动
- 向量列表：可添加 / 删除向量，修改坐标与颜色
- 网格线三向独立显隐开关；控制台面板可折叠
- 鼠标悬停向量时显示变换后的坐标
- 「重置为单位矩阵」按钮：恢复单位矩阵，并把相机视角一并复位到初始状态
- 单文件构建：`npm run build` 产出自包含的 `dist/index.html`，可离线双击打开

[Unreleased]: https://github.com/Lotus77770/matrix-vision-3d/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Lotus77770/matrix-vision-3d/releases/tag/v0.1.0
