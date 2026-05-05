import { Link, Route, Routes } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import CartPage from "./pages/CartPage";
import ProfilePage from "./pages/ProfilePage";
import { products as fallbackProducts } from "./data/products";
import {
  addToCart,
  checkout,
  getCart,
  getLots,
  getOrders,
  refreshAccessToken,
  removeFromCart,
  searchLots,
} from "./lib/api";

export default function App() {
  const [lang, setLang] = useState("uk");
  const [lots, setLots] = useState([]);
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("retrovault_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [tokens, setTokens] = useState(() => {
    const raw = localStorage.getItem("retrovault_tokens");
    return raw ? JSON.parse(raw) : null;
  });

  const persistAuth = useCallback((nextUser, nextTokens) => {
    setUser(nextUser);
    setTokens(nextTokens);
    if (nextUser) {
      localStorage.setItem("retrovault_user", JSON.stringify(nextUser));
      localStorage.setItem("retrovault_tokens", JSON.stringify(nextTokens));
    } else {
      localStorage.removeItem("retrovault_user");
      localStorage.removeItem("retrovault_tokens");
      setCart({ items: [], total_amount: 0 });
      setOrders([]);
    }
  }, []);

  const callWithRefresh = useCallback(
    async (apiCall) => {
      if (!tokens?.access) {
        throw new Error(lang === "uk" ? "Спочатку увійдіть." : "Sign in first.");
      }
      try {
        return await apiCall(tokens.access);
      } catch (e) {
        const msg = String(e.message || "");
        const looksLikeAuth = /token|valid|credential|authentication|not valid/i.test(msg);
        if (!tokens.refresh || !looksLikeAuth) throw e;
        try {
          const data = await refreshAccessToken(tokens.refresh);
          const next = { access: data.access, refresh: data.refresh ?? tokens.refresh };
          setTokens(next);
          localStorage.setItem("retrovault_tokens", JSON.stringify(next));
          return await apiCall(data.access);
        } catch {
          persistAuth(null, null);
          throw new Error(
            lang === "uk" ? "Сесію завершено. Увійдіть знову." : "Session ended. Please sign in again."
          );
        }
      }
    },
    [tokens, persistAuth, lang]
  );

  const reloadCart = useCallback(async () => {
    if (!tokens?.access) return;
    const cartData = await callWithRefresh((access) => getCart(access));
    setCart(cartData);
  }, [tokens?.access, callWithRefresh]);

  const reloadOrders = useCallback(async () => {
    if (!tokens?.access) return;
    const orderData = await callWithRefresh((access) => getOrders(access));
    setOrders(orderData);
  }, [tokens?.access, callWithRefresh]);

  async function reloadLots(query = "") {
    const data = query ? await searchLots(query) : await getLots();
    setLots(data);
  }

  useEffect(() => {
    reloadLots().catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!tokens?.access) return;
    let cancelled = false;
    (async () => {
      try {
        await reloadCart();
        await reloadOrders();
        if (!cancelled) setError("");
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tokens?.access, tokens?.refresh, reloadCart, reloadOrders]);

  const cartCount = useMemo(
    () => (cart.items || []).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const t = {
    uk: {
      navHome: "Головна",
      navCatalog: "Каталог",
      navCart: "Кошик",
      navSignIn: "Увійти",
      navCabinet: "Кабінет",
      signInFirstCart: "Спочатку увійдіть, щоб додавати товари до кошика.",
      signInFirst: "Спочатку увійдіть.",
      brandSubtitle: "Маркетплейс вінтажних речей 50-90-х років",
      aboutSite:
        "RetroVault — це онлайн-магазин вінтажних речей, де можна знайти унікальний одяг, декор, техніку та аксесуари з історією.",
    },
    en: {
      navHome: "Home",
      navCatalog: "Catalog",
      navCart: "Cart",
      navSignIn: "Sign In",
      navCabinet: "Cabinet",
      signInFirstCart: "Sign in first to add lot to cart.",
      signInFirst: "Sign in first.",
      brandSubtitle: "Vintage marketplace for 50s-90s items",
      aboutSite:
        "RetroVault is an online vintage store where you can find unique clothing, decor, tech and accessories with history.",
    },
  }[lang];

  async function handleAddToCart(lotId) {
    if (!tokens?.access) {
      setError(t.signInFirstCart);
      return;
    }
    try {
      setError("");
      const updated = await callWithRefresh((access) => addToCart(lotId, access));
      setCart(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRemoveFromCart(lotId) {
    if (!tokens?.access) return;
    try {
      const updated = await callWithRefresh((access) => removeFromCart(lotId, access));
      setCart(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCheckout(payload) {
    if (!tokens?.access) {
      setError(t.signInFirst);
      return;
    }
    try {
      setError("");
      await callWithRefresh((access) => checkout(payload, access));
      await reloadCart();
      await reloadOrders();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">RV</span>
          <div>
            <strong>RetroVault</strong>
            <p>{t.brandSubtitle}</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost lang-switch" onClick={() => setLang(lang === "uk" ? "en" : "uk")}>
          {lang.toUpperCase()}
        </button>
        <nav className="nav">
          <Link to="/">{t.navHome}</Link>
          <Link to="/catalog">{t.navCatalog}</Link>
          <Link to="/cart">
            {t.navCart} ({cartCount})
          </Link>
          <Link to="/profile">{user ? t.navCabinet : t.navSignIn}</Link>
        </nav>
      </header>
      <section className="site-description">{t.aboutSite}</section>
      {error ? <p className="error">{error}</p> : null}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                products={lots.length ? lots : fallbackProducts}
                addToCart={handleAddToCart}
                onSearch={setSearchQuery}
                lang={lang}
              />
            }
          />
          <Route
            path="/catalog"
            element={
              <CatalogPage
                products={lots.length ? lots : fallbackProducts}
                addToCart={handleAddToCart}
                onSearch={async (query) => {
                  setSearchQuery(query);
                  await reloadLots(query);
                }}
                activeQuery={searchQuery}
                lang={lang}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cart.items || []}
                cartTotal={Number(cart.total_amount || 0)}
                removeFromCart={handleRemoveFromCart}
                checkout={handleCheckout}
                user={user}
                lang={lang}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                user={user}
                tokens={tokens}
                setAuth={persistAuth}
                orders={orders}
                reloadLots={reloadLots}
                lang={lang}
                apiWithAccess={callWithRefresh}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
