import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type {
  ApiResponse,
  ClassInfo,
  ClassSession,
  ClassStudent,
  AttendanceRow,
} from '../api/types';
import { Skeleton, CardSkeleton } from '../components/Skeleton';
import { AnimatedList, SlideTransition } from '../components/Animations';

type PageState = 'loading' | 'no-classes' | 'sessions' | 'attendance' | 'error';
type AttendanceStatus = 'present' | 'absent';

interface LocalAttendance {
  studentId: string;
  studentName: string;
  rollNumber: string | null;
  status: AttendanceStatus;
}

export default function ClassesScreen() {
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errMsg, setErrMsg] = useState('');

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const [attendance, setAttendance] = useState<LocalAttendance[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { loadClasses(); }, []);

  async function loadClasses() {
    setPageState('loading');
    setErrMsg('');
    try {
      const res = await api.get<ApiResponse<ClassInfo[]>>('/v1/classes');
      if (!res.data.length) {
        setPageState('no-classes');
        return;
      }
      setClasses(res.data);
      const first = res.data[0].id;
      setSelectedClassId(first);
      await loadSessions(first);
    } catch (err: any) {
      setErrMsg(err?.error?.message ?? 'Failed to load classes');
      setPageState('error');
    }
  }

  async function loadSessions(classId: string) {
    setPageState('loading');
    try {
      const res = await api.get<ApiResponse<ClassSession[]>>(`/v1/classes/${classId}/sessions`);
      setSessions(res.data);
      setSelectedSession(null);
      setPageState('sessions');
    } catch (err: any) {
      setErrMsg(err?.error?.message ?? 'Failed to load sessions');
      setPageState('error');
    }
  }

  async function openAttendance(session: ClassSession) {
    setPageState('loading');
    setSelectedSession(session);
    setSaveSuccess(false);
    try {
      if (session.isAttendanceTaken) {
        const res = await api.get<ApiResponse<AttendanceRow[]>>(
          `/v1/attendance/session/${session.id}`,
        );
        setAttendance(res.data.map((r) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          rollNumber: r.rollNumber,
          status: r.status,
        })));
      } else {
        const res = await api.get<ApiResponse<ClassStudent[]>>(
          `/v1/classes/${selectedClassId}/students`,
        );
        setAttendance(res.data.map((s) => ({
          studentId: s.studentId,
          studentName: s.studentName,
          rollNumber: s.rollNumber ?? null,
          status: 'present' as AttendanceStatus,
        })));
      }
      setPageState('attendance');
    } catch (err: any) {
      setErrMsg(err?.error?.message ?? 'Failed to load student list');
      setPageState('error');
    }
  }

  const toggleStatus = useCallback((studentId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.studentId === studentId
          ? { ...a, status: a.status === 'present' ? 'absent' : 'present' }
          : a,
      ),
    );
    setSaveSuccess(false);
    setSaveError('');
  }, []);

  async function saveAttendance() {
    if (!selectedSession) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const absentStudents = attendance
        .filter((a) => a.status === 'absent')
        .map((a) => ({ studentId: a.studentId }));

      await api.post('/v1/attendance/mark', {
        classSessionId: selectedSession.id,
        absentStudents,
      });
      setSaveSuccess(true);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id ? { ...s, isAttendanceTaken: true } : s,
        ),
      );

      setTimeout(() => {
        setSaveSuccess(false);
        setPageState('sessions');
      }, 1500);
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Failed to save attendance. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleClassChange(id: string) {
    setSelectedClassId(id);
    loadSessions(id);
  }

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.length - presentCount;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.headerTitle}>Classes</h1>
        {pageState === 'attendance' && (
          <button style={s.backBtn} onClick={() => setPageState('sessions')}>
            &larr; Sessions
          </button>
        )}
      </header>

      {/* Class selector pills */}
      {classes.length > 0 && pageState !== 'loading' && (
        <div style={s.pills}>
          {classes.map((c) => (
            <button
              key={c.id}
              style={{
                ...s.pill,
                background: c.id === selectedClassId ? 'var(--color-sage)' : 'var(--color-surface)',
                color: c.id === selectedClassId ? '#fff' : 'var(--color-text)',
              }}
              onClick={() => handleClassChange(c.id)}
            >
              {c.grade}{c.section} · {c.subject}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {pageState === 'loading' && (
        <div style={s.content}>
          <Skeleton height={14} width="35%" />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      )}

      {/* Error */}
      {pageState === 'error' && (
        <div style={s.stateCard}>
          <p style={s.stateEmoji}>&#9888;&#65039;</p>
          <p style={s.stateTitle}>Something went wrong</p>
          <p style={s.stateDesc}>{errMsg}</p>
          <button style={s.retryBtn} onClick={loadClasses}>Retry</button>
        </div>
      )}

      {/* No classes */}
      {pageState === 'no-classes' && (
        <div style={s.stateCard}>
          <p style={s.stateEmoji}>&#128218;</p>
          <p style={s.stateTitle}>No classes assigned</p>
          <p style={s.stateDesc}>Check back later or contact the admin to get assigned.</p>
        </div>
      )}

      {/* Sessions list */}
      {pageState === 'sessions' && (
        <SlideTransition direction="left" triggerKey={`sessions-${selectedClassId}`}>
          <div style={s.content}>
            <h2 style={s.sectionTitle}>Sessions</h2>
            {sessions.length === 0 ? (
              <p style={s.mutedText}>No sessions found for this class.</p>
            ) : (
              <div style={s.cardList}>
                <AnimatedList stagger={50}>
                  {sessions.map((sess) => {
                    const dt = new Date(sess.scheduledAt);
                    return (
                      <button
                        key={sess.id}
                        style={s.sessionCard}
                        onClick={() => openAttendance(sess)}
                      >
                        <div style={{ flex: 1, textAlign: 'left' as const }}>
                          <p style={s.sessionSubject}>{sess.subject}</p>
                          <p style={s.sessionMeta}>
                            {dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' · '}
                            {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {sess.durationMinutes}m
                          </p>
                        </div>
                        <span style={{
                          ...s.badge,
                          background: sess.isAttendanceTaken ? 'var(--color-correct)' : 'var(--color-pending)',
                        }}>
                          {sess.isAttendanceTaken ? 'Taken' : 'Pending'}
                        </span>
                      </button>
                    );
                  })}
                </AnimatedList>
              </div>
            )}

            {/* Calendar link */}
            <button
              style={s.calendarLink}
              onClick={() => navigate('/attendance-calendar')}
            >
              View Attendance Calendar &rarr;
            </button>
          </div>
        </SlideTransition>
      )}

      {/* Attendance view */}
      {pageState === 'attendance' && selectedSession && (
        <SlideTransition direction="right" triggerKey={`att-${selectedSession.id}`}>
        <div style={s.content}>
          {/* Header card */}
          <div style={s.attHeaderCard}>
            <div style={s.attHeaderTop}>
              <div>
                <p style={s.attSessionTitle}>{selectedSession.subject}</p>
                <p style={s.attSessionDate}>
                  {new Date(selectedSession.scheduledAt).toLocaleDateString([], {
                    weekday: 'long', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <div style={s.attHeaderTime}>
                {new Date(selectedSession.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
            </div>

            {/* Animated progress bar */}
            <div style={s.progressBarTrack}>
              <div
                style={{
                  ...s.progressBarFill,
                  width: attendance.length > 0 ? `${(presentCount / attendance.length) * 100}%` : '100%',
                  background: absentCount === 0 ? 'var(--color-correct)' : 'var(--color-sage)',
                }}
              />
            </div>
            <div style={s.statsRow}>
              <div style={s.statItem}>
                <span style={{ ...s.statValue, color: 'var(--color-correct)' }}>{presentCount}</span>
                <span style={s.statLabel}>Present</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.statItem}>
                <span style={{ ...s.statValue, color: absentCount > 0 ? 'var(--color-incorrect)' : 'var(--color-text-muted)' }}>{absentCount}</span>
                <span style={s.statLabel}>Absent</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.statItem}>
                <span style={{ ...s.statValue, color: 'var(--color-brown)' }}>{attendance.length}</span>
                <span style={s.statLabel}>Total</span>
              </div>
            </div>
          </div>

          <p style={s.tapHint}>Tap a student to mark absent</p>

          {/* Student list */}
          <div style={s.studentList}>
            <AnimatedList baseDelay={100} stagger={40}>
              {attendance.map((a, idx) => {
                const isAbsent = a.status === 'absent';
                const initials = a.studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <button
                    key={a.studentId}
                    style={{
                      ...s.studentCard,
                      borderLeft: `4px solid ${isAbsent ? 'var(--color-incorrect)' : 'var(--color-correct)'}`,
                    }}
                    onClick={() => toggleStatus(a.studentId)}
                  >
                    <div style={{
                      ...s.avatar,
                      background: isAbsent ? '#ffebee' : '#e8f5e9',
                      color: isAbsent ? 'var(--color-incorrect)' : 'var(--color-correct)',
                    }}>
                      {initials}
                    </div>
                    <div style={s.studentMeta}>
                      <p style={s.studentName}>{a.studentName}</p>
                      <p style={s.studentRoll}>Roll #{a.rollNumber ?? idx + 1}</p>
                    </div>
                    {/* Slide toggle */}
                    <div style={{
                      ...s.slideTrack,
                      background: isAbsent ? '#ffcdd2' : '#c8e6c9',
                    }}>
                      <div style={{
                        ...s.slideThumb,
                        transform: isAbsent ? 'translateX(0px)' : 'translateX(28px)',
                        background: isAbsent ? 'var(--color-incorrect)' : 'var(--color-correct)',
                      }}>
                        <span style={s.slideIcon}>{isAbsent ? '\u2717' : '\u2713'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </AnimatedList>
          </div>

        </div>
        </SlideTransition>
      )}

      {/* Sticky save footer — outside SlideTransition to keep position:fixed working */}
      {pageState === 'attendance' && selectedSession && (
        <div style={s.saveFooter}>
          {saveSuccess && (
            <div style={s.successBanner} className="success-pulse">
              <span style={s.successIcon}>{'\u2713'}</span>
              Attendance saved successfully
            </div>
          )}
          {saveError && (
            <div style={s.errorBanner}>
              {saveError}
            </div>
          )}
          <button
            style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}
            onClick={saveAttendance}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Attendance'}
          </button>
        </div>
      )}
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
    padding: '20px 16px 8px',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-brown)',
  },
  backBtn: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  pills: {
    display: 'flex',
    gap: 8,
    padding: '8px 16px 4px',
    overflowX: 'auto',
  },
  pill: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    flexShrink: 0,
  },
  content: { padding: '12px 16px' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-brown)',
    marginBottom: 12,
  },
  cardList: { display: 'flex', flexDirection: 'column', gap: 10 },
  sessionCard: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    transition: 'var(--transition)',
  },
  sessionSubject: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--color-brown)',
  },
  sessionMeta: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginTop: 3,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
  },
  calendarLink: {
    display: 'block',
    marginTop: 20,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%',
  },
  mutedText: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    padding: '12px 0',
  },

  /* Attendance view */
  attHeaderCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg, 16px)',
    padding: '18px 18px 14px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: 16,
  },
  attHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  attSessionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-brown)',
    letterSpacing: -0.3,
  },
  attSessionDate: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
    marginTop: 3,
  },
  attHeaderTime: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    background: 'var(--color-cream)',
    padding: '5px 12px',
    borderRadius: 'var(--radius-full)',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    background: '#ffcdd2',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  statItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    background: 'var(--color-border)',
  },
  tapHint: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 500,
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 110,
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
    transition: 'all 0.25s ease',
  },
  studentMeta: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--color-brown)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  studentRoll: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginTop: 1,
  },
  slideTrack: {
    width: 56,
    height: 28,
    borderRadius: 14,
    position: 'relative',
    flexShrink: 0,
    transition: 'background 0.25s ease',
  },
  slideThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
  },
  slideIcon: {
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1,
  },
  saveFooter: {
    position: 'fixed',
    bottom: 64,
    left: 0,
    right: 0,
    maxWidth: 480,
    margin: '0 auto',
    padding: '12px 16px',
    background: 'rgba(245,243,237,0.95)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid var(--color-border)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-correct)',
    background: '#e8f5e9',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
  },
  successIcon: {
    fontSize: 14,
    fontWeight: 700,
  },
  errorBanner: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-incorrect)',
    background: '#ffebee',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    textAlign: 'center',
  },
  saveBtn: {
    width: '100%',
    height: 50,
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-sage)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    letterSpacing: 0.3,
    boxShadow: '0 2px 8px rgba(106,153,78,0.3)',
  },

  /* State cards */
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
