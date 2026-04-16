import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useKakaoLoader } from "../../hooks/useKakaoLoader";
import type { Waypoint } from "../../types/route";

// --- Context ---
export const MapContext = createContext<kakao.maps.Map | null>(null);
export const useMap = () => useContext(MapContext);

// --- Constants ---
const DEFAULT_LAT = 36.5;
const DEFAULT_LNG = 127.5;
const DEFAULT_LEVEL = 7;

// --- Props ---
interface Props {
  children?: React.ReactNode;
  onLoad?: (map: kakao.maps.Map) => void;
  onMapClick?: (lat: number, lng: number) => void;
  /** 코스 등록 중 미리보기 경유지 */
  courseWaypoints?: Waypoint[];
  /** 저장된 코스 표시 */
  shownCourse?: Waypoint[];
}

export function MapContainer({ children, onLoad, onMapClick, courseWaypoints, shownCourse }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const { isLoaded, error } = useKakaoLoader();
  const previewPolylineRef = useRef<kakao.maps.Polyline | null>(null);
  const previewMarkersRef = useRef<kakao.maps.Marker[]>([]);
  const shownPolylineRef = useRef<kakao.maps.Polyline | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !containerRef.current || map) return;

    const center = new kakao.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG);
    const instance = new kakao.maps.Map(containerRef.current, {
      center,
      level: DEFAULT_LEVEL,
    });
    setMap(instance);
    onLoad?.(instance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // 클릭 이벤트 등록/해제
  useEffect(() => {
    if (!map || !onMapClick) return;

    const handler = (e: kakao.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onMapClick(e.latLng.getLat(), e.latLng.getLng());
    };

    kakao.maps.event.addListener(map, "click", handler);
    return () => {
      kakao.maps.event.removeListener(map, "click", handler);
    };
  }, [map, onMapClick]);

  // 코스 등록 미리보기: courseWaypoints → 파란 점선 Polyline + 마커
  useEffect(() => {
    if (!map) return;

    // 기존 미리보기 정리
    previewPolylineRef.current?.setMap(null);
    previewMarkersRef.current.forEach((m) => m.setMap(null));
    previewPolylineRef.current = null;
    previewMarkersRef.current = [];

    if (!courseWaypoints || courseWaypoints.length === 0) return;

    // 경유지 마커
    const markers = courseWaypoints.map((wp) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(wp.lat, wp.lng),
        map,
      });
      return marker;
    });
    previewMarkersRef.current = markers;

    // 2개 이상이면 Polyline
    if (courseWaypoints.length >= 2) {
      const path = courseWaypoints.map((wp) => new kakao.maps.LatLng(wp.lat, wp.lng));
      const polyline = new kakao.maps.Polyline({
        path,
        strokeWeight: 4,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
        map,
      });
      previewPolylineRef.current = polyline;
    }
  }, [map, courseWaypoints]);

  // 저장된 코스 표시: shownCourse → 파란 실선 Polyline
  useEffect(() => {
    if (!map) return;

    shownPolylineRef.current?.setMap(null);
    shownPolylineRef.current = null;

    if (!shownCourse || shownCourse.length < 2) return;

    const path = shownCourse.map((wp) => new kakao.maps.LatLng(wp.lat, wp.lng));
    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: 5,
      strokeColor: "#0ea5e9",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
      map,
    });
    shownPolylineRef.current = polyline;
  }, [map, shownCourse]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#dc2626",
          fontSize: 14,
          padding: 16,
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: onMapClick ? "crosshair" : "default",
        }}
      />
      {map && (
        <MapContext.Provider value={map}>{children}</MapContext.Provider>
      )}
      {onMapClick && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.65)",
            color: "#fff",
            fontSize: 12,
            padding: "5px 12px",
            borderRadius: 20,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {courseWaypoints !== undefined
            ? "지도를 클릭해 경유지를 추가하세요"
            : "지도를 클릭해 위치를 선택하세요"}
        </div>
      )}
    </div>
  );
}
