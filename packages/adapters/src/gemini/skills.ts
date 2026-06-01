import { AssetLocation } from '#core/types.js';
import { directoryAssets } from '../primitives/storage.js';
import { dirname, join } from 'path';

function skillDirectory(id: string, directory: string, write: boolean): AssetLocation {
  return directoryAssets({
    id,
    type: 'skill',
    directory,
    format: 'md',
    read: true,
    write,
    priority: write ? 100 : 10,
    fileName: (name) => `${name}/SKILL.md`,
    preserveRelativePaths: true,
    removeParentDirectory: true,
  });
}

export function geminiSkillLocations(preferredDirectory: string): AssetLocation[] {
  const root = dirname(dirname(preferredDirectory));
  return [
    skillDirectory('gemini-skills', preferredDirectory, true),
    skillDirectory('agent-compatible-skills', join(root, '.agents', 'skills'), false),
  ];
}
