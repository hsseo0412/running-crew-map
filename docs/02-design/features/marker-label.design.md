# Design: marker-label

> 지도 마커를 크루명 라벨 CustomOverlay로 교체

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 기본 핀 마커는 어떤 크루인지 알 수 없어 지도 단독 탐색 불가 |
| **WHO** | 지도를 주로 사용하는 사용자 (목록 패널 없이 지도만 보는 경우) |
| **RISK** | CustomOverlay 클릭 이벤트 버블링, isSelected 업데이트 시 깜박임 |
| **SUCCESS** | 클릭 없이 크루명 확인 가능, 선택 크루가 색상 반전으로 구분됨 |
| **SCOPE** | `MapMarker.tsx` 단일 파일 수정, 백엔드 변경 없음 |

---

## 1. Overview

### 선택된 설계안: Option C — 완전 교체

`kakao.maps.Marker` → `kakao.maps.CustomOverlay` 완전 교체.  
단일 파일(`MapMarker.tsx`) 수정만으로 구현. 추가 파일 없음.

### 아키텍처 비교

| 항목 | Option A (마커+라벨) | Option B (별도 컴포넌트) | Option C (완전 교체) ✓ |
|------|---------------------|------------------------|----------------------|
| 수정 파일 | 1개 | 2~3개 | 1개 |
| 추가 파일 | 없음 | 1개 | 없음 |
| 관리 객체 | 2개 (Marker+Overlay) | 2개 | 1개 (Overlay) |
| 코드 복잡도 | 중 | 높음 | 낮음 |
| 하위 호환 | O | O | O |

---

## 2. 컴포넌트 구조

### 변경 범위

```
frontend/src/components/map/
└── MapMarker.tsx   ← 이 파일만 수정
```

### 변경 전 / 후

```
변경 전:
MapMarker
  └── kakao.maps.Marker         (기본 핀)
  └── kakao.maps.InfoWindow     (클릭 시 말풍선)

변경 후:
MapMarker
  └── kakao.maps.CustomOverlay  (크루명 라벨 — 항상 표시)
  └── kakao.maps.InfoWindow     (클릭 시 말풍선 — 기존 유지)
```

---

## 3. 상세 설계

### 3.1 라벨 HTML 구조

```html
<!-- 기본 상태 -->
<div class="crew-label">
  <div class="crew-label__text">한강러닝크루</div>
  <div class="crew-label__tail"></div>
</div>

<!-- 선택 상태 (isSelected=true) -->
<div class="crew-label crew-label--selected">
  <div class="crew-label__text">한강러닝크루</div>
  <div class="crew-label__tail crew-label__tail--selected"></div>
</div>
```

### 3.2 인라인 스타일 스펙

CustomOverlay는 외부 CSS 로드가 불가하므로 인라인 스타일 사용.

**라벨 박스**

| 속성 | 기본 | 선택 |
|------|------|------|
| background | `#ffffff` | `#111827` |
| color | `#111827` | `#ffffff` |
| border | `1px solid #d1d5db` | `1px solid #111827` |
| border-radius | `6px` | `6px` |
| padding | `4px 8px` | `4px 8px` |
| font-size | `12px` | `12px` |
| font-weight | `600` | `600` |
| box-shadow | `0 1px 4px rgba(0,0,0,0.15)` | `0 2px 6px rgba(0,0,0,0.3)` |
| white-space | `nowrap` | `nowrap` |
| cursor | `pointer` | `pointer` |

**꼬리 삼각형 (▼)**

| 속성 | 기본 | 선택 |
|------|------|------|
| border-top-color | `#ffffff` | `#111827` |
| width | 0 | 0 |
| height | 0 | 0 |
| border-left | `5px solid transparent` | 동일 |
| border-right | `5px solid transparent` | 동일 |
| border-top | `6px solid {color}` | 동일 |

**시각적 결과**

```
기본:   ┌────────────────┐
        │  한강러닝크루   │   흰 배경, 짙은 글씨
        └────────────────┘
               ▼

선택:   ┌────────────────┐
        │  한강러닝크루   │   짙은 배경, 흰 글씨
        └────────────────┘
               ▼
```

### 3.3 CustomOverlay 위치 설정

```typescript
new kakao.maps.CustomOverlay({
  position: new kakao.maps.LatLng(lat, lng),
  content: labelElement,
  yAnchor: 1.4,   // 꼬리 포함 높이 보정 (1.0 = 좌표가 하단, 높을수록 위로 올라감)
  zIndex: 3,
})
```

- `yAnchor: 1.4` — 라벨 박스 높이(~28px) + 꼬리(6px)를 고려한 오프셋

### 3.4 클릭 이벤트 처리

CustomOverlay는 `kakao.maps.event.addListener`를 지원하지 않으므로 HTML 요소에 직접 이벤트 연결.

```typescript
// DOM 요소 생성 후 클릭 이벤트 직접 연결
const el = document.createElement("div");
el.innerHTML = buildLabelHtml(title, false);
el.addEventListener("click", (e) => {
  e.stopPropagation();  // 지도 클릭 이벤트 버블링 방지
  // InfoWindow 열기 + onSelect 호출 (기존 로직과 동일)
  if (currentInfoWindow && currentInfoWindow !== infoWindow) {
    currentInfoWindow.close();
  }
  infoWindow.open(map, overlayRef);  // ← CustomOverlay를 앵커로 전달
  currentInfoWindow = infoWindow;
  if (crew) onSelect?.(crew);
});
```

