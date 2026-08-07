import asyncio, random, string
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

def generate_invite_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

async def fix_trips():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_database]
    
    trips = await db.trips.find().to_list(100)
    for t in trips:
        if not t.get('invite_code'):
            code = generate_invite_code()
            print(f"Setting code {code} for trip {t.get('name')}")
            await db.trips.update_one({'_id': t['_id']}, {'$set': {'invite_code': code}})
        else:
            print(f"Trip {t.get('name')} already has code {t.get('invite_code')}")

asyncio.run(fix_trips())
