
"use client";
import { useEffect, useState } from "react";
import type { AuthUser, MainTab, View } from "../lib/data";
import { BottomNav } from "../components/navigation";
import { CartPage } from "../components/pages/cart-page";
import { CheckoutPage } from "../components/pages/checkout-page";
import { DiscoverPage } from "../components/pages/discover-page";
import { HomePage } from "../components/pages/home-page";
import { LoginPage } from "../components/pages/login-page";
import { MessagesPage } from "../components/pages/messages-page";
import { MerchantApplyPage } from "../components/pages/merchant-apply-page";
import { ProductPage } from "../components/pages/product-page";
import { ProfilePage } from "../components/pages/profile-page";
import { PublishPage } from "../components/pages/publish-page";
import { ScanPage } from "../components/pages/scan-page";
import { SearchResultsPage } from "../components/pages/search-page";
import { ServicePage } from "../components/pages/service-page";
import { AddressesPage, HomeRoutePage } from "../components/pages/address-pages";
import { PartnerPage } from "../components/pages/partner-page";

export default function Page(){
 const [view,setView]=useState<View>("home"); const [history,setHistory]=useState<View[]>([]);
 const [selectedProductId,setSelectedProductId]=useState(""); const [searchKeyword,setSearchKeyword]=useState("");
 const [serviceName,setServiceName]=useState("外卖"); const [checkoutTotal,setCheckoutTotal]=useState(0);
 const [user,setUser]=useState<AuthUser|null>(null); const cartCount=0;
 useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store",credentials:"include"}).then(r=>r.ok?r.json():null).then(r=>{if(active)setUser(r?.user??null)}).catch(()=>active&&setUser(null));return()=>{active=false}},[]);
 const navigate=(next:View)=>{setHistory(h=>[...h,view]);setView(next);window.scrollTo({top:0,behavior:"smooth"})};
 const goBack=()=>{const next=[...history];setView(next.pop()||"home");setHistory(next)};
 const openProduct=(id:string)=>{setSelectedProductId(id);navigate("product")};
 const openSearch=(q:string)=>{setSearchKeyword(q);navigate("search")};
 const openService=(name:string)=>{setServiceName(name);navigate("service")};
 const activeNav:MainTab=(["discover","scan","messages","profile"] as View[]).includes(view)?view as MainTab:"home";
 const showBottomNav=["home","discover","messages","profile","search"].includes(view);
 return <div className="min-h-screen bg-[#dfe6ec]"><div className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-x-hidden bg-[#f4f6f8]">
  {view==="home"&&<HomePage onNavigate={navigate} onProduct={openProduct} onSearch={openSearch} onService={openService} cartCount={cartCount} user={user}/>}
  {view==="discover"&&<DiscoverPage onProduct={openProduct}/>}
  {view==="messages"&&<MessagesPage/>}
  {view==="profile"&&<ProfilePage onNavigate={navigate} user={user} onLogout={async()=>{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});setUser(null);navigate("home")}}/>}
  {view==="product"&&<ProductPage productId={selectedProductId} onBack={goBack} onAddToCart={()=>undefined} onBuy={total=>{setCheckoutTotal(total);navigate("checkout")}}/>}
  {view==="publish"&&<PublishPage onBack={goBack}/>}
  {view==="merchantApply"&&<MerchantApplyPage user={user} onBack={goBack} onNavigate={navigate}/>}
  {view==="login"&&<LoginPage onBack={goBack} onSuccess={u=>{setUser(u);navigate("profile")}}/>}
  {view==="cart"&&<CartPage onBack={goBack} onCheckout={total=>{setCheckoutTotal(total);navigate("checkout")}}/>}
  {view==="checkout"&&<CheckoutPage total={checkoutTotal} onBack={goBack}/>}
  {view==="search"&&<SearchResultsPage initialKeyword={searchKeyword} onBack={goBack} onProduct={openProduct}/>}
  {view==="scan"&&<ScanPage onBack={goBack}/>}
  {view==="service"&&<ServicePage title={serviceName} onBack={goBack} onProduct={openProduct} onService={name=>setServiceName(name)}/>}
  {view==="addresses"&&<AddressesPage onBack={goBack}/>}
  {view==="homeRoute"&&<HomeRoutePage onBack={goBack} onManage={()=>navigate("addresses")}/>}
  {view==="partner"&&<PartnerPage onBack={goBack}/>}
  {showBottomNav&&<BottomNav activeView={activeNav} onNavigate={navigate}/>}
 </div></div>;
}
