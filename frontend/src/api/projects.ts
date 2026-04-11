import client from './client';

export const apiProjects = {
  getCurrent: async () => {
    const { data } = await client.get<{ project: string | null }>('/projects/current');
    return data;
  },

  setCurrent: async (path: string) => {
    const { data } = await client.post<{ project: string }>('/projects/current', { path });
    return data;
  },

  getRecent: async () => {
    const { data } = await client.get<{ projects: string[] }>('/projects/recent');
    return data;
  },

  browse: async (path?: string) => {
    const { data } = await client.post<{ path: string; dirs: { name: string; path: string }[] }>(
      '/projects/browse',
      { path }
    );
    return data;
  },

  mkdir: async (parentPath: string, name: string) => {
    const { data } = await client.post<{ path: string }>('/projects/mkdir', { path: parentPath, name });
    return data;
  },
};
