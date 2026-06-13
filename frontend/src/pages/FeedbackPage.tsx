import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Logo from '../components/Logo';

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { transcript = '', feedback = '', videoUrl = '', topics = [] } =
    (location.state ?? {}) as {
      transcript: string;
      feedback: string;
      videoUrl: string;
      topics: string[];
    };

  return (
    <div className="steps-page">
      <nav className="page-nav">
        <Logo />
        {topics.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, padding: '32px 0', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>Your Feedback</h1>

        {/* AI Feedback */}
        <section style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            AI Analysis
          </p>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
            <ReactMarkdown>{feedback || 'No feedback available.'}</ReactMarkdown>
          </div>
        </section>

        {/* Transcript */}
        <section style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Transcript
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            {transcript || '(no speech detected)'}
          </p>
        </section>

        {/* Video link */}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-proceed"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(255,255,255,0.25)',
              alignSelf: 'flex-start',
            }}
          >
            🎬 View recording
          </a>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <button className="btn-proceed" onClick={() => navigate('/topics')}>
            Practice again
          </button>
          <button
            className="btn-proceed"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
            onClick={() => {
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
