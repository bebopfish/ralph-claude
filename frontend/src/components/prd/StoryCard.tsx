import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Story, Task, StoryStatus } from '../../types';
import Badge from '../common/Badge';

interface Props {
  story: Story;
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

function taskStatusColor(status: StoryStatus): string {
  switch (status) {
    case 'completed': return '#30d158';
    case 'in-progress': return '#ff9f0a';
    case 'failed': return '#ff453a';
    default: return 'rgba(255,255,255,0.2)';
  }
}

function taskStatusIcon(status: StoryStatus): string {
  switch (status) {
    case 'completed': return '✓';
    case 'in-progress': return '⟳';
    case 'failed': return '✕';
    default: return '·';
  }
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
      <span style={{
        fontSize: '11px', fontWeight: 600, color: taskStatusColor(task.status),
        width: '14px', textAlign: 'center', flexShrink: 0,
      }}>
        {taskStatusIcon(task.status)}
      </span>
      <span style={{
        fontSize: '13px', color: task.status === 'completed' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.72)',
        letterSpacing: '-0.12px', flex: 1,
        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
      }}>
        {task.title}
      </span>
      {task.commitHash && (
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', flexShrink: 0 }}>
          {task.commitHash.slice(0, 7)}
        </span>
      )}
    </div>
  );
}

export default function StoryCard({ story, onEdit, onDelete, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
    disabled,
  });

  const hasTasks = story.tasks && story.tasks.length > 0;
  const completedTasks = story.tasks?.filter((t) => t.status === 'completed').length ?? 0;
  const totalTasks = story.tasks?.length ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: 'var(--apple-surface-1)',
        borderRadius: '8px',
        boxShadow: 'var(--apple-shadow-card)',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '8px',
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.2)', cursor: disabled ? 'default' : 'grab',
            fontSize: '16px', lineHeight: 1, paddingTop: '2px', flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)'; }}
          title="拖拽排序"
        >
          ⠿
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge status={story.status} />
            {story.commitHash && !hasTasks && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>
                {story.commitHash}
              </span>
            )}
            {hasTasks && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.12px' }}>
                {completedTasks}/{totalTasks} tasks
              </span>
            )}
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 400,
              color: '#fff', letterSpacing: '-0.12px', marginBottom: '4px',
            }}
          >
            {story.title}
          </h3>
          {story.description && !expanded && (
            <p
              style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.48)',
                letterSpacing: '-0.12px', lineHeight: 1.4,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                marginBottom: hasTasks ? '6px' : 0,
              }}
            >
              {story.description}
            </p>
          )}
          {hasTasks && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: 'rgba(255,255,255,0.28)', fontSize: '12px',
                cursor: 'pointer', letterSpacing: '-0.12px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#2997ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)'; }}
            >
              ▸ 展开 {totalTasks} 个 task
            </button>
          )}
          {!hasTasks && story.acceptanceCriteria.length > 0 && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', letterSpacing: '-0.12px' }}>
              {story.acceptanceCriteria.length} 条验收标准
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => onEdit(story)}
            disabled={disabled}
            style={{
              background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
              color: 'rgba(255,255,255,0.28)', fontSize: '14px', padding: '4px',
              borderRadius: '4px', transition: 'color 0.15s, background 0.15s',
              opacity: disabled ? 0.3 : 1,
            }}
            onMouseEnter={(e) => { if (!disabled) { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={() => { if (window.confirm(`确认删除 "${story.title}"？`)) onDelete(story.id); }}
            disabled={disabled}
            style={{
              background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
              color: 'rgba(255,255,255,0.28)', fontSize: '14px', padding: '4px',
              borderRadius: '4px', transition: 'color 0.15s, background 0.15s',
              opacity: disabled ? 0.3 : 1,
            }}
            onMouseEnter={(e) => { if (!disabled) { (e.currentTarget as HTMLButtonElement).style.color = '#ff453a'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,69,58,0.1)'; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Expanded task list */}
      {hasTasks && expanded && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '12px 16px 12px 44px',
        }}>
          {story.tasks!.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'rgba(255,255,255,0.24)', fontSize: '12px',
              cursor: 'pointer', letterSpacing: '-0.12px', marginTop: '8px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#2997ff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.24)'; }}
          >
            ▴ 收起
          </button>
        </div>
      )}
    </div>
  );
}
