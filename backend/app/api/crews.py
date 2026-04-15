import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis import CACHE_KEY_CREWS_LIST, CACHE_TTL, get_redis
from app.models.crew import Crew
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

    # DB 조회
    query = db.query(Crew)
    if q:
        keyword = f"%{q}%"
        query = query.filter(
            or_(
                Crew.name.ilike(keyword),
                Crew.address.ilike(keyword),
            )
        )
    rows = query.order_by(Crew.created_at.desc()).all()

    # 전체 목록만 캐시 write (Plan FR-02, FR-05)
    if not q:
        r = get_redis()
        if r:
            try:
                data = [CrewResponse.model_validate(row).model_dump(mode="json") for row in rows]
                r.setex(CACHE_KEY_CREWS_LIST, CACHE_TTL, json.dumps(data))
            except Exception:
                pass  # 캐시 write 실패 시 무시

    return rows


@router.get("/{crew_id}", response_model=CrewResponse)
def get_crew(crew_id: int, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")
    return crew


@router.post("", response_model=CrewResponse, status_code=status.HTTP_201_CREATED)
def create_crew(payload: CrewCreate, db: Session = Depends(get_db)):
    crew = Crew(**payload.model_dump())
    db.add(crew)
    db.commit()
    db.refresh(crew)
    _invalidate_list_cache()  # Plan FR-04
    return crew


@router.put("/{crew_id}", response_model=CrewResponse)
def update_crew(crew_id: int, payload: CrewUpdate, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crew, field, value)

    db.commit()
    db.refresh(crew)
    _invalidate_list_cache()  # Plan FR-04
    return crew


@router.delete("/{crew_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crew(crew_id: int, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")

    db.delete(crew)
    db.commit()
    _invalidate_list_cache()  # Plan FR-04
