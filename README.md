# 러닝 크루 맵 🏃

전국 러닝 크루의 위치와 정보를 지도 위에서 한눈에 확인하고, 크루를 등록·수정·삭제할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **지도 기반 크루 탐색** — 카카오 지도 위에 크루 마커 표시, 클릭 시 상세 말풍선
- **크루 CRUD** — 등록 / 수정 / 삭제
- **위치 선택** — 지도 클릭으로 위도·경도 자동 입력
- **필터링** — 난이도(초급/중급/고급) · 요일 필터로 목록과 마커 동시 필터링
- **목록 연동** — 좌측 목록 클릭 시 지도 이동 + 말풍선 자동 오픈

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite |
| Backend | FastAPI, SQLAlchemy 2, Alembic |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| 지도 | 카카오 지도 JavaScript API |
| 인프라 | Docker, Docker Compose |

## 프로젝트 구조

```
running-crew-map/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── api/crews.py        # CRUD 엔드포인트
│   │   ├── core/
│   │   │   ├── config.py       # 환경변수 설정
│   │   │   └── database.py     # DB 연결
│   │   ├── models/crew.py      # SQLAlchemy 모델
│   │   └── schemas/crew.py     # Pydantic 스키마
│   ├── alembic/                # DB 마이그레이션
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── CrewList.tsx     # 크루 목록 + 필터
        │   ├── CrewForm.tsx     # 등록/수정 폼
        │   └── map/
        │       ├── MapContainer.tsx
        │       └── MapMarker.tsx
        ├── hooks/
        │   └── useKakaoLoader.ts
        └── types/
            ├── crew.ts
            └── kakao.maps.d.ts
```

## 시작하기

### 사전 요구사항

- Docker & Docker Compose
- 카카오 개발자 계정 및 JavaScript 앱 키 ([developers.kakao.com](https://developers.kakao.com))

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/running-crew-map.git
cd running-crew-map
```

### 2. 환경변수 설정

```bash
# frontend/.env 파일 생성
echo "VITE_KAKAO_MAP_KEY=발급받은_JavaScript_키" > frontend/.env
```

카카오 개발자 콘솔 → 내 애플리케이션 → **앱 키 → JavaScript 키** 복사

> **플랫폼 등록 필수**: 카카오 개발자 콘솔 → 앱 설정 → 플랫폼 → Web에 `http://localhost:5173` 추가

### 3. 컨테이너 실행

```bash
docker-compose up -d
```

### 4. DB 마이그레이션

```bash
docker-compose exec backend alembic upgrade head
```

### 5. 접속

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:8000 |
| API 문서 (Swagger) | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

pgAdmin 초기 계정: `admin@admin.com` / `admin`

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/crews` | 크루 목록 조회 |
| `GET` | `/api/crews/{id}` | 크루 상세 조회 |
| `POST` | `/api/crews` | 크루 등록 |
| `PUT` | `/api/crews/{id}` | 크루 수정 |
| `DELETE` | `/api/crews/{id}` | 크루 삭제 |
| `GET` | `/health` | 헬스 체크 |

## 크루 데이터 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | string | 크루명 (필수) |
| `description` | string | 크루 설명 |
| `latitude` | float | 위도 |
| `longitude` | float | 경도 |
| `address` | string | 주소 텍스트 |
| `meeting_day` | string | 정기 러닝 요일 (예: `월,수,금`) |
| `meeting_time` | string | 출발 시간 (예: `07:00`) |
| `pace` | string | 평균 페이스 (예: `5'30"/km`) |
| `level` | string | 난이도 (`beginner` / `intermediate` / `advanced`) |
| `contact` | string | 연락처 또는 오픈채팅 링크 |
| `member_count` | integer | 크루 인원 |
