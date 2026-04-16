from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class Waypoint(BaseModel):
    lat: float
    lng: float


class RouteCreate(BaseModel):
    coordinates: List[Waypoint] = Field(..., min_length=2, max_length=50)
    distance_km: float = Field(..., ge=0)


class RouteResponse(BaseModel):
    id: int
    crew_id: int
    coordinates: List[Waypoint]
    distance_km: float
    created_at: datetime

    model_config = {"from_attributes": True}
