from datetime import datetime

from pydantic import ConfigDict, BaseModel, Field

from app.models.enums import VehicleType


class VehicleCreate(BaseModel):
    vehicle_type: VehicleType
    registration_number: str = Field(min_length=1, max_length=50)
    make: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=1950, le=2100)
    colour: str = Field(min_length=1, max_length=50)


class VehicleResponse(BaseModel):
    id: int
    driver_id: int
    vehicle_type: VehicleType
    registration_number: str
    make: str
    model: str
    year: int
    colour: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
