from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.crew import Crew
from app.schemas.crew import CrewCreate, CrewResponse, CrewUpdate

router = APIRouter(prefix="/api/crews", tags=["crews"])


@router.get("", response_model=list[CrewResponse])
def list_crews(
    # Design Ref: §4 — name ILIKE OR address ILIKE, q 없으면 전체 반환
    q: str | None = Query(default=None, description="크루명·주소 검색 키워드"),
    db: Session = Depends(get_db),
):
    query = db.query(Crew)
    if q:
        keyword = f"%{q}%"
        query = query.filter(
            or_(
                Crew.name.ilike(keyword),
                Crew.address.ilike(keyword),
            )
        )
    return query.order_by(Crew.created_at.desc()).all()


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
    return crew


@router.delete("/{crew_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crew(crew_id: int, db: Session = Depends(get_db)):
    crew = db.query(Crew).filter(Crew.id == crew_id).first()
    if not crew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="크루를 찾을 수 없습니다.")

    db.delete(crew)
    db.commit()
