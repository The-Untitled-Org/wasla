import { afterEach, describe, expect, it, vi } from 'vitest';

const { promptsMock } = vi.hoisted(() => ({
  promptsMock: vi.fn(),
}));

vi.mock('prompts', () => ({
  default: promptsMock,
}));

import { resolveScope } from '@utils/config';

describe('Wasla CLI scope resolution', () => {
  const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    if (originalIsTTY) {
      Object.defineProperty(process.stdin, 'isTTY', originalIsTTY);
    } else {
      delete (process.stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY;
    }
  });

  it('uses an explicit workspace scope without prompting', async () => {
    await expect(resolveScope('workspace')).resolves.toBe('workspace');
    expect(promptsMock).not.toHaveBeenCalled();
  });

  it('uses an explicit user scope without prompting', async () => {
    await expect(resolveScope('user')).resolves.toBe('user');
    expect(promptsMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid explicit scope', async () => {
    await expect(resolveScope('invalid')).rejects.toThrow('Invalid scope');
  });

  it('requires --scope when stdin is not interactive', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: false });

    await expect(resolveScope()).rejects.toThrow('Scope is required in non-interactive mode');
  });

  it('prompts for a scope in an interactive terminal', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
    promptsMock.mockResolvedValue({ scope: 'workspace' });

    await expect(resolveScope()).resolves.toBe('workspace');
    expect(promptsMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'select', name: 'scope' })
    );
  });
});
