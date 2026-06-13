export default function RobotEmoji({ size = 24 }: { size?: number }) {
  return (
    <img
      src="/Cipher_AI.png"
      alt="CipherAI"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain' }}
      draggable={false}
    />
  );
}
