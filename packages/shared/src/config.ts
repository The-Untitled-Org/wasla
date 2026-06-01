import prompts from 'prompts';
import { getRegistryPath } from './paths.js';

export type WaslaScope = 'user' | 'workspace';

export async function resolveScope(explicitScope?: string): Promise<WaslaScope> {
  if (explicitScope) {
    if (explicitScope !== 'user' && explicitScope !== 'workspace') {
      throw new Error('Invalid scope. Use: user or workspace');
    }
    return explicitScope;
  }

  if (!process.stdin.isTTY) {
    throw new Error('Scope is required in non-interactive mode. Use: --scope <user|workspace>');
  }

  const response = await prompts<'scope'>({
    type: 'select',
    name: 'scope',
    message: 'Where should Wasla sync assets?',
    choices: [
      { title: 'Workspace - current project only', value: 'workspace' },
      { title: 'User - available across all projects', value: 'user' },
    ],
    initial: 0,
  });
  if (response.scope !== 'user' && response.scope !== 'workspace') {
    throw new Error('Scope selection cancelled');
  }
  return response.scope;
}

export function getConfiguredRegistryPath(scope: WaslaScope): string {
  return getRegistryPath(scope);
}
