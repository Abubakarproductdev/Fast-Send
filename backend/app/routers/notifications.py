from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

def _notif_to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=str(n.id),
        trip_id=n.trip_id,
        type=n.type,
        title=n.title,
        message=n.message,
        is_read=n.is_read,
        created_at=n.created_at
    )

@router.get(
    "",
    response_model=list[NotificationResponse],
    summary="List all notifications",
)
async def list_notifications():
    """Fetch all notifications, ordered by newest first."""
    notifs = await Notification.find().sort("-created_at").to_list()
    return [_notif_to_response(n) for n in notifs]

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a notification as read",
)
async def mark_notification_read(notification_id: PydanticObjectId):
    """Mark a specific notification as read."""
    notif = await Notification.get(notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notif.is_read = True
    await notif.save()
    return _notif_to_response(notif)
