import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { LogEntry } from '../../types';

// Simple ANSI stripping (to avoid external dependency issues)
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, '');
}

function LogLine({ entry }: { entry: LogEntry }) {
  const color =
    entry.level === 'error' ? '#ff453a'
    : entry.level === 'warn' ? '#ff9f0a'
    : 'rgba(255,255,255,0.72)';

  return (
    <div
      style={{
        fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
        fontSize: '12px', lineHeight: '18px',
        color, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        letterSpacing: '0',
      }}
    >
      {stripAnsi(entry.message)}
    </div>
  );
}

export default function LogStream() {
  const logs = useAppStore((s) => s.logs);
  const clearLogs = useAppStore((s) => s.clearLogs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      style={{
        background: 'var(--apple-surface-1)',
        borderRadius: '12px',
        boxShadow: 'var(--apple-shadow-card)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600,
            color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.12px',
          }}
        >
          运行日志
        </h2>
        <button
          onClick={clearLogs}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.28)', fontSize: '12px',
            fontFamily: 'var(--font-text)', letterSpacing: '-0.12px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.56)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)'; }}
        >
          清空
        </button>
      </div>
      <div
        style={{
          background: '#000', height: '320px',
          overflowY: 'auto', padding: '16px',
        }}
      >
        {logs.length === 0 ? (
          <span
            style={{
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              fontSize: '12px', color: 'rgba(255,255,255,0.2)',
            }}
          >
            等待启动...
          </span>
        ) : (
          logs.map((entry: LogEntry, i: number) => <LogLine key={i} entry={entry} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
