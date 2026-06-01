import { AssetLocation } from '#core/types.js';
import { jsonMapAssets } from '../primitives/storage.js';

export function claudeMcpLocations(path: string): AssetLocation[] {
  return [jsonMapAssets({ id: 'mcp', type: 'mcp', path, format: 'json', keyPath: 'mcpServers' })];
}
