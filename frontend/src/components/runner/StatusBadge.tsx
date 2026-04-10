interface Props {
  running: boolean;
}

export default function StatusBadge({ running }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 12px', borderRadius: '980px',
        fontSize: '12px', fontFamily: 'var(--font-text)', letterSpacing: '-0.12px',
        color: running ? '#ff9f0a' : 'rgba(255,255,255,0.4)',
        background: running ? 'rgba(255,159,10,0.12)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <span
        style={{
          width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
          background: running ? '#ff9f0a' : 'rgba(255,255,255,0.24)',
          animation: running ? 'sb-pulse 1.4s ease-in-out infinite' : 'none',
        }}
      />
      {running ? '运行中' : '空闲'}
      <style>{`@keyframes sb-pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </span>
  );
}
