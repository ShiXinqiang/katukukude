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

type Section = "overview" | "products" | "orders" | "store";
type MerchantOrder = {
  id: string; orderNo: string; status: string; paymentStatus: string;
  totalAmount: string; displayName: string | null; username: string | null;
  shippingName: string | null; shippingPhone: string | null;
  shippingAddress: string | null; createdAt: string;
};

const nav = [
  { key: "overview" as const, label: "首页", icon: Home },
  { key: "products" as const, label: "商品", icon: ShoppingBag },
  { key: "orders" as const, label: "订单", icon: ClipboardList },
  { key: "store" as const, label: "店铺", icon: Store },
];

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  const result = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(result.message || "请求失败");
  return result;
}

export function MerchantDashboard({ user, merchant }: { user: AuthUser; merchant: MerchantRecord }) {
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
          body: JSON.stringify({ action: product.status === "active" ? "archive" : "submit" }),
        });
        setMessage(product.status === "active" ? "商品已下架" : "商品已提交平台审核");
      }
      await Promise.all([loadProducts(), loadOverview()]);
    } catch (error) { setMessage(getMessage(error)); } finally { setLoading(""); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.assign("/");
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] pb-24 text-slate-800">
      <header className="bg-[#667f98] px-4 pb-8 pt-8 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15"><Store size={23} /></span>
              <div><p className="text-lg font-bold">{merchant.storeNameCn}</p><p className="mt-1 text-[11px] text-white/65">{merchant.storeNameMm || "卡兔认证商家"}</p></div>
            </div>
            <button type="button" onClick={logout} className="flex size-9 items-center justify-center rounded-full bg-white/10" aria-label="退出商家版"><LogOut size={18} /></button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-white/75"><CheckCircle2 size={15} /> 已认证 · {merchant.city} / {merchant.township}</div>
        </div>
      </header>

      <div className="-mt-4 mx-auto max-w-5xl space-y-4 px-4">
        {message && <div className="flex items-center rounded-2xl bg-white px-4 py-3 text-xs text-[#667f98] shadow-sm">{message}<button type="button" onClick={() => setMessage("")} className="ml-auto"><X size={15} /></button></div>}

        {section === "overview" && (
          <section>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="商品总数" value={overview.products} icon={Boxes} />
              <Metric label="在售商品" value={overview.activeProducts} icon={ShoppingBag} />
              <Metric label="订单总数" value={overview.orders} icon={ClipboardList} />
              <Metric label="累计实收" value={`Ks ${overview.revenue.toLocaleString("zh-CN")}`} icon={WalletCards} />
            </div>
            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between"><div><h2 className="font-bold">今日经营</h2><p className="mt-1 text-xs text-slate-400">店铺数据实时来自 Supabase</p></div><button type="button" onClick={() => void loadOverview()} className="flex size-9 items-center justify-center rounded-full bg-[#f2f5f7] text-[#7189a1]"><RefreshCw size={16} className={loading === "overview" ? "animate-spin" : ""} /></button></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f5f7f8] p-4"><p className="text-xs text-slate-400">待处理订单</p><p className="mt-2 text-2xl font-bold">{overview.pendingOrders}</p></div><button type="button" onClick={() => setSection("products")} className="rounded-xl bg-[#e8eef2] p-4 text-left"><p className="text-xs text-[#7189a1]">商品管理</p><p className="mt-2 flex items-center text-sm font-semibold text-[#607992]">发布新商品 <ChevronRight size={15} /></p></button></div>
            </section>
          </section>
        )}

        {section === "products" && (
          <section>
            <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">商品管理</h1><p className="mt-1 text-xs text-slate-400">商品只属于当前店铺</p></div><button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-full bg-[#7189a1] px-4 py-2.5 text-xs font-semibold text-white"><PackagePlus size={16} />发布商品</button></div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
              {loading === "products" ? <LoadingRows /> : products.length === 0 ? <Empty title="还没有商品" description="点击发布商品建立店铺商品库。" /> : <div className="divide-y divide-slate-100">{products.map((product) => <div key={product.id} className="p-4"><div className="flex gap-3"><span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#edf1f3] text-[#7189a1]"><ShoppingBag size={22} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.title}</p><p className="mt-1 text-xs text-slate-400">{product.category} · 库存 {product.stock}</p><p className="mt-2 text-sm font-bold text-[#b47763]">Ks {Number(product.price).toLocaleString("zh-CN")}</p></div><span className={`h-fit rounded-full px-2.5 py-1 text-[10px] ${product.status === "active" ? "bg-[#edf5ef] text-[#5e816d]" : "bg-[#f2f4f5] text-slate-400"}`}>{product.status === "active" ? "销售中" : product.status === "pending" ? "审核中" : product.status === "rejected" ? "审核拒绝" : product.status === "draft" ? "草稿" : "已下架"}</span></div><div className="mt-3 flex justify-end gap-2"><button type="button" disabled={loading === product.id} onClick={() => void updateProduct(product, "status")} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500">{product.status === "active" ? "下架" : product.status === "pending" ? "审核中" : "提交审核"}</button><button type="button" onClick={() => setEditing(product)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500">编辑</button><button type="button" disabled={loading === product.id || product.status === "active" || product.status === "pending"} onClick={() => setDeleteCandidate(product)} className="flex items-center gap-1 rounded-full border border-[#f1d9d4] px-3 py-1.5 text-xs text-[#bf7165]"><Trash2 size={13} />删除</button></div></div>)}</div>}
            </div>
          </section>
        )}

        {section === "orders" && (
          <section>
            <div><h1 className="text-xl font-bold">店铺订单</h1><p className="mt-1 text-xs text-slate-400">只显示归属于当前店铺的真实订单</p></div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
              {loading === "orders" ? <LoadingRows /> : orders.length === 0 ? <Empty title="暂无订单" description="顾客下单后会显示在这里。" /> : <div className="divide-y divide-slate-100">{orders.map((order) => <div key={order.id} className="p-4"><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold">{order.orderNo}</p><p className="mt-1 text-xs text-slate-400">{order.displayName || order.username || "顾客"} · {new Date(order.createdAt).toLocaleString("zh-CN")}</p></div><p className="text-sm font-bold text-[#b47763]">Ks {Number(order.totalAmount).toLocaleString("zh-CN")}</p></div><div className="mt-3 rounded-xl bg-[#f6f8f9] p-3 text-xs text-slate-500"><p>{order.shippingName || "未填写收货人"} · {order.shippingPhone || "未填写电话"}</p><p className="mt-1 text-slate-400">{order.shippingAddress || "未填写配送地址"}</p></div></div>)}</div>}
            </div>
          </section>
        )}

        {section === "store" && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-[#e8eef2] text-[#7189a1]"><Store size={23} /></span><div><h1 className="font-bold">{merchant.storeNameCn}</h1><p className="mt-1 text-xs text-slate-400">{merchant.businessType}</p></div></div>
            <div className="mt-5 divide-y divide-slate-100 text-sm"><StoreRow label="经营者账号" value={user.username} /><StoreRow label="联系电话" value={merchant.phone} /><StoreRow label="地区" value={`${merchant.stateRegion} · ${merchant.city} · ${merchant.township}`} /><StoreRow label="详细地址" value={merchant.address} /><StoreRow label="店铺介绍" value={merchant.description} /></div>
            <p className="mt-5 rounded-xl bg-[#f5f7f8] p-3 text-xs leading-5 text-slate-400">需要修改认证主体、店铺名称或经营地址时，请联系平台管理员重新审核。</p>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-5xl -translate-x-1/2 grid-cols-4 border-t border-slate-100 bg-white/95 px-3 pb-3 pt-2 backdrop-blur">{nav.map(({ key, label, icon: Icon }) => <button type="button" key={key} onClick={() => setSection(key)} className={`flex flex-col items-center gap-1 text-[10px] ${section === key ? "text-[#667f98]" : "text-slate-400"}`}><Icon size={20} /><span>{label}</span></button>)}</nav>

      {showCreate && <ProductEditor onClose={() => setShowCreate(false)} onSaved={async () => { setShowCreate(false); await Promise.all([loadProducts(), loadOverview()]); setMessage("商品草稿已保存或已提交审核"); }} />}{editing && <ProductEditor product={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await Promise.all([loadProducts(), loadOverview()]); setMessage("商品资料已更新"); }} />}{deleteCandidate && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-5"><h3 className="font-bold">删除商品</h3><p className="mt-2 text-sm text-slate-500">确定删除“{deleteCandidate.title}”吗？此操作不可撤销。</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>setDeleteCandidate(null)} className="h-11 rounded-full bg-slate-100">取消</button><button onClick={async()=>{const p=deleteCandidate;setDeleteCandidate(null);await updateProduct(p,"delete")}} className="h-11 rounded-full bg-[#bd6b60] text-white">确认删除</button></div></div></div>}
    </main>
  );
}

function ProductEditor({product,onClose,onSaved}:{product?:MerchantProductRecord;onClose:()=>void;onSaved:()=>void}){
 const [form,setForm]=useState({title:product?.title||"",subtitle:product?.subtitle||"",description:product?.description||"",category:product?.category||"",price:product?.price||"",originalPrice:product?.originalPrice||"",stock:String(product?.stock??""),shippingFee:product?.shippingFee||"0",freeShipping:product?.freeShipping||false,tags:(product?.tags||[]).join("、"),guarantees:(product?.serviceGuarantees||[]).join("、"),images:(product?.images||[]).join("\n"),promotionTitle:product?.promotionTitle||"",promotionStart:product?.promotionStart?.slice(0,16)||"",promotionEnd:product?.promotionEnd?.slice(0,16)||"",specName:product?.specifications?.[0]?.name||"",specValues:product?.specifications?.[0]?.values?.join("、")||""});
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 const save=async(publish:boolean)=>{setSaving(true);setError("");const body={...form,publish,action:publish?"submit":undefined,tags:form.tags.split(/[、,，]/).map(x=>x.trim()).filter(Boolean),serviceGuarantees:form.guarantees.split(/[、,，]/).map(x=>x.trim()).filter(Boolean),images:form.images.split("\n").map(x=>x.trim()).filter(Boolean),specifications:form.specName&&form.specValues?[{name:form.specName,values:form.specValues.split(/[、,，]/).map(x=>x.trim()).filter(Boolean)}]:[]};try{await requestJson(product?`/api/merchant/products/${product.id}`:"/api/merchant/products",{method:product?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});onSaved()}catch(e){setError(getMessage(e))}finally{setSaving(false)}};
 return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center"><div className="max-h-[94vh] w-full max-w-xl overflow-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"><div className="flex justify-between"><div><h2 className="text-lg font-bold">{product?"编辑商品":"发布商品"}</h2><p className="mt-1 text-xs text-slate-400">提交后由平台审核，运营标签由超级管理员配置</p></div><button onClick={onClose}><X size={18}/></button></div>{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><Input label="商品名称（至少4字）" value={form.title} onChange={v=>setForm({...form,title:v})}/><Input label="简短卖点" value={form.subtitle} onChange={v=>setForm({...form,subtitle:v})}/><Input label="分类" value={form.category} onChange={v=>setForm({...form,category:v})}/><Input label="销售价（Ks）" type="number" value={form.price} onChange={v=>setForm({...form,price:v})}/><Input label="划线原价（可选）" type="number" value={form.originalPrice} onChange={v=>setForm({...form,originalPrice:v})}/><Input label="库存" type="number" value={form.stock} onChange={v=>setForm({...form,stock:v})}/><Input label="运费（Ks）" type="number" value={form.shippingFee} onChange={v=>setForm({...form,shippingFee:v})}/><label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs"><input type="checkbox" checked={form.freeShipping} onChange={e=>setForm({...form,freeShipping:e.target.checked})}/>免运费</label><Input label="促销标题（可选）" value={form.promotionTitle} onChange={v=>setForm({...form,promotionTitle:v})}/><Input label="促销开始时间" type="datetime-local" value={form.promotionStart} onChange={v=>setForm({...form,promotionStart:v})}/><Input label="促销结束时间" type="datetime-local" value={form.promotionEnd} onChange={v=>setForm({...form,promotionEnd:v})}/><Input label="标签（顿号分隔）" value={form.tags} onChange={v=>setForm({...form,tags:v})}/><Input label="保障（顿号分隔）" value={form.guarantees} onChange={v=>setForm({...form,guarantees:v})}/><Input label="规格名称（可选）" value={form.specName} onChange={v=>setForm({...form,specName:v})}/><Input label="规格值（顿号分隔）" value={form.specValues} onChange={v=>setForm({...form,specValues:v})}/></div><label className="mt-3 block text-xs text-slate-500">商品说明（至少10字）<textarea rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1.5 w-full rounded-xl bg-[#f4f6f8] p-3 text-sm outline-none"/></label><label className="mt-3 block text-xs text-slate-500">商品图片 HTTPS 地址，每行一个<textarea rows={3} value={form.images} onChange={e=>setForm({...form,images:e.target.value})} className="mt-1.5 w-full rounded-xl bg-[#f4f6f8] p-3 text-sm outline-none"/></label><div className="mt-5 grid grid-cols-2 gap-2"><button disabled={saving} onClick={()=>save(false)} className="h-12 rounded-full bg-slate-100 text-sm">保存草稿</button><button disabled={saving} onClick={()=>save(true)} className="h-12 rounded-full bg-[#7189a1] text-sm font-semibold text-white">{saving?"保存中…":"提交审核"}</button></div></div></div>
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof BarChart3 }) { return <div className="rounded-2xl bg-white p-4 shadow-sm"><Icon size={20} className="text-[#7189a1]" /><p className="mt-4 text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
function StoreRow({ label, value }: { label: string; value: string }) { return <div className="py-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 leading-6 text-slate-600">{value}</p></div>; }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-xs text-slate-500">{label}<input required type={type} min={type === "number" ? "0" : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl bg-[#f4f6f8] px-3 py-3 text-sm outline-none" /></label>; }
function LoadingRows() { return <div className="space-y-3 p-4">{[1,2,3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>; }
function Empty({ title, description }: { title: string; description: string }) { return <div className="px-5 py-16 text-center"><ShoppingBag size={32} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">{title}</p><p className="mt-1 text-xs text-slate-400">{description}</p></div>; }
function getMessage(error: unknown) { return error instanceof Error ? error.message : "请求失败"; }
