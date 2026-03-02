/**
 * Mindforge Client — Splash Screen
 *
 * Shows the Mindforge logo with a fade-in animation for 2 seconds,
 * then navigates to /login (or /home if already authenticated).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/home' : '/login', { replace: true });
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated]);

  return (
    <div style={styles.container}>
      <div style={{ ...styles.logoWrap, opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.85)' }}>
        <img
          src="/images/logo.png"
          alt="Mindforge"
          style={styles.logo}
        />
        <h1 style={styles.title}>Mindforge</h1>
        <p style={styles.subtitle}>Student Learning Experience</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
  },
  logoWrap: {
    textAlign: 'center' as const,
    transition: 'opacity 0.8s ease, transform 0.8s ease',
  },
  logo: {
    width: 300,
    height: 300,
    objectFit: 'contain' as const,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: 'var(--color-brown)',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    marginTop: 6,
  },
};
