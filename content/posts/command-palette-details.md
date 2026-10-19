---
title: 命令面板（Command Palette）的键盘交互细节
date: 2024-09-05
category: 前端
tags: 交互, Accessibility
summary: 从零实现一个顺手的快捷键面板：焦点锁定、上下键循环滚动与输入法合成事件处理。
readTime: 6 min
featured: false
shelfId: ui-engineering
relatedIds: state-management-boundaries, form-validation-ux
---

看似简单的 ⌘K 搜索框，真正做扎实需要处理不少边界情况。最容易被忽略的是中文输入法（IME）的 composition 事件：当用户按回车确认拼音选词时，绝不能直接触发列表项的跳转。

- 检查 KeyboardEvent.isComposing，避免在中文选词阶段误触快捷键。
- 使用 scrollIntoView({ block: "nearest" }) 保证键盘上下移动时高亮项始终在可视区域内。
- 关闭弹窗后，将焦点精确归还给触发前的元素。
