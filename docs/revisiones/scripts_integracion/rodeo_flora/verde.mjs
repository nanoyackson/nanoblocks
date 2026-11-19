// uso: node verde.mjs RAIZ SEMILLA [MAXPORTIPO]
// Para cada lugar: % de columnas cuya cara de arriba es una planta (render cross) dentro del radio R y en un anillo de referencia (R+4..R+18).
import { pathToFileURL } from 'url';
const R = process.argv[2], seed = +process.argv[3], MAXN = +(process.argv[4] || 2);
const U = (p) => import(pathToFileURL(R + '/src/' + p).href);
const { Generator } = await U('worldgen.js');
const { BLOCKS } = await U('blocks.js');
const E = await U('estructuras.js');
const g = new Generator(seed, 31, 'tierra', 'normal');
const sp = g.findSpawn();
const CROSS = new Set(), HOJA = new Set();
for (const b of BLOCKS) { if (!b) continue; if (b.render === 'cross') CROSS.add(b.id); if (/leaves|techo_palma|palm/.test(b.key)) HOJA.add(b.id); }
const cache = new Map();
function ch(cx, cz) {
  const k = cx + ',' + cz; let b = cache.get(k); if (b) return b;
  b = new Uint16Array(32768); g.generate(cx, cz, b, new Float32Array(768)); cache.set(k, b);
  if (cache.size > 1200) cache.delete(cache.keys().next().value); return b;
}
function tope(x, z) { const b = ch(Math.floor(x / 16), Math.floor(z / 16)); const o = (x & 15) + (z & 15) * 16; for (let y = 126; y > 0; y--) { const id = b[o + y * 256]; if (id) return id; } return 0; }
const W = +(process.env.W || 2500);
const todas = E.structuresNear(g, sp.x, sp.z, W, null);
const porTipo = new Map();
for (const P of todas) { if (!porTipo.has(P.type)) porTipo.set(P.type, []); porTipo.get(P.type).push(P); }
const res = {};
for (const [t, l] of porTipo) {
  l.sort((a, b) => Math.hypot(a.x - sp.x, a.z - sp.z) - Math.hypot(b.x - sp.x, b.z - sp.z));
  const r = Math.min(E.structRadius(g, t), 40);
  for (const P of l.slice(0, MAXN)) {
    let nIn = 0, pIn = 0, hIn = 0, nOut = 0, pOut = 0, hOut = 0;
    for (let z = P.z - r - 18; z <= P.z + r + 18; z += 2) for (let x = P.x - r - 18; x <= P.x + r + 18; x += 2) {
      const d = Math.hypot(x - P.x, z - P.z); if (d > r + 18) continue;
      const id = tope(x, z); if (!id) continue;
      if (d <= r) { nIn++; if (CROSS.has(id)) pIn++; else if (HOJA.has(id)) hIn++; }
      else if (d >= r + 4) { nOut++; if (CROSS.has(id)) pOut++; else if (HOJA.has(id)) hOut++; }
    }
    const q = res[t] || (res[t] = { n: 0, nIn: 0, pIn: 0, hIn: 0, nOut: 0, pOut: 0, hOut: 0, r }); q.n++;
    q.nIn += nIn; q.pIn += pIn; q.hIn += hIn; q.nOut += nOut; q.pOut += pOut; q.hOut += hOut;
  }
}
console.log(JSON.stringify({ seed, res }));
