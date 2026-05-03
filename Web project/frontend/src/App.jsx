import { Link, Route, Routes } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

  async function reloadCart() {
    if (!tokens?.access) return;
    const cartData = await getCart(tokens.access);
    setCart(cartData);
  }

  async function reloadOrders() {
    if (!tokens?.access) return;
    const orderData = await getOrders(tokens.access);
    setOrders(orderData);
  }

  async function reloadLots(query = "") {
    const data = query ? await searchLots(query) : await getLots();
    setLots(data);
  }

  useEffect(() => {
    reloadLots().catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!tokens?.access) return;
    reloadCart().catch((loadError) => setError(loadError.message));
    reloadOrders().catch((loadError) => setError(loadError.message));
  }, [tokens]);

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

  function persistAuth(nextUser, nextTokens) {
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
  }

  async function handleAddToCart(lotId) {
    if (!tokens?.access) {
      setError(t.signInFirstCart);
      return;
    }
    const updated = await addToCart(lotId, tokens.access);
    setCart(updated);
  }

  async function handleRemoveFromCart(lotId) {
    if (!tokens?.access) return;
    const updated = await removeFromCart(lotId, tokens.access);
    setCart(updated);
  }

  async function handleCheckout(payload) {
    if (!tokens?.access) {
      setError(t.signInFirst);
      return;
    }
    await checkout(payload, tokens.access);
    await reloadCart();
    await reloadOrders();
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
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
