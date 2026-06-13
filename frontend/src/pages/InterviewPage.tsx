import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const SAMPLE_QUESTION =
  'Can you describe a time when you successfully worked as part of a team to overcome a difficult challenge?';

type Status = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

export default function InterviewPage() {
  const location = useLocation();
  const topics: string[] = location.state?.topics ?? [];

  const videoRef        = useRef<HTMLVideoElement>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);

  const [camActive, setCamActive]   = useState(false);
  const [status, setStatus]         = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [gcsUrl, setGcsUrl]         = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [questionNum]               = useState(1);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCamActive(true);
      })
      .catch(() => setCamActive(false));

    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'].find(
      m => MediaRecorder.isTypeSupported(m)
    ) ?? '';

    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = handleUpload;
    recorder.start(250); // collect chunks every 250ms
    recorderRef.current = recorder;
    setStatus('recording');
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const handleUpload = async () => {
    setStatus('uploading');
    setErrorMsg('');
    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const form = new FormData();
      form.append('video', blob, 'recording.webm');

      const res = await fetch(`${backendUrl}/api/interview/submit`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Upload failed');
      }

      const data = await res.json();
      setGcsUrl(data.videoUrl ?? '');
      setTranscript(data.transcript ?? '');
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleToggle = () => {
    if (status === 'recording') stopRecording();
    else startRecording();
  };

  return (
    <div className="interview-page">
      <nav className="page-nav">
        <span className="logo">Cipher.AI 🤖</span>
        {topics.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {topics.map(t => (
              <span key={t} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 100,
                padding: '3px 10px',
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
              }}>{t}</span>
            ))}
          </div>
        )}
      </nav>

      <main className="interview-main">
        <p className="question-label">Answer: Question {questionNum}</p>
        <p className="question-text">{SAMPLE_QUESTION}</p>

        {/* Webcam */}
        <div className="webcam-box">
          {camActive ? (
            <video ref={videoRef} muted playsInline />
          ) : (
            <div className="webcam-off">
              <span className="webcam-off-icon">📷</span>
              <span>Camera unavailable</span>
            </div>
          )}
          {status === 'recording' && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: '#ff4444', borderRadius: 100,
              padding: '3px 10px', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              REC
            </div>
          )}
        </div>

        {/* Record / Stop button */}
        {(status === 'idle' || status === 'recording') && (
          <button
            className={`record-btn${status === 'recording' ? ' recording' : ''}`}
            onClick={handleToggle}
            disabled={!camActive}
            title={status === 'recording' ? 'Stop & submit' : 'Start recording'}
          >
            {status === 'recording' ? '⏹' : '🎙'}
          </button>
        )}

        {/* States */}
        {status === 'uploading' && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Processing video…
          </p>
        )}

        {status === 'error' && (
          <p className="error-text">{errorMsg}</p>
        )}

        {status === 'done' && (
          <div style={{
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '20px 24px',
            maxWidth: 520,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Transcript
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              {transcript || '(no speech detected)'}
            </p>
            {gcsUrl && (
              <a
                href={gcsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}
              >
                🎬 View saved video
              </a>
            )}
            <button
              className="btn-proceed"
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
              onClick={() => setStatus('idle')}
            >
              Record again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
