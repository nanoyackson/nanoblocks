// Segunda pasada: causas de piso colgante, escalones en calles, cortes de pendiente, hojas sueltas. Uso: node est2.mjs <raiz> <semilla> <version> <maxPorTipo> <maxPueblos>
import { pathToFileURL } from 'url';
const R = process.argv[2], seed = +process.argv[3], VER = +(process.argv[4] || 23), MAXT = +(process.argv[5] || 2), MAXP = +(process.argv[6] || 6);
const U = (p) => import(pathToFileURL(R + '/src/' + p).href);
const { Generator } = await U('worldgen.js');
const { BLOCK_BY_KEY: K } = await U('blocks.js');
const E = await U('estructuras.js'), V = await U('pueblogen.js');
const SEA = 62;
const g = new Generator(seed, VER, 'tierra', 'normal');
const gB = new Generator(seed, VER, 'tierra', 'normal');
gB.structTypes = []; gB.villageCache = { has: () => true, get: () => null, set() {} };
const FL = new Set([K.water, K.lava, K.agua_acida]);
const LEAF = new Set([K.leaves, K.birch_leaves, K.jungle_leaves]);
const LOG = new Set([K.log, K.birch_log, K.jungle_log, K.tronco_musgoso]);
const TREEALL = new Set([...LEAF, ...LOG, K.vine]);
const TREE = TREEALL;
const cache = new Map();
function chunk(gen, tag, cx, cz) {
  const k = tag + cx + ',' + cz;
  let b = cache.get(k); if (b) return b;
  b = new Uint16Array(32768); gen.generate(cx, cz, b, new Float32Array(768)); cache.set(k, b);
  if (cache.size > 1200) cache.delete(cache.keys().next().value);
  return b;
}
const at = (gen, tag, x, y, z) => { if (y < 0 || y > 127) return 0; return chunk(gen, tag, Math.floor(x / 16), Math.floor(z / 16))[(x & 15) + (z & 15) * 16 + y * 256]; };
const A = (x, y, z) => at(g, 'f', x, y, z), B = (x, y, z) => at(gB, 'b', x, y, z);
const solid = (id) => id !== 0 && !FL.has(id) && id !== K.tall_grass && !TREE.has(id) && id !== K.helecho && id !== K.flower_red && id !== K.flower_yellow;
function topSolid(x, z) { for (let y = 126; y > 0; y--) { const id = A(x, y, z); if (solid(id)) return y; } return 0; }

function huerfanas(x0, z0, x1, z1) {
  const vis = new Set(); let n = 0, cells = 0;
  const key = (x, y, z) => x + 4096 * 0 + (z - z0) * 4096 + y * 4096 * 4096;
  for (let z = z0 + 1; z < z1; z++) for (let x = x0 + 1; x < x1; x++) {
    const c = g.column(x, z);
    for (let y = c.h + 1; y < Math.min(126, c.h + 30); y++) {
      const id = A(x, y, z); if (!LEAF.has(id)) continue;
      const k0 = key(x - x0, y, z); if (vis.has(k0)) continue;
      const st = [[x, y, z]]; vis.add(k0); let log = false, edge = false, m = 0;
      while (st.length && m < 100000) {
        const [a, b, d] = st.pop(); m++;
        if (a <= x0 + 1 || a >= x1 - 1 || d <= z0 + 1 || d >= z1 - 1) edge = true;
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
          const nx = a + dx, ny = b + dy, nz = d + dz, nid = A(nx, ny, nz);
          if (!TREEALL.has(nid)) continue;
          if (LOG.has(nid)) log = true;
          const kk = key(nx - x0, ny, nz); if (vis.has(kk)) continue; vis.add(kk); st.push([nx, ny, nz]);
        }
      }
      if (!log && !edge && m >= 3) { n++; cells += m; }
    }
  }
  return { fragmentos: n, hojas: cells };
}

