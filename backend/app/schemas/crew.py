from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


LevelType = Literal["beginner", "intermediate", "advanced"]


class CrewBase(BaseModel):
    name: str = Field(..., max_length=100, description="크루명")
    description: str | None = Field(None, max_length=1000, description="크루 설명")
    latitude: float = Field(..., ge=-90, le=90, description="위도")
    longitude: float = Field(..., ge=-180, le=180, description="경도")
    address: str | None = Field(None, max_length=300, description="주소")
    meeting_day: str | None = Field(None, max_length=50, description="정기 러닝 요일 (예: 월,수,금)")
    meeting_time: str | None = Field(None, max_length=10, description="출발 시간 (예: 07:00)")
    pace: str | None = Field(None, max_length=20, description="평균 페이스 (예: 5'30\"/km)")
    level: LevelType | None = Field(None, description="난이도")
    contact: str | None = Field(None, max_length=300, description="연락처 / 오픈채팅 링크")
    member_count: int | None = Field(None, ge=1, description="크루 인원")


class CrewCreate(CrewBase):
    pass


class CrewUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=1000)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    address: str | None = Field(None, max_length=300)
    meeting_day: str | None = Field(None, max_length=50)
    meeting_time: str | None = Field(None, max_length=10)
    pace: str | None = Field(None, max_length=20)
    level: LevelType | None = None
    contact: str | None = Field(None, max_length=300)
    member_count: int | None = Field(None, ge=1)


class CrewResponse(CrewBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
