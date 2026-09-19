from pydantic import ConfigDict, BaseModel, EmailStr, Field

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=32)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)


class SendOTPRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=32)


class SendOTPResponse(BaseModel):
    message: str
    expires_in_seconds: int
    # Only populated when OTP_DEBUG_ECHO is enabled (dev/demo mode, no SMS provider wired up)
    debug_code: str | None = None


class VerifyOTPRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=32)
    code: str = Field(min_length=4, max_length=8)


class LoginRequest(BaseModel):
    identifier: str  # phone or email
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


class CurrentUser(BaseModel):
    id: int
    phone: str
    email: str | None
    role: UserRole
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)
