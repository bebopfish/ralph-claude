import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Story } from '../../types';
import Badge from '../common/Badge';

interface Props {
  story: Story;
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export default function StoryCard({ story, onEdit, onDelete, disabled }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
    disabled,
  });

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
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
            {story.commitHash && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>
                {story.commitHash}
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
          {story.description && (
            <p
              style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.48)',
                letterSpacing: '-0.12px', lineHeight: 1.4,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                marginBottom: '6px',
              }}
            >
              {story.description}
            </p>
          )}
          {story.acceptanceCriteria.length > 0 && (
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
    </div>
  );
}
