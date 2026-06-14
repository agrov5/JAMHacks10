import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Logo from '../components/Logo';
import JobsModal from '../components/JobsModal';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface SessionData {
  _id: string;
  question: string;
  goals: string[];
  feedback: string;
  transcript: string;
  videoUrl: string;
  createdAt: string;
  overallScore: number | null;
}

interface ProfileData {
  user: { id: string; email: string; name: string; username: string; location: string | null; createdAt: string };
  resumeUrl: string | null;
  hasResume: boolean;
  sessions: SessionData[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function topicFrequency(sessions: SessionData[]) {
  const counts: Record<string, number> = {};
  sessions.forEach(s => s.goals.forEach(g => { counts[g] = (counts[g] ?? 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [jobTopics, setJobTopics] = useState<string[] | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

  const storedUser = localStorage.getItem('user');
  const userId: string = storedUser ? JSON.parse(storedUser).id : '';

  const fetchProfile = async () => {
    if (!userId) { setError('Not logged in'); setLoading(false); return; }
    try {
      const res = await fetch(`${backendUrl}/api/user/${userId}/profile`);
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json() as ProfileData;
      setProfile(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const openSession = (s: SessionData) => {
    navigate('/feedback', {
      state: {
        results: [{
          sessionId: s._id,
          question: s.question ?? '',
          transcript: s.transcript,
          feedback: s.feedback,
          videoUrl: s.videoUrl,
        }],
        topics: s.goals,
        difficulty: '',
      },
    });
  };

  const saveLocation = async (value: string) => {
    setSavingLocation(true);
    try {
      await fetch(`${backendUrl}/api/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: value }),
      });
      await fetchProfile();
    } finally {
      setSavingLocation(false);
      setEditingLocation(false);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('resume', file);
      form.append('userId', userId);
      const res = await fetch(`${backendUrl}/api/user/resume`, { method: 'PUT', body: form });
      if (!res.ok) {
        const d = await res.json() as { message?: string };
        throw new Error(d.message ?? 'Upload failed');
      }
      await fetchProfile();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
        Loading profile…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', gap: 16 }}>
        <p className="error-text">{error || 'Profile not found'}</p>
        <button className="btn-proceed" onClick={() => navigate('/login')}>Back to login</button>
      </div>
    );
  }

  const { user, resumeUrl, hasResume, sessions } = profile;
  const topFreq = topicFrequency(sessions);

  return (
    <div className="profile-page">
      <nav className="page-nav">
        <Logo />
        <button
          className="btn-proceed"
          style={{ fontSize: 12, padding: '7px 18px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff' }}
          onClick={() => navigate('/stats')}
        >
          Stats
        </button>
      </nav>

      <main className="profile-main">
        {/* Practice CTA */}
        <div className="profile-practice-cta">
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.2px' }}>Ready to practice?</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Start a new interview session with AI-generated questions</p>
          </div>
          <button className="btn-proceed" onClick={() => navigate('/resume')}>
            Start Practice
          </button>
        </div>

        {/* User info */}
        <div className="profile-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>{user.name}</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{user.email}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>@{user.username}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                {editingLocation ? (
                  <>
                    <input
                      autoFocus
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveLocation(locationInput); if (e.key === 'Escape') setEditingLocation(false); }}
                      placeholder="City, Country"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '4px 10px', outline: 'none', width: 160 }}
                    />
                    <button
                      onClick={() => saveLocation(locationInput)}
                      disabled={savingLocation}
                      style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                    >
                      {savingLocation ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingLocation(false)}
                      style={{ fontSize: 11, padding: '4px 8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setLocationInput(user.location ?? ''); setEditingLocation(true); }}
                    style={{ fontSize: 12, color: user.location ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>📍</span>
                    <span>{user.location ?? 'Add location'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-row">
          <div className="profile-stat-card">
            <span className="profile-stat-value">{sessions.length}</span>
            <span className="profile-stat-label">Sessions</span>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-value">{topFreq.length}</span>
            <span className="profile-stat-label">Topics Practiced</span>
          </div>
          {topFreq[0] && (
            <div className="profile-stat-card">
              <span className="profile-stat-value" style={{ fontSize: 14 }}>{topFreq[0][0]}</span>
              <span className="profile-stat-label">Top Topic</span>
            </div>
          )}
        </div>

        {/* Resume */}
        <div className="profile-section">
          <p className="profile-section-label">Resume</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={handleResumeChange}
          />
          {hasResume ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>📄 Resume attached</span>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'underline' }}
                >
                  View PDF
                </a>
              )}
              <button
                className="btn-proceed"
          style={{ fontSize: 12, padding: '8px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Replace Resume'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No resume uploaded</span>
              <button
                className="btn-proceed"
                style={{ fontSize: 12, padding: '6px 16px' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Upload Resume'}
              </button>
            </div>
          )}
          {uploadError && <p className="error-text" style={{ marginTop: 8, fontSize: 12 }}>{uploadError}</p>}
        </div>

        {/* Sessions */}
        <div className="profile-section">
          <p className="profile-section-label">Past Sessions</p>
          {sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No sessions yet. Practice to see your history here.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map(s => (
                <div
                  key={s._id}
                  className="session-card"
                  onClick={() => openSession(s)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {s.goals.map(g => (
                        <span key={g} className="session-goal-tag">{g}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {s.overallScore != null && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '2px 9px',
                          borderRadius: 100,
                          background: s.overallScore >= 8 ? 'rgba(74,222,128,0.12)' : s.overallScore >= 6 ? 'rgba(250,204,21,0.1)' : 'rgba(248,113,113,0.1)',
                          border: `1px solid ${s.overallScore >= 8 ? 'rgba(74,222,128,0.3)' : s.overallScore >= 6 ? 'rgba(250,204,21,0.25)' : 'rgba(248,113,113,0.25)'}`,
                          color: s.overallScore >= 8 ? '#4ade80' : s.overallScore >= 6 ? '#facc15' : '#f87171',
                        }}>
                          {s.overallScore}/10
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                  </div>
                  {s.feedback && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 10 }}>
                      {s.feedback.slice(0, 200)}{s.feedback.length > 200 ? '…' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                    {s.goals.length === 1 && (
                      <button
                        className="btn-proceed"
                        style={{ fontSize: 11, padding: '5px 12px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700' }}
                        onClick={e => { e.stopPropagation(); setJobTopics(s.goals); }}
                      >
                        Find Jobs
                      </button>
                    )}
                    {s.videoUrl && (
                      <a
                        href={s.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-proceed"
                        style={{ fontSize: 11, padding: '5px 14px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}
                      >
                        View recording
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <div style={{ paddingBottom: 16 }}>
          <button
            className="btn-proceed"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}
            onClick={async () => { await signOut(auth); localStorage.removeItem('user'); navigate('/login'); }}
          >
            Sign out
          </button>
        </div>
      </main>

      {jobTopics && <JobsModal topics={jobTopics} location={profile?.user.location} onClose={() => setJobTopics(null)} />}
    </div>
  );
}
