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
        
        # Trigger insights building
        from app.tasks import build_trip_insights_task
        build_trip_insights_task.delay(str(trip_id))

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

@celery_app.task(name="app.tasks.process_selfie_task")
def process_selfie_task(attendee_id: str, selfie_url: str):
    import logging
    logger = logging.getLogger(__name__)
    
    async def _process_selfie():
        await init_db()
        from app.models.attendee import Attendee
        from app.models.media_asset import MediaAsset, EmbeddedMatch
        from app.services.storage_service import azure_blob_service
        
        attendee = await Attendee.get(PydanticObjectId(attendee_id))
        if not attendee:
            return
            
        engine = get_face_engine()
        try:
            image_data = await asyncio.to_thread(azure_blob_service.download_file, selfie_url)
            embedding = engine.extract_embedding(image_data)
        except Exception as e:
            logger.error(f"Failed to process selfie for attendee {attendee_id}: {e}")
            attendee.selfie_status = "no_face_detected"
            await attendee.save()
            return
            
        attendee.selfie_embedding = embedding
        attendee.selfie_status = "ok"
        await attendee.save()
        
        # Match against all media assets for the trip
        assets = await MediaAsset.find(MediaAsset.trip_id == attendee.trip_id).to_list()
        for asset in assets:
            if not asset.proxy_blob_url:
                continue
            
            try:
                asset_data = await asyncio.to_thread(azure_blob_service.download_file, asset.proxy_blob_url)
                face_data = engine.extract_multiple_embeddings(asset_data)
                
                brightness = face_data.get("brightness", 128.0)
                base_threshold = 0.45
                if brightness < 60:
                    base_threshold = 0.38
                elif brightness > 200:
                    base_threshold = 0.40
                    
                matched = False
                for face_info in face_data["faces"]:
                    score = FaceEngine.compute_similarity(face_info["embedding"], embedding)
                    match_threshold = base_threshold - (0.05 if face_info["det_score"] < 0.7 else 0.0)
                    if score >= match_threshold:
                        # Avoid duplicates
                        if not any(m.attendee_id == attendee.id for m in asset.matches):
                            asset.matches.append(EmbeddedMatch(attendee_id=attendee.id, confidence=score))
                            matched = True
                            
                if matched:
                    await asset.save()
                    
            except Exception as e:
                logger.error(f"Failed to match selfie against asset {asset.id}: {e}")

    global worker_loop
    if worker_loop is None:
        worker_loop = asyncio.get_event_loop()
        if not worker_loop.is_running():
            worker_loop.run_until_complete(init_db())
    worker_loop.run_until_complete(_process_selfie())

@celery_app.task(name="app.tasks.reprocess_asset_task")
def reprocess_asset_task(asset_id: str, trip_id: str):
    async def _run():
        await init_db()
        engine = get_face_engine()
        await trip_service.process_media_asset(PydanticObjectId(asset_id), PydanticObjectId(trip_id), engine)

    global worker_loop
    if worker_loop is None:
        worker_loop = asyncio.get_event_loop()
        if not worker_loop.is_running():
            worker_loop.run_until_complete(init_db())
    worker_loop.run_until_complete(_run())

