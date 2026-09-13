
import type { LucideIcon } from "lucide-react";
import { Bike, CarFront, Home, Hotel, MoreHorizontal, Plane, ShoppingBag, ShoppingBasket, Smartphone, WalletCards, ArrowLeftRight, BellRing, TicketPercent, MessageCircle } from "lucide-react";

export type View = "home"|"discover"|"scan"|"messages"|"profile"|"product"|"publish"|"merchantApply"|"login"|"cart"|"checkout"|"search"|"service"|"homeRoute"|"addresses"|"partner"|"orders";
export type MainTab = "home"|"discover"|"scan"|"messages"|"profile";
export type UserRole = "user"|"merchant"|"admin";
export type UserStatus = "active"|"suspended";
export type AuthUser={id:string;username:string;displayName:string;role:UserRole;status:UserStatus;createdAt:string};
export type AdminOverview={users:number;activeSessions:number;orders:number;broadcasts:number;notifications:number;merchants:number;pendingApplications:number};
export type AdminUserRecord={id:string;username:string;displayName:string;role:UserRole;status:UserStatus;createdAt:string};
export type AdminOrderRecord={id:string;orderNo:string;userId:string|null;username:string|null;displayName:string|null;status:string;paymentStatus:string;totalAmount:string;paidAmount:string|null;transactionId:string|null;createdAt:string;updatedAt:string};
export type AdminOrderDetail=AdminOrderRecord&{shippingName:string|null;shippingPhone:string|null;shippingAddress:string|null;items:unknown};
export type AdminBroadcastRecord={id:string;title:string;content:string;recipientCount:number;createdAt:string};
export type MerchantApplicationStatus="pending"|"approved"|"rejected";
export type MerchantDocumentRecord={id:string;kind:"store_photo"|"store_video";fileName:string;fileSize:number;mimeType:string};
export type MerchantApplicationRecord={id:string;userId:string;username?:string;displayName?:string;storeNameCn:string|null;storeNameMm:string|null;phone:string;email:string|null;tgAccount:string|null;wechatAccount:string|null;businessType:string;stateRegion:string;city:string;township:string;address:string;mapLink:string|null;locationLat:string|null;locationLng:string|null;description:string;documentIds:string[];documents?:MerchantDocumentRecord[];documentCount?:number;status:MerchantApplicationStatus;reviewNote:string|null;submittedAt:string;updatedAt:string;reviewedAt:string|null};
export type MerchantRecord={id:string;userId:string;storeNameCn:string;storeNameMm:string|null;phone:string;businessType:string;stateRegion:string;city:string;township:string;address:string;description:string;status:string;approvedAt:string};
export type MerchantOverview={products:number;activeProducts:number;orders:number;pendingOrders:number;revenue:number};
export type ProductSpec={name:string;values:string[]};
export type MerchantProductRecord={id:string;title:string;subtitle:string|null;description:string;category:string;price:string;originalPrice:string|null;stock:number;status:"draft"|"pending"|"active"|"rejected"|"archived";images:string[];badge:string|null;tags:string[];specifications:ProductSpec[];shippingFee:string;freeShipping:boolean;serviceGuarantees:string[];promotionTitle:string|null;rejectionReason:string|null;isOfficial:boolean;isFeatured:boolean;isRecommended:boolean;sortOrder:number;salesCount:number;ratingAverage:string;ratingCount:number;createdAt:string;updatedAt:string};
export type ProductData={id:string;title:string;subtitle:string;description?:string;price:number;original:number;rating:string;ratingCount?:number;distance:string;sales:string;salesCount?:number;tags:string[];store:string;imageLabel:string;images?:string[];category?:string;stock?:number;badge?:string|null;isOfficial?:boolean;isFeatured?:boolean;isRecommended?:boolean;promotionTitle?:string|null;specifications?:ProductSpec[];shippingFee?:number;freeShipping?:boolean;serviceGuarantees?:string[]};
export type ServiceItem={name:string;icon:LucideIcon;tone:string};
export type CartItem={id:string;shop:string;title:string;spec:string;unit:number;quantity:number;imageLabel:string};
export const formatMoney=(value:number)=>`Ks ${value.toLocaleString("zh-CN")}`;
export const services:ServiceItem[]=[
{name:"外卖",icon:Bike,tone:"bg-[#e5edf2] text-[#6d879e]"},
{name:"打车",icon:CarFront,tone:"bg-[#f5e8dc] text-[#c78a62]"},
{name:"超市",icon:ShoppingBasket,tone:"bg-[#e5eee8] text-[#71917d]"},
{name:"酒店",icon:Hotel,tone:"bg-[#eee8dc] text-[#a78c63]"},
{name:"充值",icon:Smartphone,tone:"bg-[#e4edf1] text-[#66879c]"},
{name:"旅游",icon:Plane,tone:"bg-[#e7edf4] text-[#7189a3]"},
{name:"到家",icon:Home,tone:"bg-[#f0e7e2] text-[#ab7d6d]"},
{name:"好物",icon:ShoppingBag,tone:"bg-[#e9edf0] text-[#70808e]"},
{name:"闪兑",icon:ArrowLeftRight,tone:"bg-[#e7eef0] text-[#648890]"},
{name:"更多",icon:MoreHorizontal,tone:"bg-[#edf0f2] text-[#7c8992]"}];
export const discoverTabs=["关注","广场","本地","好物","美食","生活"];
export const messageTypes=[{title:"系统通知",icon:BellRing,tone:"bg-[#e3edf3] text-[#6e879d]"},{title:"优惠促销",icon:TicketPercent,tone:"bg-[#f5e5df] text-[#c47e6f]"},{title:"互动消息",icon:MessageCircle,tone:"bg-[#e9e6ef] text-[#88799b]"}];
export const catalogProducts:ProductData[]=[
{id:"demo-food-1",title:"仰光精选双人餐 · 招牌主食与饮品",subtitle:"本地热门套餐",price:28500,original:34000,rating:"4.8",distance:"1.2km",sales:"月售 268",tags:["到店可用","本地热门"],store:"Golden Yangon Kitchen",imageLabel:"美食套餐图片"},
{id:"demo-market-1",title:"进口水果礼盒 · 新鲜配送到家",subtitle:"当日优选",price:42000,original:48000,rating:"4.7",distance:"2.6km",sales:"月售 136",tags:["新鲜","可配送"],store:"Katu Fresh",imageLabel:"水果礼盒图片"},
{id:"demo-hotel-1",title:"市中心精品酒店高级房一晚",subtitle:"含双人早餐",price:88000,original:105000,rating:"4.9",distance:"3.1km",sales:"已订 92",tags:["可取消","含早餐"],store:"Yangon City Stay",imageLabel:"酒店房间图片"},
{id:"demo-home-1",title:"居家清洁服务 3 小时",subtitle:"专业人员上门",price:35000,original:40000,rating:"4.8",distance:"4.0km",sales:"月售 74",tags:["上门服务","可预约"],store:"安心到家",imageLabel:"到家服务图片"}];
export const discoverPosts:any[]=[];
export const initialCartItems:CartItem[]=[];
