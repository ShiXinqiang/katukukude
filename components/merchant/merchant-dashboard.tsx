"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  PackagePlus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Store,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import type {
  AuthUser,
  MerchantOverview,
  MerchantProductRecord,
  MerchantRecord,
} from "../../lib/data";

import {StoreSettings} from "./store-settings";
import {AfterSalesPanel} from "../after-sales-panel";
import {ShippingDialog,ShipmentInfo,type Shipment} from "../order-shipment";
import { MerchantProductList } from "./product-list";
import { ProductEditor } from "./product-editor";
import { orderLabels } from "../../lib/order-rules";

type Section = "overview" | "products" | "orders" | "store" | "afterSales";
type MerchantOrder = {shipment?:Shipment;
  id: string; orderNo: string; status: string; paymentStatus: string;
  totalAmount: string; displayName: string | null; username: string | null;
  shippingName: string | null; shippingPhone: string | null;
  shippingAddress: string | null; createdAt: string; items: {title:string;spec:string;quantity:number}[];
};

const nav = [
  { key: "overview" as const, label: "首页", icon: Home },
  { key: "products" as const, label: "商品", icon: ShoppingBag },
  { key: "orders" as const, label: "订单", icon: ClipboardList },
  { key: "afterSales" as const, label: "售后", icon: ClipboardList },
  { key: "store" as const, label: "店铺", icon: Store },
];

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  const result = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(result.message || "请求失败");
  return result;
}

