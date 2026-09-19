import io
import shutil
from pathlib import Path

import pytest

from tests.conftest import auth_headers, register_and_verify_driver


@pytest.fixture(autouse=True)
def _clean_uploads():
    yield
    if Path("uploads").exists():
        shutil.rmtree("uploads")


def test_upload_and_list_document(client):
    token = register_and_verify_driver(client, phone="+263700000040")
    headers = auth_headers(token)

    res = client.post(
        "/api/documents/upload",
        headers=headers,
        data={"document_type": "NATIONAL_ID"},
        files={"file": ("id.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")},
    )
    assert res.status_code == 201
    assert res.json()["document_type"] == "NATIONAL_ID"

    list_res = client.get("/api/documents", headers=headers)
    assert len(list_res.json()) == 1


def test_reuploading_same_type_replaces_previous(client):
    token = register_and_verify_driver(client, phone="+263700000041")
    headers = auth_headers(token)

    client.post(
        "/api/documents/upload",
        headers=headers,
        data={"document_type": "NATIONAL_ID"},
        files={"file": ("first.pdf", io.BytesIO(b"%PDF-1.4 first"), "application/pdf")},
    )
    client.post(
        "/api/documents/upload",
        headers=headers,
        data={"document_type": "NATIONAL_ID"},
        files={"file": ("second.pdf", io.BytesIO(b"%PDF-1.4 second"), "application/pdf")},
    )

    list_res = client.get("/api/documents", headers=headers)
    docs = list_res.json()
    assert len(docs) == 1
    assert docs[0]["file_name"] == "second.pdf"


def test_rejects_unsupported_file_type(client):
    token = register_and_verify_driver(client, phone="+263700000042")
    headers = auth_headers(token)

    res = client.post(
        "/api/documents/upload",
        headers=headers,
        data={"document_type": "NATIONAL_ID"},
        files={"file": ("virus.exe", io.BytesIO(b"MZ"), "application/octet-stream")},
    )
    assert res.status_code == 400


def test_download_document_round_trips_through_storage_provider(client):
    token = register_and_verify_driver(client, phone="+263700000043")
    headers = auth_headers(token)

    upload_res = client.post(
        "/api/documents/upload",
        headers=headers,
        data={"document_type": "NATIONAL_ID"},
        files={"file": ("id.pdf", io.BytesIO(b"%PDF-1.4 round-trip content"), "application/pdf")},
    )
    document_id = upload_res.json()["id"]

    download_res = client.get(f"/api/documents/{document_id}/file", headers=headers)
    assert download_res.status_code == 200
    assert download_res.content == b"%PDF-1.4 round-trip content"
    assert download_res.headers["content-type"] == "application/pdf"


def test_deleting_document_removes_underlying_file(client):
    token = register_and_verify_driver(client, phone="+263700000044")
    headers = auth_headers(token)

    upload_res = client.post(
        "/api/documents/upload",
        headers=headers,
        data={"document_type": "NATIONAL_ID"},
        files={"file": ("id.pdf", io.BytesIO(b"%PDF-1.4 to be deleted"), "application/pdf")},
    )
    document_id = upload_res.json()["id"]

    delete_res = client.delete(f"/api/documents/{document_id}", headers=headers)
    assert delete_res.status_code == 204

    download_res = client.get(f"/api/documents/{document_id}/file", headers=headers)
    assert download_res.status_code == 404
