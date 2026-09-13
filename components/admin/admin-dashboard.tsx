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
  FileText,
  Power,
  Store,
  PackageSearch,
  Trash2,
  UserX,
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
  MerchantApplicationRecord,
  UserRole,
  UserStatus,
} from "../../lib/data";

type AdminSection = "overview" | "users" | "merchantApplications" | "merchants" | "products" | "orders" | "broadcasts";

type AdminMerchant = {
  id: string; userId: string; storeNameCn: string; storeNameMm: string | null;
  phone: string; businessType: string; stateRegion: string; city: string;
  township: string; address: string; description: string;
  status: "active" | "suspended" | "closed"; approvedAt: string;
  username: string; displayName: string; productCount: number; orderCount: number;
};

type AdminProduct = {
  id: string; title: string; subtitle: string | null; description: string; category: string;
  images: string[]; tags: string[]; specifications: Array<{ name: string; values: string[] }>;
  shippingFee: string; freeShipping: boolean; serviceGuarantees: string[];
  price: string; originalPrice: string|null; stock: number; status: "draft"|"pending"|"active"|"rejected"|"archived"; badge:string|null; promotionTitle:string|null; promotionStart:string|null; promotionEnd:string|null; isOfficial:boolean; isFeatured:boolean; isRecommended:boolean; sortOrder:number; rejectionReason:string|null;
  createdAt: string; updatedAt: string; merchantId: string; storeNameCn: string;
};

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  action: () => Promise<void>;
};

type ReviewDialogState = {
  application: MerchantApplicationRecord;
  decision: "approved" | "rejected";
} | null;

