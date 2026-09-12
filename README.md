# 卡兔服务导航

基于 Next.js、React、Tailwind CSS、Lucide React 和 Railway PostgreSQL 的移动端 H5。

数据库连接由 `DATABASE_URL` 提供，`/api/health` 可用于检查 PostgreSQL 是否连通。
账号密码注册、登录、会话查询和退出登录使用 PostgreSQL 中的 `users`、`sessions` 表；首次调用认证接口时会自动创建表结构。密码使用加盐 scrypt 哈希保存，浏览器只保存 HttpOnly 会话 Cookie。

当前商品、内容、消息、购物车、订单和收货地址均不预置演示数据，页面会展示对应空状态，后续可接入业务接口。

## 管理员后台

访问 `/admin/login` 登录管理员后台。后台包含实时数据概览、用户角色管理、订单查询与分页、订单详情、精确到分的付款确认、付款成功用户通知和全员广播。

首次初始化管理员前，在 Railway `web` 服务配置 `ADMIN_BOOTSTRAP_TOKEN`，然后在管理员登录页选择“首次使用？初始化管理员”。初始化完成后建议删除该环境变量；初始化接口只允许在数据库中尚未存在管理员时使用。

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
