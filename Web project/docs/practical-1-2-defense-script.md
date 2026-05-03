# Practical 1-2 Defense Script (Ready to read)

## Intro
Good afternoon.  
My project is **RetroVault**, a web platform for buying and selling vintage goods from the 1950s-1990s.  
I implemented product vision/scope from Practical 1 and functional/non-functional requirements from Practical 2.

## Practical 1 - Vision and Scope
The problem is fragmented vintage sales across social media without trust and structured search.  
RetroVault provides:
- unified catalog by category/decade;
- seller storefront and lot management;
- buyer cart/checkout/orders;
- trust layer through reviews and seller rating.

MVP scope implemented:
- registration/login;
- lot CRUD for sellers;
- catalog + search + filters;
- cart + checkout;
- seller page and reviews.

Out of scope (as planned):
- built-in payment gateway;
- real-time chat;
- native mobile apps.

## Practical 2 - Functional requirements
Implemented FR-01 .. FR-16 on API and UI level:
- auth with JWT, logout with refresh blacklist;
- email login and Google OAuth dev-stub;
- create/edit/archive lot with ownership checks;
- paginated catalog and text search;
- lot details with seller profile;
- server-side cart and checkout;
- order shipment confirmation and completion;
- one review per completed order;
- favorites and public seller page.

All endpoints are documented in Swagger:
- `http://localhost:8000/api/docs/`

## Non-functional requirements
What is implemented now:
- password hashing via Django built-in secure hash;
- JWT session model with token rotation/blacklist;
- responsive UI;
- CI pipeline for backend tests (`.github/workflows/ci.yml`);
- backend test coverage: **80%** (target >=70% passed).

Performance measurements:
- Locust load test for catalog/search endpoints.
- Aggregated p95 response time: **30 ms** for tested profile.
- Detailed report: `docs/perf/performance-report.md`.

## Architecture and Tech stack
- Backend: Django + DRF + PostgreSQL + JWT
- Frontend: React (Vite)
- Infrastructure: Docker Compose (`frontend`, `backend`, `db`)
- Entry points:
  - `http://localhost:8000/` -> redirects to storefront
  - `http://localhost:5173/` -> frontend

## What I would do next
1. Replace OAuth stub with real Google OAuth verification.
2. Add S3-compatible image upload pipeline.
3. Add production deployment (Gunicorn + Nginx + TLS redirect).
4. Expand load testing to 100+ concurrent users on production-like environment.

## Final statement
Practical 1 and Practical 2 are implemented and documented in the repository, with working end-to-end user flows for buyer and seller.
