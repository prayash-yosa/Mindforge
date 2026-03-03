import { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import type {
  ApiResponse,
  ClassInfo,
  AttendanceSummary,
  ClassSession,
} from '../api/types';
import { Skeleton, CardSkeleton } from '../components/Skeleton';

type LoadState = 'loading' | 'success' | 'empty' | 'error';

interface DayEntry {
  date: string;
  present: number;
  absent: number;
  total: number;
}

export default function AttendanceCalendarScreen() {
  const [state, setState] = useState<LoadState>('loading');
  const [errMsg, setErrMsg] = useState('');

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [monthOffset, setMonthOffset] = useState(0);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  useEffect(() => { loadClasses(); }, []);

  useEffect(() => {
    if (selectedClassId) loadMonth(selectedClassId);
  }, [selectedClassId, monthOffset]);

  async function loadClasses() {
    setState('loading');
    try {
      const res = await api.get<ApiResponse<ClassInfo[]>>('/v1/classes');
      if (!res.data.length) { setState('empty'); return; }
      setClasses(res.data);
      setSelectedClassId(res.data[0].id);
    } catch (err: any) {
      setErrMsg(err?.error?.message ?? 'Failed to load classes');
      setState('error');
    }
  }

  async function loadMonth(classId: string) {
    setState('loading');
    setErrMsg('');
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    try {
      const [sessRes, sumRes] = await Promise.all([
        api.get<ApiResponse<ClassSession[]>>(
          `/v1/classes/${classId}/sessions?year=${year}&month=${month}`,
        ),
        api.get<ApiResponse<AttendanceSummary[]>>(
          `/v1/classes/${classId}/attendance/summary?year=${year}&month=${month}`,
        ),
      ]);

      const sessions = sessRes.data;
      setTotalSessions(sessions.length);

      const dayMap = new Map<string, DayEntry>();
      for (const sess of sessions) {
        const dateKey = sess.scheduledAt.slice(0, 10);
        if (!dayMap.has(dateKey)) {
          dayMap.set(dateKey, { date: dateKey, present: 0, absent: 0, total: 0 });
        }
      }
      setDayEntries(Array.from(dayMap.values()));
      setSummaries(sumRes.data);
      setState(sessions.length ? 'success' : 'empty');
    } catch (err: any) {
      setErrMsg(err?.error?.message ?? 'Failed to load attendance data');
      setState('error');
    }
  }

  const overallPresent = summaries.reduce((s, r) => s + r.presentCount, 0);
  const overallTotal = summaries.reduce((s, r) => s + r.totalSessions, 0);
  const overallPct = overallTotal ? Math.round((overallPresent / overallTotal) * 100) : 0;
  const overallAbsentPct = overallTotal ? 100 - overallPct : 0;

  const calendarGrid = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const entryMap = new Map(dayEntries.map((e) => [e.date, e]));
    const cells: (null | { day: number; entry: DayEntry | undefined })[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, entry: entryMap.get(key) });
    }
    return cells;
  }, [viewDate, dayEntries]);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.headerTitle}>Attendance Calendar</h1>
      </header>

      {/* Class selector */}
      {classes.length > 0 && (
        <div style={s.pills}>
          {classes.map((c) => (
            <button
              key={c.id}
              style={{
                ...s.pill,
                background: c.id === selectedClassId ? 'var(--color-sage)' : 'var(--color-surface)',
                color: c.id === selectedClassId ? '#fff' : 'var(--color-text)',
              }}
              onClick={() => setSelectedClassId(c.id)}
            >
              {c.grade}{c.section} · {c.subject}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {state === 'loading' && (
        <div style={s.content}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            <Skeleton height={20} width="50%" />
            <Skeleton height={200} />
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
          <button style={s.retryBtn} onClick={loadClasses}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {state === 'empty' && (
        <div style={s.stateCard}>
          <p style={s.stateEmoji}>&#128197;</p>
          <p style={s.stateTitle}>No sessions this month</p>
          <p style={s.stateDesc}>There are no sessions recorded for {monthLabel}.</p>
        </div>
      )}

      {/* Success */}
      {state === 'success' && (
        <div style={s.content}>
          {/* Month nav */}
          <div style={s.monthNav}>
            <button style={s.monthBtn} onClick={() => setMonthOffset((o) => o - 1)}>&lsaquo;</button>
            <span style={s.monthLabel}>{monthLabel}</span>
            <button
              style={{ ...s.monthBtn, opacity: monthOffset >= 0 ? 0.3 : 1 }}
              onClick={() => { if (monthOffset < 0) setMonthOffset((o) => o + 1); }}
              disabled={monthOffset >= 0}
            >
              &rsaquo;
            </button>
          </div>

          {/* Calendar grid */}
          <div style={s.calGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} style={s.calDayLabel}>{d}</div>
            ))}
            {calendarGrid.map((cell, i) => (
              <div key={i} style={s.calCell}>
                {cell && (
                  <>
                    <span style={s.calDay}>{cell.day}</span>
                    {cell.entry && (
                      <span
                        style={{
                          ...s.dot,
                          background: cell.entry.absent > 0
                            ? 'var(--color-incorrect)'
                            : 'var(--color-correct)',
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Stats summary */}
          <div style={s.statsRow}>
            <div style={s.statBox}>
              <p style={s.statValue}>{totalSessions}</p>
              <p style={s.statLabel}>Sessions</p>
            </div>
            <div style={s.statBox}>
              <p style={{ ...s.statValue, color: 'var(--color-correct)' }}>{overallPct}%</p>
              <p style={s.statLabel}>Present</p>
            </div>
            <div style={s.statBox}>
              <p style={{ ...s.statValue, color: 'var(--color-incorrect)' }}>{overallAbsentPct}%</p>
              <p style={s.statLabel}>Absent</p>
            </div>
          </div>

          {/* Student breakdown */}
          {summaries.length > 0 && (
            <section style={{ marginTop: 20 }}>
              <h2 style={s.sectionTitle}>Student Breakdown</h2>
              <div style={s.table}>
                <div style={s.tableHeader}>
                  <span style={{ ...s.th, flex: 2 }}>Student</span>
                  <span style={s.th}>Present</span>
                  <span style={s.th}>Absent</span>
                  <span style={s.th}>%</span>
                </div>
                {summaries.map((row) => (
                  <div key={row.studentId} style={s.tableRow}>
                    <span style={{ ...s.td, flex: 2, fontWeight: 500 }}>{row.studentName}</span>
                    <span style={{ ...s.td, color: 'var(--color-correct)' }}>{row.presentCount}</span>
                    <span style={{ ...s.td, color: 'var(--color-incorrect)' }}>{row.absentCount}</span>
                    <span style={{
                      ...s.td,
                      fontWeight: 600,
                      color: row.percentage >= 75 ? 'var(--color-correct)' : 'var(--color-incorrect)',
                    }}>
                      {row.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
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
    padding: '20px 16px 8px',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-brown)',
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

  /* Month nav */
  monthNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--color-surface)',
    border: 'none',
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--color-brown)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-brown)',
  },

  /* Calendar */
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 10,
    boxShadow: 'var(--shadow-sm)',
  },
  calDayLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    padding: '6px 0',
  },
  calCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    gap: 3,
  },
  calDay: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-brown)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },

  /* Stats */
  statsRow: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 10px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-brown)',
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
    marginTop: 2,
  },

  /* Table */
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-brown)',
    marginBottom: 10,
  },
  table: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    padding: '10px 14px',
    borderBottom: '1px solid var(--color-border)',
  },
  th: {
    flex: 1,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    display: 'flex',
    padding: '10px 14px',
    borderBottom: '1px solid var(--color-cream-dark)',
  },
  td: {
    flex: 1,
    fontSize: 13,
    color: 'var(--color-brown)',
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
