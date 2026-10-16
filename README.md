# Xuan Blog

一个参考 Tania Rascia Blog 信息架构搭建的中文博客首页，使用 React + Vite + TypeScript。

## 开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 内容入口

- `src/App.tsx` 顶部的 `postGroups`：文章年份、标题、日期、分类、标签和摘要。
- `src/App.tsx` 的侧栏与 Hero 文案：站点名称、个人介绍、导航和外链。
- `src/styles.css`：颜色、间距、字体和响应式断点。

当前页面已包含分类筛选、关键词搜索、深色模式、主题色弹层和移动端抽屉菜单。
