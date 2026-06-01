import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiAdapter } from '@adapters/gemini';
import { ensureDir, fileExists, readText, writeText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

describe('GeminiAdapter — documented native patterns', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-gemini-patterns-'));
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      gemini: join(tmpBase, '.gemini'),
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('discovers root GEMINI.md without flattening nested context files', async () => {
    await writeText(join(tmpBase, 'GEMINI.md'), '# Root\n');
    await ensureDir(join(tmpBase, 'packages', 'api'));
    await writeText(join(tmpBase, 'packages', 'api', 'GEMINI.md'), '# API\n');
    const location = new GeminiAdapter('workspace').locations.find(
      (candidate) => candidate.type === 'context'
    );

    const discovered = await location!.discover({ tool: 'gemini', isStub: () => false });

    expect(discovered.map((asset) => asset.relativePath)).toEqual(['GEMINI.md']);
  });

  it('discovers configured context filenames from workspace settings', async () => {
    await ensureDir(join(tmpBase, '.gemini'));
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({ context: { fileName: ['AGENTS.md', 'CONTEXT.md'] } })
    );
    await writeText(join(tmpBase, 'AGENTS.md'), '# Agents\n');
    await writeText(join(tmpBase, 'CONTEXT.md'), '# Context\n');
    await writeText(join(tmpBase, 'GEMINI.md'), '# Default is replaced\n');
    const location = new GeminiAdapter('workspace').locations.find(
      (candidate) => candidate.type === 'context'
    );

    const discovered = await location!.discover({ tool: 'gemini', isStub: () => false });

    expect(discovered.map((asset) => asset.relativePath).sort()).toEqual([
      'AGENTS.md',
      'CONTEXT.md',
    ]);
  });

  it('writes workspace context to the first configured filename', async () => {
    await ensureDir(join(tmpBase, '.gemini'));
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({ context: { fileName: ['AGENTS.md', 'CONTEXT.md'] } })
    );
    const location = new GeminiAdapter('workspace').locations.find(
      (candidate) => candidate.type === 'context'
    );

    const result = await location!.writeAsset({
      name: 'context',
      relativePath: 'GEMINI.md',
      content: '# Shared context\n',
    });

    expect(result.reference.path).toBe(join(tmpBase, 'AGENTS.md'));
    expect(await readText(join(tmpBase, 'AGENTS.md'))).toBe('# Shared context\n');
    expect(await fileExists(join(tmpBase, 'GEMINI.md'))).toBe(false);
  });

  it('discovers the documented .agents/skills alias as read-only', () => {
    const locations = new GeminiAdapter('workspace').locations;
    const alias = locations.find((location) => location.id === 'agent-compatible-skills');

    expect(alias?.watchPaths[0]).toBe(join(tmpBase, '.agents', 'skills'));
    expect(alias?.read).toBe(true);
    expect(alias?.write).toBe(false);
  });

  it('uses ~/.gemini/GEMINI.md as the user-scope context destination', () => {
    const location = new GeminiAdapter('user').locations.find(
      (candidate) => candidate.type === 'context'
    );

    expect(location?.id).toBe('global-context');
    expect(location?.watchPaths).toEqual([join(tmpBase, '.gemini')]);
  });
});
