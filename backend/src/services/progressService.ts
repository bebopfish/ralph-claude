import fs from 'fs/promises';
import path from 'path';
import { Story } from '../types';

export function getProgressPath(projectPath: string): string {
  return path.join(projectPath, 'progress.txt');
}

export async function readProgress(projectPath: string): Promise<string> {
  const filePath = getProgressPath(projectPath);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export async function writeProgress(projectPath: string, content: string): Promise<void> {
  const filePath = getProgressPath(projectPath);
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function appendStoryLearnings(projectPath: string, story: Story): Promise<void> {
  const existing = await readProgress(projectPath);
  const entry = `\n---\n[${new Date().toISOString()}] Completed: ${story.title}\nCommit: ${story.commitHash ?? 'none'}\n`;
  await writeProgress(projectPath, existing + entry);
}
