"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
  Upload,
  Video,
  X,
} from "lucide-react";
import { LocationPicker, type LocationPickerResult } from "../location-picker";
import type {
  AuthUser,
  MerchantApplicationRecord,
  MerchantDocumentRecord,
  View,
} from "../../lib/data";

type FormState = {
  storeNameCn: string;
  storeNameMm: string;
  phone: string;
  email: string;
  tgAccount: string;
  wechatAccount: string;
  businessType: string;
  stateRegion: string;
  city: string;
  township: string;
  address: string;
  mapLink: string;
  locationLat: string;
  locationLng: string;
  description: string;
};

const initialForm: FormState = {
  storeNameCn: "", storeNameMm: "", phone: "", email: "", tgAccount: "",
  wechatAccount: "", businessType: "", stateRegion: "", city: "",
  township: "", address: "", mapLink: "", locationLat: "", locationLng: "",
  description: "",
};

const businessTypes = [
  "餐饮美食", "超市便利", "服装百货", "数码家电", "美容健康",
  "酒店住宿", "旅游服务", "物流配送", "教育培训", "生活服务", "其他",
];

const locationOptions: Record<string, string[]> = {
  "仰光省 Yangon": ["Yangon 仰光", "Thanlyin 丁茵", "Twante 德拉"],
  "曼德勒省 Mandalay": ["Mandalay 曼德勒", "Pyin Oo Lwin 彬乌伦", "Meiktila 密铁拉"],
  "掸邦 Shan": ["Lashio 腊戍", "Muse 木姐", "Taunggyi 东枝", "Tachileik 大其力"],
  "克钦邦 Kachin": ["Myitkyina 密支那", "Bhamo 八莫"],
  "克伦邦 Kayin": ["Hpa-An 帕安", "Myawaddy 妙瓦底"],
  "孟邦 Mon": ["Mawlamyine 毛淡棉", "Thaton 直通"],
  "若开邦 Rakhine": ["Sittwe 实兑", "Thandwe 丹兑"],
  "内比都 Naypyidaw": ["Naypyidaw 内比都"],
  "勃固省 Bago": ["Bago 勃固", "Taungoo 东吁"],
  "马圭省 Magway": ["Magway 马圭", "Pakokku 木各具"],
  "实皆省 Sagaing": ["Sagaing 实皆", "Monywa 蒙育瓦"],
  "伊洛瓦底省 Ayeyarwady": ["Pathein 勃生", "Hinthada 兴实达"],
};

