"""Seed the database with a test admin and a fully submitted test driver
application, so the reviewer can log in and see real, persisted data
immediately (per the "submitted test profiles are actually saved" requirement).

Run with: python -m app.seed
"""
import uuid
from datetime import date, datetime, timezone

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.application import Application, ApplicationReview
from app.models.driver import Driver
from app.models.enums import (
    ApplicationStatus,
    DocumentStatus,
    DocumentType,
    Gender,
    ReviewDecision,
    UserRole,
    VehicleType,
)
from app.models.document import Document
from app.models.user import User
from app.models.vehicle import Vehicle
from app.services.storage_provider import get_storage_provider


def seed():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
        if admin is None:
            admin = User(
                phone="+263700000000",
                email=settings.FIRST_ADMIN_EMAIL,
                password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Created admin: {admin.email} / {settings.FIRST_ADMIN_PASSWORD}")
        else:
            print(f"Admin already exists: {admin.email}")

        test_phone = "+263700000001"
        driver_user = db.query(User).filter(User.phone == test_phone).first()
        if driver_user is None:
            driver_user = User(
                phone=test_phone,
                email="testdriver@example.com",
                password_hash=hash_password("DriverPass123!"),
                role=UserRole.DRIVER,
                is_verified=True,
            )
            db.add(driver_user)
            db.commit()
            db.refresh(driver_user)

            driver = Driver(
                user_id=driver_user.id,
                first_name="Test",
                last_name="Driver",
                date_of_birth=date(1998, 1, 1),
                gender=Gender.MALE,
                address="123 Samora Machel Ave",
                city="Harare",
                nationality="Zimbabwean",
                national_id_number="TEST-ID-001",
                drivers_license_number="TEST-DL-001",
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)

            vehicle = Vehicle(
                driver_id=driver.id,
                vehicle_type=VehicleType.MOTORCYCLE,
                registration_number="TEST-001",
                make="Honda",
                model="CB125",
                year=2022,
                colour="Black",
            )
            db.add(vehicle)

            storage = get_storage_provider()

            for doc_type in [
                DocumentType.NATIONAL_ID,
                DocumentType.DRIVERS_LICENSE,
                DocumentType.VEHICLE_REGISTRATION,
                DocumentType.VEHICLE_INSURANCE,
            ]:
                key = f"{driver.id}/{doc_type.value.lower()}_{uuid.uuid4().hex}.pdf"
                placeholder = f"%PDF-1.4\n% Seed placeholder document for {doc_type.value}\n".encode()
                storage.save(key, placeholder, "application/pdf")

                db.add(
                    Document(
                        driver_id=driver.id,
                        document_type=doc_type,
                        file_name=f"{doc_type.value.lower()}.pdf",
                        file_url=key,
                        content_type="application/pdf",
                        size_bytes=len(placeholder),
                        status=DocumentStatus.ACCEPTED,
                    )
                )
            db.commit()

            application = Application(
                driver_id=driver.id,
                application_number="TAKEOFF-000001",
                status=ApplicationStatus.UNDER_REVIEW,
                submitted_at=datetime.now(timezone.utc),
            )
            db.add(application)
            db.commit()
            db.refresh(application)

            print(f"Created test driver application: {application.application_number} ({driver_user.phone})")
        else:
            print(f"Test driver already exists: {driver_user.phone}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
