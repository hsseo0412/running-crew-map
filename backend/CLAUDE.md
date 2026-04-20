# Backend — running-crew-map

FastAPI + PostgreSQL + Redis 백엔드.

> 상세 참조:
> - `docs/api-endpoints.md` — 전체 API 엔드포인트
> - `docs/data-models.md` — DB 테이블 스키마

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 + Alembic |
| Validation | Pydantic 2.9 |
| DB | PostgreSQL (docker-compose) |
| Cache | Redis 7 — `crews:list` 키, TTL 60s |
| 보안 | passlib + bcrypt (리뷰 비밀번호 해싱) |

## 파일 구조

```
backend/app/
├── api/
│   ├── crews.py        # 크루 CRUD + 검색 + 랭킹 엔드포인트
│   ├── reviews.py      # 리뷰 CRUD 엔드포인트
│   └── routes_api.py   # 러닝 코스 CRUD 엔드포인트
├── core/
│   ├── config.py       # 환경변수 설정
│   ├── database.py     # SQLAlchemy DB 연결
│   └── redis.py        # Redis 클라이언트 싱글턴 (Fallback 포함)
├── models/
│   ├── crew.py         # Crew 모델
│   ├── review.py       # Review 모델
│   └── route.py        # Route 모델
└── schemas/
    ├── crew.py         # CrewBase, CrewCreate, CrewUpdate, CrewResponse, RankedCrewResponse
    ├── review.py       # ReviewCreate, ReviewDelete, ReviewResponse
    └── route.py        # Waypoint, RouteCreate, RouteResponse
```

## 주요 결정사항

- **검색은 백엔드 ILIKE** — 프론트 필터링 대신 서버 쿼리로 처리 (확장성)
- **Redis Fallback** — Redis 장애 시 서비스 중단 없이 DB 직접 조회
- **검색 쿼리는 캐시 제외** — `?q=` 파라미터 있을 때는 항상 DB 직접 조회
- **CORS** — `http://localhost:5173` (Vite 개발 서버)만 허용
- **리뷰 비밀번호** — 평문 저장 없이 bcrypt 해싱, 삭제 시 verify 검증
- **코스는 upsert** — 크루당 코스 1개, POST로 생성/수정 모두 처리

## 실행

```bash
cd backend
uvicorn app.main:app --reload
```
