// uso: node cruces.mjs RAIZ SEMILLA VERSION [VENTANA]
import { pathToFileURL } from 'url';
const R = process.argv[2], seed = +process.argv[3], ver = +(process.argv[4] || 31), W = +(process.argv[5] || 2400);
const U = (p) => import(pathToFileURL(R + '/src/' + p).href);
const { Generator } = await U('worldgen.js'); const { roadsNear } = await U('carreteras.js');
const { structuresNear, structRadius } = await U('estructuras.js'); const { villageAt, CELL } = await U('pueblogen.js');
const g = new Generator(seed, ver, 'tierra', 'normal'); const sp = g.findSpawn();
// tramos de la ventana (cuadrado de lado 2W alrededor del inicio)
const segs = new Map(); const t0 = performance.now();
for (let x = sp.x - W; x <= sp.x + W; x += 400) for (let z = sp.z - W; z <= sp.z + W; z += 400)
  for (const s of roadsNear(g, x, z, 420)) segs.set(s.id, s);
const tSeg = performance.now() - t0;
const t1 = performance.now();
const places = structuresNear(g, sp.x, sp.z, W + 200, null);
const tPl = performance.now() - t1;
const vill = []; for (let gz = Math.floor((sp.z - W) / CELL); gz <= Math.floor((sp.z + W) / CELL); gz++) for (let gx = Math.floor((sp.x - W) / CELL); gx <= Math.floor((sp.x + W) / CELL); gx++) { const v = villageAt(g, gx, gz); if (v) vill.push(v); }
const out = { seed, ver, tramos: segs.size, lugares: places.length, pueblos: vill.length, tSeg: Math.round(tSeg), tPl: Math.round(tPl), cruces: [], pueblosCruz: [] };
const dmin = (s, px, pz) => { let m = 1e9; for (let i = 0; i < s.xs.length; i++) { const d = Math.hypot(s.xs[i] - px, s.zs[i] - pz); if (d < m) m = d; } return m; };
const esExt = (s, px, pz) => (Math.hypot(s.A.x - px, s.A.z - pz) < 12) || (Math.hypot(s.B.x - px, s.B.z - pz) < 12);
for (const P of places) {
  const r = structRadius(g, P.type) + 4;
  for (const s of segs.values()) {
    if (s.x1 < P.x - r || s.x0 > P.x + r || s.z1 < P.z - r || s.z0 > P.z + r) continue;
    if (esExt(s, P.x, P.z)) continue;
    const d = dmin(s, P.x, P.z); if (d < r) out.cruces.push({ tipo: P.type, id: P.id, x: P.x, z: P.z, R: r - 4, tramo: s.id, kind: s.kind, d: Math.round(d), centro: d < (r - 4) * 0.5 });
  }
}
for (const v of vill) { const r = (v.L ?? 46) + 4; for (const s of segs.values()) { if (esExt(s, v.x, v.z)) continue; if (s.x1 < v.x - r || s.x0 > v.x + r || s.z1 < v.z - r || s.z0 > v.z + r) continue; const d = dmin(s, v.x, v.z); if (d < r) out.pueblosCruz.push({ x: v.x, z: v.z, tramo: s.id, d: Math.round(d) }); } }
out.vil = vill.map(v=>[v.x,v.z,v.L??46]); out.segEnds = {}; for (const s of segs.values()) out.segEnds[s.id]=[s.A.x,s.A.z,s.A.L??null,s.B.x,s.B.z,s.B.L??null,s.kind,s.n]; out.lugaresPorTipo = {}; for (const P of places) out.lugaresPorTipo[P.type] = (out.lugaresPorTipo[P.type] || 0) + 1;
console.log(JSON.stringify(out));
