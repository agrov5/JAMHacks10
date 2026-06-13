// Uses Apple's emoji image so it looks identical on all platforms (Windows, Android, etc.)
const APPLE_ROBOT = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f916.png';

export default function RobotEmoji({ size = 24 }: { size?: number }) {
  return (
    <img
      src={APPLE_ROBOT}
      alt="robot"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', imageRendering: 'auto' }}
      draggable={false}
    />
  );
}
