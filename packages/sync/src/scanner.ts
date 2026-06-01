import { AssetType, DiscoveredFile, Conflict } from '#core/types.js';
import { getToolMarkers, getRegistryPath } from '#shared/paths.js';
import { readJSON } from '#shared/fs.js';
import { getAdapter } from '#adapters/factory.js';

interface Registry {
  assets: Array<{
    id: string;
    name: string;
    type: AssetType;
    stubs: Array<{
      tool: string;
      path: string;
      targetKey?: string;
    }>;
  }>;
}

export class Scanner {
  private scope: 'user' | 'workspace';
  private stubReferences: Map<string, Set<AssetType>> = new Map();

  constructor(scope: 'user' | 'workspace' = 'workspace') {
    this.scope = scope;
  }

  async initialize(): Promise<void> {
    // Load registry to know which files are stubs
    try {
      const registryPath = getRegistryPath(this.scope);
      const registry = await readJSON<Registry>(registryPath);

      for (const asset of registry.assets) {
        for (const stub of asset.stubs) {
          const key = this.referenceKey(stub.path, stub.targetKey);
          const types = this.stubReferences.get(key) || new Set<AssetType>();
          types.add(asset.type);
          this.stubReferences.set(key, types);
        }
      }
    } catch {
      // If no registry exists yet, that's fine - no stubs known yet
    }
  }

  async detectInstalledTools(): Promise<string[]> {
    const markers = getToolMarkers(this.scope);
    const installed: string[] = [];

    for (const toolName of Object.keys(markers)) {
      const adapter = getAdapter(toolName, this.scope);
      if (await adapter.isInstalled()) {
        installed.push(toolName);
      }
    }

    return installed;
  }

  async scanTool(toolName: string, assetTypes: AssetType[]): Promise<DiscoveredFile[]> {
    const markers = getToolMarkers(this.scope);
    const toolPath = markers[toolName];

    if (!toolPath) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const adapter = getAdapter(toolName, this.scope);
    const selectedTypes = new Set(assetTypes);
    const discovered: DiscoveredFile[] = [];
    for (const location of adapter.locations) {
      if (!location.read || !selectedTypes.has(location.type)) continue;
      discovered.push(
        ...(await location.discover({
          tool: toolName,
          isStub: (reference, type) => {
            const trackedTypes =
              this.stubReferences.get(this.referenceKey(reference.path, reference.targetKey)) ??
              this.stubReferences.get(this.referenceKey(reference.path));
            return trackedTypes?.has(type) ?? false;
          },
        }))
      );
    }
    return discovered;
  }

  async scanAllTools(
    assetTypes: AssetType[] = ['agent', 'skill', 'mcp', 'context']
  ): Promise<DiscoveredFile[]> {
    const tools = await this.detectInstalledTools();
    const allDiscovered: DiscoveredFile[] = [];

    for (const tool of tools) {
      const discovered = await this.scanTool(tool, assetTypes);
      allDiscovered.push(...discovered);
    }

    return allDiscovered;
  }

  async detectConflicts(discovered: DiscoveredFile[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const grouped = this.groupByNameAndType(discovered);

    for (const key of Object.keys(grouped)) {
      const items = grouped[key];
      const originals = items.filter((item) => !item.isStub);

      // Only report conflict if we have 2+ originals (not counting stubs)
      if (originals.length > 1) {
        const [name, type] = key.split('|') as [string, AssetType];
        // Sort by modification time - latest first
        const sorted = originals.sort((a, b) => b.modifiedAt - a.modifiedAt);

        conflicts.push({
          asset_name: name,
          type,
          versions: sorted.map((o) => ({
            tool: o.tool,
            path: o.path,
            modified_at: o.modifiedAt,
          })),
        });
      }
    }

    return conflicts;
  }

  private groupByNameAndType(discovered: DiscoveredFile[]): Record<string, DiscoveredFile[]> {
    const grouped: Record<string, DiscoveredFile[]> = {};

    for (const item of discovered) {
      const key = `${item.name}|${item.type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }

    return grouped;
  }

  private referenceKey(path: string, targetKey?: string): string {
    return `${path}|${targetKey ?? ''}`;
  }
}
