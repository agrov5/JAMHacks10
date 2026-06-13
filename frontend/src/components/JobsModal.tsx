import { useEffect, useState } from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  applyUrl: string | null;
  employmentType: string | null;
  rating: number;
}

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= n ? '#FFD700' : 'rgba(255,255,255,0.12)', fontSize: 16 }}>★</span>
      ))}
    </span>
  );
}

export default function JobsModal({ topics, onClose }: { topics: string[]; onClose: () => void }) {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ topics: topics.join(',') });
        const res = await fetch(`${backendUrl}/api/jobs/search?${params}`);
        const data = await res.json() as { jobs?: Job[]; message?: string };
        if (!res.ok) throw new Error(data.message ?? 'Failed to fetch jobs');
        setJobs(data.jobs ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Relevant Jobs</h2>
            <p className="modal-sub">{topics.join(' · ')}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* States */}
        {loading && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '40px 0' }}>
            Finding relevant jobs…
          </p>
        )}
        {!loading && error && (
          <p style={{ fontSize: 13, color: '#ff6b6b', textAlign: 'center', padding: '40px 0' }}>{error}</p>
        )}
        {!loading && !error && jobs.length === 0 && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px 0' }}>
            No jobs found for these topics.
          </p>
        )}

        {/* Job list */}
        {!loading && jobs.length > 0 && (
          <div className="jobs-list">
            {jobs.map(job => (
              <div key={job.id} className="job-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="job-title">{job.title}</p>
                    <p className="job-meta">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ''}
                    </p>
                    {job.employmentType && (
                      <span className="job-type-tag">
                        {job.employmentType.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <Stars n={job.rating} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 }}>relevance</span>
                  </div>
                </div>
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="job-apply-btn"
                  >
                    Apply →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
