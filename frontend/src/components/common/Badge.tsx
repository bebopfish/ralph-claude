import { StoryStatus } from '../../types';

interface Props {
  status: StoryStatus;
}

const statusConfig: Record<StoryStatus, { label: string; color: string; bg: string }> = {
  pending:      { label: '待处理', color: 'rgba(255,255,255,0.48)', bg: 'rgba(255,255,255,0.08)' },
  'in-progress':{ label: '进行中', color: '#2997ff',               bg: 'rgba(41,151,255,0.12)' },
  completed:    { label: '已完成', color: '#30d158',               bg: 'rgba(48,209,88,0.12)'  },
  failed:       { label: '失败',   color: '#ff453a',               bg: 'rgba(255,69,58,0.12)'  },
};

export default function Badge({ status }: Props) {
  const cfg = statusConfig[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '980px',
        fontSize: '12px',
        fontFamily: 'var(--font-text)',
        fontWeight: 400,
        letterSpacing: '-0.12px',
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {cfg.label}
    </span>
  );
}
