/**
 * Cross-Provider Sync: Context Files
 *
 * Validates the documented Gemini context sync behavior:
 *  - Root GEMINI.md propagates as CLAUDE.md and AGENTS.md for respective providers
 *  - Custom context filenames configured via .gemini/settings.json are honored
 *  - Nested Gemini context files (e.g. packages/api/GEMINI.md) are ignored
 *  - Reverse edits to the context in Claude propagate back to Gemini
 *  - Context sync writes to the configured filename, not GEMINI.md, when overridden
 *
 * Official docs: https://googlegemini.com/docs/gemini-code-assist/context
 * Cursor: https://docs.cursor.com/context/rules-for-ai
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

describe('Cross-Provider Sync: Context', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-e2e-context-'));

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

  it('propagates root GEMINI.md to Claude as CLAUDE.md', async () => {
    const contextContent = '# Project Context\nShared rules for the workspace.\n';
    await writeText(join(tmpBase, 'GEMINI.md'), contextContent);

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    expect(await readText(join(tmpBase, 'CLAUDE.md'))).toBe(contextContent);
  });

  it('propagates root GEMINI.md to Cursor as AGENTS.md', async () => {
    const contextContent = '# Project Rules\nStandards for all providers.\n';
    await writeText(join(tmpBase, 'GEMINI.md'), contextContent);

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    // Cursor uses AGENTS.md at the workspace root for context
    expect(await readText(join(tmpBase, 'AGENTS.md'))).toBe(contextContent);
  });

  it('does NOT sync nested Gemini context files (e.g. packages/api/GEMINI.md)', async () => {
    await writeText(join(tmpBase, 'GEMINI.md'), '# Root Context\n');
    await ensureDir(join(tmpBase, 'packages', 'api'));
    await writeText(
      join(tmpBase, 'packages', 'api', 'GEMINI.md'),
      '# API Context - must NOT overwrite root\n'
    );

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    // CLAUDE.md should contain root context, not nested
    const claudeContent = await readText(join(tmpBase, 'CLAUDE.md'));
    expect(claudeContent).toBe('# Root Context\n');
    expect(claudeContent).not.toContain('API Context');

    // Nested file must be untouched
    expect(await readText(join(tmpBase, 'packages', 'api', 'GEMINI.md'))).toBe(
      '# API Context - must NOT overwrite root\n'
    );
  });

  it('honors custom context filename from .gemini/settings.json', async () => {
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({ context: { fileName: 'AGENTS.md' } })
    );
    await writeText(join(tmpBase, 'AGENTS.md'), '# Custom Context\n');

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    // Should propagate to Claude
    expect(await readText(join(tmpBase, 'CLAUDE.md'))).toBe('# Custom Context\n');
    // Must NOT create a stale GEMINI.md
    expect(await fileExists(join(tmpBase, 'GEMINI.md'))).toBe(false);
  });

  it('supports multiple custom context filenames from settings.json', async () => {
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({ context: { fileName: ['AGENTS.md', 'CONTEXT.md'] } })
    );
    await writeText(join(tmpBase, 'AGENTS.md'), '# Agents\n');
    await writeText(join(tmpBase, 'CONTEXT.md'), '# Context\n');

    // Explicitly make CONTEXT.md newer to guarantee latest-is-greatest wins,
    // avoiding flaky failures on CI filesystems with lower time resolution.
    const newer = new Date(Date.now() + 2_000);
    await utimes(join(tmpBase, 'CONTEXT.md'), newer, newer);

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    // Both files are discovered as context assets with the same name ('context'),
    // so the syncer uses Latest-is-Greatest (newest mtime wins).
    // CONTEXT.md is created after AGENTS.md, so it has the latest mtime.
    expect(await readText(join(tmpBase, 'CLAUDE.md'))).toBe('# Context\n');
  });

  it('reverse-edits from Claude context propagate back to Gemini', async () => {
    await writeText(join(tmpBase, 'GEMINI.md'), '# Original Context\n');

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');
    await syncer.sync(false);

    expect(await readText(join(tmpBase, 'CLAUDE.md'))).toBe('# Original Context\n');

    // Simulate editing the Claude copy
    await writeText(join(tmpBase, 'CLAUDE.md'), '# Updated In Claude\n');
    const newer = new Date(Date.now() + 2_000);
    await utimes(join(tmpBase, 'CLAUDE.md'), newer, newer);

    await syncer.sync(false);

    // Gemini should now have the Claude edit
    expect(await readText(join(tmpBase, 'GEMINI.md'))).toBe('# Updated In Claude\n');
  });

  it('writes context to the configured Gemini filename during reverse sync', async () => {
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({ context: { fileName: 'AGENTS.md' } })
    );
    await writeText(join(tmpBase, 'AGENTS.md'), '# Initial\n');

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    // Claude edits context
    await writeText(join(tmpBase, 'CLAUDE.md'), '# Edited In Claude\n');
    const newer = new Date(Date.now() + 2_000);
    await utimes(join(tmpBase, 'CLAUDE.md'), newer, newer);

    await syncer.sync(false);

    // Should write back to AGENTS.md (the configured filename), not GEMINI.md
    expect(await readText(join(tmpBase, 'AGENTS.md'))).toBe('# Edited In Claude\n');
    expect(await fileExists(join(tmpBase, 'GEMINI.md'))).toBe(false);
  });
});
