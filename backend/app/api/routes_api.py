from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.route import Route
from app.schemas.route import RouteCreate, RouteResponse

router = APIRouter(prefix="/api/crews", tags=["routes"])


@router.get("/{crew_id}/route", response_model=RouteResponse)
def get_route(crew_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.crew_id == crew_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="코스가 없습니다.")
    return route


@router.post("/{crew_id}/route", response_model=RouteResponse)
def upsert_route(crew_id: int, payload: RouteCreate, db: Session = Depends(get_db)):
    coords = [wp.model_dump() for wp in payload.coordinates]

    route = db.query(Route).filter(Route.crew_id == crew_id).first()
    if route:
        route.coordinates = coords
        route.distance_km = payload.distance_km
    else:
        route = Route(
            crew_id=crew_id,
            coordinates=coords,
            distance_km=payload.distance_km,
        )
        db.add(route)

    db.commit()
    db.refresh(route)
    return route


@router.delete("/{crew_id}/route", status_code=204)
def delete_route(crew_id: int, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.crew_id == crew_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="코스가 없습니다.")
    db.delete(route)
    db.commit()
