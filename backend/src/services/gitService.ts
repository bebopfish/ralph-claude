import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export async function getGitLog(projectPath: string, limit = 20): Promise<GitCommit[]> {
  try {
    const { stdout } = await execAsync(
      `git log --pretty=format:"%H|%h|%s|%an|%ci" -n ${limit}`,
      { cwd: projectPath }
    );
    if (!stdout.trim()) return [];
    return stdout
      .trim()
      .split('\n')
      .map((line) => {
        const [hash, shortHash, message, author, date] = line.split('|');
        return { hash, shortHash, message, author, date };
      });
  } catch {
    return [];
  }
}

export async function getGitStatus(projectPath: string): Promise<{ clean: boolean; files: string[] }> {
  try {
    const { stdout } = await execAsync('git status --porcelain', { cwd: projectPath });
    const files = stdout.trim().split('\n').filter(Boolean);
    return { clean: files.length === 0, files };
  } catch {
    return { clean: true, files: [] };
  }
}

export async function gitCommit(projectPath: string, message: string): Promise<string> {
  await execAsync('git add -A', { cwd: projectPath });
  await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: projectPath });
  const { stdout } = await execAsync('git rev-parse --short HEAD', { cwd: projectPath });
  return stdout.trim();
}