function analizar(x0, z0, x1, z1) {
  const o = { cols: 0, boca: 0, hondo: 0, excavado: 0, bromeliaFlot: 0, marg: 0 };
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const col = g.column(x, z);
    let low = -1;
    for (let y = 1; y < 127; y++) { const f = A(x, y, z), b = B(x, y, z); if (f !== b && f !== 0 && !TREE.has(f) && !TREE.has(b)) { low = y; break; } }
    if (low < 0) continue;
    o.cols++;
    let gap = 0, yy = low - 1;
    while (yy > 0 && !solid(A(x, yy, z))) { gap++; yy--; }
    if (gap >= 2 && !FL.has(A(x, low - 1, z))) {
      const bb = B(x, low - 1, z);
      if (solid(bb)) o.excavado++;
      else {
        let mouth = false; for (let d = 0; d <= 3; d++) if (B(x, col.h - d, z) === 0) { mouth = true; break; }
        if (mouth) o.boca++; else o.hondo++;
      }
    }
  }
  return o;
}

const res = { seed, ver: VER, estructuras: [], pueblos: [] };
const S = 2400;
const todas = E.structuresNear(g, 0, 0, S, null).filter((P) => Math.abs(P.x) <= S && Math.abs(P.z) <= S);
const porTipo = new Map();
for (const P of todas) { if (!porTipo.has(P.type)) porTipo.set(P.type, []); porTipo.get(P.type).push(P); }
for (const [t, lista] of porTipo) {
  const R0 = E.structRadius(g, t);
  lista.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
  for (const P of lista.slice(0, MAXT)) {
    const m = R0 + 3;
    const o = analizar(P.x - m, P.z - m, P.x + m, P.z + m);
    Object.assign(o, huerfanas(P.x - m - 10, P.z - m - 10, P.x + m + 10, P.z + m + 10));
    o.tipo = t; o.R = R0; res.estructuras.push(o);
  }
}
// pueblos
const VC = V.CELL; const pueblos = [];
for (let gz = Math.floor(-S / VC); gz <= Math.floor(S / VC); gz++) for (let gx = Math.floor(-S / VC); gx <= Math.floor(S / VC); gx++) { const v = V.villageAt(g, gx, gz); if (v) pueblos.push(v); }
pueblos.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
for (const v of pueblos.slice(0, MAXP)) {
  const VR = v.R || 46;
  const o = analizar(v.x - VR - 2, v.z - VR - 2, v.x + VR + 2, v.z + VR + 2);
  Object.assign(o, huerfanas(v.x - VR - 12, v.z - VR - 12, v.x + VR + 12, v.z + VR + 12));
  o.id = v.id; o.R = VR; o.ciudad = !!v.city; o.streets = !!v.streets;
  // calles: escalones y cortes
  let pasos = 0, esc2 = 0, esc3 = 0, cortes = 0, runsOm = 0, lenTot = 0;
  if (v.streets) for (const s of v.streets) {
    const along = s.axis === 'x';
    for (let k = 0; k < (along ? s.d : s.w); k++) {
      let prev = null, om = 0;
      for (let t = 0; t < (along ? s.w : s.d); t++) {
        const x = along ? s.x + t : s.x + k, z = along ? s.z + k : s.z + t;
        const h = g.column(x, z).h;
        if (h < SEA - 1) { om++; prev = null; continue; }
        if (om >= 3) runsOm++; om = 0;
        const y = Math.max(h, SEA); lenTot++;
        if (prev !== null) { const d = Math.abs(y - prev); if (d >= 2) esc2++; if (d >= 3) esc3++; }
        prev = y;
      }
      if (om >= 3) runsOm++;
    }
  }
  Object.assign(o, { calleCelda: lenTot, calleEsc2: esc2, calleEsc3: esc3, calleCortes: runsOm });
  // muros de corte alrededor de edificios
  let wallCut = 0, wallHigh = 0, edif = 0, ringTot = 0;
  for (const b of v.buildings) {
    if (b.kind === 'plaza' || b.kind === 'parada' || /^(cafetal|potrero|bananal|milpa|parque)$/.test(b.kind)) continue;
    edif++;
    for (let z = b.z - 2; z <= b.z + b.d + 1; z++) for (let x = b.x - 2; x <= b.x + b.w + 1; x++) {
      const dentro = x >= b.x - 1 && x <= b.x + b.w && z >= b.z - 1 && z <= b.z + b.d;
      if (dentro) continue; ringTot++;
      const t = topSolid(x, z);
      if (t - b.y >= 4) wallCut++; else if (b.y - t >= 4) wallHigh++;
    }
  }
  Object.assign(o, { edif, ringTot, murosCorte: wallCut, murosAltos: wallHigh });
  res.pueblos.push(o);
}
console.log(JSON.stringify(res));
