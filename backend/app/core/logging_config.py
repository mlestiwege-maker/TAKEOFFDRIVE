import logging


def configure_logging() -> None:
    """Ensure app-level loggers (takeoff.otp, takeoff.email, takeoff.sms) are
    actually visible. Without this, Python's root logger defaults to WARNING
    with no handler, which silently swallows the `logger.info(...)` calls
    that the console SMS/email providers rely on to surface OTP codes and
    notification content when no real provider is configured."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    )
