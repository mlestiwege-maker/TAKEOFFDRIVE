def test_wrong_code_is_rejected(client):
    phone = "+263700000020"
    client.post("/api/auth/register", json={"phone": phone, "password": "Password123!"})
    client.post("/api/auth/send-otp", json={"phone": phone})

    res = client.post("/api/auth/verify-otp", json={"phone": phone, "code": "000000"})
    assert res.status_code == 400


def test_repeated_wrong_codes_eventually_locked_out(client):
    phone = "+263700000021"
    client.post("/api/auth/register", json={"phone": phone, "password": "Password123!"})
    client.post("/api/auth/send-otp", json={"phone": phone})

    last_res = None
    for _ in range(10):
        last_res = client.post("/api/auth/verify-otp", json={"phone": phone, "code": "000000"})

    assert last_res.status_code == 400
    assert "attempts" in last_res.json()["detail"].lower()


def test_send_otp_for_unknown_phone_404s(client):
    res = client.post("/api/auth/send-otp", json={"phone": "+263700000099999"})
    assert res.status_code == 404


def test_correct_code_verifies_only_once_needed(client):
    phone = "+263700000022"
    client.post("/api/auth/register", json={"phone": phone, "password": "Password123!"})
    otp_res = client.post("/api/auth/send-otp", json={"phone": phone})
    code = otp_res.json()["debug_code"]

    first = client.post("/api/auth/verify-otp", json={"phone": phone, "code": code})
    assert first.status_code == 200
