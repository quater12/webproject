import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function CartPage({
  cartItems,
  cartTotal,
  removeFromCart,
  checkout,
  user,
  lang,
}) {
  const tr =
    lang === "uk"
      ? {
          title: "Кошик",
          empty: "Ваш кошик порожній. Додайте товари з каталогу.",
          total: "Сума",
          checkout: "Оформити замовлення",
          signin: "Увійдіть для оформлення",
          remove: "Видалити",
        }
      : {
          title: "Cart",
          empty: "Your cart is empty. Add items from catalog.",
          total: "Total",
          checkout: "Checkout now",
          signin: "Sign in to checkout",
          remove: "Remove",
        };
  const formatPrice = (value) => {
    const numeric = Number(value || 0);
    if (lang === "uk") return `${numeric.toFixed(2)} грн`;
    return `$${(numeric * 0.027).toFixed(2)}`;
  };
  const navigate = useNavigate();
  const [form, setForm] = useState({
    recipient_full_name: "",
    phone: "",
    city: "",
    postal_operator: "nova_poshta",
    delivery_point: "",
  });
  const [error, setError] = useState("");

  async function handleCheckout() {
    setError("");
    if (!user) {
      navigate("/profile");
      return;
    }
    try {
      await checkout(form);
      alert("Order placed successfully.");
      navigate("/profile");
    } catch (checkoutError) {
      setError(checkoutError.message);
    }
  }

  return (
    <section>
      <h1>{tr.title}</h1>
      {cartItems.length === 0 ? (
        <p>{tr.empty}</p>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <article key={item.id} className="cart-item">
                <div>
                  <h3>{item.lot?.title}</h3>
                  <p>
                    {item.lot?.category || "-"} · {formatPrice(item.lot?.price_uah || 0)}
                  </p>
                </div>
                <div className="cart-actions">
                  <span>x{item.quantity}</span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeFromCart(item.lot?.id)}
                  >
                    {tr.remove}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="auth-form">
            <input
              placeholder="Receiver full name"
              value={form.recipient_full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, recipient_full_name: e.target.value }))}
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
            <select
              value={form.postal_operator}
              onChange={(e) => setForm((prev) => ({ ...prev, postal_operator: e.target.value }))}
            >
              <option value="nova_poshta">Nova Poshta</option>
              <option value="ukrposhta">Ukrposhta</option>
            </select>
            <input
              placeholder="Branch number or courier address"
              value={form.delivery_point}
              onChange={(e) => setForm((prev) => ({ ...prev, delivery_point: e.target.value }))}
            />
          </div>
          <div className="checkout-bar">
            <strong>
              {tr.total}: {formatPrice(cartTotal)}
            </strong>
            <button type="button" className="btn btn-primary" onClick={handleCheckout}>
              {user ? tr.checkout : tr.signin}
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </>
      )}
    </section>
  );
}
