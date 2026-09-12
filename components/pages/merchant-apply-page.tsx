"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Loader2,
  MapPin,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import type { AuthUser, MerchantApplicationRecord, View } from "../../lib/data";

type DocumentItem = { id: string; kind: string; fileName: string; fileSize: number };
type FormState = {
  storeNameCn: string;
  storeNameMm: string;
  legalName: string;
  contactName: string;
  phone: string;
  email: string;
  businessType: string;
  licenseNo: string;
  identityNo: string;
  stateRegion: string;
  city: string;
  township: string;
  address: string;
  mapLink: string;
  description: string;
};

const initialForm: FormState = {
  storeNameCn: "", storeNameMm: "", legalName: "", contactName: "",
  phone: "+95 ", email: "", businessType: "", licenseNo: "", identityNo: "",
  stateRegion: "", city: "", township: "", address: "", mapLink: "", description: "",
};

const regions = [
  "仰光省 Yangon", "曼德勒省 Mandalay", "掸邦 Shan", "克钦邦 Kachin",
  "克伦邦 Kayin", "孟邦 Mon", "若开邦 Rakhine", "内比都 Naypyidaw",
  "勃固省 Bago", "马圭省 Magway", "实皆省 Sagaing", "伊洛瓦底省 Ayeyarwady",
];

