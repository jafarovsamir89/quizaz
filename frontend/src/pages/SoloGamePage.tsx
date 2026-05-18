import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../features/solo/gameStore';
import { useToast } from '../shared/ui/Toast';
import { Timer, Zap } from 'lucide-react';

export const SoloGamePage: React.FC = () => {
  const { questions, currentStep, submitAnswer, finishSolo, nextStep } = useGameStore();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const startTimeRef = useRef(Date.now());
  const navigate = useNavigate();
  const timerRef = useRef<any>(null);
  const isAnsweringRef = useRef(false);

  const currentQuestion = questions[currentStep];

  const handleFinish = useCallback(async () => {
    try {
      await finishSolo();
      navigate('/solo/result');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Oyun tamamlanmadı';
      showToast(msg, 'error');
      navigate('/');
    }
  }, [finishSolo, navigate, showToast]);

  const handleAnswer = useCallback(async (option: string | null, finalTime?: number) => {
    if (isAnsweringRef.current) return;
    isAnsweringRef.current = true;
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    const timeSpent = finalTime || Date.now() - startTimeRef.current;
    setSelected(option);

    try {
      const res = await submitAnswer({
        questionId: currentQuestion.id,
        selectedOption: option || 'none',
        timeSpentMs: Math.min(timeSpent, 10000),
      });
      setFeedback(res);

      setTimeout(() => {
        const nextS = currentStep + 1;
        if (nextS >= questions.length) {
          handleFinish();
        } else {
          nextStep();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Answer submission failed:', err);
      const msg = err?.response?.data?.message || 'Cavab göndərilmədi';
      showToast(msg, 'error');
      isAnsweringRef.current = false;
      setIsSubmitting(false);
      // If unauthorized or session expired, go home
      if (err?.response?.status === 401) navigate('/');
    }
  }, [currentQuestion, submitAnswer, questions.length, handleFinish]);

  useEffect(() => {
    if (!currentQuestion) return;

    startTimeRef.current = Date.now();
    setTimeLeft(10);
    setFeedback(null);
    setSelected(null);
    setIsSubmitting(false);
    isAnsweringRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null, 10000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentStep]);

  if (!currentQuestion) return null;

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'auto' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={16} style={{ color: 'var(--primary-gold)' }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
            Sual <span style={{ color: '#fff' }}>{currentStep + 1}</span> / {questions.length}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontFamily: 'monospace', fontWeight: 700, fontSize: '1.3rem',
          color: timeLeft < 4 ? 'var(--error)' : 'var(--primary-gold)',
          textShadow: timeLeft < 4 ? '0 0 12px rgba(255,68,119,0.4)' : 'none',
          transition: 'color 0.3s, text-shadow 0.3s'
        }}>
          <Timer size={18} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 5, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 999, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--primary-gold), #FF9900)',
          borderRadius: 999, transition: 'width 0.4s ease',
          boxShadow: '0 0 8px rgba(255,215,0,0.3)'
        }} />
      </div>

      {/* Question Card */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h2 style={{ textAlign: 'center', lineHeight: 1.6, fontSize: '1.1rem', fontWeight: 600 }}>
          {currentQuestion.textAz}
        </h2>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
        {Object.entries(currentQuestion.options).map(([key, value]: [string, any]) => {
          let state = '';
          if (feedback) {
            if (key === feedback.correctOption) state = 'correct';
            else if (key === selected && !feedback.isCorrect) state = 'wrong';
          } else if (selected === key) {
            state = 'selected';
          }

          const isDisabled = isSubmitting || !!feedback;

          return (
            <div
              key={key}
              className={`option-card ${state} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && handleAnswer(key)}
              style={{
                pointerEvents: isDisabled ? 'none' : 'auto',
                opacity: isDisabled && key !== selected && !feedback ? 0.6 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              <div className="option-letter">{key.toUpperCase()}</div>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="animate-fade-in" style={{
          marginTop: '1rem', padding: '1rem', borderRadius: 16, textAlign: 'center', fontWeight: 700,
          ...(feedback.isCorrect
            ? { background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)', color: 'var(--success)' }
            : { background: 'rgba(255,68,119,0.08)', border: '1px solid rgba(255,68,119,0.15)', color: 'var(--error)' })
        }}>
          {feedback.isCorrect ? `Düzdür! +${feedback.scoreEarned} xal` : 'Səhvdir!'}
        </div>
      )}
    </div>
  );
};
