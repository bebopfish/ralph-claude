import fs from 'fs/promises';
import path from 'path';
import { PrdFile, Story, StoryStatus } from '../types';

export function getPrdPath(projectPath: string): string {
  return path.join(projectPath, 'prd.json');
}

export async function readPrd(projectPath: string): Promise<PrdFile | null> {
  const filePath = getPrdPath(projectPath);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as PrdFile;
  } catch {
    return null;
  }
}

export async function writePrd(projectPath: string, prd: PrdFile): Promise<void> {
  const filePath = getPrdPath(projectPath);
  await fs.writeFile(filePath, JSON.stringify(prd, null, 2), 'utf-8');
}

export async function createPrd(projectPath: string, projectName: string): Promise<PrdFile> {
  const prd: PrdFile = {
    project: projectName,
    version: '1.0.0',
    created: new Date().toISOString(),
    stories: [],
  };
  await writePrd(projectPath, prd);
  return prd;
}

export async function addStory(projectPath: string, story: Omit<Story, 'id' | 'status' | 'completedAt' | 'commitHash'>): Promise<Story> {
  const prd = await readPrd(projectPath);
  if (!prd) throw new Error('prd.json not found');

  const newStory: Story = {
    ...story,
    id: `story-${Date.now()}`,
    status: 'pending',
    completedAt: null,
    commitHash: null,
  };
  prd.stories.push(newStory);
  await writePrd(projectPath, prd);
  return newStory;
}

export async function updateStory(projectPath: string, id: string, updates: Partial<Story>): Promise<Story> {
  const prd = await readPrd(projectPath);
  if (!prd) throw new Error('prd.json not found');

  const idx = prd.stories.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`Story ${id} not found`);

  prd.stories[idx] = { ...prd.stories[idx], ...updates };
  await writePrd(projectPath, prd);
  return prd.stories[idx];
}

export async function updateStoryStatus(
  projectPath: string,
  id: string,
  status: StoryStatus,
  commitHash?: string
): Promise<void> {
  const updates: Partial<Story> = { status };
  if (status === 'completed') {
    updates.completedAt = new Date().toISOString();
    if (commitHash) updates.commitHash = commitHash;
  }
  await updateStory(projectPath, id, updates);
}

export async function deleteStory(projectPath: string, id: string): Promise<void> {
  const prd = await readPrd(projectPath);
  if (!prd) throw new Error('prd.json not found');

  prd.stories = prd.stories.filter((s) => s.id !== id);
  await writePrd(projectPath, prd);
}

export async function reorderStories(projectPath: string, orderedIds: string[]): Promise<void> {
  const prd = await readPrd(projectPath);
  if (!prd) throw new Error('prd.json not found');

  const storyMap = new Map(prd.stories.map((s) => [s.id, s]));
  prd.stories = orderedIds
    .map((id, index) => {
      const story = storyMap.get(id);
      if (!story) throw new Error(`Story ${id} not found`);
      return { ...story, priority: index + 1 };
    });

  await writePrd(projectPath, prd);
}
