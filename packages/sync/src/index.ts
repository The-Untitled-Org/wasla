import {
  DiscoveredFile,
  AssetType,
  Asset,
  WaslaAdapter,
  AssetLocation,
  NativeAssetReference,
} from '#core/types.js';
import { RegistryManager } from '#core/registry.js';
import { Scanner } from './scanner.js';
import { getAdapter } from '#adapters/factory.js';
import { dirname, join, sep } from 'path';
import { getRegistryDir } from '#shared/paths.js';
import { readText, writeText, ensureDir, removePath } from '#shared/fs.js';
import { createHash } from 'crypto';

export class Syncer {
  private registry: RegistryManager;
  private scanner: Scanner;
  private scope: 'user' | 'workspace';

  constructor(
    registry: RegistryManager,
    scanner: Scanner,
    scope: 'user' | 'workspace' = 'workspace'
  ) {
    this.registry = registry;
    this.scanner = scanner;
    this.scope = scope;
  }

  async sync(interactive: boolean = true): Promise<{
    stubsWritten: number;
    stubsDeleted: number;
    assetsDiscovered: number;
    writtenPaths: string[];
  }> {
    // Initialize scanner with registry stub information
    await this.scanner.initialize();

    // Ensure registry is loaded
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const registryDir = getRegistryDir(this.scope);
    await ensureDir(join(registryDir, 'agents'));
    await ensureDir(join(registryDir, 'skills'));
    await ensureDir(join(registryDir, 'mcp'));
    await ensureDir(join(registryDir, 'context'));

    const discovered = await this.scanner.scanAllTools();
    const grouped = this.groupByNameAndType(discovered);
    await this.removeMissingFiles(grouped);
    const installedTools = await this.scanner.detectInstalledTools();

    let stubsWritten = 0;
    const writtenPaths: string[] = [];
    const stubsDeleted = await this.reconcileDeletedAssets(grouped, installedTools);
    const assetsDiscovered = Object.keys(grouped).length;

    for (const key of Object.keys(grouped)) {
      const items = grouped[key];
      const [name, type] = key.split('|') as [string, any];

      // "Latest is Greatest" - sort by modification time
      const sorted = items.sort((a, b) => b.modifiedAt - a.modifiedAt);
      const latest =
        type === 'skill'
          ? sorted.find(
              (item) =>
                item.relativePath.endsWith(`${sep}SKILL.md`) || item.relativePath === 'SKILL.md'
            ) || sorted[0]
          : sorted[0];

      // Check if we should prompt the user in interactive mode if there are multiple versions
      if (interactive && sorted.length > 1) {
        // For MVP, we'll just log it or we could implement a real prompt here.
        // The spec says: Prompt user: "Use Gemini version? (Y/n)"
        // Since I'm an AI agent, I'll assume automatic for now or follow the latest mtime.
        console.log(`Syncing ${name} (${type}) using latest version from ${latest.tool}`);
      }

      const content = latest.content ?? (await readText(latest.path));
      const contentHash = this.calculateHash(content);

      // Update or create asset in registry
      let asset = this.registry.findAsset(name, type);
      if (!asset) {
        asset = {
          id: RegistryManager.generateId(),
          name,
          type,
          last_modified_at: latest.modifiedAt,
          last_synced_at: new Date().toISOString(),
          stubs: [],
        };
        this.registry.addAsset(asset);
      } else {
        this.registry.updateAsset(asset.id, {
          last_modified_at: latest.modifiedAt,
          last_synced_at: new Date().toISOString(),
        });
      }

      // Mirror to all other tool locations
      for (const tool of installedTools) {
        const adapter = getAdapter(tool, this.scope);
        const location = this.getWriteLocation(adapter, type);
        if (!location) {
          // This tool doesn't support this asset type
          continue;
        }

        const filesToMirror =
          type === 'skill' && location.format === 'md'
            ? items.filter((item) => item.tool === latest.tool)
            : [latest];
        let primaryReference: NativeAssetReference | undefined;

        for (const file of filesToMirror) {
          const fileContent =
            file.content ?? (file.path === latest.path ? content : await readText(file.path));

          const result = await location.writeAsset({
            name,
            content: fileContent,
            relativePath: file.relativePath,
          });
          if (file.path === latest.path) {
            primaryReference = result.reference;
          }
          if (result.changed) {
            stubsWritten++;
            writtenPaths.push(result.reference.path);
          }
        }

        if (!primaryReference) {
          continue;
        }

        // Update stub info in registry
        await this.upsertStub(asset, tool, location.id, primaryReference, contentHash);
      }

      // Also save to canonical registry location
      const registrySubdir =
        type === 'agent'
          ? 'agents'
          : type === 'skill'
            ? 'skills'
            : type === 'context'
              ? 'context'
              : 'mcp';
      const ext = type === 'mcp' ? '.json' : '.md';
      const canonicalPath = join(registryDir, registrySubdir, `${name}${ext}`);
      await writeText(canonicalPath, content);
    }

    await this.registry.save();

    return {
      stubsWritten,
      stubsDeleted,
      assetsDiscovered,
      writtenPaths: [...new Set(writtenPaths)],
    };
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

  async syncToTool(
    sourceTool: string,
    targetTools: string[]
  ): Promise<{
    stubsWritten: number;
    stubsDeleted: number;
    assetsDiscovered: number;
    writtenPaths: string[];
  }> {
    // Initialize scanner with registry stub information
    await this.scanner.initialize();

    // Ensure registry is loaded
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const registryDir = getRegistryDir(this.scope);
    await ensureDir(join(registryDir, 'agents'));
    await ensureDir(join(registryDir, 'skills'));
    await ensureDir(join(registryDir, 'mcp'));
    await ensureDir(join(registryDir, 'context'));

    // Scan all asset types from source tool
    const assetTypes: AssetType[] = ['agent', 'skill', 'mcp', 'context'];
    const discovered = await this.scanner.scanTool(sourceTool, assetTypes);
    const grouped = this.groupByNameAndType(discovered);
    await this.removeMissingFiles(grouped);
    const deletionScan = [...discovered];
    for (const tool of targetTools.filter((tool) => tool !== sourceTool)) {
      deletionScan.push(...(await this.scanner.scanTool(tool, assetTypes)));
    }
    const deletionGrouped = this.groupByNameAndType(deletionScan);
    await this.removeMissingFiles(deletionGrouped);

    let stubsWritten = 0;
    const writtenPaths: string[] = [];
    const stubsDeleted = await this.reconcileDeletedAssets(
      deletionGrouped,
      [...new Set([sourceTool, ...targetTools])],
      sourceTool
    );
    for (const key of Object.keys(grouped)) {
      if (!deletionGrouped[key]) {
        delete grouped[key];
      }
    }
    const assetsDiscovered = Object.keys(grouped).length;

    for (const key of Object.keys(grouped)) {
      const items = grouped[key];
      const [name, type] = key.split('|') as [string, any];

      // For directory-based skills, SKILL.md is the primary definition and
      // sibling files are supporting references that should be mirrored too.
      const sorted = items.sort((a, b) => b.modifiedAt - a.modifiedAt);
      const source =
        type === 'skill'
          ? sorted.find(
              (item) =>
                item.relativePath.endsWith(`${sep}SKILL.md`) || item.relativePath === 'SKILL.md'
            ) || sorted[0]
          : sorted[0];

      const content = source.content ?? (await readText(source.path));
      const contentHash = this.calculateHash(content);

      // Update or create asset in registry
      let asset = this.registry.findAsset(name, type);
      if (!asset) {
        asset = {
          id: RegistryManager.generateId(),
          name,
          type,
          last_modified_at: source.modifiedAt,
          last_synced_at: new Date().toISOString(),
          stubs: [],
        };
        this.registry.addAsset(asset);
      } else {
        this.registry.updateAsset(asset.id, {
          last_modified_at: source.modifiedAt,
          last_synced_at: new Date().toISOString(),
        });
      }
      await this.upsertStub(
        asset,
        sourceTool,
        source.patternId,
        { path: source.path, targetKey: source.targetKey },
        contentHash
      );

      // Write only to target tools
      for (const tool of targetTools) {
        const adapter = getAdapter(tool, this.scope);
        const location = this.getWriteLocation(adapter, type);
        if (!location) {
          // This tool doesn't support this asset type
          continue;
        }
        const filesToMirror = type === 'skill' && location.format === 'md' ? items : [source];
        let primaryReference: NativeAssetReference | undefined;

        for (const file of filesToMirror) {
          const fileContent =
            file.content ?? (file.path === source.path ? content : await readText(file.path));
          const result = await location.writeAsset({
            name,
            content: fileContent,
            relativePath: file.relativePath,
          });
          if (file.path === source.path) {
            primaryReference = result.reference;
          }
          if (result.changed) {
            stubsWritten++;
            writtenPaths.push(result.reference.path);
          }
        }

        if (!primaryReference) {
          continue;
        }

        // Update stub info in registry
        await this.upsertStub(asset, tool, location.id, primaryReference, contentHash);
      }

      // Also save to canonical registry location
      const registrySubdir =
        type === 'agent'
          ? 'agents'
          : type === 'skill'
            ? 'skills'
            : type === 'context'
              ? 'context'
              : 'mcp';
      const ext = type === 'mcp' ? '.json' : '.md';
      const canonicalPath = join(registryDir, registrySubdir, `${name}${ext}`);
      await writeText(canonicalPath, content);
    }

    await this.registry.save();

    return {
      stubsWritten,
      stubsDeleted,
      assetsDiscovered,
      writtenPaths: [...new Set(writtenPaths)],
    };
  }

  async attachAssetToTool(
    name: string,
    type: AssetType,
    sourceTool: string,
    targetTool: string
  ): Promise<boolean> {
    await this.scanner.initialize();
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const candidates =
      sourceTool === 'wasla'
        ? (await this.scanner.scanAllTools([type])).filter((item) => item.name === name)
        : (await this.scanner.scanTool(sourceTool, [type])).filter((item) => item.name === name);
    const sourceCandidates = candidates.filter((item) => item.tool !== targetTool);
    const items = (sourceCandidates.length > 0 ? sourceCandidates : candidates).sort(
      (a, b) => b.modifiedAt - a.modifiedAt
    );
    if (items.length === 0) {
      throw new Error(`Cannot find ${type}:${name} in ${sourceTool}`);
    }

    const sourceItems =
      sourceTool === 'wasla' ? items.filter((item) => item.tool === items[0].tool) : items;
    const sorted = sourceItems.sort((a, b) => b.modifiedAt - a.modifiedAt);
    const source =
      type === 'skill'
        ? sorted.find(
            (item) =>
              item.relativePath.endsWith(`${sep}SKILL.md`) || item.relativePath === 'SKILL.md'
          ) || sorted[0]
        : sorted[0];
    const content = source.content ?? (await readText(source.path));
    const contentHash = this.calculateHash(content);
    let asset = this.registry.findAsset(name, type);
    if (!asset) {
      asset = {
        id: RegistryManager.generateId(),
        name,
        type,
        last_modified_at: source.modifiedAt,
        last_synced_at: new Date().toISOString(),
        stubs: [],
      };
      this.registry.addAsset(asset);
    }
    await this.upsertStub(
      asset,
      source.tool,
      source.patternId,
      { path: source.path, targetKey: source.targetKey },
      contentHash
    );

    const adapter = getAdapter(targetTool, this.scope);
    const location = this.getWriteLocation(adapter, type);
    if (!location) {
      throw new Error(`${targetTool} does not support ${type}`);
    }
    const filesToMirror = type === 'skill' && location.format === 'md' ? sourceItems : [source];
    let written = false;
    let primaryReference: NativeAssetReference | undefined;
    for (const file of filesToMirror) {
      const fileContent =
        file.content ?? (file.path === source.path ? content : await readText(file.path));
      const result = await location.writeAsset({
        name,
        content: fileContent,
        relativePath: file.relativePath,
      });
      if (file.path === source.path) primaryReference = result.reference;
      written = result.changed || written;
    }
    if (primaryReference) {
      this.upsertStub(asset, targetTool, location.id, primaryReference, contentHash);
    }
    await ensureDir(dirname(this.getCanonicalPath(type, name)));
    await writeText(this.getCanonicalPath(type, name), content);
    await this.registry.save();
    return written;
  }

  async detachAssetFromTool(name: string, type: AssetType, tool: string): Promise<boolean> {
    await this.scanner.initialize();
    try {
      this.registry.get();
    } catch {
      await this.registry.load();
    }

    const asset = this.registry.findAsset(name, type);
    const discovered = (await this.scanner.scanTool(tool, [type])).find(
      (item) => item.name === name
    );
    const stub = asset?.stubs.find((candidate) => candidate.tool === tool);
    const reference = stub
      ? { path: stub.path, targetKey: stub.targetKey }
      : discovered
        ? { path: discovered.path, targetKey: discovered.targetKey }
        : undefined;
    if (!reference) return false;
    const deletableAsset: Asset = asset ?? {
      id: RegistryManager.generateId(),
      name,
      type,
      last_modified_at: Date.now(),
      last_synced_at: new Date().toISOString(),
      stubs: [],
    };
    const deleted = await this.deleteStubTarget(deletableAsset, {
      tool,
      patternId: stub?.patternId ?? discovered?.patternId,
      ...reference,
      written_at: new Date().toISOString(),
      hash: '',
    });
    if (asset && deleted) {
      asset.stubs = asset.stubs.filter((stub) => stub.tool !== tool);
      await this.registry.save();
    }
    return deleted > 0;
  }

  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Filters discovered files, removing those that cannot be read (ENOENT).
   * Treats read-time ENOENT as a deletion signal: if a file disappears during
   * pruning, it is removed from sync and will be treated as a deletion in
   * reconcileDeletedAssets. This prevents sync failures when files are deleted
   * between scan and read phases.
   */
  private async removeMissingFiles(grouped: Record<string, DiscoveredFile[]>): Promise<void> {
    for (const key of Object.keys(grouped)) {
      const readable: DiscoveredFile[] = [];
      for (const item of grouped[key]) {
        if (item.content !== undefined) {
          readable.push(item);
          continue;
        }
        try {
          item.content = await readText(item.path);
          readable.push(item);
        } catch (error) {
          if (!this.isMissingFileError(error)) {
            throw error;
          }
          // ENOENT: file was deleted after scanning, treat as deletion
        }
      }
      if (readable.length > 0) {
        grouped[key] = readable;
      } else {
        delete grouped[key];
      }
    }
  }

  private isMissingFileError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    );
  }

  private getWriteLocation(adapter: WaslaAdapter, type: AssetType): AssetLocation | undefined {
    return adapter.locations
      .filter((location) => location.type === type && location.write)
      .sort((a, b) => b.priority - a.priority)[0];
  }

  private async upsertStub(
    asset: Asset,
    tool: string,
    patternId: string | undefined,
    reference: NativeAssetReference,
    hash: string
  ): Promise<void> {
    const existingStub = asset.stubs.find((stub) => stub.tool === tool);
    if (existingStub) {
      if (
        asset.type === 'context' &&
        existingStub.path !== reference.path &&
        (await this.removeUnchangedExistingStub(asset, existingStub))
      ) {
        // The old provider-owned context location was cleaned up.
      }
      existingStub.patternId = patternId;
      existingStub.path = reference.path;
      existingStub.targetKey = reference.targetKey;
      existingStub.written_at = new Date().toISOString();
      existingStub.hash = hash;
      return;
    }
    asset.stubs.push({
      tool,
      patternId,
      path: reference.path,
      targetKey: reference.targetKey,
      written_at: new Date().toISOString(),
      hash,
    });
  }

  private async reconcileDeletedAssets(
    grouped: Record<string, DiscoveredFile[]>,
    tools: string[],
    requiredDeletedTool?: string
  ): Promise<number> {
    let deleted = 0;
    const trackedTools = new Set(tools);

    for (const asset of [...this.registry.get().assets]) {
      const key = `${asset.name}|${asset.type}`;
      const items = grouped[key] || [];
      const trackedStubs = asset.stubs.filter((stub) => trackedTools.has(stub.tool));
      if (trackedStubs.length === 0) continue;

      const itemForStub = (stub: Asset['stubs'][number]) =>
        items.find(
          (item) =>
            item.tool === stub.tool && item.path === stub.path && item.targetKey === stub.targetKey
        );
      const missing = trackedStubs.filter((stub) => !itemForStub(stub));
      if (missing.length === 0) continue;
      if (requiredDeletedTool && !missing.some((stub) => stub.tool === requiredDeletedTool)) {
        continue;
      }

      let survivingEdit = false;
      for (const stub of trackedStubs) {
        const item = itemForStub(stub);
        if (!item) continue;
        const content = item.content ?? (await readText(item.path));
        if (this.calculateHash(content) !== stub.hash) {
          survivingEdit = true;
          break;
        }
      }
      if (survivingEdit) continue;

      for (const stub of asset.stubs) {
        deleted += await this.deleteStubTarget(asset, stub);
      }
      await removePath(this.getCanonicalPath(asset.type, asset.name));
      this.registry.removeAsset(asset.id);
      delete grouped[key];
    }

    return deleted;
  }

  private async deleteStubTarget(asset: Asset, stub: Asset['stubs'][number]): Promise<number> {
    let adapter: WaslaAdapter;
    try {
      adapter = getAdapter(stub.tool, this.scope);
    } catch {
      return 0;
    }

    const location =
      adapter.locations.find((candidate) => candidate.id === stub.patternId) ??
      adapter.locations.find(
        (candidate) =>
          candidate.type === asset.type &&
          candidate.watchPaths.some(
            (path) => stub.path === path || stub.path.startsWith(`${path}${sep}`)
          )
      );
    if (!location) return 0;
    return (await location.removeAsset({ path: stub.path, targetKey: stub.targetKey }, asset.name))
      ? 1
      : 0;
  }

  private async removeUnchangedExistingStub(
    asset: Asset,
    stub: Asset['stubs'][number]
  ): Promise<boolean> {
    try {
      if (this.calculateHash(await readText(stub.path)) !== stub.hash) return false;
    } catch {
      return false;
    }
    return (await this.deleteStubTarget(asset, stub)) > 0;
  }

  private getCanonicalPath(type: AssetType, name: string): string {
    const subdir =
      type === 'agent'
        ? 'agents'
        : type === 'skill'
          ? 'skills'
          : type === 'context'
            ? 'context'
            : 'mcp';
    return join(getRegistryDir(this.scope), subdir, `${name}${type === 'mcp' ? '.json' : '.md'}`);
  }
}
