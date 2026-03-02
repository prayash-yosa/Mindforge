import { useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, CalendarIcon, ChatIcon, UserIcon } from './Icons';

const tabs = [
  { path: '/home', label: 'Home', Icon: HomeIcon },
  { path: '/attendance', label: 'Attendance', Icon: CalendarIcon },
  { path: '/doubts', label: 'Doubts', Icon: ChatIcon },
  { path: '/profile', label: 'Profile', Icon: UserIcon },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path);
        const color = active ? 'var(--color-sage-dark)' : 'var(--color-text-muted)';
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{ ...styles.tab, color }}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            <tab.Icon size={22} color={color} />
            <span style={{ ...styles.label, fontWeight: active ? 600 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
    maxWidth: 480,
    margin: '0 auto',
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '6px 16px',
    transition: 'var(--transition)',
  },
  label: { fontSize: 11 },
};
