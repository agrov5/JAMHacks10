import React, { useState, useEffect, useRef } from 'react';
import NonVerbalTracker from './NonVerbalTracker';
import FeedbackPage from './FeedbackPage';

const InterviewSession = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finalScores, setFinalScores] = useState({
    spatialDistribution: 100,
    handGestures: 50,
    eyeContact: 100,
    posture: 100
  });
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentScores, setCurrentScores] = useState(null);
  
  const sessionStartTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startSession = () => {
    setIsTracking(true);
    setShowFeedback(false);
    sessionStartTimeRef.current = Date.now();
    
    // Update session duration every second
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      setSessionDuration(elapsed);
    }, 1000);
  };

  const endSession = () => {
    setIsTracking(false);
    setShowFeedback(true);
    setFinalScores(currentScores || finalScores);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleScoresUpdate = (scores) => {
    setCurrentScores(scores);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '20px'
    }}>
      {!isTracking && !showFeedback && (
        <div style={{
          maxWidth: '800px',
          margin: '100px auto',
          textAlign: 'center',
          backgroundColor: '#fff',
          padding: '60px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '42px', marginBottom: '20px', color: '#333' }}>
            🎥 Non-Verbal Communication Trainer
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px', lineHeight: '1.6' }}>
            Practice and improve your non-verbal communication skills with real-time AI feedback.
            We track your spatial positioning, hand gestures, eye contact, and posture.
          </p>
          <button
            onClick={startSession}
            style={{
              fontSize: '20px',
              padding: '15px 40px',
              backgroundColor: '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2196f3'}
          >
            Start Training Session
          </button>
          
          <div style={{
            marginTop: '50px',
            textAlign: 'left',
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>
              📋 What We Track:
            </h3>
            <ul style={{ fontSize: '16px', lineHeight: '2', color: '#555' }}>
              <li><strong>📏 Spatial Distribution:</strong> Optimal face-to-camera distance</li>
              <li><strong>👋 Hand Gestures:</strong> Natural and engaging hand movements</li>
              <li><strong>👁️ Eye Contact:</strong> Maintaining camera engagement</li>
              <li><strong>🧍 Posture:</strong> Professional body alignment</li>
            </ul>
          </div>
        </div>
      )}

      {isTracking && !showFeedback && (
        <div>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            marginBottom: '20px'
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '5px' }}>
                  🎥 Training Session in Progress
                </h2>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  Session Time: {formatTime(sessionDuration)}
                </p>
              </div>
              <button
                onClick={endSession}
                style={{
                  fontSize: '18px',
                  padding: '12px 30px',
                  backgroundColor: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
              >
                End Session & View Feedback
              </button>
            </div>
          </div>

          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <NonVerbalTracker onScoresUpdate={handleScoresUpdate} />
          </div>
        </div>
      )}

      {showFeedback && (
        <div>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <button
              onClick={() => {
                setShowFeedback(false);
                setIsTracking(false);
                setSessionDuration(0);
              }}
              style={{
                fontSize: '16px',
                padding: '12px 30px',
                backgroundColor: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2196f3'}
            >
              ← Back to Home
            </button>
          </div>
          
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <FeedbackPage scores={finalScores} sessionDuration={sessionDuration} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
