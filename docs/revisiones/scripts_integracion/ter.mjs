// Mide defectos del terreno en una ventana. Uso: node ter.mjs <raiz> <semilla> <version> <N>
import { pathToFileURL } from 'url';
const R = process.argv[2], seed = +process.argv[3], VER = +(process.argv[4] || 23), N = +(process.argv[5] || 30);
const U = (p) => import(pathToFileURL(R + '/src/' + p).href);
const { Generator } = await U('worldgen.js');
const { BLOCK_BY_KEY: K } = await U('blocks.js');
const SEA = 62;
const g = new Generator(seed, VER, 'tierra', 'normal');
const BASE = process.argv[6] === 'base';
const E = await U('estructuras.js'), V = await U('pueblogen.js');
const gS = g; // para clasificar
const sp = g.findSpawn();
const S0 = BASE ? null : null;
const ccx = Math.floor(sp.x / 16) - N / 2, ccz = Math.floor(sp.z / 16) - N / 2;
const near = E.structuresNear(g, sp.x, sp.z, N * 8 + 100, null).map((P) => ({ x: P.x, z: P.z, R: E.structRadius(g, P.type) + 18 }));
const vcl = []; for (let gz = Math.floor((sp.z - N * 8 - 300) / V.CELL); gz <= Math.floor((sp.z + N * 8 + 300) / V.CELL); gz++) for (let gx = Math.floor((sp.x - N * 8 - 300) / V.CELL); gx <= Math.floor((sp.x + N * 8 + 300) / V.CELL); gx++) { const v = V.villageAt(g, gx, gz); if (v) vcl.push({ x: v.x, z: v.z, R: (v.R || 46) + 30 }); }
if (BASE) { g.structTypes = []; g.villageCache = { has: () => true, get: () => null, set() {} }; }
const chunks = new Map();
const t0 = Date.now();
for (let cz = ccz; cz < ccz + N; cz++) for (let cx = ccx; cx < ccx + N; cx++) {
  const b = new Uint16Array(16 * 16 * 128), t = new Float32Array(768);
  g.generate(cx, cz, b, t); chunks.set(cx + ',' + cz, b);
}
const msChunk = (Date.now() - t0) / (N * N);
const X0 = ccx * 16, Z0 = ccz * 16, W = N * 16;
const get = (x, y, z) => { if (y < 0 || y > 127) return 0; const b = chunks.get(Math.floor(x / 16) + ',' + Math.floor(z / 16)); return b ? b[(x & 15) + (z & 15) * 16 + y * 256] : -1; };
const WATER = K.water, LAVA = K.lava;
const LEAF = new Set([K.leaves, K.birch_leaves, K.jungle_leaves]);
const LOG = new Set([K.log, K.birch_log, K.jungle_log, K.tronco_musgoso]);
const TREEALL = new Set([...LEAF, ...LOG, K.vine]);
const inner = (x, z) => x >= X0 + 16 && x < X0 + W - 16 && z >= Z0 + 16 && z < Z0 + W - 16;
const out = { seed, ver: VER, N, msChunk, chunksInner: (N - 2) ** 2 };
// --- fugas de fluido y fluido colgando ---
let fugaA = 0, fugaAMar = 0, fugaL = 0, colgA = 0, colgL = 0, colgSup = 0;
const hCache = new Map();
const hh = (x, z) => { const k = x * 100003 + z; let v = hCache.get(k); if (v === undefined) { v = g.column(x, z); hCache.set(k, v); } return v; };
for (let z = Z0 + 16; z < Z0 + W - 16; z++) for (let x = X0 + 16; x < X0 + W - 16; x++) {
  const col = hh(x, z);
  for (let y = 5; y < 110; y++) {
    const id = get(x, y, z);
    if (id !== WATER && id !== LAVA) continue;
    const up = get(x, y + 1, z), dn = get(x, y - 1, z);
    if (dn === 0) { if (id === WATER) { colgA++; if (y >= SEA - 1 && col.h < y) colgSup++; } else colgL++; }
    if (up !== id) continue; // solo columnas de fluido: la capa de arriba se salta
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (get(x + dx, y, z + dz) === 0) { if (id === WATER) { fugaA++; if (y >= SEA - 8) fugaAMar++; } else fugaL++; break; }
    }
  }
}
Object.assign(out, { fugaAgua: fugaA, fugaAguaCercaMar: fugaAMar, fugaLava: fugaL, aguaColgando: colgA, aguaColgandoSup: colgSup, lavaColgando: colgL });
// --- bocas / agujeros en superficie ---
const open = new Set();
for (let z = Z0 + 16; z < Z0 + W - 16; z++) for (let x = X0 + 16; x < X0 + W - 16; x++) {
  const c = hh(x, z);
  if (c.h <= SEA + 1 || c.biome === 'volcano') continue;
  if (get(x, c.h, z) === 0) open.add(x * 100003 + z);
}
// cúmulos
const seen = new Set(); let nBocas = 0, bocasCuad = 0, bocasMar = 0, bocasAgua = 0, areaTot = 0, bocasPozo = 0;
for (const k of open) {
  if (seen.has(k)) continue;
  const st = [k]; seen.add(k); const cells = [];
  while (st.length) { const c = st.pop(); cells.push(c); const x = Math.round(c / 100003), z = c - x * 100003; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; const kk = (x + dx) * 100003 + (z + dz); if (open.has(kk) && !seen.has(kk)) { seen.add(kk); st.push(kk); } } }
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, nearSea = false, maxD = 0;
  for (const c of cells) { const x = Math.round(c / 100003), z = c - x * 100003; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); const ch = hh(x, z).h; let d = 0; while (get(x, ch - d, z) === 0 && d < 60) d++; maxD = Math.max(maxD, d); }
  for (let z = z0 - 3; z <= z1 + 3 && !nearSea; z++) for (let x = x0 - 3; x <= x1 + 3; x++) { if (hh(x, z).h < SEA) { nearSea = true; break; } }
  nBocas++; areaTot += cells.length;
  const bb = (x1 - x0 + 1) * (z1 - z0 + 1);
  if (cells.length >= 6 && cells.length / bb > 0.88 && (x1 - x0 + 1 >= 3)) bocasCuad++;
  if (nearSea) bocasMar++;
  if (maxD >= 12 && cells.length <= 14) bocasPozo++;
}
Object.assign(out, { bocas: nBocas, bocasCuadradas: bocasCuad, bocasJuntoAgua: bocasMar, bocasPozo, bocasAreaMedia: nBocas ? areaTot / nBocas : 0 });
// --- árboles huérfanos ---
const visited = new Set(); let orfCerca = 0, orf = 0, comps = 0, flotBrom = 0, hojasOrf = 0;
const key3 = (x, y, z) => (x - X0) + (z - Z0) * W + y * W * W;
for (let z = Z0 + 24; z < Z0 + W - 24; z++) for (let x = X0 + 24; x < X0 + W - 24; x++) {
  const c = hh(x, z); if (c.h < SEA - 2) continue;
  for (let y = c.h + 1; y < Math.min(127, c.h + 40); y++) {
    const id = get(x, y, z);
    if (id === K.bromelia && get(x, y - 1, z) === 0) flotBrom++;
    if (!LEAF.has(id)) continue;
    const k = key3(x, y, z);
    if (visited.has(k)) continue;
    // BFS por hojas/troncos/lianas
    const st = [[x, y, z]]; visited.add(k); let hasLog = false, touchEdge = false, n = 0;
    while (st.length && n < 400000) {
      const [a, b, d] = st.pop(); n++;
      if (!inner(a, d) || !inner(a - 8, d - 8) || !inner(a + 8, d + 8)) touchEdge = true;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const nx = a + dx, ny = b + dy, nz = d + dz, nid = get(nx, ny, nz);
        if (!TREEALL.has(nid)) continue;
        if (LOG.has(nid)) hasLog = true;
        const kk = key3(nx, ny, nz);
        if (visited.has(kk)) continue;
        visited.add(kk); st.push([nx, ny, nz]);
      }
    }
    comps++;
    if (!hasLog && !touchEdge) { if (orf < 6) console.error('ORF', x, y, z, 'n', n, 'bioma', c.biome, 'h', c.h); orf++; hojasOrf += n; if (near.some((q) => Math.abs(q.x - x) < q.R && Math.abs(q.z - z) < q.R) || vcl.some((q) => Math.abs(q.x - x) < q.R && Math.abs(q.z - z) < q.R)) orfCerca++; }
  }
}
Object.assign(out, { copasTotal: comps, copasHuerfanas: orf, huerfanasCercaDeEstructura: orfCerca, base: BASE, estructurasEnVentana: near.length, pueblosEnVentana: vcl.length, hojasHuerfanas: hojasOrf, bromeliaFlotante: flotBrom });
// --- ríos y costuras: columnas en un área grande (paso 2) ---
const A = 1200; // medio lado
let rio = 0, rioCanon = 0, rioGarganta = 0, rioSeco = 0, rioTot = 0;
const par = new Map(); let fronteras = 0, escalon = 0, escalon2 = 0;
const step = 2;
const colsA = new Map();
const cA = (x, z) => { const k = x * 200003 + z; let v = colsA.get(k); if (!v) { v = g.column(x, z); colsA.set(k, v); } return v; };
for (let z = Math.round(sp.z) - A; z < Math.round(sp.z) + A; z += step) for (let x = Math.round(sp.x) - A; x < Math.round(sp.x) + A; x += step) {
  const c = cA(x, z);
  if (c.biome !== 'ocean' && c.rio < 0.012 && c.h < SEA + 40) {
    rioTot++;
    if (c.h >= SEA) rioSeco++;
    let mx = 0;
    for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6], [8, 8], [-8, -8]]) mx = Math.max(mx, cA(x + dx * 1, z + dz * 1).h - c.h);
    if (mx >= 8) rioCanon++;
    if (mx >= 14) rioGarganta++;
  }
  const e = cA(x + step, z), s = cA(x, z + step);
  for (const n of [e, s]) {
    if (n.biome !== c.biome) {
      fronteras++;
      const dh = Math.abs(n.h - c.h);
      if (dh >= 3) escalon++;
      if (dh >= 5) escalon2++;
      const kk = [c.biome, n.biome].sort().join('|'); const q = par.get(kk) || [0, 0, 0]; q[0]++; if (dh >= 3) q[1]++; if (dh >= 5) q[2]++; par.set(kk, q);
    }
  }
  if (colsA.size > 400000) colsA.clear();
}
const parTop = [...par.entries()].sort((a, b) => b[1][0] - a[1][0]).slice(0, 10);
Object.assign(out, { areaColsA: (2 * A / step) ** 2, rioCols: rioTot, rioSeco, rioCanon, rioGarganta, fronteras, escalon3: escalon, escalon5: escalon2, paresTop: parTop });
console.log(JSON.stringify(out));
