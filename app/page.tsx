
"use client";
import { useEffect, useState } from "react";
import type { AuthUser, MainTab, View } from "../lib/data";
import { cartQuantity } from "../lib/cart";
import { useAppNavigation } from "../components/use-app-navigation";
import { BottomNav } from "../components/navigation";
import { CartPage } from "../components/pages/cart-page";
import { CheckoutPage } from "../components/pages/checkout-page";
import { MallPage } from "../components/pages/mall-page";
import { HomePage } from "../components/pages/home-page";
import { LoginPage } from "../components/pages/login-page";
import {ShopConversation} from "../components/shop-chat";
import { MessagesPage } from "../components/pages/messages-page";
import { MerchantApplyPage } from "../components/pages/merchant-apply-page";
import { ProductPage } from "../components/pages/product-page";
import { ProfilePage } from "../components/pages/profile-page";
import { ScanPage } from "../components/pages/scan-page";
import { SearchResultsPage } from "../components/pages/search-page";
import { ServicePage } from "../components/pages/service-page";
import { AddressesPage, HomeRoutePage } from "../components/pages/address-pages";
import { PartnerPage } from "../components/pages/partner-page";
import { OrdersPage } from "../components/pages/orders-page";
import { FavoritesPage, LikesPage, SettingsPage } from "../components/pages/account-pages";

export default function Page(){
 const {route,navigate,replace:replaceView,back:goBack}=useAppNavigation();
 const {view,selectedProductId,searchKeyword,ordersFilter,serviceName,serviceParent,checkoutTotal}=route;
 const [authReady,setAuthReady]=useState(false); const [user,setUser]=useState<AuthUser|null>(null); const [cartCount,setCartCount]=useState(0);
 useEffect(()=>{setCartCount(cartQuantity());const sync=()=>setCartCount(cartQuantity());window.addEventListener("katu:cart",sync);return()=>window.removeEventListener("katu:cart",sync)},[]);
 useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store",credentials:"include"}).then(r=>r.ok?r.json():null).then(r=>{if(active)setUser(r?.user??null)}).catch(()=>active&&setUser(null)).finally(()=>active&&setAuthReady(true));return()=>{active=false}},[]);
 const openProduct=(id:string)=>navigate("product",{selectedProductId:id});
 const openSearch=(q:string)=>navigate("search",{searchKeyword:q});
 const openService=(name:string)=>navigate("service",{serviceName:name,serviceParent:null});
 const activeNav:MainTab=(["discover","scan","messages","profile"] as View[]).includes(view)?view as MainTab:"home";
 const showBottomNav=["home","discover","messages","profile","search"].includes(view);
 return <div className="katu-site-background min-h-screen bg-[#dfe6ec]"><div className="katu-app-shell relative mx-auto min-h-screen w-full max-w-[390px] overflow-x-hidden">
  {view==="home"&&<HomePage onNavigate={navigate} onProduct={openProduct} onSearch={openSearch} onService={openService} cartCount={cartCount} user={user} authLoading={!authReady}/>}
  {view==="discover"&&<MallPage onProduct={openProduct} onNavigate={target=>{if(target==="orders"&&!user)navigate("login");else navigate(target)}} cartCount={cartCount}/>}
  {view==="messages"&&<MessagesPage onOpen={id=>navigate("conversation",{conversationId:id})} onLogin={()=>navigate("login")}/>}
  {view==="conversation"&&<ShopConversation onLogin={()=>navigate("login")} key={route.conversationId} id={route.conversationId} onBack={goBack}/>}
  {view==="profile"&&(!authReady?<main className="min-h-screen p-4" aria-busy="true"><p>正在读取账号…</p></main>:<ProfilePage onOrders={filter=>navigate("orders",{ordersFilter:filter})} onNavigate={navigate} user={user} onLogout={async()=>{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});setUser(null);replaceView("home",{depth:0})}}/>)}
  {view==="product"&&<ProductPage onContact={id=>navigate("conversation",{conversationId:id})} onLogin={()=>navigate("login")} onCart={()=>navigate("cart")} key={selectedProductId} productId={selectedProductId} onBack={goBack} onAddToCart={()=>setCartCount(cartQuantity())} onBuy={total=>navigate("checkout",{checkoutTotal:total})}/>}
  {view==="merchantApply"&&<MerchantApplyPage user={user} onBack={goBack} onNavigate={navigate}/>}
  {view==="login"&&<LoginPage onBack={goBack} onSuccess={u=>{setUser(u);goBack()}}/>}
  {view==="cart"&&<CartPage onBack={goBack} onCheckout={total=>navigate("checkout",{checkoutTotal:total})}/>}
  {view==="checkout"&&<CheckoutPage onLogin={()=>navigate("login")} onOrders={()=>replaceView("orders",{ordersFilter:"all"})} total={checkoutTotal} onBack={goBack} onManage={()=>navigate("addresses")}/>}
  {view==="search"&&<SearchResultsPage initialKeyword={searchKeyword} onBack={goBack} onProduct={openProduct}/>}
  {view==="scan"&&<ScanPage onBack={goBack}/>}
  {view==="service"&&<ServicePage key={serviceName} title={serviceName} onBack={goBack} onProduct={openProduct} onService={name=>navigate("service",{serviceName:name,serviceParent:serviceName})}/>}
  {view==="addresses"&&<AddressesPage onBack={goBack}/>}
  {view==="homeRoute"&&<HomeRoutePage onBack={goBack} onManage={()=>navigate("addresses")}/>}
  {view==="partner"&&<PartnerPage onBack={goBack}/>}
  {view==="orders"&&<OrdersPage onContact={id=>navigate("conversation",{conversationId:id})} onReviews={()=>navigate("likes")} initialFilter={ordersFilter} onBack={goBack}/>}
  {view==="favorites"&&<FavoritesPage onBack={goBack} onProduct={openProduct}/>}
  {view==="likes"&&<LikesPage onBack={goBack} onProduct={openProduct}/>}
  {view==="settings"&&<SettingsPage onBack={goBack} onNavigate={navigate}/>}
  {showBottomNav&&<BottomNav activeView={activeNav} onNavigate={navigate}/>}
 </div></div>;
}
