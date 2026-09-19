from datetime import datetime

from pydantic import ConfigDict, BaseModel, Field

from app.models.enums import ApplicationStatus, ReviewDecision
from app.schemas.document import DocumentResponse
from app.schemas.driver import DriverProfileResponse
from app.schemas.vehicle import VehicleResponse


class ApplicationResponse(BaseModel):
    id: int
    driver_id: int
    application_number: str
    status: ApplicationStatus
    submitted_at: datetime | None
    reviewed_at: datetime | None
    reviewed_by: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewCreate(BaseModel):
    # `decision` is implied by which endpoint is called (approve/reject/
    # request-correction) and is accepted-but-ignored here if a client sends
    # it, so the frontend can use one payload shape for all three actions.
    decision: ReviewDecision | None = None
    notes: str | None = Field(default=None, max_length=2000)


class ReviewResponse(BaseModel):
    id: int
    application_id: int
    admin_id: int
    decision: ReviewDecision
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DriverSummary(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    phone: str
    email: str | None

    model_config = ConfigDict(from_attributes=True)


class ApplicationListItem(BaseModel):
    id: int
    application_number: str
    status: ApplicationStatus
    submitted_at: datetime | None
    created_at: datetime
    driver: DriverSummary
    vehicle_type: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationDetailResponse(BaseModel):
    id: int
    application_number: str
    status: ApplicationStatus
    submitted_at: datetime | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    driver: DriverProfileResponse
    driver_contact: DriverSummary
    vehicles: list[VehicleResponse]
    documents: list[DocumentResponse]
    reviews: list[ReviewResponse]

    model_config = ConfigDict(from_attributes=True)
