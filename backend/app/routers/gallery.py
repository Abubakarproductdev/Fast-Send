from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId

from app.models.trip import Trip
from app.models.attendee import Attendee
from app.models.media_asset import MediaAsset, AssetStatus
from app.schemas.trips import MediaAssetResponse
from app.services.storage_service import azure_blob_service

router = APIRouter(
    prefix="/api/v1/trips/{trip_id}/gallery",
    tags=["Gallery"],
)

@router.get(
    "/{attendee_id}",
    response_model=list[MediaAssetResponse],
    status_code=status.HTTP_200_OK,
)
async def get_attendee_gallery(trip_id: PydanticObjectId, attendee_id: PydanticObjectId):
    """Retrieve all processed media assets that contain the specified attendee."""
    
    trip = await Trip.get(trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found"
        )
        
    attendee = await Attendee.get(attendee_id)
    if not attendee or attendee.trip_id != trip_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendee {attendee_id} not found in this trip"
        )

    # Find all media assets for this trip that have this attendee in their matches
    # Using Beanie's query syntax for embedded documents
    assets = await MediaAsset.find(
        MediaAsset.trip_id == trip_id,
        MediaAsset.status == AssetStatus.PROCESSED,
        {"matches.attendee_id": attendee_id}
    ).sort("-created_at").to_list()
    
    # Map to response model and sign the URLs
    response = []
    for asset in assets:
        response.append(
            MediaAssetResponse(
                id=str(asset.id),
                trip_id=str(asset.trip_id),
                proxy_blob_url=azure_blob_service.get_signed_url(asset.proxy_blob_url),
                status=asset.status.value,
                media_type=asset.media_type,
                created_at=asset.created_at,
            )
        )
        
    return response
