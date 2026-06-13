import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
      <img src="/Cipher_AI.png" alt="CipherAI" style={{ height: 28, width: 'auto' }} draggable={false} />
      CipherAI
    </Link>
  );
}
