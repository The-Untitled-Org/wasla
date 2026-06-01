import { getAdapter } from '#adapters/factory.js';
import { RegistryManager } from '#core/registry.js';
import { getConfiguredRegistryPath, resolveScope } from '#shared/config.js';
import { Syncer } from '#sync/index.js';
import { Scanner } from '#sync/scanner.js';
import { error, highlight, info, metric, section, spacer, success } from '../cli-output.js';
import type { WaslaScope } from '#shared/config.js';

interface SetupOptions {
  scope?: string;
}

export async function runSetup(provider: string, scope: WaslaScope) {
  const adapter = getAdapter(provider, scope);

  await adapter.provision();
  await adapter.installSkill();

  const registry = new RegistryManager(scope);
  await registry.load();
  const scanner = new Scanner(scope);
  const syncer = new Syncer(registry, scanner, scope);
  const result = await syncer.sync(false);

  return {
    adapter,
    result,
    registryPath: getConfiguredRegistryPath(scope),
  };
}

export async function setupCommand(provider: string, options: SetupOptions = {}): Promise<void> {
  try {
    const scope = await resolveScope(options.scope);
    const setup = await runSetup(provider, scope);

    section(`Setting up ${setup.adapter.displayName}`);
    info(`Scope: ${scope}`);
    info(`Registry: ${setup.registryPath}`);
    spacer();
    success(`Provisioned ${setup.adapter.displayName}`);
    success(`Installed Wasla helper skill in ${setup.adapter.displayName}`);

    spacer();
    highlight('Setup complete');
    spacer();
    metric('Assets discovered', setup.result.assetsDiscovered);
    metric('Stubs written', setup.result.stubsWritten);
    metric('Stubs deleted', setup.result.stubsDeleted);
  } catch (err) {
    error(`Setup failed: ${err}`);
    process.exit(1);
  }
}
