import { AssetLocation } from '#core/types.js';
import { expandTilde } from '#shared/paths.js';
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
    removeParentDirectory: write,
  });
}

export function openCodeSkillLocations(
  scope: 'user' | 'workspace',
  preferredDirectory: string
): AssetLocation[] {
  const base = dirname(preferredDirectory);
  const root = dirname(base);
  const compatible =
    scope === 'workspace'
      ? [
          ['claude-compatible-skills', join(root, '.claude', 'skills')],
          ['agent-compatible-skills', join(root, '.agents', 'skills')],
        ]
      : [
          ['claude-compatible-skills', expandTilde('~/.claude/skills')],
          ['agent-compatible-skills', expandTilde('~/.agents/skills')],
        ];
  return [
    skillDirectory('skills', preferredDirectory, true),
    ...compatible.map(([id, directory]) => skillDirectory(id, directory, false)),
  ];
}
