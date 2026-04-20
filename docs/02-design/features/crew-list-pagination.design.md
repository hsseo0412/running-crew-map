# crew-list-pagination Design Document

> **Feature**: crew-list-pagination
> **Date**: 2026-04-20
> **Author**: hsseo0412
> **Status**: Draft
> **Architecture**: Option A — 최소 변경 (CrewList.tsx 단일 파일)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 크루 수 증가 + 랭킹 섹션으로 사이드바 스크롤이 길어져 UX 저하 |
| **WHO** | 크루 목록을 탐색하는 모든 방문자 |
| **RISK** | 선택된 크루가 다른 페이지에 있을 때 하이라이트만 되고 보이지 않음 |
| **SUCCESS** | 목록 10개씩 분할, 페이지 번호 버튼 동작, 필터/검색 시 1페이지 리셋 |
| **SCOPE** | CrewList.tsx 단일 파일. 백엔드 변경 없음. |

---

## 1. 상태 설계

### 1.1 추가 상태

```typescript
// CrewList.tsx 내부
const [currentPage, setCurrentPage] = useState(1);
const PAGE_SIZE = 10;
```

### 1.2 파생 값

```typescript
const totalPages = Math.ceil(crews.length / PAGE_SIZE);
const pagedCrews = crews.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
);
```

### 1.3 필터/검색 변경 시 리셋

```typescript
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, filterLevel, filterDay]);
```

---

## 2. 페이지 번호 버튼 로직

### 2.1 표시 범위 (윈도우 슬라이딩)

총 페이지가 5 이하면 전부 표시. 5 초과 시 현재 페이지 중심으로 최대 5개 표시.

```typescript
function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const half = 2;
  let start = Math.max(1, current - half);
  let end = Math.min(total, current + half);
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, 5);
    else start = Math.max(1, end - 4);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
```

### 2.2 UI 구조

```
[ ❮ ]  [ 1 ]  [ 2 ]  [3]  [ 4 ]  [ 5 ]  [ ❯ ]
                       ↑ active (강조)
```

- `❮` : `currentPage === 1` 일 때 disabled
- `❯` : `currentPage === totalPages` 일 때 disabled
- `totalPages === 1` 이면 페이지네이션 UI 전체 숨김

---

## 3. UI 레이아웃

```
┌─────────────────────────────┐
│  인기 크루 TOP 5 (랭킹)       │
├─────────────────────────────┤
│  🔍 검색 입력창               │
├─────────────────────────────┤
│  난이도 필터 / 요일 필터        │
├─────────────────────────────┤
│  N개 크루 (전체 기준)          │
├─────────────────────────────┤
│  [크루 카드 1]                │
│  [크루 카드 2]                │
│  ...최대 10개...              │
│  [크루 카드 10]               │
├─────────────────────────────┤
│  ❮  1  [2]  3  4  5  ❯      │  ← 페이지네이션
└─────────────────────────────┘
```

---

## 4. 스타일 설계

### 4.1 페이지네이션 컨테이너

```typescript
pagination: {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 4,
  padding: "10px 0",
  borderTop: "1px solid #f0f0f0",
}
```

### 4.2 페이지 버튼

```typescript
pageBtn: {
  minWidth: 28,
  height: 28,
  border: "1px solid #d1d5db",
  borderRadius: 4,
  background: "#fff",
  color: "#374151",
  fontSize: 12,
  cursor: "pointer",
},
pageBtnActive: {
  background: "#0ea5e9",
  borderColor: "#0ea5e9",
  color: "#fff",
  fontWeight: 700,
},
pageBtnDisabled: {
  color: "#d1d5db",
  cursor: "not-allowed",
  borderColor: "#f0f0f0",
},
```

---

## 5. 결과 수 표시

`crews.length`(필터링된 전체 수) 기준으로 유지 — 현재 페이지 수가 아님.

```tsx
<div style={s.resultCount}>{crews.length}개 크루</div>
```

---

## 6. 테스트 시나리오

| ID | 시나리오 | 기대 결과 |
|----|---------|---------|
| T-01 | 크루 11개 이상일 때 목록 접근 | 첫 10개만 표시, 페이지네이션 노출 |
| T-02 | 다음 페이지 버튼 클릭 | 다음 10개 크루 표시, 현재 페이지 강조 변경 |
| T-03 | 마지막 페이지에서 ❯ 클릭 | disabled 상태, 페이지 변경 없음 |
| T-04 | 난이도 필터 변경 | currentPage → 1 리셋 |
| T-05 | 검색어 입력 | currentPage → 1 리셋 |
| T-06 | 크루 10개 이하일 때 | 페이지네이션 UI 숨김 |
| T-07 | 결과 수 표시 | 전체 crews.length 기준 (현재 페이지 수 아님) |

---

## 11. Implementation Guide

### 11.1 구현 순서

1. `CrewList.tsx` 상단에 `useState`, `useEffect` import 추가
2. `currentPage` 상태 + `PAGE_SIZE` 상수 추가
3. `totalPages`, `pagedCrews` 파생 값 계산
4. `useEffect` 로 필터/검색 변경 감지 → `setCurrentPage(1)`
5. `getPageNumbers` 헬퍼 함수 추가
6. `crews.map(...)` → `pagedCrews.map(...)` 교체
7. 페이지네이션 JSX + 스타일 추가 (목록 아래)

### 11.2 변경 파일 요약

| 파일 | 변경 유형 | 주요 내용 |
|------|---------|---------|
| `frontend/src/components/CrewList.tsx` | 수정 | 페이지네이션 상태·로직·UI 추가 |

### 11.3 Session Guide

**Module Map**:
| 모듈 | 파일 | 예상 소요 |
|------|------|---------|
| module-1: 전체 구현 | `CrewList.tsx` | ~20분 |

**추천**: 단일 세션으로 전체 구현.
`/pdca do crew-list-pagination`
