import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Shield, School, GraduationCap, MapPin, Check } from 'lucide-react';
import { clansApi } from '../shared/api';
import { useAuthStore } from '../features/auth/authStore';
import { useToast } from '../shared/ui/Toast';
import { useTranslation } from '../shared/i18n/useTranslation';

export const ClansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'neighborhood' | 'school' | 'university'>('neighborhood');
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { t, lang } = useTranslation();

  // Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<'neighborhood' | 'school' | 'university'>('neighborhood');

  const fetchClans = async () => {
    setLoading(true);
    try {
      const res = await clansApi.getLeaderboard(activeTab);
      setClans(res.data);
    } catch {
      showToast(t('clan_load_fail'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClans();
  }, [activeTab]);

  const handleJoin = async (clanId: string) => {
    try {
      const res = await clansApi.join(clanId);
      updateUser({ clanId, clan: res.data.clan });
      showToast(t('clan_join_success'), 'success');
      fetchClans();
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('clan_join_fail');
      showToast(msg, 'error');
    }
  };

  const handleLeave = async () => {
    try {
      await clansApi.leave();
      updateUser({ clanId: null, clan: null });
      showToast(t('clan_leave_success'), 'success');
      fetchClans();
    } catch (err: any) {
      showToast(t('clan_leave_fail'), 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    try {
      const res = await clansApi.create({ name: createName, type: createType });
      updateUser({ clanId: res.data.id, clan: res.data });
      showToast(t('clan_create_success'), 'success');
      setCreateName('');
      setShowCreateModal(false);
      setActiveTab(createType);
      fetchClans();
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('clan_create_fail');
      showToast(msg, 'error');
    }
  };

  return (
    <div className="page-container" style={{ padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>{t('nav_clans')}</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{lang === 'ru' ? 'Рейтинги махаллей, школ и университетов' : 'Məhəllə, məktəb və universitet reytinqləri'}</p>
        </div>
      </div>

      {/* Current Clan Card */}
      {user?.clan ? (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', borderColor: 'rgba(0,230,118,0.2)', background: 'linear-gradient(135deg, rgba(0,230,118,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,230,118,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                {user.clan.type === 'neighborhood' ? <MapPin size={20} /> : user.clan.type === 'school' ? <School size={20} /> : <GraduationCap size={20} />}
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 700 }}>
                  {user.clan.type === 'neighborhood' ? (lang === 'ru' ? 'Ваша махалля' : 'Məhəlləniz') : user.clan.type === 'school' ? (lang === 'ru' ? 'Ваша школа' : 'Məktəbiniz') : (lang === 'ru' ? 'Ваш университет' : 'Universitetiniz')}
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff' }}>{user.clan.name}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lvl {user.clan.level} • {user.clan.points} {t('clan_points')}</span>
              </div>
            </div>
            <button 
              onClick={handleLeave} 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(255,71,71,0.1)', color: '#FF4747', border: '1px solid rgba(255,71,71,0.2)', borderRadius: 10, cursor: 'pointer' }}
            >
              {lang === 'ru' ? 'Выйти' : 'Çıx'}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={24} style={{ color: 'var(--primary-gold)' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#fff' }}>{t('profile_clan_none')}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, maxWidth: 260 }}>
            {lang === 'ru' ? 'Зарабатывайте очки для своей махалли, школы или университета и ведите их к победе!' : 'Məhəlləniz, məktəbiniz və ya universitetiniz adına yarışaraq xallar qazanın və onları liderliyə daşıyın!'}
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary" 
            style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.75rem', minHeight: 'unset', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={14} /> {t('clan_create_btn')}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 12, marginBottom: '1rem' }}>
        {(['neighborhood', 'school', 'university'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.25s',
              background: activeTab === tab ? 'var(--primary-gold)' : 'transparent',
              color: activeTab === tab ? '#000' : 'var(--text-muted)'
            }}
          >
            {tab === 'neighborhood' ? t('clan_tab_neighborhood') : tab === 'school' ? t('clan_tab_school') : t('clan_tab_university')}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t('loading')}</div>
        ) : clans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lang === 'ru' ? 'В этой категории пока нет союзов.' : 'Bu kateqoriyada hələ heç bir klan yaradılmayıb.'}</div>
        ) : (
          clans.map((clan, idx) => {
            const isMyClan = user?.clanId === clan.id;
            return (
              <div 
                key={clan.id} 
                className="option-card" 
                style={{ 
                  justifyContent: 'space-between', padding: '0.85rem 1rem',
                  borderColor: isMyClan ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.05)',
                  background: isMyClan ? 'rgba(0,230,118,0.03)' : 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: idx === 0 ? 'var(--primary-gold)' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-muted)', width: 20 }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#fff' }}>{clan.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lang === 'ru' ? 'Уровень' : 'Səviyyə'} {clan.level} • {clan.points} {t('clan_points')}</span>
                  </div>
                </div>
                {isMyClan ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Check size={14} /> {t('clan_joined')}
                  </div>
                ) : (
                  !user?.clanId && (
                    <button 
                      onClick={() => handleJoin(clan.id)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', background: 'rgba(255,215,0,0.1)', color: 'var(--primary-gold)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
                    >
                      {t('clan_join')}
                    </button>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 360, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: '#fff', margin: '0 0 0.5rem 0' }}>{t('clan_create_title')}</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>{lang === 'ru' ? 'Название' : 'Adı'}</label>
                <input 
                  type="text" 
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={lang === 'ru' ? 'Напр. Ясамал, школа №189, БГУ' : 'Məs. Yasamal, 189 nömrəli məktəb, BDU'}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>{t('clan_create_type')}</label>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 10 }}>
                  {(['neighborhood', 'school', 'university'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCreateType(type)}
                      style={{
                        flex: 1, padding: '0.4rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                        border: 'none', cursor: 'pointer', transition: 'all 0.25s',
                        background: createType === type ? 'var(--primary-gold)' : 'transparent',
                        color: createType === type ? '#000' : 'var(--text-muted)'
                      }}
                    >
                      {type === 'neighborhood' ? (lang === 'ru' ? 'Махалля' : 'Məhəllə') : type === 'school' ? (lang === 'ru' ? 'Школа' : 'Məktəb') : (lang === 'ru' ? 'ВУЗ' : 'Universitet')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', minHeight: 'unset' }}
                >
                  {lang === 'ru' ? 'Создать' : 'Yarat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
