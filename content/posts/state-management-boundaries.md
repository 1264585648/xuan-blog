---
title: 前端状态管理的边界：什么时候该放弃全局 Store
date: 2025-03-28
category: 前端
tags: React, 架构
summary: 把服务端缓存、URL 参数和局部表单拆开后，真正需要放进全局状态的其实所剩无几。
readTime: 6 min
featured: true
shelfId: ui-engineering
relatedIds: command-palette-details, minimal-static-blog
---

接手历史较长的前端项目时，最常见的痛点之一是全局 Store 成了所有数据的垃圾桶：接口返回值、弹窗开关、甚至某个筛选框的临时输入都被塞在同一个 Store 里。

如果按数据的生命周期和归属来重新划分，绝大多数状态其实都有更自然的存放位置。

## 一、按归属权拆分四类状态

在重构过程中，我们把原本混杂在一起的状态拆成了四层：

- 服务端状态（Server State）：交给 TanStack Query 或 SWR 处理缓存、过期与重试，不再手动同步到全局 Store。
- URL 状态（Location State）：分页、搜索关键词、当前选中 Tab 直接写入 Search Params，天然支持分享与刷新保留。
- 组件树局部状态（Colocated State）：哪里消费就放在最近的公共父节点，避免跨层级订阅带来的无效重渲染。
- 真正的全局客户端状态：仅保留当前登录态、主题偏好、全局快捷键上下文等极少数数据。

## 二、减少状态同步代码

80% 的棘手 Bug 都源于「用 useEffect 把状态 A 同步到状态 B」。一旦能通过派生计算（Derived State）在渲染期直接得出结果，就不要额外声明一个新的 state。
