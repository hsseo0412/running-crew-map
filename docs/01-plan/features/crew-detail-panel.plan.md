# Plan: 크루 상세 패널

- feature: crew-detail-panel
- created: 2026-04-15
- status: plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 마커 클릭 시 220px InfoWindow만 제공되어 크루 전체 정보를 한눈에 볼 수 없음 |
| **Solution** | 크루 선택 시 좌측 사이드바가 상세 뷰로 전환되어 전체 정보를 표시 |
| **UX Effect** | 목록 → 상세 → 목록 복귀의 자연스러운 네비게이션 흐름 제공 |
| **Core Value** | 정보 밀도를 높여 크루 선택 결정에 필요한 모든 정보를 단일 화면에서 제공 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | InfoWindow의 정보 밀도 한계 — 사용자가 크루를 선택하려면 전체 정보가 필요 |
| **WHO** | 러닝 크루를 탐색하는 사용자 (크루 가입 전 정보 확인 단계) |
| **RISK** | 기존 목록/등록 탭 구조를 깨지 않으면서 상세 뷰 추가 |
| **SUCCESS** | 크루 클릭 시 전체 정보(설명, 요일, 시간, 페이스, 난이도, 인원, 연락처) 표시 |
| **SCOPE** | 데스크톱 전용. 모바일 대응 추후. InfoWindow 변경 없음 |

---

## 1. 요구사항

### 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 크루 목록에서 크루 클릭 시 사이드 패널이 상세 뷰로 전환 | Must |
| FR-02 | 지도 마커 클릭 시 사이드 패널도 해당 크루 상세 뷰로 전환 | Must |
| FR-03 | 상세 뷰에서 뒤로가기(← 목록) 버튼으로 목록 복귀 | Must |
| FR-04 | 상세 뷰에 크루 전체 정보 표시 (설명, 요일, 시간, 페이스, 난이도, 인원, 연락처) | Must |
| FR-05 | 상세 뷰에서 수정/삭제 버튼 접근 가능 | Must |
| FR-06 | InfoWindow(말풍선) 현행 유지 (변경 없음) | Must |

### 비기능 요구사항

| ID | 요구사항 |
|----|----------|
| NFR-01 | 데스크톱 전용 (모바일 대응 추후) |
| NFR-02 | 기존 목록/등록 탭 구조 유지 |
| NFR-03 | 상세 뷰 진입 시 지도가 해당 크루로 자동 이동 |

---

## 2. 범위

### In Scope
- 좌측 사이드바에 `CrewDetail` 컴포넌트 추가
- App.tsx에 `selectedCrew` 상태 추가 및 상세/목록 뷰 전환 로직
- 마커 클릭 시 사이드 패널 연동 (MapMarker → App 콜백)
- 상세 뷰에서 수정/삭제 버튼

### Out of Scope
- 모바일 반응형 (추후 구현)
- InfoWindow 변경
- 백엔드 API 변경 (기존 Crew 타입으로 충분)
- 별도 크루 상세 API 엔드포인트

---

## 3. 설계 방향

### 현재 구조
```
App.tsx
├── sidebar
│   ├── tab: "list"  → CrewList
│   └── tab: "form"  → CrewForm
└── map
    └── MapMarker (마커 클릭 → InfoWindow만)
```

### 변경 후 구조
```
App.tsx
├── sidebar
│   ├── tab: "list"  → selectedCrew ? CrewDetail : CrewList
│   └── tab: "form"  → CrewForm
└── map
    └── MapMarker (마커 클릭 → InfoWindow + selectedCrew 세팅)
```

### 상태 변경
- `selectedCrewId: number | null` → `selectedCrew: Crew | null` 로 교체
  - 기존 `selectedCrewId`는 마커 말풍선 제어용이었으므로 `selectedCrew?.id`로 대체

---

## 4. 성공 기준

| 기준 | 측정 방법 |
|------|----------|
| 목록에서 크루 클릭 시 상세 패널 표시 | 수동 테스트 |
| 마커 클릭 시 상세 패널 + 말풍선 동시 표시 | 수동 테스트 |
| 상세 패널에서 뒤로가기 → 목록 복귀 | 수동 테스트 |
| 상세 패널에서 수정 클릭 → 수정 폼 이동 | 수동 테스트 |
| 상세 패널에서 삭제 클릭 → 삭제 후 목록 복귀 | 수동 테스트 |

---

## 5. 구현 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `frontend/src/components/CrewDetail.tsx` | 신규 생성 | 크루 상세 정보 표시 컴포넌트 |
| `frontend/src/App.tsx` | 수정 | `selectedCrew` 상태 추가, 뷰 전환 로직 |
| `frontend/src/components/map/MapMarker.tsx` | 수정 | 마커 클릭 시 `onSelect` 콜백 추가 |
| `frontend/src/components/CrewList.tsx` | 수정 | 크루 클릭 시 `onSelectCrew` 콜백 호출 |

---

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| `selectedCrewId` → `selectedCrew` 교체 시 기존 마커 말풍선 로직 영향 | MapMarker의 `isSelected` prop은 `selectedCrew?.id === crew.id`로 유지 |
| 마커 클릭 콜백이 현재 MapMarker에 없음 | `onSelect?: (crew: Crew) => void` prop 추가 |
