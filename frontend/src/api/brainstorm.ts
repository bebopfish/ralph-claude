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
  ): Promise<{ content: string; stories: StoryDraft[] | null }> => {
    const { data } = await client.post('/brainstorm/chat', { messages, existingStories });
    return data;
  },
};
