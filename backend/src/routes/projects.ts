import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import {
  getCurrentProject,
  setCurrentProject,
  getRecentProjects,
} from '../services/configService';

const router = Router();

router.get('/current', async (_req: Request, res: Response) => {
  const project = await getCurrentProject();
  res.json({ project });
});

router.post('/current', async (req: Request, res: Response) => {
  const { path: projectPath } = req.body as { path: string };
  if (!projectPath) {
    res.status(400).json({ error: 'path is required' });
    return;
  }
  try {
    await fs.access(projectPath);
    await setCurrentProject(projectPath);
    res.json({ project: projectPath });
  } catch {
    res.status(400).json({ error: 'Path does not exist or is not accessible' });
  }
});

router.get('/recent', async (_req: Request, res: Response) => {
  const projects = await getRecentProjects();
  res.json({ projects });
});

router.post('/browse', async (req: Request, res: Response) => {
  const { path: dirPath } = req.body as { path?: string };
  const targetPath = dirPath || (process.platform === 'win32' ? 'C:\\' : '/');

  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({
        name: e.name,
        path: path.join(targetPath, e.name),
      }));
    res.json({ path: targetPath, dirs });
  } catch {
    res.status(400).json({ error: 'Cannot read directory' });
  }
});

export default router;
