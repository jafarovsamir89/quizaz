import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDuelStore } from '../features/duels/duelStore';
import { Button } from '../shared/ui/Button';
import { Clock, Home, RefreshCw } from 'lucide-react';

const POLL_INTERVAL_MS = 5000;

export const DuelWaitingPage: React.FC = () => {
  const { results, finishDuel, reset, currentDuelId, role } = useDuelStore();
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const checkResult = async () => {
    if (!currentDuelId) return;
    setIsRefreshing(true);
    try {
      const res = await finishDuel();
      if (res?.status === 'finished') {
        if (pollRef.current) clearInterval(pollRef.current);
        navigate('/duels/result');
      }
    } catch {
      // Silently ignore — keep polling
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-poll every 5 seconds
  useEffect(() => {
    if (!currentDuelId) {
      navigate('/duels');
      return;
    }
    pollRef.current = setInterval(checkResult, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDuelId]);

  const handleHome = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    reset();
    navigate('/');
  };

  const myScore =
    role === 'initiator' ? results?.initiatorScore : results?.opponentScore;

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in bg-bg-color">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-secondary-blue/10 flex items-center justify-center text-secondary-blue mb-8 relative">
          <Clock size={48} className="animate-pulse" />
          {isRefreshing && (
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 20,
                height: 20,
                border: '2px solid var(--secondary-blue)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
              }}
              className="animate-spin"
            />
          )}
        </div>

        <h1 className="text-2xl font-bold mb-4 text-center">Rəqib Gözlənilir</h1>
        <p className="text-text-muted text-center px-6 mb-12">
          Siz öz suallarınızı bitirdiniz. Rəqibin cavablandırmasını avtomatik yoxlayırıq.
        </p>

        <div className="w-full glass-card border-secondary-blue/20 p-6 mb-12 text-center">
          <div className="text-sm text-text-muted uppercase tracking-widest mb-1">Sizin Hesabınız</div>
          <div className="text-4xl font-bold text-secondary-blue">{myScore ?? 0}</div>
        </div>

        <div className="w-full space-y-4">
          <Button onClick={checkResult} className="w-full h-14 flex items-center justify-center gap-2">
            <RefreshCw size={20} />
            İndi Yoxla
          </Button>
          <Button variant="secondary" onClick={handleHome} className="w-full h-14 flex items-center justify-center gap-2">
            <Home size={20} />
            Ana Səhifəyə Dön
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-text-muted py-4">
        Hər 5 saniyədə bir avtomatik yoxlanılır • Duel 24 saat ərzində qüvvədədir
      </div>
    </div>
  );
};
