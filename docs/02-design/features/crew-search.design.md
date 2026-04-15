# crew-search Design Document

> **Summary**: 키워드로 크루명·주소를 실시간 검색하여 지도와 목록을 동시에 필터링하는 기능
>
> **Project**: running-crew-map
> **Version**: 0.1.0
> **Author**: hsseo0412
> **Date**: 2026-04-15
> **Status**: Draft
> **Planning Doc**: [crew-search.plan.md](../../01-plan/features/crew-search.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 크루 수 증가 시 스크롤 탐색만으로 원하는 크루를 찾기 어려움 → 키워드 검색으로 즉시 탐색 |
| **WHO** | 특정 지역이나 이름의 크루를 찾으려는 일반 방문자 |
| **RISK** | API 호출 빈도 과다 (debounce로 완화), 기존 필터와의 AND 조합 로직 |
| **SUCCESS** | 검색어 입력 후 300ms 이내 결과 반영, 기존 필터(난이도/요일)와 정상 AND 동작 |
| **SCOPE** | Phase 1: 백엔드 q 파라미터 / Phase 2: 프론트 검색 UI + debounce 연동 |

---

## 1. Overview

### 1.1 Design Goals

- 기존 코드 구조(App.tsx 중앙 상태 관리)를 유지하면서 검색 상태를 일관되게 추가
- `useDebounce` 훅을 독립 모듈로 분리하여 향후 재사용 가능하게
- 검색 → debounce → API 재호출 → 프론트 필터(level/day) 체인을 단방향 데이터 흐름으로 구성

### 1.2 Design Principles

- 기존 `filterLevel` / `filterDay` 패턴과 동일한 방식으로 `searchQuery` 추가 (일관성)
- 백엔드에서 검색, 프론트에서 난이도·요일 필터 (역할 분리)
- 신규 파일 최소화 (훅 1개)

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | **Option C: Pragmatic ✅** |
|----------|:-:|:-:|:-:|
| 신규 파일 | 0개 | 3개 | **1개** |
| 변경 파일 | 2개 | 2개 | **2개** |
| 복잡도 | 낮음 | 높음 | **중간** |
| 재사용성 | 없음 | 높음 | **중간** |
| 권장 | 일회성 | 대규모 프로젝트 | **기본 선택** |

**Selected**: Option C — Pragmatic  
**Rationale**: `useDebounce`는 다른 입력(예: 주소 검색 등)에서 재사용 가능. 검색 상태는 기존 filterLevel/filterDay 패턴과 동일하게 App.tsx에서 관리하여 일관성 유지.

### 2.1 데이터 흐름

```
사용자 입력
    │
    ▼
searchQuery (App.tsx useState)
    │
    ▼
useDebounce(searchQuery, 300ms)
    │
    ▼
debouncedSearch (300ms 지연 값)
    │
    ▼
useEffect → fetch("/api/crews?q=debouncedSearch")
    │
    ▼
setCrews(결과) ← 백엔드: name ILIKE %q% OR address ILIKE %q%
    │
    ▼
filteredCrews = useMemo(crews, filterLevel, filterDay)  ← 프론트 AND 조합
    │
    ▼
CrewList 목록 + MapMarker 마커 동시 갱신
```

### 2.2 컴포넌트 다이어그램

```
App.tsx
├── state: crews, searchQuery, filterLevel, filterDay
├── useDebounce(searchQuery, 300) → debouncedSearch
├── useEffect([debouncedSearch]) → fetch /api/crews?q=...
├── filteredCrews = useMemo(crews, filterLevel, filterDay)
│
├── CrewList (props 추가)
│   ├── searchQuery, onSearchChange   ← 신규
│   ├── filterLevel, onFilterLevelChange
│   ├── filterDay, onFilterDayChange
│   └── 검색 입력창 UI (filterSection 상단)
│
└── MapMarker × filteredCrews.length
```

### 2.3 변경/신규 파일 목록

| 파일 | 구분 | 변경 내용 |
|------|------|-----------|
| `backend/app/api/crews.py` | 수정 | `q` Optional 파라미터 + ILIKE 필터 |
| `frontend/src/hooks/useDebounce.ts` | **신규** | 제네릭 debounce 훅 |
| `frontend/src/components/CrewList.tsx` | 수정 | 검색 입력창 UI + Props 추가 |
| `frontend/src/App.tsx` | 수정 | searchQuery 상태 + useDebounce + fetch 로직 수정 |

---

## 3. Data Model

### 3.1 변경 없음

`Crew` 모델 및 DB 스키마 변경 없음. 검색은 쿼리 레벨에서만 처리.

### 3.2 프론트 신규 상태

```typescript
// App.tsx에 추가되는 상태
const [searchQuery, setSearchQuery] = useState<string>("");
const debouncedSearch = useDebounce(searchQuery, 300);

// useEffect: debouncedSearch 변경 시 API 재호출
useEffect(() => {
  const params = debouncedSearch ? `?q=${encodeURIComponent(debouncedSearch)}` : "";
  fetch(`/api/crews${params}`)
    .then(res => { if (!res.ok) throw new Error(...); return res.json(); })
    .then(setCrews)
    .catch(e => setFetchError(e.message));
}, [debouncedSearch]);
```

---

## 4. API Specification

### 4.1 변경 엔드포인트

| Method | Path | 변경사항 |
|--------|------|---------|
| GET | `/api/crews` | `q` 쿼리 파라미터 추가 (optional) |

### 4.2 상세 명세

#### `GET /api/crews?q={keyword}`

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|:----:|------|
| `q` | string | No | 검색 키워드 (없으면 전체 반환) |

**검색 로직:**
```python
# crews.py 수정 내용
from fastapi import Query

@router.get("", response_model=list[CrewResponse])
def list_crews(
    q: str | None = Query(default=None, description="크루명·주소 검색"),
    db: Session = Depends(get_db)
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
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "서울 한강 러닝 크루",
    "address": "서울시 마포구 한강공원",
    ...
  }
]
```

**동작 규칙:**
- `q` 없거나 빈 문자열 → 전체 목록 반환 (기존 동작 유지)
- `q` 있으면 `name ILIKE %q%` OR `address ILIKE %q%`
- 대소문자 구분 없음 (`ILIKE`)

---

## 5. UI/UX Design

### 5.1 검색 입력창 레이아웃

```
┌─────────────────────────────────┐
│  크루 목록          크루 등록    │  ← 탭바 (기존)
├─────────────────────────────────┤
│  🔍 [크루명 또는 주소 검색   ✕] │  ← 검색 입력창 (신규)
├─────────────────────────────────┤
│  난이도  [전체] [초급] [중급] [고급] │
│  요일    [전체] [월] [화] ... [일]  │  ← 기존 필터 (유지)
├─────────────────────────────────┤
│  N개 크루                        │
│  ─────────────────────────────  │
│  [크루 카드]                     │
│  [크루 카드]                     │
└─────────────────────────────────┘
```

### 5.2 상태별 UI

| 상태 | UI |
|------|-----|
| 기본 (검색어 없음) | placeholder: "크루명 또는 주소 검색", X 버튼 숨김 |
| 입력 중 | X 버튼 표시, 300ms debounce 후 API 호출 |
| 결과 있음 | 일반 목록 표시 |
| 결과 없음 | "검색 결과가 없습니다." 메시지 |

### 5.3 컴포넌트 Props 변경

```typescript
// CrewList.tsx Props 추가
interface Props {
  // 기존 유지
  crews: Crew[];
  fetchError: string | null;
  selectedCrewId: number | null;
  filterLevel: string;
  filterDay: string;
  onClickCrew: (crew: Crew) => void;
  onEditCrew: (crew: Crew) => void;
  onDeleteCrew: (crew: Crew) => void;
  onFilterLevelChange: (v: string) => void;
  onFilterDayChange: (v: string) => void;

  // 신규 추가
  searchQuery: string;
  onSearchChange: (v: string) => void;
}
```

### 5.4 Page UI Checklist

#### 크루 목록 패널 (CrewList)

- [ ] Input: 검색 입력창 (placeholder: "크루명 또는 주소 검색")
- [ ] Button: 검색어 초기화 X 버튼 (searchQuery 있을 때만 표시)
- [ ] Icon: 돋보기 아이콘 (검색창 왼쪽)
- [ ] Filter: 난이도 버튼 그룹 (전체/초급/중급/고급) — 기존 유지
- [ ] Filter: 요일 버튼 그룹 (전체/월~일) — 기존 유지
- [ ] Text: `N개 크루` 결과 카운트
- [ ] Empty state: "검색 결과가 없습니다." (결과 0건 시)
- [ ] List: 크루 카드 목록 (기존 유지)

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| API 호출 실패 (검색 중) | 기존 `fetchError` 상태에 메시지 표시 |
| 빈 검색어 | `q` 파라미터 없이 요청 → 전체 목록 반환 |
| 특수문자 검색 | `encodeURIComponent(debouncedSearch)` 로 URL 인코딩 |

---

## 7. Security Considerations

- [x] `encodeURIComponent`로 URL 인젝션 방지
- [x] SQLAlchemy ORM ILIKE 사용 → SQL Injection 방지 (파라미터 바인딩)
- [ ] Rate Limiting: 현재 미적용 (추후 Redis 기반 적용 고려)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| L1: API | `GET /api/crews?q=` 동작 검증 | curl |
| L2: UI Action | 검색창 입력 → 목록 갱신 확인 | 수동 |
| L3: E2E | 검색 + 필터 복합 시나리오 | 수동 |

### 8.2 L1: API Test Scenarios

| # | Endpoint | 설명 | Expected |
|---|----------|------|----------|
| 1 | `GET /api/crews` | q 없음 → 전체 반환 | 200, 전체 크루 배열 |
| 2 | `GET /api/crews?q=한강` | 이름 매칭 | 200, "한강" 포함 크루만 반환 |
| 3 | `GET /api/crews?q=서울` | 주소 매칭 | 200, 서울 주소 크루 반환 |
| 4 | `GET /api/crews?q=없는크루xyz` | 매칭 없음 | 200, 빈 배열 `[]` |
| 5 | `GET /api/crews?q=` | 빈 문자열 | 200, 전체 크루 배열 (q 없을 때와 동일) |

### 8.3 L2: UI Action Test Scenarios

| # | Action | Expected |
|---|--------|----------|
| 1 | 검색창에 "한강" 입력 | 300ms 후 목록·마커 갱신 |
| 2 | X 버튼 클릭 | 검색어 초기화, 전체 목록 복귀 |
| 3 | 검색 중 난이도 필터 변경 | 검색결과에 필터 AND 적용 |
| 4 | 검색결과 0건 | "검색 결과가 없습니다." 표시 |
| 5 | 검색어 입력 후 크루 클릭 | 지도 이동 + 말풍선 정상 동작 |

### 8.4 Seed Data Requirements

| 조건 | 내용 |
|------|------|
| 최소 크루 수 | 3개 이상 |
| 검색 검증용 | 이름에 "한강" 포함 1개, 주소에 "서울" 포함 1개, 매칭 안되는 크루 1개 |

---

## 9. Clean Architecture (Layer Assignment)

| 파일 | Layer | 역할 |
|------|-------|------|
| `CrewList.tsx` | Presentation | 검색 UI 렌더링 |
| `App.tsx` | Presentation / Application | 검색 상태 관리, API 오케스트레이션 |
| `useDebounce.ts` | Application | debounce 로직 (순수 훅) |
| `crews.py` | Infrastructure | DB 쿼리 실행 |

---

## 10. Coding Convention Reference

| 항목 | 적용 규칙 |
|------|----------|
| 훅 파일명 | camelCase (`useDebounce.ts`) |
| Props 인터페이스 | PascalCase (`Props` in component file) |
| 이벤트 핸들러 | `on` 접두사 (`onSearchChange`) |
| 상태 변수 | camelCase (`searchQuery`, `debouncedSearch`) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
[신규]
frontend/src/hooks/useDebounce.ts

[수정]
backend/app/api/crews.py
frontend/src/components/CrewList.tsx
frontend/src/App.tsx
```

### 11.2 Implementation Order

1. [ ] `backend/app/api/crews.py` — `q` 파라미터 + ILIKE 쿼리 추가
2. [ ] `frontend/src/hooks/useDebounce.ts` — 제네릭 debounce 훅 구현
3. [ ] `frontend/src/App.tsx` — `searchQuery` 상태, `useDebounce`, fetch 로직 수정
4. [ ] `frontend/src/components/CrewList.tsx` — 검색 입력창 UI + Props 연결
5. [ ] 통합 테스트 — 검색 + 필터 AND 동작 확인

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | 설명 | 예상 작업량 |
|--------|-----------|------|:-----------:|
| 백엔드 검색 API | `module-1` | crews.py q 파라미터 + ILIKE | 소 (10분) |
| debounce 훅 | `module-2` | useDebounce.ts 신규 작성 | 소 (5분) |
| 프론트 상태+연동 | `module-3` | App.tsx 상태·fetch 수정 | 중 (15분) |
| 검색 UI | `module-4` | CrewList.tsx 검색창 UI | 중 (20분) |

#### Recommended Session Plan

| Session | 범위 | 내용 |
|---------|------|------|
| Session 1 (현재) | Plan + Design | 완료 ✅ |
| Session 2 | Do (전체) | module-1 ~ module-4 순서대로 구현 |
| Session 3 | Check + Report | 갭 분석 + 완료 보고서 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-15 | Initial draft (Option C Pragmatic 선택) | hsseo0412 |
