import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const NonVerbalTracker = ({ onScoresUpdate }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // Score states (0-100)
  const [scores, setScores] = useState({
    spatialDistribution: 100,
    handGestures: 50,
    eyeContact: 100,
    posture: 100
  });

  // Tracking refs
  const faceLandmarkerRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // State for tracking metrics over time
  const handMovementHistoryRef = useRef([]);
  const eyeContactHistoryRef = useRef([]);
  const lastHandPositionsRef = useRef(null);
  const frameCountRef = useRef(0);

  // Constants for scoring
  const PERFECT_EYE_DISTANCE_MIN = 0.15; // normalized distance
  const PERFECT_EYE_DISTANCE_MAX = 0.25;
  const HAND_MOVEMENT_THRESHOLD = 0.02;
  const EYE_CONTACT_THRESHOLD = 0.03;
  const POSTURE_SHOULDER_THRESHOLD = 0.08;

  useEffect(() => {
    initializeMediaPipe();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (onScoresUpdate) {
      onScoresUpdate(scores);
    }
  }, [scores, onScoresUpdate]);

  const initializeMediaPipe = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Initialize Face Landmarker (for eye tracking and spatial distribution)
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1
      });

      // Initialize Hand Landmarker
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2
      });

      // Initialize Pose Landmarker (for posture)
      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1
      });

      await startWebcam();
      setIsInitialized(true);
    } catch (err) {
      console.error('MediaPipe initialization error:', err);
      setError(`Failed to initialize: ${err.message}`);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', () => {
          processFrame();
        });
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      setError(`Camera access denied: ${err.message}`);
    }
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    frameCountRef.current++;
    const timestamp = performance.now();

    let faceResults = null;
    let handResults = null;
    let poseResults = null;

    // Detect face landmarks
    if (faceLandmarkerRef.current) {
      faceResults = faceLandmarkerRef.current.detectForVideo(video, timestamp);
    }

    // Detect hand landmarks
    if (handLandmarkerRef.current) {
      handResults = handLandmarkerRef.current.detectForVideo(video, timestamp);
    }

    // Detect pose landmarks
    if (poseLandmarkerRef.current) {
      poseResults = poseLandmarkerRef.current.detectForVideo(video, timestamp);
    }

    // Process and score
    const newScores = { ...scores };

    // 1. Spatial Distribution (eye distance)
    if (faceResults?.faceLandmarks?.[0]) {
      const landmarks = faceResults.faceLandmarks[0];
      newScores.spatialDistribution = calculateSpatialScore(landmarks, ctx);
    }

    // 2. Hand Gestures
    if (handResults) {
      newScores.handGestures = calculateHandGestureScore(handResults, ctx);
    } else {
      // No hands detected - gradual decay
      newScores.handGestures = Math.max(0, newScores.handGestures - 0.5);
    }

    // 3. Eye Contact
    if (faceResults?.faceLandmarks?.[0]) {
      const landmarks = faceResults.faceLandmarks[0];
      newScores.eyeContact = calculateEyeContactScore(landmarks, ctx);
    }

    // 4. Posture
    if (poseResults?.landmarks?.[0]) {
      const landmarks = poseResults.landmarks[0];
      newScores.posture = calculatePostureScore(landmarks, ctx);
    }

    setScores(newScores);

    // Continue processing
    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  const calculateSpatialScore = (landmarks, ctx) => {
    // Eye landmarks: left eye outer corner (33), right eye outer corner (263)
    const leftEyeOuter = landmarks[33];
    const rightEyeOuter = landmarks[263];

    const eyeDistance = Math.sqrt(
      Math.pow(rightEyeOuter.x - leftEyeOuter.x, 2) +
      Math.pow(rightEyeOuter.y - leftEyeOuter.y, 2)
    );

    // Draw eye markers
    const canvas = canvasRef.current;
    drawLandmark(ctx, leftEyeOuter, canvas.width, canvas.height, '#00ff00', 5);
    drawLandmark(ctx, rightEyeOuter, canvas.width, canvas.height, '#00ff00', 5);
    
    // Draw line between eyes
    ctx.beginPath();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.moveTo(leftEyeOuter.x * canvas.width, leftEyeOuter.y * canvas.height);
    ctx.lineTo(rightEyeOuter.x * canvas.width, rightEyeOuter.y * canvas.height);
    ctx.stroke();

    // Score based on perfect range
    let score = 100;
    if (eyeDistance < PERFECT_EYE_DISTANCE_MIN) {
      // Too close (face too far from camera)
      const deficit = PERFECT_EYE_DISTANCE_MIN - eyeDistance;
      score = Math.max(0, 100 - (deficit / PERFECT_EYE_DISTANCE_MIN) * 200);
    } else if (eyeDistance > PERFECT_EYE_DISTANCE_MAX) {
      // Too far (face too close to camera)
      const excess = eyeDistance - PERFECT_EYE_DISTANCE_MAX;
      score = Math.max(0, 100 - (excess / PERFECT_EYE_DISTANCE_MAX) * 200);
    }

    return score;
  };

  const calculateHandGestureScore = (handResults, ctx) => {
    const canvas = canvasRef.current;
    let currentScore = scores.handGestures;

    if (handResults.landmarks && handResults.landmarks.length > 0) {
      // Draw hand landmarks
      handResults.landmarks.forEach((hand, handIndex) => {
        hand.forEach((landmark, idx) => {
          drawLandmark(ctx, landmark, canvas.width, canvas.height, '#ff00ff', 3);
        });

        // Draw connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [0, 9], [9, 10], [10, 11], [11, 12], // Middle
          [0, 13], [13, 14], [14, 15], [15, 16], // Ring
          [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [5, 9], [9, 13], [13, 17] // Palm
        ];

        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        connections.forEach(([start, end]) => {
          ctx.beginPath();
          ctx.moveTo(hand[start].x * canvas.width, hand[start].y * canvas.height);
          ctx.lineTo(hand[end].x * canvas.width, hand[end].y * canvas.height);
          ctx.stroke();
        });
      });

      // Calculate movement
      let totalMovement = 0;
      if (lastHandPositionsRef.current) {
        handResults.landmarks.forEach((hand, handIndex) => {
          if (lastHandPositionsRef.current[handIndex]) {
            hand.forEach((landmark, idx) => {
              const lastLandmark = lastHandPositionsRef.current[handIndex][idx];
              const movement = Math.sqrt(
                Math.pow(landmark.x - lastLandmark.x, 2) +
                Math.pow(landmark.y - lastLandmark.y, 2)
              );
              totalMovement += movement;
            });
          }
        });
      }

      lastHandPositionsRef.current = handResults.landmarks;

      // Track movement over time (last 30 frames)
      handMovementHistoryRef.current.push(totalMovement);
      if (handMovementHistoryRef.current.length > 30) {
        handMovementHistoryRef.current.shift();
      }

      // Calculate average movement
      const avgMovement = handMovementHistoryRef.current.reduce((a, b) => a + b, 0) / 
                          handMovementHistoryRef.current.length;

      // Increase score if hands are moving
      if (avgMovement > HAND_MOVEMENT_THRESHOLD) {
        currentScore = Math.min(100, currentScore + 1.5);
      } else {
        // Hands visible but static
        currentScore = Math.max(0, currentScore - 0.3);
      }
    }

    return currentScore;
  };

  const calculateEyeContactScore = (landmarks, ctx) => {
    const canvas = canvasRef.current;
    let currentScore = scores.eyeContact;

    // Iris landmarks (left: 468-473, right: 473-478)
    // Eye corners (left outer: 33, left inner: 133, right inner: 362, right outer: 263)
    const leftIris = landmarks[468]; // Center of left iris
    const rightIris = landmarks[473]; // Center of right iris
    const leftEyeOuter = landmarks[33];
    const leftEyeInner = landmarks[133];
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];

    // Draw iris markers
    drawLandmark(ctx, leftIris, canvas.width, canvas.height, '#ffff00', 4);
    drawLandmark(ctx, rightIris, canvas.width, canvas.height, '#ffff00', 4);

    // Calculate iris position relative to eye corners (normalized)
    const leftEyeCenter = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeOuter.y + leftEyeInner.y) / 2
    };
    const rightEyeCenter = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeOuter.y + rightEyeInner.y) / 2
    };

    const leftIrisOffset = Math.sqrt(
      Math.pow(leftIris.x - leftEyeCenter.x, 2) +
      Math.pow(leftIris.y - leftEyeCenter.y, 2)
    );
    const rightIrisOffset = Math.sqrt(
      Math.pow(rightIris.x - rightEyeCenter.x, 2) +
      Math.pow(rightIris.y - rightEyeCenter.y, 2)
    );

    const avgOffset = (leftIrisOffset + rightIrisOffset) / 2;

    // Track eye contact
    const isLookingAtCamera = avgOffset < EYE_CONTACT_THRESHOLD;
    eyeContactHistoryRef.current.push(isLookingAtCamera ? 1 : 0);
    if (eyeContactHistoryRef.current.length > 30) {
      eyeContactHistoryRef.current.shift();
    }

    // Calculate eye contact percentage
    const eyeContactPercentage = eyeContactHistoryRef.current.reduce((a, b) => a + b, 0) / 
                                  eyeContactHistoryRef.current.length;

    // Update score based on current state
    if (isLookingAtCamera) {
      currentScore = Math.min(100, currentScore + 0.5);
    } else {
      currentScore = Math.max(0, currentScore - 1.5);
    }

    // Draw eye contact indicator
    ctx.fillStyle = isLookingAtCamera ? '#00ff00' : '#ff0000';
    ctx.font = '16px Arial';
    ctx.fillText(
      isLookingAtCamera ? '👁️ Eye Contact' : '❌ Look at Camera',
      10,
      canvas.height - 10
    );

    return currentScore;
  };

  const calculatePostureScore = (landmarks, ctx) => {
    const canvas = canvasRef.current;
    let currentScore = scores.posture;

    // Shoulder landmarks (11: left shoulder, 12: right shoulder)
    // Nose landmark (0: nose)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];

    if (leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
      // Draw shoulder markers
      drawLandmark(ctx, leftShoulder, canvas.width, canvas.height, '#00ffff', 6);
      drawLandmark(ctx, rightShoulder, canvas.width, canvas.height, '#00ffff', 6);
      drawLandmark(ctx, nose, canvas.width, canvas.height, '#ffff00', 5);

      // Draw line between shoulders
      ctx.beginPath();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
      ctx.lineTo(rightShoulder.x * canvas.width, rightShoulder.y * canvas.height);
      ctx.stroke();

      // Check for slouching (shoulders too low relative to nose)
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
      const shoulderNoseDistance = shoulderMidY - nose.y;

      // Check for leaning (shoulder imbalance)
      const shoulderImbalance = Math.abs(leftShoulder.y - rightShoulder.y);

      // Penalize slouching
      if (shoulderNoseDistance > POSTURE_SHOULDER_THRESHOLD * 1.5) {
        currentScore = Math.max(0, currentScore - 1.0);
      } else {
        currentScore = Math.min(100, currentScore + 0.2);
      }

      // Penalize leaning
      if (shoulderImbalance > POSTURE_SHOULDER_THRESHOLD) {
        currentScore = Math.max(0, currentScore - 0.8);
      } else {
        currentScore = Math.min(100, currentScore + 0.1);
      }

      // Visual feedback
      const postureStatus = 
        shoulderNoseDistance > POSTURE_SHOULDER_THRESHOLD * 1.5 ? '⚠️ Slouching' :
        shoulderImbalance > POSTURE_SHOULDER_THRESHOLD ? '⚠️ Leaning' :
        '✅ Good Posture';

      ctx.fillStyle = shoulderNoseDistance > POSTURE_SHOULDER_THRESHOLD * 1.5 || 
                      shoulderImbalance > POSTURE_SHOULDER_THRESHOLD ? '#ff0000' : '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText(postureStatus, 10, 30);
    }

    return currentScore;
  };

  const drawLandmark = (ctx, landmark, width, height, color, size = 3) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(landmark.x * width, landmark.y * height, size, 0, 2 * Math.PI);
    ctx.fill();
  };

  return (
    <div style={{ position: 'relative', maxWidth: '100%' }}>
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          backgroundColor: '#ffeeee', 
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '1280px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: 'auto',
            border: '2px solid #333',
            borderRadius: '8px'
          }}
        />
      </div>

      {/* Live Scores Display */}
      <div style={{ 
        marginTop: '20px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <ScoreCard 
          title="Spatial Distribution" 
          score={scores.spatialDistribution} 
          icon="📏"
          description="Face distance from camera"
        />
        <ScoreCard 
          title="Hand Gestures" 
          score={scores.handGestures} 
          icon="👋"
          description="Hand movement activity"
        />
        <ScoreCard 
          title="Eye Contact" 
          score={scores.eyeContact} 
          icon="👁️"
          description="Looking at camera"
        />
        <ScoreCard 
          title="Posture" 
          score={scores.posture} 
          icon="🧍"
          description="Body alignment"
        />
      </div>

      {!isInitialized && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666'
        }}>
          Initializing MediaPipe models and camera...
        </div>
      )}
    </div>
  );
};

const ScoreCard = ({ title, score, icon, description }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      textAlign: 'center',
      border: `3px solid ${getScoreColor(score)}`
    }}>
      <div style={{ fontSize: '32px', marginBottom: '5px' }}>{icon}</div>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{title}</div>
      <div style={{ 
        fontSize: '36px', 
        fontWeight: 'bold', 
        color: getScoreColor(score),
        marginBottom: '5px'
      }}>
        {Math.round(score)}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>{description}</div>
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: '#ddd',
        borderRadius: '4px',
        marginTop: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          backgroundColor: getScoreColor(score),
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

export default NonVerbalTracker;
