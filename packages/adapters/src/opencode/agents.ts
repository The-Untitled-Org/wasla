import { AssetLocation } from '#core/types.js';
import { directoryAssets, jsonMapAssets } from '../primitives/storage.js';

export function openCodeAgentLocations(directory: string, configPath: string): AssetLocation[] {
  return [
    directoryAssets({ id: 'agents', type: 'agent', directory, format: 'md' }),
    jsonMapAssets({
      id: 'config-agents',
      type: 'agent',
      path: configPath,
      format: 'json',
      keyPath: 'agent',
      read: true,
      write: false,
      priority: 10,
    }),
  ];
}
