import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export default function ResumePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setStatus('idle');
    setErrorMsg('');
  };

  const handleUpload = async () => {
    if (!file) return;
    const storedUser = localStorage.getItem('user');
    const userId: string = storedUser ? JSON.parse(storedUser).id : '';
    if (!userId) { setErrorMsg('Not logged in'); return; }

    setStatus('uploading');
    setErrorMsg('');

    try {
      const form = new FormData();
      form.append('resume', file);
      form.append('userId', userId);

      const res = await fetch(`${backendUrl}/api/user/resume`, {
        method: 'PUT',
        body: form,
      });

      const data = await res.json() as { suggestedGoals?: string[]; message?: string };
      if (!res.ok) throw new Error(data.message ?? `Upload failed (${res.status})`);

      setStatus('done');
      navigate('/topics', { state: { suggestedGoals: data.suggestedGoals ?? [] } });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      setStatus('error');
    }
  };

  const handleSkip = () => navigate('/topics', { state: { suggestedGoals: [] } });

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
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)',
              }}
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
