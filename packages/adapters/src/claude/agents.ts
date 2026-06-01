import { AssetLocation } from '#core/types.js';
import { directoryAssets } from '../primitives/storage.js';

export function claudeAgentLocations(directory: string): AssetLocation[] {
  return [directoryAssets({ id: 'agents', type: 'agent', directory, format: 'md' })];
}
