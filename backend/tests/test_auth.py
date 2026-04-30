import pytest


def test_register_success(client, register_payload):
    response = client.post("/auth/register", json=register_payload)
    print(response.json())  # 이거 추가
    assert response.status_code == 201
    data = response.json()["data"]
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user_type"] == "normal"


def test_register_duplicate_email(client, register_payload):
    client.post("/auth/register", json=register_payload)
    response = client.post("/auth/register", json=register_payload)

    assert response.status_code == 400
    assert "detail" in response.json()


def test_login_success(client, register_payload):
    client.post("/auth/register", json=register_payload)
    response = client.post(
        "/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )

    assert response.status_code == 200
    assert "access_token" in response.json()["data"]
    assert "refresh_token" in response.json()["data"]


def test_login_wrong_password(client, register_payload):
    client.post("/auth/register", json=register_payload)

    response = client.post(
        "/auth/login",
        json={"email": register_payload["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401
