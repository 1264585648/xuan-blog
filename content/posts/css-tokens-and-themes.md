---
title: CSS 变量与深浅色主题的工程实践
date: 2025-02-14
category: 设计
tags: CSS, Design Tokens
summary: 摆脱散落的色值硬编码，用三层语义 Token 管理日夜模式与对比度层级。
readTime: 5 min
featured: true
shelfId: typography-tokens
relatedIds: cjk-latin-typography, minimal-static-blog
---

很多团队在接入深色模式时，习惯在业务组件里写满条件判断，或者直接把白底黑字简单反转为黑底白字。结果往往是深色模式下眩光严重，卡片层级也全部糊成一团。

```css
:root {
  --bg-canvas: #f6f5f1;
  --bg-surface: #ffffff;
  --text-primary: #18181b;
  --text-secondary: #52525b;
  --border-subtle: #e4e4e0;
}

.theme-dark {
  --bg-canvas: #111210;
  --bg-surface: #181917;
  --text-primary: #f4f4f0;
  --text-secondary: #a1a19a;
  --border-subtle: #262724;
}
```

## 深色模式用亮度区分高度

在浅色模式下，我们常靠阴影（box-shadow）来体现悬浮卡片的层级；但在深色背景上阴影几乎不可见。更稳妥的做法是让越靠上的表面（Surface）背景色稍微亮一点，同时配合 1px 的半透明内边框。
