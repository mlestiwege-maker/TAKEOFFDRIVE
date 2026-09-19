from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_driver
from app.models.user import User
from app.schemas.driver import DriverProfileResponse, DriverProfileUpdate
from app.services import driver_service

router = APIRouter(prefix="/api/drivers", tags=["drivers"])


@router.get("/me", response_model=DriverProfileResponse)
def get_my_profile(current_user: User = Depends(require_driver), db: Session = Depends(get_db)):
    driver = driver_service.get_or_create_driver(db, current_user)
    return driver


@router.post("/profile", response_model=DriverProfileResponse)
@router.put("/profile", response_model=DriverProfileResponse)
def upsert_profile(
    payload: DriverProfileUpdate,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = driver_service.get_or_create_driver(db, current_user)
    return driver_service.update_driver_profile(db, driver, payload)
