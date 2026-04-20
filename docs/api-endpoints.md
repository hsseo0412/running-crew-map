# API 엔드포인트

백엔드 베이스 URL: `http://localhost:8000`

## 크루

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/crews | 크루 목록 (q 없으면 Redis 캐시 사용) |
| GET | /api/crews?q= | 키워드 검색 (name/address ILIKE, 캐시 제외) |
| GET | /api/crews/{id} | 크루 상세 |
| POST | /api/crews | 크루 등록 (캐시 무효화) |
| PUT | /api/crews/{id} | 크루 수정 (캐시 무효화) |
| DELETE | /api/crews/{id} | 크루 삭제 (캐시 무효화) |
| GET | /api/crews/ranking?limit=N | 인기 크루 TOP N (avg_rating 기준) |
| GET | /health | 헬스체크 |

## 리뷰

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/crews/{crew_id}/reviews | 크루별 리뷰 목록 (최신순) |
| POST | /api/crews/{crew_id}/reviews | 리뷰 등록 |
| DELETE | /api/reviews/{review_id} | 리뷰 삭제 (비밀번호 확인) |

## 러닝 코스

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/crews/{crew_id}/route | 코스 조회 |
| POST | /api/crews/{crew_id}/route | 코스 저장/수정 (upsert) |
| DELETE | /api/crews/{crew_id}/route | 코스 삭제 |
