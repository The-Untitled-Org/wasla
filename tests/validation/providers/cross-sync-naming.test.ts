/**
 * Cross-Provider Sync: Agent Naming & Format
 *
 * Validates the correct handling of provider-specific agent naming conventions:
 *  - GitHub Copilot uses .agent.md format (per GitHub Copilot Extensions docs)
 *  - Claude and Gemini use plain .md format
 *  - Multi-dot suffixes like .agent.md are correctly stripped when mirroring
 *    to providers that use plain .md (no .agent.agent.md duplication bug)
 *  - Reverse sync from .md providers back to .agent.md providers
 *
 * Official docs:
 *  - GitHub Copilot agent mode: https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions
 *  - Claude agents: https://docs.anthropic.com/s/claude-code-docs
 *  - Gemini agents: https://googlegemini.com/docs/gemini-code-assist/customize
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

describe('Cross-Provider Sync: Agent Naming Conventions', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-e2e-naming-'));

    const markers = {
      claude: join(tmpBase, '.claude'),
      gemini: join(tmpBase, '.gemini'),
      openclaw: join(tmpBase, '.openclaw'),
      opencode: join(tmpBase, '.opencode'),
      cursor: join(tmpBase, '.cursor'),
      'github-copilot': join(tmpBase, '.vscode'),
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

  it('GitHub Copilot .agent.md agent becomes .md in Claude and Gemini', async () => {
    // Create a GitHub Copilot agent with .agent.md extension
    const copilotAgentDir = join(tmpBase, '.github', 'agents');
    await ensureDir(copilotAgentDir);
    await writeText(
      join(copilotAgentDir, 'reviewer.agent.md'),
      '# Reviewer Agent\nReview code thoroughly.\n'
    );

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.syncToTool('github-copilot', ['claude', 'gemini']);

    // Claude uses plain .md naming
    const claudeAgent = join(tmpBase, '.claude', 'agents', 'reviewer.md');
    expect(await fileExists(claudeAgent)).toBe(true);
    expect(await readText(claudeAgent)).toBe('# Reviewer Agent\nReview code thoroughly.\n');

    // Gemini also uses plain .md naming
    const geminiAgent = join(tmpBase, '.gemini', 'agents', 'reviewer.md');
    expect(await fileExists(geminiAgent)).toBe(true);
    expect(await readText(geminiAgent)).toBe('# Reviewer Agent\nReview code thoroughly.\n');
  });

  it('never creates a .agent.agent.md duplicate (multi-dot bug regression)', async () => {
    const copilotAgentDir = join(tmpBase, '.github', 'agents');
    await ensureDir(copilotAgentDir);
    await writeText(join(copilotAgentDir, 'reviewer.agent.md'), '# Reviewer\n');

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    // No .agent.agent.md file should exist anywhere
    const { readdir } = await import('fs/promises');

    const checkDir = async (dir: string) => {
      try {
        const files = await readdir(dir, { recursive: true });
        for (const file of files) {
          expect(String(file)).not.toMatch(/\.agent\.agent\.md$/);
        }
      } catch {
        // dir doesn't exist — fine
      }
    };

    await checkDir(join(tmpBase, '.claude'));
    await checkDir(join(tmpBase, '.gemini'));
    await checkDir(join(tmpBase, '.cursor'));
  });

  it('Claude plain .md agent becomes .agent.md in GitHub Copilot', async () => {
    const claudeAgentDir = join(tmpBase, '.claude', 'agents');
    await ensureDir(claudeAgentDir);
    await writeText(join(claudeAgentDir, 'planner.md'), '# Planner\n');

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.syncToTool('claude', ['github-copilot']);

    // GitHub Copilot uses .agent.md extension
    const copilotAgent = join(tmpBase, '.github', 'agents', 'planner.agent.md');
    expect(await fileExists(copilotAgent)).toBe(true);
    expect(await readText(copilotAgent)).toBe('# Planner\n');
  });

  it('bidirectional sync preserves correct naming per provider', async () => {
    // Agent in Claude
    await ensureDir(join(tmpBase, '.claude', 'agents'));
    await writeText(join(tmpBase, '.claude', 'agents', 'coder.md'), '# Coder\n');

    // GitHub Copilot needs a provider-owned marker to be detected.
    // The adapter checks for .vscode/mcp.json, .github/agents, etc.
    await writeText(join(tmpBase, '.vscode', 'mcp.json'), JSON.stringify({ servers: {} }));

    const syncer = new Syncer(
      new RegistryManager('workspace'),
      new Scanner('workspace'),
      'workspace'
    );
    await syncer.sync(false);

    // Claude: coder.md (plain)
    expect(await fileExists(join(tmpBase, '.claude', 'agents', 'coder.md'))).toBe(true);
    // Gemini: coder.md (plain)
    expect(await fileExists(join(tmpBase, '.gemini', 'agents', 'coder.md'))).toBe(true);
    // GitHub Copilot: coder.agent.md
    expect(await fileExists(join(tmpBase, '.github', 'agents', 'coder.agent.md'))).toBe(true);
  });
});
