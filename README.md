# 卡兔服务导航

基于 Next.js、React、Tailwind CSS、Lucide React 和 Supabase PostgreSQL 的移动端 H5。

数据库连接由 `DATABASE_URL` 提供，`DB_SCHEMA` 控制业务 schema（生产环境使用独立的 `katu`），`/api/health` 可用于检查 Supabase PostgreSQL 是否连通。
账号密码注册、登录、会话查询和退出登录使用 PostgreSQL 中的 `katu.users`、`katu.sessions` 表；首次调用认证接口时会自动创建表结构。密码使用加盐 scrypt 哈希保存，浏览器只保存 HttpOnly 会话 Cookie。

当前商品、内容、消息、购物车、订单和收货地址均不预置演示数据，页面会展示对应空状态，后续可接入业务接口。

## Supabase 生产配置

Railway `web` 服务需要配置以下变量：

```text
DATABASE_URL=<Supabase Transaction Pooler 连接串，端口 6543>
DB_SCHEMA=katu
NODE_ENV=production
```

连接串从 Supabase 项目的 Connect 面板复制，密码只写入 Railway 环境变量，不要提交到代码仓库。应用会通过 `search_path` 使用 `katu` schema，不会改写目标项目已有的 `public` 表。

数据迁移脚本仅用于一次性切换：将现有数据库连接串配置为 `SOURCE_DATABASE_URL`，再将 `DATABASE_URL` 配置为 Supabase 连接串，运行 `npm run db:migrate`。脚本会迁移账号、会话、订单、通知和广播，不会删除目标库已有的 `public` 数据；切换完成后线上应用只读取 Supabase。

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
