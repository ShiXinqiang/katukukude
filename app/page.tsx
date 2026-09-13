
"use client";
import { useEffect, useRef, useState } from "react";
import type { AuthUser, MainTab, View } from "../lib/data";
import { cartQuantity } from "../lib/cart";
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
import { OrdersPage } from "../components/pages/orders-page";
import { FavoritesPage, LikesPage, SettingsPage } from "../components/pages/account-pages";

export default function Page(){
 const [view,setView]=useState<View>("home"); const history=useRef<View[]>([]);
 const [selectedProductId,setSelectedProductId]=useState(""); const [searchKeyword,setSearchKeyword]=useState("");
 const [serviceName,setServiceName]=useState("外卖"); const [serviceParent,setServiceParent]=useState<string|null>(null); const [checkoutTotal,setCheckoutTotal]=useState(0);
 const [user,setUser]=useState<AuthUser|null>(null); const [cartCount,setCartCount]=useState(0);
 useEffect(()=>{try{const mode=localStorage.getItem("katu.theme.mode")||"balanced",savedAccent=localStorage.getItem("katu.theme.accent"),accent=!savedAccent||savedAccent==="106 132 157"?"176 126 89":savedAccent,theme=mode==="clear"?[".58","26px"]:mode==="solid"?[".86","16px"]:[".72","22px"];document.documentElement.style.setProperty("--katu-glass-alpha",theme[0]);document.documentElement.style.setProperty("--katu-blur",theme[1]);document.documentElement.style.setProperty("--katu-accent",accent);document.documentElement.style.setProperty("--katu-accent-strong",accent==="176 126 89"?"151 101 68":accent);if(!savedAccent||savedAccent==="106 132 157")localStorage.setItem("katu.theme.accent",accent)}catch{}},[]);
 useEffect(()=>{setCartCount(cartQuantity());const sync=()=>setCartCount(cartQuantity());window.addEventListener("katu:cart",sync);return()=>window.removeEventListener("katu:cart",sync)},[]);
 useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store",credentials:"include"}).then(r=>r.ok?r.json():null).then(r=>{if(active)setUser(r?.user??null)}).catch(()=>active&&setUser(null));return()=>{active=false}},[]);
 const navigate=(next:View)=>{if(next===view)return;history.current.push(view);setView(next);window.scrollTo({top:0,behavior:"smooth"})};
 const replaceView=(next:View)=>{setView(next);window.scrollTo({top:0,behavior:"smooth"})};
 const goBack=()=>{const target=history.current.pop()||"home";setView(target);window.scrollTo({top:0,behavior:"smooth"})};
 const openProduct=(id:string)=>{setSelectedProductId(id);navigate("product")};
 const openSearch=(q:string)=>{setSearchKeyword(q);navigate("search")};
 const openService=(name:string)=>{setServiceName(name);navigate("service")};
 const activeNav:MainTab=(["discover","scan","messages","profile"] as View[]).includes(view)?view as MainTab:"home";
 const showBottomNav=["home","discover","messages","profile","search"].includes(view);
 return <div className="min-h-screen bg-[#dfe6ec]"><div className="katu-app-shell relative mx-auto min-h-screen w-full max-w-[390px] overflow-x-hidden">
  {view==="home"&&<HomePage onNavigate={navigate} onProduct={openProduct} onSearch={openSearch} onService={openService} cartCount={cartCount} user={user}/>}
  {view==="discover"&&<DiscoverPage onProduct={openProduct}/>}
  {view==="messages"&&<MessagesPage/>}
  {view==="profile"&&<ProfilePage onNavigate={navigate} user={user} onLogout={async()=>{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});setUser(null);history.current=[];replaceView("home")}}/>}
  {view==="product"&&<ProductPage productId={selectedProductId} onBack={goBack} onAddToCart={()=>setCartCount(cartQuantity())} onBuy={total=>{setCheckoutTotal(total);navigate("checkout")}}/>}
  {view==="publish"&&<PublishPage onBack={goBack}/>}
  {view==="merchantApply"&&<MerchantApplyPage user={user} onBack={goBack} onNavigate={navigate}/>}
  {view==="login"&&<LoginPage onBack={goBack} onSuccess={u=>{setUser(u);history.current=history.current.filter(x=>x!=="login");replaceView("profile")}}/>}
  {view==="cart"&&<CartPage onBack={goBack} onCheckout={total=>{setCheckoutTotal(total);navigate("checkout")}}/>}
  {view==="checkout"&&<CheckoutPage total={checkoutTotal} onBack={goBack} onManage={()=>navigate("addresses")}/>}
  {view==="search"&&<SearchResultsPage initialKeyword={searchKeyword} onBack={goBack} onProduct={openProduct}/>}
  {view==="scan"&&<ScanPage onBack={goBack}/>}
  {view==="service"&&<ServicePage title={serviceName} onBack={()=>{if(serviceParent){setServiceName(serviceParent);setServiceParent(null)}else{goBack()}}} onProduct={openProduct} onService={name=>{setServiceParent(serviceName);setServiceName(name)}}/>}
  {view==="addresses"&&<AddressesPage onBack={goBack}/>}
  {view==="homeRoute"&&<HomeRoutePage onBack={goBack} onManage={()=>navigate("addresses")}/>}
  {view==="partner"&&<PartnerPage onBack={goBack}/>}
  {view==="orders"&&<OrdersPage onBack={goBack}/>}
  {view==="favorites"&&<FavoritesPage onBack={goBack} onProduct={openProduct}/>}
  {view==="likes"&&<LikesPage onBack={goBack} onProduct={openProduct}/>}
  {view==="settings"&&<SettingsPage onBack={goBack} onNavigate={navigate}/>}
  {showBottomNav&&<BottomNav activeView={activeNav} onNavigate={navigate}/>}
 </div></div>;
}
