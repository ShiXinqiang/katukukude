"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type {
  AdminBroadcastRecord,
  AdminOrderDetail,
  AdminOrderRecord,
  AdminOverview,
  AdminUserRecord,
  AuthUser,
  UserRole,
} from "../../lib/data";

type AdminSection = "overview" | "users" | "orders" | "broadcasts";

const navItems: Array<{
  key: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "overview", label: "概览", icon: LayoutDashboard },
  { key: "users", label: "用户管理", icon: Users },
  { key: "orders", label: "订单中心", icon: ClipboardList },
  { key: "broadcasts", label: "全员广播", icon: Megaphone },
];

const statusLabels: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  processing: "处理中",
  completed: "已完成",
  cancelled: "已取消",
};

const paymentLabels: Record<string, string> = {
  unpaid: "未付款",
  paid: "已付款",
  refunded: "已退款",
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });
  const result = (await response.json().catch(() => ({}))) as {
    message?: string;
  } & T;

  if (!response.ok) {
    throw new Error(result.message || "请求失败，请稍后重试");
  }

  return result;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value: string | number | null) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : "—";
}

function statusLabel(value: string) {
  return statusLabels[value] || value || "未知状态";
}

function paymentLabel(value: string) {
  return paymentLabels[value] || value || "未知状态";
}

