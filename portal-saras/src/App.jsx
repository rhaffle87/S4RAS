import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { KeycloakProvider, useKeycloak } from './context/KeycloakContext';
import Beranda from './pages/Beranda';
import Akun from './pages/Akun';
import Pengumuman from './pages/Pengumuman';
import Admin from './pages/Admin';
import Pengaturan from './pages/Pengaturan';

import { ThemeLanguageProvider } from './context/ThemeLanguageContext';

const Page = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const AppRoutes = () => {
  const { authenticated, initialized, isAdmin } = useKeycloak();
  const location = useLocation();

  if (!initialized) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-neutral-bg1)', color: '#fff' }}>
        Loading...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-neutral-bg1)', color: '#fff' }}>
        Redirecting to login...
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/home" element={<Page><Beranda /></Page>} />
        <Route path="/akun" element={<Page><Akun /></Page>} />
        <Route path="/pengumuman" element={<Page><Pengumuman /></Page>} />
        <Route path="/pengaturan" element={<Page><Pengaturan /></Page>} />
        <Route path="/admin" element={isAdmin ? <Page><Admin /></Page> : <Navigate to="/home" replace />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <KeycloakProvider>
      <ThemeLanguageProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ThemeLanguageProvider>
    </KeycloakProvider>
  );
}

export default App;
