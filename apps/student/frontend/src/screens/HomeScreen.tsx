/**
 * Mindforge Client — Home Screen (Task 6.3)
 *
 * Today's Plan: greeting, progress bar, task cards, bottom nav.
 * States: loading (skeleton), default, empty ("All caught up!"), error (pull to refresh).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { TodayPlan, TaskCard } from '../api/types';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';
import { SyncBanner } from '../components/SyncBanner';

type ScreenState = 'loading' | 'success' | 'empty' | 'error';

export function HomeScreen() {
  const navigate = useNavigate();
  const [state, setState] = useState<ScreenState>('loading');
  const [data, setData] = useState<TodayPlan | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setState('loading');
    try {
      const plan = await api.get<TodayPlan>('/v1/student/today');
      setData(plan);
      setState(plan.tasks.length === 0 ? 'empty' : 'success');
    } catch (e: any) {
      setError(e?.error?.message ?? 'Failed to load. Pull to refresh.');
      setState('error');
    }
  };

  useEffect(() => { load(); }, []);

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--color-correct)';
      case 'in_progress': return 'var(--color-sage)';
      case 'paused': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Done';
      case 'in_progress': return 'In Progress';
      case 'paused': return 'Paused';
      default: return 'Start';
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <SyncBanner />

        {/* Header */}
        <div style={styles.header}>
          <p style={styles.greeting}>{greetingTime()},</p>
          <h1 style={styles.name}>{data?.student.displayName ?? 'Student'}</h1>
        </div>

        {/* Progress */}
        {data && (
          <div style={styles.progressCard}>
            <div style={styles.progressTop}>
              <span style={styles.progressLabel}>Today's Progress</span>
              <span style={styles.progressPct}>{data.progressPercent}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${data.progressPercent}%` }} />
            </div>
            <p style={styles.progressSub}>
              {data.completedToday} of {data.totalToday} tasks completed
            </p>
          </div>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {[1,2,3].map(i => <Skeleton key={i} height={100} />)}
          </div>
        )}

        {/* Empty */}
        {state === 'empty' && (
          <div style={styles.emptyCard}>
            <span style={{ fontSize: 40 }}>🎉</span>
            <p style={styles.emptyText}>All caught up!</p>
            <p style={styles.emptySubtext}>No tasks for today. Enjoy your break!</p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div style={styles.errorCard}>
            <p>{error}</p>
            <button style={styles.retryBtn} onClick={load}>Try Again</button>
          </div>
        )}

        {/* Task Cards */}
        {state === 'success' && data && (
          <div style={styles.taskList}>
            <h2 style={styles.sectionTitle}>Today's Tasks</h2>
            {data.tasks.map((task) => (
              <TaskCardItem key={task.id} task={task} onTap={() => {
                if (task.status === 'completed') {
                  navigate(`/results/${task.type}/${task.id}`);
                } else {
                  navigate(`/activity/${task.type}/${task.id}`);
                }
              }} statusColor={statusColor} statusLabel={statusLabel} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function TaskCardItem({ task, onTap, statusColor, statusLabel }: {
  task: TaskCard;
  onTap: () => void;
  statusColor: (s: string) => string;
  statusLabel: (s: string) => string;
}) {
  const isComplete = task.status === 'completed';
  return (
    <button
      style={{ ...styles.card, opacity: isComplete ? 0.75 : 1 }}
      onClick={onTap}
    >
      <div style={styles.cardTop}>
        <span style={styles.typeBadge}>{task.type.replace('_', ' ')}</span>
        <span style={{ ...styles.statusBadge, background: statusColor(task.status) }}>
          {statusLabel(task.status)}
        </span>
      </div>
      <h3 style={styles.cardTitle}>{task.title}</h3>
      {task.syllabusRef && (
        <p style={styles.cardSubject}>
          {[task.syllabusRef.subject, task.syllabusRef.chapter].filter(Boolean).join(' · ')}
        </p>
      )}
      <div style={styles.cardBottom}>
        <span style={styles.cardMeta}>{task.questionCount} questions</span>
        {task.estimatedMinutes && (
          <span style={styles.cardMeta}>~{task.estimatedMinutes} min</span>
        )}
        {isComplete && task.score != null && (
          <span style={{ ...styles.cardMeta, color: 'var(--color-correct)', fontWeight: 600 }}>
            Score: {task.score}%
          </span>
        )}
      </div>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', paddingBottom: 80 },
  content: { maxWidth: 480, margin: '0 auto', padding: '20px 16px' },
  header: { marginBottom: 20 },
  greeting: { fontSize: 14, color: 'var(--color-text-muted)' },
  name: { fontSize: 24, fontWeight: 700, color: 'var(--color-brown)', marginTop: 2 },
  progressCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 16,
    boxShadow: 'var(--shadow-sm)',
    marginBottom: 20,
  },
  progressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' },
  progressPct: { fontSize: 14, fontWeight: 700, color: 'var(--color-sage-dark)' },
  progressBar: {
    height: 8,
    background: 'var(--color-cream-dark)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-sage)',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.5s ease',
  },
  progressSub: { fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 },
  emptyCard: {
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 40,
    boxShadow: 'var(--shadow-sm)',
    marginTop: 20,
  },
  emptyText: { fontSize: 18, fontWeight: 600, color: 'var(--color-brown)', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  errorCard: {
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 24,
    boxShadow: 'var(--shadow-sm)',
    marginTop: 20,
    color: 'var(--color-incorrect)',
  },
  retryBtn: {
    marginTop: 12,
    padding: '8px 24px',
    background: 'var(--color-sage)',
    color: '#fff',
    borderRadius: 'var(--radius-full)',
    fontWeight: 600,
    fontSize: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: 'var(--color-brown)', marginBottom: 12 },
  taskList: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  card: {
    width: '100%',
    textAlign: 'left' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 16,
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: 'var(--color-sage-dark)',
    background: 'var(--color-sage-light)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    opacity: 0.85,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: 'var(--color-brown)' },
  cardSubject: { fontSize: 12, color: 'var(--color-text-muted)' },
  cardBottom: { display: 'flex', gap: 12, flexWrap: 'wrap' as const },
  cardMeta: { fontSize: 12, color: 'var(--color-text-muted)' },
};
