import { useCallback, useEffect, useMemo, useState } from "react";
import { CrewDetail } from "./components/CrewDetail";
import { CrewForm } from "./components/CrewForm";
import { CrewList } from "./components/CrewList";
import { MapContainer } from "./components/map/MapContainer";
import { MapMarker } from "./components/map/MapMarker";
import { useDebounce } from "./hooks/useDebounce";
import type { Crew } from "./types/crew";

type Tab = "list" | "form";

export default function App() {
  const [tab, setTab] = useState<Tab>("list");
  const [crews, setCrews] = useState<Crew[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);

  // 필터 상태
  const [filterLevel, setFilterLevel] = useState("");
  const [filterDay, setFilterDay] = useState("");

  // Design Ref: §2.1 — searchQuery → debounce → API 재호출 체인
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Plan SC: FR-01, FR-02 — q 있으면 ILIKE 검색, 없으면 전체
    const ctrl = new AbortController();
    const params = debouncedSearch
      ? `?q=${encodeURIComponent(debouncedSearch)}`
      : "";
    fetch(`/api/crews${params}`, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
        return res.json() as Promise<Crew[]>;
      })
      .then((data) => {
        setFetchError(null);
        setCrews(data);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setFetchError(e.message);
      });
    return () => ctrl.abort();
  }, [debouncedSearch]);

  const filteredCrews = useMemo(() => {
    return crews.filter((crew) => {
      if (filterLevel && crew.level !== filterLevel) return false;
      if (filterDay) {
        const days = crew.meeting_day?.split(",").map((d) => d.trim()) ?? [];
        if (!days.includes(filterDay)) return false;
      }
      return true;
    });
  }, [crews, filterLevel, filterDay]);

  const handleMapLoad = useCallback((map: kakao.maps.Map) => {
    setMapInstance(map);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPos({ lat, lng });
  }, []);

  function focusCrew(crew: Crew) {
    if (!mapInstance) return;
    mapInstance.panTo(new kakao.maps.LatLng(crew.latitude, crew.longitude));
    mapInstance.setLevel(3, { animate: true });
  }

  function handleSelectCrew(crew: Crew) {
    setSelectedCrew(crew);
    focusCrew(crew);
  }

  // 삭제 버튼
  async function handleDeleteCrew(crew: Crew) {
    if (!window.confirm(`"${crew.name}" 크루를 정말 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/crews/${crew.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      setCrews((prev) => prev.filter((c) => c.id !== crew.id));
      if (selectedCrew?.id === crew.id) setSelectedCrew(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  // 등록/수정 완료
  function handleFormSuccess(resultCrew: Crew, mode: "create" | "update") {
    if (mode === "create") {
      setCrews((prev) => [resultCrew, ...prev]);
    } else {
      setCrews((prev) =>
        prev.map((c) => (c.id === resultCrew.id ? resultCrew : c))
      );
    }
    setEditingCrew(null);
    setClickedPos(null);
    setSelectedCrew(resultCrew);
    if (mapInstance) {
      mapInstance.panTo(new kakao.maps.LatLng(resultCrew.latitude, resultCrew.longitude));
      mapInstance.setLevel(4, { animate: true });
    }
    setTab("list");
  }

  // 탭 전환 시 수정 상태 초기화
  function handleTabChange(next: Tab) {
    if (next === "list") {
      setEditingCrew(null);
      setClickedPos(null);
    } else {
      setSelectedCrew(null);
    }
    setTab(next);
  }

  // 수정 버튼 (상세 패널에서도 호출)
  function handleEditCrew(crew: Crew) {
    setEditingCrew(crew);
    setSelectedCrew(null);
    setClickedPos(null);
    setTab("form");
  }

  return (
    <div style={s.layout}>
      {/* 좌측 패널 */}
      <aside style={s.sidebar}>
        <div style={s.tabBar}>
          <button
            style={{ ...s.tabBtn, ...(tab === "list" ? s.tabBtnActive : {}) }}
            onClick={() => handleTabChange("list")}
          >
            크루 목록
          </button>
          <button
            style={{ ...s.tabBtn, ...(tab === "form" ? s.tabBtnActive : {}) }}
            onClick={() => handleTabChange("form")}
          >
            {editingCrew ? "크루 수정" : "크루 등록"}
          </button>
        </div>

        <div style={s.tabContent}>
          {tab === "list" ? (
            selectedCrew ? (
              <CrewDetail
                crew={selectedCrew}
                onBack={() => setSelectedCrew(null)}
                onEdit={handleEditCrew}
                onDelete={handleDeleteCrew}
              />
            ) : (
              <CrewList
                crews={filteredCrews}
                fetchError={fetchError}
                selectedCrewId={null}
                searchQuery={searchQuery}
                filterLevel={filterLevel}
                filterDay={filterDay}
                onClickCrew={handleSelectCrew}
                onEditCrew={handleEditCrew}
                onDeleteCrew={handleDeleteCrew}
                onSearchChange={setSearchQuery}
                onFilterLevelChange={setFilterLevel}
                onFilterDayChange={setFilterDay}
              />
            )
          ) : (
            <CrewForm
              editingCrew={editingCrew}
              clickedPos={clickedPos}
              onSuccess={handleFormSuccess}
            />
          )}
        </div>
      </aside>

      {/* 우측 지도 */}
      <main style={s.mapArea}>
        <MapContainer
          onLoad={handleMapLoad}
          onMapClick={tab === "form" ? handleMapClick : undefined}
        >
          {filteredCrews.map((crew) => (
            <MapMarker
              key={crew.id}
              lat={crew.latitude}
              lng={crew.longitude}
              title={crew.name}
              crew={crew}
              isSelected={selectedCrew?.id === crew.id}
              onSelect={tab === "list" ? handleSelectCrew : undefined}
            />
          ))}

          {tab === "form" && clickedPos && (
            <MapMarker
              lat={clickedPos.lat}
              lng={clickedPos.lng}
              title="📍 선택된 위치"
            />
          )}
        </MapContainer>
      </main>
    </div>
  );
}

const s = {
  layout: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  },
  sidebar: {
    width: 320,
    minWidth: 280,
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column" as const,
    background: "#fafafa",
  },
  tabBar: {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
  },
  tabBtn: {
    flex: 1,
    padding: "14px 0",
    border: "none",
    background: "transparent",
    fontSize: 14,
    fontWeight: 600,
    color: "#9ca3af",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabBtnActive: {
    color: "#0ea5e9",
    borderBottom: "2px solid #0ea5e9",
    background: "#fff",
  },
  tabContent: {
    flex: 1,
    overflowY: "auto" as const,
  },
  mapArea: {
    flex: 1,
    position: "relative" as const,
    minHeight: 0,
  },
} as const;
