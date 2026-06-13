import { useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading, error } = useGoogleAuth();

  const handleGoogle = () => signIn(() => navigate('/topics'));

  return (
    <div className="auth-page">
      {/* Form side */}
      <div className="auth-form-side">
        <nav className="page-nav">
          <span className="logo">Cipher.AI 🤖</span>
        </nav>

        <div className="auth-form-inner">
          <div>
            <h1 className="auth-heading">Welcome Back!</h1>
            <p className="auth-subheading">Sign in to continue your practice</p>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <div className="form-row">
              <label className="form-label">Password</label>
              <a className="form-link" href="#">Forgot password?</a>
            </div>
            <input className="form-input" type="password" placeholder="••••••••" />
          </div>

          <div className="form-group">
            <div className="form-row" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" /> Remember me for 14 days
              </label>
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', padding: '13px' }}>
            Sign In
          </button>

          {error && <p className="error-text">{error}</p>}

          <div className="divider">or</div>

          <button className="google-btn" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon />
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>

          <p className="auth-switch">
            Don't have an account?{' '}
            <span onClick={() => navigate('/signup')}>Sign Up</span>
          </p>
        </div>
      </div>

      {/* Visual side */}
      <div className="auth-visual">
        <div className="auth-visual-inner">
          <span className="auth-visual-robot">🤖</span>
          <span className="auth-visual-tag">AI-powered interview prep</span>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
            Practice with real interview questions and get instant AI feedback
          </p>
        </div>
      </div>
    </div>
  );
}
