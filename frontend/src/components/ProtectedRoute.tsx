import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed]     = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase has a valid session — restore backend user data if localStorage is missing
        if (!localStorage.getItem('user')) {
          try {
            const idToken = await firebaseUser.getIdToken();
            const res = await fetch(`${backendUrl}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
            if (res.ok) {
              const data = await res.json() as Record<string, unknown>;
              localStorage.setItem('user', JSON.stringify(data));
            }
          } catch {
            // Best-effort; Firebase auth still valid even if this fails
          }
        }
        setAuthed(true);
      } else {
        localStorage.removeItem('user');
        setAuthed(false);
      }
      setChecking(false);
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0a0a0a',
        color: 'rgba(255,255,255,0.25)', fontSize: 13,
      }}>
        Loading…
      </div>
    );
  }

  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
