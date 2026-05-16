import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { Trophy, Swords, Zap, MapPin, Coins, ChevronRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', paddingBottom: '1rem', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>Xoş gəldin 👋</div>
          <h1 style={{ fontSize: '1.6rem' }}>{user?.nickname || 'Player'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
            <MapPin size={13} />
            <span>{user?.city?.nameAz || 'Şəhər seçilməyib'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="stat-badge" style={{ color: 'var(--primary-gold)', borderColor: 'rgba(255,215,0,0.15)' }}>
            <Coins size={15} />
            <span>{user?.balanceCoins ?? 0}</span>
          </div>
          <div className="stat-badge" style={{ color: 'var(--secondary-blue)', borderColor: 'rgba(0,191,255,0.15)' }}>
            <Zap size={15} />
            <span>LVL {user?.level ?? 1}</span>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {/* Solo */}
        <div
          className="glass-card"
          onClick={() => navigate('/solo/setup')}
          style={{
            cursor: 'pointer', padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,153,0,0.02) 100%)',
            borderColor: 'rgba(255,215,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'transform 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(255,215,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary-gold)'
            }}>
              <Zap size={28} fill="currentColor" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.15rem' }}>Solo Oyun</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Özünü sına və xal qazan</p>
            </div>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Duel */}
        <div
          className="glass-card"
          onClick={() => navigate('/duels')}
          style={{
            cursor: 'pointer', padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(0,191,255,0.06) 0%, rgba(168,85,247,0.02) 100%)',
            borderColor: 'rgba(0,191,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'transform 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(0,191,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--secondary-blue)'
            }}>
              <Swords size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.15rem' }}>Duellər</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Rəqiblə yarış</p>
            </div>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Leaderboard teaser */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Trophy size={18} style={{ color: 'var(--primary-gold)' }} />
          <h3 style={{ fontWeight: 700 }}>Reytinq Cədvəli</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
          Şəhər və oyunçu sıralamasını izlə
        </p>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/leaderboards')}>
          Reytinqə Bax
        </button>
      </div>
    </div>
  );
};
