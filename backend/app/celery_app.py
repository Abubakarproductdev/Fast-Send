from celery import Celery
import os

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "fast_send_worker",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_transport_options={"protocol": 2},
)

celery_app.conf.beat_schedule = {
    "send-trip-reminders-every-hour": {
        "task": "app.tasks.send_trip_reminders_task",
        "schedule": 3600.0,
    },
    # Catch-up: re-queue any photos that arrived while Celery was offline.
    # Runs every 5 minutes so recovery happens quickly after a restart.
    "recover-pending-assets-every-5-min": {
        "task": "app.tasks.recover_pending_assets_task",
        "schedule": 300.0,
    },
}
