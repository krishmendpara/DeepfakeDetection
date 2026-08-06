import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import StatsSection from './components/StatsSection';
import FeaturesSection from './components/FeaturesSection';
import UploadSection from './components/UploadSection';
import ProfileSection from './components/ProfileSection';
import AuthPage from './components/AuthPage';
import Footer from './components/Footer';
import { LightRays } from './registry/magicui/light-rays';
import { RiLockPasswordLine } from 'react-icons/ri';
import './App.css';

export default function App() {
  // Authentication State
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token');
    return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return (saved && saved !== 'null' && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // State-Based Routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Toggle tubecursor visibility (Landing page only when not logged in)
  useEffect(() => {
    const wrap = document.getElementById('tubes-wrap');
    if (wrap) {
      if (currentPath === '/' && !token) {
        wrap.style.display = 'block';
      } else {
        wrap.style.display = 'none';
      }
    }
  }, [currentPath, token]);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigateTo('/');
  };

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    navigateTo('/');
  };

  // Render components based on current route
  const renderContent = () => {
    switch (currentPath) {
      case '/profile':
        if (!token) {
          // Redirect to login if not authenticated
          setTimeout(() => navigateTo('/login'), 0);
          return null;
        }
        return (
          <ProfileSection 
            token={token} 
            user={user} 
            handleLogout={handleLogout} 
            navigateTo={navigateTo} 
          />
        );

      case '/login':
        return (
          <AuthPage 
            mode="login" 
            handleLoginSuccess={handleLoginSuccess} 
            navigateTo={navigateTo} 
          />
        );

      case '/signup':
        return (
          <AuthPage 
            mode="register" 
            handleLoginSuccess={handleLoginSuccess} 
            navigateTo={navigateTo} 
          />
        );
      case '/why-us':
        return <FeaturesSection />;

      case '/':
      default:
        return (
          <div className="relative overflow-hidden" style={{ position: "relative", overflow: "hidden" }}>
            <LightRays count={6} opacity={0.5} speed={16} />
            <div className="relative z-10" style={{ position: "relative", zIndex: 10 }}>
              {token && (
                <UploadSection token={token} user={user} handleLogout={handleLogout} />
              )}
              {!token && <HeroSection token={token} navigateTo={navigateTo} />}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Navbar 
        token={token} 
        user={user} 
        navigateTo={navigateTo} 
        currentPath={currentPath} 
        handleLogout={handleLogout} 
      />
      <main className="main-content-wrapper">
        {renderContent()}
      </main>
      <Footer navigateTo={navigateTo} />
    </>
  );
}
