"""Pluggable SMS delivery for OTP codes.

`ConsoleSmsProvider` is the default: it logs the message server-side, which
is what this prototype has used throughout (paired with `OTP_DEBUG_ECHO` to
also return the code in the API response for demo purposes).

Setting `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM_NUMBER`
switches to `TwilioSmsProvider`, which sends a real SMS. Nothing else in the
codebase needs to change to swap providers — `otp_service.send_otp` just
calls whatever `get_sms_provider()` returns.
"""
import logging
from abc import ABC, abstractmethod

from app.core.config import settings

logger = logging.getLogger("takeoff.sms")


class SmsProvider(ABC):
    @abstractmethod
    def send(self, phone: str, message: str) -> None: ...


class ConsoleSmsProvider(SmsProvider):
    """Logs the message instead of sending it. Used whenever no real SMS
    provider is configured (e.g. local development, CI, this demo)."""

    def send(self, phone: str, message: str) -> None:
        logger.info("[SMS to %s] %s", phone, message)


class TwilioSmsProvider(SmsProvider):
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        from twilio.rest import Client

        self._client = Client(account_sid, auth_token)
        self._from_number = from_number

    def send(self, phone: str, message: str) -> None:
        self._client.messages.create(to=phone, from_=self._from_number, body=message)


_provider: SmsProvider | None = None


def get_sms_provider() -> SmsProvider:
    global _provider
    if _provider is not None:
        return _provider

    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER:
        logger.info("Using TwilioSmsProvider for OTP delivery")
        _provider = TwilioSmsProvider(
            settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_FROM_NUMBER
        )
    else:
        logger.info("No SMS provider configured; using ConsoleSmsProvider (logs only)")
        _provider = ConsoleSmsProvider()

    return _provider
