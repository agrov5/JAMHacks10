import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const STEPS = [
  { num: 1, text: 'Upload your resume so we can suggest the best practice goals for you' },
  { num: 2, text: 'Choose up to 3 interview topics you want to focus on' },
  { num: 3, text: 'Record your response to an AI-generated question' },
  { num: 4, text: 'Receive detailed AI feedback and a score' },
];

export default function NextStepsPage() {
  const navigate = useNavigate();

  return (
    <div className="steps-page">
      <nav className="page-nav">
        <Logo />
      </nav>

      <main className="steps-main">
        <div style={{ textAlign: 'center' }}>
          <h1 className="steps-heading">Here's How It Works</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            Four simple steps to sharpen your interview skills
          </p>
        </div>

        <div className="steps-row" style={{ flexWrap: 'wrap' }}>
          {STEPS.map(s => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <p className="step-text">{s.text}</p>
            </div>
          ))}
        </div>
      </main>

      <div className="page-bottom">
        <button className="btn-proceed" onClick={() => navigate('/resume')}>
          Get Started
        </button>
      </div>
    </div>
  );
}
