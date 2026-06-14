import React, { useState, useEffect, useRef } from 'react';
import NonVerbalTracker from './NonVerbalTracker';
import FeedbackPage from './FeedbackPage';
import { submitInterviewWithAnalytics } from '../utils/interviewSubmit';

const InterviewWithAnalytics = ({ userId, goals = [] }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finalScores, setFinalScores] = useState({
    spatialDistribution: 100,
    handGestures: 50,
    eyeContact: 100,
    posture: 100
  });
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentScores, setCurrentScores] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [interviewFeedback, setInterviewFeedback] = useState(null);
  
  const sessionStartTimeRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  const startSession = async () => {
    try {
      // Request camera/mic access for recording
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Create MediaRecorder to record the video
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setIsRecording(true);
      setShowFeedback(false);
      setError(null);
      sessionStartTimeRef.current = Date.now();
      
      // Update session duration every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
        setSessionDuration(elapsed);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const endSession = async () => {
    setIsRecording(false);
    setFinalScores(currentScores || finalScores);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    stopRecording();

    // Submit to backend
    if (recordedChunksRef.current.length > 0 && userId) {
      setIsSubmitting(true);
      try {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        const result = await submitInterviewWithAnalytics(
          videoBlob,
          userId,
          goals,
          currentScores || finalScores
        );

        setInterviewFeedback(result);
        setShowFeedback(true);
      } catch (err) {
        console.error('Failed to submit interview:', err);
        setError('Failed to submit interview. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setShowFeedback(true);
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
      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 20px',
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {!isRecording && !showFeedback && (
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
            🎥 AI Interview Practice with Non-Verbal Analysis
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px', lineHeight: '1.6' }}>
            Record your interview response while we track your non-verbal communication in real-time.
            Get AI-powered feedback that includes both your verbal responses and body language.
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
            Start Interview Recording
          </button>
          
          <div style={{
            marginTop: '50px',
            textAlign: 'left',
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>
              📋 What We Analyze:
            </h3>
            <ul style={{ fontSize: '16px', lineHeight: '2', color: '#555' }}>
              <li><strong>📝 Verbal Response:</strong> Content, clarity, and structure (STAR method)</li>
              <li><strong>📏 Spatial Positioning:</strong> Optimal face-to-camera distance</li>
              <li><strong>👋 Hand Gestures:</strong> Natural and engaging hand movements</li>
              <li><strong>👁️ Eye Contact:</strong> Camera engagement and confidence</li>
              <li><strong>🧍 Posture:</strong> Professional body alignment</li>
            </ul>
          </div>
        </div>
      )}

      {isRecording && !showFeedback && (
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
                  🔴 Recording in Progress
                </h2>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  Session Time: {formatTime(sessionDuration)}
                </p>
              </div>
              <button
                onClick={endSession}
                disabled={isSubmitting}
                style={{
                  fontSize: '18px',
                  padding: '12px 30px',
                  backgroundColor: isSubmitting ? '#999' : '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#d32f2f')}
                onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#f44336')}
              >
                {isSubmitting ? 'Submitting...' : 'End & Get AI Feedback'}
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
                setIsRecording(false);
                setSessionDuration(0);
                setInterviewFeedback(null);
                recordedChunksRef.current = [];
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
              ← Start New Session
            </button>
          </div>
          
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <FeedbackPage scores={finalScores} sessionDuration={sessionDuration} />
          </div>

          {interviewFeedback && (
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#333' }}>
                🤖 AI Interview Feedback
              </h2>
              
              {interviewFeedback.overallScore && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
                    AI Overall Score
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196f3' }}>
                    {interviewFeedback.overallScore}/10
                  </div>
                </div>
              )}

              <div style={{
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>
                  📝 Your Transcript:
                </h3>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#555', whiteSpace: 'pre-wrap' }}>
                  {interviewFeedback.transcript || 'No transcript available'}
                </p>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#fff3e0',
                borderRadius: '8px'
              }}>
                <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>
                  💡 Detailed Feedback:
                </h3>
                <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#555', whiteSpace: 'pre-wrap' }}>
                  {interviewFeedback.feedback}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewWithAnalytics;
