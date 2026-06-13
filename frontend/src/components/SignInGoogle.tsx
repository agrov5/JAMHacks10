import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const SignInGoogle: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send token to backend
      const response = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Authentication failed');
      }

      const userData = await response.json();
      setUser(userData);
      // Optionally store user data in localStorage or context
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <h2>Welcome, {user.name}!</h2>
          <p>Email: {user.email}</p>
          <p>Username: {user.username}</p>
          <p>Allow AI: {user.allowAI ? 'Yes' : 'No'}</p>
          <button onClick={() => {
            localStorage.removeItem('user');
            setUser(null);
          }}>Sign out</button>
        </div>
      ) : (
        <>
          <button onClick={handleSignIn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </>
      )}
    </div>
  );
};