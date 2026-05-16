import React, { useEffect, useState } from 'react';
import { duelsApi } from '../shared/api';
import { Swords } from 'lucide-react';
import { Button } from '../shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useDuelStore } from '../features/duels/duelStore';
import { useAuthStore } from '../features/auth/authStore';
import { EmptyState } from '../shared/ui/EmptyState';
import { useToast } from '../shared/ui/Toast';
import type { Duel } from '../shared/types';

export const DuelsPage: React.FC = () => {
  const [myDuels, setMyDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { findOrCreate } = useDuelStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  useEffect(() => {
    loadDuels();
  }, []);

  const loadDuels = async () => {
    setLoading(true);
    try {
      const res = await duelsApi.getMyDuels();
      setMyDuels(res.data);
    } catch {
      showToast('Duellər yüklənmədi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDuel = async () => {
    setLoading(true);
    try {
      await findOrCreate();
      navigate('/duels/game');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Rəqib tapılmadı';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (duel: Duel) => {
    setLoading(true);
    try {
      if (duel.status === 'finished') {
        // Show result page for a finished duel
        const role = duel.initiatorId === user?.id ? 'initiator' : 'opponent';
        useDuelStore.getState().setDuel(duel, [], role);
        navigate('/duels/result');
        return;
      }

      if (duel.status === 'active' || duel.status === 'pending') {
        // Resume: fetch fresh questions via findOrCreate which returns existing active duel
        await findOrCreate();
        navigate('/duels/game');
        return;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Duelə qoşulmaq mümkün olmadı';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'finished':
        return { label: 'Başa Çatıb', color: 'var(--success)', bg: 'rgba(0,230,118,0.12)' };
      case 'active':
        return { label: 'Aktiv', color: 'var(--secondary-blue)', bg: 'rgba(0,191,255,0.12)' };
      case 'pending':
        return { label: 'Gözləyir', color: 'var(--primary-gold)', bg: 'rgba(255,215,0,0.08)' };
      default:
        return { label: status, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'auto' }}>
      <h1 style={{ marginBottom: '1.25rem' }}>Duellər</h1>

      {/* CTA Card */}
      <div
        className="glass-card"
        style={{
          marginBottom: '1.5rem',
          textAlign: 'center',
          padding: '2rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(0,191,255,0.06) 0%, rgba(168,85,247,0.03) 100%)',
          borderColor: 'rgba(0,191,255,0.1)',
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(0,191,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--secondary-blue)', margin: '0 auto 1rem',
          }}
        >
          <Swords size={32} />
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>Arena Səni Gözləyir</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Təsadüfi rəqiblə yarış və bacarığını göstər
        </p>
        <Button onClick={handleStartDuel} isLoading={loading} style={{ width: '100%' }}>
          Rəqib Tap
        </Button>
      </div>

      {/* My Duels */}
      <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Mənim Duellərim</h3>
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--secondary-blue)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          </div>
        ) : myDuels.length > 0 ? (
          myDuels.map((duel) => {
            const st = getStatusDisplay(duel.status);
            const isInitiator = duel.initiatorId === user?.id;
            const opponentName = isInitiator
              ? duel.opponent?.nickname
              : duel.initiator?.nickname;
            const canContinue = duel.status === 'active' || duel.status === 'pending' || duel.status === 'finished';

            return (
              <div
                key={duel.id}
                className="glass-card"
                onClick={() => canContinue && handleContinue(duel)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', cursor: canContinue ? 'pointer' : 'default',
                  opacity: duel.status === 'expired' || duel.status === 'cancelled' ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,191,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Swords size={18} style={{ color: 'var(--secondary-blue)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {opponentName || 'Rəqib gözlənilir...'}
                    </div>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>HESAB</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }}>
                    {isInitiator ? duel.initiatorScore : duel.opponentScore}
                    {' : '}
                    {isInitiator ? duel.opponentScore : duel.initiatorScore}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={<Swords size={44} />}
            title="Aktiv duel yoxdur"
            description="Yeni rəqib tapmaq üçün yuxarıdakı düyməni sıxın."
          />
        )}
      </div>
    </div>
  );
};
