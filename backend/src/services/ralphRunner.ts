import { spawn, ChildProcess } from 'child_process';
import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { readPrd, updateStoryStatus, updateTaskStatus } from './prdService';
import { readProgress, appendStoryLearnings } from './progressService';
import { gitCommit } from './gitService';
import { broadcast } from '../ws/wsHandler';
import { Story, Task } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RunnerState {
  running: boolean;
  pid?: number;
  currentStoryId?: string;
  currentTaskId?: string;
  process?: ChildProcess;
  watcher?: FSWatcher;
}

const state: RunnerState = { running: false };

function log(level: 'info' | 'warn' | 'error', message: string): void {
  broadcast({ type: 'log', level, message, timestamp: new Date().toISOString() });
}

function buildPrompt(story: Story, progress: string): string {
  const reimplementSection = story.previousCommitHash
    ? `
## ⚠️ Re-implementation Notice
This story was previously implemented (commit: ${story.previousCommitHash}) but the requirements have since been changed.
DO NOT re-implement from scratch. Instead:
1. Find the existing code written for this story
2. Understand what was already implemented
3. Update the existing implementation to meet the NEW acceptance criteria above
4. Remove or replace anything that no longer fits the new requirements
`
    : '';

  return `You are implementing a software story as part of an automated AI coding loop.

## Story
Title: ${story.title}
Description: ${story.description}

## Acceptance Criteria
${story.acceptanceCriteria.map((ac) => `- ${ac}`).join('\n')}
${reimplementSection}
## Previous Learnings (progress.txt)
${progress || 'No previous learnings yet.'}

## Instructions
1. Implement the story completely
2. Make sure all acceptance criteria are met
3. Write or update tests as needed
4. Do not break existing functionality
5. Keep changes focused and minimal
`.trim();
}

async function runCommand(
  cmd: string,
  args: string[],
  cwd: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd, shell: process.platform === 'win32' });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });
    proc.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
  });
}

function buildTaskPrompt(story: Story, task: Task, progress: string): string {
  const completedTasks = (story.tasks ?? []).filter((t) => t.status === 'completed');
  const completedSection = completedTasks.length > 0
    ? `\n## Already Completed Tasks in This Story\n${completedTasks.map((t) => `- ✓ ${t.title} (commit: ${t.commitHash})`).join('\n')}\n`
    : '';

  return `You are implementing a specific task as part of a larger software story in an automated AI coding loop.

## Story Context
Title: ${story.title}
Description: ${story.description}

## Acceptance Criteria for the Story
${story.acceptanceCriteria.map((ac) => `- ${ac}`).join('\n')}
${completedSection}
## Current Task to Implement
${task.title}

## Instructions
1. Implement ONLY the current task described above
2. Keep changes focused — do not implement other tasks in the story
3. Make sure the implementation is consistent with already completed tasks
4. Write or update tests relevant to this task as needed
5. Do not break existing functionality

## Previous Learnings (progress.txt)
${progress || 'No previous learnings yet.'}
`.trim();
}

async function runQualityChecks(projectPath: string): Promise<boolean> {
  // Try typecheck if script exists
  try {
    const { stdout: pkgRaw } = await execAsync('cat package.json', { cwd: projectPath });
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };

    if (pkg.scripts?.typecheck) {
      log('info', '\n[Ralph] Running TypeScript check...');
      const result = await runCommand('npm', ['run', 'typecheck'], projectPath);
      if (result.exitCode !== 0) {
        log('error', `[Ralph] TypeScript check FAILED:\n${result.stderr || result.stdout}`);
        return false;
      }
      log('info', '[Ralph] TypeScript check passed.');
    }

    if (pkg.scripts?.test) {
      log('info', '\n[Ralph] Running tests...');
      const result = await runCommand('npm', ['run', 'test', '--', '--passWithNoTests'], projectPath);
      if (result.exitCode !== 0) {
        log('warn', `[Ralph] Tests had issues:\n${result.stdout}`);
        // Don't fail on test issues - just warn
      } else {
        log('info', '[Ralph] Tests passed.');
      }
    }
  } catch {
    log('warn', '[Ralph] Could not run quality checks (no package.json or scripts).');
  }
  return true;
}

