import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import PrdPage from './pages/PrdPage';
import ProgressPage from './pages/ProgressPage';
import GitPage from './pages/GitPage';
import BrainstormPage from './pages/BrainstormPage';
import ProjectPicker from './components/project/ProjectPicker';
import { useWebSocket } from './hooks/useWebSocket';
import { useAppStore } from './store/appStore';
import { apiProjects } from './api/projects';

function NoProjectPlaceholder() {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: '16px', color: 'rgba(255,255,255,0.4)',
    }}>
      <div style={{ fontSize: '36px' }}>📁</div>
      <div style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>请先选择一个项目</div>
      <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
        选择项目后才能使用头脑风暴、PRD、进度等功能
      </div>
      <button
        onClick={() => setShowPicker(true)}
        style={{
          marginTop: '8px', padding: '8px 20px', borderRadius: '8px',
          background: '#1a6cf5', border: 'none', color: '#fff',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}
      >
        选择项目
      </button>
      {showPicker && <ProjectPicker onClose={() => setShowPicker(false)} />}
    </div>
  );
}

function RequireProject({ children }: { children: React.ReactNode }) {
  const currentProject = useAppStore((s) => s.currentProject);
  if (!currentProject) return <NoProjectPlaceholder />;
  return <>{children}</>;
}

function AppInner() {
  useWebSocket();
  const setCurrentProject = useAppStore((s) => s.setCurrentProject);
  const fetchPrd = useAppStore((s) => s.fetchPrd);

  useEffect(() => {
    apiProjects.getCurrent().then(({ project }) => {
      if (project) {
        setCurrentProject(project);
        fetchPrd();
      }
    });
  }, []);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireProject><DashboardPage /></RequireProject>} />
        <Route path="/prd" element={<RequireProject><PrdPage /></RequireProject>} />
        <Route path="/progress" element={<RequireProject><ProgressPage /></RequireProject>} />
        <Route path="/git" element={<RequireProject><GitPage /></RequireProject>} />
        <Route path="/brainstorm" element={<RequireProject><BrainstormPage /></RequireProject>} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
