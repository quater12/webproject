import { Link } from "react-router-dom";

export default function HomePage({ products, addToCart, onSearch, lang }) {
  const formatPrice = (value) => {
    const numeric = Number(value || 0);
    if (lang === "uk") return `${numeric.toFixed(2)} грн`;
    return `$${(numeric * 0.027).toFixed(2)}`;
  };
  const tr =
    lang === "uk"
      ? {
          title: "Вінтажні речі з історією для сучасного стилю",
          subtitle:
            "RetroVault об'єднує перевірених продавців та поціновувачів ретро-речей в одному зручному каталозі.",
          search: "Пошук вінтажних товарів...",
          browse: "Переглянути каталог",
          register: "Створити акаунт",
          featured: "Популярні товари",
          viewAll: "Дивитись всі",
          seller: "Продавець",
          buy: "Купити",
        }
      : {
          title: "Vintage items with history for modern style",
          subtitle:
            "RetroVault brings trusted sellers and vintage lovers together in one easy catalog.",
          search: "Search vintage products...",
          browse: "Browse catalog",
          register: "Create account",
          featured: "Featured products",
          viewAll: "View all",
          seller: "Seller",
          buy: "Buy",
        };
  const featured = products.slice(0, 3);

  return (
    <div className="page-grid">
      <section className="hero">
        <h1>{tr.title}</h1>
        <p>{tr.subtitle}</p>
        <input placeholder={tr.search} onChange={(e) => onSearch?.(e.target.value)} />
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/catalog">
            {tr.browse}
          </Link>
          <Link className="btn btn-ghost" to="/profile">
            {tr.register}
          </Link>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>{tr.featured}</h2>
          <Link to="/catalog">{tr.viewAll}</Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <article className="product-card" key={product.id}>
              <img
                className="product-image"
                src={product.primary_image || "https://picsum.photos/seed/vintage/600/400"}
                alt={product.title}
              />
              <span className="badge">{product.category}</span>
              <h3>{lang === "uk" ? product.title : product.title_en || product.title}</h3>
              <p>
                {product.decade} · {product.condition}
              </p>
              {product.description ? (
                <p className="product-description">
                  {lang === "uk" ? product.description : product.description_en || product.description}
                </p>
              ) : null}
              <p className="rating">
                {tr.seller}: {product.seller?.username}
              </p>
              <div className="card-footer">
                <strong>{formatPrice(product.price_uah)}</strong>
                <button type="button" className="btn btn-primary" onClick={() => addToCart(product.id)}>
                  {tr.buy}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
