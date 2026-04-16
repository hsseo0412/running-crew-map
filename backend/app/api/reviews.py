from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import CACHE_KEY_CREWS_LIST, get_redis
from app.models.crew import Crew
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewDelete, ReviewResponse


def _invalidate_list_cache() -> None:
    r = get_redis()
    if r:
        try:
            r.delete(CACHE_KEY_CREWS_LIST)
        except Exception:
            pass

router = APIRouter(tags=["reviews"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/api/crews/{crew_id}/reviews", response_model=list[ReviewResponse])
def list_reviews(crew_id: int, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")
    return (
        db.query(Review)
        .filter(Review.crew_id == crew_id)
        .order_by(Review.created_at.desc())
        .all()
    )


@router.post(
    "/api/crews/{crew_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(crew_id: int, payload: ReviewCreate, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")

    review = Review(
        crew_id=crew_id,
        nickname=payload.nickname,
        password_hash=pwd_context.hash(payload.password),
        rating=payload.rating,
        content=payload.content,
    )
    db.add(review)
    try:
        db.commit()
        db.refresh(review)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DB 오류가 발생했습니다.",
        )
    _invalidate_list_cache()
    return review


@router.delete("/api/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, payload: ReviewDelete, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="후기를 찾을 수 없습니다.")

    if not pwd_context.verify(payload.password, review.password_hash):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="비밀번호가 틀렸습니다.")

    db.delete(review)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DB 오류가 발생했습니다.",
        )
    _invalidate_list_cache()
