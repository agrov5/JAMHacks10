import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TOPICS = [
  'Teamwork',
  'Problem Solving',
  'Adaptability',
  'Communication',
  'Leadership',
  'Project Management',
];

export default function TopicsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

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
        <span className="logo">Cipher.AI 🤖</span>
      </nav>

      <main className="topics-main">
        <div style={{ textAlign: 'center' }}>
          <h1 className="topics-heading">Choose Up To 3 Topics</h1>
          <p className="topics-sub" style={{ marginTop: 8 }}>
            We'll tailor your interview questions around these
          </p>
        </div>

        <div className="topics-grid">
          {TOPICS.map(topic => (
            <button
              key={topic}
              className={`topic-pill${selected.includes(topic) ? ' selected' : ''}`}
              onClick={() => toggle(topic)}
            >
              {topic}
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
          onClick={() => navigate('/next-steps', { state: { topics: selected } })}
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
