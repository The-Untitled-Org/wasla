#!/usr/bin/env node

import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { installCommand } from './commands/install.js';
import { installSkillCommand } from './commands/install-skill.js';
import { setupCommand } from './commands/setup.js';
import { statusCommand } from './commands/status.js';
import { watchCommand } from './commands/watch.js';
import { visualizerCommand } from './server/visualizer-server.js';
import { banner } from './cli-output.js';

const program = new Command();
function readPackageVersion(moduleUrl: string): string {
  let directory = dirname(fileURLToPath(moduleUrl));
  while (true) {
    const packagePath = join(directory, 'package.json');
    if (existsSync(packagePath)) {
      return (JSON.parse(readFileSync(packagePath, 'utf-8')) as { version: string }).version;
    }
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Cannot find package.json');
    directory = parent;
  }
}

program
  .name('wasla')
  .description('Universal synchronization layer for AI agent orchestrators')
  .version(readPackageVersion(import.meta.url));

program.addCommand(
  new Command('install').description('Prepare Wasla CLI state').action(installCommand)
);

program.addCommand(
  new Command('install-skill')
    .option('--to <targets>', 'Target provider(s), comma-separated. Example: claude,gemini')
    .option('--scope <scope>', 'Sync scope: user or workspace')
    .description('Install Wasla helper skills inside installed AI tools')
    .action((options) => installSkillCommand(options))
);

program.addCommand(
  new Command('setup')
    .argument('<provider>', 'Provider to provision and hydrate (gemini, claude, etc.)')
    .option('--scope <scope>', 'Sync scope: user or workspace')
    .description('Provision a provider and hydrate it with the latest Wasla assets')
    .action((provider, options) => setupCommand(provider, options))
);

program.addCommand(
  new Command('status')
    .option('--scope <scope>', 'Sync scope: user or workspace')
    .description('Show all discovered assets and their sync state')
    .action((options) => statusCommand(options))
);

program.addCommand(
  new Command('watch')
    .option('--scope <scope>', 'Sync scope: user or workspace')
    .description('Watch for changes and auto-sync')
    .action((options) => watchCommand(options))
);

program.addCommand(
  new Command('visualizer')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .option('--scope <scope>', 'Sync scope: user or workspace')
    .description('Open interactive sync visualizer with built-in backend')
    .action((options) => visualizerCommand(options))
);

program.addCommand(
  new Command('ui')
    .option('--port <port>', 'Port to bind', '4072')
    .option('--no-open', 'Do not open browser automatically')
    .option('--scope <scope>', 'Sync scope: user or workspace')
    .description('Alias for `visualizer`')
    .action((options) => visualizerCommand(options))
);

banner();
program.parse(process.argv);
