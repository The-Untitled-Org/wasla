import {
  AssetFormat,
  AssetLocation,
  AssetLocationContext,
  AssetLocationWrite,
  AssetLocationWriteResult,
  AssetType,
  DiscoveredFile,
  NativeAssetReference,
} from '#core/types.js';
import {
  ensureDir,
  fileExists,
  isDirectory,
  readJSON,
  readText,
  removePath,
  writeJSON,
  writeText,
} from '#shared/fs.js';
import { dirname, join, relative } from 'path';
import { readdir, stat } from 'fs/promises';

interface CommonOptions {
  id: string;
  type: AssetType;
  format: AssetFormat;
  read?: boolean;
  write?: boolean;
  priority?: number;
}

interface DirectoryAssetsOptions extends CommonOptions {
  directory: string;
  fileName?: (name: string) => string;
  nameFromRelativePath?: (relativePath: string) => string;
  preserveRelativePaths?: boolean;
  removeParentDirectory?: boolean;
}

interface SingleFileAssetOptions extends CommonOptions {
  path: string;
  name: string;
  relativePath?: string;
}

interface JsonMapAssetsOptions extends CommonOptions {
  path: string;
  keyPath: string;
  fromNative?: (value: Record<string, unknown>) => Record<string, unknown>;
  toNative?: (value: Record<string, unknown>) => Record<string, unknown>;
}

interface MarkdownSectionsOptions extends CommonOptions {
  path: string;
  parentHeading: string;
  headingLevel?: number;
  fromNative?: (name: string, content: string) => string;
  toNative?: (asset: AssetLocationWrite) => string;
}

function withDefaults<T extends CommonOptions>(options: T) {
  return {
    read: true,
    write: true,
    priority: 100,
    ...options,
  };
}

async function recursivelyFindFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await recursivelyFindFiles(path)));
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  } catch {
    return [];
  }
  return files;
}

function defaultNameFromRelativePath(relativePath: string, format: AssetFormat): string {
  const parts = relativePath.split(/[/\\]/);
  if (parts.length > 1) return parts[0];
  const suffix = `.${format}`;
  return parts[0].endsWith(suffix) ? parts[0].slice(0, -suffix.length) : parts[0];
}

async function writeIfChanged(path: string, content: string): Promise<boolean> {
  if ((await fileExists(path)) && (await readText(path)) === content) return false;
  await ensureDir(dirname(path));
  await writeText(path, content);
  return true;
}

function makeDiscoveredFile(
  context: AssetLocationContext,
  location: CommonOptions,
  reference: NativeAssetReference,
  relativePath: string,
  name: string,
  modifiedAt: number,
  content?: string
): DiscoveredFile {
  return {
    path: reference.path,
    relativePath,
    isStub: context.isStub(reference, location.type),
    tool: context.tool,
    type: location.type,
    name,
    modifiedAt,
    content,
    patternId: location.id,
    targetKey: reference.targetKey,
  };
}

export function directoryAssets(rawOptions: DirectoryAssetsOptions): AssetLocation {
  const options = withDefaults(rawOptions);
  const fileName = options.fileName ?? ((name: string) => `${name}.${options.format}`);
  const nameFromRelativePath =
    options.nameFromRelativePath ??
    ((relativePath: string) => defaultNameFromRelativePath(relativePath, options.format));

  return {
    ...options,
    watchPaths: [options.directory],
    async provision(): Promise<void> {
      await ensureDir(options.directory);
    },
    async discover(context): Promise<DiscoveredFile[]> {
      if (!options.read || !(await isDirectory(options.directory))) return [];
      const discovered: DiscoveredFile[] = [];
      for (const path of await recursivelyFindFiles(options.directory)) {
        const relativePath = relative(options.directory, path);
        const name = nameFromRelativePath(relativePath);
        if (name.toLowerCase() === 'wasla') continue;
        discovered.push(
          makeDiscoveredFile(
            context,
            options,
            { path },
            relativePath,
            name,
            (await stat(path)).mtimeMs
          )
        );
      }
      return discovered;
    },
    async writeAsset(asset): Promise<AssetLocationWriteResult> {
      const path =
        options.preserveRelativePaths && dirname(asset.relativePath) !== '.'
          ? join(options.directory, asset.relativePath)
          : join(options.directory, fileName(asset.name));
      return { changed: await writeIfChanged(path, asset.content), reference: { path } };
    },
    async removeAsset(reference): Promise<boolean> {
      if (!(await fileExists(reference.path))) return false;
      await removePath(options.removeParentDirectory ? dirname(reference.path) : reference.path);
      return true;
    },
  };
}

export function singleFileAsset(rawOptions: SingleFileAssetOptions): AssetLocation {
  const options = withDefaults(rawOptions);
  return {
    ...options,
    watchPaths: [options.path],
    async discover(context): Promise<DiscoveredFile[]> {
      if (!options.read || !(await fileExists(options.path))) return [];
      return [
        makeDiscoveredFile(
          context,
          options,
          { path: options.path },
          options.relativePath ?? options.name,
          options.name,
          (await stat(options.path)).mtimeMs
        ),
      ];
    },
    async writeAsset(asset): Promise<AssetLocationWriteResult> {
      return {
        changed: await writeIfChanged(options.path, asset.content),
        reference: { path: options.path },
      };
    },
    async removeAsset(reference): Promise<boolean> {
      if (!(await fileExists(reference.path))) return false;
      await removePath(reference.path);
      return true;
    },
  };
}

