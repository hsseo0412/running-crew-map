# DB 데이터 모델

## Crew

| 필드 | 타입 | 설명 |
|------|------|------|
| id | int | PK |
| name | str(100) | 크루명 |
| description | str(1000)? | 크루 설명 |
| latitude / longitude | float | 좌표 |
| address | str(300)? | 주소 |
| meeting_day | str(50)? | 모임 요일 |
| meeting_time | str(10)? | 모임 시간 |
| pace | str(20)? | 페이스 |
| level | str(20)? | 난이도 (beginner/intermediate/advanced) |
| contact | str(300)? | 연락처 |
| member_count | int? | 인원수 |
| created_at / updated_at | datetime | 자동 관리 |

**응답 시 추가 집계 필드:**
- `avg_rating: float | None` — 평균 별점
- `review_count: int` — 리뷰 개수

## Review

| 필드 | 타입 | 설명 |
|------|------|------|
| id | int | PK |
| crew_id | int | FK → crews.id (CASCADE) |
| nickname | str(50) | 작성자 닉네임 |
| password_hash | str(255) | bcrypt 해시 (삭제 확인용) |
| rating | int(1~5) | 별점 |
| content | str(500) | 후기 내용 (최소 10자) |
| created_at | datetime | 작성 시각 |

## Route

| 필드 | 타입 | 설명 |
|------|------|------|
| id | int | PK |
| crew_id | int | FK → crews.id (CASCADE, unique) |
| coordinates | JSON | 경유지 배열 `[{lat, lng}, ...]` (2~50개) |
| distance_km | float | 코스 거리 (km) |
| created_at | datetime | 생성 시각 |
