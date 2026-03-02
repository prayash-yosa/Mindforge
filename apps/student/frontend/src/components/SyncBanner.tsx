import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { SyncStatus } from '../api/types';

const POLL_INTERVAL_MS = 60_000;

export function SyncBanner() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [showConflict, setShowConflict] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await api.get<SyncStatus>('/v1/student/sync/status');
      setStatus(res);
      if (res.hasConflict) setShowConflict(true);
    } catch { /* silent — non-critical */ }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  if (!status) return null;

  return (
    <>
      {/* Status banner */}
      <div style={s.banner}>
        <span style={s.dot(status.hasConflict)} />
        <span style={s.text}>
          {status.hasConflict ? 'Sync conflict detected' : 'All caught up!'}
        </span>
      </div>

      {/* Conflict modal */}
      {showConflict && (
        <div style={s.overlay} onClick={() => setShowConflict(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Found newer progress on another device</h3>
            <p style={s.modalDesc}>{status.conflictHint ?? 'Your progress may be out of sync.'}</p>
            <div style={s.modalActions}>
              <button style={s.btnOutline} onClick={() => setShowConflict(false)}>
                Keep Current
              </button>
              <button style={s.btnPrimary} onClick={() => { setShowConflict(false); window.location.reload(); }}>
                Use Latest
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  banner: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 12px', borderRadius: 'var(--radius-full)',
    background: 'var(--color-cream-dark)', marginBottom: 12,
  } as React.CSSProperties,

  dot: (conflict: boolean): React.CSSProperties => ({
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    background: conflict ? 'var(--color-warning)' : 'var(--color-correct)',
  }),

  text: { fontSize: 12, color: 'var(--color-text-muted)' } as React.CSSProperties,

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 16,
  } as React.CSSProperties,

  modal: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
    padding: 24, maxWidth: 360, width: '100%', boxShadow: 'var(--shadow-md)',
  } as React.CSSProperties,

  modalTitle: { fontSize: 16, fontWeight: 700, color: 'var(--color-brown)', marginBottom: 8 } as React.CSSProperties,
  modalDesc: { fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 } as React.CSSProperties,

  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' } as React.CSSProperties,

  btnOutline: {
    padding: '10px 18px', borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-brown)',
  } as React.CSSProperties,

  btnPrimary: {
    padding: '10px 18px', borderRadius: 'var(--radius-full)',
    background: 'var(--color-sage)', color: '#fff', fontWeight: 600, fontSize: 13,
  } as React.CSSProperties,
};
