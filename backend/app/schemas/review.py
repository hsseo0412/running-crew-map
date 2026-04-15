from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50, description="닉네임")
    password: str = Field(..., min_length=4, max_length=100, description="비밀번호 (삭제 시 확인용)")
    rating: int = Field(..., ge=1, le=5, description="별점 1~5")
    content: str = Field(..., min_length=10, max_length=500, description="후기 내용 (최소 10자)")


class ReviewDelete(BaseModel):
    password: str = Field(..., description="삭제 확인용 비밀번호")


class ReviewResponse(BaseModel):
    id: int
    nickname: str
    rating: int
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
