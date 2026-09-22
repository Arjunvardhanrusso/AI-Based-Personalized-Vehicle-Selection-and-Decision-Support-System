from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from ..db.database import get_db
from ..db.models import SavedVehicle, User
from ..core.security import get_current_user

router = APIRouter(prefix="/api/garage", tags=["garage"])

class SavedVehicleResponse(BaseModel):
    id: int
    vehicle_variant_id: str
    saved_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[SavedVehicleResponse])
def get_garage(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return current_user.saved_vehicles

@router.post("/add/{variant_id}", response_model=SavedVehicleResponse)
def add_to_garage(variant_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(SavedVehicle).filter(
        SavedVehicle.user_id == current_user.id,
        SavedVehicle.vehicle_variant_id == variant_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle already saved")
    
    new_saved = SavedVehicle(user_id=current_user.id, vehicle_variant_id=variant_id)
    db.add(new_saved)
    db.commit()
    db.refresh(new_saved)
    return new_saved

@router.delete("/remove/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_garage(variant_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(SavedVehicle).filter(
        SavedVehicle.user_id == current_user.id,
        SavedVehicle.vehicle_variant_id == variant_id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Vehicle not found in garage")
    
    db.delete(existing)
    db.commit()
    return None
