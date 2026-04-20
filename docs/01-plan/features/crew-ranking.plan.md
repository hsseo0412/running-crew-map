# crew-ranking Planning Document

> **Summary**: 평점 기준 인기 크루 TOP 5를 사이드바에 노출하여 크루 탐색 효율을 높이는 기능
>
> **Project**: running-crew-map
> **Version**: 0.1.0
> **Author**: hsseo0412
> **Date**: 2026-04-20
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 크루 목록이 등록 순으로만 나열되어 품질 좋은 크루를 빠르게 발견하기 어려움 |
| **Solution** | 이미 수집된 후기 데이터(평점+후기 수)를 집계하여 인기 크루 TOP 5를 사이드바에 상시 표시 |
| **UX Effect** | 사이드바 진입 시 즉시 인기 크루를 확인하고 클릭 한 번으로 상세 페이지로 이동 가능 |
| **Core Value** | 추가 데이터 수집 없이 기존 후기 데이터를 활용하여 신뢰도 있는 크루 탐색 경험 제공 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 후기 데이터가 쌓였지만 평점 높은 크루를 한눈에 볼 방법이 없어 탐색 효율이 낮음 |
| **WHO** | 어떤 크루에 가입할지 고민 중인 방문자, 검증된 크루를 찾는 러너 |
| **RISK** | 후기가 0개인 신규 크루의 랭킹 제외 → 노출 기회 불균형 |
| **SUCCESS** | TOP 5 랭킹 목록이 사이드바에 표시되고, 클릭 시 크루 상세로 정상 이동 |
| **SCOPE** | 사이드바 내 랭킹 섹션만. 별도 랭킹 페이지 없음. 랭킹 갱신은 실시간(페이지 로드 시). |

---

## 1. Overview

### 1.1 Purpose

기존 후기(Review) 데이터를 집계하여 평점 기준 인기 크루 TOP 5를 사이드바 상단에 항상 표시한다. 방문자가 별도 검색 없이 검증된 크루를 즉시 발견할 수 있도록 한다.

### 1.2 Background

크루 후기 기능이 구현되어 평점·후기 수 데이터가 누적되고 있다. 현재 크루 목록은 등록 순(id 오름차순)으로만 표시되어 품질 좋은 크루가 묻히는 문제가 있다. 별도 데이터 수집 없이 기존 데이터를 활용해 즉시 개선 가능하다.

### 1.3 Related Documents

- 후기 모델: `backend/app/models/review.py`
- 크루 API: `backend/app/api/crews.py`
- 크루 목록 UI: `frontend/src/components/CrewList.tsx`
- 크루 상세: `frontend/src/components/CrewDetail.tsx`

---

## 2. Scope

### 2.1 In Scope

- 백엔드 `GET /api/crews/ranking` 엔드포인트 추가
  - 평균 평점 내림차순 → 후기 수 내림차순으로 상위 5개 반환
  - 후기 0개 크루 제외
- 프론트엔드 `CrewRanking.tsx` 컴포넌트 신규 생성
  - 사이드바 상단(크루 목록 위)에 TOP 5 섹션 표시
  - 순위 배지(1~5) + 크루명 + 평점 + 후기 수 표시
  - 클릭 시 해당 크루 선택 (기존 `onSelectCrew` 재사용)
- `App.tsx` 또는 `CrewList.tsx`에 `CrewRanking` 컴포넌트 통합

### 2.2 Out of Scope

- 별도 랭킹 전용 페이지
- 실시간 소켓 업데이트 (페이지 로드 시 1회 조회)
- 후기 없는 크루 랭킹 보정 알고리즘 (베이지안 평균 등)
- 관리자 랭킹 수동 조정

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | `/api/crews/ranking` 이 평점 내림차순 TOP 5 크루를 반환한다 | Must |
| FR-02 | 후기가 0개인 크루는 랭킹에서 제외된다 | Must |
| FR-03 | 동점(평점 동일)일 경우 후기 수가 많은 크루가 상위에 위치한다 | Must |
| FR-04 | 사이드바에 순위(1~5) + 크루명 + 평점 + 후기 수를 표시한다 | Must |
| FR-05 | 랭킹 크루 클릭 시 해당 크루의 상세 정보가 열린다 | Must |
| FR-06 | 랭킹 데이터가 없을 때(후기 없음) 빈 상태 메시지를 표시한다 | Should |

### 3.2 Non-Functional Requirements

| ID | 요구사항 |
|----|---------|
| NFR-01 | 랭킹 API 응답 시간 200ms 이하 (인덱스 활용) |
| NFR-02 | 랭킹 조회는 기존 Redis 캐시 전략과 독립적으로 운영 (별도 캐시 키 또는 캐시 없음) |

---

## 4. User Stories

| ID | Story |
|----|-------|
| US-01 | 방문자로서, 사이드바에서 인기 크루 TOP 5를 한눈에 보고 싶다 |
| US-02 | 방문자로서, 인기 크루를 클릭하여 상세 정보를 바로 확인하고 싶다 |
| US-03 | 방문자로서, 랭킹 기준(평점 기반)을 직관적으로 이해하고 싶다 |

---

## 5. Technical Considerations

### 5.1 Backend

- `Review` 모델에 `crew_id` FK가 있으므로 GROUP BY + AVG + COUNT 집계 쿼리로 구현
- SQLAlchemy `func.avg`, `func.count` 사용
- 라우터 경로 충돌 주의: `/api/crews/ranking` 을 `/api/crews/{id}` 보다 먼저 등록

### 5.2 Frontend

- `useEffect` + `fetch` 로 컴포넌트 마운트 시 1회 조회
- 기존 `Crew` 타입에 `avg_rating`, `review_count` 필드 추가 또는 별도 `RankedCrew` 타입 정의
- 기존 `onSelectCrew(crew)` 콜백 재사용

---

## 6. Risks

| 위험 | 영향 | 대응 |
|------|------|------|
| 후기 데이터 부족 시 랭킹 비어있음 | UX 저하 | 빈 상태 메시지("아직 후기가 없어요") 표시 |
| `/crews/ranking` 경로가 `/{id}` 에 의해 덮힘 | API 오작동 | 라우터 등록 순서 보장 |
| 크루 수가 5개 미만일 때 | 부분 표시 | 있는 만큼만 표시 (limit 유연 처리) |

---

## 7. Success Criteria

- [ ] `GET /api/crews/ranking` 이 평점 내림차순 TOP 5를 올바르게 반환
- [ ] 사이드바에 랭킹 섹션이 표시되고 순위·평점·후기 수가 정확히 노출
- [ ] 랭킹 크루 클릭 시 크루 상세 패널이 열림
- [ ] 후기 없는 크루가 랭킹에 포함되지 않음
- [ ] 후기 0건 상태에서 빈 상태 메시지 표시
