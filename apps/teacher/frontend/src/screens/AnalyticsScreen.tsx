import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import type {
  ApiResponse,
  ClassInfo,
  ClassKpis,
  ScoreTrend,
  AttendanceTrend,
  AtRiskStudent,
} from '../api/types';
import { AnimatedList, PopCard } from '../components/Animations';
import { AnalyticsIcon } from '../components/Icons';

type ScreenState = 'loading' | 'success' | 'empty' | 'error';

function Skeleton({ width, height = 16 }: { width: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(90deg, var(--color-cream-dark) 25%, var(--color-cream) 50%, var(--color-cream-dark) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

function KpiSkeleton() {
  return (
    <div style={styles.kpiCard}>
      <Skeleton width={40} height={32} />
      <Skeleton width="60%" height={12} />
    </div>
  );
}

export default function AnalyticsScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [classId, setClassId] = useState('');
  const [kpis, setKpis] = useState<ClassKpis | null>(null);
  const [scoreTrends, setScoreTrends] = useState<ScoreTrend[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ClassInfo[]>>('/v1/classes');
      setClasses(res.data);
      if (res.data.length > 0 && !classId) setClassId(res.data[0].id);
    } catch {
      /* dropdown empty */
    }
  }, [classId]);

  const fetchAnalytics = useCallback(async () => {
    if (!classId) return;
    setScreenState('loading');
    try {
      const [kpiRes, scoreRes, attRes] = await Promise.all([
        api.get<ApiResponse<ClassKpis>>(`/v1/analytics/kpis/${classId}`),
        api.get<ApiResponse<ScoreTrend[]>>(`/v1/analytics/scores/${classId}`),
        api.get<ApiResponse<AttendanceTrend[]>>(`/v1/analytics/attendance/${classId}`),
      ]);
      setKpis(kpiRes.data);
      setScoreTrends(scoreRes.data);
      setAttendanceTrends(attRes.data);
      setScreenState('success');
    } catch (e) {
      setErrorMsg('No results found. Analytics will appear once tests and attendance data are available.');
      setScreenState('error');
    }
  }, [classId]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const maxScore = scoreTrends.length > 0
    ? Math.max(...scoreTrends.map((t) => t.classAverage))
    : 100;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Analytics</h1>

        {/* Class Selector */}
        <div style={styles.selectorRow}>
          <select
            style={styles.classSelect}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grade}-{c.section} ({c.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {screenState === 'loading' && (
          <>
            <div style={styles.kpiGrid}>
              <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
            </div>
            <div style={{ marginTop: 20 }}>
              <Skeleton width="40%" height={14} />
              <div style={{ marginTop: 12 }}><Skeleton width="100%" height={120} /></div>
            </div>
          </>
        )}

        {/* Error */}
        {screenState === 'error' && (
          <div style={styles.stateCard}>
            <span style={{ fontSize: 36, marginBottom: 8 }}>&#128202;</span>
            <p style={{ ...styles.stateText, fontWeight: 600, color: 'var(--color-brown)', marginBottom: 4 }}>
              No results found
            </p>
            <p style={styles.stateText}>{errorMsg}</p>
            <button style={styles.retryBtn} onClick={fetchAnalytics}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {screenState === 'empty' && (
          <div style={styles.stateCard}>
            <AnalyticsIcon size={40} color="var(--color-text-muted)" />
            <p style={styles.stateText}>No analytics data available</p>
          </div>
        )}

        {/* Success */}
        {screenState === 'success' && kpis && (
          <>
            {/* KPI Cards */}
            <div style={styles.kpiGrid}>
              <PopCard delay={0}>
                <div style={styles.kpiCard}>
                  <span style={styles.kpiValue}>{Math.round(kpis.averageScore)}%</span>
                  <span style={styles.kpiLabel}>Avg Score</span>
                </div>
              </PopCard>
              <PopCard delay={80}>
                <div style={styles.kpiCard}>
                  <span style={styles.kpiValue}>{Math.round(kpis.attendancePercentage)}%</span>
                  <span style={styles.kpiLabel}>Attendance</span>
                </div>
              </PopCard>
              <PopCard delay={160}>
                <div style={styles.kpiCard}>
                  <span style={{ ...styles.kpiValue, color: kpis.atRiskStudents.length > 0 ? 'var(--color-warning)' : 'var(--color-correct)' }}>
                    {kpis.atRiskStudents.length}
                  </span>
                  <span style={styles.kpiLabel}>At-Risk</span>
                </div>
              </PopCard>
              <PopCard delay={240}>
                <div style={styles.kpiCard}>
                  <span style={styles.kpiValue}>{kpis.totalTests}</span>
                  <span style={styles.kpiLabel}>Tests</span>
                </div>
              </PopCard>
            </div>

            {/* Score Trends */}
            {scoreTrends.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h2 style={styles.sectionTitle}>Score Trends</h2>
                <div style={styles.card}>
                  <div style={styles.barChart}>
                    {scoreTrends.map((t) => {
                      const pct = maxScore > 0 ? (t.classAverage / maxScore) * 100 : 0;
                      return (
                        <div key={t.testId} style={styles.barColumn}>
                          <span style={styles.barValue}>{Math.round(t.classAverage)}%</span>
                          <div style={styles.barTrack}>
                            <div
                              style={{
                                ...styles.barFill,
                                height: `${pct}%`,
                                background: t.classAverage >= 60
                                  ? 'var(--color-sage)'
                                  : t.classAverage >= 40
                                    ? 'var(--color-warning)'
                                    : 'var(--color-incorrect)',
                              }}
                            />
                          </div>
                          <span style={styles.barLabel} title={t.testTitle}>
                            {t.testTitle.length > 8 ? t.testTitle.slice(0, 8) + '…' : t.testTitle}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Trends */}
            {attendanceTrends.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h2 style={styles.sectionTitle}>Attendance Trends</h2>
                <div style={styles.card}>
                  <div style={styles.hBarList}>
                    {attendanceTrends.map((w) => (
                      <div key={w.week} style={styles.hBarRow}>
                        <span style={styles.hBarLabel}>{w.week}</span>
                        <div style={styles.hBarTrack}>
                          <div
                            style={{
                              ...styles.hBarFill,
                              width: `${w.presentPercentage}%`,
                              background: w.presentPercentage >= 75
                                ? 'var(--color-sage)'
                                : w.presentPercentage >= 50
                                  ? 'var(--color-warning)'
                                  : 'var(--color-incorrect)',
                            }}
                          />
                        </div>
                        <span style={styles.hBarValue}>{Math.round(w.presentPercentage)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* At-Risk Students */}
            {kpis.atRiskStudents.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h2 style={styles.sectionTitle}>At-Risk Students</h2>
                <div style={styles.card}>
                  <div style={styles.tableHeader}>
                    <span style={{ ...styles.tableCell, flex: 2, fontWeight: 600 }}>Student</span>
                    <span style={{ ...styles.tableCell, flex: 2, fontWeight: 600 }}>Reason</span>
                    <span style={{ ...styles.tableCell, flex: 1, fontWeight: 600, textAlign: 'right' }}>%</span>
                  </div>
                  <AnimatedList stagger={50}>
                    {kpis.atRiskStudents.map((s: AtRiskStudent) => {
                      const pct = s.attendancePercentage ?? s.averageScore ?? 0;
                      return (
                        <div key={s.studentId} style={styles.tableRow}>
                          <span style={{ ...styles.tableCell, flex: 2 }}>{s.studentName}</span>
                          <span style={{ ...styles.tableCell, flex: 2, color: 'var(--color-warning)' }}>
                            {s.reason}
                          </span>
                          <span
                            style={{
                              ...styles.tableCell,
                              flex: 1,
                              textAlign: 'right',
                              fontWeight: 600,
                              color: pct < 50 ? 'var(--color-incorrect)' : 'var(--color-warning)',
                            }}
                          >
                            {Math.round(pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </AnimatedList>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'var(--color-cream)',
    paddingBottom: 80,
  },
  content: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '16px 16px 0',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-brown)',
    marginBottom: 16,
  },
  selectorRow: {
    marginBottom: 16,
  },
  classSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: 14,
    color: 'var(--color-brown)',
    background: 'var(--color-surface)',
    boxShadow: 'var(--shadow-sm)',
    outline: 'none',
    appearance: 'none',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  kpiCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--color-sage-dark)',
    lineHeight: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-brown)',
    marginBottom: 12,
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    padding: 16,
  },
  barChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    height: 160,
    paddingTop: 20,
  },
  barColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    height: '100%',
  },
  barValue: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    maxWidth: 32,
    background: 'var(--color-cream-dark)',
    borderRadius: 'var(--radius-sm)',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 'var(--radius-sm)',
    transition: 'height 0.4s ease',
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  hBarList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  hBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  hBarLabel: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    minWidth: 52,
    flexShrink: 0,
  },
  hBarTrack: {
    flex: 1,
    height: 18,
    background: 'var(--color-cream-dark)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: 'var(--radius-sm)',
    transition: 'width 0.4s ease',
    minWidth: 4,
  },
  hBarValue: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-brown)',
    minWidth: 36,
    textAlign: 'right',
  },
  tableHeader: {
    display: 'flex',
    paddingBottom: 8,
    borderBottom: '1px solid var(--color-border)',
    marginBottom: 4,
  },
  tableRow: {
    display: 'flex',
    padding: '8px 0',
    borderBottom: '1px solid var(--color-cream-dark)',
  },
  tableCell: {
    fontSize: 13,
    color: 'var(--color-brown)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 32,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  stateText: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  retryBtn: {
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    border: '1px solid var(--color-sage-light)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    cursor: 'pointer',
  },
};
