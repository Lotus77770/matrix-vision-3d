# Changelog

本文件记录项目的显著变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed

- 控制台面板默认收起为折叠按钮
- 向量列表、网格线显示改为各自独立的折叠小节且默认收起，网格线显示移至向量列表下方

### Removed

- 控制台内的副标题说明文字

### Fixed

- 控制台小节展开 / 收起时滚动条出现 / 消失导致的左右缩放抖动（为 `#console-card` 启用 `scrollbar-gutter: stable`）

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