const businessTypes = [
  "餐饮美食", "超市便利", "服装百货", "数码家电", "美容健康",
  "酒店住宿", "旅游服务", "物流配送", "教育培训", "其他服务",
];

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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/merchant/application", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("申请资料加载失败");
        return response.json() as Promise<{ application: MerchantApplicationRecord | null }>;
      })
      .then(({ application: item }) => {
        setApplication(item);
        if (item) {
          setForm({
            storeNameCn: item.storeNameCn, storeNameMm: item.storeNameMm || "",
            legalName: item.legalName, contactName: item.contactName, phone: item.phone,
            email: item.email || "", businessType: item.businessType,
            licenseNo: item.licenseNo || "", identityNo: item.identityNo,
            stateRegion: item.stateRegion, city: item.city, township: item.township,
            address: item.address, mapLink: item.mapLink || "", description: item.description,
          });
          setDocuments(item.documentIds.map((id, index) => ({
            id, kind: "submitted", fileName: `已提交证明文件 ${index + 1}`, fileSize: 0,
          })));
        }
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [user]);

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadDocument = async (file: File, kind: string) => {
    setUploading(kind);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      const response = await fetch("/api/merchant/application/documents", {
        method: "POST", credentials: "include", body,
      });
      const result = (await response.json()) as { document?: DocumentItem; message?: string };
      if (!response.ok || !result.document) throw new Error(result.message || "上传失败");
      setDocuments((items) => [...items.filter((item) => item.kind !== kind), result.document!]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading("");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/merchant/application", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, documentIds: documents.map((item) => item.id) }),
      });
      const result = (await response.json()) as { application?: MerchantApplicationRecord; message?: string };
      if (!response.ok || !result.application) throw new Error(result.message || "提交失败");
      setApplication(result.application);
      setMessage("申请已提交，我们会尽快完成资料审核");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f8] px-8 text-center">
        <Building2 size={44} className="text-[#7189a1]" strokeWidth={1.4} />
        <h1 className="mt-5 text-xl font-bold text-slate-800">登录后申请商家入驻</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">申请资料会绑定到你的账号，审核通过后自动开通商家版。</p>
        <button type="button" onClick={() => onNavigate("login")} className="mt-7 h-12 w-full rounded-full bg-[#7189a1] text-sm font-semibold text-white">去登录 / 注册</button>
        <button type="button" onClick={onBack} className="mt-4 text-sm text-slate-400">返回</button>
      </main>
    );
  }

  const locked = application?.status === "pending" || application?.status === "approved";

  return (
    <main className="min-h-screen bg-[#f4f6f8] pb-28">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 pb-3 pt-9 backdrop-blur">
        <button type="button" onClick={onBack} className="flex size-9 items-center justify-center rounded-full bg-[#f4f6f8] text-slate-600" aria-label="返回"><ArrowLeft size={19} /></button>
        <div className="text-center">
          <h1 className="text-[17px] font-bold text-slate-800">申请商家入驻</h1>
          <p className="mt-0.5 text-[10px] text-slate-400">Myanmar Merchant Verification</p>
        </div>
        <span className="flex size-9 items-center justify-center text-[#7189a1]"><ShieldCheck size={20} /></span>
      </header>

      <div className="space-y-3 px-4 py-4">
        {application && (
          <section className={`rounded-2xl p-4 ${application.status === "approved" ? "bg-[#edf5ef] text-[#557865]" : application.status === "rejected" ? "bg-[#fff0ed] text-[#b96158]" : "bg-[#e9eff4] text-[#647e96]"}`}>
            <div className="flex items-center gap-2 font-semibold">
              {application.status === "approved" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {application.status === "approved" ? "审核已通过" : application.status === "rejected" ? "申请需修改" : "资料审核中"}
            </div>
            <p className="mt-2 text-xs leading-5 opacity-80">
              {application.status === "approved"
                ? "商家权限已开通，请重新进入个人中心打开商家版。"
                : application.status === "rejected"
                  ? application.reviewNote || "请修改资料后重新提交。"
                  : "审核期间暂不能修改资料，结果会发送到消息中心。"}
            </p>
          </section>
        )}

        {message && <div className="rounded-xl bg-white px-4 py-3 text-xs text-[#7189a1] shadow-sm">{message}</div>}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-white" />)}</div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <FormCard title="店铺信息" subtitle="面向华人展示中文名，可同时填写缅文店名">
              <Field label="店铺中文名 *" value={form.storeNameCn} onChange={(v) => update("storeNameCn", v)} disabled={locked} />
              <Field label="缅文店名" value={form.storeNameMm} onChange={(v) => update("storeNameMm", v)} disabled={locked} placeholder="မြန်မာဆိုင်အမည်" />
              <SelectField label="经营类型 *" value={form.businessType} onChange={(v) => update("businessType", v)} options={businessTypes} disabled={locked} />
              <Field label="店铺介绍 *" value={form.description} onChange={(v) => update("description", v)} disabled={locked} multiline />
            </FormCard>

            <FormCard title="经营主体" subtitle="资料仅用于平台实名审核，不会公开展示">
              <Field label="法人 / 经营者姓名 *" value={form.legalName} onChange={(v) => update("legalName", v)} disabled={locked} />
              <Field label="联系人姓名 *" value={form.contactName} onChange={(v) => update("contactName", v)} disabled={locked} />
              <Field label="缅甸手机号 *" value={form.phone} onChange={(v) => update("phone", v)} disabled={locked} placeholder="+95 9xxxxxxxxx" />
              <Field label="邮箱" value={form.email} onChange={(v) => update("email", v)} disabled={locked} type="email" />
              <Field label="身份证 / 护照号 *" value={form.identityNo} onChange={(v) => update("identityNo", v)} disabled={locked} />
              <Field label="营业执照号（如有）" value={form.licenseNo} onChange={(v) => update("licenseNo", v)} disabled={locked} />
            </FormCard>

            <FormCard title="经营地址" subtitle="请填写缅甸境内真实营业地址">
              <SelectField label="省邦 / 地区 *" value={form.stateRegion} onChange={(v) => update("stateRegion", v)} options={regions} disabled={locked} />
              <Field label="城市 *" value={form.city} onChange={(v) => update("city", v)} disabled={locked} placeholder="例如：Yangon" />
              <Field label="镇区 Township *" value={form.township} onChange={(v) => update("township", v)} disabled={locked} />
              <Field label="详细地址 *" value={form.address} onChange={(v) => update("address", v)} disabled={locked} multiline />
              <Field label="Google Maps 链接" value={form.mapLink} onChange={(v) => update("mapLink", v)} disabled={locked} type="url" />
            </FormCard>

            <FormCard title="证明材料" subtitle="JPG、PNG、WEBP 或 PDF，单个不超过 5MB">
              <UploadRow label="身份证明 *" kind="identity_front" item={documents.find((d) => d.kind === "identity_front") || documents[0]} uploading={uploading} disabled={locked} onUpload={uploadDocument} />
              <UploadRow label="店铺门头 / 营业证明 *" kind="storefront" item={documents.find((d) => d.kind === "storefront") || documents[1]} uploading={uploading} disabled={locked} onUpload={uploadDocument} />
              <UploadRow label="营业执照（可选）" kind="business_license" item={documents.find((d) => d.kind === "business_license")} uploading={uploading} disabled={locked} onUpload={uploadDocument} />
            </FormCard>

            {!locked && (
              <button type="submit" disabled={submitting} className="fixed bottom-3 left-1/2 z-30 flex h-12 w-[calc(100%-32px)] max-w-[358px] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-[#7189a1] text-sm font-semibold text-white shadow-lg disabled:opacity-50">
                {submitting && <Loader2 size={17} className="animate-spin" />}
                {application?.status === "rejected" ? "重新提交审核" : "提交入驻申请"}
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

function FormCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm"><div className="mb-2"><h2 className="text-sm font-bold text-slate-700">{title}</h2><p className="mt-1 text-[11px] text-slate-400">{subtitle}</p></div><div className="divide-y divide-slate-100">{children}</div></section>;
}

function Field({ label, value, onChange, placeholder, disabled, multiline, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; multiline?: boolean; type?: string }) {
  const classes = "mt-2 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 disabled:text-slate-400";
  return <label className="block py-3 text-xs text-slate-500"><span>{label}</span>{multiline ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={classes + " resize-none leading-6"} /> : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={classes} />}</label>;
}

function SelectField({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: string[]; disabled?: boolean }) {
  return <label className="relative block py-3 text-xs text-slate-500"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="mt-2 w-full appearance-none bg-transparent text-sm text-slate-700 outline-none disabled:text-slate-400"><option value="">请选择</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} className="absolute bottom-4 right-0 text-slate-300" /></label>;
}

function UploadRow({ label, kind, item, uploading, disabled, onUpload }: { label: string; kind: string; item?: DocumentItem; uploading: string; disabled?: boolean; onUpload: (file: File, kind: string) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 py-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf2f5] text-[#7189a1]">{item ? <FileCheck2 size={19} /> : uploading === kind ? <Loader2 size={19} className="animate-spin" /> : <Upload size={19} />}</span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-slate-600">{label}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{item?.fileName || "点击选择文件"}</span></span>{!disabled && <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void onUpload(file, kind); e.target.value = ""; }} />}</label>;
}
