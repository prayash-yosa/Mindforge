import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import type { ApiResponse } from '../api/types';

interface LoginPayload {
  token: string;
  teacherName: string;
  teacherId: string;
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<LoginPayload>>('/v1/auth/teacher/login', { email, password });
      login(res.data.token, res.data.teacherName, res.data.teacherId);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.error?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<LoginPayload>>('/v1/auth/demo-login', {});
      login(res.data.token, res.data.teacherName, res.data.teacherId);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.error?.message ?? 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.brand}>
          <img src="/images/logo.png" alt="Mindforge" style={s.logoImg} />
          <h1 style={s.title}>Mindforge</h1>
          <p style={s.subtitle}>Teacher Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="teacher@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.input}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span style={s.dividerText}>or</span>
          <span style={s.dividerLine} />
        </div>

        <button onClick={handleDemoLogin} style={s.demoBtn}>
          Demo Login
        </button>

        <p style={s.footer}>
          Mindforge Education Platform &middot; For Teachers
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-cream)',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  brand: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  logoImg: {
    width: 80,
    height: 80,
    borderRadius: 'var(--radius-lg)',
    objectFit: 'contain' as const,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--color-brown)',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: 'var(--color-surface)',
    padding: 24,
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-brown)',
  },
  input: {
    height: 48,
    padding: '0 14px',
    fontSize: 15,
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-border)',
    outline: 'none',
    background: 'var(--color-cream)',
    color: 'var(--color-text)',
    transition: 'var(--transition)',
  },
  error: {
    fontSize: 13,
    color: 'var(--color-incorrect)',
    background: '#fce4ec',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
  },
  btn: {
    height: 48,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-sage)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'var(--transition)',
    marginTop: 4,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--color-border)',
  },
  dividerText: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  demoBtn: {
    height: 48,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface)',
    color: 'var(--color-sage-dark)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1.5px solid var(--color-sage-light)',
    transition: 'var(--transition)',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginTop: 8,
  },
};
