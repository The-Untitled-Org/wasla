import { BaseAdapter } from './base.js';
import { Asset } from '#core/types.js';
import { fileExists, writeText, ensureDir } from '#shared/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers } from '#shared/paths.js';

export class GeminiAdapter extends BaseAdapter {
  name = 'gemini';
  displayName = 'Gemini CLI';
  private scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const workspaceRoot = dirname(markers.gemini);
    return {
      agent: join(markers.gemini, 'agents'),
      skill: join(markers.gemini, 'skills'),
      mcp: join(markers.gemini, 'settings.json'),
      context:
        this.scope === 'workspace'
          ? join(workspaceRoot, 'GEMINI.md')
          : join(markers.gemini, 'GEMINI.md'),
    };
  }

  mcpKey = 'mcpServers';
  contextFile = 'GEMINI.md';

  formats = {
    agent: 'md' as const,
    skill: 'md' as const,
    mcp: 'json' as const,
    context: 'md' as const,
  };

  get skillDirs() {
    return [this.paths.skill!!];
  }

  async isInstalled(): Promise<boolean> {
    const markers = getToolMarkers(this.scope);
    return fileExists(markers.gemini);
  }

  mcpFromNative(server: Record<string, unknown>): Record<string, unknown> {
    if (typeof server.command === 'string') {
      return {
        command: server.command,
        ...(Array.isArray(server.args) ? { args: server.args } : {}),
        ...(server.env && typeof server.env === 'object' ? { env: server.env } : {}),
      };
    }
    return server;
  }

  async writeStub(asset: Asset, content: string, targetPath: string): Promise<void> {
    if (asset.type === 'agent' || asset.type === 'skill') {
      await this.writeSkillStub(targetPath, content);
    } else {
      await this.writeMcpStub(targetPath, content);
    }
  }

  private async writeSkillStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  private async writeMcpStub(targetPath: string, content: string): Promise<void> {
    await ensureDir(dirname(targetPath));
    await writeText(targetPath, content);
  }

  async installSkill(): Promise<void> {
    await this.installOperatorSkill();
  }

  getRootConfigAppend(): string | null {
    return null;
  }
}
