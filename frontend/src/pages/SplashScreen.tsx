import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', flex: 1, gap: '1rem', padding: '2rem'
    }} className="animate-fade-in">
      <div style={{
        fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px',
        background: 'linear-gradient(135deg, #FFD700, #FF9900)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        Bilik Arena
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
        Azərbaycanın intellektual arenası
      </div>
      <div style={{ marginTop: '3rem' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--primary-gold)',
          borderTopColor: 'transparent',
          borderRadius: '50%'
        }} className="animate-spin" />
      </div>
    </div>
  );
};
