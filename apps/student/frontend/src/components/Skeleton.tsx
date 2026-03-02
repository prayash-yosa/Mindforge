export function Skeleton({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(90deg, var(--color-cream-dark) 25%, var(--color-cream) 50%, var(--color-cream-dark) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

if (typeof document !== 'undefined' && !document.getElementById('shimmer-css')) {
  const style = document.createElement('style');
  style.id = 'shimmer-css';
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}
