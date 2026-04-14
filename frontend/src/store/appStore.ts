import { create } from 'zustand';
import { PrdFile, Story, StoryStatus, LogEntry } from '../types';
import { apiPrd } from '../api/prd';

const LOG_STORAGE_PREFIX = 'ralph-logs';
const LOG_MAX_PERSIST = 500;

function loadLogsFromStorage(project: string): LogEntry[] {
  try {
    const raw = localStorage.getItem(`${LOG_STORAGE_PREFIX}:${project}`);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLogsToStorage(project: string, logs: LogEntry[]): void {
  try {
    localStorage.setItem(
      `${LOG_STORAGE_PREFIX}:${project}`,
      JSON.stringify(logs.slice(-LOG_MAX_PERSIST))
    );
  } catch {
    // Storage full, ignore
  }
}

function clearLogsFromStorage(project: string): void {
  localStorage.removeItem(`${LOG_STORAGE_PREFIX}:${project}`);
}

interface AppState {
  // Project
  currentProject: string | null;
  setCurrentProject: (path: string | null) => void;

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
  setCurrentProject: (path) => set({
    currentProject: path,
    logs: path ? loadLogsFromStorage(path) : [],
  }),

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
    set((state) => {
      const logs = [...state.logs.slice(-2000), entry];
      if (state.currentProject) saveLogsToStorage(state.currentProject, logs);
      return { logs };
    }),
  clearLogs: () =>
    set((state) => {
      if (state.currentProject) clearLogsFromStorage(state.currentProject);
      return { logs: [] };
    }),

  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
