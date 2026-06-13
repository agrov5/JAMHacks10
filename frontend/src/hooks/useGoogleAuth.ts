import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned unexpected response (${res.status}): ${text.slice(0, 120)}`);
  }
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (onSuccess?: (user: unknown) => void) => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await parseResponse(response) as Record<string, string>;

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      localStorage.setItem('user', JSON.stringify(data));
      onSuccess?.(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
}
