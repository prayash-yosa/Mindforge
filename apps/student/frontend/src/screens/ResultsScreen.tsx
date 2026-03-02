/**
 * Mindforge Client — Results Screen (Task 6.5)
 *
 * Score, star rating, question breakdown, suggested next, Back to Home.
 * States: loading (skeleton), success, perfect score celebration.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { ActivityResult } from '../api/types';
import { Skeleton } from '../components/Skeleton';

export function ResultsScreen() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ActivityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const result = await api.get<ActivityResult>(`/v1/student/results/${type}/${id}`);
        setData(result);
      } catch (e: any) {
        setError(e?.error?.message ?? 'Failed to load results.');
      } finally {
        setLoading(false);
      }
    })();
  }, [type, id]);

  const starCount = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 75) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    return 1;
  };

  if (loading) {
    return (
      <Shell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={120} />
          <Skeleton height={80} />
          <Skeleton height={200} />
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <div style={s.center}>
          <p style={{ color: 'var(--color-incorrect)' }}>{error}</p>
          <button style={s.btn} onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      </Shell>
    );
  }

  const isPerfect = data.score === 100;
  const stars = starCount(data.score);

  return (
    <Shell>
      {/* Score Section */}
      <div style={s.scoreCard}>
        {isPerfect && <p style={s.celebration}>🎉 Perfect Score!</p>}
        <div style={s.scoreCircle}>
          <span style={s.scoreNum}>{data.score}</span>
          <span style={s.scorePct}>%</span>
        </div>
        <div style={s.stars}>
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{ fontSize: 24, opacity: i <= stars ? 1 : 0.25 }}>⭐</span>
          ))}
        </div>
        <p style={s.scoreLabel}>
          {data.correctAnswers} of {data.totalQuestions} correct
        </p>
      </div>

      {/* Breakdown */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Question Breakdown</h3>
        <div style={s.breakdownGrid}>
          {data.breakdown.map((item, i) => (
            <div key={item.questionId} style={s.breakdownItem}>
              <span style={{
                ...s.breakdownIcon,
                background: item.isCorrect ? 'var(--color-correct)' : 'var(--color-incorrect)',
              }}>
                {item.isCorrect ? '✓' : '✗'}
              </span>
              <span style={s.breakdownLabel}>Q{i + 1}</span>
              {item.score != null && (
                <span style={s.breakdownScore}>{item.score}%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Next */}
      {data.suggestedNext.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>What's Next</h3>
          {data.suggestedNext.map((sug, i) => (
            <div key={i} style={s.suggestCard}>
              <div>
                <span style={s.suggestType}>{sug.type.replace('_', ' ')}</span>
                <p style={s.suggestTitle}>{sug.title}</p>
                <p style={s.suggestReason}>{sug.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button style={s.btn} onClick={() => navigate('/home')}>
          Back to Home
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: 16 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>{children}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  center: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16 },
  scoreCard: {
    textAlign: 'center' as const, background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)', padding: 32, boxShadow: 'var(--shadow-md)',
    marginBottom: 20,
  },
  celebration: { fontSize: 18, fontWeight: 700, color: 'var(--color-sage-dark)', marginBottom: 12 },
  scoreCircle: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 120, height: 120, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-sage-light), var(--color-sage))',
    margin: '0 auto', boxShadow: '0 4px 20px rgba(124,154,110,0.3)',
  },
  scoreNum: { fontSize: 40, fontWeight: 800, color: '#fff' },
  scorePct: { fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.8)' },
  stars: { marginTop: 16, display: 'flex', justifyContent: 'center', gap: 4 },
  scoreLabel: { marginTop: 8, fontSize: 14, color: 'var(--color-text-muted)' },
  section: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    padding: 20, boxShadow: 'var(--shadow-sm)', marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--color-brown)', marginBottom: 12 },
  breakdownGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 10 },
  breakdownItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
    background: 'var(--color-cream)', fontSize: 13,
  },
  breakdownIcon: {
    width: 20, height: 20, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 12, fontWeight: 700,
  },
  breakdownLabel: { fontWeight: 600, color: 'var(--color-brown)' },
  breakdownScore: { color: 'var(--color-text-muted)', fontSize: 12 },
  suggestCard: {
    padding: 14, borderRadius: 'var(--radius-sm)',
    background: 'var(--color-cream)', marginBottom: 8,
  },
  suggestType: {
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
    color: 'var(--color-sage-dark)', marginBottom: 2, display: 'block',
  },
  suggestTitle: { fontSize: 14, fontWeight: 600, color: 'var(--color-brown)' },
  suggestReason: { fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 },
  btn: {
    width: '100%', padding: '14px 0', borderRadius: 'var(--radius-full)',
    background: 'var(--color-sage)', color: '#fff', fontWeight: 600, fontSize: 15,
  },
};