**InfoWindow 앵커**: `kakao.maps.InfoWindow.open(map, anchor)` 의 `anchor`에 CustomOverlay 객체를 전달하면 오버레이 위치에 말풍선이 붙음.

### 3.5 isSelected 상태 반영

`isSelected` prop 변경 시 `overlay.setContent()`로 HTML 교체.

```typescript
// useEffect: isSelected 변경 감지
useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  el.innerHTML = buildLabelHtml(title, isSelected ?? false);
}, [isSelected, title]);
```

`containerRef`는 CustomOverlay content로 전달한 `div` 요소를 가리킴 → innerHTML만 교체하므로 overlay 재생성 없음.

---

## 4. 함수 설계

### `buildLabelHtml(name: string, isSelected: boolean): string`

라벨 HTML 문자열 반환. XSS 방지를 위해 `escapeHtml` 적용.

```typescript
function buildLabelHtml(name: string, isSelected: boolean): string {
  const safe = escapeHtml(name);
  const bg = isSelected ? "#111827" : "#ffffff";
  const fg = isSelected ? "#ffffff" : "#111827";
  const border = isSelected ? "#111827" : "#d1d5db";
  const shadow = isSelected
    ? "0 2px 6px rgba(0,0,0,0.3)"
    : "0 1px 4px rgba(0,0,0,0.15)";
  const tailColor = bg;

  return `
    <div style="
      background:${bg};color:${fg};border:1px solid ${border};
      border-radius:6px;padding:4px 8px;font-size:12px;font-weight:600;
      box-shadow:${shadow};white-space:nowrap;cursor:pointer;
      font-family:'Apple SD Gothic Neo',sans-serif;line-height:1.4;
      user-select:none;
    ">${safe}</div>
    <div style="
      width:0;height:0;margin:0 auto;
      border-left:5px solid transparent;
      border-right:5px solid transparent;
      border-top:6px solid ${tailColor};
    "></div>
  `;
}
```

### `MapMarker` 컴포넌트 변경 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 마커 객체 | `kakao.maps.Marker` | `kakao.maps.CustomOverlay` |
| 라벨 표시 | 클릭 후 InfoWindow에서만 | 항상 표시 |
| 클릭 이벤트 | `kakao.maps.event.addListener` | `el.addEventListener("click")` |
| InfoWindow 앵커 | `marker` 객체 | `overlay` 객체 |
| isSelected 반영 | InfoWindow 열기만 | 라벨 스타일 전환 + InfoWindow 열기 |
| cleanup | `marker.setMap(null)` | `overlay.setMap(null)` |

---

## 5. Props 인터페이스 (변경 없음)

```typescript
interface Props {
  lat: number;
  lng: number;
  title: string;
  crew?: Crew;
  isSelected?: boolean;
  onSelect?: (crew: Crew) => void;
}
```

하위 호환 유지 — 호출부(`App.tsx` 등) 수정 불필요.

---

## 6. 엣지 케이스

| 케이스 | 처리 방법 |
|--------|-----------|
| 크루명이 매우 긴 경우 | `max-width: 150px; overflow: hidden; text-overflow: ellipsis` |
| InfoWindow 앵커로 CustomOverlay 전달 | `infoWindow.open(map, overlay)` — 카카오맵 API 지원 확인 필요 |
| 지도 클릭 이벤트 버블링 | `e.stopPropagation()` |
| 컴포넌트 unmount 시 | `overlay.setMap(null)`, 클릭 리스너는 el 제거와 함께 GC |

---

## 7. 테스트 계획

| 테스트 | 방법 |
|--------|------|
| 라벨 상시 표시 | 지도 로드 후 육안 확인 |
| 클릭 → InfoWindow 열림 | 라벨 클릭 테스트 |
| 목록 선택 → 색상 반전 | 크루 목록 클릭 후 확인 |
| 다른 크루 선택 → 이전 라벨 원복 | 연속 선택 테스트 |
| 긴 이름 말줄임 | 긴 이름 크루 등록 후 확인 |
| TypeScript 타입 오류 없음 | `npm run build` 또는 `tsc --noEmit` |

---

## 8. 구현 가이드 (Session Guide)

### Module Map

| Module | 내용 | 예상 시간 |
|--------|------|-----------|
| M-1 | `buildLabelHtml()` 함수 구현 | 10분 |
| M-2 | `kakao.maps.Marker` → `kakao.maps.CustomOverlay` 교체 | 15분 |
| M-3 | 클릭 이벤트 + InfoWindow 연동 | 10분 |
| M-4 | `isSelected` 스타일 전환 useEffect | 10분 |
| M-5 | 엣지 케이스 처리 (긴 이름, cleanup) | 5분 |

### 권장 세션 플랜

단일 세션으로 M-1 ~ M-5 순서대로 진행. 총 예상 시간: ~50분.

```
/pdca do marker-label
```