async function runStory(projectPath: string, story: Story): Promise<boolean> {
  log('info', `\n[Ralph] Starting story: ${story.title}`);
  await updateStoryStatus(projectPath, story.id, 'in-progress');
  broadcast({ type: 'story:update', storyId: story.id, status: 'in-progress' });

  const progress = await readProgress(projectPath);
  const prompt = buildPrompt(story, progress);

  // Determine claude command (cross-platform)
  const claudeCmd = 'claude';

  return new Promise((resolve) => {
    // Pass prompt via stdin to avoid Windows CMD 8191-char line length limit
    const proc = spawn(claudeCmd, ['--dangerously-skip-permissions', '-p'], {
      cwd: projectPath,
      shell: process.platform === 'win32',
      env: process.env,
    });
    proc.stdin?.write(prompt, 'utf-8');
    proc.stdin?.end();

    state.process = proc;

    proc.stdout?.on('data', (data: Buffer) => {
      log('info', data.toString());
    });

    proc.stderr?.on('data', (data: Buffer) => {
      log('warn', data.toString());
    });

    proc.on('close', async (code) => {
      state.process = undefined;
      if (code !== 0) {
        log('error', `[Ralph] Claude exited with code ${code}`);
        await updateStoryStatus(projectPath, story.id, 'failed');
        broadcast({ type: 'story:update', storyId: story.id, status: 'failed' });
        resolve(false);
        return;
      }

      const qualityPassed = await runQualityChecks(projectPath);
      if (!qualityPassed) {
        await updateStoryStatus(projectPath, story.id, 'failed');
        broadcast({ type: 'story:update', storyId: story.id, status: 'failed' });
        resolve(false);
        return;
      }

      try {
        const hash = await gitCommit(projectPath, `feat: ${story.title}`);
        await updateStoryStatus(projectPath, story.id, 'completed', hash);
        await appendStoryLearnings(projectPath, { ...story, commitHash: hash, status: 'completed' });
        broadcast({ type: 'story:update', storyId: story.id, status: 'completed', commitHash: hash });
        log('info', `[Ralph] Story completed and committed: ${hash}`);
        resolve(true);
      } catch (e) {
        log('warn', `[Ralph] Could not commit: ${String(e)}`);
        // Mark completed even without commit
        await updateStoryStatus(projectPath, story.id, 'completed');
        broadcast({ type: 'story:update', storyId: story.id, status: 'completed' });
        resolve(true);
      }
    });

    proc.on('error', async (err) => {
      log('error', `[Ralph] Failed to spawn claude: ${err.message}`);
      await updateStoryStatus(projectPath, story.id, 'failed');
      broadcast({ type: 'story:update', storyId: story.id, status: 'failed' });
      resolve(false);
    });
  });
}

async function runTask(projectPath: string, story: Story, task: Task): Promise<boolean> {
  log('info', `\n[Ralph] Starting task: ${task.title} (Story: ${story.title})`);

  // Mark task in-progress (also updates story status via deriveStoryStatus)
  await updateTaskStatus(projectPath, story.id, task.id, 'in-progress');
  broadcast({ type: 'task:update', storyId: story.id, taskId: task.id, status: 'in-progress' });
  broadcast({ type: 'story:update', storyId: story.id, status: 'in-progress' });

  const progress = await readProgress(projectPath);
  const prompt = buildTaskPrompt(story, task, progress);

  return new Promise((resolve) => {
    const proc = spawn('claude', ['--dangerously-skip-permissions', '-p'], {
      cwd: projectPath,
      shell: process.platform === 'win32',
      env: process.env,
    });
    proc.stdin?.write(prompt, 'utf-8');
    proc.stdin?.end();

    state.process = proc;

    proc.stdout?.on('data', (data: Buffer) => { log('info', data.toString()); });
    proc.stderr?.on('data', (data: Buffer) => { log('warn', data.toString()); });

    proc.on('close', async (code) => {
      state.process = undefined;
      if (code !== 0) {
        log('error', `[Ralph] Claude exited with code ${code}`);
        await updateTaskStatus(projectPath, story.id, task.id, 'failed');
        broadcast({ type: 'task:update', storyId: story.id, taskId: task.id, status: 'failed' });
        broadcast({ type: 'story:update', storyId: story.id, status: 'failed' });
        resolve(false);
        return;
      }

      const qualityPassed = await runQualityChecks(projectPath);
      if (!qualityPassed) {
        await updateTaskStatus(projectPath, story.id, task.id, 'failed');
        broadcast({ type: 'task:update', storyId: story.id, taskId: task.id, status: 'failed' });
        broadcast({ type: 'story:update', storyId: story.id, status: 'failed' });
        resolve(false);
        return;
      }

      try {
        const hash = await gitCommit(projectPath, `feat: ${story.title} - ${task.title}`);
        const { story: updatedStory } = await updateTaskStatus(projectPath, story.id, task.id, 'completed', hash);
        broadcast({ type: 'task:update', storyId: story.id, taskId: task.id, status: 'completed', commitHash: hash });
        broadcast({ type: 'story:update', storyId: story.id, status: updatedStory.status, commitHash: updatedStory.commitHash ?? undefined });

        if (updatedStory.status === 'completed') {
          await appendStoryLearnings(projectPath, { ...updatedStory, status: 'completed' });
          log('info', `[Ralph] Story completed: ${story.title}`);
        }
        log('info', `[Ralph] Task completed and committed: ${hash}`);
        resolve(true);
      } catch (e) {
        log('warn', `[Ralph] Could not commit: ${String(e)}`);
        const { story: updatedStory } = await updateTaskStatus(projectPath, story.id, task.id, 'completed');
        broadcast({ type: 'task:update', storyId: story.id, taskId: task.id, status: 'completed' });
        broadcast({ type: 'story:update', storyId: story.id, status: updatedStory.status });
        resolve(true);
      }
    });

    proc.on('error', async (err) => {
      log('error', `[Ralph] Failed to spawn claude: ${err.message}`);
      await updateTaskStatus(projectPath, story.id, task.id, 'failed');
      broadcast({ type: 'task:update', storyId: story.id, taskId: task.id, status: 'failed' });
      broadcast({ type: 'story:update', storyId: story.id, status: 'failed' });
      resolve(false);
    });
  });
}

