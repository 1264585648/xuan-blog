# 朱轩 · Xuan Blog

> 访问地址：[https://blog.vibe-show.com](https://blog.vibe-show.com)（通过 vibe-show 边缘反代驱动，源站托管于 Cloudflare Pages）

围绕**后端架构、AI Agent 工程、服务器基建与主流 AI 订阅实测**构建的极简个人技术博客，内置「左纲右树」交互式知识脑图，支持通过 `content/posts/*.md` 编写 Markdown 文章并配合 Cloudflare Pages 自动构建发布。

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

## 知识脑图维护流程（线上只读 · 本地可视化编辑）

- **线上访客视角（只读）**：生产环境默认严格锁定为**只读浏览模式**，所有编辑控件与修改快捷键对公网访客完全隐藏，数据统一读取自 `content/mindmap.json`。
- **博主本地编辑（直写源码）**：
  1. 本地启动 `npm run dev` 打开 `http://localhost:5173/#mindmap`，系统自动启用 **本地编辑模式**。
  2. 在页面上增删节点、勾选点亮进度或编写节点批注后，按 `Ctrl + S`（或点击右上角 **「保存至源码 *」**），修改将直接写入 `content/mindmap.json`。
  3. 提交并推送 `content/mindmap.json` 即可同步更新至线上。
