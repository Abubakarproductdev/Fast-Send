"""ML package exports.

Provides the FastAPI dependency for injecting the FaceEngine into routes.
"""

from fastapi import Request

from app.ml.face_engine import (
    FaceEngine,
    FaceProcessingError,
    ImageDecodeError,
    MultipleFacesDetectedError,
    NoFaceDetectedError,
)

__all__ = [
    "FaceEngine",
    "FaceProcessingError",
    "ImageDecodeError",
    "MultipleFacesDetectedError",
    "NoFaceDetectedError",
    "get_face_engine",
]


def get_face_engine(request: Request) -> FaceEngine:
    """FastAPI dependency to retrieve the singleton FaceEngine."""
    return request.app.state.face_engine
