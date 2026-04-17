import { useEffect, useRef } from "react";
import type { Crew } from "../../types/crew";
import { useMap } from "./MapContainer";

// Design Ref: §3.4 — 전역 InfoWindow 싱글턴 (한 번에 하나만 열림)
let currentInfoWindow: kakao.maps.InfoWindow | null = null;

const LEVEL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// Design Ref: §3.2 — 라벨 HTML 생성 (기본/선택 상태)
// Plan SC: FR-02 크루명 상시 표시, FR-03 선택 시 색상 반전
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
      user-select:none;max-width:150px;overflow:hidden;text-overflow:ellipsis;
    ">${safe}</div>
    <div style="
      width:0;height:0;margin:0 auto;
      border-left:5px solid transparent;
      border-right:5px solid transparent;
      border-top:6px solid ${tailColor};
    "></div>
  `;
}

function buildRichContent(crew: Crew): string {
  const scheduleItems: string[] = [];
  if (crew.meeting_day || crew.meeting_time) {
    const dayTime = [crew.meeting_day, crew.meeting_time].filter(Boolean).map(s => escapeHtml(s!)).join(" ");
    scheduleItems.push(`<span>🗓&nbsp;${dayTime}</span>`);
  }
  if (crew.pace) scheduleItems.push(`<span>⏱&nbsp;${escapeHtml(crew.pace)}</span>`);
  if (crew.level) scheduleItems.push(`<span>📊&nbsp;${escapeHtml(LEVEL_LABEL[crew.level] ?? crew.level)}</span>`);
  if (crew.member_count != null) scheduleItems.push(`<span>👥&nbsp;${crew.member_count}명</span>`);

  const detailHtml = scheduleItems.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:6px;">
        ${scheduleItems
          .map(
            (item) =>
              `<span style="font-size:12px;color:#374151;">${item}</span>`
          )
          .join("")}
       </div>`
    : "";

  const addressHtml = crew.address
    ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;">${escapeHtml(crew.address)}</div>`
    : "";

  const contactHref = crew.contact ? safeHref(crew.contact) : null;
  const contactHtml = contactHref
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0;">
        <a href="${escapeHtml(contactHref)}" target="_blank" rel="noreferrer noopener"
           style="font-size:12px;color:#0ea5e9;text-decoration:none;font-weight:600;">
          연락하기 →
        </a>
       </div>`
    : "";

  const ratingHtml =
    crew.avg_rating != null
      ? `<div style="font-size:12px;color:#f59e0b;font-weight:600;margin-top:3px;">
           ★ ${crew.avg_rating.toFixed(1)}
           <span style="color:#9ca3af;font-weight:400;">(${crew.review_count})</span>
         </div>`
      : "";

  return `
    <div style="padding:12px 14px;width:220px;box-sizing:border-box;overflow:hidden;
                font-family:'Apple SD Gothic Neo',sans-serif;line-height:1.4;">
      <div style="font-size:14px;font-weight:700;color:#111;max-width:192px;
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(crew.name)}</div>
      ${ratingHtml}
      ${addressHtml}
      ${detailHtml}
      ${contactHtml}
    </div>`;
}

interface Props {
  lat: number;
  lng: number;
  title: string;
  crew?: Crew;
  isSelected?: boolean;
  onSelect?: (crew: Crew) => void;
}

// Design Ref: §2 — kakao.maps.Marker → kakao.maps.CustomOverlay 완전 교체
export function MapMarker({ lat, lng, title, crew, isSelected, onSelect }: Props) {
  const map = useMap();
  // Design Ref: §3.5 — containerRef: 라벨 HTML 교체용 div 참조
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  // InfoWindow 앵커용 숨김 Marker (지도에 표시 안 함, open() 앵커 역할만)
  // kakao.maps.InfoWindow.open()은 CustomOverlay를 앵커로 지원하지 않음
  const anchorMarkerRef = useRef<kakao.maps.Marker | null>(null);

  // Plan SC: FR-01 CustomOverlay 생성, FR-04 InfoWindow 유지
  useEffect(() => {
    if (!map) return;

    const position = new kakao.maps.LatLng(lat, lng);

    // 라벨 컨테이너 div 생성
    const el = document.createElement("div");
    el.innerHTML = buildLabelHtml(title, isSelected ?? false);
    containerRef.current = el;

    // Design Ref: §3.3 — yAnchor로 꼬리 포함 위치 보정
    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: el,
      yAnchor: 1.4,
      zIndex: 3,
    });
    overlay.setMap(map);
    overlayRef.current = overlay;

    // InfoWindow 앵커용 숨김 Marker (map에 표시 안 함)
    // kakao.maps.InfoWindow.open()은 CustomOverlay를 앵커로 지원하지 않아
    // Marker를 별도 생성해 앵커로만 활용
    const anchorMarker = new kakao.maps.Marker({ position });
    anchorMarkerRef.current = anchorMarker;

    // InfoWindow (기존 buildRichContent 로직 유지)
    const content = crew
      ? buildRichContent(crew)
      : `<div style="padding:6px 10px;font-size:13px;white-space:nowrap;">${escapeHtml(title)}</div>`;
    const infoWindow = new kakao.maps.InfoWindow({ content, removable: true, disableAutoPan: true });
    infoWindowRef.current = infoWindow;

    // Design Ref: §3.4 — CustomOverlay 클릭 이벤트 (DOM 직접 연결)
    const handleClick = (e: Event) => {
      e.stopPropagation(); // 지도 클릭 버블링 방지
      if (currentInfoWindow && currentInfoWindow !== infoWindow) {
        currentInfoWindow.close();
      }
      infoWindow.open(map, anchorMarker);
      currentInfoWindow = infoWindow;
      if (crew) onSelect?.(crew);
    };
    el.addEventListener("click", handleClick);

    return () => {
      overlay.setMap(null);
      infoWindow.close();
      el.removeEventListener("click", handleClick);
      if (currentInfoWindow === infoWindow) currentInfoWindow = null;
      containerRef.current = null;
      overlayRef.current = null;
      infoWindowRef.current = null;
      anchorMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, lat, lng, title, crew]);

  // Plan SC: FR-03, FR-05 — isSelected 변경 시 라벨 스타일 전환
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = buildLabelHtml(title, isSelected ?? false);
  }, [isSelected, title]);

  // isSelected=true 시 InfoWindow도 열기
  useEffect(() => {
    if (!isSelected) return;
    const map_ = map;
    const anchorMarker = anchorMarkerRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map_ || !anchorMarker || !infoWindow) return;

    if (currentInfoWindow && currentInfoWindow !== infoWindow) {
      currentInfoWindow.close();
    }
    infoWindow.open(map_, anchorMarker);
    currentInfoWindow = infoWindow;
  }, [isSelected, map]);

  return null;
}
