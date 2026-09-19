import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # `jti` (JWT ID) uniquely identifies this token so it can be revoked
    # individually on logout without needing to blocklist every token a
    # user has ever held — see app/models/revoked_token.py.
    to_encode: dict[str, Any] = {"sub": subject, "role": role, "exp": expire, "jti": str(uuid.uuid4())}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def generate_otp_code(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_otp_code(code: str) -> str:
    # OTPs are short-lived and numeric, so a fast salted hash is sufficient
    # (bcrypt would also work but is unnecessarily slow for a 6-digit space
    # combined with attempt limiting, which is what actually protects this).
    return hashlib.sha256(f"{code}:{settings.JWT_SECRET_KEY}".encode()).hexdigest()


def verify_otp_code(code: str, code_hash: str) -> bool:
    return secrets.compare_digest(hash_otp_code(code), code_hash)


def generate_application_number(sequence: int) -> str:
    return f"TAKEOFF-{sequence:06d}"
