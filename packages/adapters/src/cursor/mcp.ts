import { AssetLocation } from '#core/types.js';
import { jsonMapAssets } from '../primitives/storage.js';

export const cursorMcpLocations = (path: string): AssetLocation[] => [
  jsonMapAssets({ id: 'mcp', type: 'mcp', path, format: 'json', keyPath: 'mcpServers' }),
];
