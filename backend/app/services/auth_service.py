from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import User


class AuthError(Exception):
    pass


def register_user(db: Session, phone: str, email: str | None, password: str) -> User:
    existing = db.query(User).filter(User.phone == phone).first()
    if existing:
        raise AuthError("An account with this phone number already exists.")

    if email:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise AuthError("An account with this email already exists.")

    user = User(
        phone=phone,
        email=email,
        password_hash=hash_password(password),
        role=UserRole.DRIVER,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, identifier: str, password: str) -> User:
    user = db.query(User).filter((User.phone == identifier) | (User.email == identifier)).first()
    if user is None or user.password_hash is None or not verify_password(password, user.password_hash):
        raise AuthError("Invalid credentials.")
    if not user.is_active:
        raise AuthError("This account has been deactivated.")
    return user


def issue_token(user: User) -> str:
    return create_access_token(subject=str(user.id), role=user.role.value)
