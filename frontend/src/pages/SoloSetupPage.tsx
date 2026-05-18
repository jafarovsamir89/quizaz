import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { metadataApi } from '../shared/api';
import { Button } from '../shared/ui/Button';
import { useGameStore } from '../features/solo/gameStore';
import { ChevronLeft, Layers } from 'lucide-react';
import { useTranslation } from '../shared/i18n/useTranslation';

export const SoloSetupPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const { startSolo, isLoading } = useGameStore();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  useEffect(() => {
    metadataApi.getCategories().then(res => setCategories(res.data));
  }, []);

  const handleStart = async () => {
    try {
      await startSolo({ categoryId: selected || undefined, limit: 10 });
      navigate('/solo/game');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: 12, background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#fff'
          }}
        >
          <ChevronLeft size={22} />
        </button>
        <h1>{t('solo_setup_title')}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Layers size={16} style={{ color: 'var(--primary-gold)' }} />
        <h3 style={{ color: 'var(--primary-gold)', fontWeight: 700 }}>{t('solo_setup_select_cat')}</h3>
      </div>

      {/* Category List */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
        <div
          className={`option-card ${selected === null ? 'selected' : ''}`}
          onClick={() => setSelected(null)}
        >
          <span style={{ fontWeight: 600 }}>🎲 {lang === 'ru' ? 'Все Категории' : 'Bütün Kateqoriyalar'}</span>
        </div>
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`option-card ${selected === cat.id ? 'selected' : ''}`}
            onClick={() => setSelected(cat.id)}
          >
            <span style={{ fontWeight: 600 }}>{lang === 'ru' ? (cat.nameEn || cat.nameAz) : cat.nameAz}</span>
          </div>
        ))}
      </div>

      <div style={{ paddingBottom: '0.5rem' }}>
        <Button onClick={handleStart} isLoading={isLoading} style={{ width: '100%', height: 56, fontSize: '1.05rem' }}>
          {t('solo_setup_start')}
        </Button>
      </div>
    </div>
  );
};
