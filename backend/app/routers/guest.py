import base64
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from beanie import PydanticObjectId
from pydantic import BaseModel
import zipstream

from app.models.attendee import Attendee
from app.models.guest_token import GuestToken
from app.models.trip import Trip
from app.models.trip_insights import TripInsights
from app.models.media_asset import MediaAsset, AssetStatus
from app.models.unknown_face import UnknownFace
from app.services.storage_service import azure_blob_service
from app.tasks import process_selfie_task, reprocess_asset_task
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/v1/guest", tags=["Guest"])
security = HTTPBearer()

async def get_current_guest(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Attendee:
    token_str = credentials.credentials
    guest_token = await GuestToken.find_one(GuestToken.token == token_str)
    if not guest_token or guest_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    attendee = await Attendee.get(guest_token.attendee_id)
    if not attendee:
        raise HTTPException(status_code=401, detail="Attendee not found")
        
    return attendee

class RegisterRequest(BaseModel):
    trip_invite_code: str
    name: str
    selfie_base64: str

@router.post("/register")
async def register_guest(req: RegisterRequest):
    trip = await Trip.find_one(Trip.invite_code == req.trip_invite_code.upper())
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    # Save selfie
    try:
        header, encoded = req.selfie_base64.split(",", 1) if "," in req.selfie_base64 else ("", req.selfie_base64)
        image_data = base64.b64decode(encoded)
        filename = f"selfies/{trip.id}/{uuid.uuid4().hex}.jpg"
        selfie_url = azure_blob_service.upload_file(image_data, azure_blob_service.settings.azure_container_proxies, filename, "image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process selfie: {str(e)}")
        
    attendee = Attendee(
        trip_id=trip.id,
        phone_number="guest_web", # mock for now
        name=req.name,
        selfie_s3_url=selfie_url
    )
    await attendee.insert()
    
    # Process selfie
    process_selfie_task.delay(str(attendee.id), selfie_url)
    
    # Create Token
    token = GuestToken(
        attendee_id=attendee.id,
        trip_id=trip.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    await token.insert()
    
    return {
        "attendee_id": str(attendee.id),
        "token": token.token,
        "trip_name": "Trip " + trip.invite_code
    }

@router.get("/me")
async def get_me(attendee: Attendee = Depends(get_current_guest)):
    insights = await TripInsights.find_one(TripInsights.trip_id == attendee.trip_id)
    
    matched_assets = await MediaAsset.find(
        MediaAsset.trip_id == attendee.trip_id,
        MediaAsset.matches.attendee_id == attendee.id  # type: ignore
    ).to_list()
    
    matched_count = len(matched_assets)
    my_photos_size_bytes = 0
    my_group_count = 0
    my_solo_count = 0
    from typing import Dict, Any
    partner_counts: dict[Any, int] = {}
    
    unknowns = await UnknownFace.find(UnknownFace.trip_id == attendee.trip_id).to_list()
    unknown_counts: dict[str, int] = {}
    for uf in unknowns:
        unknown_counts[str(uf.asset_id)] = unknown_counts.get(str(uf.asset_id), 0) + 1
        
    for a in matched_assets:
        my_photos_size_bytes += (a.file_size_bytes or 0)
        total_faces = len(a.matches) + unknown_counts.get(str(a.id), 0)
        
        if total_faces >= 2:
            my_group_count += 1
        elif total_faces == 1:
            my_solo_count += 1
            
        for m in a.matches:
            if m.attendee_id != attendee.id:
                partner_counts[m.attendee_id] = partner_counts.get(m.attendee_id, 0) + 1
                
    most_frequent_partner_name = None
    if partner_counts:
        top_partner_id = max(partner_counts.items(), key=lambda x: x[1])[0]
        top_partner = await Attendee.get(top_partner_id)
        if top_partner:
            most_frequent_partner_name = top_partner.name

    # Check if any photos for this trip are still being processed.
    # This lets the frontend show a "some photos are still processing" banner.
    from app.models.media_asset import AssetStatus
    pending_count = await MediaAsset.find(
        MediaAsset.trip_id == attendee.trip_id,
        {"status": {"$in": [
            AssetStatus.PENDING_PROXY,
            AssetStatus.PROXY_UPLOADED,
            AssetStatus.PROCESSING,
        ]}}
    ).count()

    return {
        "name": attendee.name,
        "trip_id": str(attendee.trip_id),
        "matched_photo_count": matched_count,
        "total_trip_photos": insights.total_photos if insights else 0,
        "total_size_bytes": insights.total_size_bytes if insights else 0,
        "my_photos_size_bytes": my_photos_size_bytes,
        "my_group_count": my_group_count,
        "my_solo_count": my_solo_count,
        "most_frequent_partner_name": most_frequent_partner_name,
        "portrait_count": insights.portrait_count if insights else 0,
        "group_count": insights.group_count if insights else 0,
        "nature_count": insights.nature_count if insights else 0,
        "peak_hour": insights.peak_hour if insights else None,
        "gallery_preference": attendee.gallery_preference,
        "selfie_status": attendee.selfie_status,
        # True when photos are still queued for ML processing
        "has_pending_photos": pending_count > 0,
    }

@router.get("/photos")
async def get_photos(
    filter: str = Query("all"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    attendee: Attendee = Depends(get_current_guest)
):
    trip = await Trip.get(attendee.trip_id)
    settings = trip.settings if trip else None
    
    query = {"trip_id": attendee.trip_id, "status": AssetStatus.PROCESSED}
    
    if filter == "mine_only":
        query["matches.attendee_id"] = attendee.id
    elif filter == "group":
        query["$expr"] = {"$gte": [{"$size": "$matches"}, 2]}
        # If other guests' faces are hidden, restrict to groups the current guest is actually in
        if settings and not settings.show_other_guests_faces:
            query["matches.attendee_id"] = attendee.id
    elif filter == "nature":
        if not settings or not settings.allow_nature_photos:
            return []
        query["is_nature"] = True
    elif filter == "all":
        # Enforce face visibility: hide other guests if disabled
        if settings and not settings.show_other_guests_faces:
            query["matches.attendee_id"] = attendee.id
        elif settings and not settings.allow_nature_photos:
            # Exclude nature shots (0 faces) even in "all" view
            query["$expr"] = {"$gt": [{"$size": "$matches"}, 0]}
        
    skip = (page - 1) * per_page
    assets = await MediaAsset.find(query).sort("-created_at").skip(skip).limit(per_page).to_list()
    
    return [{
        "id": str(a.id),
        "proxy_url": a.proxy_blob_url,
        "media_type": a.media_type,
        "created_at": a.created_at,
        "face_count": len(a.matches)
    } for a in assets]

@router.get("/download")
async def download_photos(
    filter: str = Query("all"),
    photo_ids: Optional[str] = None,
    attendee: Attendee = Depends(get_current_guest)
):
    trip = await Trip.get(attendee.trip_id)
    settings = trip.settings if trip else None
    
    query = {"trip_id": attendee.trip_id, "status": AssetStatus.PROCESSED}
    
    if photo_ids:
        ids = [PydanticObjectId(id.strip()) for id in photo_ids.split(",") if id.strip()]
        query["_id"] = {"$in": ids}

    # Security: ALWAYS enforce download restrictions, even when specific photo_ids are provided.
    # A user cannot bypass allow_guest_download_all by cherry-picking photo IDs.
    if settings and not settings.allow_guest_download_all:
        query["matches.attendee_id"] = attendee.id
    elif not photo_ids and filter == "mine_only":
        query["matches.attendee_id"] = attendee.id
    
    assets = await MediaAsset.find(query).to_list()
    if not assets:
        raise HTTPException(status_code=404, detail="No photos found")
        
    def zip_generator():
        import requests
        zs = zipstream.ZipStream(compress_type=zipstream.ZIP_DEFLATED)
        for i, asset in enumerate(assets):
            url = asset.high_res_blob_url or asset.proxy_blob_url
            if url:
                try:
                    sas_url = azure_blob_service.get_signed_url(url, expires_in_hours=1)
                    if sas_url:
                        response = requests.get(sas_url, stream=True, timeout=10)
                        response.raise_for_status()
                        ext = ".jpg" if "jpg" in url or "jpeg" in url else ".heic" if "heic" in url else ".mov" if "mov" in url else ".bin"
                        zs.add(response.iter_content(chunk_size=1024 * 1024), arcname=f"photo_{i}{ext}")
                except Exception:
                    pass
        yield from zs
        
    return StreamingResponse(zip_generator(), media_type="application/zip", headers={"Content-Disposition": "attachment; filename=photos.zip"})

@router.post("/claim/{unknown_face_id}")
async def claim_face(unknown_face_id: str, attendee: Attendee = Depends(get_current_guest)):
    uf = await UnknownFace.get(PydanticObjectId(unknown_face_id))
    if not uf:
        raise HTTPException(status_code=404, detail="Unknown face not found")
        
    asset = await MediaAsset.get(uf.asset_id)
    if asset:
        reprocess_asset_task.delay(str(asset.id), str(attendee.trip_id))
        
    await uf.delete()
    return {"status": "success"}

@router.get("/unknown-faces")
async def get_unknown_faces(attendee: Attendee = Depends(get_current_guest)):
    """Return up to 50 unmatched faces from the trip.

    Uses a single batched $in query instead of per-face round trips
    to avoid N+1 query performance degradation.
    """
    faces = await UnknownFace.find(UnknownFace.trip_id == attendee.trip_id).limit(50).to_list()
    if not faces:
        return []

    # Single batched query — no N+1
    asset_ids = [f.asset_id for f in faces]
    assets = await MediaAsset.find({"_id": {"$in": asset_ids}}).to_list()
    asset_map = {a.id: a for a in assets}

    return [
        {
            "id": str(f.id),
            "asset_id": str(f.asset_id),
            "thumbnail_url": asset_map[f.asset_id].proxy_blob_url if f.asset_id in asset_map else None,
        }
        for f in faces
    ]
