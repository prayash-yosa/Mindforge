import { useEffect, useState, useCallback } from 'react';
import { api, ApiClientError } from '../api/client';
import type { ApiResponse, NotificationItem } from '../api/types';
import { AnimatedList } from '../components/Animations';
import { AlertIcon } from '../components/Icons';

type ScreenState = 'loading' | 'success' | 'empty' | 'error';
type FilterTab = 'all' | 'absence' | 'tests' | 'general';

const PRIORITY_BORDER: Record<string, string> = {
  high: 'var(--color-incorrect)',
  medium: 'var(--color-warning)',
  low: 'var(--color-pending)',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  absence: { bg: '#FFEBEE', text: 'var(--color-incorrect)' },
  tests: { bg: '#E3F2FD', text: 'var(--color-info)' },
  general: { bg: 'var(--color-cream-dark)', text: 'var(--color-brown-light)' },
  attendance: { bg: '#FFF3E0', text: 'var(--color-warning)' },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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

function SkeletonCard() {
  return (
    <div style={{ ...cardBase, paddingLeft: 20 }}>
      <Skeleton width="70%" height={14} />
      <div style={{ marginTop: 8 }}><Skeleton width="90%" height={12} /></div>
      <div style={{ marginTop: 8 }}><Skeleton width="30%" height={10} /></div>
    </div>
  );
}

const cardBase: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
  padding: 14,
  marginBottom: 10,
};

export default function AlertsScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    setScreenState('loading');
    try {
      const res = await api.get<ApiResponse<NotificationItem[]>>('/v1/notifications');
      if (res.data.length === 0) {
        setScreenState('empty');
      } else {
        setNotifications(res.data);
        setScreenState('success');
      }
    } catch (e) {
      setErrorMsg(e instanceof ApiClientError ? e.error.message : 'Failed to load alerts');
      setScreenState('error');
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await api.post<ApiResponse<unknown>>(`/v1/notifications/${id}/read`, {});
    } catch {
      /* optimistic update — don't revert for UX */
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.post<ApiResponse<unknown>>('/v1/notifications/read-all');
    } catch {
      /* optimistic */
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.category.toLowerCase() === filter;
  });

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'absence', label: 'Absence' },
    { key: 'tests', label: 'Tests' },
    { key: 'general', label: 'General' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.headerRow}>
          <h1 style={styles.pageTitle}>Alerts &amp; Messages</h1>
          {unreadCount > 0 && (
            <span style={styles.unreadBadge}>{unreadCount}</span>
          )}
        </div>

        {/* Mark All Read + Filter */}
        <div style={styles.topRow}>
          {unreadCount > 0 && (
            <button style={styles.markAllBtn} onClick={handleMarkAllRead}>
              Mark All Read
            </button>
          )}
        </div>

        <div style={styles.filterBar}>
          {filterTabs.map((t) => (
            <button
              key={t.key}
              style={{
                ...styles.filterTab,
                ...(filter === t.key ? styles.filterActive : {}),
              }}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {screenState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {screenState === 'error' && (
          <div style={styles.stateCard}>
            <p style={styles.stateText}>{errorMsg}</p>
            <button style={styles.retryBtn} onClick={fetchNotifications}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {screenState === 'empty' && (
          <div style={styles.stateCard}>
            <AlertIcon size={48} color="var(--color-text-muted)" />
            <p style={styles.stateText}>No alerts</p>
            <p style={styles.stateSubtext}>You're all caught up!</p>
          </div>
        )}

        {/* Success — filtered empty */}
        {screenState === 'success' && filtered.length === 0 && (
          <div style={styles.stateCard}>
            <AlertIcon size={40} color="var(--color-text-muted)" />
            <p style={styles.stateText}>No {filter} alerts</p>
          </div>
        )}

        {/* Notification Cards */}
        {screenState === 'success' && (
          <AnimatedList stagger={50}>
            {filtered.map((n) => {
              const borderColor = PRIORITY_BORDER[n.priority] ?? PRIORITY_BORDER.low;
              const catStyle = CATEGORY_COLORS[n.category.toLowerCase()] ?? CATEGORY_COLORS.general;
              return (
                <div
                  key={n.id}
                  style={{
                    ...cardBase,
                    borderLeft: `4px solid ${borderColor}`,
                    cursor: n.isRead ? 'default' : 'pointer',
                    opacity: n.isRead ? 0.75 : 1,
                  }}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                >
                  <div style={styles.notifHeader}>
                    <div style={styles.notifTitleRow}>
                      {!n.isRead && <span style={styles.unreadDot} />}
                      <span style={{
                        ...styles.notifTitle,
                        fontWeight: n.isRead ? 500 : 700,
                      }}>
                        {n.title}
                      </span>
                    </div>
                    <span style={styles.notifTime}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={styles.notifBody}>{n.body}</p>
                  <div style={styles.notifFooter}>
                    <span
                      style={{
                        ...styles.categoryBadge,
                        background: catStyle.bg,
                        color: catStyle.text,
                      }}
                    >
                      {n.category}
                    </span>
                    <span style={styles.priorityLabel}>{n.priority}</span>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
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
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-brown)',
  },
  unreadBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    height: 22,
    padding: '0 6px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-incorrect)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  markAllBtn: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    border: '1px solid var(--color-sage-light)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  filterBar: {
    display: 'flex',
    gap: 0,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 4,
    boxShadow: 'var(--shadow-sm)',
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    padding: '8px 0',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-muted)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'var(--transition)',
    textAlign: 'center',
  },
  filterActive: {
    background: 'var(--color-sage)',
    color: '#fff',
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notifTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--color-sage)',
    flexShrink: 0,
  },
  notifTitle: {
    fontSize: 14,
    color: 'var(--color-brown)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  notifTime: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    flexShrink: 0,
    marginLeft: 8,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--color-text-muted)',
    marginBottom: 8,
  },
  notifFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priorityLabel: {
    fontSize: 10,
    color: 'var(--color-text-muted)',
    textTransform: 'capitalize',
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 40,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  stateText: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: 13,
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
