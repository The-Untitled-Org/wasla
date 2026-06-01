import { AssetLocation } from '#core/types.js';
import { jsonMapAssets } from '../primitives/storage.js';

export function openCodeMcpLocations(
  path: string,
  fromNative: (server: Record<string, unknown>) => Record<string, unknown>,
  toNative: (server: Record<string, unknown>) => Record<string, unknown>
): AssetLocation[] {
  return [
    jsonMapAssets({
      id: 'mcp',
      type: 'mcp',
      path,
      format: 'json',
      keyPath: 'mcp',
      fromNative,
      toNative,
    }),
  ];
}
