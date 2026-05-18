import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDuelStore } from '../features/duels/duelStore';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../shared/ui/Button';
import { Trophy, Swords, Home, Coins } from 'lucide-react';
import { useTranslation } from '../shared/i18n/useTranslation';

export const DuelResultPage: React.FC = () => {
  const { results, reset, role } = useDuelStore();
  const { user, sync } = useAuthStore();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  const isWinner = results?.winnerId === user?.id;
  const isDraw = !results?.winnerId && results?.status === 'finished';

  const myScore = role === 'initiator' ? results?.initiatorScore : results?.opponentScore;
  const opponentScore = role === 'initiator' ? results?.opponentScore : results?.initiatorScore;

  const handleDone = async () => {
    try { await sync(); } catch { /* ignore */ }
    reset();
    navigate('/duels');
  };

  if (!results) return null;

  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in bg-bg-color">
      <div className="flex-1 flex flex-col items-center pt-12">
        <div
          className={`w-28 h-28 rounded-3xl flex items-center justify-center mb-6 border-4 ${
            isWinner
              ? 'bg-primary-gold/20 border-primary-gold/10 text-primary-gold'
              : isDraw
              ? 'bg-slate-500/20 border-slate-500/10 text-slate-300'
              : 'bg-error/10 border-error/5 text-error'
          }`}
        >
          {isWinner ? <Trophy size={64} /> : <Swords size={64} />}
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {isWinner ? t('res_victory') : isDraw ? t('res_draw') : t('res_defeat')}
        </h1>
        <p className="text-text-muted mb-12">{lang === 'ru' ? 'Дуэль завершена' : 'Duel başa çatdı'}</p>

        {/* Score */}
        <div className="w-full glass-card flex items-center justify-around py-8 mb-8">
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-2">{t('res_you')}</div>
            <div className="text-4xl font-bold">{myScore ?? 0}</div>
          </div>
          <div className="text-2xl font-bold text-text-muted">:</div>
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-2">{t('res_opponent')}</div>
            <div className="text-4xl font-bold">{opponentScore ?? 0}</div>
          </div>
        </div>

        {/* Real prize from backend */}
        <div className="w-full space-y-3 mb-12">
          <div className="stat-badge w-full justify-between py-4 px-6 border-primary-gold/20 text-primary-gold">
            <div className="flex items-center gap-3">
              <Coins size={20} />
              <span className="font-bold">{lang === 'ru' ? 'Награда' : 'Mükafat'}</span>
            </div>
            <span className="font-bold">
              +{results.prizeCoins ?? (isWinner ? 20 : isDraw ? 10 : 5)} {lang === 'ru' ? 'Монет' : 'Qızıl'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pb-8">
        <Button variant="secondary" className="flex-1 h-16" onClick={() => navigate('/')}>
          <Home size={20} />
        </Button>
        <Button onClick={handleDone} className="flex-[3] h-16 text-lg">
          {lang === 'ru' ? 'Продолжить' : 'Davam Et'}
        </Button>
      </div>
    </div>
  );
};
