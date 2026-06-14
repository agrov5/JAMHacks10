import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

type Phase = 'loading' | 'speaking' | 'prep' | 'recording' | 'uploading' | 'error';
interface Answer { blob: Blob; mimeType: string; }

function fmtTime(s: number) { return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`; }

export default function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    topics = [],
    questionCount = 3,
    difficulty = 'Medium',
    timeLimit = 0,
    prepTime = 30,
  } = (location.state ?? {}) as {
    topics: string[];
    questionCount: number;
    difficulty: string;
    timeLimit: number;
    prepTime: number;
  };

  // ── Persistent refs ──────────────────────────────────────────────────────────
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const mimeTypeRef = useRef('');
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const ttsAudioRef      = useRef<HTMLAudioElement | null>(null);
  const ttsCancelledRef  = useRef(false);

  // Session tracking via refs to avoid stale closures in callbacks
  const sessRef = useRef<{ questions: string[]; currentQ: number; answers: Answer[] }>({
    questions: [], currentQ: 0, answers: [],
  });

  // Reassigned on every render so recorder.onstop always calls the latest version
  const onStopRef = useRef<() => void>(() => {});

  // ── React state (drives re-renders) ──────────────────────────────────────────
  const [camActive, setCamActive] = useState(false);
  const [camError,  setCamError]  = useState('');
  const [phase,     setPhase]     = useState<Phase>('loading');
  const [currentQ,  setCurrentQ]  = useState(0);
  const [totalQ,    setTotalQ]    = useState(questionCount);
  const [question,  setQuestion]  = useState('');
  const [prepLeft,  setPrepLeft]  = useState(0);
  const [recLeft,   setRecLeft]   = useState<number | null>(null);
  const [errorMsg,  setErrorMsg]  = useState('');

  // ── Helpers (all use refs → no stale-closure issues) ─────────────────────────
  const clearTimer = () => {
    if (timerRef.current !== null) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const stopTTS = () => {
    ttsCancelledRef.current = true;
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.src = '';
      ttsAudioRef.current = null;
    }
  };

  const speakQuestion = (text: string): Promise<void> => {
    const voiceId = (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string) || '21m00Tcm4TlvDq8ikWAM';

    return fetch(`${backendUrl}/api/interview/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    })
      .then(res => { if (!res.ok) return; return res.blob(); })
      .then(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        return new Promise<void>(resolve => {
          const audio = new Audio(url);
          ttsAudioRef.current = audio;
          const done = () => { URL.revokeObjectURL(url); ttsAudioRef.current = null; resolve(); };
          audio.onended = done;
          audio.onerror = done;
          audio.play().catch(done);
        });
      })
      .catch(() => undefined);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    clearTimer();
    chunksRef.current = [];

    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ].find(m => MediaRecorder.isTypeSupported(m)) ?? '';
    mimeTypeRef.current = mimeType;

    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => onStopRef.current();   // always invokes the latest handler
    recorder.start(250);
    recorderRef.current = recorder;
    setPhase('recording');

    if (timeLimit > 0) {
      let t = timeLimit;
      setRecLeft(t);
      timerRef.current = setInterval(() => {
        t--;
        setRecLeft(t);
        if (t <= 0) { clearTimer(); recorderRef.current?.stop(); recorderRef.current = null; }
      }, 1000);
    } else {
      setRecLeft(null);
    }
  };

  const startPrepTimer = () => {
    if (prepTime === 0) { startRecording(); return; }
    setPhase('prep');
    let t = prepTime;
    setPrepLeft(t);
    timerRef.current = setInterval(() => {
      t--;
      setPrepLeft(t);
      if (t <= 0) { clearTimer(); startRecording(); }
    }, 1000);
  };

  const enterPrep = () => {
    clearTimer();
    stopTTS();
    ttsCancelledRef.current = false;
    const q = sessRef.current.currentQ;
    setCurrentQ(q);
    const questionText = sessRef.current.questions[q] ?? '';
    setQuestion(questionText);
    setPhase('speaking');

    speakQuestion(questionText).then(() => {
      if (!ttsCancelledRef.current) startPrepTimer();
    });
  };

  // Updated on every render so onStopRef.current always reads latest closures
  onStopRef.current = () => {
    clearTimer();
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'video/webm' });
    sessRef.current.answers = [...sessRef.current.answers, { blob, mimeType: mimeTypeRef.current }];

    const next = sessRef.current.currentQ + 1;
    if (next < sessRef.current.questions.length) {
      sessRef.current.currentQ = next;
      enterPrep();
    } else {
      submitAll(sessRef.current.answers);
    }
  };

  const submitAll = async (answers: Answer[]) => {
    setPhase('uploading');
    try {
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? (JSON.parse(storedUser) as { id: string }).id : '';

      const form = new FormData();
      form.append('userId', userId);
      form.append('goals', JSON.stringify(topics));
      form.append('questions', JSON.stringify(sessRef.current.questions));
      form.append('difficulty', difficulty);
      answers.forEach((a, i) => form.append(`video_${i}`, a.blob, `recording_${i}.webm`));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);
      const res = await fetch(`${backendUrl}/api/interview/submit-batch`, {
        method: 'POST', body: form, signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const data = await res.json() as { results?: unknown[]; message?: string };
      if (!res.ok) throw new Error(data.message ?? `Failed (${res.status})`);

      navigate('/feedback', { state: { results: data.results ?? [], topics, difficulty } });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Camera API not available (requires HTTPS)'); return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        setCamActive(true);
      })
      .catch((err: unknown) => setCamError(err instanceof Error ? err.message : String(err)));

    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); clearTimer(); stopTTS(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/interview/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topics, difficulty, count: questionCount }),
        });
        const data = await res.json() as { questions?: string[]; message?: string };
        if (!res.ok) throw new Error(data.message ?? 'Failed to generate questions');
        const qs = data.questions ?? [];
        sessRef.current.questions = qs;
        sessRef.current.currentQ  = 0;
        sessRef.current.answers   = [];
        setTotalQ(qs.length);
        enterPrep();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to generate questions');
        setPhase('error');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopManually = () => { clearTimer(); recorderRef.current?.stop(); recorderRef.current = null; };
  const skipPrep     = () => { stopTTS(); clearTimer(); startRecording(); };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="interview-page">
      <nav className="page-nav">
        <Logo />
        {topics.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {topics.map(t => (
              <span key={t} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </nav>

      <main className="interview-main">
        {/* Webcam box — always mounted so videoRef is set before stream arrives */}
        <div
          className="webcam-box"
          style={{ display: phase === 'speaking' || phase === 'prep' || phase === 'recording' ? undefined : 'none' }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: camActive ? 'block' : 'none' }}
          />
          {!camActive && (
            <div className="webcam-off">
              <span className="webcam-off-icon">📷</span>
              <span>{camError || 'Waiting for camera…'}</span>
              {camError && <span style={{ fontSize: 11, color: 'rgba(255,100,100,0.7)', maxWidth: 280, textAlign: 'center' }}>{camError}</span>}
            </div>
          )}

          {/* Speaking overlay */}
          {phase === 'speaking' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', gap: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                Reading question
              </p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#fff',
                      animation: 'tts-pulse 1.2s ease-in-out infinite',
                      animationDelay: `${i * 0.2}s`,
                      display: 'inline-block',
                    }}
                  />
                ))}
              </div>
              <button
                className="btn-proceed"
                style={{ fontSize: 12, padding: '6px 20px', marginTop: 6 }}
                onClick={skipPrep}
              >
                Skip
              </button>
            </div>
          )}

          {/* Prep overlay */}
          {phase === 'prep' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', gap: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                Prep time
              </p>
              <p style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{prepLeft}</p>
              <button
                className="btn-proceed"
                style={{ fontSize: 12, padding: '6px 20px', marginTop: 6 }}
                onClick={skipPrep}
              >
                Start now
              </button>
            </div>
          )}

          {/* REC badge */}
          {phase === 'recording' && (
            <div style={{ position: 'absolute', top: 12, right: 12, background: '#ff4444', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              REC
              {recLeft !== null && <span>{fmtTime(recLeft)}</span>}
            </div>
          )}

        </div>

        {/* Question text + controls */}
        {(phase === 'speaking' || phase === 'prep' || phase === 'recording') && (
          <>
            <p className="question-label">Question {currentQ + 1} of {totalQ} · {difficulty}</p>
            <p className="question-text">{question}</p>
            {phase === 'recording' && (
              <button className="record-btn recording" onClick={stopManually} title="Stop & submit answer">
                ⏹
              </button>
            )}
          </>
        )}

        {phase === 'loading' && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Generating your questions…</p>
        )}

        {phase === 'uploading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Analysing your responses…</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>This may take a moment</p>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <p className="error-text">{errorMsg}</p>
            <button className="btn-proceed" onClick={() => navigate('/topics')}>Try again</button>
          </div>
        )}
      </main>
    </div>
  );
}
