import RobotEmoji from '../components/RobotEmoji';
import { useNavigate, useLocation } from 'react-router-dom';

const STEPS = [
  { num: 1, text: 'Decide topics for you to respond to' },
  { num: 2, text: 'Generate questions for you to respond to' },
  { num: 3, text: 'AI will assess and give critique' },
];

export default function NextStepsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const topics: string[] = location.state?.topics ?? [];

  return (
    <div className="steps-page">
      <nav className="page-nav">
        <span className="logo">Cipher.AI <RobotEmoji size={18} /></span>
      </nav>

      <main className="steps-main">
        <h1 className="steps-heading">The Next Steps</h1>

        {topics.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {topics.map(t => (
              <span
                key={t}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 100,
                  padding: '4px 14px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="steps-row">
          {STEPS.map(s => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <p className="step-text">{s.text}</p>
            </div>
          ))}
        </div>
      </main>

      <div className="page-bottom">
        <button
          className="btn-proceed"
          onClick={() => navigate('/interview', { state: { topics } })}
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
