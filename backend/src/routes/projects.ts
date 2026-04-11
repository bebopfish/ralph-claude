import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import {
  getCurrentProject,
  setCurrentProject,
  clearCurrentProject,
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

router.delete('/current', async (_req: Request, res: Response) => {
  await clearCurrentProject();
  res.json({ ok: true });
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

router.post('/mkdir', async (req: Request, res: Response) => {
  const { path: parentPath, name } = req.body as { path: string; name: string };
  if (!parentPath || !name) {
    res.status(400).json({ error: 'path and name are required' });
    return;
  }
  if (/[/\\<>:"|?*]/.test(name) || name === '.' || name === '..') {
    res.status(400).json({ error: 'Invalid directory name' });
    return;
  }
  const newPath = path.join(parentPath, name);
  try {
    await fs.mkdir(newPath);
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    res.status(400).json({ error: code === 'EEXIST' ? '目录已存在' : '创建失败' });
    return;
  }
  // Auto-initialize a git repository so Ralph can commit immediately
  await new Promise<void>((resolve) => {
    execFile('git', ['init'], { cwd: newPath }, () => resolve());
  });
  res.json({ path: newPath });
});

export default router;
