import RunPanel from '../components/runner/RunPanel';
import LogStream from '../components/runner/LogStream';

export default function DashboardPage() {
  return (
    <div
      style={{
        maxWidth: '720px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}
    >
      <RunPanel />
      <LogStream />
    </div>
  );
}
