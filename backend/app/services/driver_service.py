from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.user import User
from app.schemas.driver import DriverProfileUpdate


def get_or_create_driver(db: Session, user: User) -> Driver:
    driver = db.query(Driver).filter(Driver.user_id == user.id).first()
    if driver is None:
        driver = Driver(user_id=user.id)
        db.add(driver)
        db.commit()
        db.refresh(driver)
    return driver


def update_driver_profile(db: Session, driver: Driver, data: DriverProfileUpdate) -> Driver:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver
