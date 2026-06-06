import { BaseAdapter } from '../base.js';
import { Asset } from '#core/types.js';
import { writeText, ensureDir } from '#shared/fs.js';
import { dirname, join } from 'path';
import { getToolMarkers, isToolDetected } from '#shared/paths.js';
import { cursorAgentLocations } from './agents.js';
import { cursorContextLocations } from './context.js';
import { cursorMcpLocations } from './mcp.js';
import { cursorSkillLocations } from './skills.js';

export class CursorAdapter extends BaseAdapter {
  name = 'cursor';
  displayName = 'Cursor';
  protected scope: 'user' | 'workspace';

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    super();
    this.scope = scope;
  }

  get paths() {
    const markers = getToolMarkers(this.scope);
    const base = markers['cursor'];
    return {
      agent: join(base, 'agents'),
      skill: join(base, 'skills'),
      mcp: join(base, 'mcp.json'),
      context: this.scope === 'workspace' ? join(dirname(base), 'AGENTS.md') : undefined,
    };
  }

  mcpKey = 'mcpServers';
  contextFile = 'AGENTS.md';

  get skillDirs() {
    return [this.paths.skill!];
  }

  get locations() {
    return [
      ...cursorAgentLocations(this.paths.agent),
      ...cursorSkillLocations(this.paths.skill),
      ...cursorMcpLocations(this.paths.mcp),
      ...cursorContextLocations(this.paths.context),
    ];
  }

  formats = {
    agent: 'md' as const,
    skill: 'md' as const,
    mcp: 'json' as const,
    context: 'md' as const,
  };

  async isInstalled(): Promise<boolean> {
    return isToolDetected(this.name, this.scope, getToolMarkers(this.scope));
  }

  async writeStub(asset: Asset, content: string, targetPath: string): Promise<void> {
    if (asset.type === 'agent') {
      await this.writeAgentStub(targetPath, content);
    } else {
      await this.writeMcpStub(targetPath, content);
    }
  }

  private async writeAgentStub(targetPath: string, content: string): Promise<void> {
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
