from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.core.database import get_db, Base

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def register_payload():
    return {
        "email": "test@test.com",
        "password": "test1234",
        "nickname": "테스터",
        "user_type": "normal",
        "gender": 1,
        "age": 30,
        "height": 175.0,
        "weight": 70.0,
        "general_health": 3,
        "is_hypertension": False,
        "is_cholesterol": False,
        "is_heart_disease": False,
        "walking_difficulty": False,
        "alcohol_status": False,
    }


@pytest.fixture
def auth_client(client, register_payload):
    client.post("/auth/register", json=register_payload)

    response = client.post(
        "/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )

    token = response.json()["data"]["access_token"]

    client.headers.update({"Authorization": f"Bearer {token}"})

    return client
