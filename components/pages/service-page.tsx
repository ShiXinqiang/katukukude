
"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, ChevronDown,
  Clock3, Coffee, Compass, CreditCard, Filter, Gift, Home, Hotel,
  MapPin, Navigation, Package, Phone, Plane, Plus, Search, ShieldCheck,
  ShoppingBag, ShoppingBasket, SlidersHorizontal, Star, Store, Tag,
  Ticket, TrainFront, Utensils, WalletCards, X, Zap
} from "lucide-react";
import type { ProductData } from "../../lib/data";
import { catalogProducts, formatMoney } from "../../lib/data";
import { SkeletonImage } from "../ui";

type ServiceProps = {
  title?: string;
  onBack: () => void;
  onProduct: (id: string) => void;
  onService?: (name: string) => void;
};

const restaurants = [
  { name: "Golden Yangon Kitchen", type: "缅甸菜 · 中餐 · 1.2km", score: "4.8", time: "25–35 分钟", tone: "午餐热卖" },
  { name: "上海小馆", type: "家常菜 · 面点 · 2.1km", score: "4.7", time: "30–45 分钟", tone: "新客立减" },
  { name: "Mingalar Tea House", type: "茶饮 · 小吃 · 0.8km", score: "4.9", time: "20–30 分钟", tone: "满减优惠" }
];

const hotelItems = [
  { name: "Yangon City Stay", detail: "市中心 · 含早餐 · 可免费取消", score: "4.9", price: "88,000" },
  { name: "仰光河畔精品酒店", detail: "河景房 · 双人入住 · 免费 Wi-Fi", score: "4.8", price: "126,000" },
  { name: "Mandalay Garden Hotel", detail: "安静庭院 · 接送机 · 中文服务", score: "4.7", price: "74,000" }
];

const travelItems = [
  { title: "仰光城市漫游", detail: "大金塔 · 茵雅湖 · 本地美食", price: "¥ 299 起" },
  { title: "蒲甘日出两日游", detail: "古城寺庙 · 日出观景 · 中文向导", price: "¥ 699 起" },
  { title: "曼德勒文化体验", detail: "乌本桥 · 皇宫 · 手工艺村", price: "¥ 499 起" }
];

function PageShell({ title, children, dark = false, onBack }: { title: string; children: ReactNode; dark?: boolean; onBack: () => void }) {
  return <main className={dark ? "min-h-screen bg-[#17232d] text-white" : "min-h-screen bg-[#f5f7f9] text-slate-800"}>
    <header className={dark ? "sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#17232d]/95 px-4 py-3 backdrop-blur" : "sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur"}>
      <button type="button" onClick={onBack} aria-label="返回" className={dark ? "flex size-10 items-center justify-center rounded-full bg-white/10" : "flex size-10 items-center justify-center rounded-full bg-slate-50"}><ArrowLeft size={20}/></button>
      <h1 className="flex-1 text-center text-[17px] font-bold">{title}</h1>
      <span className="size-10"/>
    </header>
    {children}
  </main>;
}

function ProductRow({ product, onProduct }: { product: ProductData; onProduct: (id: string) => void }) {
  return <button type="button" onClick={() => onProduct(product.id)} className="flex w-full gap-3 rounded-3xl bg-white p-2.5 text-left shadow-sm active:scale-[.99]">
    <SkeletonImage className="h-24 w-24 shrink-0 rounded-2xl" label={product.imageLabel}/>
    <span className="min-w-0 flex-1 py-1"><b className="line-clamp-2 text-sm text-slate-800">{product.title}</b><span className="mt-2 block text-xs text-slate-400">{product.store} · {product.distance}</span><span className="mt-2 flex items-center justify-between"><strong className="text-[#d96f68]">{formatMoney(product.price)}</strong><span className="text-[10px] text-slate-400">{product.sales}</span></span></span>
  </button>;
}

