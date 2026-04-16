# crew-course Planning Document

> **Summary**: 크루별 대표 러닝 코스를 지도에 Polyline으로 표시하고, 상세 패널에서 등록·조회할 수 있는 기능
>
> **Project**: running-crew-map
> **Version**: 0.1.0
> **Author**: hsseo0412
> **Date**: 2026-04-16
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 크루가 어디서 모이는지는 알 수 있지만 실제로 어디를 뛰는지 알 수 없어 크루 선택에 정보가 부족함 |
| **Solution** | 크루마다 대표 러닝 코스를 지도 클릭으로 등록하고, 상세 패널에서 "코스 보기" 버튼으로 지도에 Polyline 표시 |
| **UX Effect** | 크루 선택 전 실제 코스 경로·거리를 시각적으로 확인할 수 있어 가입 결정 신뢰도 향상 |
| **Core Value** | 러닝 앱의 핵심인 "어디를 뛰는가"를 지도에서 직접 보여주는 차별화 기능 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 코스 정보 없이는 페이스·난이도만으로 크루를 판단해야 하므로 정보 비대칭 발생 |
| **WHO** | 특정 코스를 뛰고 싶은 방문자, 코스를 공유하고 싶은 크루 관리자 |
| **RISK** | 경유지 좌표 저장 용량 / 지도 클릭 UX 복잡도 / 코스 없는 크루 UI 처리 |
| **SUCCESS** | 코스 등록 → 지도에 Polyline 표시, 거리 자동 계산, 코스 삭제 정상 동작 |
| **SCOPE** | 크루당 코스 1개. 코스 수정은 삭제 후 재등록. 인증 없이 누구나 등록 가능. |

---

## 1. Overview

### 1.1 Purpose

크루 상세 패널에서 대표 러닝 코스를 등록하고, "코스 보기" 버튼 클릭 시 카카오맵에 Polyline으로 경로를 표시한다. 경유지는 지도 클릭으로 찍으며, 경유지 간 거리를 자동 계산해 총 거리를 표시한다.

### 1.2 Background

현재 크루 정보는 집결지(마커)만 지도에 표시된다. 러닝 크루의 핵심 정보인 실제 코스를 시각화하면 지도 앱으로서의 가치가 크게 높아진다.

### 1.3 Related Documents

- 크루 상세 패널: `frontend/src/components/CrewDetail.tsx`
- 지도 컨테이너: `frontend/src/components/map/MapContainer.tsx`
- 크루 API: `backend/app/api/crews.py`
- 크루 모델: `backend/app/models/crew.py`

---

## 2. Scope

### 2.1 In Scope

- 백엔드 `Route` 모델 추가 (crew_id FK, coordinates JSON, distance_km, name)
- `GET /api/crews/{id}/route` — 크루 코스 조회
- `POST /api/crews/{id}/route` — 코스 등록 (경유지 좌표 배열)
- `DELETE /api/crews/{id}/route` — 코스 삭제
- 크루 상세 패널에 "코스 보기 / 코스 숨기기" 토글 버튼
- 버튼 클릭 시 카카오맵에 Polyline 표시 및 해제
- 코스 등록 UI: 지도 클릭으로 경유지 추가, 총 거리 실시간 표시
- 경유지 간 Haversine 공식으로 총 거리(km) 자동 계산
- 코스 없을 때 "코스 보기" 버튼 → "코스 등록" 버튼으로 전환

### 2.2 Out of Scope

- 코스 수정 (삭제 후 재등록으로 대체)
- 여러 코스 등록
- 코스 공유/내보내기
- 고도 정보
- 코스 등록 인증 (현재 크루 수정과 동일하게 제한 없음)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `Route` 모델: crew_id(FK, unique), coordinates(JSON), distance_km, created_at | High |
| FR-02 | `GET /api/crews/{id}/route` — 코스 정보 반환 (없으면 404) | High |
| FR-03 | `POST /api/crews/{id}/route` — 경유지 배열 받아 코스 저장. 기존 코스 있으면 덮어쓰기 | High |
| FR-04 | `DELETE /api/crews/{id}/route` — 코스 삭제 | High |
| FR-05 | 크루 상세 패널에 "코스 보기" 버튼 표시 | High |
| FR-06 | 코스 보기 클릭 시 카카오맵에 파란색 Polyline으로 경로 표시 | High |
| FR-07 | 코스 숨기기 클릭 시 Polyline 제거 | High |
| FR-08 | 코스 없는 크루: "코스 등록" 버튼 표시 | High |
| FR-09 | 코스 등록 모드: 지도 클릭 시 경유지 마커 추가 + Polyline 미리보기 | High |
| FR-10 | 코스 등록 모드: 경유지 간 거리 합산하여 총 거리(km) 실시간 표시 | Medium |
| FR-11 | 코스 등록 완료 버튼 클릭 시 API 저장 후 등록 모드 종료 | High |
| FR-12 | 코스 등록 취소 버튼 클릭 시 미리보기 Polyline·마커 제거 | High |
| FR-13 | 기존 코스 있는 크루: "코스 보기" + "코스 삭제" 버튼 표시 | Medium |
| FR-14 | 크루 상세 패널에 코스 총 거리(km) 텍스트 표시 | Medium |

