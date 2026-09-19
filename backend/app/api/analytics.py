from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.application import Application
from app.models.enums import ApplicationStatus
from app.models.user import User

router = APIRouter(prefix="/api/admin/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    status_counts = dict(
        db.query(Application.status, func.count(Application.id))
        .filter(Application.status != ApplicationStatus.DRAFT)
        .group_by(Application.status)
        .all()
    )
    status_counts = {status.value: count for status, count in status_counts.items()}

    total_reviewed = (
        db.query(func.count(Application.id))
        .filter(Application.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]))
        .scalar()
        or 0
    )
    approved = status_counts.get("APPROVED", 0)
    approval_rate = round((approved / total_reviewed) * 100, 1) if total_reviewed else None

    reviewed_apps = (
        db.query(Application.submitted_at, Application.reviewed_at)
        .filter(
            Application.submitted_at.isnot(None),
            Application.reviewed_at.isnot(None),
        )
        .all()
    )
    if reviewed_apps:
        total_seconds = sum((r.reviewed_at - r.submitted_at).total_seconds() for r in reviewed_apps)
        avg_turnaround_hours = round((total_seconds / len(reviewed_apps)) / 3600, 1)
    else:
        avg_turnaround_hours = None

    since = datetime.now(timezone.utc) - timedelta(days=30)
    daily_rows = (
        db.query(func.date(Application.submitted_at).label("day"), func.count(Application.id))
        .filter(Application.submitted_at.isnot(None), Application.submitted_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    submissions_by_day = [{"date": str(day), "count": count} for day, count in daily_rows]

    return {
        "status_counts": status_counts,
        "approval_rate": approval_rate,
        "avg_turnaround_hours": avg_turnaround_hours,
        "submissions_by_day": submissions_by_day,
    }
