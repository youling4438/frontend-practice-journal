# 前端研习室

一个用于保存、检索和回顾前端实战训练的静态知识库。

## 功能

- 浏览和全文搜索公开训练内容
- 按技术主题筛选训练
- 标记待复习和已回顾状态
- 在本地保存自己的训练记录
- 响应式布局，支持桌面和移动设备

个人状态和新增训练使用浏览器 `localStorage` 保存，不会上传到服务器。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

静态文件会生成在 `dist` 目录，可部署到 Cloudflare Pages 或任何静态托管服务。

## Cloudflare Pages

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node.js：20 或更高版本
