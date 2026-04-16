import { useEffect, useState } from 'react';
import type { Route, Waypoint } from '../types/route';

const API_BASE = '/api';

interface Props {
  crewId: number;
  /** 코스 등록 모드 ON/OFF 토글 */
  onStartEdit: () => void;
  /** 코스 등록 모드 취소 */
  onCancelEdit: () => void;
  /** 코스 보기 클릭 시 경유지 전달 */
  onShowCourse: (waypoints: Waypoint[] | null) => void;
  /** 현재 코스 등록 모드 여부 */
  isEditing: boolean;
  /** App에서 내려준 경유지 (지도 클릭으로 쌓임) */
  waypoints: Waypoint[];
  /** 경유지 거리 (km) */
  distanceKm: number;
  /** 마지막 경유지 제거 요청 */
  onUndoWaypoint: () => void;
}

export default function CourseSection({
  crewId,
  onStartEdit,
  onCancelEdit,
  onShowCourse,
  isEditing,
  waypoints,
  distanceKm,
  onUndoWaypoint,
}: Props) {
  const [route, setRoute] = useState<Route | null | undefined>(undefined); // undefined = 로딩 중
  const [showing, setShowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchRoute = async () => {
    try {
      const res = await fetch(`${API_BASE}/crews/${crewId}/route`);
      if (res.status === 404) {
        setRoute(null);
      } else if (res.ok) {
        const data: Route = await res.json();
        setRoute(data);
      }
    } catch {
      setRoute(null);
    }
  };

  useEffect(() => {
    setRoute(undefined);
    setShowing(false);
    onShowCourse(null);
    setError('');
    fetchRoute();
  }, [crewId]);

  const handleToggleShow = () => {
    if (showing) {
      setShowing(false);
      onShowCourse(null);
    } else {
      if (route) {
        setShowing(true);
        onShowCourse(route.coordinates);
      }
    }
  };

  const handleSave = async () => {
    if (waypoints.length < 2) {
      setError('경유지를 최소 2개 이상 찍어주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/crews/${crewId}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: waypoints, distance_km: distanceKm }),
      });
      if (res.ok) {
        const data: Route = await res.json();
        setRoute(data);
        onCancelEdit();
        setShowing(true);
        onShowCourse(data.coordinates);
      } else {
        setError('코스 저장에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('코스를 삭제하시겠습니까?')) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/crews/${crewId}/route`, { method: 'DELETE' });
      if (res.status === 204) {
        setRoute(null);
        setShowing(false);
        onShowCourse(null);
      } else {
        setError('코스 삭제에 실패했습니다.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (route === undefined) {
    return <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>코스 정보 불러오는 중...</div>;
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          🏃 러닝 코스
          {route && (
            <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.8rem' }}>
              {route.distance_km.toFixed(2)} km
            </span>
          )}
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          {route ? (
            <>
              <button
                onClick={handleToggleShow}
                style={{ ...btn, background: showing ? '#0ea5e9' : '#fff', color: showing ? '#fff' : '#0ea5e9', borderColor: '#0ea5e9' }}
              >
                {showing ? '코스 숨기기' : '코스 보기'}
              </button>
              {!isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ ...btn, color: '#ef4444', borderColor: '#ef4444' }}
                >
                  삭제
                </button>
              )}
            </>
          ) : (
            !isEditing && (
              <button onClick={onStartEdit} style={{ ...btn, color: '#0ea5e9', borderColor: '#0ea5e9' }}>
                코스 등록
              </button>
            )
          )}
        </div>
      </div>

      {/* 등록 모드 UI */}
      {isEditing && (
        <div style={{ marginTop: '0.5rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '0.75rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#0369a1' }}>
            지도를 클릭해 경유지를 추가하세요. (최소 2개)
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#374151' }}>
              경유지 {waypoints.length}개
              {waypoints.length >= 2 && (
                <span style={{ marginLeft: 6, color: '#0ea5e9' }}>· {distanceKm.toFixed(2)} km</span>
              )}
            </span>
            {waypoints.length > 0 && (
              <button onClick={onUndoWaypoint} style={{ ...btn, fontSize: '0.75rem', color: '#6b7280', borderColor: '#d1d5db' }}>
                마지막 점 제거
              </button>
            )}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleSave}
              disabled={saving || waypoints.length < 2}
              style={{ ...btn, background: '#0ea5e9', color: '#fff', borderColor: '#0ea5e9', opacity: (saving || waypoints.length < 2) ? 0.5 : 1 }}
            >
              {saving ? '저장 중...' : '등록 완료'}
            </button>
            <button onClick={onCancelEdit} style={{ ...btn, color: '#6b7280', borderColor: '#d1d5db' }}>
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  fontSize: '0.75rem',
  padding: '3px 10px',
  border: '1px solid',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};