function FoodDeliveryPage({ onBack, onProduct }: ServiceProps) {
  const [filter, setFilter] = useState("附近");
  return <PageShell title="外卖" onBack={onBack}><section className="bg-[#7189a1] px-5 pb-6 pt-5 text-white"><div className="flex items-center gap-2 text-sm"><MapPin size={17}/>仰光 Yangon<ChevronDown size={15}/></div><h2 className="mt-5 text-2xl font-bold">今天吃点什么？</h2><div className="mt-4 flex items-center rounded-2xl bg-white px-3 py-3 text-slate-400"><Search size={17}/><span className="ml-2 text-sm">搜索餐厅或菜品</span></div></section><div className="scrollbar-hidden flex gap-2 overflow-x-auto px-4 py-4">{["附近","销量高","评分高","配送快","优惠多"].map(x=><button key={x} type="button" onClick={()=>setFilter(x)} className={filter===x?"rounded-full bg-[#7189a1] px-4 py-2 text-xs font-semibold text-white":"rounded-full bg-white px-4 py-2 text-xs text-slate-500"}>{x}</button>)}</div><section className="px-4"><div className="mb-3 flex items-center justify-between"><b>附近热门餐厅</b><span className="text-xs text-slate-400">{filter}优先</span></div><div className="space-y-3">{restaurants.map((item,index)=><article key={item.name} className="rounded-3xl bg-white p-3 shadow-sm"><div className="flex gap-3"><SkeletonImage className="h-24 w-24 shrink-0 rounded-2xl" label={"餐厅图片 "+(index+1)}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="truncate text-sm font-bold">{item.name}</h3><p className="mt-1 text-[11px] text-slate-400">{item.type}</p></div><span className="flex items-center gap-1 text-xs text-[#b48450]"><Star size={12} fill="currentColor"/>{item.score}</span></div><div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><span className="flex items-center gap-1"><Clock3 size={13}/>{item.time}</span><span className="rounded bg-[#f6ece5] px-2 py-1 text-[#b87961]">{item.tone}</span></div></div></div><button type="button" onClick={()=>onProduct(catalogProducts[index%catalogProducts.length]?.id || "demo-food-1")} className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl bg-[#f1f4f5] py-2.5 text-xs font-semibold text-[#607d96]">查看菜单<ArrowRight size={14}/></button></article>)}</div></section></PageShell>;
}

function RidePage({ onBack }: ServiceProps) {
  const [ride, setRide] = useState("舒适快车");
  const [requested, setRequested] = useState(false);
  return <PageShell title="打车" onBack={onBack}><section className="bg-[#263846] px-4 pb-5 pt-4 text-white"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm"><MapPin size={17}/>仰光 Yangon</span><button type="button" className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs"><Clock3 size={14}/>行程记录</button></div><div className="relative mt-4 h-52 overflow-hidden rounded-3xl bg-[#506576]"><div className="absolute inset-0 opacity-40" style={{backgroundImage:"linear-gradient(35deg,transparent 48%,#d3dde2 49%,#d3dde2 51%,transparent 52%),linear-gradient(125deg,transparent 47%,#d3dde2 48%,#d3dde2 51%,transparent 52%)",backgroundSize:"70px 70px"}}/><span className="absolute left-[42%] top-[40%] flex size-10 items-center justify-center rounded-full bg-[#7189a1] shadow-lg"><Navigation size={19}/></span><span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-2 text-xs text-slate-700">定位已开启</span></div></section><section className="-mt-2 rounded-t-[28px] bg-[#f5f7f9] px-4 pb-7 pt-5"><div className="rounded-3xl bg-white p-4 shadow-sm"><div className="flex gap-3"><div className="flex flex-col items-center pt-1"><span className="size-2.5 rounded-full bg-[#7189a1]"/><span className="my-1 h-8 border-l border-dashed border-slate-300"/><span className="size-2.5 rounded-full bg-[#d96f68]"/></div><div className="flex-1"><button type="button" className="flex w-full items-center justify-between border-b border-slate-100 pb-3 text-left"><span><small className="block text-[10px] text-slate-400">出发地</small><b className="text-sm">当前位置</b></span><ChevronDown size={17} className="text-slate-400"/></button><button type="button" className="flex w-full items-center justify-between pt-3 text-left"><span><small className="block text-[10px] text-slate-400">目的地</small><b className="text-sm text-slate-400">输入要去哪里</b></span><ChevronDown size={17} className="text-slate-400"/></button></div></div></div><div className="mt-4 space-y-2">{["舒适快车","普通快车","六座商务车"].map((name,index)=><button type="button" key={name} onClick={()=>setRide(name)} className={ride===name?"flex w-full items-center justify-between rounded-2xl border border-[#7189a1] bg-[#eef3f5] p-3 text-left":"flex w-full items-center justify-between rounded-2xl border border-transparent bg-white p-3 text-left"}><span className="flex items-center gap-3"><CarFront size={22} className="text-[#7189a1]"/><span><b className="block text-sm">{name}</b><span className="mt-1 block text-[11px] text-slate-400">{index===0?"最快接驾 · 约 3 分钟":index===1?"经济实惠 · 约 5 分钟":"适合多人出行"}</span></span></span><b className="text-sm text-slate-800">Ks {index===0?"6,500":index===1?"4,800":"9,800"}</b></button>)}</div><button type="button" onClick={()=>setRequested(true)} className="mt-5 w-full rounded-2xl bg-[#7189a1] py-4 text-sm font-bold text-white">{requested?"正在为你寻找司机":"确认叫车"}</button></section></PageShell>;
}

function SupermarketPage({ onBack, onProduct }: ServiceProps) {
  const [category, setCategory] = useState("推荐");
  return <PageShell title="超市" onBack={onBack}><section className="px-4 pb-3 pt-4"><div className="flex items-center rounded-2xl bg-white px-3 py-3 shadow-sm"><Search size={17} className="text-slate-400"/><span className="ml-2 text-sm text-slate-400">搜索商品、品牌</span><SlidersHorizontal size={17} className="ml-auto text-slate-500"/></div><div className="mt-4 grid grid-cols-4 gap-2">{[["新鲜果蔬",ShoppingBasket],["粮油调味",Package],["饮料零食",Coffee],["日用百货",ShoppingBag]].map(([name,Icon])=><button type="button" key={String(name)} className="flex flex-col items-center gap-2 rounded-2xl bg-white py-3 text-[11px] text-slate-600 shadow-sm"><span className="flex size-9 items-center justify-center rounded-xl bg-[#edf2f5] text-[#7189a1]">{Icon && <Icon size={18}/>}</span>{String(name)}</button>)}</div></section><section className="mt-2 bg-[#e9f0f2] px-4 py-5"><div className="flex items-end justify-between"><div><span className="text-xs text-[#6e879d]">今日专享</span><h2 className="mt-1 text-xl font-bold text-slate-800">新鲜到家</h2><p className="mt-1 text-xs text-slate-500">满 Ks 50,000 免配送费</p></div><Zap size={31} className="text-[#7893a7]"/></div></section><div className="scrollbar-hidden flex gap-2 overflow-x-auto px-4 py-4">{["推荐","热销","新鲜","折扣"].map(x=><button type="button" key={x} onClick={()=>setCategory(x)} className={category===x?"rounded-full bg-[#7189a1] px-4 py-2 text-xs text-white":"rounded-full bg-white px-4 py-2 text-xs text-slate-500"}>{x}</button>)}</div><section className="space-y-3 px-4">{catalogProducts.map(p=><ProductRow key={p.id} product={p} onProduct={onProduct}/>)}</section></PageShell>;
}

function HotelPage({ onBack }: ServiceProps) {
  const [nights, setNights] = useState(1);
  const [booked, setBooked] = useState(false);
  return <PageShell title="酒店" onBack={onBack}><section className="bg-[#e9e5dc] px-4 pb-7 pt-5"><div className="flex items-center gap-2 text-xs text-slate-600"><MapPin size={15}/>仰光 Yangon<ChevronDown size={14}/></div><h2 className="mt-4 text-2xl font-bold text-slate-800">住得舒服，也住得安心</h2><div className="mt-4 rounded-3xl bg-white p-4 shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><Hotel size={20} className="text-[#a78c63]"/><span><b className="block text-sm">入住城市</b><span className="mt-1 block text-xs text-slate-400">仰光 · 选择区域</span></span><ChevronDown size={17} className="ml-auto text-slate-400"/></div><div className="grid grid-cols-2 gap-3 pt-4"><button type="button" className="text-left"><span className="block text-[10px] text-slate-400">入住 / 离店</span><span className="mt-1 flex items-center gap-1 text-sm font-semibold"><CalendarDays size={15}/>今天起 · {nights} 晚</span></button><button type="button" onClick={()=>setNights(nights===3?1:nights+1)} className="border-l border-slate-100 pl-3 text-left"><span className="block text-[10px] text-slate-400">房间与住客</span><span className="mt-1 flex items-center gap-1 text-sm font-semibold"><Plus size={15}/>1 间 · 2 位</span></button></div></div></section><div className="flex items-center justify-between px-4 py-4"><b>精选住宿</b><button type="button" className="flex items-center gap-1 text-xs text-slate-400">筛选<Filter size={14}/></button></div><section className="space-y-3 px-4">{hotelItems.map((item,index)=><article key={item.name} className="rounded-3xl bg-white p-2.5 shadow-sm"><div className="flex gap-3"><SkeletonImage className="h-28 w-28 shrink-0 rounded-2xl" label={"酒店图片 "+(index+1)}/><div className="min-w-0 flex-1 py-1"><h3 className="truncate text-sm font-bold">{item.name}</h3><p className="mt-2 line-clamp-2 text-xs text-slate-400">{item.detail}</p><span className="mt-2 flex items-center gap-1 text-xs text-[#b48450]"><Star size={12} fill="currentColor"/>{item.score}<span className="ml-2 text-slate-400">很好</span></span><div className="mt-2 flex items-end justify-between"><b className="text-[#d96f68]">Ks {item.price}</b><button type="button" onClick={()=>setBooked(true)} className="rounded-full bg-[#7189a1] px-3 py-1.5 text-[11px] font-semibold text-white">预订</button></div></div></div></article>)}</section>{booked&&<div className="fixed bottom-24 left-1/2 z-30 w-[calc(100%-32px)] max-w-[358px] -translate-x-1/2 rounded-2xl bg-slate-800 px-4 py-3 text-center text-xs text-white">已选择酒店，下一步填写入住信息</div>}</PageShell>;
}

function TopUpPage({ onBack }: ServiceProps) {
  const [tab, setTab] = useState("话费");
  const [amount, setAmount] = useState("5,000");
  const [phone, setPhone] = useState("");
  const [paid, setPaid] = useState(false);
  return <PageShell title="充值" onBack={onBack}><section className="bg-[#7189a1] px-5 pb-7 pt-5 text-white"><WalletCards size={27}/><h2 className="mt-3 text-xl font-bold">快捷充值</h2><p className="mt-1 text-xs text-white/70">支持中国、缅甸常用号码</p></section><div className="space-y-3 p-4"><section className="rounded-3xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><b className="text-sm">充值号码</b><button type="button" className="text-xs text-[#607d96]">通讯录</button></div><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+95 / +86 手机号" className="mt-3 w-full rounded-2xl bg-slate-50 px-3 py-3 text-sm outline-none"/></section><section className="rounded-3xl bg-white p-4 shadow-sm"><div className="grid grid-cols-3 gap-2">{["话费","流量","会员"].map(x=><button type="button" key={x} onClick={()=>setTab(x)} className={tab===x?"rounded-xl bg-[#7189a1] py-2.5 text-xs font-semibold text-white":"rounded-xl bg-slate-50 py-2.5 text-xs text-slate-500"}>{x}</button>)}</div><p className="mt-4 text-xs text-slate-400">选择{tab}面额</p><div className="mt-2 grid grid-cols-3 gap-2">{["5,000","10,000","20,000","30,000","50,000","100,000"].map(x=><button type="button" key={x} onClick={()=>setAmount(x)} className={amount===x?"rounded-2xl border border-[#7189a1] bg-[#edf2f5] py-3 text-sm font-bold text-[#607d96]":"rounded-2xl border border-slate-100 py-3 text-sm text-slate-600"}>Ks {x}</button>)}</div></section><div className="flex items-center gap-2 rounded-2xl bg-[#f1f4f5] p-3 text-xs text-slate-500"><ShieldCheck size={17} className="text-[#7189a1]"/>到账通常只需要几秒钟</div><button type="button" onClick={()=>setPaid(true)} disabled={!phone} className="w-full rounded-2xl bg-[#7189a1] py-4 text-sm font-bold text-white disabled:bg-slate-300">{paid?"订单已创建":"立即充值 Ks "+amount}</button></div></PageShell>;
}

function TravelPage({ onBack }: ServiceProps) {
  return <PageShell title="旅游" onBack={onBack}><section className="bg-[#7189a1] px-5 pb-6 pt-5 text-white"><div className="flex items-center gap-2 text-xs"><Compass size={16}/>探索缅甸</div><h2 className="mt-4 text-2xl font-bold">下一站，去看看</h2><p className="mt-2 text-sm text-white/70">行程、门票、接送一次安排</p></section><section className="p-4"><div className="flex items-center justify-between"><b>热门目的地</b><button type="button" className="text-xs text-slate-400">查看全部</button></div><div className="mt-3 grid grid-cols-2 gap-3">{travelItems.slice(0,2).map((item,index)=><button type="button" key={item.title} className="overflow-hidden rounded-3xl bg-white text-left shadow-sm"><SkeletonImage className="h-28 rounded-none" label={"目的地图片 "+(index+1)}/><span className="block p-3"><b className="block text-sm">{item.title}</b><span className="mt-1 block text-[11px] text-slate-400">{item.detail}</span></span></button>)}</div><div className="mt-6 flex items-center justify-between"><b>精选行程</b><span className="text-xs text-slate-400">中文服务</span></div><div className="mt-3 space-y-3">{travelItems.map((item,index)=><article key={item.title} className="flex gap-3 rounded-3xl bg-white p-2.5 shadow-sm"><SkeletonImage className="h-24 w-24 shrink-0 rounded-2xl" label={"行程图片 "+(index+1)}/><div className="min-w-0 flex-1 py-1"><b className="block text-sm">{item.title}</b><p className="mt-2 line-clamp-2 text-xs text-slate-400">{item.detail}</p><div className="mt-2 flex items-center justify-between"><strong className="text-[#d96f68]">{item.price}</strong><button type="button" className="rounded-full bg-[#edf2f5] px-3 py-1.5 text-[11px] font-semibold text-[#607d96]">查看详情</button></div></div></article>)}</div></section></PageShell>;
}

function GoodThingsPage({ onBack, onProduct }: ServiceProps) {
  const [sort, setSort] = useState("推荐");
  return <PageShell title="好物" onBack={onBack}><section className="px-4 pb-2 pt-4"><div className="flex items-center rounded-full bg-white px-3 py-3 shadow-sm"><Search size={17} className="text-slate-400"/><span className="ml-2 text-sm text-slate-400">搜索好物</span></div><div className="mt-4 flex items-center justify-between"><div className="flex gap-4">{["推荐","销量","最新"].map(x=><button type="button" key={x} onClick={()=>setSort(x)} className={sort===x?"border-b-2 border-[#7189a1] pb-2 text-sm font-bold text-[#607d96]":"pb-2 text-sm text-slate-400"}>{x}</button>)}</div><button type="button" aria-label="筛选" className="text-slate-500"><Filter size={18}/></button></div></section><section className="space-y-3 px-4 pt-2">{catalogProducts.map(p=><ProductRow key={p.id} product={p} onProduct={onProduct}/>)}</section></PageShell>;
}

function FlashExchangePage({ onBack }: ServiceProps) {
  const [from, setFrom] = useState("USDT");
  const [amount, setAmount] = useState("");
  return <PageShell title="闪兑" onBack={onBack} dark><section className="px-5 pb-8 pt-7"><div className="flex items-center justify-between"><div><span className="text-xs text-white/50">Katu Exchange</span><h2 className="mt-2 text-2xl font-bold">简单、透明的兑换</h2></div><Zap size={28} className="text-[#9eb5c7]"/></div><div className="mt-7 rounded-3xl bg-white/10 p-4"><div className="flex items-center justify-between text-xs text-white/50"><span>你支付</span><span>余额暂未连接</span></div><div className="mt-3 flex items-center gap-3"><input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none placeholder:text-white/25"/><button type="button" onClick={()=>setFrom(from==="USDT"?"TRX":"USDT")} className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-bold">{from}<ChevronDown size={15}/></button></div></div><div className="my-3 flex justify-center"><span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/60"><ArrowDownIcon/></span></div><div className="rounded-3xl bg-white/10 p-4"><span className="text-xs text-white/50">你收到</span><div className="mt-3 flex items-center justify-between"><b className="text-3xl">{amount || "0.00"}</b><span className="rounded-full bg-white/15 px-3 py-2 text-sm font-bold">{from==="USDT"?"TRX":"USDT"}</span></div></div><div className="mt-5 flex items-center gap-2 text-xs text-white/55"><ShieldCheck size={15}/>兑换功能暂未开放，当前仅展示页面</div><button type="button" disabled className="mt-6 w-full rounded-2xl bg-white/15 py-4 text-sm font-bold text-white/40">即将开放</button></section></PageShell>;
}

function ArrowDownIcon() {
  return <ArrowDown size={18}/>;
}

function MoreServicesPage({ onBack, onService }: ServiceProps) {
  const items = [
    { name: "电影", icon: Ticket, text: "电影票与本地活动" },
    { name: "洗衣", icon: Package, text: "上门取送更省心" },
    { name: "维修", icon: Zap, text: "家电手机维修" },
    { name: "搬家", icon: Home, text: "搬运与清洁服务" },
    { name: "门票", icon: Gift, text: "景点门票预订" },
    { name: "火车票", icon: TrainFront, text: "出行票务查询" },
    { name: "咖啡", icon: Coffee, text: "附近咖啡与茶饮" },
    { name: "生活缴费", icon: WalletCards, text: "水电网费缴纳" }
  ];
  return <PageShell title="更多服务" onBack={onBack}><section className="bg-[#7189a1] px-5 pb-7 pt-6 text-white"><h2 className="text-2xl font-bold">还有这些服务</h2><p className="mt-2 text-sm text-white/70">把日常生活需要的服务放在一起</p></section><section className="grid grid-cols-2 gap-3 p-4">{items.map(item=><button type="button" key={item.name} onClick={()=>onService?.(item.name)} className="flex min-h-[126px] flex-col items-start justify-between rounded-3xl bg-white p-4 text-left shadow-sm active:scale-[.98]"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf2f5] text-[#7189a1]"><item.icon size={22}/></span><span><b className="block text-sm">{item.name}</b><span className="mt-1 block text-[11px] text-slate-400">{item.text}</span></span></button>)}</section></PageShell>;
}

function ExtraServicePage({ title, onBack }: ServiceProps) {
  return <PageShell title={title || "服务"} onBack={onBack}><section className="bg-[#7189a1] px-5 pb-7 pt-6 text-white"><Store size={27}/><h2 className="mt-3 text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-white/70">为你准备了附近的{title}服务</p></section><section className="space-y-3 p-4"><div className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span><b className="text-sm">附近服务正在整理</b><p className="mt-2 text-xs leading-5 text-slate-400">当前先提供页面入口，商家和真实数据接入后会在这里显示。</p></span><Clock3 className="text-[#7189a1]"/></div></div><button type="button" className="flex w-full items-center justify-between rounded-3xl bg-white p-4 text-left shadow-sm"><span className="flex items-center gap-3"><MapPin className="text-[#7189a1]"/><span><b className="block text-sm">按距离查找</b><span className="mt-1 block text-xs text-slate-400">允许后显示附近商家</span></span></span><ChevronDown size={17} className="text-slate-400"/></button></section></PageShell>;
}

export function ServicePage({ title, onBack, onProduct, onService }: ServiceProps) {
  if (title === "外卖") return <FoodDeliveryPage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "打车") return <RidePage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "超市") return <SupermarketPage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "酒店") return <HotelPage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "充值") return <TopUpPage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "旅游") return <TravelPage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "好物") return <GoodThingsPage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "闪兑") return <FlashExchangePage title={title} onBack={onBack} onProduct={onProduct}/>;
  if (title === "更多") return <MoreServicesPage title={title} onBack={onBack} onProduct={onProduct} onService={onService}/>;
  return <ExtraServicePage title={title} onBack={onBack} onProduct={onProduct}/>;
}
