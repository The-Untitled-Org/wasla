// Asset types
export type AssetType = 'agent' | 'skill' | 'mcp' | 'context';
export type AssetFormat = 'md' | 'yaml' | 'json' | 'mdc' | 'agent.md' | 'instructions.md';

export interface Asset {
  id: string; // UUID v4
  name: string;
  type: AssetType;
  last_modified_at: number; // Unix timestamp
  last_synced_at: string; // ISO 8601
  stubs: Stub[];
}

export interface Stub {
  tool: string;
  patternId?: string;
  path: string;
  targetKey?: string;
  written_at: string; // ISO 8601
  hash: string; // To detect if mirrored content changed
}

export interface Conflict {
  asset_name: string;
  type: AssetType;
  versions: {
    tool: string;
    path: string;
    modified_at: number;
  }[];
  resolved_tool?: string;
}

export interface Registry {
  assets: Asset[];
  conflicts: Conflict[];
  config: {
    scope: 'user' | 'workspace';
    version: string;
  };
}

// Adapter interface
export interface WaslaAdapter {
  name: string;
  displayName: string;

  paths: {
    agent?: string;
    skill?: string;
    mcp?: string;
    context?: string;
  };

  mcpKey: string;
  contextFile: string;
  skillDirs: string[];

  formats: {
    agent?: AssetFormat;
    skill?: AssetFormat;
    mcp?: AssetFormat;
    context?: AssetFormat;
  };

  locations: AssetLocation[];

  isInstalled(): Promise<boolean>;
  provision(): Promise<void>;
  mcpFromNative(server: Record<string, unknown>): Record<string, unknown>;
  mcpToNative(server: Record<string, unknown>): Record<string, unknown>;
  writeStub(asset: Asset, content: string, targetPath: string): Promise<void>;
  installSkill(): Promise<void>;
  getRootConfigAppend(): string | null;
}

// Scanner types
export interface DiscoveredFile {
  path: string; // Full absolute path
  relativePath: string; // Relative path within type dir (e.g., "wasla/SKILL.md" for skills)
  isStub: boolean;
  tool: string;
  type: AssetType;
  name: string; // Asset name extracted from relative path
  modifiedAt: number; // Unix timestamp in ms
  content?: string; // Pre-extracted content for assets embedded in structured config files
  patternId?: string;
  targetKey?: string;
}

export interface NativeAssetReference {
  path: string;
  targetKey?: string;
}

export interface AssetLocationContext {
  tool: string;
  isStub(reference: NativeAssetReference, type: AssetType): boolean;
}

export interface AssetLocationWrite {
  name: string;
  content: string;
  relativePath: string;
}

export interface AssetLocationWriteResult {
  changed: boolean;
  reference: NativeAssetReference;
}

export interface AssetLocation {
  id: string;
  type: AssetType;
  format: AssetFormat;
  read: boolean;
  write: boolean;
  priority: number;
  watchPaths: string[];
  provision?(): Promise<void>;
  discover(context: AssetLocationContext): Promise<DiscoveredFile[]>;
  writeAsset(asset: AssetLocationWrite): Promise<AssetLocationWriteResult>;
  removeAsset(reference: NativeAssetReference, name: string): Promise<boolean>;
}

// CLI types
export interface SyncOptions {
  interactive?: boolean;
}
