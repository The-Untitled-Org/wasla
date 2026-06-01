import { AssetLocation } from '#core/types.js';
import { jsonMapAssets } from '../primitives/storage.js';

export function openclawMcpLocations(path?: string): AssetLocation[] {
  return path
    ? [jsonMapAssets({ id: 'mcp', type: 'mcp', path, format: 'json', keyPath: 'mcp.servers' })]
    : [];
}
