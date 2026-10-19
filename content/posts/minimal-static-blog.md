---
title: 重写个人网站：去掉 CMS，回到纯静态构建
date: 2025-01-12
category: 工程
tags: Vite, TypeScript
summary: 复盘把博客从复杂后台迁移到纯静态结构的全过程，降低维护负担。
readTime: 4 min
featured: false
shelfId: indie-notes
relatedIds: state-management-boundaries, plain-text-notes
---

旧版博客跑在一套自建的 Node.js + 数据库服务上。平时两三个月才写一篇文章，却经常要花时间处理服务器证书过期、依赖安全告警和数据库备份。

趁着年初有空，我把所有文章导出成纯文本 Markdown，彻底去掉了运行时后端。现在在 `content/posts/` 目录下新建一个 `.md` 文件，执行 `git push` 后 Cloudflare Pages 几十秒即可完成自动构建与部署。
