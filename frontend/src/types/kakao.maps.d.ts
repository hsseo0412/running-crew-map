declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void;

    namespace services {
      interface KakaoPlace {
        place_name: string;
        road_address_name: string;
        address_name: string;
        x: string; // longitude
        y: string; // latitude
        category_name: string;
      }

      enum Status {
        OK = "OK",
        ZERO_RESULT = "ZERO_RESULT",
        ERROR = "ERROR",
      }

      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: KakaoPlace[], status: Status) => void
        ): void;
      }
    }

    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    interface MapOptions {
      center: LatLng;
      level: number;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      panTo(latlng: LatLng): void;
      setLevel(level: number, options?: { animate?: boolean }): void;
      getCenter(): LatLng;
      getLevel(): number;
    }

    interface MarkerOptions {
      map: Map;
      position: LatLng;
      title?: string;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
      setTitle(title: string): void;
    }

    interface InfoWindowOptions {
      content: string;
      removable?: boolean;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      open(map: Map, marker: Marker): void;
      close(): void;
    }

    interface MapMouseEvent {
      latLng: LatLng;
      point: { x: number; y: number };
    }

    namespace event {
      function addListener(target: Map, type: "click", handler: (e: MapMouseEvent) => void): void;
      function addListener(target: Marker, type: "click", handler: () => void): void;
      function addListener(target: Map | Marker, type: string, handler: (e?: MapMouseEvent) => void): void;
      function removeListener(target: Map | Marker, type: string, handler: (e?: MapMouseEvent) => void): void;
    }
  }
}

interface Window {
  kakao: typeof kakao;
}
