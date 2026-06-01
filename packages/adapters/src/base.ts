import { WaslaAdapter, Asset, AssetFormat, AssetLocation } from '#core/types.js';
import { ensureDir, fileExists, readText, writeText } from '#shared/fs.js';
import { join } from 'path';

export abstract class BaseAdapter implements WaslaAdapter {
  abstract name: string;
  abstract displayName: string;
  abstract mcpKey: string;
  abstract contextFile: string;
  abstract skillDirs: string[];
  abstract locations: AssetLocation[];

  abstract paths: {
    agent?: string;
    skill?: string;
    mcp?: string;
    context?: string;
  };
  abstract formats: {
    agent?: AssetFormat;
    skill?: AssetFormat;
    mcp?: AssetFormat;
    context?: AssetFormat;
  };

  abstract isInstalled(): Promise<boolean>;

  async provision(): Promise<void> {
    for (const location of this.locations.filter((location) => location.write)) {
      await location.provision?.();
    }
  }

  protected async installOperatorSkill(): Promise<void> {
    if (!this.paths.skill) return;

    const skillDir = join(this.paths.skill, 'wasla');
    await ensureDir(skillDir);
    const skillPath = join(skillDir, 'SKILL.md');
    const content = `---
name: wasla
description: >
  Sets up ${this.displayName} with Wasla and manages synchronized AI assets.
  Use when asked to initialize, restore, hydrate, or troubleshoot Wasla.
---

# Wasla Operator

Use the \`wasla\` CLI to synchronize supported assets across AI providers.

When initializing or restoring this provider, ask whether the user wants
\`user\` or \`workspace\` scope if they did not specify one. Then run:

\`\`\`bash
wasla setup ${this.name} --scope <user|workspace>
\`\`\`

For continuous synchronization while the provider is open, run:

\`\`\`bash
wasla watch --scope <user|workspace>
\`\`\`

To inspect the current registry, run:

\`\`\`bash
wasla status --scope <user|workspace>
\`\`\`
`;
    if ((await fileExists(skillPath)) && (await readText(skillPath)) === content) return;
    await writeText(skillPath, content);
  }

  mcpFromNative(server: Record<string, unknown>): Record<string, unknown> {
    return server;
  }

  mcpToNative(server: Record<string, unknown>): Record<string, unknown> {
    return server;
  }

  abstract writeStub(asset: Asset, content: string, targetPath: string): Promise<void>;
  abstract installSkill(): Promise<void>;
  abstract getRootConfigAppend(): string | null;
}
