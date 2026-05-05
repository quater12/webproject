from locust import HttpUser, between, task


class RetroVaultUser(HttpUser):
    wait_time = between(1, 2)

    @task(5)
    def open_catalog(self):
        self.client.get("/api/lots/?page=1&limit=20&sort=newest")

    @task(3)
    def run_search(self):
        self.client.get("/api/lots/search/?q=vi")
