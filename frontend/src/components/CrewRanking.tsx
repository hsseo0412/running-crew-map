import type React from "react";
import { useEffect, useState } from "react";
import type { RankedCrew } from "../types/crew";

interface Props {
  onSelectCrew: (crewId: number) => void;
}

export function CrewRanking({ onSelectCrew }: Props) {
  const [ranking, setRanking] = useState<RankedCrew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crews/ranking?limit=5")
      .then((r) => r.json())
      .then((data) => setRanking(data))
      .catch(() => setRanking([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <section style={s.section}>
      <h3 style={s.title}>인기 크루 TOP 5</h3>
      {ranking.length === 0 ? (
        <p style={s.empty}>아직 후기가 없어요. 첫 후기를 남겨보세요!</p>
      ) : (
        <ol style={s.list}>
          {ranking.map((crew, i) => (
            <li
              key={crew.id}
              style={s.item}
              onClick={() => onSelectCrew(crew.id)}
            >
              <span style={s.rank}>{i + 1}</span>
              <div style={s.info}>
                <span style={s.name}>{crew.name}</span>
                <span style={s.meta}>
                  ★ {crew.avg_rating} · {crew.review_count}개 후기
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: {
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    background: "#fffbeb",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 13,
    fontWeight: 700,
    color: "#92400e",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 8px",
    borderRadius: 6,
    cursor: "pointer",
    background: "#fff",
    border: "1px solid #fde68a",
    transition: "background 0.15s",
  },
  rank: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#f59e0b",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1f2937",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  meta: {
    fontSize: 11,
    color: "#6b7280",
  },
  empty: {
    margin: 0,
    fontSize: 12,
    color: "#9ca3af",
  },
};
