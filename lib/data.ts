import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Bike,
  CarFront,
  Film,
  Home,
  Hotel,
  MoreHorizontal,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  TicketPercent,
  WalletCards,
} from "lucide-react";

export type View =
  | "home"
  | "discover"
  | "scan"
  | "messages"
  | "profile"
  | "product"
  | "publish"
  | "merchantApply"
  | "login"
  | "cart"
  | "checkout"
  | "search";

export type MainTab = "home" | "discover" | "scan" | "messages" | "profile";

export type UserRole = "user" | "merchant" | "admin";
export type UserStatus = "active" | "suspended";

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type AdminOverview = {
  users: number;
  activeSessions: number;
  orders: number;
  broadcasts: number;
  notifications: number;
  merchants: number;
  pendingApplications: number;
};

export type AdminUserRecord = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type AdminOrderRecord = {
  id: string;
  orderNo: string;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  paidAmount: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderDetail = AdminOrderRecord & {
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  items: unknown;
};

export type AdminBroadcastRecord = {
  id: string;
  title: string;
  content: string;
  recipientCount: number;
  createdAt: string;
};

export type MerchantApplicationStatus = "pending" | "approved" | "rejected";

export type MerchantApplicationRecord = {
  id: string;
  userId: string;
  username?: string;
  displayName?: string;
  storeNameCn: string;
  storeNameMm: string | null;
  legalName: string;
  contactName: string;
  phone: string;
  email: string | null;
  businessType: string;
  licenseNo: string | null;
  identityNo: string;
  stateRegion: string;
  city: string;
  township: string;
  address: string;
  mapLink: string | null;
  description: string;
  documentIds: string[];
  documentCount?: number;
  status: MerchantApplicationStatus;
  reviewNote: string | null;
  submittedAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

export type MerchantRecord = {
  id: string;
  userId: string;
  storeNameCn: string;
  storeNameMm: string | null;
  phone: string;
  businessType: string;
  stateRegion: string;
  city: string;
  township: string;
  address: string;
  description: string;
  status: string;
  approvedAt: string;
};

export type MerchantOverview = {
  products: number;
  activeProducts: number;
  orders: number;
  pendingOrders: number;
  revenue: number;
};

export type MerchantProductRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  status: "draft" | "active" | "archived";
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProductData = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  original: number;
  rating: string;
  distance: string;
  sales: string;
  tags: string[];
  store: string;
  imageLabel: string;
};

export type ServiceItem = {
  name: string;
  icon: LucideIcon;
  tone: string;
};

export type CartItem = {
  id: string;
  shop: string;
  title: string;
  spec: string;
  unit: number;
  quantity: number;
  imageLabel: string;
};

export const formatMoney = (value: number) =>
  `Ks ${value.toLocaleString("zh-CN")}`;

// These are navigation categories, not mock business records.
export const services: ServiceItem[] = [
  { name: "外卖", icon: Bike, tone: "bg-[#e5edf2] text-[#6d879e]" },
  { name: "打车", icon: CarFront, tone: "bg-[#f5e8dc] text-[#c78a62]" },
  {
    name: "超市",
    icon: ShoppingBasket,
    tone: "bg-[#e5eee8] text-[#71917d]",
  },
  { name: "电影", icon: Film, tone: "bg-[#ece7f0] text-[#89779a]" },
  { name: "酒店", icon: Hotel, tone: "bg-[#eee8dc] text-[#a78c63]" },
  { name: "充值", icon: WalletCards, tone: "bg-[#e4edf1] text-[#66879c]" },
  { name: "旅游", icon: Plane, tone: "bg-[#e7edf4] text-[#7189a3]" },
  { name: "到家", icon: Home, tone: "bg-[#f0e7e2] text-[#ab7d6d]" },
  { name: "好物", icon: ShoppingBag, tone: "bg-[#e9edf0] text-[#70808e]" },
  {
    name: "更多",
    icon: MoreHorizontal,
    tone: "bg-[#edf0f2] text-[#7c8992]",
  },
];

export const discoverTabs = ["关注", "广场", "本地", "好物", "美食", "生活"];

export const messageTypes = [
  {
    title: "系统通知",
    count: 0,
    icon: BellRing,
    tone: "bg-[#e3edf3] text-[#6e879d]",
  },
  {
    title: "优惠促销",
    count: 0,
    icon: TicketPercent,
    tone: "bg-[#f5e5df] text-[#c47e6f]",
  },
  {
    title: "互动消息",
    count: 0,
    icon: Smartphone,
    tone: "bg-[#e9e6ef] text-[#88799b]",
  },
];

export const catalogProducts: ProductData[] = [];

export const discoverPosts: Array<{
  id: string;
  productId: string;
  title: string;
  author: string;
  likes: string;
  height: string;
}> = [];

export const initialCartItems: CartItem[] = [];
