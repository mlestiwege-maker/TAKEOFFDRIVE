from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.application import Application
from app.models.document import Document
from app.models.driver import Driver
from app.models.enums import ApplicationStatus, ReviewDecision
from app.models.user import User
from app.schemas.application import ApplicationDetailResponse, ApplicationListItem, ReviewCreate, ReviewResponse
from app.services import application_service
from app.services.application_service import ApplicationError
from app.services.document_service import read_document_bytes

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _to_detail(application: Application) -> ApplicationDetailResponse:
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


@router.get("/applications", response_model=list[ApplicationListItem])
def list_applications(
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, description="Search by driver name, phone, or application number"),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Application)
        .join(Driver, Application.driver_id == Driver.id)
        .join(User, Driver.user_id == User.id)
        .options(joinedload(Application.driver).joinedload(Driver.user), joinedload(Application.driver).joinedload(Driver.vehicles))
        .filter(Application.status != ApplicationStatus.DRAFT)
    )
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Driver.first_name.ilike(like))
            | (Driver.last_name.ilike(like))
            | (User.phone.ilike(like))
            | (Application.application_number.ilike(like))
        )

    applications = query.order_by(Application.submitted_at.desc()).all()

    return [
        ApplicationListItem(
            id=app_.id,
            application_number=app_.application_number,
            status=app_.status,
            submitted_at=app_.submitted_at,
            created_at=app_.created_at,
            driver={
                "id": app_.driver.id,
                "first_name": app_.driver.first_name,
                "last_name": app_.driver.last_name,
                "phone": app_.driver.user.phone,
                "email": app_.driver.user.email,
            },
            vehicle_type=app_.driver.vehicles[0].vehicle_type.value if app_.driver.vehicles else None,
        )
        for app_ in applications
    ]


@router.get("/applications/{application_id}", response_model=ApplicationDetailResponse)
def get_application_detail(
    application_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)
):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return _to_detail(application)


def _apply_decision(db: Session, application_id: int, admin: User, decision, notes: str | None):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    if application.status == ApplicationStatus.SUBMITTED:
        application_service.start_review(db, application)
    try:
        return application_service.review_application(db, application, admin, decision, notes)
    except ApplicationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/applications/{application_id}/approve", response_model=ReviewResponse)
def approve_application(
    application_id: int,
    payload: ReviewCreate | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    notes = payload.notes if payload else None
    application = _apply_decision(db, application_id, admin, ReviewDecision.APPROVED, notes)
    return application.reviews[0]


@router.post("/applications/{application_id}/reject", response_model=ReviewResponse)
def reject_application(
    application_id: int,
    payload: ReviewCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    application = _apply_decision(db, application_id, admin, ReviewDecision.REJECTED, payload.notes)
    return application.reviews[0]


@router.post("/applications/{application_id}/request-correction", response_model=ReviewResponse)
def request_correction(
    application_id: int,
    payload: ReviewCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    application = _apply_decision(db, application_id, admin, ReviewDecision.CORRECTION_REQUIRED, payload.notes)
    return application.reviews[0]


@router.get("/documents/{document_id}/file")
def view_document(document_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    contents = read_document_bytes(document)
    return Response(
        content=contents,
        media_type=document.content_type,
        headers={"Content-Disposition": f'inline; filename="{document.file_name}"'},
    )


@router.get("/drivers", response_model=list[dict])
def list_drivers(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    drivers = db.query(Driver).options(joinedload(Driver.user)).all()
    return [
        {
            "id": d.id,
            "first_name": d.first_name,
            "last_name": d.last_name,
            "phone": d.user.phone,
            "email": d.user.email,
            "city": d.city,
            "created_at": d.created_at.isoformat(),
        }
        for d in drivers
    ]


@router.get("/drivers/{driver_id}", response_model=dict)
def get_driver_detail(driver_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    driver = db.query(Driver).options(joinedload(Driver.user)).filter(Driver.id == driver_id).first()
    if driver is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")

    latest_application = (
        db.query(Application)
        .filter(Application.driver_id == driver.id)
        .order_by(Application.created_at.desc())
        .first()
    )

    return {
        "id": driver.id,
        "first_name": driver.first_name,
        "last_name": driver.last_name,
        "phone": driver.user.phone,
        "email": driver.user.email,
        "city": driver.city,
        "address": driver.address,
        "nationality": driver.nationality,
        "date_of_birth": driver.date_of_birth.isoformat() if driver.date_of_birth else None,
        "national_id_number": driver.national_id_number,
        "drivers_license_number": driver.drivers_license_number,
        "created_at": driver.created_at.isoformat(),
        "vehicles": [
            {
                "id": v.id,
                "vehicle_type": v.vehicle_type.value,
                "registration_number": v.registration_number,
                "make": v.make,
                "model": v.model,
                "year": v.year,
                "colour": v.colour,
            }
            for v in driver.vehicles
        ],
        "application": (
            {
                "id": latest_application.id,
                "application_number": latest_application.application_number,
                "status": latest_application.status.value,
            }
            if latest_application
            else None
        ),
    }
