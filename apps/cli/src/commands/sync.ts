import { RegistryManager } from '#core/registry.js';
import { resolveScope } from '#shared/config.js';
import { Syncer } from '#sync/index.js';
import { Scanner } from '#sync/scanner.js';
import { bulletPoint, error, highlight, info, metric, section, spacer } from '../cli-output.js';

interface SyncCommandOptions {
  scope?: string;
}

export async function syncCommand(options: SyncCommandOptions = {}): Promise<void> {
  try {
    const scope = await resolveScope(options.scope);
    const registry = new RegistryManager(scope);
    await registry.load();
    const syncer = new Syncer(registry, new Scanner(scope), scope);

    section('Synchronizing assets');
    info(`Scope: ${scope}`);
    spacer();

    const result = await syncer.sync(false);

    highlight('Sync complete');
    spacer();
    metric('Assets discovered', result.assetsDiscovered);
    metric('Mirrors written', result.stubsWritten);
    metric('Mirrors removed', result.stubsDeleted);
    if (result.writtenPaths.length > 0) {
      spacer();
      section('Updated native files');
      for (const path of result.writtenPaths) bulletPoint(path);
    }
  } catch (err) {
    error(`Sync failed: ${err}`);
    process.exit(1);
  }
}
