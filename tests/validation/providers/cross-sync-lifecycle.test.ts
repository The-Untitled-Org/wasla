/**
 * Cross-Provider Sync: Idempotency & Deletion
 *
 * Validates sync behavior for:
 *  - Repeated sync yields zero writes after initial sync (idempotent)
 *  - Deleted source assets remove all managed copies and registry entries
 *  - Reverse edits (Latest-is-Greatest) propagate back across providers
 *  - Multi-asset sync in a single pass
 *
 * These tests use the same isolated temp-workspace pattern as the real CLI
 * and mock only path resolution, never actual sync or filesystem logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@syncer/scanner';
import { writeText, ensureDir, fileExists, readText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm, utimes } from 'fs/promises';

describe('Cross-Provider Sync: Idempotency & Lifecycle', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-e2e-idempotent-'));

    const markers = {
      claude: join(tmpBase, '.claude'),
      gemini: join(tmpBase, '.gemini'),
      openclaw: join(tmpBase, '.openclaw'),
      opencode: join(tmpBase, '.opencode'),
      cursor: join(tmpBase, '.cursor'),
      'github-copilot': join(tmpBase, '.vscode-fake'),
      'github-copilot-cli': join(tmpBase, '.github-fake'),
    };

    for (const dir of Object.values(markers)) {
      await ensureDir(dir);
    }

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

  // ─── Idempotency ──────────────────────────────────────────────────────────────

  it('second sync writes zero mirrors after initial sync', async () => {
    await ensureDir(join(tmpBase, '.gemini', 'agents'));
    await writeText(join(tmpBase, '.gemini', 'agents', 'researcher.md'), '# Researcher\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    const first = await syncer.sync(false);
    expect(first.stubsWritten).toBeGreaterThan(0);

    const second = await syncer.sync(false);
    expect(second.stubsWritten).toBe(0);
    expect(second.stubsDeleted).toBe(0);
    expect(second.assetsDiscovered).toBe(first.assetsDiscovered);
  });

  it('three consecutive syncs are all stable', async () => {
    await ensureDir(join(tmpBase, '.gemini', 'agents'));
    await writeText(join(tmpBase, '.gemini', 'agents', 'planner.md'), '# Planner\n');
    await ensureDir(join(tmpBase, '.gemini', 'skills', 'deep-research'));
    await writeText(
      join(tmpBase, '.gemini', 'skills', 'deep-research', 'SKILL.md'),
      '# Deep Research\n'
    );

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    await syncer.sync(false);
    const second = await syncer.sync(false);
    const third = await syncer.sync(false);

    expect(second.stubsWritten).toBe(0);
    expect(third.stubsWritten).toBe(0);
    expect(third.assetsDiscovered).toBe(second.assetsDiscovered);
  });

  // ─── Deletion propagation ────────────────────────────────────────────────────

  it('deleted source agent removes mirrors and registry entry', async () => {
    const geminiAgentDir = join(tmpBase, '.gemini', 'agents');
    await ensureDir(geminiAgentDir);
    await writeText(join(geminiAgentDir, 'ephemeral.md'), '# Ephemeral\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    await syncer.sync(false);

    // Verify mirrors exist
    expect(await fileExists(join(tmpBase, '.claude', 'agents', 'ephemeral.md'))).toBe(true);
    expect(await fileExists(join(tmpBase, '.cursor', 'agents', 'ephemeral.md'))).toBe(true);

    // Delete source
    await rm(join(geminiAgentDir, 'ephemeral.md'));

    const result = await syncer.sync(false);

    expect(result.stubsDeleted).toBeGreaterThan(0);
    expect(result.assetsDiscovered).toBe(0);
    expect(await fileExists(join(tmpBase, '.claude', 'agents', 'ephemeral.md'))).toBe(false);
    expect(await fileExists(join(tmpBase, '.cursor', 'agents', 'ephemeral.md'))).toBe(false);
    expect(registry.findAsset('ephemeral', 'agent')).toBeUndefined();
  });

  it('deleted source skill directory removes mirrors and registry entry', async () => {
    const geminiSkillDir = join(tmpBase, '.gemini', 'skills', 'temp-skill');
    await ensureDir(geminiSkillDir);
    await writeText(join(geminiSkillDir, 'SKILL.md'), '# Temp Skill\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    await syncer.sync(false);

    expect(await fileExists(join(tmpBase, '.claude', 'skills', 'temp-skill', 'SKILL.md'))).toBe(
      true
    );

    await rm(geminiSkillDir, { recursive: true, force: true });

    const result = await syncer.sync(false);

    expect(result.stubsDeleted).toBeGreaterThan(0);
    expect(await fileExists(join(tmpBase, '.claude', 'skills', 'temp-skill', 'SKILL.md'))).toBe(
      false
    );
    expect(registry.findAsset('temp-skill', 'skill')).toBeUndefined();
  });

  // ─── Latest-is-Greatest reverse propagation ───────────────────────────────────

  it('reverse edits from Claude propagate to Gemini and Cursor', async () => {
    const geminiAgentDir = join(tmpBase, '.gemini', 'agents');
    await ensureDir(geminiAgentDir);
    await writeText(join(geminiAgentDir, 'researcher.md'), '# Researcher v1\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    // Initial sync: Gemini → Claude + Cursor
    await syncer.sync(false);
    expect(await readText(join(tmpBase, '.claude', 'agents', 'researcher.md'))).toBe(
      '# Researcher v1\n'
    );

    // Simulate edit in Claude (newer mtime)
    await writeText(
      join(tmpBase, '.claude', 'agents', 'researcher.md'),
      '# Researcher v2 — edited in Claude\n'
    );
    const newer = new Date(Date.now() + 2_000);
    await utimes(join(tmpBase, '.claude', 'agents', 'researcher.md'), newer, newer);

    // Re-sync: Claude edit should win and propagate back
    await syncer.sync(false);

    expect(await readText(join(tmpBase, '.gemini', 'agents', 'researcher.md'))).toBe(
      '# Researcher v2 — edited in Claude\n'
    );
    expect(await readText(join(tmpBase, '.cursor', 'agents', 'researcher.md'))).toBe(
      '# Researcher v2 — edited in Claude\n'
    );
  });

  // ─── Multi-asset single pass ──────────────────────────────────────────────────

  it('syncs multiple assets of different types in a single pass', async () => {
    // Agent
    await ensureDir(join(tmpBase, '.gemini', 'agents'));
    await writeText(join(tmpBase, '.gemini', 'agents', 'reviewer.md'), '# Reviewer\n');

    // Skill
    await ensureDir(join(tmpBase, '.gemini', 'skills', 'analysis'));
    await writeText(
      join(tmpBase, '.gemini', 'skills', 'analysis', 'SKILL.md'),
      '# Analysis Skill\n'
    );

    // MCP
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({
        mcpServers: {
          'test-mcp': { command: 'npx', args: ['-y', 'test-mcp-server'] },
        },
      })
    );

    // Context
    await writeText(join(tmpBase, 'GEMINI.md'), '# Project Context\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    const result = await syncer.sync(false);

    expect(result.assetsDiscovered).toBeGreaterThanOrEqual(4);
    expect(result.stubsWritten).toBeGreaterThan(0);

    // All types should be in Claude
    expect(await fileExists(join(tmpBase, '.claude', 'agents', 'reviewer.md'))).toBe(true);
    expect(await fileExists(join(tmpBase, '.claude', 'skills', 'analysis', 'SKILL.md'))).toBe(true);
    expect(await fileExists(join(tmpBase, '.mcp.json'))).toBe(true);
    expect(await fileExists(join(tmpBase, 'CLAUDE.md'))).toBe(true);
  });
});
