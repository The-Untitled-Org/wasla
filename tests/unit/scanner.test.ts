/**
 * Scanner Unit Tests
 *
 * Covers (per implementation-plan.md §4):
 *  - Tool detection via TOOL_MARKERS (claude, gemini, openclaw)
 *  - Scan logic: classify originals vs stubs
 *  - Conflict detection (Latest-is-Greatest ordering)
 *  - Stub file identification via wasla header markers
 *  - Asset name extraction from filenames
 *  - groupByNameAndType internal grouping
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Scanner } from '@syncer/scanner';
import type { DiscoveredFile } from '@core/types';
import * as pathUtils from '@utils/paths';
import { ensureDir, writeText } from '@utils/fs';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

vi.mock('fs/promises', async (importActual) => {
  const actual = await importActual<typeof import('fs/promises')>();
  return {
    ...actual,
    stat: vi.fn(actual.stat),
  };
});

// ─── helpers ────────────────────────────────────────────────────────────────

function makeFile(overrides: Partial<DiscoveredFile> = {}): DiscoveredFile {
  return {
    path: '~/.claude/agents/researcher.md',
    relativePath: 'researcher.md',
    isStub: false,
    tool: 'claude',
    type: 'agent',
    name: 'researcher',
    modifiedAt: Date.now(),
    ...overrides,
  };
}

// ─── detectInstalledTools ───────────────────────────────────────────────────

describe('Scanner.detectInstalledTools', () => {
  it('returns an array', async () => {
    const scanner = new Scanner('workspace');
    const tools = await scanner.detectInstalledTools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it('returns only string tool names', async () => {
    const scanner = new Scanner('workspace');
    const tools = await scanner.detectInstalledTools();
    tools.forEach((t) => expect(typeof t).toBe('string'));
  });

  it('never returns unknown tool names', async () => {
    const scanner = new Scanner('workspace');
    const tools = await scanner.detectInstalledTools();
    const valid = new Set([
      'claude',
      'gemini',
      'openclaw',
      'opencode',
      'cursor',
      'github-copilot',
      'github-copilot-cli',
    ]);
    tools.forEach((t) => expect(valid.has(t)).toBe(true));
  });
});

// ─── detectConflicts — no conflict when one file is a stub ──────────────────

describe('Scanner.detectConflicts — stub vs original', () => {
  it('does NOT report a conflict when one file is a stub', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', isStub: false, modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', isStub: true, modifiedAt: 2000 }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts).toHaveLength(0);
  });

  it('does NOT report a conflict when only one original exists (no stubs)', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [makeFile({ tool: 'claude', isStub: false })];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts).toHaveLength(0);
  });

  it('does NOT report a conflict when all files are stubs', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', isStub: true }),
      makeFile({ tool: 'gemini', isStub: true }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts).toHaveLength(0);
  });
});

// ─── detectConflicts — conflict between originals ───────────────────────────

describe('Scanner.detectConflicts — multiple originals (Latest-is-Greatest)', () => {
  it('reports a conflict when 2 originals exist for the same asset', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', isStub: false, modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', isStub: false, modifiedAt: 2000 }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts).toHaveLength(1);
  });

  it('reports the asset name and type correctly', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', isStub: false, modifiedAt: 1000, name: 'planner', type: 'agent' }),
      makeFile({ tool: 'gemini', isStub: false, modifiedAt: 2000, name: 'planner', type: 'agent' }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts[0].asset_name).toBe('planner');
    expect(conflicts[0].type).toBe('agent');
  });

  it('sorts versions by mtime descending (newest first = Latest-is-Greatest)', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', isStub: false, modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', isStub: false, modifiedAt: 3000 }),
      makeFile({ tool: 'openclaw', isStub: false, modifiedAt: 2000 }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts[0].versions[0].tool).toBe('gemini'); // latest
    expect(conflicts[0].versions[1].tool).toBe('openclaw');
    expect(conflicts[0].versions[2].tool).toBe('claude'); // oldest
  });

  it('reports 3 versions when 3 originals conflict', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', isStub: false, modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', isStub: false, modifiedAt: 2000 }),
      makeFile({ tool: 'openclaw', isStub: false, modifiedAt: 3000 }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts[0].versions).toHaveLength(3);
  });

  it('handles conflicts for MCP type correctly', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', isStub: false, type: 'mcp', name: 'notion', modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', isStub: false, type: 'mcp', name: 'notion', modifiedAt: 2000 }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts[0].type).toBe('mcp');
  });

  it('reports separate conflicts for different asset names', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', name: 'researcher', isStub: false, modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', name: 'researcher', isStub: false, modifiedAt: 2000 }),
      makeFile({ tool: 'claude', name: 'planner', isStub: false, modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', name: 'planner', isStub: false, modifiedAt: 2000 }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts).toHaveLength(2);
    const names = conflicts.map((c) => c.asset_name).sort();
    expect(names).toEqual(['planner', 'researcher']);
  });

  it('handles empty discovered list', async () => {
    const scanner = new Scanner('workspace');
    const conflicts = await scanner.detectConflicts([]);
    expect(conflicts).toHaveLength(0);
  });

  it('each version entry contains tool, path, modified_at', async () => {
    const scanner = new Scanner('workspace');
    const now = Date.now();
    const discovered: DiscoveredFile[] = [
      makeFile({
        tool: 'claude',
        isStub: false,
        path: '~/.claude/agents/researcher.md',
        modifiedAt: now,
      }),
      makeFile({
        tool: 'gemini',
        isStub: false,
        path: '~/.gemini/agents/researcher.md',
        modifiedAt: now + 1,
      }),
    ];

    const conflicts = await scanner.detectConflicts(discovered);
    const v = conflicts[0].versions[0];
    expect(v).toHaveProperty('tool');
    expect(v).toHaveProperty('path');
    expect(v).toHaveProperty('modified_at');
  });
});

// ─── groupByNameAndType (via detectConflicts) ────────────────────────────────

describe('Scanner — grouping by name+type', () => {
  it('treats agent and mcp with the same name as separate assets', async () => {
    const scanner = new Scanner('workspace');
    const discovered: DiscoveredFile[] = [
      makeFile({ tool: 'claude', name: 'notion', type: 'agent', isStub: false, modifiedAt: 1000 }),
      makeFile({ tool: 'gemini', name: 'notion', type: 'mcp', isStub: false, modifiedAt: 2000 }),
    ];

    // notion|agent and notion|mcp are different keys → no conflict between them
    const conflicts = await scanner.detectConflicts(discovered);
    expect(conflicts).toHaveLength(0);
  });
});

// ─── scanTool & scanAllTools ──────────────────────────────────────────────────

describe('Scanner.scanTool & scanAllTools', () => {
  it('throws an error if an unknown tool is provided', async () => {
    const scanner = new Scanner('workspace');
    await expect(scanner.scanTool('invalid_tool_123', ['agent'])).rejects.toThrow(
      'Unknown tool: invalid_tool_123'
    );
  });

  it('delegates discovery to provider patterns and classifies registered stubs', async () => {
    const tmpBase = await mkdtemp(join(tmpdir(), 'wasla-scanner-'));
    const claude = join(tmpBase, '.claude');
    const stubPath = join(claude, 'skills', 'testfile.md');
    await ensureDir(join(claude, 'skills'));
    await writeText(stubPath, '# Test\n');
    const scanner = new Scanner('workspace');
    (scanner as any).stubReferences.set(`${stubPath}|`, new Set(['skill']));
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      claude,
    });

    const res = await scanner.scanTool('claude', ['skill']);

    expect(res).toHaveLength(1);
    expect(res[0].isStub).toBe(true);
    expect(res[0].name).toBe('testfile');

    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('returns false for a discovered file absent from the stub registry', async () => {
    const tmpBase = await mkdtemp(join(tmpdir(), 'wasla-scanner-'));
    const gemini = join(tmpBase, '.gemini');
    const skillPath = join(gemini, 'skills', 'unreadable', 'SKILL.md');
    await ensureDir(join(gemini, 'skills', 'unreadable'));
    await writeText(skillPath, '# Test\n');
    const scanner = new Scanner('workspace');
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      gemini,
    });
    const res = await scanner.scanTool('gemini', ['skill']);
    expect(res[0].isStub).toBe(false);

    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });
});
