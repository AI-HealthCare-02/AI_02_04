import pytest


def test_challenge_log_success(auth_client):
    challenges = auth_client.get("/challenges").json()["data"]
    challenge_id = challenges[0]["challenge_id"]

    response = auth_client.post(
        f"/challenges/{challenge_id}/log",
        json={
            "value": 100000,
            "execution_time": "morning",
        },
    )
    print(response.json())
    assert response.status_code == 201
    assert response.json()["data"]["points_earned"] > 0
