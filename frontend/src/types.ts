export type StoryStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  status: StoryStatus;
  commitHash: string | null;
  completedAt: string | null;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: StoryStatus;
  priority: number;
  completedAt: string | null;
  commitHash: string | null;
  previousCommitHash?: string | null;
  tasks?: Task[];
}

export interface PrdFile {
  project: string;
  version: string;
  created: string;
  stories: Story[];
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}
