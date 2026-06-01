import { AssetLocation } from '#core/types.js';
import { singleFileAsset } from '../primitives/storage.js';

export function cursorContextLocations(path?: string): AssetLocation[] {
  return path
    ? [
        singleFileAsset({
          id: 'context',
          type: 'context',
          path,
          format: 'md',
          name: 'context',
          relativePath: 'AGENTS.md',
        }),
      ]
    : [];
}
