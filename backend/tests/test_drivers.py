from tests.conftest import auth_headers, register_and_verify_driver


def test_get_my_profile_lazily_creates_driver(client):
    token = register_and_verify_driver(client, phone="+263700000030")
    res = client.get("/api/drivers/me", headers=auth_headers(token))
    assert res.status_code == 200
    assert res.json()["first_name"] is None


def test_update_profile_persists_fields(client):
    token = register_and_verify_driver(client, phone="+263700000031")
    res = client.put(
        "/api/drivers/profile",
        headers=auth_headers(token),
        json={
            "first_name": "Test",
            "last_name": "Driver",
            "date_of_birth": "1998-01-01",
            "gender": "MALE",
            "address": "123 Main St",
            "city": "Harare",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["first_name"] == "Test"
    assert body["city"] == "Harare"

    # Confirm it actually persisted, not just echoed back
    res2 = client.get("/api/drivers/me", headers=auth_headers(token))
    assert res2.json()["first_name"] == "Test"


def test_profile_requires_authentication(client):
    res = client.get("/api/drivers/me")
    assert res.status_code == 401


def test_vehicle_crud(client):
    token = register_and_verify_driver(client, phone="+263700000032")
    headers = auth_headers(token)

    create_res = client.post(
        "/api/vehicles",
        headers=headers,
        json={
            "vehicle_type": "MOTORCYCLE",
            "registration_number": "TEST-001",
            "make": "Honda",
            "model": "CB125",
            "year": 2022,
            "colour": "Black",
        },
    )
    assert create_res.status_code == 201
    vehicle_id = create_res.json()["id"]

    list_res = client.get("/api/vehicles", headers=headers)
    assert len(list_res.json()) == 1

    update_res = client.put(
        f"/api/vehicles/{vehicle_id}",
        headers=headers,
        json={
            "vehicle_type": "MOTORCYCLE",
            "registration_number": "TEST-002",
            "make": "Honda",
            "model": "CB125",
            "year": 2023,
            "colour": "Red",
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["registration_number"] == "TEST-002"

    delete_res = client.delete(f"/api/vehicles/{vehicle_id}", headers=headers)
    assert delete_res.status_code == 204
