from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from ..db.database import get_db
from ..db.models import Lead, User
from ..core.security import get_current_user

router = APIRouter(prefix="/api/leads", tags=["leads"])

class LeadCreate(BaseModel):
    vehicle_variant_id: str
    name: str
    phone: str
    message: Optional[str] = None

class LeadResponse(BaseModel):
    id: int
    vehicle_variant_id: str
    name: str
    phone: str
    message: Optional[str]
    created_at: datetime
    is_contacted: bool
    
    class Config:
        from_attributes = True

@router.post("/", response_model=LeadResponse)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    new_lead = Lead(
        vehicle_variant_id=lead.vehicle_variant_id,
        name=lead.name,
        phone=lead.phone,
        message=lead.message
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead

@router.get("/", response_model=List[LeadResponse])
def get_leads(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(Lead).all()