export function MerchantApplyPage({
  user,
  onBack,
  onNavigate,
}: {
  user: AuthUser | null;
  onBack: () => void;
  onNavigate: (view: View) => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [application, setApplication] = useState<MerchantApplicationRecord | null>(null);
  const [documents, setDocuments] = useState<MerchantDocumentRecord[]>([]);
  const [picker, setPicker] = useState<"business" | "region" | "city" | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(user));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/merchant/application", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          application: MerchantApplicationRecord | null;
          documents?: MerchantDocumentRecord[];
          message?: string;
        };
        if (!response.ok) throw new Error(result.message || "申请资料加载失败");
        return result;
      })
      .then(({ application: item, documents: proofFiles = [] }) => {
        if (item?.status === "approved") {
          window.location.assign("/merchant");
          return;
        }
        setApplication(item);
        setDocuments(proofFiles);
        if (item) {
          setForm({
            storeNameCn: item.storeNameCn || "",
            storeNameMm: item.storeNameMm || "",
            phone: item.phone,
            email: item.email || "",
            tgAccount: item.tgAccount || "",
            wechatAccount: item.wechatAccount || "",
            businessType: item.businessType,
            stateRegion: item.stateRegion,
            city: item.city,
            township: item.township,
            address: item.address,
            mapLink: item.mapLink || "",
            locationLat: item.locationLat || "",
            locationLng: item.locationLng || "",
            description: item.description,
          });
        }
      })
      .catch((error) => setMessage(getMessage(error)))
      .finally(() => setLoading(false));
  }, [user]);

  const locked = application?.status === "pending" || application?.status === "approved";
  const photos = useMemo(
    () => documents.filter((item) => item.kind === "store_photo"),
    [documents],
  );
  const video = documents.find((item) => item.kind === "store_video");
  const cities = form.stateRegion ? locationOptions[form.stateRegion] || [] : [];

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadDocument = async (file: File, kind: "store_photo" | "store_video") => {
    setUploading(kind);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      const response = await fetch("/api/merchant/application/documents", {
        method: "POST", credentials: "include", body,
      });
      const result = (await response.json()) as {
        document?: MerchantDocumentRecord;
        message?: string;
      };
      if (!response.ok || !result.document) throw new Error(result.message || "上传失败");
      setDocuments((items) => [...items, result.document!]);
    } catch (error) {
      setMessage(getMessage(error));
    } finally {
      setUploading("");
    }
  };

  const removeDocument = async (document: MerchantDocumentRecord) => {
    setUploading(document.id);
    setMessage("");
    try {
      const response = await fetch(
        `/api/merchant/application/documents?id=${encodeURIComponent(document.id)}`,
        { method: "DELETE", credentials: "include" },
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "删除失败");
      setDocuments((items) => items.filter((item) => item.id !== document.id));
    } catch (error) {
      setMessage(getMessage(error));
    } finally {
      setUploading("");
    }
  };

  const applyLocation = (result: LocationPickerResult) => {
    setForm((current) => ({
      ...current,
      mapLink: result.mapLink,
      locationLat: result.latitude,
      locationLng: result.longitude,
    }));
    setMessage("已读取地图位置：" + result.label + "。省邦、城市和镇区请按实际情况确认。");
    setLocationPickerOpen(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.storeNameCn.trim() && !form.storeNameMm.trim()) {
      setMessage("中文店名和缅文店名至少填写一个");
      return;
    }
    if (form.description.trim().length < 10) {
      setMessage("店铺介绍至少填写 10 个字");
      return;
    }
    if (photos.length < 2 || !video) {
      setMessage("请上传两张不同的店铺照片和一段现场视频");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/merchant/application", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, documentIds: documents.map((item) => item.id) }),
      });
      const result = (await response.json()) as {
        application?: MerchantApplicationRecord;
        message?: string;
      };
      if (!response.ok || !result.application) throw new Error(result.message || "提交失败");
      setApplication(result.application);
      setMessage("申请已提交，审核结果会发送到消息中心");
    } catch (error) {
      setMessage(getMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f8] px-8 text-center">
        <Building2 size={44} className="text-[#7189a1]" strokeWidth={1.4} />
        <h1 className="mt-5 text-xl font-bold text-slate-800">登录后申请商家入驻</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">审核通过后，账号会自动获得独立商家后台权限。</p>
        <button type="button" onClick={() => onNavigate("login")} className="mt-7 h-12 w-full rounded-full bg-[#7189a1] text-sm font-semibold text-white">去登录 / 注册</button>
        <button type="button" onClick={onBack} className="mt-4 text-sm text-slate-400">返回</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] pb-28">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 pb-3 pt-9 backdrop-blur">
        <button type="button" onClick={onBack} className="flex size-9 items-center justify-center rounded-full bg-[#f4f6f8] text-slate-600" aria-label="返回"><ArrowLeft size={19} /></button>
        <div className="text-center"><h1 className="text-[17px] font-bold text-slate-800">商家入驻申请</h1><p className="mt-0.5 text-[10px] text-slate-400">Myanmar Merchant Application</p></div>
        <span className="flex size-9 items-center justify-center text-[#7189a1]"><ShieldCheck size={20} /></span>
      </header>

      <div className="space-y-3 px-4 py-4">
        {application && <StatusCard application={application} />}
        {message && <div className="rounded-xl bg-white px-4 py-3 text-xs leading-5 text-[#667f98] shadow-sm">{message}</div>}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-white" />)}</div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <FormCard title="店铺信息" subtitle="中文名和缅文名至少填写一个">
              <Field label="中文店名" value={form.storeNameCn} onChange={(value) => update("storeNameCn", value)} disabled={locked} maxLength={120} />
              <Field label="缅文店名" value={form.storeNameMm} onChange={(value) => update("storeNameMm", value)} disabled={locked} maxLength={160} placeholder="မြန်မာဆိုင်အမည်" />
              <PickerRow label="经营类型 *" value={form.businessType} placeholder="请选择经营类型" onClick={() => setPicker("business")} disabled={locked} />
              <label className="block py-3 text-xs text-slate-500">
                店铺介绍 * <span className="float-right text-[10px] text-slate-300">{form.description.length}/50</span>
                <textarea value={form.description} onChange={(event) => update("description", event.target.value.slice(0, 50))} disabled={locked} rows={3} maxLength={50} placeholder="请用 10–50 个字介绍主营业务和店铺特色" className="katu-field mt-2 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-400" />
              </label>
            </FormCard>

            <FormCard title="联系方式" subtitle="手机号必填，其他联系方式选填">
              <Field label="中国 / 缅甸手机号 *" value={form.phone} onChange={(value) => update("phone", value)} disabled={locked} maxLength={32} placeholder="+95 9xxxxxxxxx 或 +86 1xxxxxxxxxx" inputMode="tel" />
              <Field label="邮箱（可选）" value={form.email} onChange={(value) => update("email", value)} disabled={locked} maxLength={160} inputMode="email" />
              <Field label="Telegram 账号（可选）" value={form.tgAccount} onChange={(value) => update("tgAccount", value)} disabled={locked} maxLength={100} placeholder="@username" />
              <Field label="微信号（可选）" value={form.wechatAccount} onChange={(value) => update("wechatAccount", value)} disabled={locked} maxLength={100} />
            </FormCard>

            <FormCard title="营业地址" subtitle="地址越详细，审核和顾客导航越准确">
              <PickerRow label="省邦 / 地区 *" value={form.stateRegion} placeholder="请选择省邦" onClick={() => setPicker("region")} disabled={locked} />
              <PickerRow label="城市 *" value={form.city} placeholder={form.stateRegion ? "请选择城市" : "请先选择省邦"} onClick={() => form.stateRegion && setPicker("city")} disabled={locked || !form.stateRegion} />
              <Field label="镇区 Township *" value={form.township} onChange={(value) => update("township", value)} disabled={locked} maxLength={100} placeholder="自行填写镇区" />
              <Field label="详细营业地址 *" value={form.address} onChange={(value) => update("address", value)} disabled={locked} maxLength={1000} multiline placeholder="街道、路口、楼层、门牌及附近明显地标" />
              <div className="py-3">
                <div className="flex items-center justify-between"><span className="text-xs text-slate-500">地图 / 导航链接（可选）</span>{!locked && <button type="button" onClick={() => setLocationPickerOpen(true)} className="flex items-center gap-1 text-[11px] text-[#667f98]"><LocateFixed size={14} />自动填写</button>}</div>
                <input value={form.mapLink} onChange={(event) => update("mapLink", event.target.value)} disabled={locked} inputMode="url" placeholder="粘贴 Google Maps 或其他导航网页链接" className="katu-field mt-2 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-400" />
                {form.mapLink && <a href={form.mapLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#667f98]"><ExternalLink size={13} />打开当前导航链接</a>}
              </div>
            </FormCard>

            <FormCard title="证明资料" subtitle="必须提供两张不同角度的店铺照片和一段现场视频">
              <div className="grid grid-cols-2 gap-3 py-3">
                {[0,1].map((index) => <ProofTile key={index} title={`店铺照片 ${index + 1} *`} kind="store_photo" document={photos[index]} uploading={uploading} disabled={locked} accept="image/jpeg,image/png,image/webp" capture="environment" icon={Camera} onUpload={uploadDocument} onRemove={removeDocument} />)}
              </div>
              <div className="py-3">
                <ProofTile title="现场录制视频 *" kind="store_video" document={video} uploading={uploading} disabled={locked} accept="video/mp4,video/webm,video/quicktime" capture="environment" icon={Video} wide onUpload={uploadDocument} onRemove={removeDocument} />
                <p className="mt-2 text-[10px] leading-4 text-slate-400">请从店铺门口开始录制并缓慢拍摄店内环境，视频不超过 30MB。</p>
              </div>
            </FormCard>

            {!locked && <button type="submit" disabled={submitting} className="katu-primary fixed bottom-3 left-1/2 z-30 flex h-12 w-[calc(100%-32px)] max-w-[358px] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-[#7189a1] text-sm font-semibold text-white shadow-lg disabled:opacity-50">{submitting && <Loader2 size={17} className="animate-spin" />}{application?.status === "rejected" ? "修改后重新提交" : "提交入驻申请"}</button>}
          </form>
        )}
      </div>

      {picker && <PickerModal title={picker === "business" ? "选择经营类型" : picker === "region" ? "选择省邦 / 地区" : "选择城市"} options={picker === "business" ? businessTypes : picker === "region" ? Object.keys(locationOptions) : cities} selected={picker === "business" ? form.businessType : picker === "region" ? form.stateRegion : form.city} onClose={() => setPicker(null)} onSelect={(value) => { if (picker === "business") update("businessType", value); else if (picker === "region") setForm((current) => ({ ...current, stateRegion: value, city: "" })); else update("city", value); setPicker(null); }} />}
      {locationPickerOpen && <LocationPicker title="填写店铺地图位置" description="自动定位失败时，可从 Google 地图复制位置链接回来填写。" initialLink={form.mapLink} onClose={() => setLocationPickerOpen(false)} onApply={applyLocation} />}
    </main>
  );
}

