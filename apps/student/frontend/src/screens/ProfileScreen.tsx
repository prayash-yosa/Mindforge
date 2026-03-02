import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { StudentProfile } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<StudentProfile>('/v1/student/profile');
        setProfile(data);
      } catch (e: any) {
        setError(e?.error?.message ?? 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={s.page}>
      <div style={s.content}>
        <h1 style={s.title}>Profile</h1>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={140} />
            <Skeleton height={120} />
          </div>
        )}

        {error && !loading && (
          <div style={s.errorCard}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            {/* Info Card */}
            <div style={s.infoCard}>
              <div style={s.avatar}>
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <h2 style={s.name}>{profile.displayName}</h2>
              <div style={s.detailRow}>
                <DetailChip label="Class" value={profile.class} />
                <DetailChip label="Board" value={profile.board} />
              </div>
              {profile.school && <p style={s.school}>{profile.school}</p>}
            </div>

            {/* Progress Overview */}
            {profile.progressOverview.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Progress Overview</h3>
                <div style={s.progressGrid}>
                  {profile.progressOverview.map((po) => (
                    <ProgressCard key={po.type} data={po} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Quick Links</h3>
              <button style={s.linkBtn} onClick={() => navigate('/attendance')}>
                <span>View Attendance</span>
                <ChevronRight />
              </button>
              <button style={s.linkBtn} onClick={() => navigate('/doubts')}>
                <span>My Doubts</span>
                <ChevronRight />
              </button>
            </div>

            {/* Logout */}
            <div style={{ marginTop: 24 }}>
              {!confirmLogout ? (
                <button style={s.logoutBtn} onClick={() => setConfirmLogout(true)}>
                  Log Out
                </button>
              ) : (
                <div style={s.confirmCard}>
                  <p style={s.confirmText}>Are you sure you want to log out?</p>
                  <div style={s.confirmRow}>
                    <button style={s.cancelBtn} onClick={() => setConfirmLogout(false)}>Cancel</button>
                    <button style={s.confirmLogout} onClick={handleLogout}>Log Out</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function ProgressCard({ data }: { data: { type: string; total: number; completed: number; averageScore: number | null } }) {
  const pct = data.total ? Math.round((data.completed / data.total) * 100) : 0;
  return (
    <div style={s.progressCard}>
      <span style={s.progressType}>{data.type.replace(/_/g, ' ')}</span>
      <div style={s.miniBar}>
        <div style={{ ...s.miniFill, width: `${pct}%` }} />
      </div>
      <div style={s.progressMeta}>
        <span>{data.completed}/{data.total}</span>
        {data.averageScore != null && <span>Avg: {Math.round(data.averageScore)}%</span>}
      </div>
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={s.chip}>
      <span style={s.chipLabel}>{label}:</span> {value}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', paddingBottom: 80 },
  content: { maxWidth: 480, margin: '0 auto', padding: '20px 16px' },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--color-brown)', marginBottom: 16 },
  errorCard: {
    textAlign: 'center' as const, background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)', padding: 24, color: 'var(--color-incorrect)',
  },
  infoCard: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
    padding: 24, boxShadow: 'var(--shadow-md)', textAlign: 'center' as const, marginBottom: 20,
  },
  avatar: {
    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
    background: 'linear-gradient(135deg, var(--color-sage-light), var(--color-sage))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 700, color: '#fff',
  },
  name: { fontSize: 20, fontWeight: 700, color: 'var(--color-brown)', marginBottom: 8 },
  detailRow: { display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' as const },
  chip: {
    fontSize: 13, padding: '4px 12px', borderRadius: 'var(--radius-full)',
    background: 'var(--color-cream-dark)', color: 'var(--color-brown)',
  },
  chipLabel: { fontWeight: 600 },
  school: { fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 },
  section: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    padding: 16, boxShadow: 'var(--shadow-sm)', marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--color-brown)', marginBottom: 12 },
  progressGrid: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  progressCard: { padding: '10px 0' },
  progressType: { fontSize: 13, fontWeight: 600, color: 'var(--color-sage-dark)', textTransform: 'capitalize' as const, marginBottom: 4, display: 'block' },
  miniBar: {
    height: 6, background: 'var(--color-cream-dark)', borderRadius: 'var(--radius-full)',
    overflow: 'hidden', marginBottom: 4,
  },
  miniFill: {
    height: '100%', background: 'var(--color-sage)', borderRadius: 'var(--radius-full)',
    transition: 'width 0.4s ease',
  },
  progressMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)' },
  linkBtn: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid var(--color-border)',
    fontSize: 14, color: 'var(--color-brown)',
  },
  logoutBtn: {
    width: '100%', padding: '14px 0', borderRadius: 'var(--radius-full)',
    background: 'transparent', border: '2px solid var(--color-incorrect)',
    color: 'var(--color-incorrect)', fontWeight: 600, fontSize: 15,
  },
  confirmCard: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    padding: 20, boxShadow: 'var(--shadow-md)', textAlign: 'center' as const,
  },
  confirmText: { fontSize: 14, color: 'var(--color-brown)', marginBottom: 16 },
  confirmRow: { display: 'flex', gap: 12, justifyContent: 'center' },
  cancelBtn: {
    padding: '10px 24px', borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border)', fontSize: 14, color: 'var(--color-text-muted)',
  },
  confirmLogout: {
    padding: '10px 24px', borderRadius: 'var(--radius-full)',
    background: 'var(--color-incorrect)', color: '#fff', fontWeight: 600, fontSize: 14,
  },
};