function readNestedRecord(
  config: Record<string, unknown>,
  keyPath: string
): Record<string, unknown> {
  let value: unknown = config;
  for (const key of keyPath.split('.')) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    value = (value as Record<string, unknown>)[key];
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function ensureNestedRecord(
  config: Record<string, unknown>,
  keyPath: string
): Record<string, unknown> {
  let node = config;
  for (const key of keyPath.split('.')) {
    const child = node[key];
    if (!child || typeof child !== 'object' || Array.isArray(child)) node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  return node;
}

export function jsonMapAssets(rawOptions: JsonMapAssetsOptions): AssetLocation {
  const options = withDefaults(rawOptions);
  return {
    ...options,
    watchPaths: [options.path],
    async discover(context): Promise<DiscoveredFile[]> {
      if (!options.read || !(await fileExists(options.path))) return [];
      const servers = readNestedRecord(
        await readJSON<Record<string, unknown>>(options.path),
        options.keyPath
      );
      const modifiedAt = (await stat(options.path)).mtimeMs;
      return Object.entries(servers).map(([name, value]) => {
        const native = value as Record<string, unknown>;
        const content = JSON.stringify(
          options.fromNative ? options.fromNative(native) : native,
          null,
          2
        );
        return makeDiscoveredFile(
          context,
          options,
          { path: options.path, targetKey: name },
          `${name}.json`,
          name,
          modifiedAt,
          content
        );
      });
    },
    async writeAsset(asset): Promise<AssetLocationWriteResult> {
      const config = (await fileExists(options.path))
        ? await readJSON<Record<string, unknown>>(options.path)
        : {};
      const values = ensureNestedRecord(config, options.keyPath);
      const portable = JSON.parse(asset.content) as Record<string, unknown>;
      const native = options.toNative ? options.toNative(portable) : portable;
      const changed = JSON.stringify(values[asset.name]) !== JSON.stringify(native);
      if (changed) {
        values[asset.name] = native;
        await ensureDir(dirname(options.path));
        await writeJSON(options.path, config);
      }
      return { changed, reference: { path: options.path, targetKey: asset.name } };
    },
    async removeAsset(reference, name): Promise<boolean> {
      if (!(await fileExists(reference.path))) return false;
      const config = await readJSON<Record<string, unknown>>(reference.path);
      const values = readNestedRecord(config, options.keyPath);
      const targetKey = reference.targetKey ?? name;
      if (!(targetKey in values)) return false;
      delete values[targetKey];
      await writeJSON(reference.path, config);
      return true;
    },
  };
}

function sectionExpression(headingLevel: number): RegExp {
  return new RegExp(`^${'#'.repeat(headingLevel)} (.+)$`, 'gm');
}

export function markdownSections(rawOptions: MarkdownSectionsOptions): AssetLocation {
  const options = withDefaults(rawOptions);
  const headingLevel = options.headingLevel ?? 3;
  const parentLevel = options.parentHeading.match(/^#+/)?.[0].length ?? headingLevel - 1;

  function splitDocument(content: string): { prefix: string; body: string; suffix: string } {
    const parentIndex = content.indexOf(options.parentHeading);
    if (parentIndex < 0) return { prefix: content, body: '', suffix: '' };
    const bodyStart = parentIndex + options.parentHeading.length;
    const followingHeading = new RegExp(`^#{1,${parentLevel}} .+$`, 'm').exec(
      content.slice(bodyStart)
    );
    const bodyEnd = followingHeading ? bodyStart + followingHeading.index : content.length;
    return {
      prefix: content.slice(0, parentIndex),
      body: content.slice(bodyStart, bodyEnd),
      suffix: content.slice(bodyEnd),
    };
  }

  function parse(content: string): Array<{ name: string; content: string }> {
    const { body } = splitDocument(content);
    const expression = sectionExpression(headingLevel);
    const matches = [...body.matchAll(expression)];
    return matches.map((match, index) => ({
      name: match[1].trim(),
      content: body.slice(match.index!, matches[index + 1]?.index ?? body.length).trimEnd(),
    }));
  }

  return {
    ...options,
    watchPaths: [options.path],
    async discover(context): Promise<DiscoveredFile[]> {
      if (!options.read || !(await fileExists(options.path))) return [];
      const modifiedAt = (await stat(options.path)).mtimeMs;
      return parse(await readText(options.path)).map((section) =>
        makeDiscoveredFile(
          context,
          options,
          { path: options.path, targetKey: section.name },
          section.name,
          section.name,
          modifiedAt,
          options.fromNative ? options.fromNative(section.name, section.content) : section.content
        )
      );
    },
    async writeAsset(asset): Promise<AssetLocationWriteResult> {
      const existing = (await fileExists(options.path)) ? await readText(options.path) : '';
      const sections = parse(existing);
      const rendered = options.toNative
        ? options.toNative(asset)
        : `${'#'.repeat(headingLevel)} ${asset.name}\n${asset.content.trimStart()}`;
      const nextSections = sections.filter((section) => section.name !== asset.name);
      nextSections.push({ name: asset.name, content: rendered });
      const { prefix, suffix } = splitDocument(existing);
      const next = `${prefix}${options.parentHeading}\n\n${nextSections.map((section) => section.content).join('\n\n')}\n${suffix}`;
      return {
        changed: await writeIfChanged(options.path, next),
        reference: { path: options.path, targetKey: asset.name },
      };
    },
    async removeAsset(reference, name): Promise<boolean> {
      if (!(await fileExists(reference.path))) return false;
      const existing = await readText(reference.path);
      const sections = parse(existing);
      const targetKey = reference.targetKey ?? name;
      if (!sections.some((section) => section.name === targetKey)) return false;
      const { prefix, suffix } = splitDocument(existing);
      const remaining = sections.filter((section) => section.name !== targetKey);
      await writeText(
        reference.path,
        `${prefix}${options.parentHeading}\n\n${remaining.map((section) => section.content).join('\n\n')}\n${suffix}`
      );
      return true;
    },
  };
}