### 3.2 Non-Functional Requirements

| 항목 | 기준 |
|------|------|
| 성능 | 코스 조회 200ms 이내 |
| 저장 | 경유지 좌표 배열 JSON으로 저장 (PostgreSQL JSON 컬럼) |
| 호환성 | 기존 크루 마커·InfoWindow 표시에 영향 없음 |

---

## 4. Success Criteria

- 지도 클릭으로 경유지를 찍으면 Polyline이 실시간 미리보기로 그려짐
- 코스 등록 후 "코스 보기" 클릭 시 저장된 경로가 지도에 표시됨
- 총 거리가 정확하게 계산되어 상세 패널에 표시됨
- 코스 삭제 후 Polyline이 지도에서 제거됨
- 기존 크루 마커·InfoWindow·후기 기능 회귀 없음

---

## 5. Risks and Mitigation

| 위험 | 영향 | 가능성 | 완화 방법 |
|------|------|--------|-----------|
| 경유지 1개 이하 저장 | Medium | Medium | 최소 2개 이상 경유지 필수 검증 |
| 지도 클릭 모드와 기존 마커 클릭 충돌 | High | Medium | 등록 모드 진입 시 마커 클릭 이벤트 비활성화 |
| Polyline이 크루 삭제 후 남는 문제 | Medium | Low | Route FK cascade delete 설정 |
| 좌표 배열 용량 과다 | Low | Low | 경유지 최대 50개 제한 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| 리소스 | 타입 | 변경 내용 |
|--------|------|-----------|
| `backend/app/models/route.py` | 신규 | Route SQLAlchemy 모델 |
| `backend/app/schemas/route.py` | 신규 | Pydantic 스키마 |
| `backend/app/api/routes.py` | 신규 | 코스 CRUD API 라우터 |
| `backend/app/main.py` | 수정 | routes 라우터 등록 |
| `backend/alembic/versions/` | 신규 | routes 테이블 마이그레이션 |
| `frontend/src/types/route.ts` | 신규 | Route 타입 정의 |
| `frontend/src/components/CrewDetail.tsx` | 수정 | 코스 보기/등록 버튼 추가 |
| `frontend/src/components/CourseEditor.tsx` | 신규 | 코스 등록 UI 컴포넌트 |
| `frontend/src/components/map/MapContainer.tsx` | 수정 | Polyline 표시, 지도 클릭 이벤트 처리 |

### 6.2 Dependency

- 추가 패키지 없음 (카카오맵 Polyline API 기본 내장)

---

## 7. Architecture Considerations

### 7.1 Project Level: Dynamic

### 7.2 Key Architectural Decisions

| 결정 | 선택 | 이유 |
|------|------|------|
| 좌표 저장 방식 | JSON 배열 `[{lat, lng}, ...]` | PostGIS 불필요, 단순 구조로 충분 |
| 코스 API 구조 | `/api/crews/{id}/route` (단수) | 크루당 1개이므로 컬렉션 불필요 |
| 거리 계산 위치 | 프론트엔드 (Haversine) | 실시간 미리보기 필요, 서버 왕복 불필요 |
| Polyline 제어 | MapContainer props로 course 전달 | 기존 지도 컴포넌트 구조 유지 |
| 코스 등록 모드 | App.tsx에서 mode 상태 관리 | 지도 클릭 이벤트와 마커 클릭 이벤트 분리 |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design crew-course`)
2. [ ] Route 모델 및 마이그레이션 작성
3. [ ] 코스 API 구현
4. [ ] MapContainer Polyline 및 클릭 이벤트 구현
5. [ ] CrewDetail 코스 보기/등록 UI 구현
6. [ ] CourseEditor 컴포넌트 구현

---

## Version History

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|----------|--------|
| 0.1 | 2026-04-16 | 초안 작성 | hsseo0412 |
