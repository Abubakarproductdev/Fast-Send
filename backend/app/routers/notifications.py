from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

def _notif_to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=str(n.id),
        trip_id=n.trip_id,
        organizer_id=n.organizer_id,
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
async def list_notifications(organizer_id: str | None = None):
    """Fetch all notifications, ordered by newest first."""
    query = Notification.find(Notification.organizer_id == organizer_id) if organizer_id else Notification.find()
    notifs = await query.sort("-created_at").limit(20).to_list()
    
    # Prune old notifications for this organizer
    if len(notifs) == 20 and organizer_id:
        oldest_allowed = notifs[-1].created_at
        await Notification.find(
            Notification.organizer_id == organizer_id,
            Notification.created_at < oldest_allowed
        ).delete()
        
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
