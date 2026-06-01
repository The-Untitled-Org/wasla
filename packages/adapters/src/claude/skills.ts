import { AssetLocation } from '#core/types.js';
import { directoryAssets } from '../primitives/storage.js';

export function claudeSkillLocations(directory: string): AssetLocation[] {
  return [
    directoryAssets({
      id: 'skills',
      type: 'skill',
      directory,
      format: 'md',
      fileName: (name) => `${name}/SKILL.md`,
      preserveRelativePaths: true,
      removeParentDirectory: true,
    }),
  ];
}
