# 🚀 Quick Start: Non-Verbal Analytics + Gemini Integration

## What You Have Now

Your interview platform now analyzes **BOTH** verbal and non-verbal communication:

✅ **Verbal Analysis** → Speech-to-text + Gemini AI feedback  
✅ **Non-Verbal Analysis** → MediaPipe tracking (4 metrics, 0-100 scores)  
✅ **Integrated Feedback** → Gemini receives both for comprehensive analysis

---

## 📁 Files Created/Modified

### Backend (Modified)
- ✏️ `backend/src/routes/interview.ts` - Added analytics support to Gemini prompts

### Frontend (New Files)
- 📄 `frontend/src/components/NonVerbalTracker.jsx` - Real-time tracking component
- 📄 `frontend/src/components/FeedbackPage.jsx` - Analytics feedback display
- 📄 `frontend/src/components/InterviewSession.jsx` - Practice-only (no backend)
- 📄 `frontend/src/components/InterviewWithAnalytics.jsx` - **Full integration** (recording + tracking + backend)
- 📄 `frontend/src/utils/interviewSubmit.js` - Helper functions for API calls

### Documentation
- 📄 `NONVERBAL_TRACKING_README.md` - MediaPipe setup guide
- 📄 `ANALYTICS_INTEGRATION.md` - Integration documentation
- 📄 `QUICK_START.md` - This file

---

## 🎯 Choose Your Component

### Option 1: Full Interview with Backend Integration ⭐ RECOMMENDED

```jsx
import InterviewWithAnalytics from './components/InterviewWithAnalytics';

function App() {
  return (
    <InterviewWithAnalytics 
      userId="user123"
      goals={['Communication', 'Leadership']}
    />
  );
}
```

**What it does:**
- ✅ Records video (MediaRecorder)
- ✅ Tracks 4 non-verbal metrics (MediaPipe)
- ✅ Submits to backend with analytics
- ✅ Gets AI feedback with non-verbal commentary
- ✅ Shows combined feedback page

---

### Option 2: Practice Mode (No Backend)

```jsx
import InterviewSession from './components/InterviewSession';

function App() {
  return <InterviewSession />;
}
```

**What it does:**
- ✅ Tracks 4 non-verbal metrics (MediaPipe)
- ✅ Shows live scores (0-100)
- ✅ Shows feedback page with recommendations
- ❌ No video recording
- ❌ No backend submission

---

### Option 3: Tracking Only

```jsx
import NonVerbalTracker from './components/NonVerbalTracker';

function App() {
  const handleScores = (scores) => {
    console.log(scores);
    // Do something with scores
  };

  return <NonVerbalTracker onScoresUpdate={handleScores} />;
}
```

**What it does:**
- ✅ Tracks 4 metrics in real-time
- ✅ Provides callback with scores
- ❌ No UI feedback page

---

## 💾 Installation

### 1. Install MediaPipe (Frontend)

```bash
cd frontend
npm install @mediapipe/tasks-vision
```

### 2. Verify Backend Dependencies

Your backend should already have:
- `@google/generative-ai` (for Gemini API)
- Other existing dependencies

---

## 🧪 Test It Out

### Step 1: Start Backend

```bash
cd backend
npm run dev
# Should start on http://localhost:3000
```

### Step 2: Start Frontend

```bash
cd frontend
npm run dev
# Should start on http://localhost:5173 or similar
```

### Step 3: Use the Component

```jsx
// In your App.jsx or main component
import InterviewWithAnalytics from './components/InterviewWithAnalytics';

function App() {
  return (
    <InterviewWithAnalytics 
      userId="test-user-123"
      goals={['Technical Skills', 'Communication']}
    />
  );
}

export default App;
```

### Step 4: Test the Flow

1. Click **"Start Interview Recording"**
2. Allow camera/mic permissions
3. See the live tracking (green/yellow/cyan/purple landmarks)
4. Watch your scores update in real-time
5. Click **"End & Get AI Feedback"**
6. Wait for submission (video is uploaded + analytics sent)
7. See two feedback sections:
   - Non-Verbal Communication Feedback (0-100 scores)
   - AI Interview Feedback (includes non-verbal commentary)

---

## 📊 What Data Gets Sent to Gemini

**Before (without analytics):**
```
You are an expert interview coach.
Analyse the candidate's response...

Goals: Communication Skills

Transcript:
[speech-to-text output]
```

**After (with analytics):**
```
You are an expert interview coach.
Analyse the candidate's response...

## Non-Verbal Communication Analytics (0-100 scale):
- Spatial Distribution (Face-to-camera distance): 85/100
- Hand Gestures (Movement frequency): 72/100
- Eye Contact (Camera engagement): 91/100
- Posture (Body alignment): 88/100

Please incorporate these non-verbal metrics into your feedback.

Goals: Communication Skills

Transcript:
[speech-to-text output]
```

