import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { api, ApiClientError } from '../api/client';
import type {
  ApiResponse,
  TestDefinition,
  PdfContent,
  ClassInfo,
  LessonDetail,
} from '../api/types';
import { TestsIcon, DownloadIcon } from '../components/Icons';

type ScreenState = 'loading' | 'success' | 'empty' | 'error';
type Tab = 'online' | 'offline';

const TEST_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'var(--color-pending)', text: '#fff' },
  published: { bg: 'var(--color-correct)', text: '#fff' },
  closed: { bg: 'var(--color-brown-light)', text: '#fff' },
  generated: { bg: 'var(--color-info)', text: '#fff' },
};

const QUESTION_TYPES_ONLINE = 'mcq,true_false,short_answer';
const QUESTION_TYPES_OFFLINE = 'mcq,true_false,short_answer,long_answer,numerical,diagram,fill_blank';

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
    <div style={styles.card}>
      <Skeleton width="70%" height={14} />
      <div style={{ marginTop: 8 }}><Skeleton width="50%" height={12} /></div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <Skeleton width={60} height={20} />
        <Skeleton width={40} height={12} />
      </div>
    </div>
  );
}

export default function TestsScreen() {
  const [tab, setTab] = useState<Tab>('online');
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [lessons, setLessons] = useState<LessonDetail[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [lessonId, setLessonId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchTests = useCallback(async () => {
    if (!classId) return;
    setScreenState('loading');
    try {
      const mode = tab === 'online' ? 'online' : 'offline';
      const res = await api.get<ApiResponse<TestDefinition[]>>(`/v1/tests/class/${classId}?mode=${mode}`);
      if (res.data.length === 0) {
        setTests([]);
        setScreenState('empty');
      } else {
        setTests(res.data);
        setScreenState('success');
      }
    } catch {
      setTests([]);
      setErrorMsg('No tests found. Create a new test to get started.');
      setScreenState('error');
    }
  }, [tab, classId]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ClassInfo[]>>('/v1/classes');
      setClasses(res.data);
      if (res.data.length > 0 && !classId) setClassId(res.data[0].id);
    } catch {
      /* dropdown will be empty */
    }
  }, [classId]);

  const fetchLessons = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await api.get<ApiResponse<LessonDetail[]>>(`/v1/syllabus/lessons/class/${classId}`);
      setLessons(res.data);
    } catch {
      setLessons([]);
    }
  }, [classId]);

  useEffect(() => { fetchTests(); }, [fetchTests]);
  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title || !classId) return;
    setCreating(true);
    setCreateError('');
    const mode = tab === 'online' ? 'online' : 'offline';
    const questionTypes = tab === 'online' ? QUESTION_TYPES_ONLINE : QUESTION_TYPES_OFFLINE;
    try {
      await api.post<ApiResponse<TestDefinition>>('/v1/tests', {
        title,
        classId,
        subject,
        mode,
        totalMarks: Number(totalMarks),
        durationMinutes: Number(durationMinutes),
        questionTypes,
        lessonSessionId: lessonId || undefined,
      });
      setTitle('');
      setSubject('');
      setTotalMarks('100');
      setDurationMinutes('60');
      setLessonId('');
      setShowForm(false);
      await fetchTests();
    } catch (e) {
      setCreateError(e instanceof ApiClientError ? e.error.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerate(testId: string) {
    try {
      await api.post<ApiResponse<unknown>>(`/v1/tests/${testId}/generate`);
      await fetchTests();
    } catch {
      /* silent */
    }
  }

  async function handlePublish(testId: string) {
    try {
      await api.post<ApiResponse<unknown>>(`/v1/tests/${testId}/publish`, {});
      await fetchTests();
    } catch {
      /* silent */
    }
  }

  async function handleClose(testId: string) {
    try {
      await api.post<ApiResponse<unknown>>(`/v1/tests/${testId}/close`, {});
      await fetchTests();
    } catch {
      /* silent */
    }
  }

  async function handleDownloadPdf(testId: string) {
    try {
      const res = await api.get<ApiResponse<PdfContent>>(`/v1/tests/${testId}/pdf`);
      const blob = new Blob([res.data.studentPaper], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${res.data.metadata.title}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Tests</h1>

        {/* Tabs */}
        <div style={styles.tabBar}>
          <button
            style={{
              ...styles.tabBtn,
              ...(tab === 'online' ? styles.tabActive : {}),
            }}
            onClick={() => { setTab('online'); setShowForm(false); }}
          >
            Online Quiz
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(tab === 'offline' ? styles.tabActive : {}),
            }}
            onClick={() => { setTab('offline'); setShowForm(false); }}
          >
            Offline Test
          </button>
        </div>

        {/* Create Toggle */}
        <button
          style={styles.createToggle}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : `+ Create ${tab === 'online' ? 'Quiz' : 'Test'}`}
        </button>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} style={styles.card}>
            <div style={styles.formGrid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Title</label>
                <input
                  style={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Quiz"
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Class</label>
                <select
                  style={styles.select}
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
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Subject</label>
                <input
                  style={styles.input}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics"
                />
              </div>
              <div style={styles.row}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Total Marks</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    min="1"
                  />
                </div>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Duration (min)</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min="5"
                  />
                </div>
              </div>
              {tab === 'online' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Linked Lesson</label>
                  <select
                    style={styles.select}
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                  >
                    <option value="">None</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.subject} – {l.chapters[0] ?? 'Lesson'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {tab === 'offline' && (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Question Types</label>
                  <p style={styles.hintText}>
                    MCQ, True/False, Short Answer, Long Answer, Numerical, Diagram, Fill-in-the-Blank
                  </p>
                </div>
              )}
            </div>

            {createError && <p style={styles.errorText}>{createError}</p>}

            <button
              type="submit"
              style={{ ...styles.primaryBtn, opacity: creating ? 0.6 : 1 }}
              disabled={creating}
            >
              {creating
                ? 'Creating...'
                : tab === 'online'
                  ? 'Create & Generate Questions'
                  : 'Create Test'}
            </button>
          </form>
        )}

        {/* Test List */}
        {screenState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {screenState === 'error' && (
          <div style={styles.stateCard}>
            <p style={styles.stateText}>{errorMsg}</p>
            <button style={styles.retryBtnOutline} onClick={fetchTests}>
              Retry
            </button>
          </div>
        )}

        {screenState === 'empty' && (
          <div style={styles.stateCard}>
            <TestsIcon size={40} color="var(--color-text-muted)" />
            <p style={styles.stateText}>
              No {tab === 'online' ? 'quizzes' : 'tests'} yet
            </p>
          </div>
        )}

        {screenState === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {tests.map((test) => {
                const statusStyle = TEST_STATUS_COLORS[test.status] ?? TEST_STATUS_COLORS.draft;
                return (
                  <div key={test.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.testTitle}>{test.title}</span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {test.status}
                    </span>
                  </div>
                  <p style={styles.cardMeta}>
                    {test.subject} &middot; {test.totalMarks} marks &middot; {test.durationMinutes} min
                  </p>
                  <p style={styles.cardMeta}>
                    Types: {test.questionTypes.replace(/,/g, ', ')}
                  </p>

                  <div style={styles.actionRow}>
                    {tab === 'online' && test.status === 'draft' && (
                      <>
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleGenerate(test.id)}
                        >
                          Generate Questions
                        </button>
                        <button
                          style={styles.actionBtnGreen}
                          onClick={() => handlePublish(test.id)}
                        >
                          Publish
                        </button>
                      </>
                    )}
                    {tab === 'online' && test.status === 'published' && (
                      <button
                        style={styles.actionBtnRed}
                        onClick={() => handleClose(test.id)}
                      >
                        Close
                      </button>
                    )}
                    {tab === 'offline' && test.status === 'draft' && (
                      <button
                        style={styles.actionBtn}
                        onClick={() => handleGenerate(test.id)}
                      >
                        Generate &amp; Download
                      </button>
                    )}
                    {tab === 'offline' && (test.status === 'generated' || test.status === 'published') && (
                      <button
                        style={styles.actionBtn}
                        onClick={() => handleDownloadPdf(test.id)}
                      >
                        <DownloadIcon size={14} color="var(--color-sage-dark)" /> Download PDF
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
    overflowX: 'hidden',
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
  tabBar: {
    display: 'flex',
    gap: 0,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 4,
    boxShadow: 'var(--shadow-sm)',
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-muted)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  tabActive: {
    background: 'var(--color-sage)',
    color: '#fff',
  },
  createToggle: {
    display: 'block',
    width: '100%',
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    marginBottom: 16,
    textAlign: 'center',
    border: '1px dashed var(--color-sage-light)',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    padding: 16,
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: 14,
    color: 'var(--color-brown)',
    background: 'var(--color-cream)',
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: 14,
    color: 'var(--color-brown)',
    background: 'var(--color-cream)',
    outline: 'none',
    appearance: 'none',
  },
  hintText: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
  },
  primaryBtn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-sage)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  errorText: {
    fontSize: 13,
    color: 'var(--color-incorrect)',
    marginBottom: 8,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-brown)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '65%',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 'var(--radius-full)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardMeta: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginTop: 4,
  },
  actionRow: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    border: '1px solid var(--color-sage-light)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  actionBtnGreen: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-correct)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  actionBtnRed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-incorrect)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 32,
    marginTop: 12,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  stateText: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  retryBtnOutline: {
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
