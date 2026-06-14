import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Logo from '../components/Logo';
import JobsModal from '../components/JobsModal';

interface QuestionResult {
  sessionId?: string;
  question: string;
  transcript: string;
  feedback: string;
  videoUrl: string;
}

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { results = [], topics = [], difficulty = '' } = (location.state ?? {}) as {
    results: QuestionResult[];
    topics: string[];
    difficulty: string;
  };

  const [expanded,   setExpanded]   = useState<number>(0);
  const [showJobs,   setShowJobs]   = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="steps-page">
      <nav className="page-nav">
        <Logo />
          <div style={{ display: 'flex', gap: 6 }}>
          {difficulty && (
            <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {difficulty}
            </span>
          )}
          {topics.map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </span>
          ))}
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: '32px 0', overflowY: 'auto' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>Your Feedback</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            {results.length} question{results.length !== 1 ? 's' : ''} · click each to expand
          </p>
        </div>

        {results.length === 0 && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>No results available.</p>
        )}

        {results.map((r, i) => (
          <div key={i} className="feedback-question-card">
            <button
              className="feedback-question-header"
              onClick={() => setExpanded(expanded === i ? -1 : i)}
            >
              <span className="feedback-q-num">Q{i + 1}</span>
              <span className="feedback-q-text">{r.question}</span>
              <span className="feedback-chevron">{expanded === i ? '▲' : '▼'}</span>
            </button>

            {expanded === i && (
              <div className="feedback-question-body">
                {/* Non-Verbal Analytics Section - Show if analytics exist in feedback */}
                {r.feedback && (
                  r.feedback.includes('Non-Verbal') || r.feedback.includes('Spatial Distribution') ||
                  r.feedback.includes('Hand Gestures') || r.feedback.includes('Eye Contact') ||
                  r.feedback.includes('Posture')
                ) && (
                  <div className="feedback-section" style={{ background: 'rgba(33, 150, 243, 0.08)', borderLeft: '3px solid #2196f3', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p className="feedback-section-label" style={{ color: '#2196f3' }}>📊 Non-Verbal Communication Analytics</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: '12px' }}>
                      Your body language and presentation were analyzed in real-time
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                      {[
                        { label: '📏 Spatial', metric: 'Spatial Distribution' },
                        { label: '👋 Gestures', metric: 'Hand Gestures' },
                        { label: '👁️ Eye Contact', metric: 'Eye Contact' },
                        { label: '🧍 Posture', metric: 'Posture' }
                      ].map(({ label, metric }) => {
                        const match = r.feedback.match(new RegExp(`${metric}[^0-9]*(\\d+)\\s*/\\s*100`, 'i'));
                        if (!match) return null;
                        const score = parseInt(match[1]);
                        const color = score >= 80 ? '#4caf50' : score >= 60 ? '#ff9800' : '#f44336';
                        return (
                          <div key={metric} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontSize: 22, fontWeight: '700', color }}>{score}/100</div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>
                )}

                <div className="feedback-section">
                  <p className="feedback-section-label">AI Analysis</p>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
                    <ReactMarkdown>{r.feedback || 'No feedback available.'}</ReactMarkdown>
                  </div>
                </div>
                <div className="feedback-section">
                  <p className="feedback-section-label">Transcript</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                    {r.transcript || '(no speech detected)'}
                  </p>
                </div>
                {r.videoUrl && (
                  <a href={r.videoUrl} target="_blank" rel="noreferrer"
                    className="btn-proceed"
                    style={{ fontSize: 11, padding: '5px 14px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', textDecoration: 'none', alignSelf: 'flex-start' }}>
                    View recording
                  </a>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 8, flexWrap: 'wrap' }}>
          <button className="btn-proceed" onClick={() => navigate('/next-steps')}>
            Practice again
          </button>
          {topics.length > 0 && (
            <button
              className="btn-proceed"
              onClick={() => setShowJobs(true)}
            >
              Find Relevant Jobs
            </button>
          )}
          <button
            className="btn-proceed"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
            onClick={() => navigate('/profile')}
          >
            View Profile
          </button>
          <button
            className="btn-proceed"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </main>

      {showJobs && <JobsModal topics={topics} onClose={() => setShowJobs(false)} />}
    </div>
  );
}
