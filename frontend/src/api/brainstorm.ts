import client from './client';
import { Story } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StoryDraft {
  storyId?: string; // present when modifying an existing story
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export const apiBrainstorm = {
  chat: async (
    messages: ChatMessage[],
    existingStories?: Pick<Story, 'id' | 'title' | 'description' | 'acceptanceCriteria' | 'status'>[],
    projectPath?: string | null,
  ): Promise<{ content: string; stories: StoryDraft[] | null; projectContextSaved: boolean }> => {
    const { data } = await client.post('/brainstorm/chat', { messages, existingStories, projectPath });
    return data;
  },

  getProjectContext: async (projectPath: string): Promise<string | null> => {
    const { data } = await client.get<{ context: string | null }>('/brainstorm/project-context', {
      params: { projectPath },
    });
    return data.context;
  },
};
