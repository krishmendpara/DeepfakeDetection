import { useState } from 'react';
import { 
  RiUserLine, 
  RiLockPasswordLine, 
  RiMailLine 
} from 'react-icons/ri';
import './UploadSection.css'; // Reuse existing styles
import './AuthPage.css';

export default function AuthPage({ mode = 'login', handleLoginSuccess, navigateTo }) {
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const endpoint = mode === 'login' ? 'login' : 'register';
    const payload = mode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    try {
      const res = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      handleLoginSuccess(data.token, { name: data.name, email: data.email });
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page-section">
      <div className="section-inner">
        <div className="auth-card drop-zone" style={{ cursor: 'default' }}>
          <div className="auth-header">
            <h3 className="auth-title">
              {mode === 'login' ? 'Sign In to PixelTruth' : 'Create an Account'}
            </h3>
            <p className="auth-subtitle">Verify image authenticity instantly</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            {authError && <div className="auth-error-msg">{authError}</div>}
            
            {mode === 'register' && (
              <div className="input-group">
                <RiUserLine className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={authName} 
                  onChange={e => setAuthName(e.target.value)} 
                  required 
                />
              </div>
            )}

            <div className="input-group">
              <RiMailLine className="input-icon" />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <RiLockPasswordLine className="input-icon" />
              <input 
                type="password" 
                placeholder="Password" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Register Account'}
            </button>
          </form>
          <div className="auth-toggle">
            {mode === 'login' ? (
              <span>Don't have an account? <button onClick={() => navigateTo('/signup')}>Sign Up</button></span>
            ) : (
              <span>Already have an account? <button onClick={() => navigateTo('/login')}>Sign In</button></span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
