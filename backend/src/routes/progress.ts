import { Router, Request, Response } from 'express';
import { readProgress, writeProgress } from '../services/progressService';
import { getCurrentProject } from '../services/configService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const project = await getCurrentProject();
  if (!project) {
    res.status(400).json({ error: 'No project selected' });
    return;
  }
  const content = await readProgress(project);
  res.json({ content });
});

router.put('/', async (req: Request, res: Response) => {
  const project = await getCurrentProject();
  if (!project) {
    res.status(400).json({ error: 'No project selected' });
    return;
  }
  const { content } = req.body as { content: string };
  try {
    await writeProgress(project, content ?? '');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
