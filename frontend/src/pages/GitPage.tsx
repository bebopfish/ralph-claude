import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { apiGit } from '../api/git';
import GitLog from '../components/git/GitLog';
import { GitCommit } from '../types';

export default function GitPage() {
  const currentProject = useAppStore((s) => s.currentProject);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [status, setStatus] = useState<{ clean: boolean; files: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [log, gitStatus] = await Promise.all([apiGit.log(30), apiGit.status()]);
      setCommits(log);
      setStatus(gitStatus);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentProject) return;
    loadData();
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.224px' }}>
          请先在顶部选择项目目录。
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700,
              color: '#fff', letterSpacing: '-0.56px',
            }}
          >
            Git 历史
          </h1>
          {status && (
            <p
              style={{
                fontSize: '13px', marginTop: '2px', letterSpacing: '-0.12px',
                color: status.clean ? '#30d158' : '#ff9f0a',
              }}
            >
              {status.clean ? '工作区干净' : `${status.files.length} 个未提交变更`}
            </p>
          )}
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: '7px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: '8px',
            color: loading ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.72)',
            fontSize: '14px', fontFamily: 'var(--font-text)', letterSpacing: '-0.224px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      <GitLog commits={commits} />
    </div>
  );
}
