# Frontend — running-crew-map

React + TypeScript + Vite + 카카오맵 API 프론트엔드.

> 상세 참조:
> - `docs/api-endpoints.md` — 전체 API 엔드포인트
> - `frontend/src/types/` — Crew, Review, Route 타입 정의

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | React + TypeScript |
| Build | Vite |
| Map | 카카오맵 API |

## 파일 구조

```
frontend/src/
├── App.tsx                       # 최상위 상태 관리 (selectedCrew, 코스 등록 모드, 필터 등)
├── components/
│   ├── CrewList.tsx              # 크루 목록 + 검색 UI
│   ├── CrewDetail.tsx            # 크루 상세 패널
│   ├── CrewForm.tsx              # 크루 등록/수정 폼
│   ├── CrewRanking.tsx           # 인기 크루 TOP 5
│   ├── ReviewSection.tsx         # 리뷰 목록/작성/삭제 (별점 UI 포함)
│   ├── CourseSection.tsx         # 러닝 코스 표시/저장/삭제
│   └── map/
│       ├── MapContainer.tsx      # 카카오맵 컨테이너
│       └── MapMarker.tsx         # 지도 마커 (크루명 라벨 오버레이)
├── hooks/
│   ├── useDebounce.ts            # 검색 debounce (300ms)
│   ├── useAddressSearch.ts       # 카카오 주소 자동완성
│   └── useKakaoLoader.ts         # 카카오맵 SDK 로더
└── types/
    ├── crew.ts                   # Crew, RankedCrew
    ├── review.ts                 # Review, ReviewCreatePayload, ReviewDeletePayload
    └── route.ts                  # Waypoint, Route
```

## 주요 결정사항

- **InfoWindow 유지** — 크루 상세 패널 추가 후에도 지도 InfoWindow는 변경 없이 유지
- **검색 debounce 300ms** — `useDebounce` 훅으로 API 호출 최소화
- **검색은 서버에서** — 프론트 필터링 없이 `?q=` 파라미터로 백엔드에 위임
- **마커는 라벨 오버레이** — 기본 핀 마커 대신 크루명 텍스트 라벨로 표시

## 실행

```bash
cd frontend
npm run dev
```
