import { useEffect, useState } from "react";
import type { Crew } from "../types/crew";
import { useAddressSearch } from "../hooks/useAddressSearch";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

interface FormState {
  name: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  meeting_days: string[];
  meeting_time: string;
  pace: string;
  level: "" | "beginner" | "intermediate" | "advanced";
  contact: string;
  member_count: string;
}

const INITIAL: FormState = {
  name: "",
  description: "",
  address: "",
  latitude: "",
  longitude: "",
  meeting_days: [],
  meeting_time: "",
  pace: "",
  level: "",
  contact: "",
  member_count: "",
};

function crewToForm(crew: Crew): FormState {
  return {
    name: crew.name,
    description: crew.description ?? "",
    address: crew.address ?? "",
    latitude: crew.latitude.toFixed(6),
    longitude: crew.longitude.toFixed(6),
    meeting_days: crew.meeting_day
      ? crew.meeting_day.split(",").map((d) => d.trim())
      : [],
    meeting_time: crew.meeting_time ?? "",
    pace: crew.pace ?? "",
    level: crew.level ?? "",
    contact: crew.contact ?? "",
    member_count: crew.member_count != null ? String(crew.member_count) : "",
  };
}

interface Props {
  editingCrew?: Crew | null;
  clickedPos: { lat: number; lng: number } | null;
  onSuccess: (crew: Crew, mode: "create" | "update") => void;
}

