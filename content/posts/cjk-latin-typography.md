---
title: 网页字体排印笔记：中西文混排的字号与行高
date: 2024-11-19
category: 设计
tags: 排版, 字体
summary: 处理英文几何无衬线体与中文黑体混排时的基线对齐、字距与视觉字重落差。
readTime: 7 min
featured: true
shelfId: typography-tokens
relatedIds: css-tokens-and-themes, command-palette-details
---

直接照搬英文网站的设计稿来排中文，最容易踩的坑就是字距（letter-spacing）和字号。英文大标题常设置 -0.04em 甚至 -0.06em 的紧凑负字距，但汉字本身是方块结构，过大的负字距会让笔画挤在一起。

此外，正文字号在中文环境下建议保持在 15px–16px，行高控制在 1.75–1.85 之间，单行字数限制在 35–42 个汉字以内，长文阅读体验最为稳定。
