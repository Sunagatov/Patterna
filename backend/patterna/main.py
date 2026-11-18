import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import OperationalError, TimeoutError

from . import auth, workspace
from .auth import DB
from .models import Problem
from .schemas import ApiError

logger = logging.getLogger(__name__)
app = FastAPI(
    title="Patterna API",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    responses={
        422: {"model": ApiError, "description": "Invalid request"},
        503: {"model": ApiError, "description": "Service unavailable"},
    },
)


@app.exception_handler(RequestValidationError)
async def invalid_request(_request: Request, _error: RequestValidationError):
    return JSONResponse(
        {"detail": "Check the required fields, dates and text lengths."},
        status_code=422,
    )


@app.exception_handler(OperationalError)
@app.exception_handler(TimeoutError)
async def database_unavailable(
    _request: Request, error: OperationalError | TimeoutError
):
    logger.warning("Database request failed (%s)", type(error).__name__)
    return JSONResponse(
        {"detail": "The database is temporarily unavailable. Try again."},
        status_code=503,
    )


@app.middleware("http")
async def protect_browser_writes(request: Request, call_next):
    if (
        request.method in {"POST", "PUT", "PATCH", "DELETE"}
        and request.headers.get("X-Patterna-Request") != "1"
    ):
        return JSONResponse(
            {"detail": "Missing application request header"}, status_code=403
        )
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


app.include_router(auth.router)
app.include_router(workspace.router)


@app.get("/api/health", tags=["health"])
def health(db: DB) -> dict[str, str]:
    db.scalar(select(Problem.id).limit(1))
    return {"status": "ok"}
