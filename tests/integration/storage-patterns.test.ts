import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { directoryAssets, jsonMapAssets, markdownSections } from '@adapters/primitives/storage';
import { ensureDir, fileExists, readText, writeText } from '@utils/fs';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

describe('Storage patterns — provider-owned native layouts', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-storage-patterns-'));
  });

  afterEach(async () => {
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('reads, writes, and removes one MCP entry inside a shared JSON config', async () => {
    const path = join(tmpBase, 'settings.json');
    await writeText(path, JSON.stringify({ mcpServers: { existing: { command: 'keep' } } }));
    const pattern = jsonMapAssets({
      id: 'settings-mcp',
      type: 'mcp',
      path,
      keyPath: 'mcpServers',
      format: 'json',
    });

    const discovered = await pattern.discover({ tool: 'gemini', isStub: () => false });
    expect(discovered[0]).toMatchObject({
      name: 'existing',
      patternId: 'settings-mcp',
      targetKey: 'existing',
    });

    const result = await pattern.writeAsset({
      name: 'postgres',
      relativePath: 'postgres.json',
      content: JSON.stringify({ command: 'node', args: ['postgres.js'] }),
    });
    expect(result.reference).toEqual({ path, targetKey: 'postgres' });
    expect(JSON.parse(await readText(path)).mcpServers).toEqual({
      existing: { command: 'keep' },
      postgres: { command: 'node', args: ['postgres.js'] },
    });

    await pattern.removeAsset(result.reference, 'postgres');
    expect(JSON.parse(await readText(path)).mcpServers).toEqual({
      existing: { command: 'keep' },
    });
  });

  it('supports a future one-file-per-server MCP layout without scanner changes', async () => {
    const directory = join(tmpBase, 'mcp');
    const pattern = directoryAssets({
      id: 'mcp-files',
      type: 'mcp',
      directory,
      format: 'json',
    });

    const result = await pattern.writeAsset({
      name: 'postgres',
      relativePath: 'postgres.json',
      content: JSON.stringify({ command: 'node' }),
    });
    expect(result.reference.path).toBe(join(directory, 'postgres.json'));

    const discovered = await pattern.discover({ tool: 'future-provider', isStub: () => false });
    expect(discovered).toEqual([
      expect.objectContaining({
        name: 'postgres',
        patternId: 'mcp-files',
        path: join(directory, 'postgres.json'),
      }),
    ]);
  });

  it('updates native Markdown sections without injecting Wasla markers', async () => {
    const path = join(tmpBase, 'AGENTS.md');
    await writeText(
      path,
      '# Project\n\n## Agents\n\n### existing\nKeep this agent.\n\n## Notes\nDo not change this.\n'
    );
    const pattern = markdownSections({
      id: 'agents-document',
      type: 'agent',
      path,
      format: 'md',
      parentHeading: '## Agents',
      toNative: (asset) => `### ${asset.name}\nPrompt: ${asset.content}`,
      fromNative: (_name, content) => content.replace(/^### .+\nPrompt: /, ''),
    });

    const result = await pattern.writeAsset({
      name: 'reviewer',
      relativePath: 'reviewer.md',
      content: 'Review changes carefully.',
    });
    const content = await readText(path);
    expect(content).toContain('### existing\nKeep this agent.');
    expect(content).toContain('### reviewer\nPrompt: Review changes carefully.');
    expect(content).toContain('## Notes\nDo not change this.');
    expect(content).not.toContain('wasla');

    const discovered = await pattern.discover({ tool: 'future-provider', isStub: () => false });
    expect(discovered).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'reviewer',
          content: 'Review changes carefully.',
          targetKey: 'reviewer',
        }),
      ])
    );

    await pattern.removeAsset(result.reference, 'reviewer');
    expect(await readText(path)).not.toContain('### reviewer');
    expect(await readText(path)).toContain('## Notes\nDo not change this.');
    expect(await fileExists(path)).toBe(true);
  });

  it('provisions directory-based patterns before writing', async () => {
    const directory = join(tmpBase, 'skills');
    const pattern = directoryAssets({
      id: 'skills',
      type: 'skill',
      directory,
      format: 'md',
      fileName: (name) => `${name}/SKILL.md`,
    });

    await pattern.provision?.();
    await pattern.writeAsset({
      name: 'reviewer',
      relativePath: 'reviewer/SKILL.md',
      content: '# Reviewer\n',
    });

    expect(await fileExists(join(directory, 'reviewer', 'SKILL.md'))).toBe(true);
  });

  it('removes the complete multi-dot native format when discovering asset names', async () => {
    const directory = join(tmpBase, 'agents');
    await ensureDir(directory);
    await writeText(join(directory, 'reviewer.agent.md'), '# Reviewer\n');
    const pattern = directoryAssets({
      id: 'agents',
      type: 'agent',
      directory,
      format: 'agent.md',
    });

    const discovered = await pattern.discover({ tool: 'github-copilot', isStub: () => false });

    expect(discovered[0].name).toBe('reviewer');
  });
});
