import { useEffect, useState, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import { api, ApiClientError } from '../api/client';
import type { ApiResponse, SyllabusDocument, LessonDetail, ClassInfo } from '../api/types';
import { AnimatedList } from '../components/Animations';
import { UploadIcon, RefreshIcon } from '../components/Icons';

type ScreenState = 'loading' | 'success' | 'empty' | 'error';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending: { bg: 'var(--color-pending)', text: '#fff' },
  Processing: { bg: 'var(--color-info)', text: '#fff' },
  Ready: { bg: 'var(--color-correct)', text: '#fff' },
  Failed: { bg: 'var(--color-incorrect)', text: '#fff' },
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
    <div style={styles.card}>
      <Skeleton width="60%" height={14} />
      <div style={{ marginTop: 8 }}><Skeleton width="40%" height={12} /></div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <Skeleton width={60} height={20} />
        <Skeleton width={50} height={12} />
      </div>
    </div>
  );
}

export default function SyllabusScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [documents, setDocuments] = useState<SyllabusDocument[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [classDate, setClassDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await api.get<ApiResponse<SyllabusDocument[]>>(`/v1/syllabus/class/${classId}`);
      if (res.data.length === 0) {
        setDocuments([]);
        setScreenState('empty');
      } else {
        setDocuments(res.data);
        setScreenState('success');
      }
    } catch {
      setDocuments([]);
      setErrorMsg('No syllabus documents found. Upload one to get started.');
      setScreenState('error');
    }
  }, [classId]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ClassInfo[]>>('/v1/classes');
      setClasses(res.data);
      if (res.data.length > 0 && !classId) setClassId(res.data[0].id);
    } catch {
      /* classes dropdown will be empty */
    }
  }, [classId]);

  useEffect(() => {
    fetchDocuments();
    fetchClasses();
  }, [fetchDocuments, fetchClasses]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file || !classId) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', classId);
      formData.append('subject', subject);
      if (classDate) formData.append('classDate', classDate);
      await api.upload<ApiResponse<SyllabusDocument>>('/v1/syllabus/upload', formData);
      setFile(null);
      setSubject('');
      setClassDate('');
      if (fileRef.current) fileRef.current.value = '';
      await fetchDocuments();
    } catch (e) {
      setUploadError(e instanceof ApiClientError ? e.error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleRetry(docId: string) {
    try {
      await api.post<ApiResponse<SyllabusDocument>>(`/v1/syllabus/${docId}/retry`);
      await fetchDocuments();
    } catch {
      /* silently fail */
    }
  }

  async function handleDocTap(doc: SyllabusDocument) {
    if (doc.status !== 'Ready') return;
    setLessonLoading(true);
    try {
      const res = await api.get<ApiResponse<LessonDetail>>(`/v1/syllabus/${doc.id}/lesson`);
      setSelectedLesson(res.data);
    } catch {
      setSelectedLesson(null);
    } finally {
      setLessonLoading(false);
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  if (selectedLesson) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <button style={styles.backBtn} onClick={() => setSelectedLesson(null)}>
            &larr; Back to Syllabus
          </button>
          <div style={styles.card}>
            <h2 style={styles.lessonTitle}>Lesson Detail</h2>
            <div style={{ marginTop: 12 }}>
              <h3 style={styles.sectionLabel}>Concept Summary</h3>
              <p style={styles.bodyText}>{selectedLesson.conceptSummary}</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={styles.sectionLabel}>Learning Objectives</h3>
              <ul style={styles.objectivesList}>
                {selectedLesson.learningObjectives.map((obj, i) => (
                  <li key={i} style={styles.objectiveItem}>{obj}</li>
                ))}
              </ul>
            </div>
            {selectedLesson.hasNumericals && (
              <div style={styles.numericsBadge}>Contains Numericals</div>
            )}
            <div style={{ marginTop: 16 }}>
              <h3 style={styles.sectionLabel}>Chapters</h3>
              <div style={styles.tagRow}>
                {selectedLesson.chapters.map((ch, i) => (
                  <span key={i} style={styles.tag}>{ch}</span>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={styles.sectionLabel}>Topics</h3>
              <div style={styles.tagRow}>
                {selectedLesson.topics.map((t, i) => (
                  <span key={i} style={styles.tag}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Syllabus</h1>

        {/* Upload Zone */}
        <form onSubmit={handleUpload} style={styles.card}>
          <div
            style={{
              ...styles.dropZone,
              borderColor: dragOver ? 'var(--color-sage)' : 'var(--color-border)',
              background: dragOver ? 'var(--color-cream-dark)' : 'var(--color-cream)',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon size={32} color="var(--color-sage)" />
            <p style={styles.dropLabel}>
              {file ? file.name : 'Drag & drop or tap to upload'}
            </p>
            {file && (
              <span style={styles.fileSize}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          <div style={styles.formGrid}>
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
                type="text"
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Class Date</label>
              <input
                style={styles.input}
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
              />
            </div>
          </div>

          {uploadError && <p style={styles.errorText}>{uploadError}</p>}

          <button
            type="submit"
            style={{
              ...styles.primaryBtn,
              opacity: uploading || !file ? 0.6 : 1,
            }}
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>

        {/* Recent Uploads */}
        <h2 style={styles.sectionTitle}>Recent Uploads</h2>

        {screenState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {screenState === 'error' && (
          <div style={styles.stateCard}>
            <p style={styles.stateText}>{errorMsg}</p>
            <button style={styles.retryBtn} onClick={fetchDocuments}>
              <RefreshIcon size={16} color="var(--color-sage-dark)" /> Retry
            </button>
          </div>
        )}

        {screenState === 'empty' && (
          <div style={styles.stateCard}>
            <UploadIcon size={40} color="var(--color-text-muted)" />
            <p style={styles.stateText}>No documents uploaded yet</p>
          </div>
        )}

        {screenState === 'success' && (
          <AnimatedList stagger={60}>
            {documents.map((doc) => {
              const statusStyle = STATUS_COLORS[doc.status] ?? STATUS_COLORS.Pending;
              return (
                <div
                  key={doc.id}
                  style={{
                    ...styles.card,
                    cursor: doc.status === 'Ready' ? 'pointer' : 'default',
                    marginBottom: 12,
                  }}
                  onClick={() => handleDocTap(doc)}
                >
                  <div style={styles.cardHeader}>
                    <span style={styles.fileName}>{doc.fileName}</span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <p style={styles.cardMeta}>
                    {doc.subject} &middot; {timeAgo(doc.uploadedAt)}
                  </p>
                  {doc.status === 'Failed' && (
                    <button
                      style={styles.retryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(doc.id);
                      }}
                    >
                      <RefreshIcon size={14} color="var(--color-sage-dark)" /> Retry
                    </button>
                  )}
                  {doc.status === 'Ready' && (
                    <p style={styles.tapHint}>Tap to view lesson &rarr;</p>
                  )}
                </div>
              );
            })}
          </AnimatedList>
        )}

        {lessonLoading && (
          <div style={styles.stateCard}>
            <Skeleton width="80%" height={14} />
            <div style={{ marginTop: 8 }}><Skeleton width="60%" height={12} /></div>
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
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    padding: 16,
    marginBottom: 12,
  },
  dropZone: {
    border: '2px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginBottom: 16,
  },
  dropLabel: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-brown)',
    marginTop: 20,
    marginBottom: 12,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-brown)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '70%',
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
    marginTop: 6,
  },
  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    border: '1px solid var(--color-sage-light)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    cursor: 'pointer',
  },
  tapHint: {
    fontSize: 12,
    color: 'var(--color-sage)',
    marginTop: 8,
    fontWeight: 500,
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 32,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  stateText: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: 'var(--color-incorrect)',
    marginBottom: 8,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-sage-dark)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-brown)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--color-brown)',
  },
  objectivesList: {
    listStyle: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  objectiveItem: {
    fontSize: 14,
    color: 'var(--color-brown)',
    paddingLeft: 16,
    position: 'relative',
  },
  numericsBadge: {
    display: 'inline-block',
    marginTop: 12,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-info)',
    background: '#E3F2FD',
    borderRadius: 'var(--radius-full)',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-cream-dark)',
    color: 'var(--color-brown)',
    fontWeight: 500,
  },
};
