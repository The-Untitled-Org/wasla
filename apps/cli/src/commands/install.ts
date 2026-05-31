import { section, success, error, highlight, spacer } from '../cli-output.js';
import { readConfiguredScope } from '#shared/config.js';

export async function installCommand(): Promise<void> {
  try {
    section('Preparing Wasla CLI...');
    spacer();

    const scope = await readConfiguredScope();
    if (scope) {
      success(`Scope configured: ${scope}`);
    } else {
      console.log('Choose a scope before running sync:');
      console.log('  wasla config --scope user');
      console.log('  wasla config --scope workspace');
    }

    spacer();
    highlight('CLI setup complete!');
    console.log('');
    console.log('This command does not write skills into Claude, Gemini, or other tools.');
    console.log('');
    console.log('Common commands:');
    console.log('  wasla sync');
    console.log('  wasla sync-to --from gemini --to claude');
    console.log('  wasla register  # optional: add Wasla helper skills to tools');
    console.log('');
  } catch (err) {
    error(`CLI setup failed: ${err}`);
    process.exit(1);
  }
}
