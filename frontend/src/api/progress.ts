import client from './client';

export const apiProgress = {
  get: async () => {
    const { data } = await client.get<{ content: string }>('/progress');
    return data.content;
  },

  save: async (content: string) => {
    await client.put('/progress', { content });
  },
};
