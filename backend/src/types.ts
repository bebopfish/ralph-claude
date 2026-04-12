export type StoryStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

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
}

export interface PrdFile {
  project: string;
  version: string;
  created: string;
  stories: Story[];
}

export interface WsEvent {
  type:
    | 'log'
    | 'story:update'
    | 'ralph:started'
    | 'ralph:completed'
    | 'ralph:failed'
    | 'prd:changed'
    | 'progress:changed'
    | 'pong';
  [key: string]: unknown;
}

export interface LogEvent extends WsEvent {
  type: 'log';
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface StoryUpdateEvent extends WsEvent {
  type: 'story:update';
  storyId: string;
  status: StoryStatus;
  commitHash?: string;
}

export interface RalphConfig {
  recentProjects: string[];
  currentProject: string | null;
}
