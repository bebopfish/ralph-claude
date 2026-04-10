import React from 'react';
import TopNav from './TopNav';

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 20px' }}>
        {children}
      </main>
    </div>
  );
}
