# Plan: marker-label

> 지도 마커를 크루명 라벨 오버레이로 교체

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 지도에서 좌측 목록 패널 없이 볼 때 기본 핀 마커만 표시되어 어떤 크루인지 클릭 전까지 알 수 없음 |
| **Solution** | `kakao.maps.CustomOverlay`로 마커 교체 → 크루명 라벨 항상 표시, 선택 시 색상 반전으로 강조 |
| **UX Effect** | 지도 탐색 시 클릭 없이도 모든 크루 위치를 한눈에 파악 가능 |
| **Core Value** | 지도 중심 탐색 경험 강화 — 목록 패널 없이도 지도만으로 크루 파악 가능 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 기본 핀 마커는 어떤 크루인지 알 수 없어 지도 단독 사용 시 탐색 불가 |
| **WHO** | 지도를 주로 사용하는 사용자 (목록 패널 닫고 지도만 보는 경우) |
| **RISK** | 크루가 많을 때 라벨 겹침 문제 (현재 규모에서는 무시 가능) |
| **SUCCESS** | 마커 클릭 없이 크루명 확인 가능, 선택 크루가 시각적으로 구분됨 |
| **SCOPE** | `MapMarker.tsx` 수정만, 백엔드/API/DB 변경 없음 |

---

## 1. 배경 및 문제 정의

### 현재 상태
- `MapMarker.tsx`: `kakao.maps.Marker` (기본 핀) 사용
- 마커 클릭 → InfoWindow 열림 → 크루 정보 표시
- 클릭 전에는 핀만 표시 → 어떤 크루인지 알 수 없음

### 문제
지도를 전체 화면으로 보거나 목록 패널 없이 탐색할 때, 기본 핀만으로는 각 마커가 어떤 크루인지 전혀 알 수 없다.

---

## 2. 요구사항

### 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `kakao.maps.CustomOverlay`로 기본 Marker 교체 | 필수 |
| FR-02 | 크루명을 라벨로 항상 표시 (클릭 전에도 보임) | 필수 |
| FR-03 | 선택된 크루 라벨은 색상 반전 (짙은 배경 + 흰 글씨) | 필수 |
| FR-04 | 클릭 시 기존 InfoWindow 동작 그대로 유지 | 필수 |
| FR-05 | `isSelected` prop 변경 시 라벨 스타일 즉시 반영 | 필수 |

### 비기능 요구사항

| ID | 요구사항 |
|----|----------|
| NFR-01 | 라벨 디자인은 심플하게 — 크루명만, 색상 구분(난이도) 없음 |
| NFR-02 | 기존 `MapMarker` props 인터페이스 유지 (하위 호환) |
| NFR-03 | 백엔드/API/DB 변경 없음 |

---

## 3. 범위 (Scope)

### In Scope
- `frontend/src/components/map/MapMarker.tsx` 수정
- CustomOverlay HTML/CSS 스타일링

### Out of Scope
- 백엔드 변경
- 클러스터링 (마커 밀집 처리)
- 난이도별 색상 구분
- 평점/아이콘 표시

---

## 4. 기술 결정

### Marker → CustomOverlay 교체 이유
- `kakao.maps.Marker`는 이미지 기반 → 텍스트 라벨 표시 불가
- `kakao.maps.CustomOverlay`는 HTML DOM 삽입 → 크루명 텍스트 + 스타일 자유롭게 적용 가능
- InfoWindow는 CustomOverlay와 독립적으로 동작 가능 (기존 로직 유지)

### 선택/비선택 상태 처리
- `isSelected` prop이 변경될 때마다 CustomOverlay의 content HTML을 업데이트
- React useEffect로 `isSelected` 의존성 추가하여 스타일 전환

### 라벨 UI 스펙
```
기본 상태:
┌────────────────────┐
│  한강러닝크루       │  흰 배경, 짙은 글씨, 둥근 모서리, 그림자
└────────────────────┘
         ▼ (삼각형 꼬리)

선택 상태:
┌────────────────────┐
│  한강러닝크루       │  짙은 배경(#111), 흰 글씨
└────────────────────┘
         ▼
```

---

## 5. 구현 계획

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `frontend/src/components/map/MapMarker.tsx` | `kakao.maps.Marker` → `kakao.maps.CustomOverlay` 교체, 라벨 HTML 생성 함수 추가 |

### 구현 순서
1. `buildLabelContent(name, isSelected)` 함수 추가 — 라벨 HTML 문자열 반환
2. `kakao.maps.Marker` 생성 코드를 `kakao.maps.CustomOverlay`로 교체
3. CustomOverlay에 클릭 이벤트 연결 (기존 InfoWindow + onSelect 로직 유지)
4. `isSelected` 변경 useEffect에서 `overlay.setContent()` 호출하여 스타일 전환
5. cleanup: `overlay.setMap(null)` 처리

### 예상 변경 규모
- 수정 파일: 1개 (`MapMarker.tsx`)
- 변경 라인: ~50줄 (기존 130줄 내외에서 수정)

---

## 6. 성공 기준

| 기준 | 검증 방법 |
|------|-----------|
| 지도 로드 시 모든 마커 위치에 크루명 라벨 표시 | 브라우저 화면 확인 |
| 라벨 클릭 시 InfoWindow 열림 | 클릭 테스트 |
| 목록에서 크루 선택 시 해당 라벨 색상 반전 | 목록 클릭 테스트 |
| 다른 크루 선택 시 이전 라벨 원래 스타일 복원 | 연속 선택 테스트 |
| 기존 `MapMarker` props 인터페이스 변경 없음 | 타입 체크 |

---

## 7. 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| 크루 수가 많을 때 라벨 겹침 | 낮음 (현재 소규모) | 향후 클러스터링으로 해결 |
| CustomOverlay 클릭 이벤트 버블링 이슈 | 중간 | `e.stopPropagation()` 처리 |
| isSelected 업데이트 시 깜박임 | 낮음 | setContent로 부드럽게 전환 |
