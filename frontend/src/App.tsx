import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import NextStepsPage from './pages/NextStepsPage';
import ResumePage from './pages/ResumePage';
import TopicsPage from './pages/TopicsPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewPage from './pages/InterviewPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/next-steps"      element={<ProtectedRoute><NextStepsPage /></ProtectedRoute>} />
        <Route path="/resume"          element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
        <Route path="/topics"          element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />
        <Route path="/interview-setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
        <Route path="/interview"       element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
        <Route path="/feedback"        element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
