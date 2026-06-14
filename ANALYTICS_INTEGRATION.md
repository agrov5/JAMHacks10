# Non-Verbal Analytics Integration with Gemini API

This document explains how the non-verbal communication analytics are integrated with your backend Gemini API for AI-powered interview feedback.

## 🎯 Overview

The system tracks **4 non-verbal metrics** in real-time during interview recordings:
1. **Spatial Distribution** (0-100): Face-to-camera distance
2. **Hand Gestures** (0-100): Hand movement frequency
3. **Eye Contact** (0-100): Camera engagement
4. **Posture** (0-100): Body alignment

These scores are automatically sent to your backend and **included in the Gemini API prompt**, so the AI provides feedback on both verbal responses AND non-verbal communication.

---

## 🔄 Data Flow

```
Frontend Recording Session
    ↓
[MediaPipe tracks face/hands/pose] → Analytics Scores (0-100)
    ↓
[User ends recording] → Video Blob + Analytics JSON
    ↓
POST /api/interview/submit
    ↓
Backend receives: video + analytics
    ↓
Gemini API receives enhanced prompt with analytics
    ↓
AI Feedback includes non-verbal commentary
    ↓
Frontend displays combined feedback
```

---

## 📡 Backend Changes

### Modified Files

#### `backend/src/routes/interview.ts`

**New Function:**
```typescript
function buildPromptWithAnalytics(basePrompt: string, analytics?: {
  spatialDistribution: number;
  handGestures: number;
  eyeContact: number;
  posture: number;
}): string
```

This function appends analytics data to the base prompt sent to Gemini.

**Modified Endpoints:**

1. **`POST /api/interview/submit`**
   - Now accepts `analytics` field (JSON string)
   - Parses analytics and includes in Gemini prompt

2. **`POST /api/interview/submit-batch`**
   - Now accepts `analytics` field (JSON string)
   - Applies same analytics to all questions in the batch

### Example Enhanced Prompt

```
You are an expert interview coach.
Analyse the candidate's response below and provide structured feedback covering:
1. Relevance & Content
2. Clarity & Communication
3. Structure (STAR method if applicable)
4. Strengths
5. Areas for Improvement
6. Overall Score (1–10)

Be specific, constructive, and concise.

## Non-Verbal Communication Analytics (0-100 scale):
- Spatial Distribution (Face-to-camera distance): 85/100
- Hand Gestures (Movement frequency): 72/100
- Eye Contact (Camera engagement): 91/100
- Posture (Body alignment): 88/100

Please incorporate these non-verbal metrics into your feedback. Comment on their body language, engagement, and professional presence based on these scores.

Goals: Communication Skills, Technical Proficiency

Transcript:
[candidate's speech-to-text transcript]
```

---

## 🎨 Frontend Integration

### New Files

#### `frontend/src/utils/interviewSubmit.js`

Two helper functions:

1. **`submitInterviewWithAnalytics(videoBlob, userId, goals, analytics)`**
   - Submits single video with analytics
   - Analytics object structure:
     ```javascript
     {
       spatialDistribution: 85,
       handGestures: 72,
       eyeContact: 91,
       posture: 88
     }
     ```

2. **`submitBatchWithAnalytics(videoBlobs, userId, questions, goals, difficulty, analytics)`**
   - Submits multiple videos with same analytics

#### `frontend/src/components/InterviewWithAnalytics.jsx`

Complete interview component that:
- Records video using MediaRecorder API
- Tracks non-verbal metrics using `NonVerbalTracker`
- Automatically submits both video + analytics to backend
- Displays AI feedback that includes non-verbal commentary

---

## 🚀 Usage Examples

### Example 1: Standalone Interview with Analytics

```jsx
import InterviewWithAnalytics from './components/InterviewWithAnalytics';

function App() {
  return (
    <InterviewWithAnalytics 
      userId="user123"
      goals={['Communication Skills', 'Leadership']}
    />
  );
}
```

### Example 2: Manual Submission

```javascript
import { submitInterviewWithAnalytics } from './utils/interviewSubmit';

// After recording video and tracking analytics
const videoBlob = new Blob(chunks, { type: 'video/webm' });
const analyticsScores = {
  spatialDistribution: 85,
  handGestures: 72,
  eyeContact: 91,
  posture: 88
};

const result = await submitInterviewWithAnalytics(
  videoBlob,
  'user123',
  ['Technical Skills'],
  analyticsScores
);

console.log(result.feedback); // AI feedback with non-verbal analysis
```

### Example 3: Practice-Only Mode (No Backend)

```jsx
import InterviewSession from './components/InterviewSession';

// This component tracks analytics but doesn't record/submit
function PracticeMode() {
  return <InterviewSession />;
}
```

---

## 📊 API Request Format

