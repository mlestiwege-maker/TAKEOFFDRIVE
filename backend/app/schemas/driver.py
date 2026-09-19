from datetime import date, datetime

from pydantic import ConfigDict, BaseModel

from app.models.enums import Gender


class DriverProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    address: str | None = None
    city: str | None = None
    nationality: str | None = None
    national_id_number: str | None = None
    drivers_license_number: str | None = None


class DriverProfileResponse(BaseModel):
    id: int
    user_id: int
    first_name: str | None
    last_name: str | None
    date_of_birth: date | None
    gender: Gender | None
    address: str | None
    city: str | None
    nationality: str | None
    national_id_number: str | None
    drivers_license_number: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
