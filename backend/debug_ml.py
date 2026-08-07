import asyncio
import numpy as np
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

def compute_similarity(emb1, emb2):
    v1 = np.array(emb1)
    v2 = np.array(emb2)
    n1 = np.linalg.norm(v1)
    n2 = np.linalg.norm(v2)
    if n1 == 0 or n2 == 0: return 0.0
    return float(np.dot(v1, v2) / (n1 * n2))

async def debug_ml():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_database]
    
    print("=== FAST SEND ML DIAGNOSTICS ===")
    
    # 1. Get the most recent guest
    attendee = await db.attendees.find_one(sort=[('_id', -1)])
    if not attendee:
        print("❌ No attendees found in the database.")
        return
        
    print(f"\n👤 Latest Guest: {attendee.get('name')}")
    print(f"Trip ID: {attendee.get('trip_id')}")
    print(f"Selfie Status: {attendee.get('selfie_status')}")
    
    selfie_emb = attendee.get('selfie_embedding')
    if not selfie_emb:
        print("❌ Guest has NO selfie embedding! (Selfie processing failed)")
        return
        
    print(f"✅ Selfie Embedding found! (Length: {len(selfie_emb)} numbers)")
    
    # 2. Check Unknown Faces
    unknowns = await db.unknown_faces.find({'trip_id': attendee.get('trip_id')}).to_list(100)
    print(f"\n📸 Found {len(unknowns)} 'Unknown Faces' in this trip's photos.")
    
    if len(unknowns) == 0:
        print("❌ The AI has not extracted any faces from the trip photos!")
        print("   This means either Celery didn't process them, or the photos had no detectable faces.")
    
    # 3. Calculate Similarity Scores
    scores = []
    print("\n🔍 SIMILARITY SCORES:")
    for i, uf in enumerate(unknowns):
        uf_emb = uf.get('embedding')
        score = compute_similarity(selfie_emb, uf_emb)
        scores.append(score)
        threshold = uf.get('match_threshold', 0.35)
        
        status = "✅ MATCH" if score >= threshold else "❌ NO MATCH"
        print(f"  Face {i+1}: Score = {score:.4f} (Requires >= {threshold:.4f}) -> {status}")
        
    if scores:
        max_score = max(scores)
        print(f"\nHighest similarity score achieved: {max_score:.4f}")
        if max_score < 0.20:
            print("⚠️ WARNING: Your highest score is VERY low (< 0.20).")
            print("   This usually means the selfie quality is extremely poor, or the lighting is completely different.")
        elif max_score < 0.35:
            print("⚠️ WARNING: The AI sees a slight resemblance, but is not confident enough.")
    
    # 4. Check Attendees and their Claims
    print(f"\n👥 Guests in this Trip:")
    all_attendees = await db.attendees.find({'trip_id': attendee.get('trip_id')}).to_list(100)
    for a in all_attendees:
        a_id = str(a['_id'])
        name = a.get('name')
        print(f"  - {name} (ID: {a_id})")
        
    # 5. Check Assets
    assets = await db.media_assets.find({'trip_id': attendee.get('trip_id')}).to_list(20)
    print(f"\n📂 Assets Processing Status:")
    for a in assets:
        matches = a.get('matches', [])
        match_ids = [str(m.get('attendee_id')) for m in matches]
        
        claimed_names = []
        for mid in match_ids:
            for att in all_attendees:
                if str(att['_id']) == mid:
                    claimed_names.append(att.get('name'))
                    
        names_str = ", ".join(claimed_names) if claimed_names else "None"
        print(f"  - Photo {a['_id']}: Matches={len(matches)} -> Claimed by: {names_str}")

if __name__ == "__main__":
    asyncio.run(debug_ml())
