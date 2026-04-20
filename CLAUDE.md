# running-crew-map

러닝 크루를 지도에서 탐색·등록·관리할 수 있는 웹 애플리케이션.

> 영역별 상세 내용은 아래 파일을 참고:
> - `backend/CLAUDE.md` — 기술 스택, 파일 구조, 결정사항
> - `frontend/CLAUDE.md` — 기술 스택, 컴포넌트 구조, 결정사항
> - `docs/api-endpoints.md` — 전체 API 엔드포인트
> - `docs/data-models.md` — DB 테이블 스키마
> - `docs/implemented-features.md` — 구현 완료 기능 목록

## 프로젝트 구조

```
running-crew-map/
├── backend/          # FastAPI + PostgreSQL + Redis
├── frontend/         # React + TypeScript + Vite + 카카오맵 API
├── docs/
│   ├── 01-plan/features/        # 피처별 플랜 문서
│   ├── 02-design/features/      # 피처별 디자인 문서
│   ├── api-endpoints.md         # 전체 API 엔드포인트
│   ├── data-models.md           # DB 테이블 스키마
│   └── implemented-features.md  # 구현 완료 기능 목록
└── docker-compose.yml           # PostgreSQL + Redis
```

## 인프라 실행

```bash
docker-compose up -d
```

## Git 작업 규칙

모든 작업은 **작업 시작 전** feature 브랜치를 생성하고, 해당 브랜치에서 작업 후 main에 squash merge한다.

**커밋·푸시 규칙**: 커밋과 푸시는 반드시 사용자에게 먼저 확인하고, 허락이 있을 때만 진행한다.

```bash
# 1. 작업 시작 전 브랜치 생성 (구현 전에 먼저)
git checkout -b feat/기능명   # 또는 fix/, refactor/

# 2. 브랜치에서 작업 + 커밋

# 3. 사용자 확인 후 main에 병합
git checkout main
git merge --squash feat/기능명
git commit -m "feat: ..."
git push origin main

# 4. 브랜치 정리
git branch -D feat/기능명
```

**브랜치 네이밍**
- `feat/` — 새 기능
- `fix/` — 버그 수정
- `refactor/` — 리팩터링

**주의**: main 브랜치에 직접 커밋하지 않는다.
