import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FULL_TEXT = 'Welcome to CipherAI';
const BUBBLES = ['Hi there! 👋', 'Ready to practice?', "Let's ace that interview!"];

export default function WelcomePage() {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(FULL_TEXT.slice(0, i));
      if (i >= FULL_TEXT.length) { clearInterval(id); setDone(true); }
    }, 70);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBubbleIdx(p => (p + 1) % BUBBLES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="welcome-page">
      <nav>
        <span className="logo">Cipher.AI 🤖</span>
      </nav>

      <main className="welcome-main">
        <h1 className="welcome-title">
          {displayed}
          {!done && <span className="cursor">|</span>}
        </h1>

        <div className="robot-wrapper">
          <div className="speech-bubble" key={bubbleIdx}>
            {BUBBLES[bubbleIdx]}
          </div>
          <span className="robot-emoji">🤖</span>
        </div>

        <button className="btn-primary" onClick={() => navigate('/login')}>
          Enter
        </button>
      </main>
    </div>
  );
}
