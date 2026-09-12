# 卡兔服务导航

基于 Next.js、React、Tailwind CSS、Lucide React 和 Railway PostgreSQL 的移动端 H5 原型。

数据库连接由 `DATABASE_URL` 提供，`/api/health` 可用于检查 PostgreSQL 是否连通。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run typecheck
npm run build
npm start
```

页面以 390px 移动端宽度为基准，同时兼容 375px 及桌面端预览。
