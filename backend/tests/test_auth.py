def test_register_creates_unverified_driver(client):
    res = client.post(
        "/api/auth/register",
        json={"phone": "+263700000010", "email": "a@example.com", "password": "Password123!"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["phone"] == "+263700000010"
    assert body["is_verified"] is False
    assert body["role"] == "DRIVER"


def test_register_duplicate_phone_rejected(client):
    payload = {"phone": "+263700000011", "email": "b@example.com", "password": "Password123!"}
    client.post("/api/auth/register", json=payload)
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400


def test_login_before_verification_still_works_with_password(client):
    client.post(
        "/api/auth/register",
        json={"phone": "+263700000012", "email": "c@example.com", "password": "Password123!"},
    )
    res = client.post("/api/auth/login", json={"identifier": "c@example.com", "password": "Password123!"})
    assert res.status_code == 200
    assert res.json()["role"] == "DRIVER"


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/auth/register",
        json={"phone": "+263700000013", "email": "d@example.com", "password": "Password123!"},
    )
    res = client.post("/api/auth/login", json={"identifier": "d@example.com", "password": "WrongPass1!"})
    assert res.status_code == 401


def test_full_otp_flow_returns_token_and_verifies_user(client):
    phone = "+263700000014"
    client.post("/api/auth/register", json={"phone": phone, "password": "Password123!"})
    otp_res = client.post("/api/auth/send-otp", json={"phone": phone})
    assert otp_res.status_code == 200
    code = otp_res.json()["debug_code"]
    assert code is not None and len(code) == 6

    verify_res = client.post("/api/auth/verify-otp", json={"phone": phone, "code": code})
    assert verify_res.status_code == 200
    token = verify_res.json()["access_token"]

    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["is_verified"] is True


def test_me_requires_authentication(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_logout_revokes_the_token(client):
    from tests.conftest import auth_headers, register_and_verify_driver

    token = register_and_verify_driver(client, phone="+263700000015")
    headers = auth_headers(token)

    # Token works before logout
    assert client.get("/api/auth/me", headers=headers).status_code == 200

    logout_res = client.post("/api/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Same token is now rejected, even though it hasn't naturally expired
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 401


def test_logout_requires_authentication(client):
    res = client.post("/api/auth/logout")
    assert res.status_code == 401
