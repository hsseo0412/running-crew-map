# crew-ranking Design Document

> **Feature**: crew-ranking
> **Date**: 2026-04-20
> **Author**: hsseo0412
> **Status**: Draft
> **Architecture**: Option C — 실용적 균형

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 후기 데이터가 쌓였지만 평점 높은 크루를 한눈에 볼 방법이 없어 탐색 효율이 낮음 |
| **WHO** | 어떤 크루에 가입할지 고민 중인 방문자, 검증된 크루를 찾는 러너 |
| **RISK** | 후기가 0개인 신규 크루의 랭킹 제외 → 노출 기회 불균형 |
| **SUCCESS** | TOP 5 랭킹 목록이 사이드바에 표시되고, 클릭 시 크루 상세로 정상 이동 |
| **SCOPE** | 사이드바 내 랭킹 섹션만. 별도 랭킹 페이지 없음. 랭킹 갱신은 페이지 로드 시 1회. |

---

## 1. API 설계

### 1.1 엔드포인트

```
GET /api/crews/ranking?limit=5
```

| 항목 | 내용 |
|------|------|
| **경로** | `/api/crews/ranking` |
| **메서드** | GET |
| **파라미터** | `limit` (int, optional, default=5) |
| **응답** | `list[RankedCrewResponse]` |

> **주의**: FastAPI 라우터에서 `/ranking` 은 반드시 `/{crew_id}` 보다 먼저 등록해야 경로 충돌 방지.
> `crews.py` 내 `@router.get("/ranking")` 을 `@router.get("/{crew_id}")` 앞에 위치시킨다.

### 1.2 응답 스키마

```python
class RankedCrewResponse(BaseModel):
    id: int
    name: str
    avg_rating: float       # 소수점 1자리, 후기 0개 크루는 제외되므로 항상 존재
    review_count: int
    address: str | None
```

### 1.3 응답 예시

```json
[
  { "id": 3, "name": "한강런너스", "avg_rating": 4.8, "review_count": 12, "address": "서울 마포구" },
  { "id": 7, "name": "강남페이서스", "avg_rating": 4.5, "review_count": 8, "address": "서울 강남구" },
  { "id": 1, "name": "올림픽공원크루", "avg_rating": 4.3, "review_count": 5, "address": "서울 송파구" }
]
```

---

## 2. 백엔드 구현

### 2.1 Pydantic 스키마 (`backend/app/schemas/crew.py`)

기존 `crew.py` 스키마 파일에 `RankedCrewResponse` 추가:

```python
class RankedCrewResponse(BaseModel):
    id: int
    name: str
    avg_rating: float
    review_count: int
    address: str | None = None

    model_config = ConfigDict(from_attributes=True)
```

### 2.2 랭킹 엔드포인트 (`backend/app/api/crews.py`)

`/{crew_id}` GET 핸들러 **앞에** 삽입:

```python
@router.get("/ranking", response_model=list[RankedCrewResponse])
def get_ranking(
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    rating_sq = (
        db.query(
            Review.crew_id,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .group_by(Review.crew_id)
        .having(func.count(Review.id) > 0)  # 후기 0개 제외
        .subquery()
    )
    rows = (
        db.query(Crew, rating_sq.c.avg_rating, rating_sq.c.review_count)
        .join(rating_sq, Crew.id == rating_sq.c.crew_id)  # INNER JOIN — 후기 없는 크루 제외
        .order_by(rating_sq.c.avg_rating.desc(), rating_sq.c.review_count.desc())
        .limit(limit)
        .all()
    )
    result = []
    for crew, avg_rating, review_count in rows:
        result.append(
            RankedCrewResponse(
                id=crew.id,
                name=crew.name,
                avg_rating=round(float(avg_rating), 1),
                review_count=review_count,
                address=crew.address,
            )
        )
    return result
```

**정렬 기준**: `avg_rating DESC` → `review_count DESC` (동점 시 후기 수 많은 크루 우선)

---

## 3. 프론트엔드 컴포넌트

### 3.1 타입 정의 (`frontend/src/types/crew.ts`)

기존 `Crew` 타입에 추가:

```typescript
export interface RankedCrew {
  id: number;
  name: string;
  avg_rating: number;
  review_count: number;
  address: string | null;
}
```

### 3.2 CrewRanking 컴포넌트 (`frontend/src/components/CrewRanking.tsx`)

