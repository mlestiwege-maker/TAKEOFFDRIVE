"""OTP generation/verification.

Delivery goes through `sms_provider.get_sms_provider()`, which uses Twilio
when `TWILIO_*` env vars are set, or just logs the code otherwise. When
`OTP_DEBUG_ECHO` is on, the code is also echoed back in the API response so
the flow can be exercised end-to-end without a real phone (dev/demo only —
should be off in production; `assert_production_config_is_safe` enforces
this at boot).
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_otp_code, hash_otp_code, verify_otp_code
from app.models.otp import OTPCode
from app.models.user import User
from app.services.sms_provider import get_sms_provider

logger = logging.getLogger("takeoff.otp")


class OTPError(Exception):
    pass


def send_otp(db: Session, user: User) -> tuple[OTPCode, str]:
    code = generate_otp_code(settings.OTP_LENGTH)
    otp = OTPCode(
        user_id=user.id,
        phone=user.phone,
        code_hash=hash_otp_code(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        attempts=0,
    )
    db.add(otp)
    db.commit()
    db.refresh(otp)

    message = f"Your TakeOFF verification code is {code}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    try:
        get_sms_provider().send(user.phone, message)
    except Exception:
        # Don't let a provider outage block the OTP row from being created;
        # the code is still valid and (in debug mode) still returned to the
        # caller. A production deployment would alert on this instead.
        logger.exception("Failed to send OTP SMS to %s", user.phone)

    return otp, code


def verify_otp(db: Session, user: User, code: str) -> OTPCode:
    otp = (
        db.query(OTPCode)
        .filter(OTPCode.user_id == user.id, OTPCode.verified_at.is_(None))
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    if otp is None:
        raise OTPError("No pending OTP request. Please request a new code.")

    if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise OTPError("Too many attempts. Please request a new code.")

    now = datetime.now(timezone.utc)
    expires_at = otp.expires_at if otp.expires_at.tzinfo else otp.expires_at.replace(tzinfo=timezone.utc)
    if now > expires_at:
        raise OTPError("This code has expired. Please request a new code.")

    otp.attempts += 1

    if not verify_otp_code(code, otp.code_hash):
        db.commit()
        raise OTPError("Incorrect code.")

    otp.verified_at = now
    user.is_verified = True
    db.commit()
    db.refresh(otp)
    return otp
