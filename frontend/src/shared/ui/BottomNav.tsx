import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Swords, User, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../../features/auth/authStore';
import { useTranslation } from '../i18n/useTranslation';

export const BottomNav: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <nav className="nav-bar">
      <NavLink to="/" end className={({ isActive }) => cn('nav-item', isActive && 'active')}>
        <Home size={24} />
        <span>{t('nav_home')}</span>
      </NavLink>
      <NavLink to="/duels" className={({ isActive }) => cn('nav-item', isActive && 'active')}>
        <Swords size={24} />
        <span>{t('nav_duels')}</span>
      </NavLink>
      <NavLink to="/leaderboards" className={({ isActive }) => cn('nav-item', isActive && 'active')}>
        <Trophy size={24} />
        <span>{t('nav_leaderboard')}</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => cn('nav-item', isActive && 'active')}>
        <User size={24} />
        <span>{t('nav_profile')}</span>
      </NavLink>
      {user?.isAdmin && (
        <NavLink to="/admin" className={({ isActive }) => cn('nav-item', isActive && 'active')}>
          <ShieldCheck size={24} />
          <span>Admin</span>
        </NavLink>
      )}
    </nav>
  );
};
