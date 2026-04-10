import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import ProjectPicker from '../project/ProjectPicker';

export default function Header() {
  const currentProject = useAppStore((s) => s.currentProject);
  const wsConnected = useAppStore((s) => s.wsConnected);
  const ralphRunning = useAppStore((s) => s.ralphRunning);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <header className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-4">
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-sm text-slate-200 transition-colors max-w-xs truncate"
          title={currentProject ?? '选择项目'}
        >
          <span>📁</span>
          <span className="truncate">
            {currentProject
              ? currentProject.split(/[/\\]/).pop()
              : '选择项目目录'}
          </span>
        </button>

        <div className="flex-1" />

        {ralphRunning && (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            运行中
          </span>
        )}

        <span
          className="flex items-center gap-1.5 text-xs"
          title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}
        >
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              wsConnected ? 'bg-green-400' : 'bg-red-500'
            }`}
          />
          <span className="text-slate-400">{wsConnected ? '已连接' : '未连接'}</span>
        </span>
      </header>

      {showPicker && <ProjectPicker onClose={() => setShowPicker(false)} />}
    </>
  );
}
