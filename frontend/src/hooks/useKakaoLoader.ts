import { useEffect, useState } from "react";

type LoadState = "idle" | "loading" | "loaded" | "error";

type Callback = { resolve: () => void; reject: (e: Error) => void };

let loadState: LoadState = "idle";
let loadError: Error | null = null;
const callbacks: Callback[] = [];

function notifyAll() {
  callbacks.splice(0).forEach((cb) => cb.resolve());
}

function rejectAll(err: Error) {
  callbacks.splice(0).forEach((cb) => cb.reject(err));
}

function loadKakaoSDK(appKey: string): Promise<void> {
  if (loadState === "loaded") return Promise.resolve();
  if (loadState === "error") return Promise.reject(loadError);
  if (loadState === "loading") {
    return new Promise((resolve, reject) => callbacks.push({ resolve, reject }));
  }

  loadState = "loading";

  return new Promise((resolve, reject) => {
    callbacks.push({ resolve, reject });

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.type = "text/javascript";

    script.onload = () => {
      window.kakao.maps.load(() => {
        loadState = "loaded";
        notifyAll();
      });
    };

    script.onerror = () => {
      loadState = "error";
      loadError = new Error("카카오 지도 SDK 로드에 실패했습니다. 앱 키와 도메인 등록을 확인해주세요.");
      rejectAll(loadError);
    };

    document.head.appendChild(script);
  });
}

export function useKakaoLoader() {
  const [isLoaded, setIsLoaded] = useState(loadState === "loaded");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) return;

    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;

    if (!appKey?.trim()) {
      setError("VITE_KAKAO_MAP_KEY 환경변수를 .env 파일에 설정해주세요.");
      return;
    }

    loadKakaoSDK(appKey)
      .then(() => setIsLoaded(true))
      .catch((e: Error) => setError(e.message));
  }, [isLoaded]);

  return { isLoaded, error };
}
