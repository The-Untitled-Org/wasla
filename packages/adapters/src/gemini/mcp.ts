import { AssetLocation } from '#core/types.js';
import { jsonMapAssets } from '../primitives/storage.js';

export function geminiMcpLocations(
  settingsPath: string,
  fromNative: (server: Record<string, unknown>) => Record<string, unknown>
): AssetLocation[] {
  return [
    jsonMapAssets({
      id: 'settings-mcp-servers',
      type: 'mcp',
      path: settingsPath,
      format: 'json',
      keyPath: 'mcpServers',
      fromNative,
    }),
  ];
}
