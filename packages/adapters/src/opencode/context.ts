import { AssetLocation } from '#core/types.js';
import { singleFileAsset } from '../primitives/storage.js';

export function openCodeContextLocations(path: string): AssetLocation[] {
  return [
    singleFileAsset({
      id: 'context',
      type: 'context',
      path,
      format: 'md',
      name: 'context',
      relativePath: 'AGENTS.md',
    }),
  ];
}
