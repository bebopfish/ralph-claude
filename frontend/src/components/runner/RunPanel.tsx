import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { apiRalph } from '../../api/ralph';
import StatusBadge from './StatusBadge';

export default function RunPanel() {
  const ralphRunning = useAppStore((s) => s.ralphRunning);
  const currentProject = useAppStore((s) => s.currentProject);
  const prd = useAppStore((s) => s.prd);
  const clearLogs = useAppStore((s) => s.clearLogs);
  const [maxStories, setMaxStories] = useState('');
  const [error, setError] = useState('');

  const pendingCount = prd?.stories.filter((s) => s.status === 'pending').length ?? 0;
  const completedCount = prd?.stories.filter((s) => s.status === 'completed').length ?? 0;
  const failedCount = prd?.stories.filter((s) => s.status === 'failed').length ?? 0;
  const total = prd?.stories.length ?? 0;

  const handleStart = async () => {
    if (!currentProject) {
      setError('请先选择项目目录');
      return;
    }
    if (!prd || pendingCount === 0) {
      setError('没有待处理的 story');
      return;
    }
    setError('');
    clearLogs();
    try {
      const max = maxStories ? parseInt(maxStories, 10) : undefined;
      await apiRalph.start(max);
    } catch (e) {
      setError('启动失败，请检查项目配置');
    }
  };

  const handleStop = async () => {
    try {
      await apiRalph.stop();
    } catch {
      // ignore
    }
  };

  const stats = [
    { label: '全部',   count: total,          color: 'rgba(255,255,255,0.8)' },
    { label: '待处理', count: pendingCount,    color: '#2997ff' },
    { label: '已完成', count: completedCount,  color: '#30d158' },
    { label: '失败',   count: failedCount,     color: '#ff453a' },
  ];

  return (
    <div
      style={{
        background: 'var(--apple-surface-1)',
        borderRadius: '12px',
        boxShadow: 'var(--apple-shadow-card)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 600,
            letterSpacing: '0.231px', color: '#fff',
          }}
        >
          运行控制
        </h2>
        <StatusBadge running={ralphRunning} />
      </div>

      {/* Story stats */}
      {prd && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
          {stats.map((item) => (
            <div
              key={item.label}
              style={{
                background: '#000', borderRadius: '8px', padding: '14px 8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400,
                  color: item.color, lineHeight: 1.14, letterSpacing: '0.196px',
                }}
              >
                {item.count}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '3px', letterSpacing: '-0.12px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Max stories */}
      {!ralphRunning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.48)', letterSpacing: '-0.224px', whiteSpace: 'nowrap' }}>
            最多执行 Story 数
          </label>
          <input
            type="number"
            min="1"
            value={maxStories}
            onChange={(e) => setMaxStories(e.target.value)}
            placeholder="全部"
            style={{
              width: '72px', background: '#000',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px',
              padding: '6px 10px', color: '#fff',
              fontFamily: 'var(--font-text)', fontSize: '14px', letterSpacing: '-0.224px',
            }}
            onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#0071e3'; (e.currentTarget as HTMLInputElement).style.outline = 'none'; }}
            onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.14)'; }}
          />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.12px' }}>留空执行全部</span>
        </div>
      )}

      {error && (
        <p style={{ color: '#ff453a', fontSize: '14px', letterSpacing: '-0.224px', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {!ralphRunning ? (
        <button
          onClick={handleStart}
          disabled={!currentProject || pendingCount === 0}
          style={{
            width: '100%', padding: '10px 15px',
            background: (!currentProject || pendingCount === 0) ? 'rgba(0,113,227,0.3)' : '#0071e3',
            border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '17px', fontFamily: 'var(--font-text)',
            letterSpacing: '-0.374px', cursor: (!currentProject || pendingCount === 0) ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (currentProject && pendingCount > 0) (e.currentTarget as HTMLButtonElement).style.background = '#0077ed'; }}
          onMouseLeave={(e) => { if (currentProject && pendingCount > 0) (e.currentTarget as HTMLButtonElement).style.background = '#0071e3'; }}
        >
          ▶ 启动 Ralph
        </button>
      ) : (
        <button
          onClick={handleStop}
          style={{
            width: '100%', padding: '10px 15px',
            background: 'rgba(255,69,58,0.2)',
            border: '1px solid rgba(255,69,58,0.4)', borderRadius: '8px',
            color: '#ff453a', fontSize: '17px', fontFamily: 'var(--font-text)',
            letterSpacing: '-0.374px', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,69,58,0.3)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,69,58,0.2)'; }}
        >
          ■ 停止
        </button>
      )}

      {!currentProject && (
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '10px', letterSpacing: '-0.12px' }}>
          请先在顶部选择项目目录
        </p>
      )}
      {currentProject && pendingCount === 0 && !ralphRunning && (
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '10px', letterSpacing: '-0.12px' }}>
          {total === 0 ? '请先在 PRD 页面添加 Story' : '所有 Story 已完成或失败'}
        </p>
      )}
    </div>
  );
}
