import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

async def check_db():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_database]
    
    # Check Attendees
    print("--- Attendees ---")
    attendees = await db.attendees.find().sort('_id', -1).limit(5).to_list(5)
    for a in attendees:
        print(f"Name: {a.get('name')}, Selfie Status: {a.get('selfie_status')}, Trip ID: {a.get('trip_id')}")

    print("\n--- Media Assets ---")
    assets = await db.media_assets.find().sort('_id', -1).limit(20).to_list(20)
    
    status_counts = {}
    for asset in assets:
        status = asset.get('status')
        status_counts[status] = status_counts.get(status, 0) + 1
        
    print("Asset Status Counts (last 20):", status_counts)
    
    if assets:
        print("Sample Asset:")
        sample = assets[0]
        print(f"File Name: {sample.get('file_name')}, MimeType: {sample.get('mime_type')}, Status: {sample.get('status')}")
        if 'error_msg' in sample and sample['error_msg']:
            print(f"Error: {sample['error_msg']}")

asyncio.run(check_db())
