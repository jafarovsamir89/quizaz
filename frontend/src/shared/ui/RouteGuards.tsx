import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGameStore } from '../../features/solo/gameStore';
import { useDuelStore } from '../../features/duels/duelStore';

/**
 * Protects routes that require an active solo game session.
 * Redirects to /solo/setup if no session exists.
 */
export const SoloGameGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionId, results } = useGameStore();

  // Allow result page if results exist
  const isResultRoute = window.location.pathname === '/solo/result';
  if (isResultRoute && results) return <>{children}</>;

  // Require sessionId for game page
  if (!sessionId) {
    return <Navigate to="/solo/setup" replace />;
  }

  return <>{children}</>;
};

/**
 * Protects routes that require an active duel.
 * Redirects to /duels if no duel exists.
 */
export const DuelGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentDuelId, results } = useDuelStore();

  // Allow result/waiting pages if duel context exists
  const path = window.location.pathname;
  const isResultRoute = path === '/duels/result';
  const isWaitingRoute = path === '/duels/waiting';

  if ((isResultRoute || isWaitingRoute) && currentDuelId) {
    return <>{children}</>;
  }

  if (!currentDuelId) {
    return <Navigate to="/duels" replace />;
  }

  return <>{children}</>;
};
