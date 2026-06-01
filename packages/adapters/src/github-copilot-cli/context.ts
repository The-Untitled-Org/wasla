import { AssetLocation } from '#core/types.js';
import { singleFileAsset } from '../primitives/storage.js';

export const githubCopilotCliContextLocations = (path: string): AssetLocation[] => [
  singleFileAsset({
    id: 'context',
    type: 'context',
    path,
    format: 'md',
    name: 'context',
    relativePath: '.github/copilot-instructions.md',
  }),
];