---

## 🎨 Customize the Tracking

Edit `frontend/src/components/NonVerbalTracker.jsx`:

```javascript
// Adjust scoring thresholds
const PERFECT_EYE_DISTANCE_MIN = 0.15;  // Face distance (lower = too far)
const PERFECT_EYE_DISTANCE_MAX = 0.25;  // Face distance (higher = too close)
const HAND_MOVEMENT_THRESHOLD = 0.02;   // Minimum movement to count as gesture
const EYE_CONTACT_THRESHOLD = 0.03;     // Iris offset for eye contact
const POSTURE_SHOULDER_THRESHOLD = 0.08; // Shoulder alignment tolerance
```

---

## 🔥 Common Use Cases

### 1. Multiple Interview Questions (Batch)

```javascript
import { submitBatchWithAnalytics } from './utils/interviewSubmit';

// Record multiple videos, track analytics
const videoBlobs = [blob1, blob2, blob3];
const questions = ['Question 1?', 'Question 2?', 'Question 3?'];
const analytics = { 
  spatialDistribution: 85,
  handGestures: 72,
  eyeContact: 91,
  posture: 88
};

const result = await submitBatchWithAnalytics(
  videoBlobs,
  userId,
  questions,
  ['Technical Skills'],
  'Medium',
  analytics
);
```

### 2. Custom Integration

```javascript
import NonVerbalTracker from './components/NonVerbalTracker';
import { submitInterviewWithAnalytics } from './utils/interviewSubmit';

function CustomInterview() {
  const [scores, setScores] = useState(null);

  const handleSubmit = async (videoBlob) => {
    await submitInterviewWithAnalytics(
      videoBlob,
      'user123',
      ['Leadership'],
      scores
    );
  };

  return (
    <>
      <NonVerbalTracker onScoresUpdate={setScores} />
      {/* Your custom recording UI */}
    </>
  );
}
```

---

## ✅ Verify It's Working

### Frontend Checklist
- [ ] Camera initializes
- [ ] See colored landmarks on video (green, purple, cyan, yellow)
- [ ] Live scores update (0-100)
- [ ] Real-time status text ("Eye Contact", "Good Posture", etc.)

### Backend Checklist
- [ ] Video uploads to GCS
- [ ] Transcript generated (ElevenLabs)
- [ ] Analytics received in request
- [ ] Gemini prompt includes analytics section
- [ ] Response includes non-verbal commentary

### Check Backend Logs
```bash
# In backend terminal, you should see:
Received analytics: { spatialDistribution: 85, handGestures: 72, ... }
```

### Check AI Feedback
Look for mentions like:
- "Excellent eye contact (91/100)..."
- "Hand gestures could be more dynamic..."
- "Strong posture demonstrates professionalism..."

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Camera not loading | Check HTTPS, browser permissions |
| MediaPipe errors | Check internet (models load from CDN) |
| No analytics in feedback | Verify `analytics` sent in FormData |
| Scores stuck at initial values | Check MediaPipe initialization |
| Video recording fails | Ensure `getUserMedia` permissions granted |

---

## 📱 Browser Compatibility

**Recommended:**
- Chrome 90+
- Edge 90+

**Supported:**
- Firefox 88+ (may have performance differences)
- Safari 14+ (WebRTC support varies)

**Requirements:**
- WebRTC/getUserMedia
- WebGL (for MediaPipe GPU)
- Canvas API
- ES6+ JavaScript

---

## 🎯 Next Steps

1. **Try it out** with `InterviewWithAnalytics`
2. **Check the AI feedback** to see non-verbal commentary
3. **Adjust thresholds** in `NonVerbalTracker.jsx` if needed
4. **Customize Gemini prompt** in `backend/src/routes/interview.ts`
5. **Style components** to match your brand (cipherai.dev)

---

## 📚 More Info

- Full MediaPipe details → `NONVERBAL_TRACKING_README.md`
- Integration guide → `ANALYTICS_INTEGRATION.md`
- MediaPipe docs → https://developers.google.com/mediapipe
- Gemini API → https://ai.google.dev/docs

---

## 🎉 You're All Set!

Your interview platform now provides **comprehensive feedback** combining:
- 📝 Content analysis
- 🗣️ Communication clarity
- 📏 Spatial positioning
- 👋 Hand gestures
- 👁️ Eye contact
- 🧍 Posture

All powered by MediaPipe + Gemini AI! 🚀
