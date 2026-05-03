# RetroVault Practical 1-2 Delivery

## Practical 1 - Vision and Scope

### Vision
- Product: `RetroVault` - web marketplace for vintage goods.
- Audience: buyers and sellers in Ukraine.
- Core value: structured catalog by category/decade, trust via ratings/reviews, and end-to-end order flow.

### Scope In
- Public pages: home, catalog, lot cards, seller page.
- Authentication: email/password and Google OAuth (dev-mode stub).
- Seller cabinet: create/edit/archive lots.
- Buyer cabinet: favorites, cart, checkout, orders.
- Reviews after completed orders.
- Admin panel via Django admin.

### Scope Out (current release)
- Built-in payment gateway.
- Real-time chat.
- Mobile native apps.
- Auction/bidding model.
- External Nova Poshta tracking API integration.

### MVP implemented
- Registration/login/logout with JWT.
- Lot CRUD and archive.
- Catalog filters + search + pagination.
- Cart add/remove and checkout.
- Order statuses: pending/shipped/completed.
- Seller page and favorites.
- Review flow after completed order.

---

## Practical 2 - Functional and Non-Functional Requirements

### Functional requirements status

| ID | Status | Notes |
|---|---|---|
| FR-01 Registration | Implemented | Email+password, role buyer/seller, Google OAuth dev-stub endpoint, unique email validation. |
| FR-02 Authentication | Implemented | Email/password login endpoint with JWT (`access 15 min`, `refresh 7 days`), OAuth dev-stub login. |
| FR-03 Logout | Implemented | Refresh token blacklist endpoint accepts body token and Authorization bearer fallback. |
| FR-04 Create lot | Implemented (MVP-level) | Seller-only create lot with metadata and up to 5 image URLs (S3 direct upload not yet wired). |
| FR-05 Edit lot | Implemented | Owner-only lot updates, permission checks, 403 for non-owner. |
| FR-06 Archive lot | Implemented | Archive endpoint sets status `archived`, hidden from catalog. |
| FR-07 Catalog | Implemented | Active lots with filters, sorting, and pagination (`page`, `limit` max 50). |
| FR-08 Search | Implemented | Search by title/tags with min query length validation. |
| FR-09 Lot details | Implemented | Returns lot full object with images and seller public profile fields. |
| FR-10 Add to cart | Implemented | Server-side cart by user, own-lot restriction, sold-lot conflict checks. |
| FR-11 Checkout | Implemented | Converts cart to order, reserves lots, sends seller email (console backend). |
| FR-12 Seller shipment confirm | Implemented | Seller in order can mark shipped and add tracking, buyer email sent. |
| FR-13 Buyer complete order | Implemented | Buyer marks completed, lots become sold. |
| FR-14 Review | Implemented | One review per completed order, seller rating recalculated. |
| FR-15 Favorites | Implemented | Add/remove favorites and read current list. |
| FR-16 Seller page | Implemented | Public seller profile + paginated active lots list. |

### Non-functional requirements status (current level)

| ID | Status | Notes |
|---|---|---|
| NFR-01 page load <2s | Partial | UI optimized and lightweight, no measured p95 report yet. |
| NFR-02 password security | Implemented | Django hashed passwords (PBKDF2 by default), no plaintext logging in app code. |
| NFR-03 TLS + HTTPS redirect | Partial | Local dev on HTTP; production TLS redirect to be done at reverse-proxy level. |
| NFR-04 availability 99% | Partial | Dockerized architecture done; SLA monitoring/rolling update policy not configured yet. |
| NFR-05 graceful 503 | Partial | Main flows return structured errors; global 503 policy still to be centralized. |
| NFR-06 checkout usability | Implemented (MVP) | Single-form checkout with required fields. |
| NFR-07 responsive UI | Implemented (basic) | Adaptive layout for desktop/mobile widths. |
| NFR-08 API <300ms p95 | Implemented (tested profile) | Locust run for catalog/search showed aggregated p95 = 30ms (`docs/perf/performance-report.md`). |
| NFR-09 test coverage >=70% | Implemented | Backend coverage is 80% and CI workflow runs tests on push/PR. |
| NFR-10 accessibility AA | Partial | Semantic HTML and form labels improved, no axe-core audit yet. |
| NFR-11 browser compatibility | Partial | Modern browser support expected, no matrix testing report yet. |
| NFR-12 global CDN | Won't have | Explicitly out of current release scope. |

---

## Deployed API surface (current)
- Auth:
  - `POST /api/auth/register/`
  - `POST /api/auth/token/`
  - `POST /api/auth/oauth/google/`
  - `POST /api/auth/token/refresh/`
  - `POST /api/auth/logout/`
- Lots:
  - `GET /api/lots/`
  - `GET /api/lots/{id}/`
  - `POST /api/lots/`
  - `PATCH /api/lots/{id}/`
  - `PATCH /api/lots/{id}/archive/`
  - `GET /api/lots/search/?q=...`
- Buyer flow:
  - `GET/POST/DELETE /api/cart/`
  - `POST /api/checkout/`
  - `GET /api/orders/`
  - `PATCH /api/orders/{id}/complete/`
  - `GET/POST /api/favorites/`
  - `POST /api/reviews/`
- Seller flow:
  - `PATCH /api/orders/{id}/ship/`
  - `GET /api/sellers/{seller_id}/`
