import type { Crew } from "../types/crew";
import ReviewSection from "./ReviewSection";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const LEVEL_COLOR: Record<string, { bg: string; color: string }> = {
  beginner: { bg: "#dcfce7", color: "#15803d" },
  intermediate: { bg: "#fef9c3", color: "#854d0e" },
  advanced: { bg: "#fee2e2", color: "#b91c1c" },
};

interface Props {
  crew: Crew;
  onBack: () => void;
  onEdit: (crew: Crew) => void;
  onDelete: (crew: Crew) => void;
}

export function CrewDetail({ crew, onBack, onEdit, onDelete }: Props) {
  const days = crew.meeting_day
    ? crew.meeting_day.split(",").map((d) => d.trim())
    : [];

  return (
    <div style={s.wrap}>
      {/* 헤더 */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          ← 목록
        </button>
        <div style={s.actions}>
          <button style={s.editBtn} onClick={() => onEdit(crew)}>
            수정
          </button>
          <button style={s.deleteBtn} onClick={() => onDelete(crew)}>
            삭제
          </button>
        </div>
      </div>

      {/* 크루명 */}
      <div style={s.body}>
        <h2 style={s.name}>{crew.name}</h2>

        {crew.address && (
          <div style={s.row}>
            <span style={s.icon}>📍</span>
            <span style={s.value}>{crew.address}</span>
          </div>
        )}

        {crew.description && (
          <div style={s.descBox}>
            <p style={s.desc}>{crew.description}</p>
          </div>
        )}

        <div style={s.divider} />

        {/* 요일 */}
        {days.length > 0 && (
          <div style={s.row}>
            <span style={s.icon}>🗓</span>
            <div style={s.dayRow}>
              {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
                <span
                  key={d}
                  style={{
                    ...s.dayChip,
                    ...(days.includes(d) ? s.dayChipActive : s.dayChipInactive),
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 출발 시간 */}
        {crew.meeting_time && (
          <div style={s.row}>
            <span style={s.icon}>⏰</span>
            <span style={s.value}>{crew.meeting_time}</span>
          </div>
        )}

        {/* 평균 페이스 */}
        {crew.pace && (
          <div style={s.row}>
            <span style={s.icon}>⏱</span>
            <span style={s.value}>{crew.pace}</span>
          </div>
        )}

        {/* 난이도 */}
        {crew.level && (
          <div style={s.row}>
            <span style={s.icon}>📊</span>
            <span
              style={{
                ...s.levelBadge,
                background: (LEVEL_COLOR[crew.level] ?? { bg: "#e5e7eb", color: "#374151" }).bg,
                color: (LEVEL_COLOR[crew.level] ?? { bg: "#e5e7eb", color: "#374151" }).color,
              }}
            >
              {LEVEL_LABEL[crew.level] ?? crew.level}
            </span>
          </div>
        )}

        {/* 인원 */}
        {crew.member_count != null && (
          <div style={s.row}>
            <span style={s.icon}>👥</span>
            <span style={s.value}>{crew.member_count}명</span>
          </div>
        )}

        {/* 연락처 */}
        {crew.contact && (
          <>
            <div style={s.divider} />
            <a
              href={crew.contact}
              target="_blank"
              rel="noreferrer"
              style={s.contactBtn}
            >
              연락하기 →
            </a>
          </>
        )}

        <div style={s.divider} />
        <ReviewSection crewId={crew.id} />
      </div>
    </div>
  );
}

const s = {
  wrap: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fff",
    flexShrink: 0,
  },
  backBtn: {
    border: "none",
    background: "transparent",
    color: "#0ea5e9",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 0",
  },
  actions: { display: "flex", gap: 6 },
  editBtn: {
    fontSize: 12,
    padding: "5px 12px",
    border: "1px solid #0ea5e9",
    borderRadius: 6,
    background: "#fff",
    color: "#0ea5e9",
    cursor: "pointer",
    fontWeight: 600,
  },
  deleteBtn: {
    fontSize: 12,
    padding: "5px 12px",
    border: "1px solid #ef4444",
    borderRadius: 6,
    background: "#fff",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: 600,
  },
  body: {
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    overflowY: "scroll" as const,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
    margin: 0,
    lineHeight: 1.3,
  },
  descBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 12px",
  },
  desc: {
    fontSize: 13,
    color: "#374151",
    margin: 0,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
  divider: {
    height: 1,
    background: "#f0f0f0",
    margin: "2px 0",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  icon: { fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" as const },
  value: { fontSize: 14, color: "#374151" },
  dayRow: { display: "flex", gap: 4 },
  dayChip: {
    width: 28,
    height: 28,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipActive: { background: "#0ea5e9", color: "#fff" },
  dayChipInactive: { background: "#f3f4f6", color: "#d1d5db" },
  levelBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
  },
  contactBtn: {
    display: "block",
    textAlign: "center" as const,
    padding: "12px",
    background: "#0ea5e9",
    color: "#fff",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "none",
    marginTop: 4,
  },
} as const;
