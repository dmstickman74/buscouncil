import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://council:council@localhost:5432/council_portal",
)

CORS_ORIGINS: list[str] = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

SECRET_KEY = os.environ.get("SECRET_KEY", "council-dev-secret-change-in-prod")

CSRF_SECRET = os.environ.get("CSRF_SECRET", "council-csrf-change-me-in-prod")

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")

SESSION_MAX_AGE_DAYS = 30
