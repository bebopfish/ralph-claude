import client from './client';

export const apiRalph = {
  getStatus: async () => {
    const { data } = await client.get<{ running: boolean; pid?: number; currentStoryId?: string }>(
      '/ralph/status'
    );
    return data;
  },

  start: async (maxStories?: number) => {
    await client.post('/ralph/start', { maxStories });
  },

  stop: async () => {
    await client.post('/ralph/stop');
  },
};
