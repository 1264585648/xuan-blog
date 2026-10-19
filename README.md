# Xuan Blog

基于 React + TypeScript + Vite 构建的极简中文个人博客，支持通过 `content/posts/*.md` 编写 Markdown 文章并配合 Cloudflare Pages 自动构建发布。

## 本地开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 写文章与发布流程（`git push` 自动部署）

无需修改 React 或 TypeScript 代码，平时写文章只需在 `content/posts/` 目录下新建 `.md` 文件：

```markdown
---
title: 文章标题
date: 2025-04-01
category: 前端
tags: React, 架构
summary: 一句话摘要说明
featured: true
shelfId: ui-engineering
relatedIds: state-management-boundaries
---

这里是正文段落……

## 小标题

- 列表项 1
- 列表项 2
```

写完后直接提交并推送：

```bash
git add content/posts/
git commit -m "post: 新增文章"
git push
```

Cloudflare Pages 监听到 GitHub 仓库的 `push` 事件后会自动执行 `npm run build`（输出目录 `dist`）并完成全网发布。
