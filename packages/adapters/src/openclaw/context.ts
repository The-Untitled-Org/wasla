import { AssetLocation } from '#core/types.js';
import { singleFileAsset } from '../primitives/storage.js';

export const openclawContextLocations = (path: string): AssetLocation[] => [
  singleFileAsset({
    id: 'context',
    type: 'context',
    path,
    format: 'md',
    name: 'context',
    relativePath: 'AGENTS.md',
  }),
];