@celery_app.task(name="app.tasks.build_trip_insights_task")
def build_trip_insights_task(trip_id: str):
    import logging
    from datetime import datetime, timezone
    logger = logging.getLogger(__name__)

    async def _build_insights():
        await init_db()
        from app.models.media_asset import MediaAsset
        from app.models.trip_insights import TripInsights
        from app.models.unknown_face import UnknownFace
        from app.services.storage_service import azure_blob_service
        from azure.storage.blob import BlobClient
        
        tid = PydanticObjectId(trip_id)
        assets = await MediaAsset.find(MediaAsset.trip_id == tid).to_list()
        
        # Pre-fetch unknown faces to count them per asset
        unknowns = await UnknownFace.find(UnknownFace.trip_id == tid).to_list()
        unknown_counts = {}
        for uf in unknowns:
            asset_str = str(uf.asset_id)
            unknown_counts[asset_str] = unknown_counts.get(asset_str, 0) + 1
        
        total_photos = len(assets)
        total_size_bytes = 0
        portrait_count = 0
        group_count = 0
        nature_count = 0
        
        hour_counts = {h: 0 for h in range(24)}
        unique_people = set()
        
        for a in assets:
            # 1. Exact Size Calculation
            if a.file_size_bytes is None:
                size = 1000000  # Default fallback
                url = a.high_res_blob_url or a.proxy_blob_url
                if url and azure_blob_service.blob_service_client:
                    try:
                        import asyncio
                        def _get_size():
                            client = BlobClient.from_blob_url(url)
                            blob = azure_blob_service.blob_service_client.get_blob_client(
                                container=client.container_name, blob=client.blob_name
                            )
                            props = blob.get_blob_properties()
                            return props.size
                        size = await asyncio.to_thread(_get_size)
                    except Exception as e:
                        logger.warning(f"Failed to get blob properties for {url}: {e}")
                a.file_size_bytes = size
                await a.save()
            total_size_bytes += a.file_size_bytes
            
            # 2. Total Faces Calculation
            total_faces = len(a.matches) + unknown_counts.get(str(a.id), 0)
            
            if total_faces == 0:
                nature_count += 1
            elif total_faces == 1:
                portrait_count += 1
            else:
                group_count += 1
                
            for m in a.matches:
                unique_people.add(m.attendee_id)
                
            if a.created_at:
                hour_counts[a.created_at.hour] += 1
                
        peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else None
        
        insights = await TripInsights.find_one(TripInsights.trip_id == tid)
        if not insights:
            insights = TripInsights(
                trip_id=tid,
                last_updated=datetime.now(timezone.utc)
            )
            
        insights.total_photos = total_photos
        insights.total_size_bytes = total_size_bytes
        insights.unique_people_count = len(unique_people)
        insights.portrait_count = portrait_count
        insights.group_count = group_count
        insights.nature_count = nature_count
        insights.peak_hour = peak_hour
        insights.last_updated = datetime.now(timezone.utc)
        
        await insights.save()

    global worker_loop
    if worker_loop is None:
        worker_loop = asyncio.get_event_loop()
        if not worker_loop.is_running():
            worker_loop.run_until_complete(init_db())
    worker_loop.run_until_complete(_build_insights())


@celery_app.task(name="app.tasks.recover_pending_assets_task")
def recover_pending_assets_task():
    """Catch-up task: re-queue all photos that were uploaded while Celery was offline.

    Runs every 5 minutes via Celery Beat.  Finds every MediaAsset whose
    status is still PENDING_PROXY or PROXY_UPLOADED (i.e. never processed)
    and re-dispatches it to the normal ML pipeline.

    This guarantees that even if Celery was down for hours, it will
    automatically catch up within 5 minutes of restarting.
    """
    import logging
    logger = logging.getLogger(__name__)

    async def _recover():
        from app.models.media_asset import MediaAsset, AssetStatus

        # Find all assets that are stuck in a pre-processing state.
        pending = await MediaAsset.find(
            {"status": {"$in": [
                AssetStatus.PENDING_PROXY,
                AssetStatus.PROXY_UPLOADED,
            ]}}
        ).to_list()

        if not pending:
            return

        logger.info(f"Recovery: found {len(pending)} unprocessed assets. Re-queuing now...")

        for asset in pending:
            try:
                # Mark as processing so we don't double-dispatch in the next tick
                asset.status = AssetStatus.PROCESSING
                await asset.save()
                process_media_asset_task.delay(str(asset.id), str(asset.trip_id))
            except Exception as e:
                logger.error(f"Recovery: failed to re-queue asset {asset.id}: {e}")

    global worker_loop
    if worker_loop is None:
        worker_loop = asyncio.get_event_loop()
        if not worker_loop.is_running():
            worker_loop.run_until_complete(init_db())
    worker_loop.run_until_complete(_recover())
