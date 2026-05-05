# RetroVault Performance & Quality Report

## 1) Automated test coverage

Command:
- `docker compose exec backend coverage run --source='retrovault' manage.py test`
- `docker compose exec backend coverage report`

Result:
- Total coverage: **80%**
- Requirement reference: NFR-09 (>=70%) - **met** for backend baseline.

Coverage summary:
- `retrovault/views.py`: 61%
- `retrovault/serializers.py`: 98%
- `retrovault/models.py`: 99%
- `retrovault/tests.py`: 100%
- `retrovault` total: 80%

## 2) API load test (Locust)

Scenario:
- Tool: Locust (`backend/perf/locustfile.py`)
- Target endpoints:
  - `GET /api/lots/?page=1&limit=20&sort=newest`
  - `GET /api/lots/search/?q=vi`
- Run config: `10` users, spawn rate `2/s`, duration `30s`

Command:
- `docker compose exec backend locust -f perf/locustfile.py --headless -u 10 -r 2 -t 30s --host http://localhost:8000 --only-summary`

Observed metrics:
- Requests: `187`
- Failures: `0`
- Aggregated avg: `23 ms`
- Aggregated p95: **`30 ms`**
- Max: `263 ms`

Conclusion:
- For current local environment and tested load profile, API response target under 300ms p95 is satisfied.
- Additional test profile with 100 concurrent users should be executed on a production-like stack (Gunicorn + Nginx) for strict NFR-08 compliance.