export function MerchantDashboard({ user, merchant }: { user: AuthUser; merchant: MerchantRecord }) {
  const [initialProductFilter,setInitialProductFilter]=useState("all");
  const [shippingOrder,setShippingOrder]=useState<string|null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [overview, setOverview] = useState<MerchantOverview>({ products: 0, activeProducts: 0, orders: 0, pendingOrders: 0, revenue: 0 });
  const [products, setProducts] = useState<MerchantProductRecord[]>([]);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<MerchantProductRecord | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<MerchantProductRecord | null>(null);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  const loadOverview = async () => {
    setLoading("overview");
    try {
      const result = await requestJson<{ overview: MerchantOverview }>("/api/merchant/overview");
      setOverview(result.overview);
    } catch (error) { setMessage(getMessage(error)); } finally { setLoading(""); }
  };
  const loadProducts = async () => {
    setLoading("products");
    try {
      const result = await requestJson<{ products: MerchantProductRecord[] }>("/api/merchant/products");
      setProducts(result.products);
    } catch (error) { setMessage(getMessage(error)); } finally { setLoading(""); }
  };
  const loadOrders = async () => {
    setLoading("orders");
    try {
      const result = await requestJson<{ orders: MerchantOrder[] }>("/api/merchant/orders");
      setOrders(result.orders);
    } catch (error) { setMessage(getMessage(error)); } finally { setLoading(""); }
  };

  useEffect(() => { void loadOverview(); }, []);
  useEffect(() => {
    if (section === "products") void loadProducts();
    if (section === "orders") void loadOrders();
  }, [section]);

  const updateProduct = async (product: MerchantProductRecord, action: "status" | "delete") => {

    setLoading(product.id);
    setMessage("");
    try {
      if (action === "delete") {
        await requestJson(`/api/merchant/products/${product.id}`, { method: "DELETE" });
        setMessage("商品已删除");
      } else {
        await requestJson(`/api/merchant/products/${product.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedUpdatedAt:product.updatedAt,action: ["active","pending"].includes(product.status) ? "archive" : "submit" }),
        });
        setMessage(["active","pending"].includes(product.status) ? "商品已下架 / 撤回" : "商品已提交平台审核");
      }
      await Promise.all([loadProducts(), loadOverview()]);
    } catch (error) { setMessage(getMessage(error)); } finally { setLoading(""); }
  };

  const updateOrder = async (id: string, action: string,shipment?:unknown) => {
    setLoading(id); setMessage("");
    try {
      await requestJson(`/api/merchant/orders/${id}`, {method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action,shipment})});
      await loadOrders();setShippingOrder(null);
      setMessage(action === "accept" ? "已接单，请准备商品或服务" : "已通知顾客发货或服务开始");
    } catch(error) { setMessage(getMessage(error)); } finally { setLoading(""); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.assign("/");
  };

  return (
    <main className="katu-dashboard min-h-screen bg-[#eef2f5] pb-24 text-slate-800">
      <header className="bg-[#667f98] px-4 pb-8 pt-8 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15"><Store size={23} /></span>
              <div><p className="text-lg font-bold">{merchant.storeNameCn}</p><p className="mt-1 text-[11px] text-white/65">{merchant.storeNameMm || "卡兔认证商家"}</p></div>
            </div>
            <a href="/" className="ml-auto mr-3 rounded-full border border-white/30 px-3 py-2 text-xs">返回前台</a><button type="button" onClick={logout} className="flex size-9 items-center justify-center rounded-full bg-white/10" aria-label="退出商家版"><LogOut size={18} /></button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-white/75"><CheckCircle2 size={15} /> 已认证 · {merchant.city} / {merchant.township}</div>
        </div>
      </header>

      <div className="pt-4 mx-auto max-w-5xl space-y-4 px-4">
        {message && <div className="flex items-center rounded-2xl bg-white px-4 py-3 text-xs text-[#667f98] shadow-sm">{message}<button type="button" onClick={() => setMessage("")} className="ml-auto"><X size={15} /></button></div>}

        {section === "overview" && (
          <section>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="商品总数" value={overview.products} icon={Boxes} />
              <Metric label="在售商品" value={overview.activeProducts} icon={ShoppingBag} />
              <Metric label="订单总数" value={overview.orders} icon={ClipboardList} />
              <Metric label="累计实收" value={`Ks ${overview.revenue.toLocaleString("zh-CN")}`} icon={WalletCards} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">{[["pending","待审核",overview.pendingProducts||0],["lowStock","库存预警",overview.lowStock||0],["afterSales","待处理售后",overview.afterSales||0]].map(([key,label,count])=><button key={key} onClick={()=>{if(key==="afterSales")setSection("afterSales");else{setInitialProductFilter(String(key));setSection("products")}}} className="rounded-2xl bg-white p-3 text-left"><span className="text-xs text-slate-500">{label}</span><b className="mt-2 block text-xl">{count}</b></button>)}</div>
            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between"><div><h2 className="font-bold">今日经营</h2><p className="mt-1 text-xs text-slate-400">店铺经营数据实时更新</p></div><button type="button" aria-label="刷新经营数据" onClick={() => void loadOverview()} className="flex size-9 items-center justify-center rounded-full bg-[#f2f5f7] text-[#7189a1]"><RefreshCw size={16} className={loading === "overview" ? "animate-spin" : ""} /></button></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f5f7f8] p-4"><p className="text-xs text-slate-400">待处理订单</p><p className="mt-2 text-2xl font-bold">{overview.pendingOrders}</p></div><button type="button" onClick={() => setSection("products")} className="rounded-xl bg-[#e8eef2] p-4 text-left"><p className="text-xs text-[#7189a1]">商品管理</p><p className="mt-2 flex items-center text-sm font-semibold text-[#607992]">发布新商品 <ChevronRight size={15} /></p></button></div>
            </section>
          </section>
        )}

        {section === "products" && (
          <section>
            <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">商品管理</h1><p className="mt-1 text-xs text-slate-400">商品只属于当前店铺</p></div><button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-full bg-[#7189a1] px-4 py-2.5 text-xs font-semibold text-white"><PackagePlus size={16} />发布商品</button></div>
            <MerchantProductList initialStatus={initialProductFilter} products={products} loading={loading} onEdit={setEditing} onAction={p=>void updateProduct(p,"status")} onDelete={setDeleteCandidate} onReload={()=>void loadProducts()}/>
          </section>
        )}

        {section === "orders" && (
          <section>
            <div><h1 className="text-xl font-bold">店铺订单</h1><p className="mt-1 text-xs text-slate-400">只显示归属于当前店铺的真实订单</p></div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
              {loading === "orders" ? <LoadingRows /> : orders.length === 0 ? <Empty title="暂无订单" description="顾客下单后会显示在这里。" /> : <div className="divide-y divide-slate-100">{orders.map((order) => <div key={order.id} className="p-4"><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold">{order.orderNo}</p><p className="mt-1 text-xs text-slate-400">{order.displayName || order.username || "顾客"} · {new Date(order.createdAt).toLocaleString("zh-CN")}</p></div><p className="text-sm font-bold text-[#b47763]">Ks {Number(order.totalAmount).toLocaleString("zh-CN")}</p></div><div className="mt-3 rounded-xl bg-[#f6f8f9] p-3 text-xs text-slate-500"><p>{order.shippingName || "未填写收货人"} · {order.shippingPhone || "未填写电话"}</p><p className="mt-1 text-slate-400">{order.shippingAddress || "未填写配送地址"}</p></div><div className="mt-3 space-y-2 text-xs">{Array.isArray(order.items)&&order.items.map((item,i)=><p key={i}>{item.title} · {item.spec} × {item.quantity}</p>)}</div><ShipmentInfo shipment={order.shipment}/><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{orderLabels[order.status]||order.status}</span>{order.paymentStatus === "paid" && ["paid","processing"].includes(order.status) && <button disabled={!!loading} onClick={()=>order.status === "paid"?void updateOrder(order.id,"accept"):(setMessage(""),setShippingOrder(order.id))} className="rounded-full bg-[#7189a1] px-4 py-2 text-xs text-white disabled:opacity-50">{loading===order.id?"处理中…":order.status==="paid"?"接单":"确认发货 / 开始服务"}</button>}</div></div>)}</div>}
            </div>
          </section>
        )}

        {section === "afterSales"&&<AfterSalesPanel mode="merchant"/>}
        {section === "store" && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-[#e8eef2] text-[#7189a1]"><Store size={23} /></span><div><h1 className="font-bold">{merchant.storeNameCn}</h1><p className="mt-1 text-xs text-slate-400">{merchant.businessType}</p></div></div>
            <div className="mt-5 divide-y divide-slate-100 text-sm"><StoreRow label="经营者账号" value={user.username} /><StoreRow label="地区" value={`${merchant.stateRegion} · ${merchant.city} · ${merchant.township}`} /><StoreRow label="详细地址" value={merchant.address} /></div>
            <StoreSettings phone={merchant.phone} description={merchant.description}/><p className="mt-5 rounded-xl bg-[#f5f7f8] p-3 text-xs leading-5 text-slate-400">需要修改认证主体、店铺名称或经营地址时，请联系平台管理员重新审核。</p>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-5xl -translate-x-1/2 grid-cols-5 border-t border-slate-100 bg-white/95 px-3 pb-3 pt-2 backdrop-blur">{nav.map(({ key, label, icon: Icon }) => <button type="button" key={key} onClick={() => setSection(key)} className={`flex flex-col items-center gap-1 text-[10px] ${section === key ? "text-[#667f98]" : "text-slate-400"}`}><Icon size={20} /><span>{label}</span></button>)}</nav>

      {shippingOrder&&<ShippingDialog error={message} busy={!!loading} onClose={()=>setShippingOrder(null)} onSubmit={value=>void updateOrder(shippingOrder,"ship",value)}/>}
      {showCreate && <ProductEditor onClose={() => setShowCreate(false)} onSaved={async () => { setShowCreate(false); await Promise.all([loadProducts(), loadOverview()]); setMessage("商品草稿已保存或已提交审核"); }} />}{editing && <ProductEditor product={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await Promise.all([loadProducts(), loadOverview()]); setMessage("商品资料已更新"); }} />}{deleteCandidate && <div role="dialog" aria-modal="true" className="katu-dashboard-dialog fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-5"><h3 className="font-bold">删除商品</h3><p className="mt-2 text-sm text-slate-500">确定删除“{deleteCandidate.title}”吗？此操作不可撤销。</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>setDeleteCandidate(null)} className="h-11 rounded-full bg-slate-100">取消</button><button onClick={async()=>{const p=deleteCandidate;setDeleteCandidate(null);await updateProduct(p,"delete")}} className="h-11 rounded-full bg-[#bd6b60] text-white">确认删除</button></div></div></div>}
    </main>
  );
}


function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof BarChart3 }) { return <div className="rounded-2xl bg-white p-4 shadow-sm"><Icon size={20} className="text-[#7189a1]" /><p className="mt-4 text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
function StoreRow({ label, value }: { label: string; value: string }) { return <div className="py-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 leading-6 text-slate-600">{value}</p></div>; }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-xs text-slate-500">{label}<input required type={type} min={type === "number" ? "0" : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl bg-[#f4f6f8] px-3 py-3 text-sm outline-none" /></label>; }
function LoadingRows() { return <div className="space-y-3 p-4">{[1,2,3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>; }
function Empty({ title, description }: { title: string; description: string }) { return <div className="px-5 py-16 text-center"><ShoppingBag size={32} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">{title}</p><p className="mt-1 text-xs text-slate-400">{description}</p></div>; }
function getMessage(error: unknown) { return error instanceof Error ? error.message : "请求失败"; }
