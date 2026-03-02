/**
 * Mindforge Client — Login Screen (Task 6.2)
 *
 * 6-digit MPIN with on-screen keypad.
 * States: default, entering, loading, error (red border + message), locked (countdown).
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ApiClientError } from '../auth/AuthContext';

type ScreenState = 'default' | 'entering' | 'loading' | 'error' | 'locked';

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mpin, setMpin] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('default');
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const update = () => {
      const diff = Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));
      setCountdown(diff);
      if (diff <= 0) {
        setScreenState('default');
        setLockedUntil(null);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const handleDigit = useCallback((d: string) => {
    if (screenState === 'loading' || screenState === 'locked') return;
    setScreenState('entering');
    setErrorMsg('');
    setMpin((prev) => (prev.length < 6 ? prev + d : prev));
  }, [screenState]);

  const handleDelete = useCallback(() => {
    if (screenState === 'loading' || screenState === 'locked') return;
    setMpin((prev) => prev.slice(0, -1));
  }, [screenState]);

  const handleSubmit = useCallback(async () => {
    if (mpin.length !== 6 || screenState === 'loading') return;
    setScreenState('loading');
    try {
      await login(mpin);
      navigate('/home', { replace: true });
    } catch (err) {
      setMpin('');
      if (err instanceof ApiClientError) {
        const e = err.error;
        if (e.code === 'ACCOUNT_LOCKED') {
          setScreenState('locked');
          setLockedUntil((e as any).lockedUntil ?? null);
          setErrorMsg('Account locked. Please wait.');
          return;
        }
        setScreenState('error');
        setAttemptsRemaining((e as any).attemptsRemaining ?? null);
        setErrorMsg(e.message);
      } else {
        setScreenState('error');
        setErrorMsg('Something went wrong. Please try again.');
      }
    }
  }, [mpin, screenState, login, navigate]);

  useEffect(() => {
    if (mpin.length === 6 && screenState === 'entering') handleSubmit();
  }, [mpin, screenState, handleSubmit]);

  const isLocked = screenState === 'locked';
  const isLoading = screenState === 'loading';
  const isError = screenState === 'error';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src="/images/logo.png" alt="Mindforge" style={styles.logoImg} />
          <h1 style={styles.title}>Mindforge</h1>
          <p style={styles.subtitle}>Student Learning Experience</p>
        </div>

        <p style={styles.prompt}>Enter your 6-digit MPIN</p>

        {/* MPIN Dots */}
        <div style={styles.dotsRow} aria-label={`${mpin.length} of 6 digits entered`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                background: i < mpin.length ? 'var(--color-sage)' : 'transparent',
                borderColor: isError ? 'var(--color-incorrect)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* Error / Locked message */}
        {isError && (
          <p style={styles.error} role="alert">
            {errorMsg}
            {attemptsRemaining !== null && ` (${attemptsRemaining} attempts remaining)`}
          </p>
        )}
        {isLocked && (
          <p style={styles.error} role="alert">
            {errorMsg} Try again in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </p>
        )}

        {/* Loading */}
        {isLoading && <div style={styles.spinner} />}

        {/* Keypad */}
        <div style={styles.keypad}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
            <button
              key={key || 'empty'}
              style={{
                ...styles.key,
                ...(key === '' ? styles.keyEmpty : {}),
                opacity: isLocked || isLoading ? 0.4 : 1,
              }}
              disabled={isLocked || isLoading || key === ''}
              onClick={() => key === '⌫' ? handleDelete() : handleDigit(key)}
              aria-label={key === '⌫' ? 'Delete' : key || undefined}
            >
              {key}
            </button>
          ))}
        </div>

        <button style={styles.forgot} disabled={isLocked}>
          Forgot MPIN?
        </button>
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
    padding: 20,
    background: 'var(--color-bg)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  logo: { textAlign: 'center' as const, marginBottom: 8 },
  logoImg: { width: 100, height: 100, objectFit: 'contain' as const },
  title: { fontSize: 28, fontWeight: 700, color: 'var(--color-brown)', marginTop: 8 },
  subtitle: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  prompt: { fontSize: 15, color: 'var(--color-text-muted)' },
  dotsRow: { display: 'flex', gap: 14 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '2px solid var(--color-border)',
    transition: 'var(--transition)',
  },
  error: {
    fontSize: 13,
    color: 'var(--color-incorrect)',
    textAlign: 'center' as const,
    maxWidth: 280,
  },
  spinner: {
    width: 24,
    height: 24,
    border: '3px solid var(--color-cream-dark)',
    borderTopColor: 'var(--color-sage)',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 72px)',
    gap: 12,
    marginTop: 8,
  },
  key: {
    width: 72,
    height: 52,
    fontSize: 22,
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
    color: 'var(--color-brown)',
  },
  keyEmpty: { background: 'transparent', boxShadow: 'none', cursor: 'default' },
  forgot: {
    fontSize: 13,
    color: 'var(--color-sage-dark)',
    fontWeight: 500,
    marginTop: 8,
    padding: 8,
  },
};

const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (typeof document !== 'undefined' && !document.getElementById('spin-css')) {
  const s = document.createElement('style');
  s.id = 'spin-css';
  s.textContent = spinKeyframes;
  document.head.appendChild(s);
}
