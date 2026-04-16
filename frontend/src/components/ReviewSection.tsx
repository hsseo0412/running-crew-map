import { useEffect, useState } from 'react';
import type { Review, ReviewCreatePayload } from '../types/review';

interface Props {
  crewId: number;
}

const API_BASE = '/api';
const PAGE_SIZE = 5;

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange?.(star)}
          style={{
            color: star <= rating ? '#f59e0b' : '#d1d5db',
            cursor: onChange ? 'pointer' : 'default',
            fontSize: '1.25rem',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewSection({ crewId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  // 작성 폼 상태
  const [form, setForm] = useState<ReviewCreatePayload>({
    nickname: '',
    password: '',
    rating: 5,
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/crews/${crewId}/reviews`);
      if (res.ok) {
        const data: Review[] = await res.json();
        setReviews(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchReviews();
  }, [crewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (form.content.length < 10) {
      setFormError('후기는 최소 10자 이상 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/crews/${crewId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ nickname: '', password: '', rating: 5, content: '' });
        setShowForm(false);
        setPage(1);
        await fetchReviews();
      } else {
        const data = await res.json();
        setFormError(data.detail ?? '후기 등록에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    setDeleteError('');
    const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: deletePassword }),
    });
    if (res.status === 204) {
      setDeleteTarget(null);
      setDeletePassword('');
      // 삭제 후 페이지가 범위 초과하면 이전 페이지로
      const nextTotal = reviews.length - 1;
      const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > maxPage) setPage(maxPage);
      await fetchReviews();
    } else if (res.status === 403) {
      setDeleteError('비밀번호가 틀렸습니다.');
    } else {
      setDeleteError('삭제에 실패했습니다.');
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const pagedReviews = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* 헤더: 후기 제목 + 평점 + 작성 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
          후기
          {avgRating && (
            <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontWeight: 400 }}>
              ★ {avgRating}
            </span>
          )}
          <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontWeight: 400, fontSize: '0.875rem' }}>
            ({reviews.length}개)
          </span>
        </h3>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(''); }}
          style={{
            fontSize: '0.8rem',
            padding: '4px 10px',
            border: '1px solid #0ea5e9',
            borderRadius: 6,
            background: showForm ? '#0ea5e9' : '#fff',
            color: showForm ? '#fff' : '#0ea5e9',
            cursor: 'pointer',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {showForm ? '닫기' : '후기 작성'}
        </button>
      </div>

      {/* 후기 작성 폼 (토글) */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', background: '#f8fafc' }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="닉네임"
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              required
              style={s.input}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              style={s.input}
            />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <StarRating rating={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
          </div>
          <textarea
            placeholder="후기를 입력하세요 (최소 10자)"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
            rows={3}
            style={{ ...s.input, width: '100%', resize: 'vertical', boxSizing: 'border-box' as const }}
          />
          {formError && (
            <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.25rem 0' }}>{formError}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '0.5rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '0.5rem 1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </form>
      )}

      {/* 후기 목록 */}
      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>불러오는 중...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>아직 후기가 없습니다.</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: totalPages > 1 ? '0' : '0 0 0.75rem' }}>
            {pagedReviews.map((review) => (
              <li
                key={review.id}
                style={{ borderBottom: '1px solid #f3f4f6', padding: '0.75rem 0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{review.nickname}</span>
                    <span style={{ marginLeft: '0.5rem' }}>
                      <StarRating rating={review.rating} />
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <button
                      onClick={() => { setDeleteTarget(review.id); setDeletePassword(''); setDeleteError(''); }}
                      style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#374151' }}>
                  {review.content}
                </p>

                {deleteTarget === review.id && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="password"
                      placeholder="비밀번호 입력"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.25rem 0.5rem', fontSize: '0.875rem', width: 120 }}
                    />
                    <button
                      onClick={() => handleDelete(review.id)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      확인
                    </button>
                    <button
                      onClick={() => setDeleteTarget(null)}
                      style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 4, padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      취소
                    </button>
                    {deleteError && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{deleteError}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={page === 1 ? s.pageBtn : s.pageBtnActive}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={p === page ? s.pageBtnCurrent : s.pageBtnActive}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={page === totalPages ? s.pageBtn : s.pageBtnActive}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  input: {
    flex: 1,
    minWidth: 0,
    border: '1px solid #d1d5db',
    borderRadius: 4,
    padding: '0.375rem 0.5rem',
    fontSize: '0.875rem',
  },
  pageBtn: {
    minWidth: 22,
    height: 20,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    background: '#f9fafb',
    color: '#d1d5db',
    cursor: 'not-allowed',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  pageBtnActive: {
    minWidth: 22,
    height: 20,
    border: '1px solid #d1d5db',
    borderRadius: 4,
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  pageBtnCurrent: {
    minWidth: 22,
    height: 20,
    border: '1px solid #0ea5e9',
    borderRadius: 4,
    background: '#0ea5e9',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
} as const;
