/**
 * User Scope Sync Integration Tests
 *
 * Validates that user-scope sync correctly:
 *  - Writes agent mirrors under ~/.{tool}/agents/
 *  - Uses ~/.wasla/registry.json for the user registry
 *  - Keeps user and workspace scopes fully independent
 *  - Skills propagate under user-scope paths
 *
 * These tests isolate user-scope paths to temp directories via
 * mock overrides on getToolMarkers, getRegistryPath, getRegistryDir.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@syncer/scanner';
import { writeText, ensureDir, fileExists, readText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';

describe('User-scope sync', () => {
  let tmpHome: string;

  beforeEach(async () => {
    tmpHome = await mkdtemp(join(tmpdir(), 'wasla-user-scope-'));

    const userMarkers = {
      claude: join(tmpHome, '.claude'),
      gemini: join(tmpHome, '.gemini'),
      openclaw: join(tmpHome, '.openclaw'),
      opencode: join(tmpHome, '.config', 'opencode'),
      cursor: join(tmpHome, '.cursor'),
      'github-copilot': join(tmpHome, '.config', 'Code', 'User'),
      'github-copilot-cli': join(tmpHome, '.copilot'),
    };

    // Only create the three core providers for user scope
    await ensureDir(userMarkers.gemini);
    await ensureDir(userMarkers.claude);
    await ensureDir(userMarkers.cursor);

    vi.spyOn(pathUtils, 'getToolMarkers').mockImplementation((scope) => {
      if (scope === 'user') return userMarkers;
      throw new Error('Test should only use user scope');
    });
    vi.spyOn(pathUtils, 'getRegistryPath').mockReturnValue(
      join(tmpHome, '.wasla', 'registry.json')
    );
    vi.spyOn(pathUtils, 'getRegistryDir').mockReturnValue(join(tmpHome, '.wasla'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpHome, { recursive: true, force: true });
  });

  it('syncs a user-scope Gemini agent to Claude and Cursor', async () => {
    const geminiAgentDir = join(tmpHome, '.gemini', 'agents');
    await ensureDir(geminiAgentDir);
    await writeText(join(geminiAgentDir, 'global-researcher.md'), '# Global Researcher\n');

    const registry = new RegistryManager('user');
    const syncer = new Syncer(registry, new Scanner('user'), 'user');

    const result = await syncer.sync(false);
    expect(result.assetsDiscovered).toBeGreaterThanOrEqual(1);

    expect(await readText(join(tmpHome, '.claude', 'agents', 'global-researcher.md'))).toBe(
      '# Global Researcher\n'
    );
    expect(await readText(join(tmpHome, '.cursor', 'agents', 'global-researcher.md'))).toBe(
      '# Global Researcher\n'
    );
  });

  it('user registry has scope=user', async () => {
    const registry = new RegistryManager('user');
    const syncer = new Syncer(registry, new Scanner('user'), 'user');

    await syncer.sync(false);
    await registry.save();

    const reloaded = new RegistryManager('user');
    await reloaded.load();

    expect(reloaded.get().config.scope).toBe('user');
  });

  it('user-scope context writes to ~/.gemini/GEMINI.md (not project root)', async () => {
    await writeText(join(tmpHome, '.gemini', 'GEMINI.md'), '# User-level context\n');

    const registry = new RegistryManager('user');
    const syncer = new Syncer(registry, new Scanner('user'), 'user');
    await syncer.sync(false);

    // Should propagate to user-scope Claude context
    expect(await readText(join(tmpHome, '.claude', 'CLAUDE.md'))).toBe('# User-level context\n');
  });

  it('user-scope sync is idempotent after initial sync', async () => {
    await ensureDir(join(tmpHome, '.gemini', 'agents'));
    await writeText(join(tmpHome, '.gemini', 'agents', 'helper.md'), '# Helper\n');

    const registry = new RegistryManager('user');
    const syncer = new Syncer(registry, new Scanner('user'), 'user');

    const first = await syncer.sync(false);
    const second = await syncer.sync(false);

    expect(second.stubsWritten).toBe(0);
    expect(second.stubsDeleted).toBe(0);
    expect(second.assetsDiscovered).toBe(first.assetsDiscovered);
  });
});
