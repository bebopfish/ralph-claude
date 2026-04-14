import client from './client';
import { PrdFile, Story } from '../types';

// Draft type for creating a story — tasks may be partial (backend normalizes them)
type StoryCreateInput = Omit<Story, 'id' | 'status' | 'completedAt' | 'commitHash' | 'tasks'> & {
  tasks?: { id?: string; title: string }[];
};

export const apiPrd = {
  get: async () => {
    const { data } = await client.get<PrdFile>('/prd');
    return data;
  },

  create: async (projectName: string) => {
    const { data } = await client.post<PrdFile>('/prd', { projectName });
    return data;
  },

  update: async (prd: PrdFile) => {
    await client.put('/prd', prd);
  },

  addStory: async (story: StoryCreateInput) => {
    const { data } = await client.post<Story>('/prd/stories', story);
    return data;
  },

  updateStory: async (id: string, updates: Partial<Story>) => {
    const { data } = await client.put<Story>(`/prd/stories/${id}`, updates);
    return data;
  },

  deleteStory: async (id: string) => {
    await client.delete(`/prd/stories/${id}`);
  },

  reorderStories: async (orderedIds: string[]) => {
    await client.post('/prd/stories/reorder', { orderedIds });
  },
};
