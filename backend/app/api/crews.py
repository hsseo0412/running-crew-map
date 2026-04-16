import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import CACHE_KEY_CREWS_LIST, CACHE_TTL, get_redis
from app.models.crew import Crew
from app.models.review import Review
from app.schemas.crew import CrewCreate, CrewResponse, CrewUpdate

router = APIRouter(prefix="/api/crews", tags=["crews"])


def _invalidate_list_cache() -> None:
    """전체 목록 캐시 무효화 — CRUD 성공 후 호출."""
    r = get_redis()
    if r:
        try:
            r.delete(CACHE_KEY_CREWS_LIST)
        except Exception:
            pass  # 무효화 실패 시 TTL 만료까지 대기 (최대 60s)


@router.get("", response_model=list[CrewResponse])
def list_crews(
    q: str | None = Query(default=None, description="크루명·주소 검색 키워드"),
    db: Session = Depends(get_db),
):
    # 검색 쿼리는 캐시 제외 — 사용자별 결과 상이 (Plan FR-03)
    if not q:
        r = get_redis()
        if r:
            try:
                cached = r.get(CACHE_KEY_CREWS_LIST)
                if cached:
                    return json.loads(cached)
            except Exception:
                pass  # 캐시 읽기 실패 시 DB 조회 Fallback

    # DB 조회 — 평점 집계 서브쿼리와 함께
    rating_sq = (
        db.query(
            Review.crew_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .group_by(Review.crew_id)
        .subquery()
    )
    query = (
        db.query(Crew, rating_sq.c.avg_rating, rating_sq.c.review_count)
        .outerjoin(rating_sq, Crew.id == rating_sq.c.crew_id)
    )
    if q:
        keyword = f"%{q}%"
        query = query.filter(
            or_(
                Crew.name.ilike(keyword),
                Crew.address.ilike(keyword),
            )
        )
    rows = query.order_by(Crew.created_at.desc()).all()

    result: list[CrewResponse] = []
    for crew, avg_rating, review_count in rows:
        resp = CrewResponse.model_validate(crew)
        resp.avg_rating = round(float(avg_rating), 1) if avg_rating is not None else None
        resp.review_count = review_count or 0
        result.append(resp)

    # 전체 목록만 캐시 write (Plan FR-02, FR-05)
    if not q:
        r = get_redis()
        if r:
            try:
                data = [item.model_dump(mode="json") for item in result]
                r.setex(CACHE_KEY_CREWS_LIST, CACHE_TTL, json.dumps(data))
            except Exception:
                pass  # 캐시 write 실패 시 무시

    return result


@router.get("/{crew_id}", response_model=CrewResponse)
def get_crew(crew_id: int, db: Session = Depends(get_db)):
    rating_sq = (
        db.query(
            Review.crew_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .group_by(Review.crew_id)
        .subquery()
    )
    row = (
        db.query(Crew, rating_sq.c.avg_rating, rating_sq.c.review_count)
        .outerjoin(rating_sq, Crew.id == rating_sq.c.crew_id)
        .filter(Crew.id == crew_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")
    crew, avg_rating, review_count = row
    resp = CrewResponse.model_validate(crew)
    resp.avg_rating = round(float(avg_rating), 1) if avg_rating is not None else None
    resp.review_count = review_count or 0
    return resp


@router.post("", response_model=CrewResponse, status_code=status.HTTP_201_CREATED)
def create_crew(payload: CrewCreate, db: Session = Depends(get_db)):
    crew = Crew(**payload.model_dump())
    db.add(crew)
    try:
        db.commit()
        db.refresh(crew)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 크루입니다.")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB 오류가 발생했습니다.")
    _invalidate_list_cache()
    resp = CrewResponse.model_validate(crew)
    return resp


@router.put("/{crew_id}", response_model=CrewResponse)
def update_crew(crew_id: int, payload: CrewUpdate, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crew, field, value)

    try:
        db.commit()
        db.refresh(crew)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 크루입니다.")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB 오류가 발생했습니다.")
    _invalidate_list_cache()
    # avg_rating 포함한 응답 반환 (update 후에도 기존 리뷰 평점 유지)
    rating_sq = (
        db.query(
            Review.crew_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .group_by(Review.crew_id)
        .subquery()
    )
    row = (
        db.query(Crew, rating_sq.c.avg_rating, rating_sq.c.review_count)
        .outerjoin(rating_sq, Crew.id == rating_sq.c.crew_id)
        .filter(Crew.id == crew_id)
        .first()
    )
    crew, avg_rating, review_count = row
    resp = CrewResponse.model_validate(crew)
    resp.avg_rating = round(float(avg_rating), 1) if avg_rating is not None else None
    resp.review_count = review_count or 0
    return resp


@router.delete("/{crew_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crew(crew_id: int, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")

    db.delete(crew)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB 오류가 발생했습니다.")
    _invalidate_list_cache()
