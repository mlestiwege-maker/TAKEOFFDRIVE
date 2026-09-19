from app.models.application import Application, ApplicationReview
from app.models.document import Document
from app.models.driver import Driver
from app.models.otp import OTPCode
from app.models.revoked_token import RevokedToken
from app.models.user import User
from app.models.vehicle import Vehicle

__all__ = [
    "Application",
    "ApplicationReview",
    "Document",
    "Driver",
    "OTPCode",
    "RevokedToken",
    "User",
    "Vehicle",
]
