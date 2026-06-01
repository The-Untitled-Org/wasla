import { getAdapter } from '#adapters/factory.js';
import { RegistryManager } from '#core/registry.js';
import { getConfiguredRegistryPath, resolveScope } from '#shared/config.js';
import { Syncer } from '#sync/index.js';
import { Scanner } from '#sync/scanner.js';
import { error, highlight, info, metric, section, spacer, success } from '../cli-output.js';

interface SetupOptions {
  scope?: string;
}

export async function setupCommand(provider: string, options: SetupOptions = {}): Promise<void> {
  try {
    const scope = await resolveScope(options.scope);
    const adapter = getAdapter(provider, scope);

    section(`Setting up ${adapter.displayName}`);
    info(`Scope: ${scope}`);
    info(`Registry: ${getConfiguredRegistryPath(scope)}`);
    spacer();

    await adapter.provision();
    success(`Provisioned ${adapter.displayName}`);

    await adapter.installSkill();
    success(`Registered Wasla helper in ${adapter.displayName}`);

    const registry = new RegistryManager(scope);
    await registry.load();
    const scanner = new Scanner(scope);
    const syncer = new Syncer(registry, scanner, scope);
    const result = await syncer.sync(false);

    spacer();
    highlight('Setup complete');
    spacer();
    metric('Assets discovered', result.assetsDiscovered);
    metric('Stubs written', result.stubsWritten);
    metric('Stubs deleted', result.stubsDeleted);
  } catch (err) {
    error(`Setup failed: ${err}`);
    process.exit(1);
  }
}
