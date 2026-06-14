import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import Logo from '../components/Logo';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface SessionData {
  _id: string;
  goals: string[];
  overallScore: number | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function scoreColor(score: number) {
  if (score >= 8) return '#4ade80';
  if (score >= 6) return '#facc15';
  return '#f87171';
}

export default function StatsPage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const userId: string = storedUser ? JSON.parse(storedUser).id : '';

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setError('Not logged in'); setLoading(false); return; }
    fetch(`${backendUrl}/api/user/${userId}/profile`)
      .then(r => r.json())
      .then((d: { sessions: SessionData[] }) => {
        setSessions(d.sessions ?? []);
      })
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, [userId]);

  const scored = sessions.filter(s => s.overallScore != null);
  const chronological = [...scored].reverse();

  const chartData = chronological.map((s, i) => ({
    label: `#${i + 1}`,
    date: formatDate(s.createdAt),
    score: s.overallScore as number,
  }));

  const scores = scored.map(s => s.overallScore as number);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const bestScore = scores.length ? Math.max(...scores) : null;
  const latestScore = chronological.length ? (chronological[chronological.length - 1].overallScore as number) : null;

  const topicCounts: Record<string, number> = {};
  sessions.forEach(s => s.goals.forEach(g => { topicCounts[g] = (topicCounts[g] ?? 0) + 1; }));
  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof chartData[0] }[] }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{d.date}</p>
        <p style={{ color: scoreColor(d.score), fontWeight: 700, fontSize: 16 }}>{d.score}/10</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
        Loading stats…
      </div>
    );
  }

  return (
    <div className="profile-page">
      <nav className="page-nav">
        <Logo />
        <button
          className="btn-proceed"
          style={{ fontSize: 12, padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
          onClick={() => navigate('/profile')}
        >
          Back
        </button>
      </nav>

      <main className="profile-main">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>Your Stats</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {scored.length} scored
          </p>
        </div>

        {error && <p className="error-text">{error}</p>}

        {/* Summary stat cards */}
        <div className="profile-stats-row">
          <div className="profile-stat-card">
            <span className="profile-stat-value">{sessions.length}</span>
            <span className="profile-stat-label">Sessions</span>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-value" style={{ color: avgScore != null ? scoreColor(avgScore) : undefined }}>
              {avgScore != null ? avgScore.toFixed(1) : '—'}
            </span>
            <span className="profile-stat-label">Avg Score</span>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-value" style={{ color: bestScore != null ? scoreColor(bestScore) : undefined }}>
              {bestScore != null ? bestScore : '—'}
            </span>
            <span className="profile-stat-label">Best Score</span>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-value" style={{ color: latestScore != null ? scoreColor(latestScore) : undefined }}>
              {latestScore != null ? latestScore : '—'}
            </span>
            <span className="profile-stat-label">Latest</span>
          </div>
        </div>

        {/* Line chart */}
        <div className="profile-section">
          <p className="profile-section-label">Score Over Time</p>
          {chartData.length < 2 ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '12px 0' }}>
              Complete at least 2 scored sessions to see your progress chart.
            </p>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {avgScore != null && (
                    <ReferenceLine
                      y={Math.round(avgScore * 10) / 10}
                      stroke="rgba(255,255,255,0.12)"
                      strokeDasharray="4 4"
                      label={{ value: `avg ${avgScore.toFixed(1)}`, fill: 'rgba(255,255,255,0.2)', fontSize: 10, position: 'right' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#fff"
                    strokeWidth={2}
                    dot={({ cx, cy, payload }: { cx?: number; cy?: number; payload?: typeof chartData[0] }) =>
                      cx != null && cy != null && payload != null ? (
                        <circle
                          key={`dot-${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={scoreColor(payload.score)}
                          stroke="#0a0a0a"
                          strokeWidth={2}
                        />
                      ) : <g />
                    }
                    activeDot={{ r: 5, fill: '#fff', stroke: '#0a0a0a', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Topic breakdown */}
        {topTopics.length > 0 && (
          <div className="profile-section">
            <p className="profile-section-label">Topics Practiced</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topTopics.map(([topic, count]) => {
                const pct = Math.round((count / sessions.length) * 100);
                return (
                  <div key={topic}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{topic}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{count} session{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 100 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(255,255,255,0.35)', borderRadius: 100, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent scores list */}
        {scored.length > 0 && (
          <div className="profile-section">
            <p className="profile-section-label">Session Scores</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scored.map((s, i) => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < scored.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 24 }}>#{scored.length - i}</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {s.goals.map(g => (
                        <span key={g} className="session-goal-tag">{g}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{formatDate(s.createdAt)}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, padding: '2px 9px', borderRadius: 100,
                      background: scoreColor(s.overallScore as number) === '#4ade80' ? 'rgba(74,222,128,0.12)' : scoreColor(s.overallScore as number) === '#facc15' ? 'rgba(250,204,21,0.1)' : 'rgba(248,113,113,0.1)',
                      border: `1px solid ${scoreColor(s.overallScore as number) === '#4ade80' ? 'rgba(74,222,128,0.3)' : scoreColor(s.overallScore as number) === '#facc15' ? 'rgba(250,204,21,0.25)' : 'rgba(248,113,113,0.25)'}`,
                      color: scoreColor(s.overallScore as number),
                    }}>
                      {s.overallScore}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scored.length === 0 && !error && (
          <div className="profile-section">
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No scored sessions yet. Complete an interview to see your stats here.</p>
            <button className="btn-proceed" style={{ alignSelf: 'flex-start', fontSize: 13 }} onClick={() => navigate('/resume')}>
              Start Practice
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
