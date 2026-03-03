import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type {
  ApiResponse,
  ClassInfo,
  ClassSession,
  ClassKpis,
  NotificationItem,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Skeleton, CardSkeleton } from '../components/Skeleton';
import { AlertIcon } from '../components/Icons';
import { PopCard, AnimatedList } from '../components/Animations';

type LoadState = 'loading' | 'success' | 'empty' | 'error';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { teacherName } = useAuth();

  const [state, setState] = useState<LoadState>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [kpis, setKpis] = useState<ClassKpis | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setState('loading');
    setErrMsg('');
    try {
      const classesRes = await api.get<ApiResponse<ClassInfo[]>>('/v1/classes');
      const classes = classesRes.data;
      if (!classes.length) {
        setState('empty');
        return;
      }

      const classId = classes[0].id;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [kpiRes, sessRes, alertRes] = await Promise.all([
        api.get<ApiResponse<ClassKpis>>(`/v1/analytics/kpis/${classId}`),
        api.get<ApiResponse<ClassSession[]>>(`/v1/classes/${classId}/sessions?from=${todayStart.toISOString()}&to=${todayEnd.toISOString()}`),
        api.get<ApiResponse<NotificationItem[]>>('/v1/notifications?limit=3'),
      ]);

      setKpis(kpiRes.data);
      setSessions(sessRes.data);
      setAlerts(alertRes.data);
      setState('success');
    } catch (err: any) {
      setErrMsg('Could not load dashboard data. Please try again.');
      setState('error');
    }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <p style={s.greeting}>{greeting()},</p>
          <h1 style={s.name}>{teacherName ?? 'Teacher'}</h1>
        </div>
        <button
          style={s.bellBtn}
          onClick={() => navigate('/alerts')}
          aria-label="Notifications"
        >
          <AlertIcon size={22} color="var(--color-brown)" />
        </button>
      </header>

      {/* Loading */}
      {state === 'loading' && (
        <div style={s.section}>
          <div style={s.kpiGrid}>
            {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            <Skeleton height={14} width="30%" />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={s.stateCard}>
          <p style={s.stateEmoji}>&#9888;&#65039;</p>
          <p style={s.stateTitle}>Something went wrong</p>
          <p style={s.stateDesc}>{errMsg}</p>
          <button style={s.retryBtn} onClick={load}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {state === 'empty' && (
        <div style={s.stateCard}>
          <p style={s.stateEmoji}>&#128218;</p>
          <p style={s.stateTitle}>No classes yet</p>
          <p style={s.stateDesc}>Once classes are assigned to you, your dashboard will appear here.</p>
        </div>
      )}

      {/* Success */}
      {state === 'success' && kpis && (
        <>
          {/* KPI Grid */}
          <section style={s.section}>
            <div style={s.kpiGrid}>
              <PopCard delay={0}><KpiCard label="Avg Score" value={`${kpis.averageScore}%`} color="var(--color-info)" /></PopCard>
              <PopCard delay={80}><KpiCard label="Attendance" value={`${kpis.attendancePercentage}%`} color="var(--color-correct)" /></PopCard>
              <PopCard delay={160}><KpiCard label="Students" value={String(kpis.totalStudents)} color="var(--color-sage)" /></PopCard>
              <PopCard delay={240}><KpiCard label="Tests This Week" value={String(kpis.testsThisWeek)} color="var(--color-warning)" /></PopCard>
            </div>
          </section>

          {/* Today's Classes */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Today's Classes</h2>
            {sessions.length === 0 ? (
              <p style={s.emptyLine}>No classes scheduled today.</p>
            ) : (
              <div style={s.cardList}>
                <AnimatedList baseDelay={300} stagger={60}>
                {sessions.map((sess) => (
                  <div key={sess.id} style={s.sessionCard}>
                    <div style={{ flex: 1 }}>
                      <p style={s.sessionSubject}>{sess.subject}</p>
                      <p style={s.sessionTime}>
                        {new Date(sess.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {sess.durationMinutes} min
                      </p>
                    </div>
                    <span style={{
                      ...s.badge,
                      background: sess.isAttendanceTaken ? 'var(--color-correct)' : 'var(--color-pending)',
                    }}>
                      {sess.isAttendanceTaken ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
                </AnimatedList>
              </div>
            )}
          </section>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Recent Alerts</h2>
              <div style={s.cardList}>
                {alerts.map((a) => (
                  <div key={a.id} style={s.alertCard}>
                    <div style={{
                      ...s.alertDot,
                      background: a.priority === 'high' ? 'var(--color-incorrect)' : 'var(--color-warning)',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={s.alertTitle}>{a.title}</p>
                      <p style={s.alertBody}>{a.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={s.kpiCard}>
      <p style={{ ...s.kpiValue, color }}>{value}</p>
      <p style={s.kpiLabel}>{label}</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 480,
    margin: '0 auto',
    paddingBottom: 80,
    minHeight: '100dvh',
    background: 'var(--color-cream)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 16px 12px',
  },
  greeting: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-brown)',
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)',
    border: 'none',
    cursor: 'pointer',
  },
  section: { padding: '0 16px', marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-brown)',
    marginBottom: 12,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  kpiCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 14px',
    boxShadow: 'var(--shadow-sm)',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  cardList: { display: 'flex', flexDirection: 'column', gap: 10 },
  sessionCard: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    boxShadow: 'var(--shadow-sm)',
  },
  sessionSubject: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--color-brown)',
  },
  sessionTime: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
    marginTop: 2,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
  },
  alertCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    boxShadow: 'var(--shadow-sm)',
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginTop: 5,
    flexShrink: 0,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-brown)',
  },
  alertBody: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginTop: 2,
    lineHeight: 1.4,
  },
  emptyLine: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    padding: '12px 0',
  },
  stateCard: {
    margin: '40px 16px',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '40px 24px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  stateEmoji: { fontSize: 36, marginBottom: 12 },
  stateTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--color-brown)',
    marginBottom: 6,
  },
  stateDesc: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
  },
  retryBtn: {
    marginTop: 16,
    height: 40,
    padding: '0 24px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-sage)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
};
