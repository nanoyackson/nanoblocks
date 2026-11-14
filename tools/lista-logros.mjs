// Arma src/logros-lista.js con todos los logros fijos que hay en el código (achieve('clave', 'Texto')).
// Correr cada vez que se agregan logros: node tools/lista-logros.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');
const re = /achieve\(\s*'([a-z0-9_]+)'\s*,\s*(['"`])((?:(?!\2).)+)\2\s*\)/g;
const seen = new Map();
for (const f of readdirSync(SRC).filter((n) => n.endsWith('.js') && n !== 'logros-lista.js').sort()) {
  const s = readFileSync(join(SRC, f), 'utf8');
  for (const m of s.matchAll(re)) if (!seen.has(m[1]) && !m[3].includes('${')) seen.set(m[1], m[3]);
}
// los de las estructuras están en STRUCT_ACH (estructuras.js)
const est = readFileSync(join(SRC, 'estructuras.js'), 'utf8').match(/STRUCT_ACH = \{([^}]+)\}/);
if (est) for (const m of est[1].matchAll(/\['([a-z0-9_]+)',\s*'([^']+)'\]/g)) if (!seen.has(m[1])) seen.set(m[1], m[2]);
const rows = [...seen].map(([k, t]) => `  [${JSON.stringify(k)}, ${JSON.stringify(t)}],`).join('\n');
writeFileSync(join(SRC, 'logros-lista.js'), `// Generado por tools/lista-logros.mjs: no editar a mano.\nexport const LOGROS = [\n${rows}\n];\n`);
console.log(`src/logros-lista.js: ${seen.size} logros`);
