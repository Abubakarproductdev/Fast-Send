from fastapi import FastAPI, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import uuid

# FIXED IMPORT PATHS
from app.db.database import get_db
from app.db.models import Trip, Attendee
from app.core.ml_engine import MLEngine

app = FastAPI(title="Trip Photo Sorter API")

ml = MLEngine()

@app.get("/")
def health_check():
    return {"status": "API and ML Engine are running"}

@app.post("/trips/")
def create_trip(organizer_name: str, db: Session = Depends(get_db)):
    new_trip = Trip(organizer_name=organizer_name)
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return {"trip_id": new_trip.id, "organizer": new_trip.organizer_name}