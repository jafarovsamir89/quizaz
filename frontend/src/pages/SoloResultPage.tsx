import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../features/solo/gameStore';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../shared/ui/Button';
import { Trophy, Coins, Zap, CheckCircle2, XCircle, Star } from 'lucide-react';

export const SoloResultPage: React.FC = () => {
  const { results, reset } = useGameStore();
  const { sync } = useAuthStore();
  const navigate = useNavigate();

  const handleDone = async () => {
    try { await sync(); } catch {}
    reset();
    navigate('/');
  };

  if (!results) return null;

  const accuracy = results.correctCount + results.wrongCount > 0
    ? Math.round((results.correctCount / (results.correctCount + results.wrongCount)) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'auto' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '1rem' }}>
        {/* Trophy */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(255,215,0,0.1)', border: '3px solid rgba(255,215,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary-gold)', marginBottom: '1.5rem',
          boxShadow: '0 0 40px rgba(255,215,0,0.1)'
        }}>
          <Trophy size={42} />
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>Oyun Başa Çatdı!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {accuracy >= 80 ? 'Möhtəşəm nəticə! 🔥' : accuracy >= 50 ? 'Yaxşı oyun! 👏' : 'Davam et, inkişaf edəcəksən! 💪'}
        </p>

        {/* Score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%', marginBottom: '1.25rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '1rem' }}>
            <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{results.correctCount}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Düzgün</div>
          </div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '1rem' }}>
            <XCircle size={22} style={{ color: 'var(--error)' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{results.wrongCount}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Səhv</div>
          </div>
        </div>

        {/* Rewards */}
        <div className="glass-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Star size={17} style={{ color: 'var(--secondary-blue)' }} />
              <span style={{ fontSize: '0.9rem' }}>Ümumi Xal</span>
            </div>
            <span style={{ fontWeight: 700 }}>{results.totalScore}</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Coins size={17} style={{ color: 'var(--primary-gold)' }} />
              <span style={{ fontSize: '0.9rem' }}>Qazanılan Qızıl</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--primary-gold)' }}>+{results.coinsEarned}</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Zap size={17} style={{ color: 'var(--accent-violet)' }} />
              <span style={{ fontSize: '0.9rem' }}>XP</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>+{results.xpEarned}</span>
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: '1rem' }}>
        <Button onClick={handleDone} style={{ width: '100%', height: 56, fontSize: '1.05rem' }}>
          Ana Səhifəyə Dön
        </Button>
      </div>
    </div>
  );
};
