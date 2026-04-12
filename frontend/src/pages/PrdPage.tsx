import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { apiPrd } from '../api/prd';
import PrdBoard from '../components/prd/PrdBoard';
import StoryEditor from '../components/prd/StoryEditor';
import Modal from '../components/common/Modal';
import { Story } from '../types';

export default function PrdPage() {
  const prd = useAppStore((s) => s.prd);
  const setPrd = useAppStore((s) => s.setPrd);
  const fetchPrd = useAppStore((s) => s.fetchPrd);
  const ralphRunning = useAppStore((s) => s.ralphRunning);
  const currentProject = useAppStore((s) => s.currentProject);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreatePrd = async () => {
    if (!currentProject) return;
    setCreating(true);
    try {
      const projectName = currentProject.split(/[/\\]/).pop() ?? 'my-project';
      const newPrd = await apiPrd.create(projectName);
      setPrd(newPrd);
    } finally {
      setCreating(false);
    }
  };

  const handleAddStory = async (data: {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    priority: number;
  }) => {
    await apiPrd.addStory(data);
    await fetchPrd();
    setShowAddModal(false);
  };

  const handleEditStory = async (data: {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    priority: number;
    resetStatus?: boolean;
  }) => {
    if (!editingStory) return;
    const updates: Partial<Story> = {
      title: data.title,
      description: data.description,
      acceptanceCriteria: data.acceptanceCriteria,
      priority: data.priority,
    };
    if (data.resetStatus) {
      updates.status = 'pending';
      updates.completedAt = undefined;
      updates.previousCommitHash = editingStory.commitHash ?? undefined;
      updates.commitHash = null;
    }
    await apiPrd.updateStory(editingStory.id, updates);
    await fetchPrd();
    setEditingStory(null);
  };

  const handleDeleteStory = async (id: string) => {
    await apiPrd.deleteStory(id);
    await fetchPrd();
  };

  const handleReorder = async (reorderedStories: Story[]) => {
    if (!prd) return;
    const newPrd = { ...prd, stories: reorderedStories };
    setPrd(newPrd);
    await apiPrd.reorderStories(reorderedStories.map((s) => s.id));
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

  if (!prd) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700,
            color: '#fff', letterSpacing: '-0.56px',
          }}
        >
          PRD 管理
        </h1>
        <div
          style={{
            background: 'var(--apple-surface-1)',
            borderRadius: '12px',
            boxShadow: 'var(--apple-shadow-card)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '48px 32px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', letterSpacing: '-0.12px' }}>
            该项目尚未创建 prd.json
          </p>
          <button
            onClick={handleCreatePrd}
            disabled={creating}
            style={{
              padding: '10px 22px',
              background: creating ? 'rgba(0,113,227,0.4)' : '#0071e3',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '15px',
              fontFamily: 'var(--font-text)', letterSpacing: '-0.12px',
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? '创建中...' : '创建 prd.json'}
          </button>
        </div>
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
            PRD 管理
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)', marginTop: '2px', letterSpacing: '-0.12px' }}>
            {prd.project} · {prd.stories.length} 个 Story
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={ralphRunning}
          style={{
            padding: '8px 18px',
            background: ralphRunning ? 'rgba(0,113,227,0.3)' : '#0071e3',
            border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '14px',
            fontFamily: 'var(--font-text)', letterSpacing: '-0.224px',
            cursor: ralphRunning ? 'not-allowed' : 'pointer',
            opacity: ralphRunning ? 0.5 : 1,
          }}
        >
          + 添加 Story
        </button>
      </div>

      {ralphRunning && (
        <div
          style={{
            background: 'rgba(255,159,10,0.08)',
            border: '1px solid rgba(255,159,10,0.24)',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px', color: '#ff9f0a',
            letterSpacing: '-0.12px',
          }}
        >
          Ralph 运行中，编辑功能暂时禁用
        </div>
      )}

      {prd.stories.length === 0 ? (
        <div
          style={{
            background: 'var(--apple-surface-1)',
            borderRadius: '12px',
            boxShadow: 'var(--apple-shadow-card)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '48px 32px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.224px' }}>
            暂无 Story，点击"添加 Story"开始
          </p>
        </div>
      ) : (
        <PrdBoard
          stories={prd.stories}
          onReorder={handleReorder}
          onEdit={setEditingStory}
          onDelete={handleDeleteStory}
          disabled={ralphRunning}
        />
      )}

      {showAddModal && (
        <Modal title="添加 Story" onClose={() => setShowAddModal(false)}>
          <StoryEditor onSave={handleAddStory} onCancel={() => setShowAddModal(false)} />
        </Modal>
      )}

      {editingStory && (
        <Modal title="编辑 Story" onClose={() => setEditingStory(null)}>
          <StoryEditor
            initial={editingStory}
            onSave={handleEditStory}
            onCancel={() => setEditingStory(null)}
          />
        </Modal>
      )}
    </div>
  );
}
