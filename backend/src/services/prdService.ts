import fs from 'fs/promises';
import path from 'path';
import { PrdFile, Story, StoryStatus, Task } from '../types';

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

  // Normalize tasks: incoming may be drafts with only `title`
  const tasks: Task[] | undefined = story.tasks?.map((t, i) => ({
    id: `task-${Date.now()}-${i}`,
    title: t.title,
    status: 'pending' as const,
    commitHash: null,
    completedAt: null,
  }));

  const newStory: Story = {
    ...story,
    tasks,
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

  // Normalize tasks: ensure every task has a proper id/status
  if (updates.tasks) {
    updates.tasks = updates.tasks.map((t, i) => ({
      id: t.id || `task-${Date.now()}-${i}`,
      title: t.title,
      status: t.status || 'pending',
      commitHash: t.commitHash ?? null,
      completedAt: t.completedAt ?? null,
    }));
  }

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
    updates.previousCommitHash = null; // clear after successful re-implementation
  }
  await updateStory(projectPath, id, updates);
}

/** Derive story status from its tasks. */
export function deriveStoryStatus(tasks: Task[]): StoryStatus {
  if (tasks.length === 0) return 'pending';
  if (tasks.some((t) => t.status === 'failed')) return 'failed';
  if (tasks.some((t) => t.status === 'in-progress')) return 'in-progress';
  if (tasks.every((t) => t.status === 'completed')) return 'completed';
  return 'pending';
}

export async function updateTaskStatus(
  projectPath: string,
  storyId: string,
  taskId: string,
  status: StoryStatus,
  commitHash?: string,
): Promise<{ story: Story; task: Task }> {
  const prd = await readPrd(projectPath);
  if (!prd) throw new Error('prd.json not found');

  const storyIdx = prd.stories.findIndex((s) => s.id === storyId);
  if (storyIdx === -1) throw new Error(`Story ${storyId} not found`);

  const story = prd.stories[storyIdx];
  const tasks = story.tasks ?? [];
  const taskIdx = tasks.findIndex((t) => t.id === taskId);
  if (taskIdx === -1) throw new Error(`Task ${taskId} not found`);

  const updatedTask: Task = {
    ...tasks[taskIdx],
    status,
    ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
    ...(commitHash ? { commitHash } : {}),
  };
  tasks[taskIdx] = updatedTask;

  // Derive story status from all tasks
  const derivedStatus = deriveStoryStatus(tasks);
  const storyUpdates: Partial<Story> = { tasks, status: derivedStatus };
  if (derivedStatus === 'completed') {
    storyUpdates.completedAt = new Date().toISOString();
    // Use last task's commit as story-level commit
    const lastDone = [...tasks].reverse().find((t) => t.commitHash);
    if (lastDone?.commitHash) storyUpdates.commitHash = lastDone.commitHash;
    storyUpdates.previousCommitHash = null;
  }

  prd.stories[storyIdx] = { ...story, ...storyUpdates };
  await writePrd(projectPath, prd);
  return { story: prd.stories[storyIdx], task: updatedTask };
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
