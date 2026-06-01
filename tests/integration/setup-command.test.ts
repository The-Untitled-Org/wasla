/**
 * Setup Command Integration Tests
 *
 * Validates the `wasla setup <provider>` flow:
 *  - Provisions the provider directory structure
 *  - Installs the wasla operator skill (SKILL.md)
 *  - Runs an initial sync that hydrates existing assets from other providers
 *  - Does NOT modify existing context files (CLAUDE.md, GEMINI.md)
 *
 * Uses the programmatic setupCommand/runSetup entry points with mocked paths.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runSetup } from '@cli/commands/setup';
import { writeText, ensureDir, fileExists, readText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';

describe('Setup command — provider provisioning', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-setup-'));

    const markers = {
      claude: join(tmpBase, '.claude'),
      gemini: join(tmpBase, '.gemini'),
      openclaw: join(tmpBase, '.openclaw'),
      opencode: join(tmpBase, '.opencode'),
      cursor: join(tmpBase, '.cursor'),
      'github-copilot': join(tmpBase, '.vscode-fake'),
      'github-copilot-cli': join(tmpBase, '.github-fake'),
    };

    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue(markers);
    vi.spyOn(pathUtils, 'getRegistryPath').mockReturnValue(
      join(tmpBase, '.wasla', 'registry.json')
    );
    vi.spyOn(pathUtils, 'getRegistryDir').mockReturnValue(join(tmpBase, '.wasla'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('setup gemini provisions the directory and installs the operator skill', async () => {
    await ensureDir(join(tmpBase, '.claude'));

    const { adapter, result } = await runSetup('gemini', 'workspace');

    expect(adapter.name).toBe('gemini');

    // Operator skill must be installed
    const skillPath = join(tmpBase, '.gemini', 'skills', 'wasla', 'SKILL.md');
    expect(await fileExists(skillPath)).toBe(true);

    const content = await readText(skillPath);
    expect(content).toContain('Wasla Operator');
    expect(content).toContain('wasla setup gemini');
  });

  it('setup gemini hydrates existing Claude agents', async () => {
    // Pre-existing Claude agent
    await ensureDir(join(tmpBase, '.claude', 'agents'));
    await writeText(join(tmpBase, '.claude', 'agents', 'reviewer.md'), '# Reviewer\n');

    const { result } = await runSetup('gemini', 'workspace');

    expect(result.assetsDiscovered).toBeGreaterThanOrEqual(1);

    // The Claude agent should be synced to Gemini
    expect(await readText(join(tmpBase, '.gemini', 'agents', 'reviewer.md'))).toBe('# Reviewer\n');
  });

  it('setup claude provisions the directory and installs the operator skill', async () => {
    await ensureDir(join(tmpBase, '.gemini'));

    const { adapter } = await runSetup('claude', 'workspace');

    expect(adapter.name).toBe('claude');

    const skillPath = join(tmpBase, '.claude', 'skills', 'wasla', 'SKILL.md');
    expect(await fileExists(skillPath)).toBe(true);

    const content = await readText(skillPath);
    expect(content).toContain('wasla setup claude');
  });

  it('setup does NOT touch existing CLAUDE.md', async () => {
    await ensureDir(join(tmpBase, '.claude'));
    await writeText(join(tmpBase, 'CLAUDE.md'), '# My project context — do not modify.\n');

    await runSetup('claude', 'workspace');

    expect(await readText(join(tmpBase, 'CLAUDE.md'))).toBe(
      '# My project context — do not modify.\n'
    );
  });

  it('setup is idempotent — calling twice does not duplicate skill', async () => {
    await ensureDir(join(tmpBase, '.gemini'));

    await runSetup('gemini', 'workspace');
    await runSetup('gemini', 'workspace');

    const skillPath = join(tmpBase, '.gemini', 'skills', 'wasla', 'SKILL.md');
    const content = await readText(skillPath);

    // The skill file content should be exactly one copy
    const matches = content.match(/Wasla Operator/g) || [];
    expect(matches.length).toBe(1);
  });
});
