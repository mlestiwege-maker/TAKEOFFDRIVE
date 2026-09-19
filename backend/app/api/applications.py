from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_driver
from app.models.user import User
from app.schemas.application import ApplicationDetailResponse, ApplicationResponse
from app.services import application_service, driver_service
from app.services.application_service import ApplicationError

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _to_detail(application) -> ApplicationDetailResponse:
    driver = application.driver
    return ApplicationDetailResponse(
        id=application.id,
        application_number=application.application_number,
        status=application.status,
        submitted_at=application.submitted_at,
        reviewed_at=application.reviewed_at,
        created_at=application.created_at,
        updated_at=application.updated_at,
        driver=driver,
        driver_contact={
            "id": driver.id,
            "first_name": driver.first_name,
            "last_name": driver.last_name,
            "phone": driver.user.phone,
            "email": driver.user.email,
        },
        vehicles=driver.vehicles,
        documents=driver.documents,
        reviews=application.reviews,
    )


@router.get("/me", response_model=ApplicationDetailResponse)
def get_my_application(current_user: User = Depends(require_driver), db: Session = Depends(get_db)):
    driver = driver_service.get_or_create_driver(db, current_user)
    application = application_service.get_or_create_draft(db, driver)
    return _to_detail(application)


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_my_application(current_user: User = Depends(require_driver), db: Session = Depends(get_db)):
    driver = driver_service.get_or_create_driver(db, current_user)
    application = application_service.get_or_create_draft(db, driver)
    try:
        application = application_service.submit_application(db, driver, application)
    except ApplicationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return application


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_application(
    application_id: int, current_user: User = Depends(require_driver), db: Session = Depends(get_db)
):
    driver = driver_service.get_or_create_driver(db, current_user)
    application = application_service.get_or_create_draft(db, driver)
    if application.id != application_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return _to_detail(application)
