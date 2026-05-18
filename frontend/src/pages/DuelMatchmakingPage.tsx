import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../features/auth/authStore';
import { useDuelStore } from '../features/duels/duelStore';
import { Swords, X } from 'lucide-react';
import { useToast } from '../shared/ui/Toast';

export const DuelMatchmakingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'connecting' | 'searching' | 'matched'>('connecting');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/duels');
      return;
    }

    // Determine WebSocket connection URL
    // Standard local dev uses port 3001, production uses same host
    const wsUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001/duels' 
      : `${window.location.origin.replace(/^http/, 'ws')}/duels`;

    const socket = io(wsUrl, {
      query: { userId: user.id },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('searching');
      socket.emit('join_lobby', { userId: user.id });
    });

    socket.on('queue_status', (data: { status: string }) => {
      if (data.status === 'waiting') {
        setStatus('searching');
      }
    });

    socket.on('duel_matched', (data: { duelId: string; opponentId: string; duel: any }) => {
      setStatus('matched');
      showToast('Rəqib tapıldı! Oyun başlayır...', 'success');

      // Populate Zustand store
      // Res has { duelId, status, questions, role, expiresAt } in duel object
      const role = data.duel.initiatorId === user.id ? 'initiator' : 'opponent';
      useDuelStore.getState().setDuel(data.duel, data.duel.questions || [], role);

      // Navigate to active game screen
      setTimeout(() => {
        navigate('/duels/game');
      }, 1500);
    });

    socket.on('matchmaking_error', (data: { message: string }) => {
      showToast(data.message, 'error');
      navigate('/duels');
    });

    socket.on('disconnect', () => {
      setStatus('connecting');
    });

    return () => {
      if (socket) {
        socket.emit('leave_lobby', { userId: user.id });
        socket.disconnect();
      }
    };
  }, [user, navigate, showToast]);

  const handleCancel = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_lobby', { userId: user?.id });
      socketRef.current.disconnect();
    }
    showToast('Axtarış ləğv edildi', 'info');
    navigate('/duels');
  };

  return (
    <div 
      className="page-container" 
      style={{ 
        padding: '2rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)',
        textAlign: 'center'
      }}
    >
      {/* Radar Matching Animation */}
      <div 
        style={{ 
          position: 'relative', width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(0,191,255,0.03)', border: '1.5px solid rgba(0,191,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem'
        }}
      >
        <div 
          className="animate-ping" 
          style={{ 
            position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
            background: 'rgba(0,191,255,0.06)', animationDuration: '3s'
          }} 
        />
        <div 
          className="animate-ping" 
          style={{ 
            position: 'absolute', width: '70%', height: '70%', borderRadius: '50%',
            background: 'rgba(168,85,247,0.06)', animationDuration: '2s'
          }} 
        />
        <div 
          style={{ 
            width: 70, height: 70, borderRadius: '50%', 
            background: 'rgba(0,191,255,0.15)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-blue)'
          }}
        >
          <Swords size={32} className={status === 'matched' ? '' : 'animate-pulse'} />
        </div>
      </div>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 850, color: '#fff', margin: '0 0 0.5rem 0' }}>
        {status === 'connecting' ? 'Şəbəkəyə Qoşulur...' : status === 'matched' ? 'Rəqib Tapıldı!' : 'Rəqib Axtarılır'}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 2rem 0', maxWidth: 280, lineHeight: '1.35rem' }}>
        {status === 'connecting' ? 'Bilik Arenası PvP lobby serverinə qoşulur...' : status === 'matched' ? 'Arena hazırlanır, zəhmət olmasa gözləyin.' : 'Eyni səviyyəli rəqiblərdən biri tapılır. Bu bir neçə saniyə çəkə bilər.'}
      </p>

      {status !== 'matched' && (
        <button 
          onClick={handleCancel}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', 
            borderRadius: '999px', background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,71,71,0.12)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        >
          <X size={16} /> Axtarışı Ləğv Et
        </button>
      )}
    </div>
  );
};
