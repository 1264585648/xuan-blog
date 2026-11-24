---
title: 个人站点基建复盘：Cloudflare Pages 配合边缘反代的零运维方案
date: 2026-06-09
category: 服务器
tags: Cloudflare, 反向代理, 静态部署
summary: 复盘将个人博客从自维护后端迁移至 Git 驱动构建 + 边缘节点反代的完整方案，兼顾国内访问体验与零服务器维护成本。
featured: true
shelfId: server-infra
relatedIds: linux-server-docker-hardening-checklist, api-quota-routing-and-subscription-budget
---

早期的个人博客跑在一台自建云主机的容器服务加数据库上。平时几个月未必改一次代码，却经常要分心处理证书续期报错、镜像漏洞扫描和零碎的扫描器流量。

今年彻底做了一次减法：把所有文章与脑图全部收敛为纯静态构建产物，托管在 Cloudflare Pages 上实现 `git push` 自动发布，再通过 `vibe-show` 边缘节点做智能反代与缓存加速，彻底告别了为博客单独维护数据库和常驻后端进程。

> 个人基础设施的第一性原理：把状态留在 Git 仓库里，把算力和带宽交给边缘网络。

## 一、构建发布流水线：Git 即唯一数据源

整个站点的文章统一存放在 `content/posts/*.md`，构建阶段由 Vite 在编译期直接完成 Frontmatter 解析与静态打包。每次推送代码到主分支后，几秒内即可完成全量编译与全球边缘分发。

- 零运行时数据库依赖，本地文件夹即完整备份，换电脑只需 `git clone` 即可继续写作。
- 所有预览分支自动生成独立 Preview URL，验证无误后再合入主线。

## 二、边缘反代与缓存头调优

在使用自定义域名配合反向代理回源 Cloudflare Pages 时，最关键的细节是正确透传 SNI（Server Name Indication）并区分 HTML 入口与带指纹静态资源的缓存策略。

```nginx
location / {
    proxy_pass https://xuan-blog.pages.dev;
    proxy_ssl_server_name on;
    proxy_set_header Host xuan-blog.pages.dev;
    proxy_set_header X-Real-IP $remote_addr;
    # HTML 入口保持协商缓存，确保新文章发布后即时生效
    add_header Cache-Control "no-cache";
}

location /assets/ {
    proxy_pass https://xuan-blog.pages.dev/assets/;
    proxy_ssl_server_name on;
    proxy_set_header Host xuan-blog.pages.dev;
    # Vite 哈希静态产物开启一年强缓存
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```
