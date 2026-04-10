import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { RalphConfig } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.ralph-claude');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readConfig(): Promise<RalphConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as RalphConfig;
  } catch {
    return { recentProjects: [], currentProject: null };
  }
}

export async function writeConfig(config: RalphConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function setCurrentProject(projectPath: string): Promise<void> {
  const config = await readConfig();
  config.currentProject = projectPath;
  // Add to recents, keep unique, max 10
  config.recentProjects = [
    projectPath,
    ...config.recentProjects.filter((p) => p !== projectPath),
  ].slice(0, 10);
  await writeConfig(config);
}

export async function getCurrentProject(): Promise<string | null> {
  const config = await readConfig();
  return config.currentProject;
}

export async function getRecentProjects(): Promise<string[]> {
  const config = await readConfig();
  return config.recentProjects;
}