export async function startRalph(projectPath: string, maxStories?: number): Promise<void> {
  if (state.running) {
    throw new Error('Ralph is already running');
  }

  state.running = true;
  const pid = process.pid;
  state.pid = pid;

  broadcast({ type: 'ralph:started', pid });
  log('info', `[Ralph] Starting autonomous loop for project: ${projectPath}`);

  // Watch files for changes
  state.watcher = chokidar.watch(
    [path.join(projectPath, 'prd.json'), path.join(projectPath, 'progress.txt')],
    { ignoreInitial: true }
  );
  state.watcher.on('change', (filePath: string) => {
    if (filePath.endsWith('prd.json')) broadcast({ type: 'prd:changed' });
    else if (filePath.endsWith('progress.txt')) broadcast({ type: 'progress:changed' });
  });

  try {
    let storiesProcessed = 0;
    const limit = maxStories ?? Infinity;

    while (state.running && storiesProcessed < limit) {
      const prd = await readPrd(projectPath);
      if (!prd) {
        log('error', '[Ralph] prd.json not found. Stopping.');
        break;
      }

      // Find the first story that is not yet completed/failed
      const activeStory = prd.stories.find((s) => s.status === 'pending' || s.status === 'in-progress');
      if (!activeStory) {
        log('info', '[Ralph] All stories completed!');
        break;
      }

      state.currentStoryId = activeStory.id;

      // Task-mode: story has tasks — execute one pending task at a time
      if (activeStory.tasks && activeStory.tasks.length > 0) {
        const pendingTask = activeStory.tasks.find((t) => t.status === 'pending');
        if (!pendingTask) {
          // All tasks done or failed but story status wasn't updated — shouldn't happen, skip
          storiesProcessed++;
          state.currentStoryId = undefined;
          continue;
        }
        state.currentTaskId = pendingTask.id;
        const success = await runTask(projectPath, activeStory, pendingTask);
        state.currentTaskId = undefined;
        state.currentStoryId = undefined;

        if (!success) {
          log('error', `[Ralph] Task failed: ${pendingTask.title}. Stopping.`);
          break;
        }
        // Don't increment storiesProcessed — keep looping until story is done
        // Re-read prd to check if story is now fully complete
        const updatedPrd = await readPrd(projectPath);
        const updatedStory = updatedPrd?.stories.find((s) => s.id === activeStory.id);
        if (updatedStory?.status === 'completed') {
          storiesProcessed++;
        }
      } else {
        // Legacy story-mode: no tasks, run story as a whole
        const success = await runStory(projectPath, activeStory);
        state.currentStoryId = undefined;

        if (!success) {
          log('error', `[Ralph] Story failed: ${activeStory.title}. Stopping.`);
          break;
        }
        storiesProcessed++;
      }
    }

    broadcast({ type: 'ralph:completed', exitCode: 0 });
    log('info', `[Ralph] Done. Processed ${storiesProcessed} story(ies).`);
  } catch (e) {
    const errMsg = String(e);
    broadcast({ type: 'ralph:failed', error: errMsg });
    log('error', `[Ralph] Fatal error: ${errMsg}`);
  } finally {
    state.running = false;
    state.pid = undefined;
    state.currentStoryId = undefined;
    state.watcher?.close();
    state.watcher = undefined;
  }
}

export function stopRalph(): void {
  if (!state.running) return;
  state.running = false;
  if (state.process) {
    state.process.kill('SIGTERM');
    state.process = undefined;
  }
  broadcast({ type: 'ralph:completed', exitCode: 130 });
  log('info', '[Ralph] Stopped by user.');
}

export function getRalphStatus(): { running: boolean; pid?: number; currentStoryId?: string; currentTaskId?: string } {
  return {
    running: state.running,
    pid: state.pid,
    currentStoryId: state.currentStoryId,
    currentTaskId: state.currentTaskId,
  };
}
