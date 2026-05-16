import React, { useEffect, useState } from 'react';
import { metadataApi, profileApi } from '../shared/api';
import { Button } from '../shared/ui/Button';
import { useAuthStore } from '../features/auth/authStore';
import { MapPin } from 'lucide-react';

export const CitySelectionPage: React.FC = () => {
  const [cities, setCities] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();

  useEffect(() => {
    metadataApi.getCities().then(res => setCities(res.data));
  }, []);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await profileApi.updateCity(selected);
      updateUser({ cityId: selected, city: cities.find(c => c.id === selected) });
      window.location.href = '/'; // Hard redirect to refresh state if needed, or use navigate
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem', overflow: 'hidden' }}>
      <div style={{ paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <MapPin size={20} style={{ color: 'var(--primary-gold)' }} />
          <h1>Xoş gəlmisiniz!</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Şəhərini seç və Bilik Arenasına daxil ol. Qazandığın hər xal şəhərini zirvəyə daşıyacaq!
        </p>
      </div>

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
        {cities.map(city => (
          <div
            key={city.id}
            className={`option-card ${selected === city.id ? 'selected' : ''}`}
            onClick={() => setSelected(city.id)}
          >
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{city.nameAz}</span>
          </div>
        ))}
      </div>

      <div style={{ paddingBottom: '1.5rem' }}>
        <Button onClick={handleConfirm} isLoading={loading} disabled={!selected} style={{ width: '100%', height: 56 }}>
          Arenaya Daxil Ol
        </Button>
      </div>
    </div>
  );
};
