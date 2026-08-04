import asyncio
from beanie import init_beanie, PydanticObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import sys
from pathlib import Path
import os
import uuid

project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.models import ALL_MODELS
from app.models.trip import Trip
from app.models.media_asset import MediaAsset, AssetStatus

async def run_test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    database = client["fast_send_test_db"]
    await init_beanie(database=database, document_models=ALL_MODELS)

    # Clean db
    await Trip.find_all().delete()
    await MediaAsset.find_all().delete()

    # Create dummy trip
    trip = Trip(organizer_id=PydanticObjectId(), invite_code="TEST1234")
    await trip.insert()

    # Create dummy assets
    batch_id = "test_batch_123"
    for i in range(3):
        asset = MediaAsset(
            trip_id=trip.id,
            batch_id=batch_id,
            proxy_blob_url=f"http://fake.url/{i}",
            media_type="image",
            device_local_id=f"local_{i}",
            status=AssetStatus.PROCESSING,
        )
        await asset.insert()
    
    print(f"Created trip {trip.id} and 3 assets for batch {batch_id}")

    # Now call finalize_batch as if we were the router
    # We will just call the actual router function, but wait, router needs db connected.
    from app.routers.trips import finalize_batch
    res = await finalize_batch(trip.id, batch_id)
    print("Finalize batch response:", res)

if __name__ == "__main__":
    asyncio.run(run_test())