function StatusCard({ application }: { application: MerchantApplicationRecord }) {
  const approved = application.status === "approved";
  const rejected = application.status === "rejected";
  return <section className={`rounded-2xl p-4 ${approved ? "bg-[#edf5ef] text-[#557865]" : rejected ? "bg-[#fff0ed] text-[#b96158]" : "bg-[#e9eff4] text-[#647e96]"}`}><div className="flex items-center gap-2 font-semibold">{approved ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{approved ? "审核已通过" : rejected ? "申请需修改" : "资料审核中"}</div><p className="mt-2 text-xs leading-5 opacity-80">{approved ? "商家权限已开通，返回个人中心即可进入独立商家后台。" : rejected ? application.reviewNote || "请按要求修改资料后重新提交。" : "审核中暂不能修改，结果会发送到消息中心。"}</p></section>;
}

function FormCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm"><div className="mb-2"><h2 className="text-sm font-bold text-slate-700">{title}</h2><p className="mt-1 text-[11px] text-slate-400">{subtitle}</p></div><div className="divide-y divide-slate-100">{children}</div></section>;
}

function Field({ label, value, onChange, placeholder, disabled, multiline, maxLength, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; multiline?: boolean; maxLength: number; inputMode?: "text" | "tel" | "email" | "url" }) {
  const classes = "katu-field mt-2 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-400";
  return <label className="block py-3 text-xs text-slate-500"><span>{label}</span>{multiline ? <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} maxLength={maxLength} className={classes + " resize-none leading-6"} /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} maxLength={maxLength} inputMode={inputMode} className={classes} />}</label>;
}

