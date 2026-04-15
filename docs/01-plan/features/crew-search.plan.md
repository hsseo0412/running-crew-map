# crew-search Planning Document

> **Summary**: 키워드로 크루명·주소를 실시간 검색하여 지도와 목록을 동시에 필터링하는 기능
>
> **Project**: running-crew-map
> **Version**: 0.1.0
> **Author**: hsseo0412
> **Date**: 2026-04-15
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 크루 수가 늘어날수록 목록 스크롤만으로 원하는 크루를 찾기 어려워 사용자 이탈이 발생한다 |
| **Solution** | 목록 패널 상단에 검색 입력창을 추가하고, 백엔드 LIKE 쿼리 + 프론트 debounce로 실시간 검색 제공 |
| **Function/UX Effect** | 타이핑 즉시(300ms debounce) 지도 마커와 목록이 동시 갱신되어 탐색 시간 단축 |
| **Core Value** | 검색·필터(난이도/요일)가 결합된 단일 탐색 UX로 크루 발견 경험 향상 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 크루 수 증가 시 스크롤 탐색의 한계 → 키워드 검색으로 즉시 탐색 가능하게 |
| **WHO** | 특정 지역이나 이름의 크루를 찾으려는 일반 방문자 |
| **RISK** | 검색 API 호출 빈도 과다 (debounce로 완화), 기존 필터와의 AND 조합 로직 |
| **SUCCESS** | 검색어 입력 후 300ms 이내 결과 반영, 기존 필터와 정상 AND 동작 |
| **SCOPE** | Phase 1: 백엔드 쿼리 파라미터 추가 / Phase 2: 프론트 검색 UI + debounce 연동 |

---

## 1. Overview

### 1.1 Purpose

크루명 또는 주소 키워드를 입력하면 실시간으로 목록과 지도 마커를 동시에 필터링하는 검색 기능을 제공한다.

### 1.2 Background

현재 구현된 난이도·요일 필터만으로는 특정 이름이나 지역의 크루를 찾기 어렵다. 크루 수가 수십 개 이상이 되면 스크롤 탐색에 한계가 생기므로, 키워드 검색이 가장 빠른 UX 개선 방법이다.

### 1.3 Related Documents

- 현재 API 스펙: `backend/app/api/crews.py`
- 프론트 필터 컴포넌트: `frontend/src/components/CrewList.tsx`

---

## 2. Scope

### 2.1 In Scope

- [x] 백엔드 `GET /api/crews?q=키워드` 쿼리 파라미터 추가 (크루명 + 주소 LIKE 검색)
- [x] 프론트 검색 입력창 UI (CrewList 패널 상단)
- [x] 실시간 debounce 검색 (300ms)
- [x] 기존 난이도·요일 필터와 AND 조건으로 결합
- [x] 검색 결과 없음 상태 표시
- [x] 검색어 초기화(X 버튼)

### 2.2 Out of Scope

- 전문 검색 엔진(Elasticsearch 등) 도입
- 크루 설명(description) 필드 검색
- 자동완성 드롭다운
- 검색 히스토리 저장

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 백엔드 `GET /api/crews`에 `q` 쿼리 파라미터 추가 — `name ILIKE %q%` OR `address ILIKE %q%` | High | Pending |
| FR-02 | `q`가 없거나 빈 문자열이면 기존 전체 목록 반환 | High | Pending |
| FR-03 | 기존 필터(level, day)와 AND 조건으로 복합 쿼리 지원 | High | Pending |
| FR-04 | 프론트 CrewList 상단에 검색 입력창 컴포넌트 추가 | High | Pending |
| FR-05 | 입력 후 300ms debounce 후 API 재호출 | High | Pending |
| FR-06 | 검색어 초기화(X 버튼) 클릭 시 전체 목록 복귀 | Medium | Pending |
| FR-07 | 검색 결과 0건일 때 "검색 결과가 없습니다" 빈 상태 메시지 표시 | Medium | Pending |
| FR-08 | 검색 결과에 해당하는 마커만 지도에 표시 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | API 응답 200ms 이내 (로컬 환경) | 브라우저 Network 탭 확인 |
| UX | 입력 후 300ms 내 결과 갱신 (debounce) | 수동 확인 |
| 호환성 | 기존 난이도·요일 필터와 동시 사용 가능 | 수동 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] FR-01 ~ FR-08 모두 구현
- [x] 검색 + 난이도 필터 + 요일 필터 동시 동작 확인
- [x] 검색어 입력 → 지도 마커 동시 갱신 확인
- [x] 빈 검색어 → 전체 목록 복귀 확인

### 4.2 Quality Criteria

- [x] 기존 CRUD 기능 회귀 없음
- [x] TypeScript 타입 에러 없음
- [x] 빌드 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 타이핑마다 API 호출로 서버 부하 | Medium | High | 300ms debounce로 호출 빈도 제한 |
| 기존 필터(level/day)와 AND 조합 로직 버그 | High | Medium | CrewList 필터 로직을 백엔드로 통합하여 단일 API 파라미터로 관리 |
| PostgreSQL LIKE 검색 성능 (크루 수 증가 시) | Low | Low | 현재 규모에서는 인덱스 없이 충분, 향후 GIN 인덱스 추가 검토 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `GET /api/crews` | API Endpoint | `q` 쿼리 파라미터 추가 |
| `backend/app/api/crews.py` | API | `list_crews` 함수에 `q` 파라미터 및 LIKE 필터 추가 |
| `frontend/src/components/CrewList.tsx` | Component | 검색 입력창 UI 추가, API 호출에 `q` 파라미터 포함 |
| `frontend/src/App.tsx` | Component | 검색 상태 관리 (또는 CrewList 내부 state로 처리) |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `GET /api/crews` | READ | `CrewList.tsx` → fetch `/api/crews` | 파라미터 추가로 기존 호출에 영향 없음 (기본값: 빈 문자열) |
| `Crew` 모델 | READ | `crews.py → list_crews` | WHERE 절 조건 추가 (기존 결과 변화 없음, q 없을 시) |

### 6.3 Verification

- [x] 검색어 없을 때 기존 전체 목록과 동일한 결과 반환
- [x] 기존 CRUD 엔드포인트 영향 없음

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ☐ |
| **Dynamic** | ✅ |
| Enterprise | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 검색 위치 | 백엔드 LIKE 쿼리 | 향후 크루 수 증가 시 프론트 필터링보다 확장 용이 |
| 상태 관리 | CrewList 내부 `useState` | 검색어는 목록 컴포넌트 로컬 상태로 충분 |
| debounce | 커스텀 훅 (`useDebounce`) | 재사용 가능한 단순 훅으로 분리 |
| API 호출 | 기존 fetch 방식 유지 | 추가 라이브러리 불필요 |

### 7.3 구현 구조

```
변경 파일:
├── backend/app/api/crews.py          # q 파라미터 + ILIKE 쿼리
├── frontend/src/
│   ├── components/CrewList.tsx       # 검색 입력창 UI + debounce 적용
│   └── hooks/useDebounce.ts          # 신규: debounce 훅 (재사용)
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] TypeScript 사용 (`tsconfig.json` 존재)
- [x] React 함수형 컴포넌트 + 훅 패턴

### 8.2 Environment Variables Needed

추가 환경변수 없음 (기존 API URL 사용)

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design crew-search`)
2. [ ] `useDebounce` 훅 구현
3. [ ] 백엔드 ILIKE 쿼리 추가
4. [ ] CrewList 검색 UI 구현

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-15 | Initial draft | hsseo0412 |
