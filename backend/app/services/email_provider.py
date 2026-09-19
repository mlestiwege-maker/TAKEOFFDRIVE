"""Pluggable email delivery for application status notifications.

`ConsoleEmailProvider` is the default: it logs the email server-side.
Setting `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` and
`SMTP_FROM_EMAIL` switches to `SmtpEmailProvider`, which sends a real email
over SMTP (works with SendGrid, Mailgun, AWS SES, Gmail app passwords,
etc. — anything that speaks SMTP).
"""
import logging
import smtplib
from abc import ABC, abstractmethod
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("takeoff.email")


class EmailProvider(ABC):
    @abstractmethod
    def send(self, to: str, subject: str, body: str) -> None: ...


class ConsoleEmailProvider(EmailProvider):
    def send(self, to: str, subject: str, body: str) -> None:
        logger.info("[Email to %s] Subject: %s\n%s", to, subject, body)


class SmtpEmailProvider(EmailProvider):
    def __init__(self, host: str, port: int, username: str, password: str, from_email: str):
        self._host = host
        self._port = port
        self._username = username
        self._password = password
        self._from_email = from_email

    def send(self, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = self._from_email
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(self._host, self._port, timeout=10) as server:
            server.starttls()
            server.login(self._username, self._password)
            server.send_message(message)


_provider: EmailProvider | None = None


def get_email_provider() -> EmailProvider:
    global _provider
    if _provider is not None:
        return _provider

    if all(
        [settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL]
    ):
        logger.info("Using SmtpEmailProvider for notifications")
        _provider = SmtpEmailProvider(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
            settings.SMTP_FROM_EMAIL,
        )
    else:
        logger.info("No SMTP provider configured; using ConsoleEmailProvider (logs only)")
        _provider = ConsoleEmailProvider()

    return _provider


NOTIFICATION_TEMPLATES = {
    "SUBMITTED": (
        "Your TakeOFF application has been submitted",
        "Hi {name},\n\nWe've received your driver application ({application_number}) and it's now "
        "in our review queue. We'll email you as soon as there's an update.\n\n— TakeOFF",
    ),
    "APPROVED": (
        "Your TakeOFF application has been approved!",
        "Hi {name},\n\nGreat news — your application ({application_number}) has been approved. "
        "Welcome to TakeOFF!\n\n— TakeOFF",
    ),
    "REJECTED": (
        "Update on your TakeOFF application",
        "Hi {name},\n\nAfter review, we're unable to approve your application ({application_number}) "
        "at this time.\n\nReviewer notes: {notes}\n\n— TakeOFF",
    ),
    "CORRECTION_REQUIRED": (
        "Action needed on your TakeOFF application",
        "Hi {name},\n\nYour application ({application_number}) needs a small correction before we can "
        "continue reviewing it.\n\nReviewer notes: {notes}\n\nPlease log in and update your application.\n\n— TakeOFF",
    ),
}


def notify_application_status(email: str | None, name: str, application_number: str, status: str, notes: str = ""):
    if not email:
        return
    template = NOTIFICATION_TEMPLATES.get(status)
    if template is None:
        return
    subject, body_template = template
    body = body_template.format(name=name or "there", application_number=application_number, notes=notes or "—")
    try:
        get_email_provider().send(email, subject, body)
    except Exception:
        # Notification failures must never break the underlying business
        # action (submitting/reviewing an application) — log and move on.
        logger.exception("Failed to send %s notification to %s", status, email)
