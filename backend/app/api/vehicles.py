from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_driver
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleResponse
from app.services import driver_service

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(current_user: User = Depends(require_driver), db: Session = Depends(get_db)):
    driver = driver_service.get_or_create_driver(db, current_user)
    return driver.vehicles


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def add_vehicle(
    payload: VehicleCreate, current_user: User = Depends(require_driver), db: Session = Depends(get_db)
):
    driver = driver_service.get_or_create_driver(db, current_user)
    vehicle = Vehicle(driver_id=driver.id, **payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleCreate,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = driver_service.get_or_create_driver(db, current_user)
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.driver_id == driver.id).first()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    for field, value in payload.model_dump().items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int, current_user: User = Depends(require_driver), db: Session = Depends(get_db)
):
    driver = driver_service.get_or_create_driver(db, current_user)
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.driver_id == driver.id).first()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    db.delete(vehicle)
    db.commit()
