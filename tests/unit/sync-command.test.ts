import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadMock, resolveScopeMock, syncMock } = vi.hoisted(() => ({
  loadMock: vi.fn(async () => undefined),
  resolveScopeMock: vi.fn(async () => 'workspace'),
  syncMock: vi.fn(async () => ({
    assetsDiscovered: 3,
    stubsWritten: 2,
    stubsDeleted: 1,
    writtenPaths: ['/tmp/.gemini/settings.json'],
  })),
}));

vi.mock('#core/registry.js', () => ({
  RegistryManager: vi.fn(() => ({ load: loadMock })),
}));

vi.mock('#shared/config.js', () => ({
  resolveScope: resolveScopeMock,
}));

vi.mock('#sync/index.js', () => ({
  Syncer: vi.fn(() => ({ sync: syncMock })),
}));

vi.mock('#sync/scanner.js', () => ({
  Scanner: vi.fn(),
}));

vi.mock('@cli/cli-output', () => ({
  section: vi.fn(),
  info: vi.fn(),
  spacer: vi.fn(),
  highlight: vi.fn(),
  metric: vi.fn(),
  bulletPoint: vi.fn(),
  error: vi.fn(),
}));

import { syncCommand } from '@cli/commands/sync.js';
import { metric } from '@cli/cli-output';

describe('syncCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs one non-interactive sync in the requested scope', async () => {
    await syncCommand({ scope: 'workspace' });

    expect(resolveScopeMock).toHaveBeenCalledWith('workspace');
    expect(loadMock).toHaveBeenCalledTimes(1);
    expect(syncMock).toHaveBeenCalledWith(false);
  });

  it('reports sync result metrics', async () => {
    await syncCommand({ scope: 'workspace' });

    expect(metric).toHaveBeenCalledWith('Assets discovered', 3);
    expect(metric).toHaveBeenCalledWith('Mirrors written', 2);
    expect(metric).toHaveBeenCalledWith('Mirrors removed', 1);
  });
});
