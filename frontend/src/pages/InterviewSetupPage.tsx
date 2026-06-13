import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';

const QUESTION_COUNTS = [1, 2, 3, 4, 5];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const TIME_LIMITS = [
  { label: 'No limit', value: 0 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
];
const PREP_TIMES = [
  { label: 'None', value: 0 },
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
];

function OptionGroup<T>({
  label,
  options,
  selected,
  onSelect,
  keyFn,
  labelFn,
}: {
  label: string;
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
  keyFn: (v: T) => string | number;
  labelFn: (v: T) => string;
}) {
  return (
    <div className="setup-group">
      <p className="setup-group-label">{label}</p>
      <div className="setup-pills">
        {options.map(opt => (
          <button
            key={keyFn(opt)}
            className={`setup-pill${selected === opt ? ' selected' : ''}`}
            onClick={() => onSelect(opt)}
          >
            {labelFn(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const topics: string[] = location.state?.topics ?? [];

  const [questionCount, setQuestionCount] = useState(3);
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]>('Medium');
  const [timeLimit, setTimeLimit] = useState(TIME_LIMITS[0]);
  const [prepTime, setPrepTime] = useState(PREP_TIMES[2]);

  const start = () =>
    navigate('/interview', {
      state: {
        topics,
        questionCount,
        difficulty,
        timeLimit: timeLimit.value,
        prepTime: prepTime.value,
      },
    });

  return (
    <div className="steps-page">
      <nav className="page-nav">
        <Logo />
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {topics.map(t => (
            <span key={t} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {t}
            </span>
          ))}
        </div>
      </nav>

      <main className="steps-main">
        <div style={{ textAlign: 'center' }}>
          <h1 className="steps-heading">Set Up Your Interview</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            Customise your practice session
          </p>
        </div>

        <div className="setup-card">
          <OptionGroup
            label="Number of Questions"
            options={QUESTION_COUNTS}
            selected={questionCount}
            onSelect={setQuestionCount}
            keyFn={v => v}
            labelFn={v => String(v)}
          />

          <OptionGroup
            label="Difficulty"
            options={[...DIFFICULTIES]}
            selected={difficulty}
            onSelect={v => setDifficulty(v as typeof DIFFICULTIES[number])}
            keyFn={v => v}
            labelFn={v => v}
          />

          <OptionGroup
            label="Time Limit per Question"
            options={TIME_LIMITS}
            selected={timeLimit}
            onSelect={setTimeLimit}
            keyFn={v => v.value}
            labelFn={v => v.label}
          />

          <OptionGroup
            label="Prep Time per Question"
            options={PREP_TIMES}
            selected={prepTime}
            onSelect={setPrepTime}
            keyFn={v => v.value}
            labelFn={v => v.label}
          />

          <div className="setup-summary">
            <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{difficulty}</span>
            <span>·</span>
            <span>{timeLimit.value > 0 ? `${timeLimit.label}/q` : 'No time limit'}</span>
            <span>·</span>
            <span>{prepTime.value > 0 ? `${prepTime.label} prep` : 'No prep'}</span>
          </div>
        </div>
      </main>

      <div className="page-bottom">
        <button className="btn-proceed" onClick={start}>
          Start Interview
        </button>
      </div>
    </div>
  );
}
