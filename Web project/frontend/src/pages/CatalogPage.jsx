import { useMemo, useState } from "react";
import { categoryLabel, lotTagLine } from "../lib/lotLabels";

export default function CatalogPage({ products, addToCart, onSearch, activeQuery, lang }) {
  const formatPrice = (value) => {
    const numeric = Number(value || 0);
    if (lang === "uk") return `${numeric.toFixed(2)} грн`;
    return `$${(numeric * 0.027).toFixed(2)}`;
  };
  const tr =
    lang === "uk"
      ? {
          title: "Каталог",
          items: "товарів",
          search: "Пошук за назвою...",
          searchQuery: "Пошуковий запит",
          seller: "Продавець",
          add: "Додати в кошик",
          allCategories: "Усі категорії",
        }
      : {
          title: "Catalog",
          items: "items",
          search: "Search by title...",
          searchQuery: "Search query",
          seller: "Seller",
          add: "Add to cart",
          allCategories: "All categories",
        };
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))],
    [products]
  );

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const byCategory = categoryFilter === "all" || product.category === categoryFilter;
        const compareTitle = lang === "uk" ? product.title : product.title_en || product.title;
        const bySearch = compareTitle.toLowerCase().includes(search.toLowerCase());
        return byCategory && bySearch;
      }),
    [products, categoryFilter, search, lang]
  );

  return (
    <section>
      <div className="section-head">
        <h1>{tr.title}</h1>
        <p>
          {visibleProducts.length} {tr.items}
        </p>
      </div>

      <div className="filters">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            onSearch?.(event.target.value);
          }}
          placeholder={tr.search}
        />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">{tr.allCategories}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category, lang)}
            </option>
          ))}
        </select>
      </div>
      {activeQuery ? (
        <p className="rating">
          {tr.searchQuery}: {activeQuery}
        </p>
      ) : null}

      <div className="product-grid">
        {visibleProducts.map((product) => (
          <article className="product-card" key={product.id}>
            <img
              className="product-image"
              src={product.primary_image || "https://picsum.photos/seed/vintage/600/400"}
              alt={product.title}
            />
            <span className="badge">{categoryLabel(product.category, lang)}</span>
            <h3>{lang === "uk" ? product.title : product.title_en || product.title}</h3>
            <p>{lotTagLine(product, lang)}</p>
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
                {tr.add}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
