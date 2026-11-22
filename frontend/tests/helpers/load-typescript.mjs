import { readFile, stat } from 'node:fs/promises';
import ts from 'typescript';

async function sourceUrl(url, cache, version) {
  const key = url.href;
  if (cache.has(key)) return cache.get(key);
  const pending = (async () => {
    const source = await readFile(url, 'utf8');
    let compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const imports = [
      ...compiled.matchAll(/\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?['"]([^'"]+)['"]/g),
    ];
    for (const match of imports) {
      const specifier = match[1];
      let resolved;
      if (specifier.startsWith('.') || specifier.startsWith('@/')) {
        let target = specifier.startsWith('@/')
          ? new URL('../../src/' + specifier.slice(2), import.meta.url)
          : new URL(specifier, url);
        try {
          await stat(target);
        } catch {
          target = new URL(target.href + '.ts');
        }
        resolved = await sourceUrl(target, cache, version);
      } else resolved = import.meta.resolve(specifier);
      compiled = compiled
        .replaceAll(`'${specifier}'`, JSON.stringify(resolved))
        .replaceAll(`"${specifier}"`, JSON.stringify(resolved));
    }
    return (
      'data:text/javascript;base64,' +
      Buffer.from(compiled).toString('base64') +
      '#module-' +
      version
    );
  })();
  cache.set(key, pending);
  return pending;
}
let version = 0;
export async function loadTypeScriptModules(urls) {
  const instance = version++;
  const cache = new Map();
  return Promise.all(urls.map(async (url) => import(await sourceUrl(url, cache, instance))));
}
export async function loadTypeScript(url) {
  return (await loadTypeScriptModules([url]))[0];
}
