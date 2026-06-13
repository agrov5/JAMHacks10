import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';

const STANDARD_TOPICS = [
  'Teamwork',
  'Problem Solving',
  'Adaptability',
  'Communication',
  'Leadership',
  'Project Management',
];

export default function TopicsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const suggestedGoals: string[] = location.state?.suggestedGoals ?? [];

  // Pre-select AI suggestions (up to 3), deduplicated against standard list
  const [selected, setSelected] = useState<string[]>(suggestedGoals.slice(0, 3));

  // Standard topics not already in AI suggestions
  const remainingStandard = STANDARD_TOPICS.filter(t => !suggestedGoals.includes(t));

  const toggle = (topic: string) => {
    setSelected(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : prev.length < 3
          ? [...prev, topic]
          : prev
    );
  };

  return (
    <div className="topics-page">
      <nav className="page-nav">
        <Logo />
      </nav>

      <main className="topics-main">
        <div style={{ textAlign: 'center' }}>
          <h1 className="topics-heading">Choose Up To 3 Topics</h1>
          <p className="topics-sub" style={{ marginTop: 8 }}>
            {suggestedGoals.length > 0
              ? 'AI picked these from your resume — adjust as you like'
              : "We'll tailor your questions around these"}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 560 }}>
          {suggestedGoals.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
                AI Suggested · from your resume
              </p>
              <div className="topics-grid" style={{ justifyContent: 'flex-start' }}>
                {suggestedGoals.map(topic => (
                  <button
                    key={topic}
                    className={`topic-pill${selected.includes(topic) ? ' selected' : ''}`}
                    onClick={() => toggle(topic)}
                  >
                    {topic}
                    <span className="topic-suggested-badge">AI</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            {suggestedGoals.length > 0 && (
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
                Standard Topics
              </p>
            )}
            <div className="topics-grid" style={{ justifyContent: 'flex-start' }}>
              {remainingStandard.map(topic => (
                <button
                  key={topic}
                  className={`topic-pill${selected.includes(topic) ? ' selected' : ''}`}
                  onClick={() => toggle(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          {selected.length} / 3 selected
        </p>
      </main>

      <div className="page-bottom">
        <button
          className="btn-proceed"
          disabled={selected.length === 0}
          onClick={() => navigate('/interview-setup', { state: { topics: selected } })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
