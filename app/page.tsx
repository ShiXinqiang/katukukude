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
import { ProductPage } from "../components/pages/product-page";
import { ProfilePage } from "../components/pages/profile-page";
import { PublishPage } from "../components/pages/publish-page";
import { ScanPage } from "../components/pages/scan-page";
import { SearchResultsPage } from "../components/pages/search-page";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [previousView, setPreviousView] = useState<View>("home");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const cartCount = 0;
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { user?: AuthUser | null };
      })
      .then((result) => {
        if (active) setUser(result?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const navigate = (nextView: View) => {
    setPreviousView(view);
    setView(nextView);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    const target = previousView === view ? "home" : previousView;
    setView(target);
    setPreviousView("home");
  };

  const openProduct = (id: string) => {
    setSelectedProductId(id);
    navigate("product");
  };

  const openSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    navigate("search");
  };

  const addToCart = (_quantity: number) => undefined;

  const activeNav: MainTab =
    view === "discover" ||
    view === "scan" ||
    view === "messages" ||
    view === "profile"
      ? view
      : "home";

  const showBottomNav =
    view === "home" ||
    view === "discover" ||
    view === "messages" ||
    view === "profile" ||
    view === "search";

  return (
    <div className="min-h-screen bg-[#dfe6ec]">
      <div className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-x-hidden bg-[#f4f6f8]">
        {view === "home" && (
          <HomePage
            onNavigate={navigate}
            onProduct={openProduct}
            onSearch={openSearch}
            cartCount={cartCount}
          />
        )}

        {view === "discover" && <DiscoverPage onProduct={openProduct} />}

        {view === "messages" && <MessagesPage />}

        {view === "profile" && (
          <ProfilePage
            onNavigate={navigate}
            user={user}
            onLogout={async () => {
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
              });
              setUser(null);
              navigate("home");
            }}
          />
        )}

        {view === "product" && (
          <ProductPage
            productId={selectedProductId}
            onBack={goBack}
            onAddToCart={addToCart}
            onBuy={(total) => {
              setCheckoutTotal(total);
              navigate("checkout");
            }}
          />
        )}

        {view === "publish" && <PublishPage onBack={goBack} />}

        {view === "login" && (
          <LoginPage
            onBack={goBack}
            onSuccess={(nextUser) => {
              setUser(nextUser);
              navigate("profile");
            }}
          />
        )}

        {view === "cart" && (
          <CartPage
            onBack={goBack}
            onCheckout={(total) => {
              setCheckoutTotal(total);
              navigate("checkout");
            }}
          />
        )}

        {view === "checkout" && (
          <CheckoutPage total={checkoutTotal} onBack={goBack} />
        )}

        {view === "search" && (
          <SearchResultsPage
            initialKeyword={searchKeyword}
            onBack={goBack}
            onProduct={openProduct}
          />
        )}

        {view === "scan" && <ScanPage onBack={goBack} />}

        {showBottomNav && (
          <BottomNav activeView={activeNav} onNavigate={navigate} />
        )}
      </div>
    </div>
  );
}
