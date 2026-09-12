import type { LucideIcon } from "lucide-react";
import {
  Bike,
  BellRing,
  CarFront,
  Film,
  Gift,
  Home,
  Hotel,
  MoreHorizontal,
  Package,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Store,
  TicketPercent,
  Truck,
  UsersRound,
  Utensils,
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
  | "login"
  | "cart"
  | "checkout"
  | "search";

export type MainTab = "home" | "discover" | "scan" | "messages" | "profile";

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
  `¥${value.toLocaleString("zh-CN")}`;

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

export const catalogProducts: ProductData[] = [
  {
    id: "hotpot",
    title: "本帮老味道火锅双人套餐",
    subtitle: "现点现做 · 浦东店可用",
    price: 88,
    original: 128,
    rating: "4.9",
    distance: "1.2 km",
    sales: "2.3k",
    tags: ["双人餐", "免预约"],
    store: "沪上本帮菜·浦东店",
    imageLabel: "美食套餐",
  },
  {
    id: "coffee",
    title: "手作生椰拿铁下午茶套餐",
    subtitle: "限时折扣 · 到店自取",
    price: 29,
    original: 42,
    rating: "4.8",
    distance: "800 m",
    sales: "1.8k",
    tags: ["下午茶", "人气"],
    store: "山丘咖啡研究所",
    imageLabel: "咖啡套餐",
  },
  {
    id: "brunch",
    title: "周末早午餐双人分享套餐",
    subtitle: "环境舒适 · 可预约",
    price: 69,
    original: 96,
    rating: "4.7",
    distance: "2.6 km",
    sales: "956",
    tags: ["早午餐", "周末"],
    store: "日光里 Brunch",
    imageLabel: "早午餐",
  },
  {
    id: "skincare",
    title: "氨基酸温和洁面慕斯",
    subtitle: "敏感肌适用 · 正品保障",
    price: 39,
    original: 59,
    rating: "4.9",
    distance: "包邮",
    sales: "8.6k",
    tags: ["好物", "包邮"],
    store: "自然实验室旗舰店",
    imageLabel: "护肤好物",
  },
  {
    id: "snacks",
    title: "低脂海盐芝士全麦饼干",
    subtitle: "办公室零食 · 独立包装",
    price: 26,
    original: 35,
    rating: "4.8",
    distance: "包邮",
    sales: "5.1k",
    tags: ["零食", "低脂"],
    store: "轻食研究所",
    imageLabel: "零食好物",
  },
];

export const discoverTabs = ["关注", "广场", "本地", "好物", "美食", "生活"];

export const discoverPosts = [
  {
    id: "post-1",
    productId: "hotpot",
    title: "周末和朋友去浦东，这家双人餐真的很顶",
    author: "Mia在上海",
    likes: "1.2k",
    height: "h-56",
  },
  {
    id: "post-2",
    productId: "coffee",
    title: "藏在写字楼里的生椰拿铁，下午三点刚刚好",
    author: "小满日记",
    likes: "896",
    height: "h-44",
  },
  {
    id: "post-3",
    productId: "brunch",
    title: "周末早午餐清单｜浦东也有松弛感小店",
    author: "橘子汽水",
    likes: "2.4k",
    height: "h-64",
  },
  {
    id: "post-4",
    productId: "skincare",
    title: "换季维稳好物分享，清爽不拔干",
    author: "阿梨的日常",
    likes: "1.7k",
    height: "h-52",
  },
  {
    id: "post-5",
    productId: "snacks",
    title: "办公室抽屉里的低脂小零食",
    author: "今天吃什么",
    likes: "633",
    height: "h-48",
  },
  {
    id: "post-6",
    productId: "coffee",
    title: "通勤路上顺手买的咖啡，香气很治愈",
    author: "路过风景",
    likes: "472",
    height: "h-60",
  },
];

export const initialCartItems: CartItem[] = [
  {
    id: "cart-1",
    shop: "沪上本帮菜·浦东店",
    title: "火锅双人套餐",
    spec: "鸳鸯锅 · 2人份",
    unit: 88,
    quantity: 1,
    imageLabel: "火锅",
  },
  {
    id: "cart-2",
    shop: "山丘咖啡研究所",
    title: "生椰拿铁下午茶",
    spec: "冰 · 少糖",
    unit: 29,
    quantity: 2,
    imageLabel: "咖啡",
  },
];

export const messageItems = [
  {
    name: "卡兔服务助手",
    time: "10:45",
    preview: "你的订单已完成，感谢使用卡兔服务。",
    unread: true,
    icon: BellRing,
    tone: "bg-[#e4edf2] text-[#6d879f]",
  },
  {
    name: "浦东鲜食优惠",
    time: "昨天",
    preview: "本周会员专享券已到账，点击查看可用优惠。",
    unread: true,
    icon: Gift,
    tone: "bg-[#f5e7df] text-[#bd826d]",
  },
  {
    name: "Mia在上海",
    time: "昨天",
    preview: "回复了你的笔记：这家店真的值得再去一次。",
    unread: false,
    icon: UsersRound,
    tone: "bg-[#e9e7ef] text-[#887c9a]",
  },
  {
    name: "物流助手",
    time: "周一",
    preview: "你的商品正在派送中，预计今天送达。",
    unread: false,
    icon: Truck,
    tone: "bg-[#e5eee8] text-[#718d7c]",
  },
];

export const messageTypes = [
  {
    title: "系统通知",
    count: 2,
    icon: BellRing,
    tone: "bg-[#e3edf3] text-[#6e879d]",
  },
  {
    title: "优惠促销",
    count: 5,
    icon: TicketPercent,
    tone: "bg-[#f5e5df] text-[#c47e6f]",
  },
  {
    title: "互动消息",
    count: 8,
    icon: Smartphone,
    tone: "bg-[#e9e6ef] text-[#88799b]",
  },
];
