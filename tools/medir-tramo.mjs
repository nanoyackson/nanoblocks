// v13.4.2: costo de los tramos de camino al caminar (como cuando se generan trozos en el hilo principal): llama a roadsNear cada 16 bloques a lo largo de 3 000 bloques desde
// el inicio y reporta el total y las peores llamadas. Uso: node tools/medir-tramo.mjs [version, semilla]  (sin argumentos compara el 28 y el 29 con la semilla 202)
import { Generator } from '../src/worldgen.js';
import { roadsNear } from '../src/carreteras.js';

export function medir(ver, seed = 202) {
  const g = new Generator(seed, ver, 'tierra', 'normal'), sp = g.findSpawn(), t = [];
  for (let d = 0; d <= 3000; d += 16) { const t0 = performance.now(); roadsNear(g, sp.x + d, sp.z, 12); t.push(performance.now() - t0); }
  const peores = [...t].sort((a, b) => b - a).slice(0, 3);
  return { total: t.reduce((s, v) => s + v, 0), peores };
}
if (process.argv[1] && process.argv[1].endsWith('medir-tramo.mjs')) {
  const seed = +(process.argv[3] || 202);
  for (const v of process.argv[2] ? [+process.argv[2]] : [28, 29]) { const r = medir(v, seed); console.log(`gen ${v}: total ${r.total.toFixed(0)} ms · peores ${r.peores.map((x) => x.toFixed(0)).join(', ')} ms`); }
}