export function CrewForm({ editingCrew, clickedPos, onSuccess }: Props) {
  const isEditMode = !!editingCrew;

  const [form, setForm] = useState<FormState>(
    editingCrew ? crewToForm(editingCrew) : INITIAL
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { suggestions, clearSuggestions } = useAddressSearch(
    showSuggestions ? form.address : ""
  );

  // 수정 대상 크루가 바뀌면 폼 초기화
  useEffect(() => {
    setForm(editingCrew ? crewToForm(editingCrew) : INITIAL);
    setSubmitError(null);
  }, [editingCrew]);

  // 지도 클릭 시 위도/경도 자동 입력
  useEffect(() => {
    if (!clickedPos) return;
    setForm((prev) => ({
      ...prev,
      latitude: clickedPos.lat.toFixed(6),
      longitude: clickedPos.lng.toFixed(6),
    }));
  }, [clickedPos]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleDayToggle(day: string) {
    setForm((prev) => {
      const next = prev.meeting_days.includes(day)
        ? prev.meeting_days.filter((d) => d !== day)
        : [...prev.meeting_days, day];
      return { ...prev, meeting_days: DAYS.filter((d) => next.includes(d)) };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!form.latitude || !form.longitude) {
      setSubmitError("지도를 클릭해 위치를 선택해주세요.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      meeting_day: form.meeting_days.length > 0 ? form.meeting_days.join(",") : null,
      meeting_time: form.meeting_time || null,
      pace: form.pace.trim() || null,
      level: form.level || null,
      contact: form.contact.trim() || null,
      member_count: form.member_count ? parseInt(form.member_count, 10) : null,
    };

    setSubmitting(true);
    try {
      const url = isEditMode ? `/api/crews/${editingCrew!.id}` : "/api/crews";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `서버 오류: ${res.status}`);
      }

      const result: Crew = await res.json();
      setForm(INITIAL);
      onSuccess(result, isEditMode ? "update" : "create");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : `${isEditMode ? "수정" : "등록"}에 실패했습니다.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {/* 모드 헤더 */}
      {isEditMode && (
        <div style={s.editBanner}>
          ✏️ <strong>{editingCrew!.name}</strong> 수정 중
        </div>
      )}

      {/* 위치 선택 안내 */}
      <div style={s.posSection}>
        <span style={s.posLabel}>선택된 위치</span>
        {form.latitude ? (
          <span style={s.posValue}>
            {form.latitude}, {form.longitude}
          </span>
        ) : (
          <span style={s.posHint}>우측 지도를 클릭해 선택하세요</span>
        )}
      </div>

      {/* 크루명 */}
      <div style={s.field}>
        <label style={s.label}>크루명 <span style={s.required}>*</span></label>
        <input
          style={s.input}
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="예: 한강 새벽 러닝 크루"
          required
        />
      </div>

      {/* 크루 설명 */}
      <div style={s.field}>
        <label style={s.label}>크루 설명</label>
        <textarea
          style={{ ...s.input, height: 72, resize: "vertical" }}
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="크루 소개를 입력해주세요"
        />
      </div>

      {/* 주소 */}
      <div style={s.field}>
        <label style={s.label}>주소</label>
        <div style={s.addressWrap}>
          <input
            style={s.input}
            name="address"
            value={form.address}
            onChange={(e) => {
              handleChange(e);
              setShowSuggestions(true);
              setHoveredIndex(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
                clearSuggestions();
              }, 150);
            }}
            placeholder="예: 서울시 마포구 한강공원"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={s.dropdown}>
              {suggestions.map((place, i) => (
                <li
                  key={i}
                  style={{
                    ...s.dropdownItem,
                    ...(hoveredIndex === i ? s.dropdownItemHover : {}),
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onMouseDown={(e) => {
                    // blur 이벤트보다 먼저 처리되도록 mousedown 사용
                    e.preventDefault();
                    const addr = place.road_address_name || place.address_name;
                    setForm((prev) => ({
                      ...prev,
                      address: addr,
                      latitude: parseFloat(place.y).toFixed(6),
                      longitude: parseFloat(place.x).toFixed(6),
                    }));
                    setShowSuggestions(false);
                    clearSuggestions();
                    setHoveredIndex(null);
                  }}
                >
                  <span style={s.dropdownPlaceName}>{place.place_name}</span>
                  {place.road_address_name && (
                    <span style={s.dropdownAddr}>{place.road_address_name}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 정기 러닝 요일 */}
      <div style={s.field}>
        <label style={s.label}>정기 러닝 요일</label>
        <div style={s.dayRow}>
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              style={{
                ...s.dayBtn,
                ...(form.meeting_days.includes(day) ? s.dayBtnActive : {}),
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* 출발 시간 */}
      <div style={s.field}>
        <label style={s.label}>출발 시간</label>
        <input
          style={s.input}
          type="time"
          name="meeting_time"
          value={form.meeting_time}
          onChange={handleChange}
        />
      </div>

      {/* 평균 페이스 */}
      <div style={s.field}>
        <label style={s.label}>평균 페이스</label>
        <input
          style={s.input}
          name="pace"
          value={form.pace}
          onChange={handleChange}
          placeholder="예: 5'30&quot;/km"
        />
      </div>

      {/* 난이도 */}
      <div style={s.field}>
        <label style={s.label}>난이도</label>
        <select style={s.input} name="level" value={form.level} onChange={handleChange}>
          <option value="">선택 안 함</option>
          <option value="beginner">초급</option>
          <option value="intermediate">중급</option>
          <option value="advanced">고급</option>
        </select>
      </div>

      {/* 연락처 */}
      <div style={s.field}>
        <label style={s.label}>연락처</label>
        <input
          style={s.input}
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="오픈채팅 링크 또는 인스타그램"
        />
      </div>

      {/* 크루 인원 */}
      <div style={s.field}>
        <label style={s.label}>크루 인원</label>
        <input
          style={s.input}
          type="number"
          name="member_count"
          value={form.member_count}
          onChange={handleChange}
          min={1}
          placeholder="예: 20"
        />
      </div>

      {submitError && <p style={s.errorText}>{submitError}</p>}

      <button type="submit" style={s.submitBtn} disabled={submitting}>
        {submitting
          ? isEditMode ? "수정 중…" : "등록 중…"
          : isEditMode ? "크루 수정" : "크루 등록"}
      </button>
    </form>
  );
}

const s = {
  form: {
    padding: "12px 16px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  editBanner: {
    background: "#fef9c3",
    border: "1px solid #fde047",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
    color: "#713f12",
  },
  posSection: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: 6,
    padding: "8px 12px",
  },
  posLabel: { fontSize: 12, color: "#0369a1", fontWeight: 600, whiteSpace: "nowrap" as const },
  posValue: { fontSize: 12, color: "#0c4a6e", fontFamily: "monospace" },
  posHint: { fontSize: 12, color: "#64748b" },
  field: { display: "flex", flexDirection: "column" as const, gap: 4 },
  addressWrap: { position: "relative" as const },
  dropdown: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    width: "100%",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    zIndex: 100,
    margin: 0,
    padding: 0,
    listStyle: "none",
    overflow: "hidden",
  },
  dropdownItem: {
    padding: "8px 10px",
    fontSize: 13,
    cursor: "pointer",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 2,
  },
  dropdownItemHover: {
    background: "#f0f9ff",
  },
  dropdownPlaceName: {
    color: "#111827",
    fontWeight: 600,
  },
  dropdownAddr: {
    color: "#6b7280",
    fontSize: 12,
  },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  required: { color: "#dc2626" },
  input: {
    fontSize: 13,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "7px 10px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#fff",
  },
  dayRow: { display: "flex", gap: 4 },
  dayBtn: {
    width: 34,
    height: 34,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    color: "#374151",
  },
  dayBtnActive: {
    background: "#0ea5e9",
    borderColor: "#0ea5e9",
    color: "#fff",
  },
  errorText: { color: "#dc2626", fontSize: 13, margin: 0 },
  submitBtn: {
    marginTop: 4,
    padding: "10px",
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
} as const;
