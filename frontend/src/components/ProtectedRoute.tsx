import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed]     = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthed(!!user);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0a0a0a',
        color: 'rgba(255,255,255,0.25)', fontSize: 13,
      }}>
        Checking authentication…
      </div>
    );
  }

  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
