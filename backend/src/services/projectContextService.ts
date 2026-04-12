import fs from 'fs/promises';
import path from 'path';

const CLAUDE_MD = 'CLAUDE.md';

export async function readProjectContext(projectPath: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(projectPath, CLAUDE_MD), 'utf-8');
  } catch {
    return null;
  }
}

export async function writeProjectContext(projectPath: string, content: string): Promise<void> {
  await fs.writeFile(path.join(projectPath, CLAUDE_MD), content, 'utf-8');
}
