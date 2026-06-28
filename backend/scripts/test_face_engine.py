"""Standalone test script for the FaceEngine.

Run this to verify that model downloading, loading, and inference work
before debugging through the FastAPI router.

Usage:
    python scripts/test_face_engine.py path/to/selfie.jpg
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path so 'app' can be imported
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.ml.face_engine import (
    FaceEngine,
    FaceProcessingError,
    ImageDecodeError,
    MultipleFacesDetectedError,
    NoFaceDetectedError,
)

def main():
    parser = argparse.ArgumentParser(description="Test FaceEngine extraction")
    parser.add_argument("image_path", type=Path, help="Path to test image")
    args = parser.parse_args()

    if not args.image_path.exists():
        print(f"Error: File not found: {args.image_path}")
        sys.exit(1)

    print("Initializing FaceEngine (this may take a few seconds)...")
    try:
        engine = FaceEngine()
    except Exception as e:
        print(f"Failed to initialize engine: {e}")
        sys.exit(1)

    print(f"Reading image: {args.image_path}")
    image_data = args.image_path.read_bytes()

    print("Extracting embedding...")
    try:
        embedding = engine.extract_embedding(image_data)
        
        print("\nSuccess!")
        print(f"Embedding length: {len(embedding)}")
        print(f"First 5 values:   {embedding[:5]}")
        
        # Calculate L2 norm to verify it's a normalized vector
        import math
        norm = math.sqrt(sum(x*x for x in embedding))
        print(f"L2 Norm:          {norm:.4f}")

    except NoFaceDetectedError as e:
        print(f"\nResult: NO FACE - {e}")
    except MultipleFacesDetectedError as e:
        print(f"\nResult: MULTIPLE FACES - {e}")
    except ImageDecodeError as e:
        print(f"\nResult: DECODE ERROR - {e}")
    except FaceProcessingError as e:
        print(f"\nResult: PROCESSING ERROR - {e}")

if __name__ == "__main__":
    main()
