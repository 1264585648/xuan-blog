# 朱轩 · Xuan Blog

> 访问地址：[https://blog.vibe-show.com](https://blog.vibe-show.com)（通过 vibe-show 边缘反代驱动，源站托管于 Cloudflare Pages）

围绕**后端架构、AI Agent 工程、服务器基建与主流 AI 订阅实测**构建的极简个人技术博客，支持通过 `content/posts/*.md` 编写 Markdown 文章并配合 Cloudflare Pages 自动构建发布。

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
date: 2026-06-01
category: 后端
tags: 分布式, MySQL
summary: 一句话摘要说明
featured: true
shelfId: backend-arch
relatedIds: mysql-slow-query-and-cache-consistency
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
