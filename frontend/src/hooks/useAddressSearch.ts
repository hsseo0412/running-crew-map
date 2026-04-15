import { useEffect, useState } from "react";
import { useDebounce } from "./useDebounce";

export interface AddressSuggestion {
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string; // longitude
  y: string; // latitude
}

interface UseAddressSearchResult {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  clearSuggestions: () => void;
}

export function useAddressSearch(query: string): UseAddressSearchResult {
  const debouncedQuery = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    // 2글자 미만이면 초기화 후 skip
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    // SDK가 아직 로드되지 않은 경우 skip
    if (!window.kakao?.maps?.services) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const places = new kakao.maps.services.Places();
    places.keywordSearch(trimmed, (result, status) => {
      if (cancelled) return;
      if (status === kakao.maps.services.Status.OK) {
        setSuggestions(result.slice(0, 5));
      } else {
        setSuggestions([]);
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  function clearSuggestions() {
    setSuggestions([]);
  }

  return { suggestions, isLoading, clearSuggestions };
}
