import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

describe('Visualizer UI asset pipeline', () => {
  it('logo is present in apps/visualizer/public/', () => {
    expect(existsSync(resolve('apps/visualizer/public/logo.png'))).toBe(true);
  });

  it('ships local provider icons instead of depending on third-party image hosts', async () => {
    const { PROVIDER_ICONS } = await import('@cli/server/visualizer-server.js');

    for (const iconUrl of Object.values(PROVIDER_ICONS)) {
      expect(iconUrl).toMatch(/^\/(?:img\/)?[^/]+\.png$/);
      expect(existsSync(resolve('apps/visualizer/public', iconUrl.slice(1)))).toBe(true);
    }
  });

  it('wasla provider icon URL is /logo.png', async () => {
    const { PROVIDER_ICONS } = await import('@cli/server/visualizer-server.js');
    expect(PROVIDER_ICONS.wasla).toBe('/logo.png');
  });

  it('PROVIDER_ICONS does not contain the old branding API route', async () => {
    const { PROVIDER_ICONS } = await import('@cli/server/visualizer-server.js');
    expect(Object.values(PROVIDER_ICONS)).not.toContain('/api/branding/wasla-logo');
  });

  it('renders measured hub connectors instead of overflow satellite lines', () => {
    const app = readFileSync(resolve('apps/visualizer/src/VisualizerApp.tsx'), 'utf-8');
    const styles = readFileSync(resolve('apps/visualizer/src/styles.css'), 'utf-8');

    expect(app).toContain('<svg className="provider-connectors"');
    expect(app).toContain('data-provider-slot={provider.id}');
    expect(styles).not.toContain('.provider-satellites');
    expect(styles).not.toContain('.provider-satellite-slot');
  });

  it('does not depend on Material UI', () => {
    const packageJson = readFileSync(resolve('apps/visualizer/package.json'), 'utf-8');
    const source = [
      'apps/visualizer/src/main.tsx',
      'apps/visualizer/src/VisualizerApp.tsx',
      'apps/visualizer/src/components/ProviderCard.tsx',
      'apps/visualizer/src/components/FloatingActions.tsx',
    ]
      .map((file) => readFileSync(resolve(file), 'utf-8'))
      .join('\n');

    expect(packageJson).not.toContain('@mui/');
    expect(packageJson).not.toContain('@emotion/');
    expect(source).not.toContain('@mui/');
  });
});
