import { GitCommit } from '../../types';

interface Props {
  commits: GitCommit[];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function GitLog({ commits }: Props) {
  if (commits.length === 0) {
    return (
      <p
        style={{
          fontSize: '14px', color: 'rgba(255,255,255,0.28)',
          letterSpacing: '-0.224px',
        }}
      >
        暂无提交记录
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {commits.map((commit) => (
        <div
          key={commit.hash}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            background: 'var(--apple-surface-1)',
            borderRadius: '10px',
            boxShadow: 'var(--apple-shadow-card)',
            padding: '12px 16px',
            transition: 'background 0.15s',
          }}
        >
          <code
            style={{
              fontSize: '11px', color: '#2997ff',
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              flexShrink: 0, marginTop: '2px',
              letterSpacing: '0',
            }}
          >
            {commit.shortHash}
          </code>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: '14px', color: 'rgba(255,255,255,0.88)',
                letterSpacing: '-0.224px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {commit.message}
            </p>
            <p
              style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.32)',
                letterSpacing: '-0.12px', marginTop: '2px',
              }}
            >
              {commit.author} · {formatDate(commit.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
