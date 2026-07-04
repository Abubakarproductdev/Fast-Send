"""Standalone test script for Media Upload & Face Matching Pipeline.

Run this to verify that the ML engine can extract multiple faces from a group photo,
compute cosine similarity against a registered selfie, and generate match results.

Usage:
    python scripts/test_upload_match.py <selfie_path> <group_photo_path>
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
)

def main():
    parser = argparse.ArgumentParser(description="Test FaceEngine matching logic")
    parser.add_argument("selfie_path", type=Path, help="Path to attendee selfie image")
    parser.add_argument("group_photo_path", type=Path, help="Path to uploaded group photo")
    args = parser.parse_args()

    if not args.selfie_path.exists():
        print(f"Error: Selfie file not found: {args.selfie_path}")
        sys.exit(1)
        
    if not args.group_photo_path.exists():
        print(f"Error: Group photo file not found: {args.group_photo_path}")
        sys.exit(1)

    print("Initializing FaceEngine (this may take a few seconds)...")
    try:
        engine = FaceEngine()
    except Exception as e:
        print(f"Failed to initialize engine: {e}")
        sys.exit(1)

    print(f"\n1. Simulating Attendee Registration")
    print(f"Reading selfie: {args.selfie_path.name}")
    selfie_data = args.selfie_path.read_bytes()
    
    try:
        attendee_embedding = engine.extract_embedding(selfie_data)
        print(f"-> Successfully extracted 512-D embedding for attendee.")
    except FaceProcessingError as e:
        print(f"-> Error processing selfie: {e}")
        sys.exit(1)

    print(f"\n2. Simulating Media Upload")
    print(f"Reading group photo: {args.group_photo_path.name}")
    group_data = args.group_photo_path.read_bytes()
    
    try:
        group_embeddings = engine.extract_multiple_embeddings(group_data)
        print(f"-> Found {len(group_embeddings)} face(s) in the group photo.")
    except FaceProcessingError as e:
        print(f"-> Error processing group photo: {e}")
        sys.exit(1)

    print(f"\n3. Computing Matches")
    MATCH_THRESHOLD = 0.4
    matches_found = 0
    
    for i, face_emb in enumerate(group_embeddings):
        score = FaceEngine.compute_similarity(face_emb, attendee_embedding)
        is_match = score >= MATCH_THRESHOLD
        
        status = "MATCH" if is_match else "no match"
        print(f"Face {i+1}: similarity = {score:.4f} -> [{status}]")
        
        if is_match:
            matches_found += 1
            
    print(f"\nResult: Total {matches_found} match(es) would be saved to MediaAsset.")

if __name__ == "__main__":
    main()
