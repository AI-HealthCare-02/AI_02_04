import pytest


def test_create_health_record_success(auth_client):
    response = auth_client.post(
        "/health/records",
        json={
            "water_intake": 2,
            "steps": 10000,
            "weight": 82,
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert "record_id" in data


def test_get_health_record_success(auth_client):
    auth_client.post(
        "/health/records",
        json={
            "water_intake": 2,
            "steps": 10000,
            "weight": 82,
        },
    )
    response = auth_client.get("/health/records")

    assert response.status_code == 200
    assert len(response.json()["data"]) > 0


def test_create_health_record_unauthorized(client):
    response = client.get('/health/records')
    assert response.status_code == 401