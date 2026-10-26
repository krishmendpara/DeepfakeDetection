import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import StatsSection from './components/StatsSection';
import Footer from './components/Footer';
import { LightRays } from './registry/magicui/light-rays';
import { AuthProvider, useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import './App.css';

// Lazy-loaded routes and heavy visual modules for performance & modularity
const NeonTubesTrail = lazy(() => import('./components/NeonTubesTrail'));
const FeaturesSection = lazy(() => import('./components/FeaturesSection'));
const UploadSection = lazy(() => import('./components/UploadSection'));
const ProfileSection = lazy(() => import('./components/ProfileSection'));
const AuthPage = lazy(() => import('./components/AuthPage'));

// Protected Route wrapper: redirects unauthenticated users to /login and saves return URL
function ProtectedRoute({ children, navigateTo, currentPath }) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      sessionStorage.setItem('redirect_after_login', currentPath);
      navigateTo('/login');
    }
  }, [isAuthenticated, loading, currentPath, navigateTo]);

  if (loading) {
    return (
      <div className="route-loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="xai-spinner" style={{ width: '38px', height: '38px' }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return children;
}

// Public-Only Route wrapper: redirects already logged-in users to / (Home)
function PublicOnlyRoute({ children, navigateTo }) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      sessionStorage.removeItem('redirect_after_login');
      navigateTo('/');
    }
  }, [isAuthenticated, loading, navigateTo]);

  if (loading) {
    return (
      <div className="route-loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="xai-spinner" style={{ width: '38px', height: '38px' }} />
      </div>
    );
  }

  if (isAuthenticated) return null;
  return children;
}

// 404 Not Found View
function NotFoundPage({ navigateTo }) {
  return (
    <section className="auth-page-section">
      <div className="section-inner">
        <div className="auth-card drop-zone" style={{ cursor: 'default', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.4rem', lineHeight: 1 }}>404</h2>
          <h3 className="auth-title" style={{ marginBottom: '0.8rem' }}>Page Not Found</h3>
          <p className="auth-subtitle" style={{ marginBottom: '1.8rem', color: 'var(--text-secondary)' }}>
            The page you're looking for doesn't exist or has been relocated.
          </p>
          <button className="btn-primary" onClick={() => navigateTo('/')}>
            Back to Home
          </button>
        </div>
      </div>
    </section>
  );
}

// Landing Page Flow: Hero + About + Stats + Features
function LandingPage({ navigateTo, token }) {
  return (
    <div className="landing-page-flow">
      <HeroSection token={token} navigateTo={navigateTo} />
      <AboutSection />
      <StatsSection />
      <Suspense fallback={<div className="loading-placeholder" style={{ minHeight: '300px' }} />}>
        <FeaturesSection />
      </Suspense>
    </div>
  );
}

function AppContent() {
  const { user, token, isAuthenticated, loading, login, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname || '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoginSuccess = (newToken, newUser) => {
    login(newToken, newUser);
    const redirectUrl = sessionStorage.getItem('redirect_after_login') || '/';
    sessionStorage.removeItem('redirect_after_login');
    navigateTo(redirectUrl);
  };

  const handleLogout = async () => {
    await logout();
    navigateTo('/');
  };

  // Route resolver
  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <LandingPage navigateTo={navigateTo} token={token} />;

      case '/app':
      case '/detect':
      case '/results':
        return (
          <ProtectedRoute navigateTo={navigateTo} currentPath={currentPath}>
            <Suspense fallback={<div className="route-loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xai-spinner" /></div>}>
              <UploadSection token={token} user={user} handleLogout={handleLogout} />
            </Suspense>
          </ProtectedRoute>
        );

      case '/profile':
      case '/history':
        return (
          <ProtectedRoute navigateTo={navigateTo} currentPath={currentPath}>
            <Suspense fallback={<div className="route-loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xai-spinner" /></div>}>
              <ProfileSection 
                token={token} 
                user={user} 
                handleLogout={handleLogout} 
                navigateTo={navigateTo} 
              />
            </Suspense>
          </ProtectedRoute>
        );

      case '/login':
        return (
          <PublicOnlyRoute navigateTo={navigateTo}>
            <Suspense fallback={<div className="route-loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xai-spinner" /></div>}>
              <AuthPage 
                mode="login" 
                handleLoginSuccess={handleLoginSuccess} 
                navigateTo={navigateTo} 
              />
            </Suspense>
          </PublicOnlyRoute>
        );

      case '/signup':
      case '/register':
        return (
          <PublicOnlyRoute navigateTo={navigateTo}>
            <Suspense fallback={<div className="route-loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xai-spinner" /></div>}>
              <AuthPage 
                mode="register" 
                handleLoginSuccess={handleLoginSuccess} 
                navigateTo={navigateTo} 
              />
            </Suspense>
          </PublicOnlyRoute>
        );

      case '/why-us':
      case '/features':
        return (
          <Suspense fallback={<div className="route-loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xai-spinner" /></div>}>
            <FeaturesSection />
          </Suspense>
        );

      default:
        return <NotFoundPage navigateTo={navigateTo} />;
    }
  };

  return (
    <>
      {/* High-Performance 3D Neon Tubes Cursor Trail (Clean lifecycle, 0% CPU on scroll) */}
      {currentPath === '/' && (
        <Suspense fallback={null}>
          <NeonTubesTrail />
        </Suspense>
      )}

      {/* Optimized Global Ambient Light Rays Layer */}
      <LightRays
        count={5}
        color="rgba(239, 194, 127, 0.35)"
        blur={18}
        speed={16}
        length="100vh"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Navbar 
        token={token} 
        user={user} 
        navigateTo={navigateTo} 
        currentPath={currentPath} 
        handleLogout={handleLogout} 
      />

      <main className="main-content-wrapper">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer navigateTo={navigateTo} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
