import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Plus, ChevronUp, RefreshCw } from 'lucide-react';
import { heroesApi } from '../shared/api';
import { useAuthStore } from '../features/auth/authStore';
import { useToast } from '../shared/ui/Toast';

export const HeroesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { showToast } = useToast();
  const [myHeroes, setMyHeroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Chest animation states
  const [openingChest, setOpeningChest] = useState(false);
  const [rolledHero, setRolledHero] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myRes = await heroesApi.getMy();
      setMyHeroes(myRes.data);
    } catch {
      showToast('Kartları yükləmək mümkün olmadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEquip = async (userHeroId: string, currentlyEquipped: boolean) => {
    try {
      await heroesApi.equip(userHeroId, !currentlyEquipped);
      showToast(currentlyEquipped ? 'Qəhrəman çıxarıldı' : 'Qəhrəman təchiz edildi!', 'success');
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Təchiz etmək mümkün olmadı';
      showToast(msg, 'error');
    }
  };

  const handleOpenChest = async () => {
    setOpeningChest(true);
    setRolledHero(null);
    try {
      const res = await heroesApi.openChest();
      setRolledHero(res.data.rolledHero);
      updateUser({ balanceCoins: res.data.balanceCoins });
      showToast(`Yeni qəhrəman əldə edildi!`, 'success');
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Sandığı açmaq mümkün olmadı';
      showToast(msg, 'error');
      setOpeningChest(false);
    }
  };

  const handleLevelUp = async (userHeroId: string) => {
    try {
      const res = await heroesApi.levelUp(userHeroId);
      updateUser({ balanceCoins: res.data.balanceCoins });
      showToast('Qəhrəman səviyyəsi artırıldı! 🔥', 'success');
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Təkmilləşdirmək mümkün olmadı';
      showToast(msg, 'error');
    }
  };

  const getRarityBadge = (rarity: string) => {
    let color = 'rgba(255,255,255,0.4)';
    let text = 'Ümumi';

    if (rarity === 'legendary') {
      color = '#FFD700';
      text = 'Əfsanəvi';
    } else if (rarity === 'epic') {
      color = '#A335EE';
      text = 'Epik';
    } else if (rarity === 'rare') {
      color = '#0070DD';
      text = 'Nadir';
    }

    return (
      <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: 6, background: 'rgba(0,0,0,0.5)', color, border: `1px solid ${color}`, fontWeight: 800, textTransform: 'uppercase' }}>
        {text}
      </span>
    );
  };

  const getRarityColor = (rarity: string) => {
    if (rarity === 'legendary') return 'rgba(255, 215, 0, 0.15)';
    if (rarity === 'epic') return 'rgba(163, 53, 238, 0.15)';
    if (rarity === 'rare') return 'rgba(0, 112, 221, 0.15)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getRarityBorderColor = (rarity: string) => {
    if (rarity === 'legendary') return 'rgba(255, 215, 0, 0.3)';
    if (rarity === 'epic') return 'rgba(163, 53, 238, 0.3)';
    if (rarity === 'rare') return 'rgba(0, 112, 221, 0.3)';
    return 'rgba(255, 255, 255, 0.1)';
  };

  const equippedHeroes = myHeroes.filter(h => h.isEquipped);

  return (
    <div className="page-container" style={{ padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Qəhrəman Kartları</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Xüsusi bonuslar və gücləndiricilər</p>
          </div>
        </div>
        <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', padding: '0.35rem 0.75rem', borderRadius: 99, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-gold)' }}>{user?.balanceCoins}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Qızıl</span>
        </div>
      </div>

      {/* Deck / Equipped Cards Slots */}
      <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem', fontWeight: 700 }}>Təchiz Edilmiş Deck ({equippedHeroes.length}/3)</h3>
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {[0, 1, 2].map((slotIdx) => {
          const equipped = equippedHeroes[slotIdx];
          return equipped ? (
            <div 
              key={equipped.id} 
              className="glass-card animate-pulse-subtle"
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0.75rem 0.5rem', background: getRarityColor(equipped.hero.rarity),
                borderColor: getRarityBorderColor(equipped.hero.rarity), borderRadius: 16,
                position: 'relative'
              }}
            >
              <button 
                onClick={() => handleEquip(equipped.id, true)}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,71,71,0.15)', color: '#FF4747', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
              >
                ×
              </button>
              <img 
                src={equipped.hero.imageUrl} 
                alt={equipped.hero.nameAz} 
                style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {equipped.hero.nameAz}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Lvl {equipped.level}</span>
            </div>
          ) : (
            <div 
              key={slotIdx} 
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.01)', border: '1.5px dashed rgba(255,255,255,0.08)',
                borderRadius: 16, color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontWeight: 600
              }}
            >
              <Plus size={16} style={{ marginBottom: '0.25rem' }} />
              Boş Slot
            </div>
          );
        })}
      </div>

      {/* Mystery Pack Chest Section */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '1.25rem', marginBottom: '1.5rem', 
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,153,0,0.02) 100%)',
          borderColor: 'rgba(255,215,0,0.15)', borderRadius: 20
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-gold)' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>Milli Sandıq (Qəhrəman Kartı)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>Təsadüfi bir qəhrəman kartı qazan!</p>
            </div>
          </div>
          <button 
            onClick={handleOpenChest}
            className="btn-primary"
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.75rem', minHeight: 'unset' }}
          >
            Aç (500 Qızıl)
          </button>
        </div>
      </div>

      {/* Cards List */}
      <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.65rem', fontWeight: 700 }}>Bütün Kartlarınız ({myHeroes.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Kartlar yüklənir...</div>
        ) : myHeroes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Hələ heç bir qəhrəman kartınız yoxdur. Sandıq açaraq ilk kartınızı əldə edin!</div>
        ) : (
          myHeroes.map((item) => {
            const isEquipped = item.isEquipped;
            const nextLevelCopies = item.level * 2;
            const nextLevelGold = item.level * 300;
            const canUpgrade = item.copies >= nextLevelCopies && (user?.balanceCoins || 0) >= nextLevelGold;

            return (
              <div 
                key={item.id}
                className="glass-card"
                style={{
                  padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  background: getRarityColor(item.hero.rarity), borderColor: getRarityBorderColor(item.hero.rarity),
                  borderRadius: 20
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <img 
                    src={item.hero.imageUrl} 
                    alt={item.hero.nameAz} 
                    style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>{item.hero.nameAz}</h4>
                      {getRarityBadge(item.hero.rarity)}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                      Səviyyə {item.level} • Nüsxə: <span style={{ color: item.copies >= nextLevelCopies ? 'var(--success)' : '#fff', fontWeight: 700 }}>{item.copies}/{nextLevelCopies}</span>
                    </p>
                  </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', lineHeight: '1.25rem', margin: 0, padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: 10 }}>
                  {item.hero.descriptionAz}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleEquip(item.id, isEquipped)}
                    style={{
                      flex: 1, padding: '0.45rem', fontSize: '0.75rem', fontWeight: 800,
                      background: isEquipped ? 'rgba(255,71,71,0.12)' : 'linear-gradient(135deg, var(--primary-gold) 0%, #FF9900 100%)',
                      color: isEquipped ? '#FF4747' : '#000', border: 'none', borderRadius: 10, cursor: 'pointer'
                    }}
                  >
                    {isEquipped ? 'Çıxar' : 'Təchiz Et'}
                  </button>
                  <button 
                    onClick={() => handleLevelUp(item.id)}
                    disabled={!canUpgrade}
                    style={{
                      flex: 1, padding: '0.45rem', fontSize: '0.75rem', fontWeight: 800,
                      background: canUpgrade ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.03)',
                      color: canUpgrade ? 'var(--success)' : 'rgba(255,255,255,0.3)',
                      border: canUpgrade ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 10, cursor: canUpgrade ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                    }}
                  >
                    <ChevronUp size={14} /> Təkmilləşdir ({nextLevelGold} Q)
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Open Pack Screen (Modal) */}
      {openingChest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 100 }}>
          {!rolledHero ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <RefreshCw size={44} className="animate-spin" style={{ color: 'var(--primary-gold)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: '#fff', margin: 0 }}>Sandıq Açılır...</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Milli güclər çağırılır!</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', animation: 'scaleUp 0.4s ease-out', maxWidth: 300 }}>
              <Sparkles size={48} style={{ color: 'var(--primary-gold)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-gold)', margin: 0 }}>TƏBRİKLƏR!</h2>
              
              <div 
                className="glass-card"
                style={{
                  padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  background: getRarityColor(rolledHero.rarity), borderColor: getRarityBorderColor(rolledHero.rarity),
                  borderRadius: 24, width: '100%'
                }}
              >
                <img 
                  src={rolledHero.imageUrl} 
                  alt={rolledHero.nameAz} 
                  style={{ width: 100, height: 100, borderRadius: 20, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0 }}>{rolledHero.nameAz}</h3>
                {getRarityBadge(rolledHero.rarity)}
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', margin: '0.5rem 0 0 0', lineHeight: '1.25rem' }}>
                  {rolledHero.descriptionAz}
                </p>
              </div>

              <button 
                onClick={() => setOpeningChest(false)}
                className="btn-primary"
                style={{ width: '100%', padding: '0.65rem' }}
              >
                Super! Kartı Yadda Saxla
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