export function AdminDashboard({ admin }: { admin: AuthUser }) {
  const [section, setSection] = useState<AdminSection>("overview");
  const [overview, setOverview] = useState<AdminOverview>({
    users: 0,
    activeSessions: 0,
    orders: 0,
    broadcasts: 0,
    notifications: 0,
  });
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastRecord[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOverview = async () => {
    setLoading("overview");
    setError("");
    try {
      const result = await requestJson<{ overview: AdminOverview }>(
        "/api/admin/overview",
      );
      setOverview(result.overview);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const loadUsers = async (page = 1, search = userSearch) => {
    setLoading("users");
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (search.trim()) query.set("search", search.trim());
      const result = await requestJson<{
        users: AdminUserRecord[];
        total: number;
        page: number;
      }>(`/api/admin/users?${query.toString()}`);
      setUsers(result.users);
      setUserPage(result.page);
      setUserTotal(result.total);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const loadOrders = async (page = 1, search = orderSearch) => {
    setLoading("orders");
    setError("");
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (search.trim()) query.set("search", search.trim());
      const result = await requestJson<{
        orders: AdminOrderRecord[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/orders?${query.toString()}`);
      setOrders(result.orders);
      setOrderPage(result.page);
      setOrderTotal(result.total);
      setOrderTotalPages(result.totalPages);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const loadBroadcasts = async () => {
    setLoading("broadcasts");
    setError("");
    try {
      const result = await requestJson<{
        broadcasts: AdminBroadcastRecord[];
      }>("/api/admin/broadcasts");
      setBroadcasts(result.broadcasts);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    void loadOverview();
    void loadBroadcasts();
  }, []);

  useEffect(() => {
    if (section === "users") void loadUsers(1);
    if (section === "orders") void loadOrders(1);
    if (section === "broadcasts") void loadBroadcasts();
  }, [section]);

  const openOrder = async (id: string) => {
    setLoading("order-detail");
    setError("");
    try {
      const result = await requestJson<{ order: AdminOrderDetail }>(
        `/api/admin/orders/${id}`,
      );
      setSelectedOrder(result.order);
      setPaymentAmount(result.order.totalAmount);
      setTransactionId(result.order.transactionId || "");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const updateUserRole = async (user: AdminUserRecord) => {
    const nextRole: UserRole = user.role === "admin" ? "user" : "admin";
    if (
      !window.confirm(
        nextRole === "admin"
          ? `确定将 ${user.username} 设为管理员吗？`
          : `确定移除 ${user.username} 的管理员权限吗？`,
      )
    ) {
      return;
    }

    setLoading(`user-${user.id}`);
    setError("");
    try {
      await requestJson(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      setNotice("用户角色已更新");
      await loadUsers(userPage);
      await loadOverview();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const confirmPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder) return;

    setLoading("payment");
    setError("");
    try {
      await requestJson(`/api/admin/orders/${selectedOrder.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          transactionId,
        }),
      });
      setNotice("付款已确认，并已生成用户通知");
      await openOrder(selectedOrder.id);
      await loadOrders(orderPage);
      await loadOverview();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const sendBroadcast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading("send-broadcast");
    setError("");
    try {
      await requestJson("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          content: broadcastContent,
        }),
      });
      setBroadcastTitle("");
      setBroadcastContent("");
      setNotice(`广播已发送给 ${overview.users} 名用户`);
      await loadBroadcasts();
      await loadOverview();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.assign("/admin/login");
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e8eef2] text-[#7189a1]">
              <ShieldCheck size={24} strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-sm font-bold">卡兔管理后台</p>
              <p className="mt-1 text-[11px] text-slate-400">Operations Console</p>
            </div>
          </div>

          <nav className="mt-12 space-y-2">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  setSection(key);
                  setError("");
                  setNotice("");
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition ${
                  section === key
                    ? "bg-[#e8eef2] font-semibold text-[#627b94]"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-[#f4f7f8] p-4">
            <p className="text-xs font-semibold text-slate-700">当前管理员</p>
            <p className="mt-2 truncate text-sm text-slate-600">{admin.displayName}</p>
            <p className="mt-1 truncate text-[11px] text-slate-400">{admin.username}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex items-center gap-2 text-xs text-slate-400 transition hover:text-slate-600"
            >
              <LogOut size={15} />
              退出后台
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">卡兔 / {getSectionLabel(section)}</p>
                <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                  {getSectionLabel(section)}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden items-center gap-1.5 rounded-full bg-[#edf4ef] px-3 py-1.5 text-xs text-[#668675] sm:flex">
                  <Activity size={14} />
                  数据库已连接
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex size-9 items-center justify-center rounded-full bg-[#f4f7f8] text-slate-500 lg:hidden"
                  aria-label="退出后台"
                >
                  <LogOut size={17} />
                </button>
              </div>
            </div>

            <nav className="scrollbar-hidden mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map(({ key, label }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setSection(key);
                    setError("");
                    setNotice("");
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs ${
                    section === key
                      ? "bg-[#7189a1] font-semibold text-white"
                      : "bg-[#f4f7f8] text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </header>

          <div className="p-4 sm:p-8">
            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#fff1ee] px-4 py-3 text-sm text-[#c9685d]">
                <span>{error}</span>
                <button type="button" onClick={() => setError("")} aria-label="关闭提示">
                  <X size={16} />
                </button>
              </div>
            )}
            {notice && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[#edf4ef] px-4 py-3 text-sm text-[#668675]">
                <CheckCircle2 size={17} />
                {notice}
                <button
                  type="button"
                  onClick={() => setNotice("")}
                  className="ml-auto"
                  aria-label="关闭提示"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {section === "overview" && (
              <OverviewPanel
                overview={overview}
                loading={loading === "overview"}
                onRefresh={loadOverview}
                onNavigate={setSection}
              />
            )}
            {section === "users" && (
              <UsersPanel
                users={users}
                adminId={admin.id}
                page={userPage}
                total={userTotal}
                loading={loading === "users"}
                search={userSearch}
                onSearch={(nextSearch) => {
                  setUserSearch(nextSearch);
                  void loadUsers(1, nextSearch);
                }}
                onPage={(nextPage) => void loadUsers(nextPage)}
                onRoleChange={updateUserRole}
              />
            )}
            {section === "orders" && (
              <OrdersPanel
                orders={orders}
                page={orderPage}
                total={orderTotal}
                totalPages={orderTotalPages}
                loading={loading === "orders"}
                search={orderSearch}
                selectedOrder={selectedOrder}
                paymentAmount={paymentAmount}
                transactionId={transactionId}
                paymentLoading={loading === "payment"}
                detailLoading={loading === "order-detail"}
                onSearch={(nextSearch) => {
                  setOrderSearch(nextSearch);
                  void loadOrders(1, nextSearch);
                }}
                onPage={(nextPage) => void loadOrders(nextPage)}
                onOpenOrder={openOrder}
                onCloseOrder={() => setSelectedOrder(null)}
                onPaymentAmountChange={setPaymentAmount}
                onTransactionIdChange={setTransactionId}
                onConfirmPayment={confirmPayment}
              />
            )}
            {section === "broadcasts" && (
              <BroadcastPanel
                overview={overview}
                broadcasts={broadcasts}
                title={broadcastTitle}
                content={broadcastContent}
                loading={loading === "broadcasts"}
                sending={loading === "send-broadcast"}
                onTitleChange={setBroadcastTitle}
                onContentChange={setBroadcastContent}
                onSubmit={sendBroadcast}
                onRefresh={loadBroadcasts}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function OverviewPanel({
  overview,
  loading,
  onRefresh,
  onNavigate,
}: {
  overview: AdminOverview;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNavigate: (section: AdminSection) => void;
}) {
  const cards = [
    { label: "用户总数", value: overview.users, icon: Users, tone: "bg-[#e8eef2] text-[#7189a1]" },
    { label: "活跃会话", value: overview.activeSessions, icon: Activity, tone: "bg-[#edf4ef] text-[#668675]" },
    { label: "订单总数", value: overview.orders, icon: ClipboardList, tone: "bg-[#f5e9e1] text-[#b78369]" },
    { label: "通知总数", value: overview.notifications, icon: BarChart3, tone: "bg-[#eeeaf2] text-[#897a9c]" },
  ];

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">欢迎回来，管理员</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            业务概览
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          刷新数据
        </button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className={`flex size-11 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={21} strokeWidth={1.7} />
              </span>
              <span className="text-[11px] text-slate-400">实时</span>
            </div>
            <p className="mt-6 text-sm text-slate-400">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
              {loading ? "—" : value.toLocaleString("zh-CN")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">管理入口</h3>
              <p className="mt-1 text-xs text-slate-400">所有数据均来自当前 PostgreSQL 数据库</p>
            </div>
            <ShieldCheck size={22} className="text-[#7189a1]" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <QuickLink
              icon={Users}
              title="用户管理"
              description={`${overview.users} 名用户`}
              onClick={() => onNavigate("users")}
            />
            <QuickLink
              icon={ClipboardList}
              title="订单中心"
              description={`${overview.orders} 笔订单`}
              onClick={() => onNavigate("orders")}
            />
            <QuickLink
              icon={Megaphone}
              title="全员广播"
              description={`${overview.broadcasts} 条记录`}
              onClick={() => onNavigate("broadcasts")}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-[#6f86a1] p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/65">数据安全</p>
              <h3 className="mt-2 text-lg font-bold">管理员权限已启用</h3>
            </div>
            <CircleDollarSign size={25} className="text-white/80" />
          </div>
          <p className="mt-8 text-xs leading-5 text-white/70">
            付款确认会校验精确到分的金额，并为对应用户写入通知记录。
          </p>
        </section>
      </div>
    </section>
  );
}

function UsersPanel({
  users,
  adminId,
  page,
  total,
  loading,
  search,
  onSearch,
  onPage,
  onRoleChange,
}: {
  users: AdminUserRecord[];
  adminId: string;
  page: number;
  total: number;
  loading: boolean;
  search: string;
  onSearch: (search: string) => void;
  onPage: (page: number) => void;
  onRoleChange: (user: AdminUserRecord) => void;
}) {
  const [searchInput, setSearchInput] = useState(search);
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <section>
      <PanelIntro
        title="用户管理"
        description="查看注册账号并维护管理员角色权限。"
        icon={Users}
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="flex w-full max-w-md items-center rounded-xl bg-white px-3.5 py-3 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(searchInput);
          }}
        >
          <Search size={17} className="mr-2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="搜索账号或显示名称"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button type="submit" className="text-xs font-medium text-[#7189a1]">
            搜索
          </button>
        </form>
        <span className="text-xs text-slate-400">共 {total} 名用户</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : users.length === 0 ? (
          <EmptyPanel title="暂无用户" description="注册用户会显示在这里。" />
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2f5] text-sm font-semibold text-[#7189a1]">
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {user.displayName}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {user.username} · {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <RoleBadge role={user.role} />
                  <button
                    type="button"
                    disabled={user.id === adminId || loading}
                    onClick={() => onRoleChange(user)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition hover:border-[#7189a1] hover:text-[#7189a1] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {user.role === "admin" ? "移除管理员" : "设为管理员"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </section>
  );
}

function OrdersPanel({
  orders,
  page,
  total,
  totalPages,
  loading,
  search,
  selectedOrder,
  paymentAmount,
  transactionId,
  paymentLoading,
  detailLoading,
  onSearch,
  onPage,
  onOpenOrder,
  onCloseOrder,
  onPaymentAmountChange,
  onTransactionIdChange,
  onConfirmPayment,
}: {
  orders: AdminOrderRecord[];
  page: number;
  total: number;
  totalPages: number;
  loading: boolean;
  search: string;
  selectedOrder: AdminOrderDetail | null;
  paymentAmount: string;
  transactionId: string;
  paymentLoading: boolean;
  detailLoading: boolean;
  onSearch: (search: string) => void;
  onPage: (page: number) => void;
  onOpenOrder: (id: string) => void;
  onCloseOrder: () => void;
  onPaymentAmountChange: (value: string) => void;
  onTransactionIdChange: (value: string) => void;
  onConfirmPayment: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [searchInput, setSearchInput] = useState(search);

  return (
    <section>
      <PanelIntro
        title="订单中心"
        description="支持订单号、交易流水、用户账号和金额查询，并提供分页与详情查看。"
        icon={ClipboardList}
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="flex w-full max-w-lg items-center rounded-xl bg-white px-3.5 py-3 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(searchInput);
          }}
        >
          <Search size={17} className="mr-2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="订单号 / 交易流水 / 用户 / 金额"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button type="submit" className="text-xs font-medium text-[#7189a1]">
            查询
          </button>
        </form>
        <span className="text-xs text-slate-400">共 {total} 笔订单</span>
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <TableSkeleton rows={6} />
          ) : orders.length === 0 ? (
            <EmptyPanel title="暂无订单" description="订单数据接入后会显示在这里。" />
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <button
                  type="button"
                  key={order.id}
                  onClick={() => onOpenOrder(order.id)}
                  className={`flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 ${
                    selectedOrder?.id === order.id ? "bg-[#f4f7f8]" : ""
                  }`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2f5] text-[#7189a1]">
                    <ClipboardList size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-700">
                        {order.orderNo}
                      </span>
                      <StatusBadge value={order.paymentStatus} payment />
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-400">
                      {order.displayName || order.username || "未关联用户"} · {formatDate(order.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-[#ba806b]">
                      {formatAmount(order.totalAmount)}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {statusLabel(order.status)}
                    </span>
                  </span>
                  <ChevronRight size={17} className="shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {detailLoading ? (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="mt-3 h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : selectedOrder ? (
          <OrderDetailPanel
            order={selectedOrder}
            paymentAmount={paymentAmount}
            transactionId={transactionId}
            paymentLoading={paymentLoading}
            onClose={onCloseOrder}
            onPaymentAmountChange={onPaymentAmountChange}
            onTransactionIdChange={onTransactionIdChange}
            onConfirmPayment={onConfirmPayment}
          />
        ) : (
          <div className="hidden rounded-2xl border border-dashed border-slate-300 p-8 text-center xl:block">
            <ClipboardList size={28} className="mx-auto text-slate-300" strokeWidth={1.4} />
            <p className="mt-3 text-sm font-semibold text-slate-600">选择订单查看详情</p>
            <p className="mt-1 text-xs text-slate-400">订单信息和付款操作会显示在这里</p>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </section>
  );
}

function OrderDetailPanel({
  order,
  paymentAmount,
  transactionId,
  paymentLoading,
  onClose,
  onPaymentAmountChange,
  onTransactionIdChange,
  onConfirmPayment,
}: {
  order: AdminOrderDetail;
  paymentAmount: string;
  transactionId: string;
  paymentLoading: boolean;
  onClose: () => void;
  onPaymentAmountChange: (value: string) => void;
  onTransactionIdChange: (value: string) => void;
  onConfirmPayment: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <aside className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">订单详情</p>
          <h3 className="mt-1 break-all text-lg font-bold">{order.orderNo}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-[#f4f7f8] text-slate-500"
          aria-label="关闭订单详情"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <DetailCell label="订单金额" value={formatAmount(order.totalAmount)} accent />
        <DetailCell label="付款状态" value={paymentLabel(order.paymentStatus)} />
        <DetailCell label="订单状态" value={statusLabel(order.status)} />
        <DetailCell label="创建时间" value={formatDate(order.createdAt)} />
      </div>

      <div className="mt-5 rounded-xl bg-[#f7f9fa] p-4 text-xs">
        <p className="font-semibold text-slate-700">用户信息</p>
        <p className="mt-2 text-slate-500">{order.displayName || "未设置显示名称"}</p>
        <p className="mt-1 text-slate-400">{order.username || "未关联用户账号"}</p>
      </div>

      <div className="mt-3 rounded-xl bg-[#f7f9fa] p-4 text-xs">
        <p className="font-semibold text-slate-700">收货信息</p>
        <p className="mt-2 text-slate-500">{order.shippingName || "未填写收货人"}</p>
        <p className="mt-1 text-slate-400">{order.shippingPhone || "未填写联系电话"}</p>
        <p className="mt-1 leading-5 text-slate-400">{order.shippingAddress || "未填写收货地址"}</p>
      </div>

      {order.transactionId && (
        <div className="mt-3 rounded-xl bg-[#f7f9fa] p-4 text-xs">
          <p className="font-semibold text-slate-700">交易流水</p>
          <p className="mt-2 break-all text-slate-400">{order.transactionId}</p>
        </div>
      )}

      {order.paymentStatus !== "paid" && (
        <form onSubmit={onConfirmPayment} className="mt-5 rounded-2xl border border-[#e3eaee] p-4">
          <div className="flex items-center gap-2">
            <CircleDollarSign size={18} className="text-[#7189a1]" />
            <h4 className="text-sm font-bold">确认付款</h4>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            系统会校验付款金额必须与订单金额精确到分一致。
          </p>
          <label className="mt-4 block text-xs text-slate-500">
            实收金额
            <input
              value={paymentAmount}
              onChange={(event) => onPaymentAmountChange(event.target.value)}
              inputMode="decimal"
              required
              className="mt-1.5 w-full rounded-xl bg-[#f4f7f8] px-3 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#dbe5eb]"
            />
          </label>
          <label className="mt-3 block text-xs text-slate-500">
            交易流水号（可选）
            <input
              value={transactionId}
              onChange={(event) => onTransactionIdChange(event.target.value)}
              className="mt-1.5 w-full rounded-xl bg-[#f4f7f8] px-3 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#dbe5eb]"
            />
          </label>
          <button
            type="submit"
            disabled={paymentLoading}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#7189a1] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={17} />
            {paymentLoading ? "确认中..." : "确认付款并通知用户"}
          </button>
        </form>
      )}

      {Array.isArray(order.items) && order.items.length > 0 && (
        <details className="mt-4 rounded-xl bg-[#f7f9fa] p-4 text-xs text-slate-400">
          <summary className="cursor-pointer font-semibold text-slate-600">订单商品数据</summary>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all leading-5">
            {JSON.stringify(order.items, null, 2)}
          </pre>
        </details>
      )}
    </aside>
  );
}

function BroadcastPanel({
  overview,
  broadcasts,
  title,
  content,
  loading,
  sending,
  onTitleChange,
  onContentChange,
  onSubmit,
  onRefresh,
}: {
  overview: AdminOverview;
  broadcasts: AdminBroadcastRecord[];
  title: string;
  content: string;
  loading: boolean;
  sending: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section>
      <PanelIntro
        title="全员广播"
        description="发送系统通知，消息会写入每位用户的消息中心。"
        icon={Megaphone}
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={onSubmit} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">新建广播</h3>
              <p className="mt-1 text-xs text-slate-400">当前接收用户：{overview.users} 人</p>
            </div>
            <Send size={20} className="text-[#7189a1]" />
          </div>
          <label className="mt-6 block text-xs text-slate-500">
            广播标题
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              maxLength={160}
              required
              placeholder="请输入广播标题"
              className="mt-1.5 w-full rounded-xl bg-[#f4f7f8] px-3 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#dbe5eb]"
            />
          </label>
          <label className="mt-4 block text-xs text-slate-500">
            广播内容
            <textarea
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              maxLength={5000}
              required
              rows={7}
              placeholder="请输入要发送给全体用户的内容"
              className="mt-1.5 w-full resize-none rounded-xl bg-[#f4f7f8] px-3 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#dbe5eb]"
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#7189a1] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            {sending ? "发送中..." : "发送全员广播"}
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-bold">发送记录</h3>
              <p className="mt-1 text-xs text-slate-400">最近 50 条广播</p>
            </div>
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={loading}
              className="flex size-8 items-center justify-center rounded-full bg-[#f4f7f8] text-slate-500 disabled:opacity-50"
              aria-label="刷新广播记录"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : broadcasts.length === 0 ? (
            <EmptyPanel title="暂无广播记录" description="发送过的广播会显示在这里。" />
          ) : (
            <div className="divide-y divide-slate-100">
              {broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-sm font-semibold text-slate-700">{broadcast.title}</h4>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatDate(broadcast.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                    {broadcast.content}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    已发送 {broadcast.recipientCount} 人
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function PanelIntro({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e8eef2] text-[#7189a1]">
        <Icon size={21} strokeWidth={1.7} />
      </span>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl bg-[#f7f9fa] p-3 text-left transition hover:bg-[#edf2f5]"
    >
      <Icon size={18} className="text-[#7189a1]" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-700">{title}</span>
        <span className="mt-1 block text-[10px] text-slate-400">{description}</span>
      </span>
      <ChevronRight size={15} className="text-slate-300" />
    </button>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] ${
        role === "admin"
          ? "bg-[#e8eef2] text-[#627b94]"
          : "bg-[#f4f7f8] text-slate-400"
      }`}
    >
      {role === "admin" ? "管理员" : "普通用户"}
    </span>
  );
}

function StatusBadge({ value, payment = false }: { value: string; payment?: boolean }) {
  return (
    <span className="rounded-full bg-[#f4f7f8] px-2 py-0.5 text-[10px] text-slate-500">
      {payment ? paymentLabel(value) : statusLabel(value)}
    </span>
  );
}

function DetailCell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#f7f9fa] p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${accent ? "text-[#ba806b]" : "text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="上一页"
      >
        <ArrowLeft size={15} />
      </button>
      <span className="min-w-16 text-center text-xs text-slate-400">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="下一页"
      >
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[#edf1f3] text-[#8195a7]">
        <ClipboardList size={25} strokeWidth={1.4} />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function getSectionLabel(section: AdminSection) {
  return navItems.find((item) => item.key === section)?.label || "概览";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请求失败，请稍后重试";
}
