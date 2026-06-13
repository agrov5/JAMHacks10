import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';

const TOPICS = [
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

  const [selected, setSelected] = useState<string[]>(suggestedGoals.slice(0, 3));

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
              ? 'We pre-selected these based on your resume — adjust as you like'
              : 'We\'ll tailor your interview questions around these'}
          </p>
        </div>

        <div className="topics-grid">
          {TOPICS.map(topic => (
            <button
              key={topic}
              className={`topic-pill${selected.includes(topic) ? ' selected' : ''}${suggestedGoals.includes(topic) && !selected.includes(topic) ? ' suggested' : ''}`}
              onClick={() => toggle(topic)}
            >
              {topic}
              {suggestedGoals.includes(topic) && (
                <span className="topic-suggested-badge">AI</span>
              )}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          {selected.length} / 3 selected
        </p>
      </main>

      <div className="page-bottom">
        <button
          className="btn-proceed"
          disabled={selected.length === 0}
          onClick={() => navigate('/interview', { state: { topics: selected } })}
        >
          Start Interview
        </button>
      </div>
    </div>
  );
}
