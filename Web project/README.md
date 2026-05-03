# RetroVault

Backend: Django + DRF + JWT + PostgreSQL in Docker  
Frontend: React (Vite, Dockerized)

## Repository Structure
- `backend/` - Django project and DRF app
- `frontend/` - React storefront wired to backend API
- `docs/` - UML, ERD, C4, user stories, API contract, wireframes
- `docker-compose.yml` - frontend + backend + db containers
- `.env.example` - required environment variables

## Run with Docker
1. Copy env:
   - `copy .env.example .env`
2. Build and run:
   - `docker compose up --build`
3. Run migrations:
   - `docker compose exec backend python manage.py makemigrations`
   - `docker compose exec backend python manage.py migrate`
4. (Optional) create superuser:
   - `docker compose exec backend python manage.py createsuperuser`

## Check persistence (DB volume)
1. Create data in admin or API.
2. Restart containers:
   - `docker compose down`
   - `docker compose up -d`
3. Verify records still exist (volume `postgres_data`).

## DRF and Swagger
- OpenAPI schema: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`
- Auth endpoints:
  - `POST /api/auth/register/`
  - `POST /api/auth/token/` (email + password)
  - `POST /api/auth/oauth/google/` (dev-mode stub)
  - `POST /api/auth/token/refresh/`
  - `POST /api/auth/logout/`

## Example API Requests
1. Get catalog:
   - `GET /api/lots/?page=1&limit=20&sort=newest`
2. Add lot to cart (auth required):
   - `POST /api/cart/`
3. Checkout (auth required):
   - `POST /api/checkout/`

## Frontend
- Runs automatically with Docker Compose on `http://localhost:5173`.
- Backend root `http://localhost:8000/` redirects to frontend.

## Quality checks
- Backend tests:
  - `docker compose exec backend python manage.py test`
- Coverage:
  - `docker compose exec backend coverage run --source='retrovault' manage.py test`
  - `docker compose exec backend coverage report`
- Load test (catalog/search):
  - `docker compose exec backend locust -f perf/locustfile.py --headless -u 10 -r 2 -t 30s --host http://localhost:8000 --only-summary`

Routes:
- `/`
- `/catalog`
- `/cart`
- `/profile`

## Docs Mapping to Tasks
- Practical 1-2 delivery matrix: `docs/practical-1-2-delivery.md`
- Practical 1-2 defense script: `docs/practical-1-2-defense-script.md`
- Performance and coverage report: `docs/perf/performance-report.md`
- Practical 4: project structure, Docker, backend container, JWT auth
- Practical 5: user stories in `docs/report-practical-5-6.md`
- Practical 6: UML use case and detailed scenarios in `docs/uml/`
- C4 diagrams: `docs/diagrams/c4-level1-system-context.puml`, `docs/diagrams/c4-level2-container.puml`
- ERD: `docs/diagrams/erd.puml`
- Data dictionary: `docs/data-dictionary.md`
- User flow and wireframes: `docs/user-flow.md`, `docs/wireframes-lowfi.md`

## VS Code Extensions
- Docker
- Python
