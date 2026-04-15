# crew-review Design Document

> **Feature**: crew-review
> **Date**: 2026-04-15
> **Author**: hsseo0412
> **Status**: Draft
> **Architecture**: Option C — 실용적 균형

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 크루 선택 시 객관적인 참여자 경험이 없으면 신뢰도가 낮아 이탈 가능성 증가 |
| **WHO** | 크루 가입을 고민 중인 방문자, 크루에 참여해본 경험자 |
| **RISK** | 비밀번호 없이 타인 후기 삭제 가능성 / 스팸·악성 후기 |
| **SUCCESS** | 크루 상세 패널에서 후기 목록 조회, 후기 작성(별점+텍스트), 본인 후기 삭제 정상 동작 |
| **SCOPE** | 크루 상세 패널 내 후기 섹션만. 후기 수정 없음. 관리자 기능 없음. |

---

## 1. 데이터 모델

### 1.1 Review 테이블

```sql
CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    crew_id     INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    nickname    VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,   -- bcrypt 해시
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content     VARCHAR(500) NOT NULL,     -- 최소 10자
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_reviews_crew_id ON reviews(crew_id);
```

### 1.2 SQLAlchemy 모델 (`backend/app/models/review.py`)

```python
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    crew_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crews.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

---

## 2. Pydantic 스키마 (`backend/app/schemas/review.py`)

```python
class ReviewCreate(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)   # 평문, 서버에서 해시
    rating: int = Field(..., ge=1, le=5)
    content: str = Field(..., min_length=10, max_length=500)

class ReviewDelete(BaseModel):
    password: str  # 평문, 서버에서 해시 비교

class ReviewResponse(BaseModel):
    id: int
    nickname: str
    rating: int
    content: str
    created_at: datetime
    # password_hash 절대 노출 금지

    model_config = {"from_attributes": True}
```

---

## 3. API 설계 (`backend/app/api/reviews.py`)

| Method | Path | 설명 | 상태코드 |
|--------|------|------|----------|
| GET | `/api/crews/{crew_id}/reviews` | 후기 목록 조회 (최신순) | 200 |
| POST | `/api/crews/{crew_id}/reviews` | 후기 작성 | 201 |
| DELETE | `/api/reviews/{review_id}` | 후기 삭제 (비밀번호 확인) | 204 |

### 3.1 GET `/api/crews/{crew_id}/reviews`

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "nickname": "러너123",
    "rating": 5,
    "content": "분위기 좋고 페이스 맞춰줘요!",
    "created_at": "2026-04-15T10:00:00Z"
  }
]
```

**Error**: crew_id 없을 시 `404 Not Found`

### 3.2 POST `/api/crews/{crew_id}/reviews`

**Request Body**:
```json
{
  "nickname": "러너123",
  "password": "pass1234",
  "rating": 5,
  "content": "분위기 좋고 페이스 맞춰줘요!"
}
```

**Response** `201 Created`: ReviewResponse  
**Error**: `404` crew 없음, `422` 유효성 오류

### 3.3 DELETE `/api/reviews/{review_id}`

**Request Body**:
```json
{ "password": "pass1234" }
```

**Response** `204 No Content`  
**Error**: `404` 후기 없음, `403` 비밀번호 불일치

---

## 4. 보안

| 항목 | 처리 방법 |
|------|-----------|
| 비밀번호 저장 | `passlib[bcrypt]` — `pwd_context.hash(password)` |
| 비밀번호 검증 | `pwd_context.verify(plain, hashed)` |
| 응답 노출 | `ReviewResponse`에 `password_hash` 필드 제외 |
| 콘텐츠 최소 길이 | 10자 이상 (Pydantic `min_length=10`) |

---

## 5. 프론트엔드 구조

### 5.1 파일 구성

```
frontend/src/
├── components/
│   ├── CrewDetail.tsx          # 수정: ReviewSection 삽입
│   └── ReviewSection.tsx       # 신규: 후기 목록 + 작성 폼 통합
└── types/
    └── review.ts               # 신규: Review 타입
```

### 5.2 타입 정의 (`frontend/src/types/review.ts`)

```typescript
export interface Review {
  id: number;
  nickname: string;
  rating: number;
  content: string;
  created_at: string;
}

export interface ReviewCreatePayload {
  nickname: string;
  password: string;
  rating: number;
  content: string;
}
```

### 5.3 ReviewSection 컴포넌트 구조

```
ReviewSection
├── 요약 헤더: 평균 별점(★ x.x) + 후기 N개
├── 후기 목록
│   └── ReviewItem (닉네임, 별점, 내용, 날짜, 삭제버튼)
│       └── 삭제 클릭 → 비밀번호 입력 인라인 폼 → DELETE 호출
├── 구분선
└── 후기 작성 폼
    ├── 닉네임 입력
    ├── 비밀번호 입력
    ├── 별점 선택 (★ 클릭)
    ├── 내용 textarea
    └── 등록 버튼
```

### 5.4 별점 UI

외부 라이브러리 없이 순수 CSS + 클릭 핸들러로 구현:
```tsx
{[1, 2, 3, 4, 5].map((star) => (
  <span
    key={star}
    onClick={() => setRating(star)}
    style={{ color: star <= rating ? '#f59e0b' : '#d1d5db', cursor: 'pointer' }}
  >★</span>
))}
```

---

## 6. 구현 순서 (Session Guide)

### Module 1 — 백엔드 (backend)
1. `passlib[bcrypt]` → `requirements.txt` 추가
2. `backend/app/models/review.py` — Review 모델 작성
3. `backend/app/schemas/review.py` — Pydantic 스키마 작성
4. `backend/app/api/reviews.py` — API 라우터 구현
5. `backend/app/main.py` — reviews 라우터 등록
6. Alembic 마이그레이션 생성 및 적용

### Module 2 — 프론트엔드 (frontend)
1. `frontend/src/types/review.ts` — Review 타입 정의
2. `frontend/src/components/ReviewSection.tsx` — 후기 섹션 컴포넌트
3. `frontend/src/components/CrewDetail.tsx` — ReviewSection 삽입

---

## 7. 테스트 시나리오

| 시나리오 | 기대 결과 |
|----------|-----------|
| 후기 없는 크루 상세 조회 | "아직 후기가 없습니다" 표시 |
| 후기 작성 (정상) | 목록 맨 위에 즉시 반영 |
| 후기 작성 (내용 9자) | 422 오류 + 안내 메시지 |
| 삭제 (올바른 비밀번호) | 목록에서 즉시 제거 |
| 삭제 (틀린 비밀번호) | 403 오류 + "비밀번호가 틀렸습니다" |
| 크루 삭제 시 | 후기도 cascade 삭제 |

---

## Version History

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|----------|--------|
| 0.1 | 2026-04-15 | 초안 (Option C 선택) | hsseo0412 |
