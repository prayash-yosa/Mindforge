import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import type { DoubtThread, DoubtThreadDetail, SyllabusTree } from '../api/types';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';

type View = 'list' | 'chat';

export function DoubtsScreen() {
  const [view, setView] = useState<View>('list');
  const [threads, setThreads] = useState<DoubtThread[]>([]);
  const [activeThread, setActiveThread] = useState<DoubtThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Syllabus context */
  const [tree, setTree] = useState<SyllabusTree | null>(null);
  const [ctxSubject, setCtxSubject] = useState('');
  const [ctxChapter, setCtxChapter] = useState('');
  const [ctxTopic, setCtxTopic] = useState('');
  const [showCtxPicker, setShowCtxPicker] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, syllabus] = await Promise.all([
        api.get<DoubtThread[]>('/v1/student/doubts'),
        tree ? Promise.resolve(tree) : api.get<SyllabusTree>('/v1/student/syllabus/tree'),
      ]);
      setThreads(list);
      if (!tree) {
        setTree(syllabus);
        if (syllabus.subjects.length && !ctxSubject) {
          setCtxSubject(syllabus.subjects[0].subject);
        }
      }
    } catch (e: any) {
      setError(e?.error?.message ?? 'Failed to load doubts.');
    } finally {
      setLoading(false);
    }
  }, [tree, ctxSubject]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = async (threadId: string) => {
    setLoading(true);
    try {
      const detail = await api.get<DoubtThreadDetail>(`/v1/student/doubts/${threadId}`);
      setActiveThread(detail);
      setView('chat');
    } catch (e: any) {
      setError(e?.error?.message ?? 'Failed to load thread.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setView('list');
    setActiveThread(null);
    loadThreads();
  };

  const subjects = tree?.subjects ?? [];
  const chapters = subjects.find((s) => s.subject === ctxSubject)?.chapters ?? [];
  const topics = chapters.find((c) => c.chapter === ctxChapter)?.topics ?? [];

  const contextLabel = [ctxSubject, ctxChapter, ctxTopic].filter(Boolean).join(' · ') || 'Select context';

  return (
    <div style={s.page}>
      <div style={s.content}>
        {/* Header */}
        <div style={s.headerRow}>
          {view === 'chat' && (
            <button style={s.backBtn} onClick={handleBack} aria-label="Back to threads">
              <BackArrow />
            </button>
          )}
          <h1 style={s.title}>{view === 'list' ? 'Doubts' : (activeThread?.title ?? 'Conversation')}</h1>
        </div>

        {/* Context bar */}
        <button style={s.ctxBar} onClick={() => setShowCtxPicker(!showCtxPicker)}>
          <span style={s.ctxLabel}>{contextLabel}</span>
          <span style={s.ctxChange}>{showCtxPicker ? 'Done' : 'Change'}</span>
        </button>
        {showCtxPicker && (
          <div style={s.ctxPicker}>
            <CtxSelect label="Subject" value={ctxSubject} options={subjects.map((s) => s.subject)}
              onChange={(v) => { setCtxSubject(v); setCtxChapter(''); setCtxTopic(''); }} />
            {chapters.length > 0 && (
              <CtxSelect label="Chapter" value={ctxChapter} options={chapters.map((c) => c.chapter)}
                onChange={(v) => { setCtxChapter(v); setCtxTopic(''); }} />
            )}
            {topics.length > 0 && (
              <CtxSelect label="Topic" value={ctxTopic} options={topics.map((t) => t.topic)}
                onChange={setCtxTopic} />
            )}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {[1,2,3].map((i) => <Skeleton key={i} height={64} />)}
          </div>
        )}

        {error && !loading && (
          <div style={s.errorCard}>
            <p>{error}</p>
            <button style={s.retryBtn} onClick={loadThreads}>Retry</button>
          </div>
        )}

        {!loading && !error && view === 'list' && (
          <ThreadList threads={threads} onOpen={openThread} onNew={() => setView('chat')} />
        )}

        {!loading && !error && view === 'chat' && (
          <ChatView
            thread={activeThread}
            syllabusContext={{ syllabusSubject: ctxSubject, syllabusChapter: ctxChapter, syllabusTopic: ctxTopic }}
            onMessageSent={(updated) => setActiveThread(updated)}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}

/* ── Thread List ──────────────────────────── */
function ThreadList({ threads, onOpen, onNew }: {
  threads: DoubtThread[];
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      <button style={s.newBtn} onClick={onNew}>Ask a Doubt</button>
      {threads.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: 24, fontSize: 14 }}>
          No doubts yet. Ask your first question!
        </p>
      )}
      {threads.map((t) => (
        <button key={t.id} style={s.threadCard} onClick={() => onOpen(t.id)}>
          <div style={s.threadTop}>
            <span style={s.threadTitle}>{t.title ?? 'Untitled'}</span>
            {t.isResolved && <span style={s.resolvedBadge}>Resolved</span>}
          </div>
          <span style={s.threadMeta}>
            {[t.syllabusContext.subject, t.syllabusContext.chapter].filter(Boolean).join(' · ')}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Chat View ────────────────────────────── */
function ChatView({ thread, syllabusContext, onMessageSent }: {
  thread: DoubtThreadDetail | null;
  syllabusContext: { syllabusSubject: string; syllabusChapter: string; syllabusTopic: string };
  onMessageSent: (updated: DoubtThreadDetail) => void;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = thread?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await api.post<DoubtThreadDetail>('/v1/student/doubts', {
        message: text,
        threadId: thread?.id,
        ...syllabusContext,
      });
      onMessageSent(res);
      setInput('');
    } catch {
      /* display existing messages — user can retry */
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={s.chatContainer}>
      <div ref={scrollRef} style={s.chatScroll}>
        {messages.length === 0 && !sending && (
          <p style={s.chatPlaceholder}>Ask a doubt and the AI tutor will help you.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ ...s.bubble, ...(m.role === 'student' ? s.bubbleStudent : s.bubbleAi) }}>
            <span style={s.bubbleRole}>{m.role === 'student' ? 'You' : 'AI Tutor'}</span>
            <p style={s.bubbleText}>{m.content}</p>
          </div>
        ))}
        {sending && (
          <div style={{ ...s.bubble, ...s.bubbleAi }}>
            <span style={s.bubbleRole}>AI Tutor</span>
            <p style={{ ...s.bubbleText, fontStyle: 'italic', opacity: 0.7 }}>Thinking...</p>
          </div>
        )}
      </div>
      <div style={s.inputRow}>
        <input
          style={s.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type your doubt..."
          disabled={sending}
          aria-label="Type your doubt"
        />
        <button style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.5 }} onClick={send} disabled={sending || !input.trim()}>
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

/* ── Small components ─────────────────────── */
function CtxSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div style={s.ctxField}>
      <label style={s.ctxFieldLabel}>{label}</label>
      <select
        style={s.ctxFieldSelect}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/* ── Styles ────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', paddingBottom: 80, display: 'flex', flexDirection: 'column' },
  content: { maxWidth: 480, margin: '0 auto', padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column', width: '100%' },
  headerRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--color-brown)' },

  ctxBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    background: 'var(--color-cream-dark)', marginBottom: 8,
  },
  ctxLabel: { fontSize: 13, fontWeight: 500, color: 'var(--color-brown)' },
  ctxChange: { fontSize: 12, fontWeight: 600, color: 'var(--color-sage-dark)' },
  ctxPicker: {
    display: 'flex', flexDirection: 'column' as const, gap: 8,
    padding: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', marginBottom: 8,
  },
  ctxField: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  ctxFieldLabel: { fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' },
  ctxFieldSelect: {
    padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
    fontSize: 13, background: '#fff', color: 'var(--color-brown)',
  },

  errorCard: {
    textAlign: 'center' as const, background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)', padding: 24, color: 'var(--color-incorrect)',
  },
  retryBtn: {
    marginTop: 12, padding: '8px 24px', background: 'var(--color-sage)',
    color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: 14,
  },
  newBtn: {
    padding: '12px 0', borderRadius: 'var(--radius-full)',
    background: 'var(--color-sage)', color: '#fff', fontWeight: 600, fontSize: 14,
  },
  threadCard: {
    width: '100%', textAlign: 'left' as const, padding: 14,
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' as const, gap: 4,
  },
  threadTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  threadTitle: { fontSize: 14, fontWeight: 600, color: 'var(--color-brown)' },
  resolvedBadge: {
    fontSize: 10, fontWeight: 600, color: '#fff',
    background: 'var(--color-correct)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
  },
  threadMeta: { fontSize: 12, color: 'var(--color-text-muted)' },

  chatContainer: { flex: 1, display: 'flex', flexDirection: 'column' as const, marginTop: 8 },
  chatScroll: {
    flex: 1, overflowY: 'auto' as const, paddingBottom: 12,
    display: 'flex', flexDirection: 'column' as const, gap: 10,
    maxHeight: 'calc(100vh - 300px)',
  },
  chatPlaceholder: { textAlign: 'center' as const, color: 'var(--color-text-muted)', marginTop: 40, fontSize: 14 },
  bubble: { padding: '10px 14px', borderRadius: 'var(--radius-md)', maxWidth: '85%' },
  bubbleStudent: {
    alignSelf: 'flex-end' as const, background: 'var(--color-sage-light)', color: 'var(--color-brown)',
  },
  bubbleAi: {
    alignSelf: 'flex-start' as const, background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
  },
  bubbleRole: { fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 3 },
  bubbleText: { fontSize: 14, lineHeight: '1.5' },

  inputRow: {
    display: 'flex', gap: 8, marginTop: 8, padding: '8px 0',
  },
  chatInput: {
    flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-full)',
    border: '1px solid var(--color-border)', fontSize: 14, outline: 'none',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', background: 'var(--color-sage)',
  },
};
