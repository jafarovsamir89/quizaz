import React, { useEffect, useState } from 'react';
import { leaderboardsApi } from '../shared/api';
import { Trophy, Users, MapPin } from 'lucide-react';
import { EmptyState } from '../shared/ui/EmptyState';

const PERIODS = [
  { key: 'daily', label: 'Bu gün' },
  { key: 'weekly', label: 'Bu həftə' },
  { key: 'monthly', label: 'Bu ay' },
  { key: 'all', label: 'Həmişə' },
];

export const LeaderboardsPage: React.FC = () => {
  const [tab, setTab] = useState<'cities' | 'players'>('cities');
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetch = tab === 'cities' ? leaderboardsApi.getCities(period) : leaderboardsApi.getPlayers(period);
    fetch.then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [tab, period]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { background: 'var(--primary-gold)', color: '#000', boxShadow: '0 0 12px rgba(255,215,0,0.3)' };
    if (rank === 2) return { background: '#C0C0C0', color: '#000' };
    if (rank === 3) return { background: '#CD7F32', color: '#000' };
    return { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'hidden' }}>
      <h1 style={{ marginBottom: '1.25rem' }}>Reytinq</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 16, marginBottom: '1rem', flexShrink: 0 }}>
        {['cities', 'players'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            style={{
              flex: 1, padding: '0.7rem', borderRadius: 13, fontWeight: 700, fontSize: '0.9rem',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s',
              background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t ? 'var(--primary-gold)' : 'var(--text-muted)'
            }}
          >
            {t === 'cities' ? 'Şəhərlər' : 'Oyunçular'}
          </button>
        ))}
      </div>

      {/* Period filters */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', marginBottom: '1rem', flexShrink: 0, paddingBottom: 4 }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{
              padding: '0.45rem 0.9rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
              whiteSpace: 'nowrap', border: '1px solid var(--glass-border)', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.25s',
              background: period === p.key ? 'var(--primary-gold)' : 'transparent',
              color: period === p.key ? '#000' : 'var(--text-muted)',
              borderColor: period === p.key ? 'var(--primary-gold)' : 'var(--glass-border)'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--primary-gold)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Yüklənir...</span>
          </div>
        ) : data?.items?.length > 0 ? (
          data.items.map((item: any) => (
            <div key={item.id || item.userId || item.cityId} className="glass-card animate-fade-in"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.8rem', ...getRankStyle(item.rank)
                }}>
                  {item.rank}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.cityName || item.nickname}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {tab === 'cities' ? (
                      <><Users size={10} /> {item.playersCount} oyunçu</>
                    ) : (
                      <><MapPin size={10} /> {item.cityName}</>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary-gold)' }}>{item.totalPoints?.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Xal</div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Trophy size={44} />}
            title="Məlumat tapılmadı"
            description="Bu dövr üçün hələ ki heç bir nəticə yoxdur."
          />
        )}
      </div>
    </div>
  );
};
