import React from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#1c1c1e',
          borderRadius: '12px',
          boxShadow: 'rgba(0,0,0,0.5) 0 20px 60px',
          width: '100%', maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px', fontWeight: 600,
              letterSpacing: '-0.28px', color: '#fff',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none', borderRadius: '50%',
              width: '28px', height: '28px',
              cursor: 'pointer', color: 'rgba(255,255,255,0.56)',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
          >
            ×
          </button>
        </div>
        <div style={{ overflow: 'auto', flex: 1, padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}
