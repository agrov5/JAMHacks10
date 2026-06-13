import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import TopicsPage from './pages/TopicsPage';
import NextStepsPage from './pages/NextStepsPage';
import InterviewPage from './pages/InterviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/next-steps" element={<NextStepsPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
