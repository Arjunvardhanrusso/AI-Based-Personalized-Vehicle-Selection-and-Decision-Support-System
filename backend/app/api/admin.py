from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict

from ..db.database import get_db
from ..db.models import User, Lead, Review, SavedVehicle
from ..core.security import get_current_user
import os

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
        
    return {
        "users_count": db.query(User).count(),
        "leads_count": db.query(Lead).count(),
        "reviews_count": db.query(Review).count(),
        "garage_saves_count": db.query(SavedVehicle).count(),
    }

def run_scraper():
    # Placeholder for the actual scraper script execution
    os.system("python tools/scraper_cli.py")

@router.post("/trigger-scraper")
def trigger_scraper(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
        
    background_tasks.add_task(run_scraper)
    return {"message": "Scraper job triggered successfully"}
