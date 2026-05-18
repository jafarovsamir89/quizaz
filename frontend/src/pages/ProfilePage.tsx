import React, { useState } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../shared/ui/Button';
import { User, MapPin, Coins, Zap, LogOut, ChevronRight, Pencil, Gift, Shield, Sparkles } from 'lucide-react';
import { auth, loginWithGoogle } from '../shared/api/firebase';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../shared/api';
import { useToast } from '../shared/ui/Toast';
import { useTranslation } from '../shared/i18n/useTranslation';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, lang } = useTranslation();
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState(user?.nickname || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      showToast(t('profile_google_login_success'), 'success');
    } catch (err: any) {
      console.error(err);
      showToast(t('profile_google_login_fail'), 'error');
    }
  };

  const handleLogout = () => {
    if (auth && auth.signOut) auth.signOut();
    window.location.reload();
  };

  const handleSaveNick = async () => {
    const trimmed = nickValue.trim();
    if (!trimmed || trimmed.length < 2) {
      showToast(t('profile_edit_name_err'), 'error');
      return;
    }
    setIsSaving(true);
    try {
      await profileApi.updateMe({ nickname: trimmed });
      updateUser({ nickname: trimmed });
      setIsEditingNick(false);
      showToast(t('profile_edit_name_success'), 'success');
    } catch {
      showToast(t('profile_edit_name_fail'), 'error');
    } finally {
      setIsSaving(false);
    }
  };
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);

  const handleClaimDailyBonus = async () => {
    setIsClaimingBonus(true);
    try {
      const res = await profileApi.claimDailyBonus();
      const claimedData = res.data;
      
      updateUser({
        balanceCoins: claimedData.balanceCoins,
        xp: claimedData.xp,
        level: claimedData.level,
        dailyStreak: claimedData.streak,
        lastDailyBonusAt: new Date().toISOString()
      });
      
      const parts = t('profile_daily_bonus_claimed');
      showToast(`${parts} +${claimedData.bonusCoins} qızıl, +${claimedData.bonusXp} XP`, 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('profile_daily_bonus_fail');
      showToast(msg, 'error');
    } finally {
      setIsClaimingBonus(false);
    }
  };

  const hasClaimedToday = (() => {
    if (!user?.lastDailyBonusAt) return false;
    const lastBonusDate = new Date(user.lastDailyBonusAt);
    const now = new Date();
    return (
      now.getFullYear() === lastBonusDate.getFullYear() &&
      now.getMonth() === lastBonusDate.getMonth() &&
      now.getDate() === lastBonusDate.getDate()
    );
  })();

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
          <span>{lang === 'ru' ? (user?.city?.nameEn || user?.city?.nameAz) : (user?.city?.nameAz || t('home_no_city'))}</span>
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 10, marginTop: '0.75rem', width: 120 }}>
          {['az', 'ru'].map((l) => {
            const isActive = (user?.language || 'az') === l;
            return (
              <button
                key={l}
                onClick={async () => {
                  try {
                    await profileApi.updateMe({ language: l });
                    updateUser({ language: l });
                    showToast(l === 'az' ? 'Dil seçimi: Azərbaycan' : 'Язык изменен на Русский', 'success');
                  } catch {
                    showToast(t('profile_lang_fail'), 'error');
                  }
                }}
                style={{
                  flex: 1, padding: '0.3rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
                  background: isActive ? 'var(--primary-gold)' : 'transparent',
                  color: isActive ? '#000' : 'var(--text-muted)'
                }}
              >
                {l.toUpperCase()}
              </button>
            );
          })}
        </div>

        {!user?.email && (
          <button
            onClick={handleGoogleLogin}
            style={{
              marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 1.25rem', borderRadius: '999px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            {t('profile_google_login')}
          </button>
        )}
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

      {/* Daily Bonus Card */}
      <div 
        className="glass-card"
        style={{
          display: 'flex', flexDirection: 'column',
          padding: '1.25rem', marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,153,0,0.01) 100%)',
          borderColor: 'rgba(255,215,0,0.12)',
          borderRadius: '20px', borderStyle: 'solid', borderWidth: '1px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,215,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary-gold)'
            }}>
              <Gift size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>{t('profile_daily_bonus')}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.1rem 0 0 0' }}>
                {hasClaimedToday ? `${user?.dailyStreak || 0} ${lang === 'ru' ? 'дней серия получена 🔥' : 'günlük seriya alınıb 🔥'}` : (lang === 'ru' ? 'Заходи каждый день и получай призы!' : 'Hər gün daxil ol və qazan!')}
              </p>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={handleClaimDailyBonus}
            disabled={hasClaimedToday || isClaimingBonus}
            style={{
              padding: '0.5rem 1rem', fontSize: '0.8rem', minHeight: 'unset', width: 'auto',
              background: hasClaimedToday ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, var(--primary-gold) 0%, #FF9900 100%)',
              color: hasClaimedToday ? '#fff' : '#000',
              border: 'none', cursor: hasClaimedToday ? 'default' : 'pointer'
            }}
          >
            {isClaimingBonus ? '...' : hasClaimedToday ? t('profile_daily_bonus_claimed_btn') : t('profile_daily_bonus_claim')}
          </button>
        </div>

        {/* 7-day timeline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', marginTop: '0.25rem' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const currentStreak = user?.dailyStreak || 0;
            const isCompleted = hasClaimedToday ? day <= currentStreak : day < currentStreak + 1;
            const isCurrent = !hasClaimedToday && day === currentStreak + 1;
            const isSuperDay = day === 7;

            let bgColor = 'rgba(255,255,255,0.02)';
            let borderColor = 'rgba(255,255,255,0.05)';
            let textColor = 'var(--text-muted)';

            if (isCompleted) {
              bgColor = 'rgba(0,230,118,0.12)';
              borderColor = 'rgba(0,230,118,0.2)';
              textColor = 'var(--success)';
            } else if (isCurrent) {
              bgColor = 'rgba(255,215,0,0.15)';
              borderColor = 'var(--primary-gold)';
              textColor = 'var(--primary-gold)';
            } else if (isSuperDay) {
              borderColor = 'rgba(255,99,71,0.2)';
              textColor = '#FF6347';
            }

            return (
              <div 
                key={day} 
                style={{ 
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                  gap: '0.35rem', background: bgColor, border: `1px solid ${borderColor}`,
                  borderRadius: 12, padding: '0.5rem 0.2rem', minWidth: 0,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  transform: isCurrent ? 'scale(1.05)' : 'none',
                  boxShadow: isCurrent ? '0 0 10px rgba(255,215,0,0.2)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.6, color: textColor }}>{lang === 'ru' ? `День ${day}` : `Gün ${day}`}</span>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isCompleted ? '✓' : isSuperDay ? '👑' : `+${40 + day * 10}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
        <div className="option-card" style={{ justifyContent: 'space-between' }} onClick={() => navigate('/heroes')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary-gold)' }} />
            <span style={{ fontWeight: 500 }}>{t('nav_heroes')}</span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>

        <div className="option-card" style={{ justifyContent: 'space-between' }} onClick={() => navigate('/clans')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={18} style={{ color: 'var(--secondary-blue)' }} />
            <span style={{ fontWeight: 500 }}>{t('nav_clans')}</span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>

        <div className="option-card" style={{ justifyContent: 'space-between' }} onClick={() => navigate('/city-selection')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={18} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontWeight: 500 }}>{lang === 'ru' ? 'Сменить Город' : 'Şəhəri Dəyiş'}</span>
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
          {t('profile_logout')}
        </button>
      </div>
    </div>
  );
};
