// Tiempo por trozo (ms, Node, frío) del generador 31 / 32 / 33 en zonas distintas. Uso: node trozos.mjs [RAIZ_DEL_REPO] [SEMILLA]
// RAIZ por omisión: la raíz del repo, relativa a este script (docs/revisiones/scripts_integracion/tanda2_v1381/).
import { pathToFileURL, fileURLToPath } from 'url';
const raiz = process.argv[2] || fileURLToPath(new URL('../../../../', import.meta.url));
const semilla = +(process.argv[3] || 202);
const U = (p) => import(pathToFileURL(raiz.replace(/[\/]$/, '') + '/src/' + p).href);
const { Generator } = await U('worldgen.js');
const pct = (a, q) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * q))];
const zonas = (g) => {
  const sp = g.findSpawn(); const z = [['inicio', sp.x, sp.z]];
  if (g.v2 && g.v2.hondoNodo) { const lista = []; for (let gz = -12; gz <= 12; gz++) for (let gx = -12; gx <= 12; gx++) { const n = g.v2.hondoNodo(gx, gz); if (n.cam) lista.push(n); } lista.sort((a, b) => Math.hypot(a.x - sp.x, a.z - sp.z) - Math.hypot(b.x - sp.x, b.z - sp.z)); for (const t of ['fragua', 'geoda', 'azufre', 'ceniza']) { const n = lista.find((q) => q.tipo === t); if (n) z.push([`hondura-${t}`, n.x, n.z]); } }
  z.push(['lejos', sp.x + 1500, sp.z - 1500], ['lejos2', sp.x - 2200, sp.z + 900]);
  return z;
};
for (const ver of [31, 32, 33]) {
  const g = new Generator(semilla, ver, 'tierra', 'normal');
  const filas = [];
  for (const [nom, x, z] of zonas(new Generator(semilla, 33, 'tierra', 'normal'))) {
    const cx0 = Math.floor(x / 16) - 5, cz0 = Math.floor(z / 16) - 5, ms = [];
    for (let dz = 0; dz < 11; dz++) for (let dx = 0; dx < 11; dx++) { const b = new Uint16Array(32768); const a = performance.now(); g.generate(cx0 + dx, cz0 + dz, b, new Float32Array(768)); ms.push(performance.now() - a); }
    filas.push(`${nom}: media ${(ms.reduce((s, v) => s + v, 0) / ms.length).toFixed(1)} p95 ${pct(ms, 0.95).toFixed(1)} máx ${Math.max(...ms).toFixed(1)} (>50 ms: ${ms.filter((v) => v > 50).length})`);
  }
  console.log(`gen ${ver} semilla ${semilla}\n  ` + filas.join('\n  '));
}
