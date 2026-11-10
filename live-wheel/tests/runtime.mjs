import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve as pathResolve } from 'node:path';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'cloudflare:workers') return { url: new URL('./workers.mjs', import.meta.url).href, shortCircuit: true };
    if (specifier.startsWith('@/')) return nextResolve(pathToFileURL(pathResolve(specifier.slice(2) + '.ts')).href, context);
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) return nextResolve(specifier + '.ts', context);
    return nextResolve(specifier, context);
  },
});
