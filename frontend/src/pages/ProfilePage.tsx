import React, { useState } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../shared/ui/Button';
import { User, MapPin, Coins, Zap, LogOut, ChevronRight, Pencil } from 'lucide-react';
import { auth } from '../shared/api/firebase';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../shared/api';
import { useToast } from '../shared/ui/Toast';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState(user?.nickname || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    if (auth && auth.signOut) auth.signOut();
    window.location.reload();
  };

  const handleSaveNick = async () => {
    const trimmed = nickValue.trim();
    if (!trimmed || trimmed.length < 2) {
      showToast('Ən az 2 hərf daxil edin', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await profileApi.updateMe({ nickname: trimmed });
      updateUser({ nickname: trimmed });
      setIsEditingNick(false);
      showToast('Ləqəb yeniləndi!', 'success');
    } catch {
      showToast('Yadda saxlamaq mümkün olmadı', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'auto' }}>
      {/* Avatar & Name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        {/* Avatar: show Google photo if available, else default icon */}
        <div
          style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'var(--glass-bg)', border: '2px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary-gold)', marginBottom: '1rem', overflow: 'hidden',
          }}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.nickname}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <User size={40} />
          )}
        </div>

        {/* Editable nickname */}
        {isEditingNick ? (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', width: '100%', maxWidth: 260 }}>
            <input
              value={nickValue}
              onChange={(e) => setNickValue(e.target.value)}
              maxLength={30}
              style={{
                flex: 1, padding: '0.6rem 1rem', borderRadius: 12,
                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                color: '#fff', fontFamily: 'inherit', fontSize: '1rem', outline: 'none',
              }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNick()}
            />
            <Button onClick={handleSaveNick} isLoading={isSaving} style={{ padding: '0.6rem 1rem', minWidth: 'unset' }}>
              ✓
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.4rem' }}>{user?.nickname}</h1>
            <button
              onClick={() => { setNickValue(user?.nickname || ''); setIsEditingNick(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
              <Pencil size={14} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <MapPin size={14} />
          <span>{user?.city?.nameAz || 'Şəhər seçilməyib'}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', gap: '0.3rem' }}>
          <Coins size={22} style={{ color: 'var(--primary-gold)' }} />
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{user?.balanceCoins}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Qızıl</div>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', gap: '0.3rem' }}>
          <Zap size={22} style={{ color: 'var(--secondary-blue)' }} />
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{user?.level}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Səviyyə</div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
        <div className="option-card" style={{ justifyContent: 'space-between' }} onClick={() => navigate('/city-selection')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={18} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontWeight: 500 }}>Şəhəri Dəyiş</span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Logout */}
      <div style={{ paddingBottom: '0.5rem', paddingTop: '1rem' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '1rem', color: 'var(--error)', fontWeight: 700, fontSize: '0.9rem',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: 0.7,
          }}
        >
          <LogOut size={18} />
          Çıxış Et
        </button>
      </div>
    </div>
  );
};
