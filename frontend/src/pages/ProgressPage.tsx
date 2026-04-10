import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { apiProgress } from '../api/progress';

export default function ProgressPage() {
  const currentProject = useAppStore((s) => s.currentProject);
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    apiProgress.get().then((text) => {
      setContent(text);
      setLoading(false);
    });
  }, [currentProject]);

  const handleSave = async () => {
    await apiProgress.save(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
            进度记录
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)', marginTop: '2px', letterSpacing: '-0.12px' }}>
            progress.txt — Ralph 的学习与约束记录
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 18px',
            background: saved ? 'rgba(48,209,88,0.15)' : '#0071e3',
            border: saved ? '1px solid rgba(48,209,88,0.4)' : 'none',
            borderRadius: '8px',
            color: saved ? '#30d158' : '#fff',
            fontSize: '14px', fontFamily: 'var(--font-text)', letterSpacing: '-0.224px',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {saved ? '已保存 ✓' : '保存'}
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.224px' }}>
          加载中...
        </p>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ralph 运行后会在这里记录发现的约束、模式和注意事项。你也可以手动编辑。"
          style={{
            width: '100%', height: 'calc(100vh - 220px)',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
            fontSize: '13px', lineHeight: '1.6',
            letterSpacing: '0',
            resize: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#0071e3'; (e.currentTarget as HTMLTextAreaElement).style.outline = 'none'; }}
          onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
      )}
    </div>
  );
}
