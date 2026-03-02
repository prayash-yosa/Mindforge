import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { AttendanceResponse } from '../api/types';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';

type Period = 'this_month' | 'last_month' | 'this_term';

const PERIOD_LABELS: Record<Period, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_term: 'This Term',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceScreen() {
  const [period, setPeriod] = useState<Period>('this_month');
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<AttendanceResponse>(`/v1/student/attendance?period=${period}`);
      setData(res);
    } catch (e: any) {
      setError(e?.error?.message ?? 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const calendarGrid = buildCalendarGrid(data);

  return (
    <div style={s.page}>
      <div style={s.content}>
        <h1 style={s.title}>Attendance</h1>

        {/* Period Selector */}
        <div style={s.periodRow}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ ...s.periodBtn, ...(p === period ? s.periodActive : {}) }}
              aria-pressed={p === period}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={80} />
            <Skeleton height={240} />
          </div>
        )}

        {error && !loading && (
          <div style={s.errorCard}>
            <p>{error}</p>
            <button style={s.retryBtn} onClick={load}>Retry</button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary Card */}
            <div style={s.summaryCard}>
              <SummaryItem label="Present" value={data.summary.present} color="var(--color-correct)" />
              <SummaryItem label="Absent" value={data.summary.absent} color="var(--color-incorrect)" />
              <SummaryItem label="Late" value={data.summary.late} color="var(--color-warning)" />
              <SummaryItem label="Rate" value={`${data.summary.attendancePercent}%`} color="var(--color-sage-dark)" />
            </div>

            {/* Calendar Grid */}
            {calendarGrid.length > 0 ? (
              <div style={s.calendarCard}>
                <div style={s.calRow}>
                  {DAY_NAMES.map((d) => (
                    <span key={d} style={s.calDayHeader}>{d}</span>
                  ))}
                </div>
                {calendarGrid.map((week, wi) => (
                  <div key={wi} style={s.calRow}>
                    {week.map((cell, ci) => (
                      <div key={ci} style={s.calCell}>
                        {cell ? (
                          <span
                            style={{ ...s.calDot, background: statusColor(cell.status) }}
                            title={`${cell.date}: ${cell.status}`}
                            aria-label={`${cell.date}, ${cell.status}`}
                          >
                            {new Date(cell.date + 'T00:00:00').getDate()}
                          </span>
                        ) : (
                          <span style={s.calEmpty} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {/* Legend */}
                <div style={s.legend}>
                  <LegendItem color="var(--color-correct)" label="Present" />
                  <LegendItem color="var(--color-incorrect)" label="Absent" />
                  <LegendItem color="var(--color-warning)" label="Late" />
                  <LegendItem color="var(--color-text-muted)" label="No data" />
                </div>
              </div>
            ) : (
              <div style={s.emptyCard}>
                <p style={s.emptyText}>No attendance data for this period.</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={s.summaryItem}>
      <span style={{ ...s.summaryValue, color }}>{value}</span>
      <span style={s.summaryLabel}>{label}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={s.legendItem}>
      <span style={{ ...s.legendDot, background: color }} />
      <span style={s.legendLabel}>{label}</span>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'present': return 'var(--color-correct)';
    case 'absent': return 'var(--color-incorrect)';
    case 'late': return 'var(--color-warning)';
    default: return 'var(--color-text-muted)';
  }
}

type CalendarCell = { date: string; status: string } | null;

function buildCalendarGrid(data: AttendanceResponse | null): CalendarCell[][] {
  if (!data?.calendar.length) return [];

  const map = new Map(data.calendar.map((c) => [c.date, c.status]));
  const start = new Date(data.summary.period.startDate + 'T00:00:00');
  const end = new Date(data.summary.period.endDate + 'T00:00:00');
  const weeks: CalendarCell[][] = [];
  let currentWeek: CalendarCell[] = new Array(start.getDay()).fill(null);

  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = formatLocal(cursor);
    currentWeek.push({ date: iso, status: map.get(iso) ?? 'unknown' });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

function formatLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', paddingBottom: 80 },
  content: { maxWidth: 480, margin: '0 auto', padding: '20px 16px' },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--color-brown)', marginBottom: 16 },
  periodRow: { display: 'flex', gap: 8, marginBottom: 20 },
  periodBtn: {
    flex: 1, padding: '8px 0', borderRadius: 'var(--radius-full)',
    fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    transition: 'var(--transition)',
  },
  periodActive: {
    background: 'var(--color-sage)', color: '#fff', borderColor: 'var(--color-sage)',
  },
  errorCard: {
    textAlign: 'center' as const, background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)', padding: 24, color: 'var(--color-incorrect)',
  },
  retryBtn: {
    marginTop: 12, padding: '8px 24px', background: 'var(--color-sage)',
    color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: 14,
  },
  summaryCard: {
    display: 'flex', justifyContent: 'space-between', background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)', padding: 16, boxShadow: 'var(--shadow-sm)', marginBottom: 16,
  },
  summaryItem: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, flex: 1,
  },
  summaryValue: { fontSize: 22, fontWeight: 700 },
  summaryLabel: { fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 },
  calendarCard: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    padding: 16, boxShadow: 'var(--shadow-sm)',
  },
  calRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 },
  calDayHeader: {
    fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' as const,
    paddingBottom: 6,
  },
  calCell: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 36 },
  calDot: {
    width: 32, height: 32, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff',
    fontSize: 12, fontWeight: 600,
  },
  calEmpty: { width: 32, height: 32 },
  legend: { display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' as const },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: '50%' },
  legendLabel: { fontSize: 11, color: 'var(--color-text-muted)' },
  emptyCard: {
    textAlign: 'center' as const, background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)', padding: 32,
  },
  emptyText: { fontSize: 14, color: 'var(--color-text-muted)' },
};
