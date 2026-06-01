import { AssetLocation } from '#core/types.js';
import { directoryAssets } from '../primitives/storage.js';

export const cursorAgentLocations = (directory: string): AssetLocation[] => [
  directoryAssets({ id: 'agents', type: 'agent', directory, format: 'md' }),
];
