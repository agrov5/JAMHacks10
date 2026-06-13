import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

type Status = 'checking' | 'idle' | 'uploading' | 'analysing' | 'error';

export default function ResumePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  const storedUser = localStorage.getItem('user');
  const userId: string = storedUser ? JSON.parse(storedUser).id : '';

  // On mount: check whether the user already has a resume
  useEffect(() => {
    if (!userId) { setStatus('idle'); return; }

    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/user/${userId}/profile`);
        const data = await res.json() as { hasResume?: boolean };

        if (data.hasResume) {
          // Resume already on file — fetch AI suggestions and skip ahead
          setStatus('analysing');
          const sugRes = await fetch(`${backendUrl}/api/user/${userId}/resume-suggestions`);
          const sugData = await sugRes.json() as { suggestedGoals?: string[] };
          navigate('/topics', { state: { suggestedGoals: sugData.suggestedGoals ?? [] }, replace: true });
        } else {
          setStatus('idle');
        }
      } catch {
        // Fall back to showing the upload UI
        setStatus('idle');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setStatus('idle');
    setErrorMsg('');
  };

  const handleUpload = async () => {
    if (!file || !userId) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      const form = new FormData();
      form.append('resume', file);
      form.append('userId', userId);

      const res = await fetch(`${backendUrl}/api/user/resume`, { method: 'PUT', body: form });
      const data = await res.json() as { suggestedGoals?: string[]; message?: string };
      if (!res.ok) throw new Error(data.message ?? `Upload failed (${res.status})`);

      navigate('/topics', { state: { suggestedGoals: data.suggestedGoals ?? [] } });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  };

  const handleSkip = () => navigate('/topics', { state: { suggestedGoals: [] } });

  // Loading states while checking / analysing existing resume
  if (status === 'checking' || status === 'analysing') {
    return (
      <div className="steps-page">
        <nav className="page-nav"><Logo /></nav>
        <main className="steps-main">
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            {status === 'checking' ? 'Checking your profile…' : 'Analysing your resume…'}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="steps-page">
      <nav className="page-nav">
        <Logo />
      </nav>

      <main className="steps-main">
        <div style={{ textAlign: 'center' }}>
          <h1 className="steps-heading">Upload Your Resume</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            We'll analyse it to suggest the most relevant practice goals for you
          </p>
        </div>

        <div className="resume-upload-card">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div
            className={`resume-drop-zone${file ? ' has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <>
                <span style={{ fontSize: 32 }}>📄</span>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{file.name}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  {(file.size / 1024).toFixed(0)} KB · Click to change
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 32 }}>📎</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  Click to select your resume
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>PDF only · max 10 MB</span>
              </>
            )}
          </div>

          {status === 'error' && (
            <p className="error-text" style={{ textAlign: 'center' }}>{errorMsg}</p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              className="btn-proceed"
              disabled={!file || status === 'uploading'}
              onClick={handleUpload}
            >
              {status === 'uploading' ? 'Analysing resume…' : 'Upload & Continue'}
            </button>

            <button
              className="btn-proceed"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
              onClick={handleSkip}
              disabled={status === 'uploading'}
            >
              Skip
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
