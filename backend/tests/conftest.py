import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("OTP_DEBUG_ECHO", "true")
os.environ["RATE_LIMIT_ENABLED"] = "false"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        yield c


def register_and_verify_driver(client, phone="+263700000099", email="driver1@example.com", password="Password123!"):
    client.post("/api/auth/register", json={"phone": phone, "email": email, "password": password})
    otp_res = client.post("/api/auth/send-otp", json={"phone": phone})
    code = otp_res.json()["debug_code"]
    verify_res = client.post("/api/auth/verify-otp", json={"phone": phone, "code": code})
    token = verify_res.json()["access_token"]
    return token


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_admin_and_login(client, email="admin@takeoff.dev", phone="+263700000000", password="AdminPass123!"):
    from app.core.security import create_access_token, hash_password
    from app.models.enums import UserRole
    from app.models.user import User

    db = TestingSessionLocal()
    try:
        admin = User(
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return create_access_token(subject=str(admin.id), role=admin.role.value)
    finally:
        db.close()
