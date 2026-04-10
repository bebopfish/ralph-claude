import { Router, Request, Response } from 'express';
import { startRalph, stopRalph, getRalphStatus } from '../services/ralphRunner';
import { getCurrentProject } from '../services/configService';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json(getRalphStatus());
});

router.post('/start', async (req: Request, res: Response) => {
  const project = await getCurrentProject();
  if (!project) {
    res.status(400).json({ error: 'No project selected' });
    return;
  }
  const status = getRalphStatus();
  if (status.running) {
    res.status(409).json({ error: 'Ralph is already running' });
    return;
  }
  const { maxStories } = req.body as { maxStories?: number };
  // Start in background - don't await
  startRalph(project, maxStories).catch((e) => console.error('Ralph error:', e));
  res.json({ ok: true, message: 'Ralph started' });
});

router.post('/stop', (_req: Request, res: Response) => {
  stopRalph();
  res.json({ ok: true, message: 'Ralph stopped' });
});

export default router;