const navItems: Array<{
  key: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "overview", label: "概览", icon: LayoutDashboard },
  { key: "users", label: "用户管理", icon: Users },
  { key: "merchantApplications", label: "商家审核", icon: Store },
  { key: "merchants", label: "商家管理", icon: ShieldCheck },
  { key: "products", label: "全站商品", icon: PackageSearch },
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
  return Number.isFinite(amount) ? `Ks ${amount.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}` : "—";
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
    merchants: 0,
    pendingApplications: 0,
  });
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [applications, setApplications] = useState<MerchantApplicationRecord[]>([]);
  const [applicationStatus, setApplicationStatus] = useState("pending");
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
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

  const loadApplications = async (status = applicationStatus) => {
    setLoading("merchantApplications");
    setError("");
    try {
      const result = await requestJson<{ applications: MerchantApplicationRecord[] }>(
        `/api/admin/merchant-applications?status=${status}`,
      );
      setApplications(result.applications);
      setApplicationStatus(status);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const loadMerchants = async () => {
    setLoading("merchants"); setError("");
    try {
      const result = await requestJson<{ merchants: AdminMerchant[] }>("/api/admin/merchants");
      setMerchants(result.merchants);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(null); }
  };

  const loadAdminProducts = async () => {
    setLoading("products"); setError("");
    try {
      const result = await requestJson<{ products: AdminProduct[] }>("/api/admin/products");
      setAdminProducts(result.products);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(null); }
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
    if (section === "merchantApplications") void loadApplications();
    if (section === "merchants") void loadMerchants();
    if (section === "products") void loadAdminProducts();
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

  const updateUser = async (
    user: AdminUserRecord,
    changes: { role?: UserRole; status?: UserStatus; revokeSessions?: boolean },
    success: string,
  ) => {
    setLoading(`user-${user.id}`);
    setError("");
    try {
      await requestJson(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      setNotice(success);
      await Promise.all([loadUsers(userPage), loadOverview()]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const deleteUser = async (user: AdminUserRecord) => {
    setLoading(`user-${user.id}`);
    setError("");
    try {
      await requestJson(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setNotice("用户账号已删除");
      await Promise.all([loadUsers(userPage), loadOverview()]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(null);
    }
  };

  const reviewApplication = async (
    application: MerchantApplicationRecord,
    status: "approved" | "rejected",
    reviewNote: string,
  ) => {
    setLoading(`application-${application.id}`); setError("");
    try {
      await requestJson(`/api/admin/merchant-applications/${application.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      });
      setReviewDialog(null);
      setNotice(status === "approved" ? "审核通过，商家后台权限已自动开通" : "已拒绝申请并通知用户");
      await Promise.all([loadApplications(applicationStatus), loadOverview(), loadUsers(1), loadMerchants()]);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(null); }
  };

  const changeMerchantStatus = async (merchant: AdminMerchant, status: AdminMerchant["status"]) => {
    setLoading(`merchant-${merchant.id}`); setError("");
    try {
      await requestJson(`/api/admin/merchants/${merchant.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setNotice(status === "active" ? "商家已恢复" : status === "suspended" ? "商家后台已暂停" : "商家已关闭");
      await Promise.all([loadMerchants(), loadOverview(), loadUsers(1)]);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(null); }
  };

  const deleteMerchant = async (merchant: AdminMerchant) => {
    setLoading(`merchant-${merchant.id}`); setError("");
    try {
      await requestJson(`/api/admin/merchants/${merchant.id}`, { method: "DELETE" });
      setNotice("商家及其商品已删除，用户账号仍保留");
      await Promise.all([loadMerchants(), loadAdminProducts(), loadOverview(), loadUsers(1)]);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(null); }
  };

  const changeProductStatus = async (product: AdminProduct, changes: Record<string, unknown>) => {
    setLoading(`product-${product.id}`); setError("");
    try {
      await requestJson(`/api/admin/products/${product.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      setNotice("商品审核或运营配置已更新");
      await loadAdminProducts();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(null); }
  };

  const deleteAdminProduct = async (product: AdminProduct) => {
    setLoading(`product-${product.id}`); setError("");
    try {
      await requestJson(`/api/admin/products/${product.id}`, { method: "DELETE" });
      setNotice("商品已删除");
      await Promise.all([loadAdminProducts(), loadOverview()]);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(null); }
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
            <p className="text-xs font-semibold text-slate-700">当前超级管理员</p>
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
                onUserUpdate={(target, changes, success) =>
                  void updateUser(target, changes, success)
                }
                onDelete={(target) =>
                  setConfirmDialog({
                    title: "永久删除用户",
                    description: `将删除账号“${target.username}”及其申请、店铺和商品资料。此操作不可撤销。`,
                    confirmLabel: "确认删除",
                    danger: true,
                    action: () => deleteUser(target),
                  })
                }
              />
            )}
            {section === "merchantApplications" && (
              <MerchantApplicationsPanel
                applications={applications}
                status={applicationStatus}
                loading={loading === "merchantApplications"}
                actionLoading={loading}
                onStatus={(nextStatus) => void loadApplications(nextStatus)}
                onReview={(application, status) =>
                  setReviewDialog({ application, decision: status })
                }
              />
            )}
            {section === "merchants" && (
              <AdminMerchantsPanel
                merchants={merchants}
                loading={loading === "merchants"}
                actionLoading={loading}
                onStatus={(merchant, status) =>
                  setConfirmDialog({
                    title: status === "active" ? "恢复商家" : status === "suspended" ? "暂停商家后台" : "关闭商家",
                    description: `确定对“${merchant.storeNameCn}”执行此操作吗？商家会被强制退出。`,
                    confirmLabel: "确认操作",
                    danger: status !== "active",
                    action: () => changeMerchantStatus(merchant, status),
                  })
                }
                onDelete={(merchant) =>
                  setConfirmDialog({
                    title: "永久删除商家",
                    description: `将删除“${merchant.storeNameCn}”及其全部商品，用户账号仍会保留。此操作不可撤销。`,
                    confirmLabel: "确认删除",
                    danger: true,
                    action: () => deleteMerchant(merchant),
                  })
                }
              />
            )}
            {section === "products" && (
              <AdminProductsPanel
                products={adminProducts}
                loading={loading === "products"}
                actionLoading={loading}
                onUpdate={(product, changes) => void changeProductStatus(product, changes)}
                onDelete={(product) =>
                  setConfirmDialog({
                    title: "删除全站商品",
                    description: `确定永久删除“${product.title}”吗？`,
                    confirmLabel: "确认删除",
                    danger: true,
                    action: () => deleteAdminProduct(product),
                  })
                }
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
      {reviewDialog && (
        <ReviewApplicationModal
          dialog={reviewDialog}
          loading={loading === `application-${reviewDialog.application.id}`}
          onClose={() => setReviewDialog(null)}
          onSubmit={(note) => void reviewApplication(reviewDialog.application, reviewDialog.decision, note)}
        />
      )}
      {confirmDialog && (
        <ConfirmModal
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
          onConfirm={async () => {
            await confirmDialog.action();
            setConfirmDialog(null);
          }}
        />
      )}
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
    { label: "认证商家", value: overview.merchants, icon: Store, tone: "bg-[#edf4ef] text-[#668675]" },
    { label: "待审申请", value: overview.pendingApplications, icon: FileText, tone: "bg-[#fff2e8] text-[#b78369]" },
  ];

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">欢迎回来，超级管理员</p>
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

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickLink
              icon={Users}
              title="用户管理"
              description={`${overview.users} 名用户`}
              onClick={() => onNavigate("users")}
            />
            <QuickLink
              icon={Store}
              title="商家审核"
              description={`${overview.pendingApplications} 条待审核`}
              onClick={() => onNavigate("merchantApplications")}
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
              <h3 className="mt-2 text-lg font-bold">超级管理员权限已启用</h3>
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
  onUserUpdate,
  onDelete,
}: {
  users: AdminUserRecord[];
  adminId: string;
  page: number;
  total: number;
  loading: boolean;
  search: string;
  onSearch: (search: string) => void;
  onPage: (page: number) => void;
  onUserUpdate: (
    user: AdminUserRecord,
    changes: { role?: UserRole; status?: UserStatus; revokeSessions?: boolean },
    success: string,
  ) => void;
  onDelete: (user: AdminUserRecord) => void;
}) {
  const [searchInput, setSearchInput] = useState(search);
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <section>
      <PanelIntro
        title="用户管理"
        description="管理角色、账号状态、登录会话与用户数据。"
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
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <RoleBadge role={user.role} />
                  <UserStatusBadge status={user.status} />
                  <select
                    value={user.role}
                    disabled={user.id === adminId || loading}
                    onChange={(event) => {
                      const role = event.target.value as UserRole;
                      onUserUpdate(user, { role }, "用户角色已更新");
                    }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 disabled:opacity-40"
                  >
                    <option value="user">普通用户</option>
                    <option value="merchant">商家</option>
                    <option value="admin">超级管理员</option>
                  </select>
                  <button
                    type="button"
                    disabled={user.id === adminId || loading}
                    onClick={() => onUserUpdate(
                      user,
                      { status: user.status === "active" ? "suspended" : "active" },
                      user.status === "active" ? "账号已停用并强制下线" : "账号已恢复",
                    )}
                    className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 disabled:opacity-40"
                  >
                    <Power size={12} />{user.status === "active" ? "停用" : "恢复"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onUserUpdate(user, { revokeSessions: true }, "该用户已强制退出所有设备")}
                    className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 disabled:opacity-40"
                  >
                    <UserX size={12} />下线
                  </button>
                  <button
                    type="button"
                    disabled={user.id === adminId || loading}
                    onClick={() => onDelete(user)}
                    className="flex items-center gap-1 rounded-full border border-[#f1d9d4] px-2.5 py-1.5 text-xs text-[#bf7165] disabled:opacity-40"
                  >
                    <Trash2 size={12} />删除
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

function MerchantApplicationsPanel({
  applications,
  status,
  loading,
  actionLoading,
  onStatus,
  onReview,
}: {
  applications: MerchantApplicationRecord[];
  status: string;
  loading: boolean;
  actionLoading: string | null;
  onStatus: (status: string) => void;
  onReview: (application: MerchantApplicationRecord, status: "approved" | "rejected") => void;
}) {
  const labels: Record<string, string> = { pending: "待审核", approved: "已通过", rejected: "已拒绝", all: "全部" };
  return (
    <section>
      <PanelIntro title="商家入驻审核" description="核验店铺名称、经营类型、联系方式、详细地址、两张店铺照片和现场视频。" icon={Store} />
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {Object.entries(labels).map(([key, label]) => <button type="button" key={key} onClick={() => onStatus(key)} className={`shrink-0 rounded-full px-4 py-2 text-xs ${status === key ? "bg-[#7189a1] text-white" : "bg-white text-slate-500"}`}>{label}</button>)}
      </div>
      <div className="mt-4 space-y-4">
        {loading ? <TableSkeleton rows={5} /> : applications.length === 0 ? <div className="rounded-2xl bg-white shadow-sm"><EmptyPanel title="暂无商家申请" description="用户提交的入驻资料会显示在这里。" /></div> : applications.map((application) => (
          <article key={application.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold">{application.storeNameCn || application.storeNameMm}</h3>
                  {application.storeNameCn && application.storeNameMm && <span className="text-xs text-slate-400">{application.storeNameMm}</span>}
                  <span className={`rounded-full px-2.5 py-1 text-[10px] ${application.status === "approved" ? "bg-[#edf4ef] text-[#5f816e]" : application.status === "rejected" ? "bg-[#fff0ed] text-[#b96158]" : "bg-[#fff2e8] text-[#ad795d]"}`}>{labels[application.status]}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">申请人：{application.displayName}（{application.username}） · {formatDate(application.submittedAt)}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailCell label="联系电话" value={application.phone} />
                  <DetailCell label="经营类型" value={application.businessType} />
                  <DetailCell label="邮箱" value={application.email || "未填写"} />
                  <DetailCell label="Telegram" value={application.tgAccount || "未填写"} />
                  <DetailCell label="微信" value={application.wechatAccount || "未填写"} />
                  <DetailCell label="省 / 市 / 镇区" value={`${application.stateRegion} · ${application.city} · ${application.township}`} />
                </div>
                <div className="mt-3 rounded-xl bg-[#f7f9fa] p-4 text-xs">
                  <p className="font-semibold text-slate-600">详细营业地址</p>
                  <p className="mt-2 leading-5 text-slate-400">{application.address}</p>
                  <p className="mt-3 font-semibold text-slate-600">店铺介绍</p>
                  <p className="mt-2 leading-5 text-slate-400">{application.description}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {application.documentIds.map((id, index) => <a key={id} href={`/api/merchant/application/documents/${id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#edf2f5] px-3 py-2 text-xs text-[#667f98]"><FileText size={14} />{index < 2 ? `店铺照片 ${index + 1}` : "现场视频"}</a>)}
                  {application.mapLink && <a href={application.mapLink} target="_blank" rel="noreferrer" className="rounded-full bg-[#edf4ef] px-3 py-2 text-xs text-[#5f816e]">打开地图 / 导航</a>}
                </div>
                {application.reviewNote && <p className="mt-3 rounded-xl bg-[#fff7f3] p-3 text-xs text-[#a96f58]">审核备注：{application.reviewNote}</p>}
              </div>
              {application.status === "pending" && <div className="flex shrink-0 gap-2 lg:flex-col"><button type="button" disabled={actionLoading === `application-${application.id}`} onClick={() => onReview(application, "approved")} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#7189a1] px-5 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15} />通过</button><button type="button" disabled={actionLoading === `application-${application.id}`} onClick={() => onReview(application, "rejected")} className="h-10 rounded-full border border-[#edcec7] px-5 text-xs text-[#b96158] disabled:opacity-50">拒绝</button></div>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminMerchantsPanel({
  merchants, loading, actionLoading, onStatus, onDelete,
}: {
  merchants: AdminMerchant[];
  loading: boolean;
  actionLoading: string | null;
  onStatus: (merchant: AdminMerchant, status: AdminMerchant["status"]) => void;
  onDelete: (merchant: AdminMerchant) => void;
}) {
  return <section><PanelIntro title="全站商家管理" description="超级管理员可暂停、恢复、关闭或删除任意商家。" icon={ShieldCheck} /><div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">{loading ? <TableSkeleton rows={5} /> : merchants.length === 0 ? <EmptyPanel title="暂无认证商家" description="审核通过的商家会显示在这里。" /> : <div className="divide-y divide-slate-100">{merchants.map((merchant) => <div key={merchant.id} className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e8eef2] text-[#667f98]"><Store size={21} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{merchant.storeNameCn}</p><span className={`rounded-full px-2 py-0.5 text-[10px] ${merchant.status === "active" ? "bg-[#edf4ef] text-[#5f816e]" : "bg-[#fff0ed] text-[#b96158]"}`}>{merchant.status === "active" ? "营业中" : merchant.status === "suspended" ? "已暂停" : "已关闭"}</span></div><p className="mt-1 text-xs text-slate-400">{merchant.username} · {merchant.phone} · {merchant.city}/{merchant.township}</p><p className="mt-1 text-[11px] text-slate-400">{merchant.productCount} 个商品 · {merchant.orderCount} 笔订单</p></div><div className="flex flex-wrap gap-2">{merchant.status !== "active" && <button type="button" disabled={actionLoading === `merchant-${merchant.id}`} onClick={() => onStatus(merchant, "active")} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500">恢复</button>}{merchant.status === "active" && <button type="button" disabled={actionLoading === `merchant-${merchant.id}`} onClick={() => onStatus(merchant, "suspended")} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500">暂停后台</button>}<button type="button" disabled={actionLoading === `merchant-${merchant.id}`} onClick={() => onStatus(merchant, "closed")} className="rounded-full border border-[#efd9d4] px-3 py-1.5 text-xs text-[#b96158]">关闭</button><button type="button" disabled={actionLoading === `merchant-${merchant.id}`} onClick={() => onDelete(merchant)} className="flex items-center gap-1 rounded-full border border-[#efd9d4] px-3 py-1.5 text-xs text-[#b96158]"><Trash2 size={12} />删除</button></div></div></div>)}</div>}</div></section>;
}

function AdminProductsPanel({products,loading,actionLoading,onUpdate,onDelete}:{products:AdminProduct[];loading:boolean;actionLoading:string|null;onUpdate:(product:AdminProduct,changes:Record<string,unknown>)=>void;onDelete:(product:AdminProduct)=>void}){
 const [editing,setEditing]=useState<AdminProduct|null>(null); const [rejecting,setRejecting]=useState<AdminProduct|null>(null);
 const labels:Record<string,string>={draft:"草稿",pending:"待审核",active:"销售中",rejected:"已拒绝",archived:"已下架"};
 return <section><PanelIntro title="全站商品管理" description="审核商家商品，并配置首页官方、热门推荐、猜你喜欢、优惠标签和排序。" icon={PackageSearch}/><div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">{loading?<TableSkeleton rows={6}/>:products.length===0?<EmptyPanel title="暂无商品" description="商家提交审核的商品会显示在这里。"/>:<div className="divide-y divide-slate-100">{products.map(p=><div key={p.id} className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="flex size-11 items-center justify-center rounded-xl bg-[#edf2f5] text-[#667f98]"><PackageSearch size={20}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.title}</p><p className="mt-1 text-xs text-slate-400">{p.storeNameCn} · {p.category} · 库存 {p.stock}</p><div className="mt-2 flex flex-wrap gap-1">{p.isOfficial&&<span className="rounded bg-[#e8eef2] px-2 py-1 text-[10px] text-[#607992]">官方</span>}{p.isFeatured&&<span className="rounded bg-[#fff0e8] px-2 py-1 text-[10px] text-[#aa7259]">热门推荐</span>}{p.isRecommended&&<span className="rounded bg-[#edf4ef] px-2 py-1 text-[10px] text-[#5f816e]">猜你喜欢</span>}{p.badge&&<span className="rounded bg-slate-100 px-2 py-1 text-[10px]">{p.badge}</span>}</div></div><b className="text-sm text-[#b47763]">Ks {Number(p.price).toLocaleString("zh-CN")}</b><span className="text-xs text-slate-400">{labels[p.status]}</span><div className="flex flex-wrap gap-2">{p.status==="pending"&&<><button disabled={actionLoading===`product-${p.id}`} onClick={()=>onUpdate(p,{status:"active"})} className="rounded-full bg-[#7189a1] px-3 py-2 text-xs text-white">审核通过</button><button onClick={()=>setRejecting(p)} className="rounded-full border border-[#efd9d4] px-3 py-2 text-xs text-[#b96158]">拒绝</button></>}{p.status==="active"&&<button onClick={()=>onUpdate(p,{status:"archived"})} className="rounded-full border px-3 py-2 text-xs">下架</button>}<button onClick={()=>setEditing(p)} className="rounded-full border px-3 py-2 text-xs">运营配置</button><button onClick={()=>onDelete(p)} className="rounded-full border border-[#efd9d4] px-3 py-2 text-xs text-[#b96158]">删除</button></div></div>{p.rejectionReason&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-600">拒绝原因：{p.rejectionReason}</p>}</div>)}</div>}</div>{editing&&<ProductOpsModal product={editing} onClose={()=>setEditing(null)} onSave={changes=>{onUpdate(editing,changes);setEditing(null)}}/>}{rejecting&&<ProductRejectModal product={rejecting} onClose={()=>setRejecting(null)} onSave={reason=>{onUpdate(rejecting,{status:"rejected",rejectionReason:reason});setRejecting(null)}}/>}</section>
}
function ProductRejectModal({product,onClose,onSave}:{product:AdminProduct;onClose:()=>void;onSave:(reason:string)=>void}){const[reason,setReason]=useState("");return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-5"><h3 className="font-bold">拒绝商品审核</h3><p className="mt-2 text-xs text-slate-400">{product.title}</p><textarea autoFocus rows={4} value={reason} onChange={e=>setReason(e.target.value.slice(0,1000))} placeholder="请填写明确的拒绝原因，商家修改时可看到" className="mt-4 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none"/><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={onClose} className="h-11 rounded-full bg-slate-100">取消</button><button disabled={!reason.trim()} onClick={()=>onSave(reason.trim())} className="h-11 rounded-full bg-[#bd6b60] text-white disabled:opacity-40">确认拒绝</button></div></div></div>}

function ProductOpsModal({product,onClose,onSave}:{product:AdminProduct;onClose:()=>void;onSave:(changes:Record<string,unknown>)=>void}){
 const [form,setForm]=useState({title:product.title,subtitle:product.subtitle||"",description:product.description,category:product.category,price:product.price,originalPrice:product.originalPrice||"",stock:String(product.stock),shippingFee:product.shippingFee||"0",freeShipping:product.freeShipping,images:(product.images||[]).join("\n"),tags:(product.tags||[]).join("、"),guarantees:(product.serviceGuarantees||[]).join("、"),specName:product.specifications?.[0]?.name||"",specValues:product.specifications?.[0]?.values?.join("、")||"",badge:product.badge||"",promotionTitle:product.promotionTitle||"",promotionStart:product.promotionStart?.slice(0,16)||"",promotionEnd:product.promotionEnd?.slice(0,16)||"",sortOrder:String(product.sortOrder||0),isOfficial:product.isOfficial,isFeatured:product.isFeatured,isRecommended:product.isRecommended});
 const submit=()=>onSave({...form,stock:Number(form.stock),price:Number(form.price),originalPrice:form.originalPrice?Number(form.originalPrice):null,shippingFee:Number(form.shippingFee),sortOrder:Number(form.sortOrder),images:form.images.split("\n").map(x=>x.trim()).filter(Boolean),tags:form.tags.split(/[、,，]/).map(x=>x.trim()).filter(Boolean),serviceGuarantees:form.guarantees.split(/[、,，]/).map(x=>x.trim()).filter(Boolean),specifications:form.specName&&form.specValues?[{name:form.specName,values:form.specValues.split(/[、,，]/).map(x=>x.trim()).filter(Boolean)}]:[]});
 const field=(label:string,key:keyof typeof form,type="text")=><label className="block text-xs text-slate-500">{label}<input type={type} value={String(form[key])} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none"/></label>;
 return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"><div className="max-h-[94vh] w-full max-w-2xl overflow-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"><div className="flex justify-between"><div><h3 className="font-bold">完整编辑商品</h3><p className="mt-1 text-xs text-slate-400">{product.storeNameCn} · 超级管理员可修改全部销售资料</p></div><button onClick={onClose}><X size={18}/></button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{field("标题","title")}{field("副标题","subtitle")}{field("分类","category")}{field("售价（Ks）","price","number")}{field("原价（Ks）","originalPrice","number")}{field("库存","stock","number")}{field("运费（Ks）","shippingFee","number")}{field("标签（顿号分隔）","tags")}{field("保障（顿号分隔）","guarantees")}{field("规格名称","specName")}{field("规格值（顿号分隔）","specValues")}{field("角标","badge")}{field("优惠文案","promotionTitle")}{field("优惠开始","promotionStart","datetime-local")}{field("优惠结束","promotionEnd","datetime-local")}{field("首页排序","sortOrder","number")}<label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">免运费<input type="checkbox" checked={form.freeShipping} onChange={e=>setForm({...form,freeShipping:e.target.checked})}/></label>{[["isOfficial","官方认证"],["isFeatured","热门推荐"],["isRecommended","猜你喜欢"]].map(([key,label])=><label key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">{label}<input type="checkbox" checked={form[key as "isOfficial"] as boolean} onChange={e=>setForm({...form,[key]:e.target.checked})}/></label>)}</div><label className="mt-3 block text-xs text-slate-500">商品详情<textarea rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none"/></label><label className="mt-3 block text-xs text-slate-500">图片 HTTPS 地址，每行一个<textarea rows={3} value={form.images} onChange={e=>setForm({...form,images:e.target.value})} className="mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none"/></label><button onClick={submit} className="mt-5 h-12 w-full rounded-full bg-[#7189a1] text-sm font-semibold text-white">保存全部商品资料</button></div></div>
}

function ReviewApplicationModal({
  dialog, loading, onClose, onSubmit,
}: {
  dialog: NonNullable<ReviewDialogState>;
  loading: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const rejecting = dialog.decision === "rejected";
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"><div className="w-full max-w-md rounded-3xl bg-white p-5"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">{rejecting ? "拒绝商家申请" : "通过商家申请"}</h3><button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8]"><X size={16} /></button></div><p className="mt-2 text-xs leading-5 text-slate-400">{dialog.application.storeNameCn || dialog.application.storeNameMm} · {rejecting ? "拒绝原因会发送给申请人" : "通过后会立即开通独立商家后台"}</p><label className="mt-4 block text-xs text-slate-500">{rejecting ? "拒绝原因 *" : "审核备注（可选）"}<textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 1000))} rows={4} className="mt-2 w-full resize-none rounded-xl bg-[#f4f6f8] p-3 text-sm outline-none" /></label><button type="button" disabled={loading || (rejecting && !note.trim())} onClick={() => onSubmit(note.trim())} className={`mt-4 h-11 w-full rounded-full text-sm font-semibold text-white disabled:opacity-50 ${rejecting ? "bg-[#bd6b60]" : "bg-[#7189a1]"}`}>{loading ? "处理中…" : rejecting ? "确认拒绝" : "确认通过并开通"}</button></div></div>;
}

function ConfirmModal({
  dialog, onClose, onConfirm,
}: {
  dialog: ConfirmDialogState;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-5"><h3 className="text-lg font-bold">{dialog.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{dialog.description}</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={onClose} className="h-11 rounded-full bg-[#f1f4f6] text-sm text-slate-500">取消</button><button type="button" disabled={submitting} onClick={async () => { setSubmitting(true); await onConfirm(); setSubmitting(false); }} className={`h-11 rounded-full text-sm font-semibold text-white disabled:opacity-50 ${dialog.danger ? "bg-[#bd6b60]" : "bg-[#7189a1]"}`}>{submitting ? "处理中…" : dialog.confirmLabel}</button></div></div></div>;
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
    <span className={`rounded-full px-2.5 py-1 text-[11px] ${
      role === "admin" ? "bg-[#e8eef2] text-[#627b94]"
        : role === "merchant" ? "bg-[#edf4ef] text-[#5f816e]"
        : "bg-[#f4f7f8] text-slate-400"
    }`}>
      {role === "admin" ? "管理员" : role === "merchant" ? "商家" : "普通用户"}
    </span>
  );
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] ${status === "active" ? "bg-[#edf4ef] text-[#5f816e]" : "bg-[#fff0ed] text-[#b96158]"}`}>{status === "active" ? "正常" : "已停用"}</span>;
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
