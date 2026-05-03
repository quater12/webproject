const jsonHeaders = { "Content-Type": "application/json" };

function extractErrorMessage(data, statusCode) {
  if (!data) return "Unknown error";
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "string") return data;
  if (typeof data === "object" && Object.keys(data).length === 0) return `Request failed (${statusCode})`;
  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue) && firstValue.length > 0) return String(firstValue[0]);
  if (typeof firstValue === "string") return firstValue;
  return JSON.stringify(data);
}

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }
  return data;
}

function authHeaders(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function registerUser(payload) {
  return request("/api/auth/register/", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return request("/api/auth/token/", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
}

export async function logoutUser(refreshToken, accessToken) {
  return request("/api/auth/logout/", {
    method: "POST",
    headers: { ...jsonHeaders, ...authHeaders(accessToken) },
    body: JSON.stringify({ refresh: refreshToken }),
  });
}

export async function getLots(params = {}) {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : "";
  const data = await request(`/api/lots/${suffix}`);
  return data.results || data;
}

export async function searchLots(query) {
  const data = await request(`/api/lots/search/?q=${encodeURIComponent(query)}`);
  return data.results || data;
}

export async function createLot(payload, accessToken) {
  return request("/api/lots/", {
    method: "POST",
    headers: { ...jsonHeaders, ...authHeaders(accessToken) },
    body: JSON.stringify(payload),
  });
}

export async function getCart(accessToken) {
  return request("/api/cart/", { headers: authHeaders(accessToken) });
}

export async function addToCart(lotId, accessToken) {
  return request("/api/cart/", {
    method: "POST",
    headers: { ...jsonHeaders, ...authHeaders(accessToken) },
    body: JSON.stringify({ lot_id: lotId, quantity: 1 }),
  });
}

export async function removeFromCart(lotId, accessToken) {
  return request(`/api/cart/?lot_id=${lotId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

export async function checkout(payload, accessToken) {
  return request("/api/checkout/", {
    method: "POST",
    headers: { ...jsonHeaders, ...authHeaders(accessToken) },
    body: JSON.stringify(payload),
  });
}

export async function getOrders(accessToken) {
  return request("/api/orders/", { headers: authHeaders(accessToken) });
}
