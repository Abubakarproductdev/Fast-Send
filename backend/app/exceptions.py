"""Application-level exceptions and HTTP error mapping."""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.services.storage_service import StorageError


class AppException(Exception):
    """Base application exception with HTTP status mapping."""

    def __init__(self, message: str, status_code: int = 500, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class ValidationAppError(AppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400, code="VALIDATION_ERROR")


class NotFoundAppError(AppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=404, code="NOT_FOUND")


class ConflictAppError(AppException):
    def __init__(self, message: str):
        super().__init__(message, status_code=409, code="CONFLICT")


async def app_exception_handler(_request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )


async def storage_error_handler(_request: Request, exc: StorageError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={
            "detail": str(exc),
            "code": "STORAGE_ERROR",
        },
    )


async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred. Please try again.",
            "code": "INTERNAL_ERROR",
        },
    )
