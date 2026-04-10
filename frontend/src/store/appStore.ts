import { create } from 'zustand';
import { PrdFile, Story, StoryStatus, LogEntry } from '../types';
import { apiPrd } from '../api/prd';

interface AppState {
  // Project
  currentProject: string | null;
  setCurrentProject: (path: string) => void;

  // PRD
  prd: PrdFile | null;
  prdLoading: boolean;
  prdDirty: boolean;
  setPrd: (prd: PrdFile | null) => void;
  setPrdDirty: (dirty: boolean) => void;
  fetchPrd: () => Promise<void>;
  updateStoryInPrd: (storyId: string, status: StoryStatus, commitHash?: string) => void;

  // Ralph runner
  ralphRunning: boolean;
  ralphPid: number | null;
  currentStoryId: string | null;
  setRalphRunning: (running: boolean, pid?: number) => void;

  // Logs
  logs: LogEntry[];
  appendLog: (entry: LogEntry) => void;
  clearLogs: () => void;

  // WebSocket
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentProject: null,
  setCurrentProject: (path) => set({ currentProject: path }),

  prd: null,
  prdLoading: false,
  prdDirty: false,
  setPrd: (prd) => set({ prd }),
  setPrdDirty: (dirty) => set({ prdDirty: dirty }),

  fetchPrd: async () => {
    set({ prdLoading: true });
    try {
      const prd = await apiPrd.get();
      set({ prd, prdDirty: false });
    } catch {
      set({ prd: null });
    } finally {
      set({ prdLoading: false });
    }
  },

  updateStoryInPrd: (storyId, status, commitHash) => {
    const { prd } = get();
    if (!prd) return;
    const stories = prd.stories.map((s: Story) => {
      if (s.id !== storyId) return s;
      return {
        ...s,
        status,
        ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
        ...(commitHash ? { commitHash } : {}),
      };
    });
    set({ prd: { ...prd, stories } });
  },

  ralphRunning: false,
  ralphPid: null,
  currentStoryId: null,
  setRalphRunning: (running, pid) => set({ ralphRunning: running, ralphPid: pid ?? null }),

  logs: [],
  appendLog: (entry) =>
    set((state) => ({
      logs: [...state.logs.slice(-2000), entry], // keep last 2000 lines
    })),
  clearLogs: () => set({ logs: [] }),

  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
