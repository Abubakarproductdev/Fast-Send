import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import PydanticObjectId
from celery.signals import worker_process_init

from app.celery_app import celery_app
from app.config import get_settings
from app.models import ALL_MODELS
from app.ml.face_engine import FaceEngine
from app.services import trip_service

face_engine = None
worker_loop = None

async def init_db():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    database = client[settings.mongodb_database]
    await init_beanie(database=database, document_models=ALL_MODELS)

@worker_process_init.connect
def init_worker_db(**kwargs):
    global worker_loop
    worker_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(worker_loop)
    worker_loop.run_until_complete(init_db())

def get_face_engine():
    global face_engine
    if face_engine is None:
        face_engine = FaceEngine()
    return face_engine

@celery_app.task(bind=True, name="app.tasks.process_media_asset_task", autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def process_media_asset_task(self, asset_id: str, trip_id: str):
    async def _run():
        engine = get_face_engine()
        try:
            await trip_service.process_media_asset(
                PydanticObjectId(asset_id), 
                PydanticObjectId(trip_id), 
                engine
            )
        except Exception as e:
            if self.request.retries >= self.max_retries:
                from app.models.dlq import DeadLetter
                dlq = DeadLetter(
                    task_name=self.name,
                    task_id=self.request.id or "unknown",
                    args=[asset_id, trip_id],
                    kwargs={},
                    error_message=str(e)
                )
                await dlq.insert()
            raise e

    global worker_loop
    if worker_loop is None:
        worker_loop = asyncio.get_event_loop()
        if not worker_loop.is_running():
            worker_loop.run_until_complete(init_db())
    
    worker_loop.run_until_complete(_run())
    return {"asset_id": asset_id, "status": "processed"}

@celery_app.task(name="app.tasks.notify_batch_complete_task")
def notify_batch_complete_task(results, batch_id: str, trip_id: str):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Batch {batch_id} for trip {trip_id} has finished processing. Creating notification...")

    async def _create_notification():
        await init_db()
        from app.models.notification import Notification
        notif = Notification(
            trip_id=trip_id,
            title="Photos Ready! 🎉",
            message="Your photos are ready for your guests!",
        )
        await notif.insert()
        logger.info(f"Notification created for batch {batch_id}")

    global worker_loop
    if worker_loop is None:
        worker_loop = asyncio.get_event_loop()
        if not worker_loop.is_running():
            worker_loop.run_until_complete(init_db())
    
    worker_loop.run_until_complete(_create_notification())

@celery_app.task(name="app.tasks.notify_batch_failed_task")
def notify_batch_failed_task(request, exc, traceback, batch_id: str, trip_id: str):
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Batch {batch_id} for trip {trip_id} failed: {exc}")

@celery_app.task(name="app.tasks.send_trip_reminders_task")
def send_trip_reminders_task():
    import logging
    from datetime import datetime, timezone, timedelta
    
    logger = logging.getLogger(__name__)

    async def _send_reminders():
        await init_db()
        from app.models.trip import Trip
        from app.models.media_asset import MediaAsset
        from app.models.notification import Notification

        two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
        active_trips = await Trip.find(Trip.is_active == True, Trip.created_at < two_hours_ago).to_list()
        
        for trip in active_trips:
            recent_media_count = await MediaAsset.find(
                MediaAsset.trip_id == trip.id, 
                MediaAsset.created_at >= two_hours_ago
            ).count()

            if recent_media_count == 0:
                logger.info(f"Sending reminder for trip {trip.id}")
                notif = Notification(
                    trip_id=str(trip.id),
                    type="reminder",
                    title="Action Required",
                    message="Reminder: Push your photos"
                )
                await notif.insert()

    global worker_loop
    if worker_loop is None:
        worker_loop = asyncio.get_event_loop()
        if not worker_loop.is_running():
            worker_loop.run_until_complete(init_db())
            
    worker_loop.run_until_complete(_send_reminders())
