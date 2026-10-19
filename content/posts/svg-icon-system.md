---
title: 维护一套干净的 SVG 图标组件
date: 2023-07-22
category: 前端
tags: SVG, 组件
summary: 统一 viewBox、strokeWidth 与 currentColor 继承规则，避免图标尺寸与对齐错位。
readTime: 4 min
featured: false
shelfId: typography-tokens
relatedIds: css-tokens-and-themes, cjk-latin-typography
---

在项目里混用不同来源的 SVG 图标时，最容易出现有的线条粗、有的线条细，或者和文字排在一行时基线偏高。将所有图标统一收敛到 24×24 画布并通过 props 控制字号与线宽，能省去大量微调 margin 的时间。
