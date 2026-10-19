---
title: 表单校验的时机：别在用户还没输完时报错
date: 2024-06-18
category: 设计
tags: 交互, 表单
summary: 结合「延迟报错、即时消错」策略，改进复杂配置表单的输入体验。
readTime: 5 min
featured: false
shelfId: ui-engineering
relatedIds: command-palette-details, cjk-latin-typography
---

用户刚在邮箱输入框里敲下第一个字母，下方立刻跳出一行刺眼的红字「邮箱格式不正确」——这是很多表单让人烦躁的原因。

更合理的校验节奏是：首次输入时只在失焦（onBlur）或提交时触发错误提示；一旦当前字段已经处于报错状态，则切换为 onChange 实时校验，只要用户改对了就立即消掉红字。