function PickerRow({ label, value, placeholder, onClick, disabled }: { label: string; value: string; placeholder: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-3 py-4 text-left disabled:opacity-50"><span className="flex-1 text-xs text-slate-500">{label}</span><span className={`text-sm ${value ? "text-slate-700" : "text-slate-300"}`}>{value || placeholder}</span><ChevronRight size={16} className="text-slate-300" /></button>;
}

function ProofTile({ title, kind, document, uploading, disabled, accept, capture, icon: Icon, wide, onUpload, onRemove }: { title: string; kind: "store_photo" | "store_video"; document?: MerchantDocumentRecord; uploading: string; disabled?: boolean; accept: string; capture: "environment"; icon: typeof Camera; wide?: boolean; onUpload: (file: File, kind: "store_photo" | "store_video") => void; onRemove: (document: MerchantDocumentRecord) => void }) {
  return <div className={`relative rounded-xl border border-dashed border-slate-200 bg-[#f7f9fa] p-3 ${wide ? "w-full" : ""}`}><label className="flex min-h-20 cursor-pointer flex-col items-center justify-center text-center"><span className="flex size-9 items-center justify-center rounded-full bg-white text-[#7189a1]">{uploading === kind ? <Loader2 size={18} className="animate-spin" /> : document ? <FileCheck2 size={18} /> : <Icon size={18} />}</span><span className="mt-2 text-[11px] font-medium text-slate-600">{title}</span><span className="mt-1 max-w-full truncate text-[9px] text-slate-400">{document?.fileName || (kind === "store_video" ? "点击调用相机录制" : "点击拍摄或选择照片")}</span>{!disabled && !document && <input type="file" accept={accept} capture={capture} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file, kind); event.target.value = ""; }} />}</label>{document && !disabled && <button type="button" onClick={() => void onRemove(document)} disabled={uploading === document.id} className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-slate-700 text-white disabled:opacity-50" aria-label="删除资料"><X size={13} /></button>}</div>;
}

function PickerModal({ title, options, selected, onSelect, onClose }: { title: string; options: string[]; selected: string; onSelect: (value: string) => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35"><div className="max-h-[72vh] w-full max-w-[390px] overflow-hidden rounded-t-3xl bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-slate-800">{title}</h3><button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8]"><X size={16} /></button></div><div className="max-h-[60vh] overflow-y-auto p-3">{options.map((option) => <button type="button" key={option} onClick={() => onSelect(option)} className="flex w-full items-center rounded-xl px-3 py-3.5 text-left text-sm text-slate-600 hover:bg-[#f4f6f8]"><span className="flex-1">{option}</span>{selected === option && <Check size={17} className="text-[#7189a1]" />}</button>)}</div></div></div>;
}

function LocationGuide({ onClose, onLocate, onOpenMaps }: { onClose: () => void; onLocate: () => void; onOpenMaps: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 px-3 pb-3"><div className="w-full max-w-[366px] rounded-3xl bg-white p-5"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#e8eef2] text-[#667f98]"><MapPin size={22} /></span><h3 className="mt-4 text-lg font-bold text-slate-800">填写店铺地图位置</h3><p className="mt-2 text-xs leading-6 text-slate-500">自动定位会请求浏览器位置授权并生成导航链接。也可以打开 Google Maps，进入后长按店铺位置，选择“分享 / 复制链接”，再返回粘贴到申请表。</p><button type="button" onClick={onLocate} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#7189a1] text-sm font-semibold text-white"><LocateFixed size={17} />授权定位并自动填写</button><button type="button" onClick={onOpenMaps} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#edf2f5] text-sm font-medium text-[#667f98]"><ExternalLink size={16} />打开 Google Maps 选点</button><button type="button" onClick={onClose} className="mt-3 w-full py-2 text-xs text-slate-400">暂不填写</button></div></div>;
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "请求失败，请稍后重试";
}
