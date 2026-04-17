# Analysis: marker-label

> Check Phase — Design vs Implementation Gap Analysis

- **Date**: 2026-04-17
- **Overall Match Rate**: 99.25% ✅
- **Status**: PASS (>= 90%)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 기본 핀 마커는 어떤 크루인지 알 수 없어 지도 단독 탐색 불가 |
| **WHO** | 지도를 주로 사용하는 사용자 |
| **RISK** | CustomOverlay 클릭 이벤트 버블링, InfoWindow 앵커 API 제약 |
| **SUCCESS** | 클릭 없이 크루명 확인 가능, 선택 크루가 색상 반전으로 구분됨 |
| **SCOPE** | `MapMarker.tsx` 단일 파일 수정 |

---

## Match Rate Summary

| 항목 | 점수 | 가중치 |
|------|:----:|:------:|
| Structural Match | 100% | 0.15 |
| Functional Depth | 100% | 0.25 |
| Intent Match | 100% | 0.30 |
| Behavioral Completeness | 95% | 0.15 |
| UX Fidelity | 100% | 0.15 |
| **Overall** | **99.25%** | — |

---

## Plan Success Criteria

| 기준 | 상태 | 근거 |
|------|:----:|------|
| 지도 로드 시 모든 마커 위치에 크루명 라벨 표시 | ✅ | `overlay.setMap(map)` + `buildLabelHtml` |
| 라벨 클릭 시 InfoWindow 열림 | ✅ | `el.addEventListener("click", handleClick)` |
| 목록에서 크루 선택 시 해당 라벨 색상 반전 | ✅ | `useEffect([isSelected, title])` |
| 다른 크루 선택 시 이전 라벨 원래 스타일 복원 | ✅ | `isSelected=false` re-render |
| 기존 Props 인터페이스 변경 없음 | ✅ | Props 인터페이스 동일 |

**5/5 Met (100%)**

---

## FR/NFR Verification

| ID | 상태 | 비고 |
|----|:----:|------|
| FR-01 CustomOverlay 사용 | ✅ | `new kakao.maps.CustomOverlay(...)` line 148 |
| FR-02 크루명 상시 표시 | ✅ | `buildLabelHtml` + `overlay.setMap(map)` |
| FR-03 선택 시 색상 반전 | ✅ | bg/fg 반전 구현 |
| FR-04 InfoWindow 유지 | ✅ | `buildRichContent` 동일, `anchorMarker` 우회 |
| FR-05 isSelected 즉시 반영 | ✅ | `useEffect([isSelected, title])` |
| NFR-01 심플 디자인 | ✅ | 크루명만 표시 |
| NFR-02 Props 호환 | ✅ | 인터페이스 변경 없음 |
| NFR-03 백엔드 변경 없음 | ✅ | 프론트엔드 전용 |

---

## 설계 이탈 (필요한 변경)

### InfoWindow 앵커 — kakao.maps.InfoWindow API 제약

| 항목 | Design §3.4 | 구현 |
|------|-------------|------|
| InfoWindow 앵커 | `infoWindow.open(map, overlay)` | `infoWindow.open(map, anchorMarker)` |

**원인**: `kakao.maps.InfoWindow.open()`이 런타임에서 `CustomOverlay`를 앵커로 지원하지 않음 (타입 정의에는 허용되나 런타임 에러 발생).

**해결**: 숨김 `Marker`(`anchorMarker`)를 별도 생성해 앵커로만 활용. 지도에는 표시 안 함. 코드 주석으로 이유 명시(line 132-134, 157-159).

**영향**: 기능 동작 동일. 런타임 안정성 향상.

---

## Design 문서 업데이트 권장

`docs/02-design/features/marker-label.design.md` §3.4, §6 — InfoWindow 앵커 API 제약 및 해결 방법 반영 권장.

---

## 결론

- **모든 요구사항 충족** (FR 5/5, NFR 3/3, Success Criteria 5/5)
- **유일한 이탈**: InfoWindow 앵커 API 제약 우회 — 필요하고 올바른 조치
- **추가 작업 불필요** — 90% 이상이므로 report 단계 진행 가능
