# running-crew-map

러닝 크루를 지도에서 탐색·등록·관리할 수 있는 웹 애플리케이션.

## 프로젝트 구조

```
running-crew-map/
├── backend/          # FastAPI + PostgreSQL + Redis
│   └── app/
│       ├── api/crews.py          # 크루 CRUD + 검색 엔드포인트
│       ├── core/
│       │   ├── config.py         # 환경변수 설정
│       │   ├── database.py       # SQLAlchemy DB 연결
│       │   └── redis.py          # Redis 클라이언트 싱글턴 (Fallback 포함)
│       ├── models/crew.py        # Crew SQLAlchemy 모델
│       └── schemas/crew.py       # Pydantic 스키마
├── frontend/         # React + TypeScript + Vite + 카카오맵 API
│   └── src/
│       ├── App.tsx               # 최상위 상태 관리 (selectedCrew 등)
│       ├── components/
│       │   ├── CrewList.tsx      # 크루 목록 + 검색 UI
│       │   ├── CrewDetail.tsx    # 크루 상세 패널
│       │   ├── CrewForm.tsx      # 크루 등록/수정 폼
│       │   └── map/
│       │       ├── MapContainer.tsx  # 카카오맵 컨테이너
│       │       └── MapMarker.tsx     # 지도 마커
│       ├── hooks/
│       │   ├── useDebounce.ts        # 검색 debounce (300ms)
│       │   ├── useAddressSearch.ts   # 카카오 주소 자동완성
│       │   └── useKakaoLoader.ts     # 카카오맵 SDK 로더
│       └── types/crew.ts             # Crew 타입 정의
├── docs/
│   ├── 01-plan/features/        # 피처별 플랜 문서
│   └── 02-design/features/      # 피처별 디자인 문서
└── docker-compose.yml           # PostgreSQL + Redis
```

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | FastAPI 0.115, SQLAlchemy 2.0, Alembic, Pydantic 2.9 |
| DB | PostgreSQL (docker-compose) |
| Cache | Redis 7 (docker-compose) — `crews:list` 키, TTL 60s |
| Frontend | React + TypeScript, Vite |
| Map | 카카오맵 API |

## 데이터 모델

### Crew
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
| level | str(20)? | 난이도 |
| contact | str(300)? | 연락처 |
| member_count | int? | 인원수 |

## API

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/crews | 크루 목록 (q 없으면 Redis 캐시 사용) |
| GET | /api/crews?q= | 키워드 검색 (name/address ILIKE, 캐시 제외) |
| GET | /api/crews/{id} | 크루 상세 |
| POST | /api/crews | 크루 등록 (캐시 무효화) |
| PUT | /api/crews/{id} | 크루 수정 (캐시 무효화) |
| DELETE | /api/crews/{id} | 크루 삭제 (캐시 무효화) |
| GET | /health | 헬스체크 |

## 구현 완료 기능

- [o] 크루 CRUD (등록/수정/삭제)
- [o] 카카오맵 마커 표시
- [o] 마커 클릭 시 InfoWindow
- [o] 크루 상세 패널 (사이드바 전환)
- [o] 키워드 검색 (이름/주소, debounce 300ms)
- [o] 주소 검색 자동완성 (카카오 API)
- [o] Redis 캐싱 (전체 목록, TTL 60s, Fallback 포함)
- [o] 난이도/요일 필터
- [o] 크루 후기 (별점 + 텍스트, 목록·InfoWindow 평점 표시)

## 개발 환경 실행

```bash
# 인프라 (DB + Redis)
docker-compose up -d

# 백엔드
cd backend
uvicorn app.main:app --reload

# 프론트엔드
cd frontend
npm run dev
```

## Git 작업 규칙

모든 작업은 feature 브랜치에서 진행 후 main에 squash merge한다.

```bash
# 1. 작업 시작
git checkout -b feat/기능명   # 또는 fix/, refactor/

# 2. 작업 + 커밋

# 3. main에 병합
git checkout main
git merge --squash feat/기능명
git commit -m "feat: ..."
git push origin main

# 4. 브랜치 정리
git branch -d feat/기능명
```

**브랜치 네이밍**
- `feat/` — 새 기능
- `fix/` — 버그 수정
- `refactor/` — 리팩터링

**주의**: main 브랜치에 직접 커밋하지 않는다.

## 주요 결정 사항

- **검색은 백엔드 ILIKE** — 프론트 필터링 대신 서버 쿼리로 처리 (확장성)
- **Redis Fallback** — Redis 장애 시 서비스 중단 없이 DB 직접 조회
- **검색 쿼리는 캐시 제외** — `?q=` 파라미터 있을 때는 항상 DB 직접 조회
- **InfoWindow 유지** — 크루 상세 패널 추가 후에도 InfoWindow는 변경 없음
- **CORS** — `http://localhost:5173` (Vite 개발 서버)만 허용
