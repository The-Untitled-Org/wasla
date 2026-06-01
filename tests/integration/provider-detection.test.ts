import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GithubCopilotCliAdapter } from '@adapters/github-copilot-cli';
import { OpenclawAdapter } from '@adapters/openclaw';
import { writeText } from '@utils/fs';
import * as pathUtils from '@utils/paths';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

describe('Provider detection — shared workspace files', () => {
  let tmpBase: string;

  beforeEach(async () => {
    tmpBase = await mkdtemp(join(tmpdir(), 'wasla-provider-detection-'));
    vi.spyOn(pathUtils, 'getToolMarkers').mockReturnValue({
      openclaw: join(tmpBase, '.openclaw'),
      'github-copilot-cli': join(tmpBase, '.github'),
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpBase, { recursive: true, force: true });
  });

  it('does not detect OpenClaw from a root AGENTS.md written for another provider', async () => {
    await writeText(join(tmpBase, 'AGENTS.md'), '# Shared context\n');

    await expect(new OpenclawAdapter('workspace').isInstalled()).resolves.toBe(false);
  });

  it('does not detect GitHub Copilot CLI from a shared root .mcp.json file', async () => {
    await writeText(join(tmpBase, '.mcp.json'), JSON.stringify({ mcpServers: {} }));

    await expect(new GithubCopilotCliAdapter('workspace').isInstalled()).resolves.toBe(false);
  });
});
