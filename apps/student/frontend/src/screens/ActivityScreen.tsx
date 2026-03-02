/**
 * Mindforge Client — Activity Screen (Task 6.4)
 *
 * Question flow with answer submission and AI feedback panel.
 * States: loading, active (question display), submitting, correct, incorrect (AI feedback),
 *         AI thinking, AI error ("View Standard Hint" + "Try Again"), complete.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Activity, Question, AnswerResult, FeedbackResult } from '../api/types';

type FlowState = 'loading' | 'question' | 'submitting' | 'correct' | 'incorrect' | 'complete' | 'error';

export function ActivityScreen() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    setFlowState('loading');
    try {
      const data = await api.get<Activity>(`/v1/student/activities/${type}/${id}`);
      setActivity(data);
      const firstUnanswered = data.questions.findIndex((q) => !q.answered);
      setCurrentIdx(firstUnanswered >= 0 ? firstUnanswered : 0);
      setFlowState(data.status === 'completed' ? 'complete' : 'question');
    } catch (e: any) {
      setErrorMsg(e?.error?.message ?? 'Failed to load activity.');
      setFlowState('error');
    }
  }, [type, id]);

  useEffect(() => { load(); }, [load]);

  const currentQuestion: Question | undefined = activity?.questions[currentIdx];
  const totalQ = activity?.questions.length ?? 0;
  const answeredCount = activity?.questions.filter((q) => q.answered).length ?? 0;

  const handleSubmit = async () => {
    if (!currentQuestion || !activity) return;
    const answerText = currentQuestion.options ? selectedOption ?? '' : answer;
    if (!answerText.trim()) return;

    setFlowState('submitting');
    try {
      const result = await api.post<AnswerResult>(
        `/v1/student/activities/${type}/${id}/respond`,
        { questionId: currentQuestion.id, answer: answerText },
      );
      setLastResult(result);
      setFeedback(null);

      if (result.isComplete) {
        setFlowState('complete');
      } else {
        setFlowState(result.isCorrect ? 'correct' : 'incorrect');
      }

      // Mark as answered locally
      if (activity) {
        const updated = { ...activity };
        const q = updated.questions.find((q) => q.id === currentQuestion.id);
        if (q) q.answered = true;
        setActivity(updated);
      }
    } catch (e: any) {
      setErrorMsg(e?.error?.message ?? 'Submission failed.');
      setFlowState('error');
    }
  };

  const handleNext = () => {
    if (!activity) return;
    setAnswer('');
    setSelectedOption(null);
    setLastResult(null);
    setFeedback(null);
    const nextIdx = activity.questions.findIndex((q, i) => i > currentIdx && !q.answered);
    if (nextIdx >= 0) {
      setCurrentIdx(nextIdx);
      setFlowState('question');
    } else {
      setFlowState('complete');
    }
  };

  const handleMoreHelp = async () => {
    if (!currentQuestion || !activity) return;
    setFeedbackLoading(true);
    try {
      const level = feedback?.nextLevel ?? undefined;
      const url = `/v1/student/activities/${type}/${id}/feedback?questionId=${currentQuestion.id}${level ? `&level=${level}` : ''}`;
      const fb = await api.get<FeedbackResult>(url);
      setFeedback(fb);
    } catch {
      setFeedback({ questionId: currentQuestion.id, level: 'error', content: 'Could not load feedback. Try again.', fromAi: false, nextLevel: null, maxLevelReached: true });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handlePause = async () => {
    if (!activity) return;
    try {
      await api.post(`/v1/student/activities/${type}/${id}/pause`);
    } catch { /* silent */ }
    navigate('/home');
  };

  // --- Render ---
  if (flowState === 'loading') {
    return <PageShell><LoadingView /></PageShell>;
  }
  if (flowState === 'error') {
    return (
      <PageShell>
        <div style={s.centerCol}>
          <p style={{ color: 'var(--color-incorrect)' }}>{errorMsg}</p>
          <button style={s.btn} onClick={load}>Try Again</button>
        </div>
      </PageShell>
    );
  }
  if (flowState === 'complete') {
    return (
      <PageShell>
        <div style={s.centerCol}>
          <span style={{ fontSize: 48 }}>🎊</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>Activity Complete!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
            You answered {answeredCount} of {totalQ} questions.
          </p>
          <button style={{ ...s.btn, marginTop: 20 }} onClick={() => navigate(`/results/${type}/${id}`)}>
            View Results
          </button>
          <button style={{ ...s.btnOutline, marginTop: 8 }} onClick={() => navigate('/home')}>
            Back to Home
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Top Bar */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={handlePause}>← Pause</button>
        <span style={s.progressText}>Q {currentIdx + 1} of {totalQ}</span>
      </div>

      {/* Progress Bar */}
      <div style={s.progressBar} aria-label={`Question ${currentIdx + 1} of ${totalQ}`}>
        <div style={{ ...s.progressFill, width: `${((answeredCount) / totalQ) * 100}%` }} />
      </div>

      {/* Question */}
      {currentQuestion && (
        <div style={s.questionCard}>
          {currentQuestion.difficulty && (
            <span style={s.diffBadge}>{currentQuestion.difficulty}</span>
          )}
          <p style={s.questionText}>{currentQuestion.content}</p>

          {/* MCQ Options */}
          {currentQuestion.options && currentQuestion.options.length > 0 && (
            <div style={s.optionsCol}>
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  style={{
                    ...s.optionBtn,
                    borderColor: selectedOption === opt ? 'var(--color-sage)' : 'var(--color-border)',
                    background: selectedOption === opt ? 'var(--color-sage-light)' : 'var(--color-surface)',
                  }}
                  onClick={() => {
                    if (flowState === 'question') setSelectedOption(opt);
                  }}
                  disabled={flowState !== 'question'}
                >
                  <span style={s.optLetter}>{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          )}

          {/* Text Answer */}
          {(!currentQuestion.options || currentQuestion.options.length === 0) && (
            <textarea
              style={s.textarea}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              disabled={flowState !== 'question'}
              rows={3}
            />
          )}
        </div>
      )}

      {/* Submit */}
      {flowState === 'question' && (
        <button
          style={{ ...s.btn, opacity: (selectedOption || answer.trim()) ? 1 : 0.5 }}
          onClick={handleSubmit}
          disabled={!(selectedOption || answer.trim())}
        >
          Check Answer
        </button>
      )}
      {flowState === 'submitting' && <LoadingView />}

      {/* Result + Feedback */}
      {(flowState === 'correct' || flowState === 'incorrect') && lastResult && (
        <div style={s.resultCard}>
          <div style={{ ...s.resultBanner, background: lastResult.isCorrect ? 'var(--color-correct)' : 'var(--color-incorrect)' }}>
            {lastResult.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </div>
          {lastResult.feedback && (
            <p style={s.resultFeedback}>{lastResult.feedback}</p>
          )}
          {lastResult.score != null && (
            <p style={s.resultScore}>Score: {lastResult.score}/100</p>
          )}

          {/* AI Feedback Panel */}
          {!lastResult.isCorrect && (
            <div style={s.feedbackPanel}>
              {feedback && (
                <div style={s.feedbackContent}>
                  <span style={s.feedbackLevel}>
                    {feedback.level.charAt(0).toUpperCase() + feedback.level.slice(1)}
                    {feedback.fromAi ? ' (AI)' : ''}
                  </span>
                  <p style={s.feedbackText}>{feedback.content}</p>
                </div>
              )}
              {feedbackLoading && <p style={s.feedbackLoading}>AI thinking...</p>}
              {!feedback?.maxLevelReached && !feedbackLoading && (
                <button style={s.helpBtn} onClick={handleMoreHelp}>
                  {feedback ? 'More Help' : 'Get a Hint'}
                </button>
              )}
            </div>
          )}

          <button style={{ ...s.btn, marginTop: 16 }} onClick={handleNext}>
            Next Question →
          </button>
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>{children}</div>
    </div>
  );
}

function LoadingView() {
  return (
    <div style={s.centerCol}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid var(--color-cream-dark)',
        borderTopColor: 'var(--color-sage)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }} />
      <p style={{ color: 'var(--color-text-muted)', marginTop: 8, fontSize: 14 }}>Loading...</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { fontSize: 14, color: 'var(--color-sage-dark)', fontWeight: 600, padding: '6px 0' },
  progressText: { fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 },
  progressBar: { height: 6, background: 'var(--color-cream-dark)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', background: 'var(--color-sage)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' },
  questionCard: { background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow-sm)', marginBottom: 16 },
  diffBadge: { fontSize: 11, fontWeight: 600, color: 'var(--color-sage-dark)', textTransform: 'uppercase' as const, marginBottom: 8, display: 'inline-block' },
  questionText: { fontSize: 16, lineHeight: 1.5, color: 'var(--color-brown)', fontWeight: 500 },
  optionsCol: { display: 'flex', flexDirection: 'column' as const, gap: 10, marginTop: 16 },
  optionBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
    border: '2px solid var(--color-border)', fontSize: 14,
    textAlign: 'left' as const, transition: 'var(--transition)',
    color: 'var(--color-brown)',
  },
  optLetter: { fontWeight: 700, color: 'var(--color-sage-dark)', minWidth: 20 },
  textarea: {
    width: '100%', marginTop: 16, padding: 12,
    borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-border)',
    fontSize: 14, resize: 'vertical' as const, outline: 'none',
    color: 'var(--color-brown)', background: 'var(--color-cream)',
  },
  btn: {
    width: '100%', padding: '14px 0', borderRadius: 'var(--radius-full)',
    background: 'var(--color-sage)', color: '#fff', fontWeight: 600, fontSize: 15,
    transition: 'var(--transition)',
  },
  btnOutline: {
    width: '100%', padding: '12px 0', borderRadius: 'var(--radius-full)',
    background: 'transparent', color: 'var(--color-sage-dark)', fontWeight: 600, fontSize: 14,
    border: '2px solid var(--color-sage)',
  },
  centerCol: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  resultCard: { background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  resultBanner: { color: '#fff', fontWeight: 700, fontSize: 16, padding: '10px 20px', borderRadius: 'var(--radius-sm)', textAlign: 'center' as const, marginBottom: 12 },
  resultFeedback: { fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5, marginBottom: 8 },
  resultScore: { fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 },
  feedbackPanel: { marginTop: 16, padding: 16, background: 'var(--color-cream)', borderRadius: 'var(--radius-sm)' },
  feedbackContent: { marginBottom: 12 },
  feedbackLevel: { fontSize: 12, fontWeight: 700, color: 'var(--color-sage-dark)', textTransform: 'uppercase' as const, marginBottom: 4, display: 'block' },
  feedbackText: { fontSize: 14, color: 'var(--color-brown)', lineHeight: 1.5 },
  feedbackLoading: { fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' },
  helpBtn: {
    padding: '8px 20px', borderRadius: 'var(--radius-full)',
    background: 'var(--color-sage-light)', color: 'var(--color-sage-dark)',
    fontWeight: 600, fontSize: 13,
  },
};
