import { useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardIcon, ClassesIcon, SyllabusIcon, TestsIcon, AnalyticsIcon } from './Icons';

const tabs = [
  { path: '/dashboard', label: 'Home', Icon: DashboardIcon },
  { path: '/classes', label: 'Classes', Icon: ClassesIcon },
  { path: '/syllabus', label: 'Syllabus', Icon: SyllabusIcon },
  { path: '/tests', label: 'Tests', Icon: TestsIcon },
  { path: '/analytics', label: 'Results', Icon: AnalyticsIcon },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleTap = useCallback((path: string) => {
    const el = tabRefs.current[path];
    if (el) {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = 'navBounce 0.35s cubic-bezier(0.22,1,0.36,1)';
    }
    navigate(path);
  }, [navigate]);

  return (
    <nav style={styles.nav}>
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path);
        const color = active ? 'var(--color-sage-dark)' : 'var(--color-text-muted)';
        return (
          <button
            key={tab.path}
            ref={(el) => { tabRefs.current[tab.path] = el; }}
            onClick={() => handleTap(tab.path)}
            style={{ ...styles.tab, color }}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
          >
            <div style={styles.iconWrap}>
              <tab.Icon size={22} color={color} />
              {active && <div style={styles.activeDot} />}
            </div>
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
    height: 64,
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
    maxWidth: 480,
    margin: '0 auto',
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '6px 12px',
    transition: 'color 0.2s ease',
    minWidth: 56,
  },
  iconWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--color-sage-dark)',
  },
  label: { fontSize: 10, letterSpacing: 0.2 },
};
