import { useState, useEffect, useRef } from 'react';
import { apiProjects } from '../../api/projects';
import { useAppStore } from '../../store/appStore';

interface Props {
  onClose: () => void;
}

export default function ProjectPicker({ onClose }: Props) {
  const [inputPath, setInputPath] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [browsePath, setBrowsePath] = useState('');
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [mkdirError, setMkdirError] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const { setCurrentProject, fetchPrd } = useAppStore.getState();

  useEffect(() => {
    apiProjects.getRecent().then(({ projects }) => setRecent(projects));
    apiProjects.browse().then(({ path, dirs }) => {
      setBrowsePath(path);
      setDirs(dirs);
    });
  }, []);

  useEffect(() => {
    if (creatingFolder) {
      setTimeout(() => newFolderInputRef.current?.focus(), 50);
    }
  }, [creatingFolder]);

  const browse = async (path?: string) => {
    try {
      const result = await apiProjects.browse(path);
      setBrowsePath(result.path);
      setDirs(result.dirs);
    } catch {
      // ignore
    }
  };

  const selectProject = async (path: string) => {
    setLoading(true);
    setError('');
    try {
      await apiProjects.setCurrent(path);
      setCurrentProject(path);
      await fetchPrd();
      onClose();
    } catch {
      setError('无法访问该目录，请检查路径是否正确');
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = async () => {
    if (!inputPath.trim()) return;
    await selectProject(inputPath.trim());
  };

  const handleMkdir = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setMkdirError('');
    try {
      const { path: newPath } = await apiProjects.mkdir(browsePath, name);
      setCreatingFolder(false);
      setNewFolderName('');
      await browse(newPath);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setMkdirError(msg ?? '创建失败');
    }
  };

  const cancelMkdir = () => {
    setCreatingFolder(false);
    setNewFolderName('');
    setMkdirError('');
  };

  const labelStyle = {
    display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)',
    letterSpacing: '-0.12px', marginBottom: '6px',
  } as React.CSSProperties;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#1c1c1e',
          borderRadius: '12px',
          boxShadow: 'rgba(0,0,0,0.6) 0 24px 64px',
          width: '100%', maxWidth: '540px',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 600,
              color: '#fff', letterSpacing: '-0.28px',
            }}
          >
            选择项目目录
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '50%', width: '28px', height: '28px',
              cursor: 'pointer', color: 'rgba(255,255,255,0.56)',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Manual input */}
          <div>
            <label style={labelStyle}>输入路径</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputPath}
                onChange={(e) => setInputPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualInput()}
                placeholder="/path/to/your/project"
                style={{
                  flex: 1, background: '#000',
                  border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px',
                  padding: '8px 12px', color: '#fff',
                  fontFamily: 'var(--font-text)', fontSize: '14px', letterSpacing: '-0.224px',
                }}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#0071e3'; (e.currentTarget as HTMLInputElement).style.outline = 'none'; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.14)'; }}
              />
              <button
                onClick={handleManualInput}
                disabled={loading}
                style={{
                  padding: '8px 15px', background: loading ? 'rgba(0,113,227,0.4)' : '#0071e3',
                  border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '14px', fontFamily: 'var(--font-text)',
                  cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                确认
              </button>
            </div>
            {error && (
              <p style={{ color: '#ff453a', fontSize: '12px', marginTop: '6px', letterSpacing: '-0.12px' }}>
                {error}
              </p>
            )}
          </div>

          {/* Recent projects */}
          {recent.length > 0 && (
            <div>
              <label style={labelStyle}>最近打开</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recent.map((p) => (
                  <button
                    key={p}
                    onClick={() => selectProject(p)}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: 'none',
                      borderRadius: '8px', padding: '10px 12px',
                      color: 'rgba(255,255,255,0.8)', fontSize: '13px',
                      fontFamily: 'var(--font-text)', letterSpacing: '-0.12px',
                      textAlign: 'left', cursor: 'pointer',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    title={p}
                  >
                    📁 {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Directory browser */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>浏览目录</label>
              {!creatingFolder && (
                <button
                  onClick={() => setCreatingFolder(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#2997ff', fontSize: '12px',
                    fontFamily: 'var(--font-text)', letterSpacing: '-0.12px',
                    padding: '0', display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  + 新建文件夹
                </button>
              )}
            </div>

            {/* Inline new folder input */}
            {creatingFolder && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    value={newFolderName}
                    onChange={(e) => { setNewFolderName(e.target.value); setMkdirError(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleMkdir();
                      if (e.key === 'Escape') cancelMkdir();
                    }}
                    placeholder="新文件夹名称"
                    style={{
                      flex: 1, background: '#000',
                      border: '1px solid #0071e3', borderRadius: '8px',
                      padding: '7px 12px', color: '#fff',
                      fontFamily: 'var(--font-text)', fontSize: '13px', letterSpacing: '-0.12px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleMkdir}
                    disabled={!newFolderName.trim()}
                    style={{
                      padding: '7px 14px',
                      background: newFolderName.trim() ? '#0071e3' : 'rgba(0,113,227,0.3)',
                      border: 'none', borderRadius: '8px',
                      color: '#fff', fontSize: '13px', fontFamily: 'var(--font-text)',
                      cursor: newFolderName.trim() ? 'pointer' : 'not-allowed',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    创建
                  </button>
                  <button
                    onClick={cancelMkdir}
                    style={{
                      padding: '7px 12px',
                      background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px',
                      color: 'rgba(255,255,255,0.56)', fontSize: '13px', fontFamily: 'var(--font-text)',
                      cursor: 'pointer',
                    }}
                  >
                    取消
                  </button>
                </div>
                {mkdirError && (
                  <p style={{ color: '#ff453a', fontSize: '12px', marginTop: '5px', letterSpacing: '-0.12px' }}>
                    {mkdirError}
                  </p>
                )}
              </div>
            )}

            <div
              style={{
                background: '#000', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '200px', overflowY: 'auto',
              }}
            >
              {/* Current path row */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 10px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <button
                  onClick={() => {
                    const parent = browsePath.replace(/[/\\][^/\\]+$/, '') || browsePath;
                    if (parent !== browsePath) browse(parent);
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', fontSize: '14px', padding: '0 4px',
                    flexShrink: 0, transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
                  title="上一级"
                >
                  ←
                </button>
                <span
                  style={{
                    flex: 1, fontSize: '11px', color: 'rgba(255,255,255,0.32)',
                    letterSpacing: '-0.12px', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', fontFamily: 'monospace',
                  }}
                  title={browsePath}
                >
                  {browsePath}
                </span>
                <button
                  onClick={() => selectProject(browsePath)}
                  disabled={loading}
                  style={{
                    flexShrink: 0, padding: '3px 10px',
                    background: '#0071e3', border: 'none',
                    borderRadius: '980px', color: '#fff',
                    fontSize: '11px', fontFamily: 'var(--font-text)',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                    letterSpacing: '-0.12px',
                  }}
                >
                  选择此目录
                </button>
              </div>

              {dirs.map((d) => (
                <div
                  key={d.path}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <button
                    onClick={() => browse(d.path)}
                    style={{
                      flex: 1, textAlign: 'left', background: 'none', border: 'none',
                      padding: '8px 12px', color: 'rgba(255,255,255,0.72)',
                      fontSize: '13px', fontFamily: 'var(--font-text)', letterSpacing: '-0.12px',
                      cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                  >
                    📁 {d.name}
                  </button>
                  <button
                    onClick={() => selectProject(d.path)}
                    style={{
                      background: 'none', border: 'none', padding: '8px 12px',
                      color: '#2997ff', fontSize: '12px', fontFamily: 'var(--font-text)',
                      letterSpacing: '-0.12px', cursor: 'pointer', flexShrink: 0,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    选择
                  </button>
                </div>
              ))}
              {dirs.length === 0 && (
                <p
                  style={{
                    padding: '10px 12px', fontSize: '12px',
                    color: 'rgba(255,255,255,0.24)', letterSpacing: '-0.12px',
                  }}
                >
                  无子目录
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
