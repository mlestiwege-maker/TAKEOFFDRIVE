"""Application workflow / state machine.

    DRAFT --submit--> SUBMITTED --(admin starts review)--> UNDER_REVIEW
                                                                 |
                                        +------------------------+------------------------+
                                        |                        |                        |
                                        v                        v                        v
                                    APPROVED          CORRECTION_REQUIRED              REJECTED
                                                                 |
                                                                 v
                                                               DRAFT  (driver edits, resubmits)

APPROVED and REJECTED are terminal. CORRECTION_REQUIRED loops the driver
back to DRAFT so they can edit their information/documents and resubmit.
"""
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import generate_application_number
from app.models.application import Application, ApplicationReview
from app.models.driver import Driver
from app.models.enums import ApplicationStatus, DocumentType, ReviewDecision
from app.models.user import User
from app.services.email_provider import notify_application_status

REQUIRED_DOCUMENT_TYPES = [
    DocumentType.NATIONAL_ID,
    DocumentType.DRIVERS_LICENSE,
    DocumentType.VEHICLE_REGISTRATION,
    DocumentType.VEHICLE_INSURANCE,
]


class ApplicationError(Exception):
    pass


def get_or_create_draft(db: Session, driver: Driver) -> Application:
    application = (
        db.query(Application)
        .filter(Application.driver_id == driver.id)
        .order_by(Application.created_at.desc())
        .first()
    )
    if application is not None:
        return application

    next_seq = (db.query(func.count(Application.id)).scalar() or 0) + 1
    application_number = generate_application_number(next_seq)
    # Guard against a rare race/number collision from concurrent drafts
    while db.query(Application).filter(Application.application_number == application_number).first():
        next_seq += 1
        application_number = generate_application_number(next_seq)

    application = Application(
        driver_id=driver.id,
        application_number=application_number,
        status=ApplicationStatus.DRAFT,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def _validate_completeness(driver: Driver, application: Application) -> list[str]:
    problems: list[str] = []

    required_profile_fields = ["first_name", "last_name", "date_of_birth", "gender", "address", "city"]
    for field in required_profile_fields:
        if not getattr(driver, field, None):
            problems.append(f"Missing personal/contact field: {field}")

    if not driver.national_id_number:
        problems.append("Missing national ID number")
    if not driver.drivers_license_number:
        problems.append("Missing driver's license number")

    if not driver.vehicles:
        problems.append("At least one vehicle must be added")

    uploaded_types = {doc.document_type for doc in driver.documents}
    for required in REQUIRED_DOCUMENT_TYPES:
        if required not in uploaded_types:
            problems.append(f"Missing required document: {required.value}")

    return problems


def submit_application(db: Session, driver: Driver, application: Application) -> Application:
    if application.status not in (ApplicationStatus.DRAFT, ApplicationStatus.CORRECTION_REQUIRED):
        raise ApplicationError(f"Cannot submit an application in status {application.status.value}")

    problems = _validate_completeness(driver, application)
    if problems:
        raise ApplicationError("Application is incomplete: " + "; ".join(problems))

    application.status = ApplicationStatus.SUBMITTED
    application.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(application)

    notify_application_status(
        driver.user.email,
        driver.first_name or "",
        application.application_number,
        ApplicationStatus.SUBMITTED.value,
    )
    return application


def start_review(db: Session, application: Application) -> Application:
    if application.status != ApplicationStatus.SUBMITTED:
        raise ApplicationError("Only submitted applications can move to under review.")
    application.status = ApplicationStatus.UNDER_REVIEW
    db.commit()
    db.refresh(application)
    return application


_DECISION_TO_STATUS = {
    ReviewDecision.APPROVED: ApplicationStatus.APPROVED,
    ReviewDecision.REJECTED: ApplicationStatus.REJECTED,
    ReviewDecision.CORRECTION_REQUIRED: ApplicationStatus.CORRECTION_REQUIRED,
}


def review_application(
    db: Session, application: Application, admin: User, decision: ReviewDecision, notes: str | None
) -> Application:
    if application.status not in (ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW):
        raise ApplicationError(f"Cannot review an application in status {application.status.value}")

    review = ApplicationReview(
        application_id=application.id,
        admin_id=admin.id,
        decision=decision,
        notes=notes,
    )
    db.add(review)

    application.status = _DECISION_TO_STATUS[decision]
    application.reviewed_at = datetime.now(timezone.utc)
    application.reviewed_by = admin.id

    db.commit()
    db.refresh(application)

    notify_application_status(
        application.driver.user.email,
        application.driver.first_name or "",
        application.application_number,
        application.status.value,
        notes or "",
    )
    return application


def resubmit_to_draft(db: Session, application: Application) -> Application:
    """After CORRECTION_REQUIRED, the driver edits their info; calling this
    is implicit the next time they hit submit_application (DRAFT/CORRECTION_REQUIRED
    are both valid submit sources), so this helper is mainly used to reset the
    UI state as soon as the driver starts editing again."""
    if application.status != ApplicationStatus.CORRECTION_REQUIRED:
        raise ApplicationError("Only applications awaiting correction can be reopened for edits.")
    application.status = ApplicationStatus.DRAFT
    db.commit()
    db.refresh(application)
    return application
