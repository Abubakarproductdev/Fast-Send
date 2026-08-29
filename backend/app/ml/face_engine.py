"""Face Embedding Engine using InsightFace.

This module encapsulates the insightface model loading and embedding
extraction logic. It throws domain-specific exceptions for clear error
handling at the router level.
"""

import io

import cv2
import numpy as np
from insightface.app import FaceAnalysis
from pillow_heif import register_heif_opener

register_heif_opener()

from app.config import get_settings


class FaceProcessingError(Exception):
    """Base exception for all face processing errors."""


class ImageDecodeError(FaceProcessingError):
    """Raised when the uploaded file cannot be decoded as an image."""


class NoFaceDetectedError(FaceProcessingError):
    """Raised when the image contains no detectable faces."""


class MultipleFacesDetectedError(FaceProcessingError):
    """Raised when the image contains more than one face."""


class FaceEngine:
    """Singleton wrapper around insightface FaceAnalysis.

    Model loading is expensive (~300MB, several seconds), so this class
    should be instantiated exactly once at application startup.
    """

    def __init__(self):
        settings = get_settings()

        providers = ["TensorrtExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]
        self._app = FaceAnalysis(
            name=settings.ml_model_name,
            providers=providers,
        )

        self._app.prepare(
            ctx_id=0,
            det_size=(settings.ml_det_size, settings.ml_det_size),
        )
        
        self.min_det_score = settings.ml_min_det_score

    def extract_embedding(self, image_data: bytes) -> list[float]:
        """Extract a 512-D embedding from an image byte string.

        Args:
            image_data: Raw bytes of the uploaded image file.

        Returns:
            A list of floats representing the face embedding.

        Raises:
            ImageDecodeError: If bytes aren't a valid image.
            NoFaceDetectedError: If no face > min_det_score is found.
            MultipleFacesDetectedError: If >1 face > min_det_score is found.
        """
        # 1. Decode bytes to numpy array
        try:
            from PIL import Image
            pil_img = Image.open(io.BytesIO(image_data))
            img_array = np.array(pil_img.convert('RGB'))
            img = img_array[:, :, ::-1]
        except Exception as e:
            raise ImageDecodeError(f"Failed to decode image data: {e}")

        # 2. Extract faces
        faces = self._app.get(img)

        # 3. Filter by detection score
        confident_faces = [f for f in faces if f.det_score >= self.min_det_score]

        if not confident_faces:
            raise NoFaceDetectedError("No confident face detected in image")

        if len(confident_faces) > 1:
            raise MultipleFacesDetectedError(
                f"Found {len(confident_faces)} faces. Please upload a solo selfie."
            )

        # 4. Return the 512-D embedding as a native python list
        face = confident_faces[0]
        # face.embedding is a numpy array of shape (512,)
        return face.embedding.tolist()

    def extract_multiple_embeddings(self, image_data: bytes) -> dict:
        """Extract embeddings for all detected faces in an image.

        Used for processing trip photos which may contain many people.

        Args:
            image_data: Raw bytes of the uploaded image file.

        Returns:
            A dictionary containing the overall image 'brightness' and a list of 'faces'.
            Each face is a dictionary with 'embedding' and 'det_score'.

        Raises:
            ImageDecodeError: If bytes aren't a valid image.
        """
        try:
            from PIL import Image
            pil_img = Image.open(io.BytesIO(image_data))
            img_array = np.array(pil_img.convert('RGB'))
            img = img_array[:, :, ::-1]
        except Exception as e:
            raise ImageDecodeError(f"Failed to decode image data: {e}")

        faces = self._app.get(img)
        confident_faces = [f for f in faces if f.det_score >= self.min_det_score]
        
        # Calculate overall image brightness (0-255)
        if img.size > 0:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            brightness = float(np.mean(gray))
        else:
            brightness = 128.0
        
        return {
            "brightness": brightness,
            # Preserve the raw detector count separately from the confident
            # embeddings used for matching. This keeps group classification
            # correct when a secondary face is low-confidence.
            "face_count": len(faces),
            "faces": [
                {
                    "embedding": f.embedding.tolist(),
                    "det_score": float(f.det_score)
                } for f in confident_faces
            ]
        }

    @staticmethod
    def compute_similarity(emb1: list[float], emb2: list[float]) -> float:
        """Compute the cosine similarity between two embeddings.

        Args:
            emb1: 512-D embedding list.
            emb2: 512-D embedding list.

        Returns:
            A float between -1.0 and 1.0 (higher means more similar).
        """
        v1 = np.array(emb1)
        v2 = np.array(emb2)
        
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(np.dot(v1, v2) / (norm1 * norm2))
