# Non-Verbal Communication Tracker

Real-time AI-powered non-verbal communication feedback system using Google MediaPipe.

## 🎯 Features

### Tracked Metrics (0-100 Score)

1. **📏 Spatial Distribution**
   - Monitors eye distance to ensure optimal face-to-camera positioning
   - Perfect range: 15-25% normalized distance
   - Penalizes being too close or too far from camera

2. **👋 Hand Gestures**
   - Tracks hand movement frequency and activity
   - Increases score when hands are used naturally
   - Decreases if hands are static or out of frame
   - Monitors last 30 frames for movement patterns

3. **👁️ Eye Contact**
   - Tracks iris position relative to eye corners
   - Detects when looking directly at camera vs. away
   - Gradually increases/decreases based on gaze direction
   - Real-time visual feedback indicator

4. **🧍 Posture**
   - Monitors shoulder alignment and positioning
   - Detects slouching (shoulders too low)
   - Detects leaning (shoulder imbalance)
   - Provides real-time posture status

## 📦 Installation

```bash
npm install @mediapipe/tasks-vision
```

Or using the provided package file:

```bash
npm install
```

## 🚀 Usage

### Basic Implementation

```jsx
import InterviewSession from './components/InterviewSession';

function App() {
  return <InterviewSession />;
}
```

### Using Individual Components

```jsx
import NonVerbalTracker from './components/NonVerbalTracker';
import FeedbackPage from './components/FeedbackPage';

function CustomApp() {
  const [scores, setScores] = useState(null);

  return (
    <>
      <NonVerbalTracker onScoresUpdate={setScores} />
      {scores && <FeedbackPage scores={scores} sessionDuration={120} />}
    </>
  );
}
```

## 🎨 Components

### `NonVerbalTracker`
Main tracking component that initializes webcam and MediaPipe models.

**Props:**
- `onScoresUpdate` (function): Callback receiving live scores object

**Scores Object:**
```javascript
{
  spatialDistribution: 0-100,
  handGestures: 0-100,
  eyeContact: 0-100,
  posture: 0-100
}
```

### `FeedbackPage`
Comprehensive feedback display with statistics and recommendations.

**Props:**
- `scores` (object): Final scores from tracking session
- `sessionDuration` (number): Session length in seconds

**Features:**
- Overall performance score (weighted average)
- Letter grade (A+ to F)
- Individual metric breakdowns
- Personalized recommendations
- Visual progress charts
- Pro tips section

### `InterviewSession`
Complete session manager combining tracker and feedback.

**Features:**
- Session start/stop controls
- Live timer display
- Smooth transitions between states
- Automatic score capture

## 🔧 Configuration

### Scoring Thresholds (in NonVerbalTracker.jsx)

```javascript
const PERFECT_EYE_DISTANCE_MIN = 0.15;  // Minimum ideal eye distance
const PERFECT_EYE_DISTANCE_MAX = 0.25;  // Maximum ideal eye distance
const HAND_MOVEMENT_THRESHOLD = 0.02;   // Movement to count as gesture
const EYE_CONTACT_THRESHOLD = 0.03;     // Iris offset for eye contact
const POSTURE_SHOULDER_THRESHOLD = 0.08; // Shoulder alignment tolerance
```

### Score Update Rates

```javascript
// Eye Contact
- Looking at camera: +0.5 per frame
- Looking away: -1.5 per frame

// Hand Gestures
- Active movement: +1.5 per frame
- Static hands: -0.3 per frame
- No hands detected: -0.5 per frame

// Posture
- Good posture: +0.2 per frame
- Slouching: -1.0 per frame
- Leaning: -0.8 per frame
```

### Weighted Overall Score

```javascript
{
  spatialDistribution: 20%,
  handGestures: 30%,
  eyeContact: 30%,
  posture: 20%
}
```

## 🎥 Visual Feedback

The canvas overlay displays:
- 🟢 Green circles: Eye landmarks
- 🟣 Purple circles: Hand landmarks with skeleton
- 🔵 Cyan circles: Shoulder landmarks
- 🟡 Yellow circles: Iris/nose tracking
- Real-time status text overlays

## 📊 Scoring System

### Grade Scale
- **A+ (90-100)**: Excellent
- **A (80-89)**: Great job
- **B (70-79)**: Good work
- **C (60-69)**: Needs improvement
- **D (50-59)**: Keep practicing
- **F (0-49)**: More practice needed

### Performance Levels (Per Metric)
- **Exceptional**: 90-100
- **Excellent**: 80-89
- **Good**: 70-79
- **Fair**: 60-69
- **Needs Work**: 50-59
- **Poor**: 0-49

## 🔒 Privacy & Security

- All processing happens **locally in the browser**
- No video data is sent to external servers
- Camera access requires user permission
- MediaPipe models loaded from CDN (can be self-hosted)

## 🌐 Browser Compatibility

Requires modern browsers with:
- WebRTC/getUserMedia support
- WebGL support (for GPU acceleration)
- Canvas API
- ES6+ JavaScript

Tested on:
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

## ⚙️ Performance Tips

1. **GPU Acceleration**: Automatically enabled for MediaPipe models
2. **Frame Processing**: Runs at video framerate (~30fps)
3. **History Buffers**: Limited to last 30 frames to prevent memory issues
4. **Canvas Optimization**: Clears and redraws each frame efficiently

## 🐛 Troubleshooting

### Camera not starting
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Try different browser

### Low frame rate
- Close other tabs/applications
- Disable browser extensions
- Check GPU availability

### Models not loading
- Check internet connection (models loaded from CDN)
- Verify CDN URL accessibility
- Check browser console for errors

## 📝 Customization

### Changing Score Colors

In both `NonVerbalTracker.jsx` and `FeedbackPage.jsx`:

```javascript
const getScoreColor = (score) => {
  if (score >= 80) return '#4caf50'; // Green
  if (score >= 60) return '#ff9800'; // Orange
  return '#f44336'; // Red
};
```

### Adjusting Feedback Messages

In `FeedbackPage.jsx`, modify `getRecommendations()` function to customize suggestions.

### Adding New Metrics

1. Add new score state in `NonVerbalTracker`
2. Create calculation function (e.g., `calculateNewMetricScore`)
3. Add to `processFrame()` pipeline
4. Update `FeedbackPage` to display new metric

## 📚 Resources

- [MediaPipe Vision Tasks](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [Face Landmarks Guide](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md)
- [Hand Landmarks Guide](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md)
- [Pose Landmarks Guide](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md)

## 🎯 For cipherai.dev Integration

To integrate into your site:

1. Import `InterviewSession` component
2. Add to your routing system
3. Style to match your brand
4. Optional: Add backend to save session results
5. Optional: Export feedback as PDF

```jsx
// Example route
<Route path="/practice" element={<InterviewSession />} />
```

## 📄 License

MIT License - feel free to use in your projects!

---

Built with ❤️ using React and Google MediaPipe
