from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from ..db.database import get_db
from ..db.models import Review, User
from ..core.security import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

class ReviewCreate(BaseModel):
    rating: int
    review_text: str | None = None

class ReviewResponse(BaseModel):
    id: int
    vehicle_variant_id: str
    rating: int
    review_text: str | None
    created_at: datetime
    user_email: str
    
    class Config:
        from_attributes = True

@router.get("/{variant_id}", response_model=List[ReviewResponse])
def get_reviews(variant_id: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.vehicle_variant_id == variant_id).all()
    # map user email manually or load eagerly
    result = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        email = user.email if user else "Unknown"
        result.append(ReviewResponse(
            id=r.id,
            vehicle_variant_id=r.vehicle_variant_id,
            rating=r.rating,
            review_text=r.review_text,
            created_at=r.created_at,
            user_email=email
        ))
    return result

@router.post("/{variant_id}", response_model=ReviewResponse)
def post_review(variant_id: str, review: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not (1 <= review.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    new_review = Review(
        user_id=current_user.id,
        vehicle_variant_id=variant_id,
        rating=review.rating,
        review_text=review.review_text
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    return ReviewResponse(
        id=new_review.id,
        vehicle_variant_id=new_review.vehicle_variant_id,
        rating=new_review.rating,
        review_text=new_review.review_text,
        created_at=new_review.created_at,
        user_email=current_user.email
    )
