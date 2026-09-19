"""Document storage.

Files are written through `storage_provider.get_storage_provider()` (local
disk by default, S3 when configured) and referenced by an opaque `key`
stored in `Document.file_url` — metadata (type, name, status) lives in
Postgres either way. Reading/deleting a document goes through the same
provider, so this module never needs to know which backend is active.
"""
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.driver import Driver
from app.models.enums import DocumentType
from app.services.storage_provider import get_storage_provider


class DocumentError(Exception):
    pass


def _validate_file(file: UploadFile, size_bytes: int) -> None:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise DocumentError(
            f"Unsupported file type '{ext}'. Allowed types: {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}"
        )
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise DocumentError(f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit.")


def save_document(
    db: Session, driver: Driver, document_type: DocumentType, file: UploadFile, contents: bytes
) -> Document:
    _validate_file(file, len(contents))

    ext = Path(file.filename or "").suffix.lower()
    key = f"{driver.id}/{document_type.value.lower()}_{uuid.uuid4().hex}{ext}"
    content_type = file.content_type or "application/octet-stream"

    storage = get_storage_provider()
    storage.save(key, contents, content_type)

    # Replace any existing document of the same type for this driver
    existing = (
        db.query(Document)
        .filter(Document.driver_id == driver.id, Document.document_type == document_type)
        .first()
    )
    if existing:
        storage.delete(existing.file_url)
        db.delete(existing)
        db.flush()

    document = Document(
        driver_id=driver.id,
        document_type=document_type,
        file_name=file.filename or key,
        file_url=key,
        content_type=content_type,
        size_bytes=len(contents),
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def read_document_bytes(document: Document) -> bytes:
    return get_storage_provider().read(document.file_url)


def delete_document(db: Session, document: Document) -> None:
    get_storage_provider().delete(document.file_url)
    db.delete(document)
    db.commit()
