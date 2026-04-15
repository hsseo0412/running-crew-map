import { useEffect, useRef } from "react";
import type { Crew } from "../../types/crew";
import { useMap } from "./MapContainer";

// 전역: 현재 열린 InfoWindow (한 번에 하나만 열림)
let currentInfoWindow: kakao.maps.InfoWindow | null = null;

const LEVEL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

function buildRichContent(crew: Crew): string {
  const scheduleItems: string[] = [];
  if (crew.meeting_day || crew.meeting_time) {
    scheduleItems.push(
      `<span>🗓&nbsp;${[crew.meeting_day, crew.meeting_time].filter(Boolean).join(" ")}</span>`
    );
  }
  if (crew.pace) scheduleItems.push(`<span>⏱&nbsp;${crew.pace}</span>`);
  if (crew.level) scheduleItems.push(`<span>📊&nbsp;${LEVEL_LABEL[crew.level]}</span>`);
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
    ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;">${crew.address}</div>`
    : "";

  const contactHtml = crew.contact
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0;">
        <a href="${crew.contact}" target="_blank" rel="noreferrer"
           style="font-size:12px;color:#0ea5e9;text-decoration:none;font-weight:600;">
          연락하기 →
        </a>
       </div>`
    : "";

  return `
    <div style="padding:12px 14px;width:220px;box-sizing:border-box;overflow:hidden;
                font-family:'Apple SD Gothic Neo',sans-serif;line-height:1.4;">
      <div style="font-size:14px;font-weight:700;color:#111;
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${crew.name}</div>
      ${addressHtml}
      ${detailHtml}
      ${contactHtml}
    </div>`;
}

interface Props {
  lat: number;
  lng: number;
  title: string;
  crew?: Crew;          // 있으면 상세 말풍선
  isSelected?: boolean; // 목록 클릭 시 말풍선 강제 오픈
  onSelect?: (crew: Crew) => void; // 마커 클릭 시 상세 패널 연동
}

export function MapMarker({ lat, lng, title, crew, isSelected, onSelect }: Props) {
  const map = useMap();
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);

  // 마커 & InfoWindow 생성/정리
  useEffect(() => {
    if (!map) return;

    const position = new kakao.maps.LatLng(lat, lng);
    const marker = new kakao.maps.Marker({ map, position, title });
    markerRef.current = marker;

    const content = crew
      ? buildRichContent(crew)
      : `<div style="padding:6px 10px;font-size:13px;white-space:nowrap;">${title}</div>`;

    const infoWindow = new kakao.maps.InfoWindow({ content, removable: true });
    infoWindowRef.current = infoWindow;

    // 마커 클릭 → 이전 말풍선 닫고 현재 열기 + 상세 패널 연동
    kakao.maps.event.addListener(marker, "click", () => {
      if (currentInfoWindow && currentInfoWindow !== infoWindow) {
        currentInfoWindow.close();
      }
      infoWindow.open(map, marker);
      currentInfoWindow = infoWindow;
      if (crew) onSelect?.(crew);
    });

    return () => {
      marker.setMap(null);
      infoWindow.close();
      if (currentInfoWindow === infoWindow) currentInfoWindow = null;
    };
  }, [map, lat, lng, title, crew]);

  // isSelected 변경 → 해당 마커 말풍선 열기
  useEffect(() => {
    if (!isSelected) return;
    const marker = markerRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !marker || !infoWindow) return;

    if (currentInfoWindow && currentInfoWindow !== infoWindow) {
      currentInfoWindow.close();
    }
    infoWindow.open(map, marker);
    currentInfoWindow = infoWindow;
  }, [isSelected, map]);

  return null;
}
