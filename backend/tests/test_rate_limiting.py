import pytest

from app.core.limiter import limiter


@pytest.fixture
def rate_limiting_enabled():
    limiter.enabled = True
    limiter.reset()
    yield
    limiter.enabled = False
    limiter.reset()


def test_send_otp_is_rate_limited_per_ip(client, rate_limiting_enabled):
    phone = "+263700000060"
    client.post("/api/auth/register", json={"phone": phone, "password": "Password123!"})

    # The configured limit is 5 requests per 15 minutes per IP.
    responses = [client.post("/api/auth/send-otp", json={"phone": phone}) for _ in range(6)]

    assert [r.status_code for r in responses[:5]] == [200] * 5
    assert responses[5].status_code == 429


def test_login_is_rate_limited_per_ip(client, rate_limiting_enabled):
    phone = "+263700000061"
    client.post("/api/auth/register", json={"phone": phone, "password": "Password123!"})

    responses = [
        client.post("/api/auth/login", json={"identifier": phone, "password": "WrongPass1!"}) for _ in range(11)
    ]

    assert all(r.status_code == 401 for r in responses[:10])
    assert responses[10].status_code == 429
