import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from api.config import CORS_ORIGINS, ENVIRONMENT
from api.database import SessionLocal
from api.middleware import CSRFMiddleware, RequestLoggingMiddleware
from api.routers import auth, councils, threads, documents, meetings, conversations, profiles, notifications, search, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-5.5s [%(name)s] %(message)s",
)
logger = logging.getLogger("council.app")

app = FastAPI(
    title="ASLA Business Council Portal",
    version="0.1.0",
    root_path="/api",
)

app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"],
)

if ENVIRONMENT != "test":
    app.add_middleware(CSRFMiddleware)

app.include_router(auth.router)
app.include_router(councils.router)
app.include_router(threads.router)
app.include_router(documents.router)
app.include_router(meetings.router)
app.include_router(conversations.router)
app.include_router(profiles.router)
app.include_router(notifications.router)
app.include_router(search.router)
app.include_router(admin.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled %s on %s %s: %s",
        type(exc).__name__,
        request.method,
        request.url.path,
        str(exc),
        exc_info=True,
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
def health():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    from api.seed import seed_dev_data
    if ENVIRONMENT == "development":
        db = SessionLocal()
        try:
            seed_dev_data(db)
        except Exception as e:
            logger.warning("Seed failed (tables may not exist yet): %s", e)
            db.rollback()
        finally:
            db.close()
