import client from './client';
import { GitCommit } from '../types';

export const apiGit = {
  log: async (limit = 20) => {
    const { data } = await client.get<{ commits: GitCommit[] }>(`/git/log?limit=${limit}`);
    return data.commits;
  },

  status: async () => {
    const { data } = await client.get<{ clean: boolean; files: string[] }>('/git/status');
    return data;
  },
};
