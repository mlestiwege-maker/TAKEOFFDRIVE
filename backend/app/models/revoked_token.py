from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RevokedToken(Base):
    """JWTs revoked before their natural expiry (i.e. via logout). Checked
    on every authenticated request in `get_current_user`. A row can be
    deleted once `expires_at` has passed, since the token would be rejected
    by its own `exp` claim by then anyway — this table is only load-bearing
    for the window between logout and natural expiry."""

    __tablename__ = "revoked_tokens"

    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
