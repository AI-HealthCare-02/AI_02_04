from locust import HttpUser, task, between

class DangmagoUser(HttpUser):
    wait_time = between(1,3)
    token = None

    def on_start(self):
        response = self.client.post("/auth/login", json={
            "email": "locust@test.com",
            "password": "test1234"
        })
        if response.status_code == 200:
            self.token = response.json()["data"]["access_token"]
            challenges = self.client.get("/challenges",
                headers={"Authorization": f"Bearer {self.token}"})
            self.challenge_id = challenges.json()["data"][0]["challenge_id"]
        else:
            self.token = None
            self.challenge_id = None

    @task(1)
    def get_challenges(self):
        self.client.get('/challenges',
            headers={"Authorization": f"Bearer {self.token}"})

    @task(2)
    def get_dashboard(self):
        self.client.get("/dashboard",
            headers={"Authorization": f"Bearer {self.token}"})

    @task(3)
    def log_challenges(self):
        self.client.post(
            f"/challenges/{self.challenge_id}/log",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"value": 1000}
        )