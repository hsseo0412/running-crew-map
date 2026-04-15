import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useKakaoLoader } from "../../hooks/useKakaoLoader";

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
}

export function MapContainer({ children, onLoad, onMapClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const { isLoaded, error } = useKakaoLoader();

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
          지도를 클릭해 위치를 선택하세요
        </div>
      )}
    </div>
  );
}
