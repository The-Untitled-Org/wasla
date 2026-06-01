import { AssetLocation, DiscoveredFile } from '#core/types.js';
import { fileExists, readJSON } from '#shared/fs.js';
import { singleFileAsset } from '../primitives/storage.js';
import { dirname, join, relative } from 'path';
import { stat } from 'fs/promises';

async function contextFileNames(settingsPath: string): Promise<string[]> {
  if (!(await fileExists(settingsPath))) return ['GEMINI.md'];
  const settings = await readJSON<Record<string, unknown>>(settingsPath);
  const context = settings.context;
  if (!context || typeof context !== 'object' || Array.isArray(context)) return ['GEMINI.md'];
  const fileName = (context as Record<string, unknown>).fileName;
  if (typeof fileName === 'string') return [fileName];
  if (Array.isArray(fileName) && fileName.every((value) => typeof value === 'string')) {
    return fileName;
  }
  return ['GEMINI.md'];
}

async function existingContextFiles(directory: string, settingsPath: string): Promise<string[]> {
  const files: string[] = [];
  for (const fileName of await contextFileNames(settingsPath)) {
    const path = join(directory, fileName);
    if (await fileExists(path)) files.push(path);
  }
  return files;
}

export function geminiContextLocations(
  scope: 'user' | 'workspace',
  preferredPath: string,
  settingsPath: string
): AssetLocation[] {
  const contextRoot = dirname(preferredPath);
  const preferred = singleFileAsset({
    id: scope === 'workspace' ? 'project-root-context' : 'global-context',
    type: 'context',
    path: preferredPath,
    format: 'md',
    name: 'context',
    relativePath: 'GEMINI.md',
  });
  const writeConfiguredContext: AssetLocation['writeAsset'] = async (asset) => {
    const [fileName] = await contextFileNames(settingsPath);
    return singleFileAsset({
      id: preferred.id,
      type: 'context',
      path: join(contextRoot, fileName),
      format: 'md',
      name: 'context',
      relativePath: fileName,
    }).writeAsset(asset);
  };
  if (scope === 'user') {
    return [
      {
        ...preferred,
        watchPaths: [contextRoot],
        async discover(context): Promise<DiscoveredFile[]> {
          const paths = await existingContextFiles(contextRoot, settingsPath);
          return Promise.all(
            paths.map(async (path) => ({
              path,
              relativePath: relative(contextRoot, path),
              isStub: context.isStub({ path }, 'context'),
              tool: context.tool,
              type: 'context' as const,
              name: 'context',
              modifiedAt: (await stat(path)).mtimeMs,
              patternId: 'global-context',
            }))
          );
        },
        writeAsset: writeConfiguredContext,
      },
    ];
  }
  const projectRoot = contextRoot;

  return [
    {
      ...preferred,
      watchPaths: [projectRoot],
      async discover(context): Promise<DiscoveredFile[]> {
        const paths = await existingContextFiles(projectRoot, settingsPath);
        return Promise.all(
          paths.map(async (path) => ({
            path,
            relativePath: relative(projectRoot, path),
            isStub: context.isStub({ path }, 'context'),
            tool: context.tool,
            type: 'context' as const,
            name: 'context',
            modifiedAt: (await stat(path)).mtimeMs,
            patternId: 'hierarchical-context',
          }))
        );
      },
      writeAsset: writeConfiguredContext,
    },
  ];
}
