# crew-review Planning Document

> **Summary**: 크루 상세 패널에서 닉네임·별점·텍스트로 후기를 작성하고 조회할 수 있는 기능
>
> **Project**: running-crew-map
> **Version**: 0.1.0
> **Author**: hsseo0412
> **Date**: 2026-04-15
> **Status**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 크루 상세 패널에서 다른 참여자의 경험을 볼 수 없어 크루 선택 결정이 어려움 |
| **Solution** | 닉네임 + 비밀번호 기반의 별점(1~5점) + 텍스트 후기 작성·조회 기능 추가 |
| **UX Effect** | 크루 상세 패널 내에서 실제 참여자 후기를 확인하여 신뢰도 있는 크루 선택 가능 |
| **Core Value** | 로그인 없이 간단히 후기를 남기고, 비밀번호로 본인 후기를 삭제할 수 있는 참여형 콘텐츠 |

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

## 1. Overview

### 1.1 Purpose

크루 상세 패널 하단에 후기 섹션을 추가하여, 방문자가 별점(1~5점)과 텍스트로 후기를 남기고 조회할 수 있게 한다. 로그인 없이 닉네임 + 비밀번호로 작성하며, 비밀번호 일치 시 본인 후기를 삭제할 수 있다.

### 1.2 Background

현재 크루 상세 패널(`CrewDetail.tsx`)은 크루 정보만 표시하고 참여자 피드백 수단이 없다. 거지맵과 같은 지도 기반 커뮤니티 서비스처럼 사용자 참여형 후기 기능을 추가하여 콘텐츠 신뢰도를 높인다.

### 1.3 Related Documents

- 크루 상세 패널: `frontend/src/components/CrewDetail.tsx`
- 크루 API: `backend/app/api/crews.py`
- 크루 모델: `backend/app/models/crew.py`

---

## 2. Scope

### 2.1 In Scope

- 백엔드 `Review` 모델 추가 (crew_id FK, nickname, password_hash, rating, content, created_at)
- `GET /api/crews/{id}/reviews` — 특정 크루 후기 목록 조회
- `POST /api/crews/{id}/reviews` — 후기 작성 (닉네임, 비밀번호, 별점 1~5, 텍스트)
- `DELETE /api/reviews/{review_id}` — 후기 삭제 (비밀번호 확인)
- 프론트 `CrewDetail.tsx` 내 후기 섹션 추가
- 별점 표시 (1~5점, 평균 별점 요약 포함)
- 후기 작성 폼 (닉네임, 비밀번호, 별점 선택, 텍스트)
- 후기 삭제 (비밀번호 입력 확인 모달)

### 2.2 Out of Scope

- 후기 수정 기능
- 로그인/회원 기반 인증
- 후기 신고 기능
- 관리자 페이지
- 비밀번호 찾기

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `Review` 모델: crew_id, nickname, password_hash, rating(1~5), content, created_at | High |
| FR-02 | `GET /api/crews/{id}/reviews` — 최신순 후기 목록 반환 | High |
| FR-03 | `POST /api/crews/{id}/reviews` — 닉네임·비밀번호·별점·텍스트 입력 후 후기 저장 | High |
| FR-04 | 비밀번호는 bcrypt 해시로 저장, 평문 저장 금지 | High |
| FR-05 | `DELETE /api/reviews/{review_id}` — 요청 비밀번호와 해시 일치 시 삭제 | High |
| FR-06 | 크루 상세 패널에 후기 목록 표시 (닉네임, 별점, 내용, 날짜) | High |
| FR-07 | 후기 섹션 상단에 평균 별점 + 후기 수 요약 표시 | Medium |
| FR-08 | 후기 작성 폼: 닉네임, 비밀번호, 별점(클릭 선택), 텍스트 입력 | High |
| FR-09 | 후기 삭제 클릭 시 비밀번호 입력 확인 후 삭제 | High |
| FR-10 | 후기 0건일 때 "아직 후기가 없습니다" 빈 상태 표시 | Low |

### 3.2 Non-Functional Requirements

| 항목 | 기준 |
|------|------|
| 보안 | 비밀번호 평문 저장 금지 (bcrypt) |
| 성능 | 후기 목록 조회 200ms 이내 |
| 호환성 | 기존 크루 상세 패널 레이아웃 유지 |

---

## 4. Success Criteria

- 후기 작성 → 목록에 즉시 반영
- 비밀번호 일치 시 삭제 성공, 불일치 시 오류 메시지
- 크루별 평균 별점이 정확하게 계산되어 표시
- 기존 크루 CRUD 기능 회귀 없음

---

## 5. Risks and Mitigation

| 위험 | 영향 | 가능성 | 완화 방법 |
|------|------|--------|-----------|
| 스팸·악성 후기 | Medium | Medium | 콘텐츠 최소 길이 제한(10자), 향후 신고 기능 추가 검토 |
| 비밀번호 해시 없이 저장 | High | Low | bcrypt 필수 적용, 리뷰 전 코드 확인 |
| 크루 삭제 시 후기 고아 데이터 | Medium | Low | FK cascade delete 설정 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| 리소스 | 타입 | 변경 내용 |
|--------|------|-----------|
| `backend/app/models/review.py` | 신규 | Review SQLAlchemy 모델 |
| `backend/app/schemas/review.py` | 신규 | Pydantic 스키마 |
| `backend/app/api/reviews.py` | 신규 | 후기 CRUD API 라우터 |
| `backend/app/main.py` | 수정 | reviews 라우터 등록 |
| `backend/alembic/versions/` | 신규 | reviews 테이블 마이그레이션 |
| `frontend/src/components/CrewDetail.tsx` | 수정 | 후기 섹션 추가 |
| `frontend/src/types/review.ts` | 신규 | Review 타입 정의 |

### 6.2 Dependency

- `passlib[bcrypt]` 백엔드 패키지 추가 필요

---

## 7. Architecture Considerations

### 7.1 Project Level: Dynamic

### 7.2 Key Architectural Decisions

| 결정 | 선택 | 이유 |
|------|------|------|
| 인증 방식 | 닉네임 + bcrypt 비밀번호 | 로그인 없이 간단히 참여, 최소한의 본인 확인 |
| 후기 API 구조 | `/api/crews/{id}/reviews` 중첩 라우트 | 크루와의 관계 명확, RESTful |
| 삭제 API | `DELETE /api/reviews/{review_id}` + body 비밀번호 | 단순한 구조 |
| 별점 표시 | 프론트에서 ★ 아이콘으로 렌더링 | 별도 라이브러리 불필요 |
| 후기 목록 캐시 | 캐시 제외 | 후기는 실시간 반영이 중요 |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design crew-review`)
2. [ ] `passlib[bcrypt]` 의존성 추가
3. [ ] Review 모델 및 마이그레이션 작성
4. [ ] 후기 API 구현
5. [ ] CrewDetail 후기 섹션 UI 구현

---

## Version History

| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|----------|--------|
| 0.1 | 2026-04-15 | 초안 작성 | hsseo0412 |
