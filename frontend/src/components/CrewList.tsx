import type { Crew } from "../types/crew";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

interface Props {
  crews: Crew[];
  fetchError: string | null;
  selectedCrewId: number | null;
  filterLevel: string;
  filterDay: string;
  onClickCrew: (crew: Crew) => void;
  onEditCrew: (crew: Crew) => void;
  onDeleteCrew: (crew: Crew) => void;
  onFilterLevelChange: (v: string) => void;
  onFilterDayChange: (v: string) => void;
}

export function CrewList({
  crews,
  fetchError,
  selectedCrewId,
  filterLevel,
  filterDay,
  onClickCrew,
  onEditCrew,
  onDeleteCrew,
  onFilterLevelChange,
  onFilterDayChange,
}: Props) {
  return (
    <div>
      {/* 필터 영역 */}
      <div style={s.filterSection}>
        <div style={s.filterRow}>
          <span style={s.filterLabel}>난이도</span>
          <div style={s.filterBtns}>
            {(["", "beginner", "intermediate", "advanced"] as const).map((v) => (
              <button
                key={v}
                style={{ ...s.filterBtn, ...(filterLevel === v ? s.filterBtnActive : {}) }}
                onClick={() => onFilterLevelChange(v)}
              >
                {v === "" ? "전체" : LEVEL_LABEL[v]}
              </button>
            ))}
          </div>
        </div>
        <div style={s.filterRow}>
          <span style={s.filterLabel}>요일</span>
          <div style={s.filterBtns}>
            <button
              style={{ ...s.filterBtn, ...(filterDay === "" ? s.filterBtnActive : {}) }}
              onClick={() => onFilterDayChange("")}
            >
              전체
            </button>
            {DAYS.map((day) => (
              <button
                key={day}
                style={{ ...s.filterBtn, ...(filterDay === day ? s.filterBtnActive : {}) }}
                onClick={() => onFilterDayChange(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 결과 수 */}
      <div style={s.resultCount}>{crews.length}개 크루</div>

      {fetchError && <p style={s.errorText}>{fetchError}</p>}
      {!fetchError && crews.length === 0 && (
        <p style={s.emptyText}>조건에 맞는 크루가 없습니다.</p>
      )}

      <ul style={s.list}>
        {crews.map((crew) => (
          <li
            key={crew.id}
            style={{ ...s.card, ...(selectedCrewId === crew.id ? s.cardActive : {}) }}
            onClick={() => onClickCrew(crew)}
          >
            {/* 상단: 크루명 + 액션 버튼 */}
            <div style={s.cardHeader}>
              <strong style={s.crewName}>{crew.name}</strong>
              <div style={s.actions}>
                <button
                  style={s.editBtn}
                  onClick={(e) => { e.stopPropagation(); onEditCrew(crew); }}
                >
                  수정
                </button>
                <button
                  style={s.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); onDeleteCrew(crew); }}
                >
                  삭제
                </button>
              </div>
            </div>

            {crew.address && <span style={s.crewMeta}>{crew.address}</span>}
            <div style={s.tags}>
              {crew.level && <span style={s.tag}>{LEVEL_LABEL[crew.level]}</span>}
              {crew.meeting_day && <span style={s.tag}>{crew.meeting_day}</span>}
              {crew.pace && <span style={s.tag}>{crew.pace}</span>}
              {crew.member_count != null && (
                <span style={s.tag}>{crew.member_count}명</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const s = {
  filterSection: {
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    background: "#fff",
  },
  filterRow: { display: "flex", alignItems: "center", gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: 600, color: "#6b7280", width: 36, flexShrink: 0 },
  filterBtns: { display: "flex", flexWrap: "wrap" as const, gap: 4 },
  filterBtn: {
    fontSize: 12,
    padding: "3px 9px",
    border: "1px solid #d1d5db",
    borderRadius: 20,
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
  },
  filterBtnActive: { background: "#0ea5e9", borderColor: "#0ea5e9", color: "#fff" },
  resultCount: { fontSize: 12, color: "#9ca3af", padding: "6px 16px 4px" },
  list: { listStyle: "none", margin: 0, padding: 0 },
  card: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 16,
    borderBottom: "1px solid #f0f0f0",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    transition: "background 0.1s",
  },
  cardActive: {
    background: "#f0f9ff",
    borderLeft: "3px solid #0ea5e9",
    paddingLeft: 17,  // 20 - 3(border) = 17
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  crewName: { fontSize: 15, color: "#111", flex: 1, minWidth: 0 },
  actions: { display: "flex", gap: 4, flexShrink: 0 },
  editBtn: {
    fontSize: 11,
    padding: "3px 8px",
    border: "1px solid #0ea5e9",
    borderRadius: 4,
    background: "#fff",
    color: "#0ea5e9",
    cursor: "pointer",
    fontWeight: 600,
  },
  deleteBtn: {
    fontSize: 11,
    padding: "3px 8px",
    border: "1px solid #ef4444",
    borderRadius: 4,
    background: "#fff",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: 600,
  },
  crewMeta: { fontSize: 12, color: "#6b7280" },
  tags: { display: "flex", flexWrap: "wrap" as const, gap: 4, marginTop: 2 },
  tag: {
    fontSize: 11,
    background: "#e0f2fe",
    color: "#0369a1",
    borderRadius: 4,
    padding: "2px 7px",
  },
  errorText: { color: "#dc2626", padding: "12px 16px", fontSize: 13, margin: 0 },
  emptyText: {
    color: "#9ca3af",
    padding: "20px 16px",
    fontSize: 13,
    textAlign: "center" as const,
    margin: 0,
  },
} as const;
