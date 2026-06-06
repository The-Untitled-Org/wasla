import { BaseAdapter } from '../base.js';
import { Asset } from '#core/types.js';
import { writeText, ensureDir } from '#shared/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers, isToolDetected } from '#shared/paths.js';
import { geminiAgentLocations } from './agents.js';
import { geminiContextLocations } from './context.js';
import { geminiMcpLocations } from './mcp.js';
import { geminiSkillLocations } from './skills.js';

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

  get locations() {
    return [
      ...geminiAgentLocations(this.paths.agent),
      ...geminiSkillLocations(this.paths.skill),
      ...geminiMcpLocations(this.paths.mcp, (server) => this.mcpFromNative(server)),
      ...geminiContextLocations(this.scope, this.paths.context, this.paths.mcp),
    ];
  }

  async isInstalled(): Promise<boolean> {
    return isToolDetected(this.name, this.scope, getToolMarkers(this.scope));
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
