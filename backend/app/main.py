from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import admin, analytics, applications, auth, documents, drivers, vehicles
from app.core.config import assert_production_config_is_safe, settings
from app.core.limiter import limiter
from app.core.logging_config import configure_logging
from app.core.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    assert_production_config_is_safe()
    yield


app = FastAPI(title=settings.APP_NAME, version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(drivers.router)
app.include_router(vehicles.router)
app.include_router(documents.router)
app.include_router(applications.router)
app.include_router(admin.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
