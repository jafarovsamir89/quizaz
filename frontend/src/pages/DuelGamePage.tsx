import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDuelStore } from '../features/duels/duelStore';
import { useToast } from '../shared/ui/Toast';
import { Timer, Swords } from 'lucide-react';
import type { AnswerFeedback } from '../shared/types';

export const DuelGamePage: React.FC = () => {
  const { questions, currentStep, submitAnswer, finishDuel, currentDuelId, nextStep } = useDuelStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const startTimeRef = useRef(Date.now());
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Prevents double-submit on rapid clicks or timer + click race
  const isAnsweringRef = useRef(false);
  const { showToast } = useToast();

  const currentQuestion = questions[currentStep];

  useEffect(() => {
    if (!currentDuelId || questions.length === 0) {
      navigate('/duels');
    }
  }, [currentDuelId, questions, navigate]);

  const handleFinish = useCallback(async () => {
    try {
      const res = await finishDuel();
      if (res?.status === 'finished') {
        navigate('/duels/result');
      } else {
        navigate('/duels/waiting');
      }
    } catch {
      showToast('Xəta baş verdi. Yenidən cəhd edin.', 'error');
      navigate('/duels/waiting');
    }
  }, [finishDuel, navigate, showToast]);

  const handleAnswer = useCallback(
    async (option: string | null, finalTime?: number) => {
      if (isAnsweringRef.current || !currentQuestion) return;
      isAnsweringRef.current = true;

      if (timerRef.current) clearInterval(timerRef.current);

      const timeSpent = finalTime ?? Date.now() - startTimeRef.current;
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
        const msg = err?.response?.data?.message || 'Cavab göndərilmədi';
        showToast(msg, 'error');
        isAnsweringRef.current = false;
      }
    },
    [currentQuestion, submitAnswer, questions.length, handleFinish, showToast],
  );

  useEffect(() => {
    if (!currentQuestion) return;

    startTimeRef.current = Date.now();
    setTimeLeft(10);
    setFeedback(null);
    setSelected(null);
    isAnsweringRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer(null, 10000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, currentQuestion, handleAnswer]);

  if (!currentQuestion) return null;

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in h-screen bg-bg-color">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 text-secondary-blue font-bold">
          <Swords size={18} />
          <span>DUEL</span>
        </div>
        <div
          className={`flex items-center gap-2 font-mono font-bold text-xl ${
            timeLeft < 4 ? 'text-error animate-pulse' : 'text-primary-gold'
          }`}
        >
          <Timer size={20} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="h-1.5 w-full bg-glass-bg rounded-full mb-12 overflow-hidden">
        <div
          className="h-full bg-secondary-blue transition-all duration-300"
          style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="glass-card mb-8 border-secondary-blue/10">
        <div className="text-xs text-secondary-blue uppercase tracking-widest text-center mb-2 font-bold opacity-70">
          Sual {currentStep + 1} / {questions.length}
        </div>
        <h2 className="text-xl font-bold leading-relaxed text-center">{currentQuestion.textAz}</h2>
      </div>

      <div className="flex-1 space-y-3">
        {Object.entries(currentQuestion.options).map(([key, value]: [string, unknown]) => {
          let state = '';
          if (feedback) {
            if (key === feedback.correctOption) state = 'correct';
            else if (key === selected && !feedback.isCorrect) state = 'wrong';
          } else if (selected === key) {
            state = 'selected';
          }

          return (
            <div
              key={key}
              className={`option-card ${state}`}
              onClick={() => !isAnsweringRef.current && handleAnswer(key)}
              style={{ pointerEvents: feedback ? 'none' : 'auto' }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-sm">
                {key.toUpperCase()}
              </div>
              <span className="font-medium">{String(value)}</span>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`mt-4 p-4 rounded-xl text-center font-bold animate-fade-in ${
            feedback.isCorrect ? 'text-success' : 'text-error'
          }`}
        >
          {feedback.isCorrect ? `Düzdür! +${feedback.scoreEarned} xal` : 'Səhvdir!'}
        </div>
      )}
    </div>
  );
};
