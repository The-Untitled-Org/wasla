import { section, error, highlight, spacer } from '../cli-output.js';

export async function installCommand(): Promise<void> {
  try {
    section('Preparing Wasla CLI...');
    spacer();

    highlight('CLI setup complete!');
    console.log('');
    console.log('This command does not write skills into Claude, Gemini, or other tools.');
    console.log('');
    console.log('Common commands:');
    console.log('  wasla setup gemini --scope workspace');
    console.log(
      '  wasla register --scope workspace  # optional: add helper skills to existing tools'
    );
    console.log('  wasla watch --scope workspace');
    console.log('');
  } catch (err) {
    error(`CLI setup failed: ${err}`);
    process.exit(1);
  }
}
