import { AssetLocation } from '#core/types.js';
import { directoryAssets } from '../primitives/storage.js';

export const githubCopilotCliAgentLocations = (directory: string): AssetLocation[] => [
  directoryAssets({ id: 'agents', type: 'agent', directory, format: 'agent.md' }),
];
