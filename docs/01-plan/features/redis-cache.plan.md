# redis-cache Planning Document

> **Summary**: docker-compose에 구성된 Redis를 실제 활용하여 크루 목록 API를 캐싱, DB 부하 감소
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
| **Problem** | `GET /api/crews` 호출 시마다 PostgreSQL 풀스캔 발생 — Redis가 이미 셋업되어 있으나 미사용 |
| **Solution** | 전체 목록 결과를 `crews:list` 키로 Redis에 캐싱(TTL 60s), CRUD 시 즉시 무효화 |
| **Function/UX Effect** | 캐시 히트 시 DB 쿼리 생략 → 응답 속도 향상, 반복 조회 부하 감소 |
| **Core Value** | 이미 준비된 인프라(Redis, 패키지, 환경변수)를 2개 파일 수정으로 즉시 활용 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Redis가 docker-compose에 구성되어 있으나 전혀 활용되지 않음 — 기존 인프라 낭비 해소 |
| **WHO** | 목록 페이지를 반복 조회하는 방문자 전체 |
| **RISK** | 캐시-DB 불일치 (CRUD 후 무효화 누락 시) |
| **SUCCESS** | 캐시 히트 시 DB 쿼리 없이 응답, CRUD 후 목록이 즉시 갱신됨 |
| **SCOPE** | 전체 목록(`GET /api/crews`, q 없음)만 캐싱 / 검색 쿼리는 제외 / CRUD 시 무효화 |

---

## 1. Overview

### 1.1 Purpose

`GET /api/crews`(q 없음) 결과를 Redis에 60초간 캐싱하여 반복 호출 시 DB 풀스캔을 생략한다.
크루 생성·수정·삭제 시 캐시를 즉시 무효화하여 데이터 일관성을 보장한다.

### 1.2 Background

docker-compose.yml에 Redis 7, requirements.txt에 `redis==5.1.1`, config.py에 `redis_url`이
이미 구성되어 있으나 실제 사용 코드가 전혀 없는 상태. 가장 빠르게 인프라를 활용할 수 있는 개선.

---

## 2. Scope

### 2.1 In Scope

- [x] `backend/app/core/redis.py` — Redis 클라이언트 싱글턴 생성
- [x] `GET /api/crews` (q 없음) → 캐시 read (hit: 반환, miss: DB 조회 후 write)
- [x] `POST /api/crews` → 캐시 무효화 (`crews:list` 삭제)
- [x] `PUT /api/crews/{id}` → 캐시 무효화
- [x] `DELETE /api/crews/{id}` → 캐시 무효화
- [x] TTL: 60초

### 2.2 Out of Scope

- 검색 쿼리(`?q=`) 캐싱 — 사용자별 다른 결과, LIKE도 충분히 빠름
- 개별 크루 상세(`GET /api/crews/{id}`) 캐싱
- Redis Cluster / Sentinel 고가용성 구성

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Redis 클라이언트를 앱 시작 시 초기화, 연결 실패 시 캐시 없이 정상 동작(Fallback) | High |
| FR-02 | `GET /api/crews`(q 없음): 캐시 히트 → JSON 파싱 후 반환, 미스 → DB 조회 후 캐시 write | High |
| FR-03 | `GET /api/crews?q=...`: 캐시 무시, 항상 DB 직접 조회 | High |
| FR-04 | `POST/PUT/DELETE /api/crews` 성공 시 `crews:list` 캐시 키 삭제 | High |
| FR-05 | TTL 60초 — 만료 후 자동으로 DB 재조회 | Medium |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| 안정성 | Redis 장애 시 캐시 없이 기존 DB 조회로 자동 Fallback (서비스 중단 없음) |
| 일관성 | CRUD 후 즉시 목록 갱신 (stale 데이터 노출 없음) |

---

## 4. Success Criteria

- [ ] `GET /api/crews` 두 번 연속 호출 시 두 번째는 Redis에서 반환 (DB 쿼리 없음)
- [ ] 크루 등록 후 `GET /api/crews` 호출 시 신규 크루 포함된 최신 목록 반환
- [ ] Redis 연결 불가 시에도 API 정상 동작

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CRUD 후 캐시 무효화 누락 → stale 데이터 | High | Low | POST/PUT/DELETE 각각에 `delete(crews:list)` 추가, TTL 60초로 최대 노출 시간 제한 |
| Redis 연결 실패 시 API 중단 | High | Low | try/except로 Redis 오류 무시, DB 직접 조회 Fallback |
| JSON 직렬화 오류 | Medium | Low | Pydantic `.model_dump()` 기반 직렬화 사용 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `backend/app/core/redis.py` | 신규 | Redis 클라이언트 모듈 |
| `backend/app/api/crews.py` | 수정 | list_crews에 캐시 로직, 3개 뮤테이션에 무효화 추가 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `GET /api/crews` | READ | `CrewList.tsx` → fetch | 응답 구조 동일 (list[CrewResponse]), 영향 없음 |
| `POST/PUT/DELETE` | WRITE | `CrewForm.tsx`, `App.tsx` | 응답 구조 동일, 캐시 무효화만 추가 |

---

## 7. Architecture Considerations

### 7.1 Project Level: Dynamic

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Redis 클라이언트 | `redis.Redis` (동기) | FastAPI 기본 동기 라우터와 일치, 별도 async 전환 불필요 |
| 직렬화 | `json.dumps(list[dict])` | Pydantic model_dump 기반, 타입 안전 |
| Fallback | try/except RedisError → DB 조회 | Redis 장애 시 서비스 무중단 |
| 캐시 키 | `crews:list` (단일 키) | 전체 목록만 캐싱하므로 패턴 불필요 |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design redis-cache`)
2. [ ] `redis.py` 클라이언트 모듈 구현
3. [ ] `crews.py` 캐시 로직 추가

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-15 | Initial draft | hsseo0412 |
