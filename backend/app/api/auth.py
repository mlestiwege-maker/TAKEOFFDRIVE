from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.dependencies.auth import get_current_token_payload, get_current_user
from app.models.revoked_token import RevokedToken
from app.models.user import User
from app.schemas.auth import (
    CurrentUser,
    LoginRequest,
    RegisterRequest,
    SendOTPRequest,
    SendOTPResponse,
    TokenResponse,
    VerifyOTPRequest,
)
from app.services import auth_service, otp_service
from app.services.auth_service import AuthError
from app.services.otp_service import OTPError

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=CurrentUser, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db, payload.phone, payload.email, payload.password)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return user


@router.post("/send-otp", response_model=SendOTPResponse)
@limiter.limit("5/15minute")
def send_otp(request: Request, payload: SendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account found for this phone number.")

    _, code = otp_service.send_otp(db, user)
    return SendOTPResponse(
        message="A verification code has been sent to your phone.",
        expires_in_seconds=settings.OTP_EXPIRE_MINUTES * 60,
        debug_code=code if settings.OTP_DEBUG_ECHO else None,
    )


@router.post("/verify-otp", response_model=TokenResponse)
@limiter.limit("10/15minute")
def verify_otp(request: Request, payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account found for this phone number.")

    try:
        otp_service.verify_otp(db, user, payload.code)
    except OTPError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, role=user.role)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/15minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.authenticate_user(db, payload.identifier, payload.password)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    token = auth_service.issue_token(user)
    return TokenResponse(access_token=token, role=user.role)


@router.post("/logout")
def logout(payload: dict = Depends(get_current_token_payload), db: Session = Depends(get_db)):
    # Record this token's jti as revoked until its natural expiry, so a
    # captured/leaked token can't keep being used after the user logs out —
    # decode_access_token alone can't express "valid but revoked."
    db.merge(
        RevokedToken(
            jti=payload["jti"],
            expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        )
    )
    db.commit()
    return {"message": "Logged out."}


@router.get("/me", response_model=CurrentUser)
def me(current_user: User = Depends(get_current_user)):
    return current_user