```typescript
interface Props {
  onSelectCrew: (crewId: number) => void;
}

export function CrewRanking({ onSelectCrew }: Props) {
  const [ranking, setRanking] = useState<RankedCrew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crews/ranking?limit=5")
      .then((r) => r.json())
      .then((data) => setRanking(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (ranking.length === 0) return <EmptyState />;

  return (
    <section style={s.section}>
      <h3 style={s.title}>인기 크루 TOP 5</h3>
      <ol style={s.list}>
        {ranking.map((crew, i) => (
          <li key={crew.id} style={s.item} onClick={() => onSelectCrew(crew.id)}>
            <span style={s.rank}>{i + 1}</span>
            <div style={s.info}>
              <span style={s.name}>{crew.name}</span>
              <span style={s.meta}>★ {crew.avg_rating} · {crew.review_count}개</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

### 3.3 UI 레이아웃

```
┌─────────────────────────┐
│  인기 크루 TOP 5         │  ← 섹션 타이틀
├─────────────────────────┤
│  1  한강런너스            │
│     ★ 4.8 · 12개        │
├─────────────────────────┤
│  2  강남페이서스           │
│     ★ 4.5 · 8개         │
├─────────────────────────┤
│  ...                    │
├─────────────────────────┤
│  검색 + 필터             │  ← 기존 CrewList 영역
│  크루 목록               │
└─────────────────────────┘
```

### 3.4 `onSelectCrew` 연결 방식

`CrewRanking`은 `crewId`(number)를 받아 `App.tsx`의 `crews` 배열에서 해당 크루를 찾아 선택한다.

```typescript
// App.tsx 또는 CrewList.tsx 통합 지점
<CrewRanking onSelectCrew={(id) => {
  const crew = crews.find((c) => c.id === id);
  if (crew) onClickCrew(crew);
}} />
```

---

## 4. 통합 위치

### 4.1 `CrewList.tsx`에 마운트

`CrewList.tsx` 반환 JSX 최상단(검색 영역 위)에 `<CrewRanking>` 추가:

```tsx
return (
  <div>
    <CrewRanking onSelectCrew={(id) => {
      const found = crews.find((c) => c.id === id);
      if (found) onClickCrew(found);
    }} />
    {/* 기존 검색 영역 */}
    <div style={s.searchSection}>
      ...
    </div>
  </div>
);
```

---

## 5. 빈 상태 처리

후기가 하나도 없을 때(서비스 초기):

```tsx
function EmptyState() {
  return (
    <section style={s.section}>
      <h3 style={s.title}>인기 크루 TOP 5</h3>
      <p style={s.empty}>아직 후기가 없어요. 첫 후기를 남겨보세요!</p>
    </section>
  );
}
```

---

## 6. 테스트 시나리오

| ID | 시나리오 | 기대 결과 |
|----|---------|---------|
| T-01 | `GET /api/crews/ranking` 정상 호출 | 200, 평점 내림차순 최대 5개 반환 |
| T-02 | 후기 없는 크루가 DB에 있을 때 | 해당 크루 랭킹 제외 확인 |
| T-03 | 평점 동점 크루 존재 시 | 후기 수 많은 크루가 상위에 위치 |
| T-04 | `/api/crews/ranking` → `/api/crews/{id}` 경로 충돌 | `/ranking` 이 올바르게 응답 (404 아님) |
| T-05 | 사이드바에서 랭킹 크루 클릭 | 해당 크루 상세 패널 열림 |
| T-06 | 후기 0건 상태에서 페이지 접근 | 빈 상태 메시지 표시 |

---

## 11. Implementation Guide

### 11.1 구현 순서

1. `backend/app/schemas/crew.py` — `RankedCrewResponse` 추가
2. `backend/app/api/crews.py` — `/ranking` 엔드포인트 추가 (위치: `/{crew_id}` 앞)
3. `frontend/src/types/crew.ts` — `RankedCrew` 타입 추가
4. `frontend/src/components/CrewRanking.tsx` — 신규 컴포넌트 생성
5. `frontend/src/components/CrewList.tsx` — `<CrewRanking>` 마운트

### 11.2 변경 파일 요약

| 파일 | 변경 유형 | 주요 내용 |
|------|---------|---------|
| `backend/app/schemas/crew.py` | 수정 | `RankedCrewResponse` 추가 |
| `backend/app/api/crews.py` | 수정 | `/ranking` GET 핸들러 추가 |
| `frontend/src/types/crew.ts` | 수정 | `RankedCrew` 인터페이스 추가 |
| `frontend/src/components/CrewRanking.tsx` | 신규 | TOP 5 랭킹 컴포넌트 |
| `frontend/src/components/CrewList.tsx` | 수정 | `<CrewRanking>` 통합 |

### 11.3 Session Guide

**Module Map**:
| 모듈 | 파일 | 예상 소요 |
|------|------|---------|
| module-1: Backend | `schemas/crew.py`, `api/crews.py` | ~15분 |
| module-2: Frontend | `types/crew.ts`, `CrewRanking.tsx`, `CrewList.tsx` | ~20분 |

**추천 세션 플랜**: 단일 세션으로 진행 가능 (총 ~35분 예상)
- `/pdca do crew-ranking` — 전체 구현