### POST /api/interview/submit

**FormData Fields:**
- `video` (File): The recorded video (video/webm)
- `userId` (String): User identifier
- `goals` (JSON String): Array of goals, e.g. `["Communication", "Leadership"]`
- `analytics` (JSON String): Analytics object, e.g.:
  ```json
  {
    "spatialDistribution": 85,
    "handGestures": 72,
    "eyeContact": 91,
    "posture": 88
  }
  ```

### POST /api/interview/submit-batch

**FormData Fields:**
- `video_0`, `video_1`, ... (Files): Multiple videos
- `userId` (String): User identifier
- `questions` (JSON String): Array of questions
- `goals` (JSON String): Array of goals
- `difficulty` (String): "Easy", "Medium", or "Hard"
- `analytics` (JSON String): Same analytics applied to all videos

---

## 🎯 Example AI Feedback Output

With analytics included, Gemini will provide feedback like:

```
Overall Score: 8/10

Strengths:
- Clear and structured response using the STAR method
- Excellent eye contact (91/100) demonstrates confidence and engagement
- Strong posture (88/100) conveys professionalism
- Good spatial positioning maintained throughout

Areas for Improvement:
- Hand gestures (72/100) could be more dynamic to emphasize key points
- Consider using more varied gestures when describing technical concepts
- Content was slightly repetitive in the middle section

Recommendations:
- Practice using hand gestures to punctuate important moments
- Maintain your excellent posture and eye contact
- Work on conciseness in the explanation phase
```

---

## 🔧 Configuration

### Adjusting Analytics Thresholds

Edit `frontend/src/components/NonVerbalTracker.jsx`:

```javascript
const PERFECT_EYE_DISTANCE_MIN = 0.15;
const PERFECT_EYE_DISTANCE_MAX = 0.25;
const HAND_MOVEMENT_THRESHOLD = 0.02;
const EYE_CONTACT_THRESHOLD = 0.03;
const POSTURE_SHOULDER_THRESHOLD = 0.08;
```

### Customizing Gemini Prompt

Set environment variable in `.env`:

```bash
GEMINI_PROMPT="Your custom prompt here..."
```

Or edit directly in `backend/src/routes/interview.ts`.

---

## ✅ Testing

### 1. Test Analytics Tracking Only

```jsx
import NonVerbalTracker from './components/NonVerbalTracker';

function Test() {
  const handleScores = (scores) => {
    console.log('Current scores:', scores);
  };

  return <NonVerbalTracker onScoresUpdate={handleScores} />;
}
```

### 2. Test Backend Integration

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test endpoint
curl -X POST http://localhost:3000/api/interview/submit \
  -F "video=@test.webm" \
  -F "userId=test123" \
  -F "goals=[\"Communication\"]" \
  -F "analytics={\"spatialDistribution\":85,\"handGestures\":72,\"eyeContact\":91,\"posture\":88}"
```

### 3. Test Full Integration

Use `InterviewWithAnalytics` component and check:
- [ ] Video recording works
- [ ] Analytics are tracked in real-time
- [ ] Submission succeeds
- [ ] AI feedback mentions non-verbal metrics

---

## 🐛 Troubleshooting

### Analytics Not Appearing in Feedback

**Problem:** Gemini feedback doesn't mention non-verbal scores

**Solutions:**
1. Check that analytics are being sent:
   ```javascript
   console.log('Analytics:', analytics);
   ```
2. Verify backend receives analytics:
   ```typescript
   console.log('Received analytics:', analytics);
   ```
3. Ensure `buildPromptWithAnalytics` is called:
   ```typescript
   const promptWithAnalytics = buildPromptWithAnalytics(ANALYSIS_PROMPT, analytics);
   ```

### MediaPipe Not Loading

**Problem:** NonVerbalTracker shows "Initializing..." forever

**Solutions:**
1. Check internet connection (models load from CDN)
2. Check browser console for CORS errors
3. Verify browser supports WebGL

### Video Recording Fails

**Problem:** Camera/mic access denied

**Solutions:**
1. Check browser permissions
2. Ensure HTTPS (required for `getUserMedia`)
3. Try different browser

---

## 📚 Related Documentation

- [NONVERBAL_TRACKING_README.md](./NONVERBAL_TRACKING_README.md) - Full MediaPipe setup guide
- [MediaPipe Vision Tasks](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

## 🎉 Summary

Your interview feedback system now provides:

✅ **Verbal Analysis** (via speech-to-text + Gemini)
- Content relevance
- STAR method structure
- Clarity and communication

✅ **Non-Verbal Analysis** (via MediaPipe + Gemini)
- Spatial positioning
- Hand gestures
- Eye contact
- Posture

Both are automatically combined into comprehensive AI feedback that helps candidates improve holistically!
