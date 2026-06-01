import { AssetLocation } from '#core/types.js';
import { directoryAssets } from '../primitives/storage.js';

export const cursorSkillLocations = (directory: string): AssetLocation[] => [
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
