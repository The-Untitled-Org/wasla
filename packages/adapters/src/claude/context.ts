import { AssetLocation } from '#core/types.js';
import { singleFileAsset } from '../primitives/storage.js';
import { join } from 'path';

export function claudeContextLocations(
  scope: 'user' | 'workspace',
  preferredPath: string,
  configRoot: string
): AssetLocation[] {
  const locations = [
    singleFileAsset({
      id: 'context',
      type: 'context',
      path: preferredPath,
      format: 'md',
      name: 'context',
      relativePath: 'CLAUDE.md',
    }),
  ];
  if (scope === 'workspace') {
    locations.push(
      singleFileAsset({
        id: 'legacy-nested-context',
        type: 'context',
        path: join(configRoot, 'CLAUDE.md'),
        format: 'md',
        name: 'context',
        read: true,
        write: false,
        priority: 10,
      })
    );
  }
  return locations;
}
