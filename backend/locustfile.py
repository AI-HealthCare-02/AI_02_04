from locust import HttpUser, task, between

class DangmagoUser(HttpUser):
    wait_time = between(1,3)
    token  = None

    def on_start(self):
        response = self.client.post("/auth/login", json={
            "email" : "test@test.com",
            "password" : "test1234"
        })
        self.token = response.json()["access_token"]
        
    
    @task(1)
    def get_challenges(self):
        response  = self.client.get('challenges',
                        headers ={"Authorization": f"Bearer {self.token}"}
                                    )
        
        
        pass

    @task(3)
    def log_challenges(self):
        response = self.client.post(
            "/challenges/1/log",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"value": 1000}
        )
        