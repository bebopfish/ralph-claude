import { Router, Request, Response } from 'express';
import { getGitLog, getGitStatus } from '../services/gitService';
import { getCurrentProject } from '../services/configService';

const router = Router();

router.get('/log', async (req: Request, res: Response) => {
  const project = await getCurrentProject();
  if (!project) {
    res.status(400).json({ error: 'No project selected' });
    return;
  }
  const limit = parseInt(String(req.query.limit ?? '20'), 10);
  const commits = await getGitLog(project, limit);
  res.json({ commits });
});

router.get('/status', async (_req: Request, res: Response) => {
  const project = await getCurrentProject();
  if (!project) {
    res.status(400).json({ error: 'No project selected' });
    return;
  }
  const status = await getGitStatus(project);
  res.json(status);
});

export default router;
