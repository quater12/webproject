import { useState } from "react";
import { createLot, loginUser, logoutUser, registerUser } from "../lib/api";

export default function ProfilePage({ user, tokens, setAuth, orders, reloadLots, lang }) {
  const tr =
    lang === "uk"
      ? {
          cabinet: "Особистий кабінет",
          logout: "Вийти",
          signedAs: "Увійшли як",
          role: "Роль",
          createLot: "Створити лот",
          publish: "Опублікувати лот",
          myOrders: "Мої замовлення",
          noOrders: "Поки що немає замовлень.",
          status: "Статус",
          total: "Сума",
          account: "Акаунт",
          register: "Реєстрація",
          login: "Вхід",
          errPrefix: "Помилка авторизації",
          registerBtn: "Зареєструватися і увійти",
          loginBtn: "Увійти",
        }
      : {
          cabinet: "Personal cabinet",
          logout: "Logout",
          signedAs: "Signed in as",
          role: "Role",
          createLot: "Create lot",
          publish: "Publish lot",
          myOrders: "My orders",
          noOrders: "No orders yet.",
          status: "Status",
          total: "Total",
          account: "Account",
          register: "Register",
          login: "Login",
          errPrefix: "Auth error",
          registerBtn: "Register and login",
          loginBtn: "Login",
        };
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [lotForm, setLotForm] = useState({
    title: "",
    description: "",
    price_uah: "",
    category: "clothes",
    decade: "80s",
    condition: "good",
    tags: "",
    image_urls: ["https://picsum.photos/500/300"],
  });
  const [error, setError] = useState("");

  function updateField(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      let authTokens;
      let authUser;
      if (mode === "register") {
        const registerResult = await registerUser(form);
        authTokens = registerResult.tokens;
        authUser = registerResult.user;
      } else {
        const loginResult = await loginUser({ email: form.email, password: form.password });
        authTokens = { access: loginResult.access, refresh: loginResult.refresh };
        authUser = loginResult.user;
      }
      setAuth(authUser, authTokens);
    } catch (submitError) {
      setError(`${tr.errPrefix}: ${submitError.message}`);
    }
  }

  async function logout() {
    try {
      if (tokens?.refresh && tokens?.access) {
        await logoutUser(tokens.refresh, tokens.access);
      }
    } catch (logoutError) {
      // Ignore logout failure and clear local auth anyway.
    }
    setAuth(null, null);
  }

  async function handleCreateLot(event) {
    event.preventDefault();
    setError("");
    try {
      await createLot(
        {
          ...lotForm,
          price_uah: Number(lotForm.price_uah),
        },
        tokens.access
      );
      await reloadLots();
      setLotForm((prev) => ({ ...prev, title: "", description: "", price_uah: "", tags: "" }));
    } catch (lotError) {
      setError(lotError.message);
    }
  }

  if (user) {
    return (
      <section>
        <div className="section-head">
          <h1>{tr.cabinet}</h1>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            {tr.logout}
          </button>
        </div>
        <p>
          {tr.signedAs} <strong>{user.email}</strong>
        </p>
        <p>
          {tr.role}: {lang === "uk" ? "покупець і продавець" : "buyer and seller"}
        </p>
        <>
          <h2>{tr.createLot}</h2>
          <form className="auth-form" onSubmit={handleCreateLot}>
              <input
                placeholder="Title"
                value={lotForm.title}
                onChange={(e) => setLotForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <input
                placeholder="Description"
                value={lotForm.description}
                onChange={(e) => setLotForm((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
              <input
                type="number"
                placeholder="Price UAH"
                value={lotForm.price_uah}
                onChange={(e) => setLotForm((prev) => ({ ...prev, price_uah: e.target.value }))}
                required
              />
              <select
                value={lotForm.category}
                onChange={(e) => setLotForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="clothes">clothes</option>
                <option value="furniture">furniture</option>
                <option value="tech">tech</option>
                <option value="tableware">tableware</option>
                <option value="accessories">accessories</option>
              </select>
              <select
                value={lotForm.decade}
                onChange={(e) => setLotForm((prev) => ({ ...prev, decade: e.target.value }))}
              >
                <option value="50s">50s</option>
                <option value="60s">60s</option>
                <option value="70s">70s</option>
                <option value="80s">80s</option>
                <option value="90s">90s</option>
              </select>
              <select
                value={lotForm.condition}
                onChange={(e) => setLotForm((prev) => ({ ...prev, condition: e.target.value }))}
              >
                <option value="mint">mint</option>
                <option value="good">good</option>
                <option value="fair">fair</option>
              </select>
              <input
                placeholder="Tags (comma separated)"
                value={lotForm.tags}
                onChange={(e) => setLotForm((prev) => ({ ...prev, tags: e.target.value }))}
              />
              <button type="submit" className="btn btn-primary">
                {tr.publish}
              </button>
          </form>
        </>
        <h2>{tr.myOrders}</h2>
        {orders.length === 0 ? (
          <p>{tr.noOrders}</p>
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <h3>{order.id}</h3>
                <p>
                  {tr.status}: {order.status}
                </p>
                <p>
                  {tr.total}: {Number(order.total_amount || 0).toFixed(2)} UAH
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section>
      <div className="section-head">
        <h1>{tr.account}</h1>
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === "register" ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setMode("register")}
          >
            {tr.register}
          </button>
          <button
            type="button"
            className={mode === "login" ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setMode("login")}
          >
            {tr.login}
          </button>
        </div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {mode === "register" ? (
          <input name="username" placeholder="Username" value={form.username} onChange={updateField} />
        ) : null}
        <input name="email" placeholder="Email" value={form.email} onChange={updateField} required />
        {mode === "register" && (
          <>
            <input name="first_name" placeholder="First name" value={form.first_name} onChange={updateField} />
            <input name="last_name" placeholder="Last name" value={form.last_name} onChange={updateField} />
          </>
        )}
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={updateField}
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn btn-primary">
          {mode === "register" ? tr.registerBtn : tr.loginBtn}
        </button>
      </form>
    </section>
  );
}
