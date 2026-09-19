"""Pluggable file storage for uploaded documents.

`LocalDiskStorage` is the default, writing under `UPLOAD_DIR`. Setting
`S3_BUCKET_NAME` (plus AWS credentials, or `S3_ENDPOINT_URL` for an
S3-compatible service like MinIO, DigitalOcean Spaces, Cloudflare R2, or
GCS's S3-interop mode) switches to `S3Storage`.

Either way, callers only ever see an opaque `key` string (what's stored in
`Document.file_url`) — they never need to know whether it resolves to a
local path or an object store key.
"""
import logging
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger("takeoff.storage")


class StorageError(Exception):
    pass


class StorageProvider(ABC):
    @abstractmethod
    def save(self, key: str, contents: bytes, content_type: str) -> None: ...

    @abstractmethod
    def read(self, key: str) -> bytes: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...


class LocalDiskStorage(StorageProvider):
    def __init__(self, root: str):
        self._root = Path(root)

    def _path(self, key: str) -> Path:
        return self._root / key

    def save(self, key: str, contents: bytes, content_type: str) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(contents)

    def read(self, key: str) -> bytes:
        path = self._path(key)
        if not path.exists():
            raise StorageError(f"No such file: {key}")
        return path.read_bytes()

    def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            path.unlink()


class S3Storage(StorageProvider):
    def __init__(self, bucket: str, region: str | None, endpoint_url: str | None):
        import boto3

        self._bucket = bucket
        self._client = boto3.client("s3", region_name=region, endpoint_url=endpoint_url)

    def save(self, key: str, contents: bytes, content_type: str) -> None:
        self._client.put_object(Bucket=self._bucket, Key=key, Body=contents, ContentType=content_type)

    def read(self, key: str) -> bytes:
        from botocore.exceptions import ClientError

        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
            return response["Body"].read()
        except ClientError as exc:
            raise StorageError(f"No such file: {key}") from exc

    def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)


_provider: StorageProvider | None = None


def get_storage_provider() -> StorageProvider:
    global _provider
    if _provider is not None:
        return _provider

    if settings.S3_BUCKET_NAME:
        logger.info("Using S3Storage for document uploads (bucket=%s)", settings.S3_BUCKET_NAME)
        _provider = S3Storage(settings.S3_BUCKET_NAME, settings.S3_REGION, settings.S3_ENDPOINT_URL)
    else:
        logger.info("No S3_BUCKET_NAME configured; using LocalDiskStorage (uploads/)")
        _provider = LocalDiskStorage(settings.UPLOAD_DIR)

    return _provider
