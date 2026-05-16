import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/authStore';
import { BottomNav } from './shared/ui/BottomNav';
import { ToastProvider } from './shared/ui/Toast';
import { SoloGameGuard, DuelGuard } from './shared/ui/RouteGuards';

// Pages
import { HomePage } from './pages/HomePage';
import { CitySelectionPage } from './pages/CitySelectionPage';
import { SoloSetupPage } from './pages/SoloSetupPage';
import { SoloGamePage } from './pages/SoloGamePage';
import { SoloResultPage } from './pages/SoloResultPage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { DuelsPage } from './pages/DuelsPage';
import { DuelGamePage } from './pages/DuelGamePage';
import { DuelResultPage } from './pages/DuelResultPage';
import { DuelWaitingPage } from './pages/DuelWaitingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SplashScreen } from './pages/SplashScreen';
import { AdminPage } from './pages/AdminPage';

const App: React.FC = () => {
  const { user, isLoading, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) return <SplashScreen />;

  // If authenticated but no city selected, force city selection
  if (user && !user.cityId) {
    return (
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/city-selection" element={<CitySelectionPage />} />
            <Route path="*" element={<Navigate to="/city-selection" />} />
          </Routes>
        </Router>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/solo/setup" element={<SoloSetupPage />} />
            <Route
              path="/solo/game"
              element={
                <SoloGameGuard>
                  <SoloGamePage />
                </SoloGameGuard>
              }
            />
            <Route
              path="/solo/result"
              element={
                <SoloGameGuard>
                  <SoloResultPage />
                </SoloGameGuard>
              }
            />
            <Route path="/leaderboards" element={<LeaderboardsPage />} />
            <Route path="/duels" element={<DuelsPage />} />
            <Route
              path="/duels/game"
              element={
                <DuelGuard>
                  <DuelGamePage />
                </DuelGuard>
              }
            />
            <Route
              path="/duels/result"
              element={
                <DuelGuard>
                  <DuelResultPage />
                </DuelGuard>
              }
            />
            <Route
              path="/duels/waiting"
              element={
                <DuelGuard>
                  <DuelWaitingPage />
                </DuelGuard>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/city-selection" element={<CitySelectionPage />} />
            {/* Admin panel – only accessible by admins (backend enforces via AdminGuard) */}
            {user?.isAdmin && <Route path="/admin" element={<AdminPage />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
