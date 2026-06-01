/**
 * MCP Server Merge Integration Tests
 *
 * Validates that MCP server synchronization merges new servers into existing
 * configurations without removing pre-existing servers. This is critical because
 * each provider independently defines MCP servers that users rely on.
 *
 * Official MCP spec: https://modelcontextprotocol.io/specification
 * Claude .mcp.json: https://docs.anthropic.com/s/claude-code-docs
 * Gemini settings.json: https://googlegemini.com/docs/gemini-code-assist
 * Cursor .cursor/mcp.json: https://docs.cursor.com/context/model-context-protocol
 * VS Code .vscode/mcp.json: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Syncer } from '@syncer/index';
import { RegistryManager } from '@core/registry';
import { Scanner } from '@syncer/scanner';
import { writeText, ensureDir, readText, readJSON } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';

describe('MCP Merge — additive merge preserves existing servers', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-mcp-merge-'));

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

  it('adds Gemini MCP servers to existing Claude .mcp.json without removing them', async () => {
    // Pre-existing Claude MCP
    await writeText(
      join(tmpBase, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'existing-claude-server': { command: 'npx', args: ['-y', 'claude-mcp'] },
        },
      })
    );

    // Gemini has a different MCP server
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({
        mcpServers: {
          'server-from-gemini': { command: 'npx', args: ['-y', 'gemini-mcp'] },
        },
      })
    );

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    const claudeMcp = await readJSON<Record<string, unknown>>(join(tmpBase, '.mcp.json'));
    const servers = claudeMcp.mcpServers as Record<string, unknown>;

    // Both servers must exist
    expect(servers['existing-claude-server']).toEqual({
      command: 'npx',
      args: ['-y', 'claude-mcp'],
    });
    expect(servers['server-from-gemini']).toEqual({
      command: 'npx',
      args: ['-y', 'gemini-mcp'],
    });
  });

  it('adds Claude MCP servers to existing Gemini settings.json without removing them', async () => {
    // Pre-existing Gemini MCP
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({
        mcpServers: {
          'existing-gemini-server': { command: 'node', args: ['gemini-server.js'] },
        },
      })
    );

    // Claude has a different MCP server
    await writeText(
      join(tmpBase, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          'server-from-claude': { command: 'npx', args: ['-y', 'from-claude'] },
        },
      })
    );

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    const geminiSettings = await readJSON<Record<string, unknown>>(
      join(tmpBase, '.gemini', 'settings.json')
    );
    const servers = geminiSettings.mcpServers as Record<string, unknown>;

    expect(servers['existing-gemini-server']).toBeDefined();
    expect(servers['server-from-claude']).toBeDefined();
  });

  it('adds MCP servers to Cursor .cursor/mcp.json without removing pre-existing', async () => {
    // Pre-existing Cursor MCP
    await writeText(
      join(tmpBase, '.cursor', 'mcp.json'),
      JSON.stringify({
        mcpServers: {
          'cursor-builtin': { command: 'cursor-mcp', args: [] },
        },
      })
    );

    // Gemini MCP
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({
        mcpServers: {
          'from-gemini': { command: 'npx', args: ['-y', 'gemini-mcp'] },
        },
      })
    );

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    const cursorMcp = await readJSON<Record<string, unknown>>(join(tmpBase, '.cursor', 'mcp.json'));
    const servers = cursorMcp.mcpServers as Record<string, unknown>;

    expect(servers['cursor-builtin']).toEqual({ command: 'cursor-mcp', args: [] });
    expect(servers['from-gemini']).toBeDefined();
  });

  it('syncing the same MCP server twice is idempotent', async () => {
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({
        mcpServers: {
          postgres: { command: 'node', args: ['postgres-mcp'] },
        },
      })
    );

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    const first = await syncer.sync(false);
    expect(first.stubsWritten).toBeGreaterThan(0);

    const second = await syncer.sync(false);
    expect(second.stubsWritten).toBe(0);

    // Verify the MCP is still there
    const claudeMcp = await readJSON<Record<string, unknown>>(join(tmpBase, '.mcp.json'));
    expect((claudeMcp.mcpServers as Record<string, unknown>)['postgres']).toBeDefined();
  });

  it('deleted MCP source removes the server from all targets', async () => {
    await writeText(
      join(tmpBase, '.gemini', 'settings.json'),
      JSON.stringify({
        mcpServers: {
          'temp-server': { command: 'node', args: ['temp.js'] },
        },
      })
    );

    const registry = new RegistryManager('workspace');
    const syncer = new Syncer(registry, new Scanner('workspace'), 'workspace');

    await syncer.sync(false);
    expect(
      (await readJSON<Record<string, unknown>>(join(tmpBase, '.mcp.json'))).mcpServers
    ).toHaveProperty('temp-server');

    // Remove the MCP server from Gemini
    await writeText(join(tmpBase, '.gemini', 'settings.json'), JSON.stringify({ mcpServers: {} }));

    const result = await syncer.sync(false);
    expect(result.stubsDeleted).toBeGreaterThan(0);

    const afterMcp = await readJSON<Record<string, unknown>>(join(tmpBase, '.mcp.json'));
    expect((afterMcp.mcpServers as Record<string, unknown>)['temp-server']).toBeUndefined();
  });
});
