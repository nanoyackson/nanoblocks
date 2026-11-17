// Carreteras entre pueblos (generador v6): ruta nacional de asfalto con línea, calle cantonal llena de parches y
// camino de lastre. Siguen el terreno (con rellenos y cortes), cruzan ríos con puentes de un carril, y tienen
// huecos de verdad (geometría), charcos, parches de todo material, grietas, cráteres, obras eternas con conos y
// cuadrilla, peajes, presas con bus y rótulos. Sin gráficos (lo usa el generador).
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { villageAt, CELL } from './pueblogen.js';
import { structuresNear, structRadius } from './estructuras.js';

// lugares a los que llega un camino desde el pueblo más cercano (los que tienen gente, no la selva virgen)
const ROAD_TO = new Set(['capital', 'basilica', 'ruinas', 'fortin', 'estadio_nacional', 'estadio_obra', 'estacion', 'refineria', 'playa_lujo', 'sanatorio', 'hacienda', 'beneficio', 'muelle_limon', 'marino_ballena', 'monteverde', 'grecia', 'zapote', 'aeropuerto']);

const SEA = 62;
const CH = 16;
const SIGNS = [['Precaución: huecos', 'Maneje con cuidado. Los huecos de esta ruta ya tienen nombre y apellido.'], ['Trabajamos para usted', 'Ministerio de Obras. Disculpe las molestias (desde 2009).'],
  ['Obras en proceso', 'Fecha de entrega: próximamente.'], ['Desvío provisional', 'Provisional desde hace 6 años.'], ['Reparación pendiente', 'Ya está en la lista. La lista es larga.'],
  ['Próximamente: carretera nueva', 'Primera piedra colocada. Segunda piedra: por definir.'], ['Velocidad máxima 60', '…si los huecos lo dejan pasar de 20.'], ['Bienvenido', 'Pura vida. Cuidado con el hueco de la entrada.']];

// salida de un pueblo hacia otro: el final de la avenida que mira hacia allá (o el centro en los caseríos)
function exitOf(v, tx, tz) {
  if (!v.streets) return [v.x, v.z];
  const L = v.L ?? v.R - 14, dx = tx - v.x, dz = tz - v.z;
  if (Math.abs(dx) > Math.abs(dz)) return [v.x + Math.sign(dx) * (L + 1), v.z + (dz > 0 ? 13 : -13)];
  return [v.x + (dx > 0 ? 13 : -13), v.z + Math.sign(dz) * (L + 1)];
}
const insideTown = (v, x, z) => (v.structR ? Math.max(Math.abs(x - v.x), Math.abs(z - v.z)) < v.structR * 0.85 : v.streets ? Math.abs(x - v.x) <= (v.L ?? v.R - 14) + 1 && Math.abs(z - v.z) <= (v.L ?? v.R - 14) + 1 : Math.hypot(x - v.x, z - v.z) < 32);

function makeSegment(gen, A, B) {
  const [ax, az] = exitOf(A, B.x, B.z), [bx, bz] = exitOf(B, A.x, A.z);
  const len = Math.hypot(bx - ax, bz - az);
  if (len < 20 || len > 900) return null;
  const s = gen.seed, hid = hash3(s, ax, 7070, bz);
  // un poco de curva para que no sea una regla
  let off = (hash3(s, ax, 7071, az) - 0.5) * 0.5 * len;
  // v13.4.2 (I4 + I10 R1, generador 29): se prueban nueve curvas laterales y se queda la de menor costo (subidas, cumbres, mar y obras que no son su destino)
  // v13.5.1 (generador 31): las obras ajenas a rodear (los otros pueblos y los lugares con gente de la zona) salen de villageAt y de la lista de lugares con camino, que ya se calculan (barato)
  const obras = gen.version >= 31 ? obrasAjenas(gen, A, B, ax, az, bx, bz, len) : null;
  if (gen.version >= 29) off = mejorCurva(gen, ax, az, bx, bz, len, off, obras);
  const mx = (ax + bx) / 2 + (-(bz - az) / len) * off, mz = (az + bz) / 2 + ((bx - ax) / len) * off;
  const N = Math.ceil(len * 1.3);
  let xs = [], zs = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = Math.round(u * u * ax + 2 * u * t * mx + t * t * bx), z = Math.round(u * u * az + 2 * u * t * mz + t * t * bz);
    if (xs.length && xs[xs.length - 1] === x && zs[zs.length - 1] === z) continue;
    xs.push(x); zs.push(z);
  }
  let n = xs.length;
  let h = xs.map((x, i) => gen.column(x, zs[i]).h);
  // v13.5.1 (generador 31, R3): en una ladera fuerte el camino hace zigzag (serpentea de lado a lado) para que la pendiente baje; el rodeo (la mejor curva) ya se probó antes
  let zig = false;
  if (gen.version >= 31) { const z = zigzag(gen, xs, zs, h); if (z) { xs = z.xs; zs = z.zs; h = z.h; n = xs.length; zig = true; } }
  // agua honda: puente; agua baja (lagunas, manglar): relleno de tierra a la altura del mar
  // v13.3.0 (I2, generador 24): el cauce de un río (rio < 0.045 y bajo el mar) también es agua: el camino lo cruza con puente en vez de taparlo con un dique de tierra; la regla
  // de «más de 46 bloques de agua» sigue contando solo el mar
  const mar = h.map((v) => v < SEA - 3);
  const water = gen.version >= 24 ? h.map((v, i) => mar[i] || (v < SEA && gen.column(xs[i], zs[i]).rio < 0.045)) : mar;
  // no se hacen carreteras que crucen el mar
  let run = 0;
  for (const w of mar) { run = w ? run + 1 : 0; if (run > 46) return null; }
  // v13.5.1 (generador 31, R4): último recurso, un túnel donde una loma estrecha se interpone (la loma sobresale 14 o más del perfil que sale al abrir el relieve) y no hubo otra salida
  const tunel = gen.version >= 31 ? tunelDe(h, water, n) : null;
  const hr = tunel ? tunel.hr : h;
  const ys = h.map((_, i) => {
    if (water[i]) return SEA + 1;
    let sum = 0, c = 0;
    for (let k = Math.max(0, i - 5); k <= Math.min(n - 1, i + 5); k++) if (!water[k]) { sum += Math.max(hr[k], SEA + 1); c++; }
    return Math.max(SEA + 1, Math.round(sum / c));
  });
  // v13.4.2 (I4, generador 29): el perfil sube o baja como máximo 1 por bloque (hacia delante y hacia atrás), sin bajar del puente
  if (gen.version >= 29) {
    for (let i = 1; i < n; i++) if (!water[i]) ys[i] = Math.max(SEA + 1, Math.min(ys[i - 1] + 1, Math.max(ys[i - 1] - 1, ys[i])));
    for (let i = n - 2; i >= 0; i--) if (!water[i]) ys[i] = Math.max(SEA + 1, Math.min(ys[i + 1] + 1, Math.max(ys[i + 1] - 1, ys[i])));
  }
  const kind = A.city && B.city ? 'nacional' : !A.streets || !B.streets ? (hid < 0.6 ? 'lastre' : 'cantonal') : hid < 0.45 ? 'nacional' : 'cantonal';
  const seg = { id: `ruta@${ax},${az}`, xs, zs, ys, water, n, kind, w: kind === 'nacional' ? 5 : kind === 'cantonal' ? 4 : 3, A, B, feats: [], zig, tunel: tunel ? tunel.flags : null };
  seg.x0 = Math.min(...xs) - 8; seg.x1 = Math.max(...xs) + 8; seg.z0 = Math.min(...zs) - 8; seg.z1 = Math.max(...zs) + 8;
  // lo que pasa en la carretera
  const f = (k) => hash3(s, ax + k, 7100, az);
  const land = (i) => i > 8 && i < n - 9 && !water[i] && !water[i - 6] && !water[i + 6] && !(seg.tunel && (seg.tunel[i] || seg.tunel[i - 6] || seg.tunel[i + 6]));
  const at = (t) => { let i = Math.floor(t * n); for (let k = 0; k < 20 && !land(i); k++) i++; return land(i) ? i : -1; };
  const add = (type, t, extra = {}) => { const i = at(t); if (i > 0) seg.feats.push({ type, i, ...extra }); };
  if (f(1) < 0.65) add('obra', 0.3 + f(2) * 0.4);
  if (kind === 'nacional' && f(3) < 0.5) add('peaje', 0.5 + f(4) * 0.1);
  if (kind !== 'lastre' && f(5) < 0.35) add('presa', 0.12 + f(6) * 0.1);
  if (kind === 'lastre' && f(7) < 0.5) add('derrumbe', 0.2 + f(8) * 0.6);
  for (let k = 0; k * 110 + 40 < n; k++) add('rotulo', (k * 110 + 40) / n, { text: SIGNS[Math.floor(f(20 + k) * SIGNS.length)] });
  for (let k = 0; k * 90 + 60 < n; k++) if (f(40 + k) < (kind === 'nacional' ? 0.3 : 0.7)) add('crater', (k * 90 + 60) / n, { wet: f(60 + k) < 0.4 });
  // puente de un carril: un rótulo antes del agua
  for (let i = 1; i < n; i++) if (water[i] && !water[i - 1] && i > 6) { seg.feats.push({ type: 'rotulo', i: i - 4, text: ['Puente de un carril', 'Ceda el paso al que viene. Si los dos se quedan esperando, gana el más necio.'] }); break; }
  return seg;
}

// v13.5.1 (generador 31): lo ajeno que un camino debe rodear: los pueblos de las celdas vecinas que no son sus extremos (villageAt, cacheado: no suma trabajo). Los lugares con gente quedan fuera:
// buscarlos con structuresNear por tramo costaba +36 % (ver tools/revisar-caminos.mjs).
function obrasAjenas(gen, A, B, ax, az, bx, bz, len) {
  const mx = (ax + bx) / 2, mz = (az + bz) / 2, R = len / 2 + 60, res = [];
  const cx0 = Math.floor((mx - R) / CELL), cx1 = Math.floor((mx + R) / CELL), cz0 = Math.floor((mz - R) / CELL), cz1 = Math.floor((mz + R) / CELL);
  for (let gz = cz0; gz <= cz1; gz++) for (let gx = cx0; gx <= cx1; gx++) {
    const v = villageAt(gen, gx, gz);
    if (!v || v === A || v === B || (v.x === A.x && v.z === A.z) || (v.x === B.x && v.z === B.z)) continue;
    res.push({ x: v.x, z: v.z, r: (v.L ?? 46) + 4 });
  }
  return res.length ? res : null;
}

// v13.5.1 (R3): zigzag. Donde el desnivel pasa de 1 por bloque (45 grados) en una ventana de 14 hay un tramo empinado; ahí se prueban 12 serpenteos (amplitud 10, 16 o 22, vuelta cada 36 o 52,
// dos fases) y se queda el de menor costo (3 por bloque de largo, 4 por bloque de desnivel y un recargo grande por cada punto con pendiente de más de 0,7), solo si baja el costo 15 % o más; si no, el camino sigue recto. Solo se miden
// las columnas del tramo empinado (los demás tramos no pagan nada). Devuelve null si no hace falta.
function zigzag(gen, xs, zs, h) {
  const n = xs.length, W = 14;
  if (n < 50) return null;
  const emp = new Uint8Array(n); let hay = false;
  for (let i = 10; i + W < n - 10; i++) if (Math.abs(h[i + W] - h[i]) / W > 1.0) { hay = true; for (let k = Math.max(10, i - 8); k <= Math.min(n - 11, i + W + 8); k++) emp[k] = 1; }
  if (!hay) return null;
  const zonas = [];
  for (let i = 0; i < n;) { if (!emp[i]) { i++; continue; } let j = i; while (j < n && emp[j]) j++; if (j - i >= 24) zonas.push([i, j - 1]); i = j; }
  if (!zonas.length) return null;
  const nrm = (i) => { const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), tx = xs[b] - xs[a], tz = zs[b] - zs[a], L = Math.hypot(tx, tz) || 1; return [-tz / L, tx / L]; };
  const costo = (px, pz, hh) => { let c = 0; for (let i = 1; i < px.length; i++) { const e = Math.hypot(px[i] - px[i - 1], pz[i] - pz[i - 1]) || 1, g = Math.abs(hh[i] - hh[i - 1]) / e; c += 3 * e + 4 * Math.abs(hh[i] - hh[i - 1]) + (g > 0.7 ? (g - 0.7) * 40 * e : 0); } return c; };
  const outX = xs.slice(), outZ = zs.slice(); let cambio = false;
  const piezas = []; // [a, b, X[], Z[]]
  for (const [za, zb] of zonas) {
    const m = zb - za + 1, base = costo(xs.slice(za, zb + 1), zs.slice(za, zb + 1), h.slice(za, zb + 1));
    let mejor = null, mejorC = base * 0.85;
    for (const A of [10, 16, 22]) for (const lam of [36, 52]) for (const fase of [0, Math.PI]) {
      const X = [], Z = [];
      for (let i = za; i <= zb; i++) {
        const u = (i - za) / (m - 1), env = Math.sin(Math.PI * u), d = A * env * Math.sin(fase + (i - za) * 2 * Math.PI / lam), [nx, nz] = nrm(i);
        X.push(Math.round(xs[i] + nx * d)); Z.push(Math.round(zs[i] + nz * d));
      }
      const c = costo(X, Z, X.map((x, k) => gen.column(x, Z[k]).h));
      if (c < mejorC) { mejorC = c; mejor = [X, Z]; }
    }
    if (mejor) { piezas.push([za, zb, mejor[0], mejor[1]]); cambio = true; }
  }
  if (!cambio) return null;
  // armar el camino: lo de antes, la pieza serpenteada (rellenando para que los puntos vecinos queden a 1) y lo de después
  const X = [], Z = [];
  const empuja = (x, z) => {
    if (X.length) { let px = X[X.length - 1], pz = Z[Z.length - 1]; while (Math.max(Math.abs(x - px), Math.abs(z - pz)) > 1) { px += Math.sign(x - px); pz += Math.sign(z - pz); X.push(px); Z.push(pz); } if (X[X.length - 1] === x && Z[Z.length - 1] === z) return; }
    X.push(x); Z.push(z);
  };
  let i = 0;
  for (const [za, zb, PX, PZ] of piezas) { for (; i < za; i++) empuja(xs[i], zs[i]); for (let k = 0; k < PX.length; k++) empuja(PX[k], PZ[k]); i = zb + 1; }
  for (; i < n; i++) empuja(xs[i], zs[i]);
  void outX; void outZ;
  return { xs: X, zs: Z, h: X.map((x, k) => gen.column(x, Z[k]).h) };
}

// v13.5.1 (R4): el perfil «abierto» (mínimo y luego máximo en un radio de 22: quita lo estrecho) y donde la altura sobrepasa 14 o más durante 6 a 70 puntos seguidos, sin agua, hay túnel.
// Devuelve las banderas por punto y la altura que debe seguir el camino (el perfil abierto adentro del túnel).
function tunelDe(h, water, n) {
  const R = 22, er = new Float32Array(n), op = new Float32Array(n);
  for (let i = 0; i < n; i++) { let m = 1e9; for (let k = Math.max(0, i - R); k <= Math.min(n - 1, i + R); k++) if (h[k] < m) m = h[k]; er[i] = m; }
  for (let i = 0; i < n; i++) { let m = -1e9; for (let k = Math.max(0, i - R); k <= Math.min(n - 1, i + R); k++) if (er[k] > m) m = er[k]; op[i] = m; }
  const flags = new Uint8Array(n), hr = Array.from(h); let hubo = false;
  for (let i = 26; i < n - 26;) {
    if (h[i] - op[i] < 14) { i++; continue; }
    let j = i; while (j < n - 26 && h[j] - op[j] >= 14) j++;
    let agua = false; for (let k = i - 3; k <= j + 3; k++) if (water[k]) agua = true;
    if (!agua && j - i >= 6 && j - i <= 70) { hubo = true; for (let k = i - 2; k <= j + 2; k++) { flags[k] = 1; hr[k] = Math.min(h[k], op[k]); } }
    i = j + 1;
  }
  return hubo ? { flags, hr } : null;
}

// v13.4.2 (generador 29): costo de una curva lateral = 3 por cada bloque de largo + 9 por cada bloque de desnivel entre muestras + 6 por muestra sobre 90 de alto + 400 si cruza más de 46 de mar.
// Se mide cada ~14 bloques (len / 14 muestras por curva, 9 curvas): una vez por tramo y sin buscar obras (structuresNear costaba 4 s la primera vez; las obras ajenas se
// respetan al dibujar, ver buildRoadsInChunk). Todo sale de column(), igual en anfitrión e invitado.
function mejorCurva(gen, ax, az, bx, bz, len, off0, obras) {
  const nx = -(bz - az) / len, nz = (bx - ax) / len, M = Math.max(8, Math.ceil(len / (gen.version >= 30 ? 20 : 14)));
  let mejor = off0, costeMejor = Infinity;
  for (let k = -4; k <= 4; k++) {
    const off = k === 0 ? off0 : (k / 4) * 0.35 * len, mx = (ax + bx) / 2 + nx * off, mz = (az + bz) / 2 + nz * off;
    let cost = 0, px = ax, pz = az, ph = null, mar = 0, run = 0;
    for (let i = 0; i <= M; i++) {
      const t = i / M, u = 1 - t, x = u * u * ax + 2 * u * t * mx + t * t * bx, z = u * u * az + 2 * u * t * mz + t * t * bz;
      const h = gen.column(Math.round(x), Math.round(z)).h;
      cost += 3 * Math.hypot(x - px, z - pz) + (ph === null ? 0 : 9 * Math.abs(h - ph)) + (h > 90 ? 6 : 0);
      if (obras) for (const o of obras) if (Math.abs(x - o.x) < o.r && Math.abs(z - o.z) < o.r) { cost += 60; break; } // v13.5.1: rodear lo ajeno (pueblos y lugares con gente)
      run = h < SEA - 3 ? run + 1 : 0; mar = Math.max(mar, run);
      px = x; pz = z; ph = h;
    }
    if (mar * len / M > 46) cost += 400;
    if (cost < costeMejor - 1e-6) { costeMejor = cost; mejor = off; }
  }
  return mejor;
}

// tramos que pueden pasar por una zona: cada pueblo se une con sus dos vecinos más cercanos (hasta 3 celdas)
function linksOf(gen, gx, gz) {
  gen.roadLinks = gen.roadLinks || new Map();
  const key = `${gx},${gz}`;
  if (gen.roadLinks.has(key)) return gen.roadLinks.get(key);
  const A = villageAt(gen, gx, gz);
  let res = [];
  if (A) {
    const near = [];
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      if (!dx && !dz) continue;
      const B = villageAt(gen, gx + dx, gz + dz);
      if (B) near.push([Math.hypot(B.x - A.x, B.z - A.z), gx + dx, gz + dz]);
    }
    near.sort((p, q) => p[0] - q[0]);
    res = near.filter((n) => n[0] < 900).slice(0, 2).map(([, bx, bz]) => [bx, bz]);
  }
  gen.roadLinks.set(key, res);
  return res;
}

function segmentsIn(gen, gx0, gx1, gz0, gz1) {
  gen.roadCache = gen.roadCache || new Map();
  const res = [], seen = new Set();
  for (let gz = gz0 - 3; gz <= gz1 + 3; gz++) for (let gx = gx0 - 3; gx <= gx1 + 3; gx++) {
    for (const [bx, bz] of linksOf(gen, gx, gz)) {
      // el tramo se nombra por la pareja ordenada (no se repite de ida y de vuelta)
      const [p, q] = gx < bx || (gx === bx && gz < bz) ? [[gx, gz], [bx, bz]] : [[bx, bz], [gx, gz]];
      const key = `${p}>${q}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!gen.roadCache.has(key)) gen.roadCache.set(key, makeSegment(gen, villageAt(gen, p[0], p[1]), villageAt(gen, q[0], q[1])));
      const seg = gen.roadCache.get(key);
      if (seg) res.push(seg);
    }
  }
  // caminos de lastre o cantonales desde el pueblo más cercano hasta cada monumento con gente
  const x0 = gx0 * CELL - 460, x1 = (gx1 + 1) * CELL + 460, z0 = gz0 * CELL - 460, z1 = (gz1 + 1) * CELL + 460;
  // pueblos que pueden arrancar un camino hacia una obra que toque esta zona: el camino sale de un pueblo y no pasa de ~700 bloques de él (obra a <= 450 + curva + salida)
  const REACH = 720, aldeas = [];
  for (let gz = gz0 - 2; gz <= gz1 + 2; gz++) for (let gx = gx0 - 2; gx <= gx1 + 2; gx++) {
    const v = villageAt(gen, gx, gz);
    if (v && v.x > gx0 * CELL - REACH && v.x < (gx1 + 1) * CELL + REACH && v.z > gz0 * CELL - REACH && v.z < (gz1 + 1) * CELL + REACH) aldeas.push(v);
  }
  const cercaDeAldea = (T, gx, gz) => { const ax = gx * T.cell - 450, bx = (gx + 1) * T.cell + 450, az = gz * T.cell - 450, bz = (gz + 1) * T.cell + 450; return aldeas.some((v) => v.x > ax && v.x < bx && v.z > az && v.z < bz); };
  for (const P of aldeas.length || gen.referencia ? structuresNear(gen, (x0 + x1) / 2, (z0 + z1) / 2, Math.max(x1 - x0, z1 - z0) / 2, ROAD_TO, gen.referencia ? null : cercaDeAldea) : []) {
    const key = `s:${P.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!gen.roadCache.has(key)) {
      const sx = Math.floor(P.x / CELL), sz = Math.floor(P.z / CELL);
      let best = null, bd = 450;
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        const v = villageAt(gen, sx + dx, sz + dz);
        if (!v) continue;
        const d = Math.hypot(v.x - P.x, v.z - P.z);
        if (d < bd) { bd = d; best = v; }
      }
      gen.roadCache.set(key, best && bd > 60 ? makeSegment(gen, best, { x: P.x, z: P.z, structR: structRadius(gen, P.type) + 2, streets: null, city: false }) : null);
    }
    const seg = gen.roadCache.get(key);
    if (seg) res.push(seg);
  }
  return res;
}

export function roadsNear(gen, x, z, r) {
  const segs = segmentsIn(gen, Math.floor((x - r) / CELL), Math.floor((x + r) / CELL), Math.floor((z - r) / CELL), Math.floor((z + r) / CELL));
  return segs.filter((s) => s.x1 >= x - r && s.x0 <= x + r && s.z1 >= z - r && s.z0 <= z + r);
}

const TREE_ROAD = new Set([K.log, K.leaves, K.birch_log, K.birch_leaves, K.jungle_log, K.jungle_leaves, K.vine, K.tronco_musgoso]);
const hcol = (s, x, z, k) => (Math.abs((x * 73856093) ^ (z * 19349663) ^ (s * 83492791) ^ (k * 2654435761)) % 100000) / 100000;

export function buildRoadsInChunk(gen, cx, cz, blocks, idx, out) {
  const x0 = cx * CH, z0 = cz * CH;
  const inChunk = (x, z) => x >= x0 && x < x0 + CH && z >= z0 && z < z0 + CH;
  inChunk.x0 = x0; inChunk.z0 = z0; // v13.2.3: el origen del trozo (las placas se anotan con coordenadas locales)
  const set = (x, y, z, id) => { if (inChunk(x, z) && y > 0 && y < 127) blocks[idx(x - x0, y, z - z0)] = id; };
  const get = (x, y, z) => (inChunk(x, z) && y > 0 && y < 127 ? blocks[idx(x - x0, y, z - z0)] : -1);
  for (const seg of roadsNear(gen, x0 + 8, z0 + 8, 12)) {
    const half = (seg.w - 1) / 2, TAL = gen.version >= 29 ? 5 : 0; // v13.4.2 (I10 R2): el talud 1:1 a cada lado
    const cols = new Map();
    for (let i = 0; i < seg.n; i++) {
      const px = seg.xs[i], pz = seg.zs[i];
      if (px < x0 - 4 - TAL || px > x0 + CH + 3 + TAL || pz < z0 - 4 - TAL || pz > z0 + CH + 3 + TAL) continue;
      for (let dz = -3 - TAL; dz <= 3 + TAL; dz++) for (let dx = -3 - TAL; dx <= 3 + TAL; dx++) {
        const d = Math.hypot(dx, dz);
        if (d > half + 0.5 + TAL || !inChunk(px + dx, pz + dz)) continue;
        const k = px + dx + (pz + dz) * 100000;
        const cur = cols.get(k);
        if (!cur || d < cur.d) cols.set(k, { x: px + dx, z: pz + dz, d, i });
      }
    }
    for (const c of cols.values()) {
      if (insideTown(seg.A, c.x, c.z) || insideTown(seg.B, c.x, c.z)) continue;
      const y = seg.ys[c.i], h = gen.column(c.x, c.z).h;
      if (seg.tunel && seg.tunel[c.i]) { // v13.5.1 (R4): túnel. Adentro el aire (4 de alto), paredes y techo de piedra; la loma queda encima
        if (c.d <= half + 1.5) {
          const pared = c.d > half + 0.5;
          for (let yy = y + 1; yy <= y + 4; yy++) set(c.x, yy, c.z, pared ? K.cobble : 0);
          set(c.x, y + 5, c.z, K.cobble);
          if (pared && c.i % 8 === 0) set(c.x, y + 3, c.z, K.farol);
          if (!pared) { set(c.x, y, c.z, c.d < 0.5 && seg.kind === 'nacional' && c.i % 6 < 3 ? K.asfalto_linea : seg.kind === 'lastre' ? K.gravel : K.asfalto); if (get(c.x, y - 1, c.z) === 0) set(c.x, y - 1, c.z, K.dirt); }
        }
        continue;
      }
      if (TAL && c.d > half + 0.5) { // talud: corte o terraplén que se abre 1:1 en vez de la pared
        if (seg.water[c.i]) continue;
        const tc = Math.ceil(c.d - half - 0.5);
        if (h > y + tc) { for (let yy = y + tc + 1; yy <= h + 1; yy++) if (get(c.x, yy, c.z) > 0 && !TREE_ROAD.has(get(c.x, yy, c.z))) set(c.x, yy, c.z, 0); }
        else if (h < y - tc && h > SEA) { for (let yy = h + 1; yy <= y - tc; yy++) set(c.x, yy, c.z, yy === y - tc ? K.grass : K.dirt); }
        continue;
      }
      if (seg.water[c.i]) {
        // puente de un carril: losa de concreto, baranda y pilares
        if (c.d > 2.5) continue;
        set(c.x, y, c.z, K.concreto);
        for (let yy = y + 1; yy <= y + 4; yy++) set(c.x, yy, c.z, 0);
        if (c.d >= 1.5) set(c.x, y + 1, c.z, K.cerca);
        if (c.d >= 1.5 && c.i % 7 === 0) for (let yy = Math.max(1, h - 2); yy < y; yy++) set(c.x, yy, c.z, K.concreto);
        continue;
      }
      for (let yy = Math.min(h, y) + 1; yy < y; yy++) set(c.x, yy, c.z, K.dirt);
      for (let yy = y + 1; yy <= Math.max(y + 6, h); yy++) set(c.x, yy, c.z, 0);
      if (get(c.x, y - 1, c.z) === 0) set(c.x, y - 1, c.z, K.dirt);
      let id;
      if (seg.kind === 'lastre') id = c.d > 0.6 && c.d < 1.4 ? K.dirt : K.gravel;
      else if (seg.kind === 'nacional' && c.d < 0.5 && c.i % 6 < 3) id = K.asfalto_linea;
      else id = K.asfalto;
      // huecos, charcos, parches y grietas
      const ph = hcol(gen.seed, c.x, c.z, 1), rate = seg.kind === 'nacional' ? 0.012 : seg.kind === 'cantonal' ? 0.05 : 0.04;
      if (ph < rate * 0.3) { set(c.x, y - 2, c.z, K.fondo_hueco); set(c.x, y - 1, c.z, 0); id = 0; }
      else if (ph < rate * 0.6) { set(c.x, y - 1, c.z, K.fondo_hueco); id = 0; }
      else if (ph < rate * 0.8) { set(c.x, y - 1, c.z, K.fondo_hueco); id = K.water; }
      else if (ph < rate && seg.kind !== 'lastre') id = [K.asfalto_parche, K.cobble, K.concreto, K.gravel][Math.floor(hcol(gen.seed, c.x, c.z, 2) * 4)];
      else if (ph < rate * 2.2 && seg.kind !== 'lastre') id = K.asfalto_roto;
      set(c.x, y, c.z, id);
      // media grada donde la carretera sube un bloque (se camina sin saltar)
      const up = (j) => j >= 0 && j < seg.n && !seg.water[j] && seg.ys[j] === y + 1;
      if (id && id !== K.water && (up(c.i + 1) || up(c.i - 1))) set(c.x, y + 1, c.z, seg.kind === 'lastre' ? K.losa_piedra : K.losa_asfalto);
    }
    for (const [k, ft] of seg.feats.entries()) drawFeature(gen, seg, ft, k, set, get, inChunk, out);
  }
}

function drawFeature(gen, seg, ft, k, set, get, inChunk, out) {
  const i = ft.i, n = seg.n;
  const a = Math.max(0, i - 3), b = Math.min(n - 1, i + 3);
  let tx = seg.xs[b] - seg.xs[a], tz = seg.zs[b] - seg.zs[a];
  const L = Math.hypot(tx, tz) || 1;
  tx /= L; tz /= L;
  const px = -tz, pz = tx;
  const ox = seg.xs[i], oz = seg.zs[i], oy = seg.ys[i];
  const W = (al, ac) => [Math.round(ox + tx * al + px * ac), Math.round(oz + tz * al + pz * ac)];
  const put = (al, ac, dy, id) => { const [x, z] = W(al, ac); set(x, oy + dy, z, id); };
  const facingTo = (ac) => { const vx = -px * Math.sign(ac), vz = -pz * Math.sign(ac); return Math.abs(vx) > Math.abs(vz) ? (vx > 0 ? 1 : 3) : vz > 0 ? 0 : 2; };
  const placa = (al, ac, dy, title, text) => {
    const [x, z] = W(al, ac);
    set(x, oy + dy, z, K.placa);
    // v13.2.3: coordenadas LOCALES del trozo (antes iban las del mundo: world.ensureChunk calculaba un índice fuera del arreglo lejos del origen y fallaba en cada cuadro)
    if (inChunk(x, z)) out.push({ x: x - inChunk.x0, y: oy + dy, z: z - inChunk.z0, id: K.placa, be: { type: 'placa', facing: facingTo(ac), title, text } });
  };
  const npc = (al, ac, role, name) => {
    const [cx, cz] = W(0, 0);
    if (!inChunk(cx, cz)) return;
    const [x, z] = W(al, ac);
    out.push({ npc: { role, name, x, z, y: oy + 1, vx: x, vz: z, vy: oy + 1, village: `${seg.id}:${k}`, yaw: Math.atan2(-px * Math.sign(ac), -pz * Math.sign(ac)) } });
  };
  const half = (seg.w - 1) / 2, side = Math.ceil(half) + 2;
  const sign = (al, ac, title, text) => { put(al, ac, 1, K.poste); placa(al, ac, 2, title, text); };
  const ground = (al, ac) => { const [x, z] = W(al, ac); return gen.column(x, z).h - oy; };
  if (ft.type === 'rotulo') sign(0, side, ft.text[0], ft.text[1]);
  else if (ft.type === 'crater') {
    for (let al = -2; al <= 2; al++) for (let ac = -2; ac <= 2; ac++) {
      if (Math.hypot(al, ac) > 1.8) continue;
      put(al, ac, 0, ft.wet ? K.water : 0); put(al, ac, -1, ft.wet ? K.water : 0); put(al, ac, -2, K.fondo_hueco);
    }
  } else if (ft.type === 'obra') {
    // tres metros de carretera en reparación, con todo el despliegue
    for (let al = -1; al <= 2; al++) for (let ac = 0; ac <= Math.ceil(half); ac++) { put(al, ac, 0, 0); put(al, ac, -1, K.fondo_hueco); }
    for (let al = -10; al <= 10; al += 2) put(al, -0.2, 1, K.cono);
    for (const al of [-12, 12]) for (let ac = -Math.ceil(half); ac <= Math.ceil(half); ac++) if (ac >= 0) put(al, ac, 1, K.cono);
    for (const [al, ac] of [[4, 1], [5, 1]]) { put(al, ac, 1, K.gravel); put(al, ac, 2, K.gravel); }
    // retroexcavadora amarilla a la orilla
    const m = side + 1;
    for (let al = -2; al <= 1; al++) for (let ac = m; ac <= m + 1; ac++) { put(al, ac, ground(al, ac) + 1, K.maquina); put(al, ac, ground(al, ac) + 2, al < 0 ? K.maquina : al === 0 ? K.glass : 0); }
    for (const [al, ac] of [[-2, m], [1, m], [-2, m + 1], [1, m + 1]]) put(al, ac, ground(al, ac) + 1, K.basalt);
    put(2, m, ground(2, m) + 2, K.cerca); put(3, m, ground(3, m) + 2, K.cerca); put(4, m, ground(4, m) + 1, K.maquina);
    sign(-14, -side, 'Trabajamos para usted', 'Proyecto: reparación de 3 metros de carretera. Inicio: marzo. Avance: 2 %. Fecha de entrega: próximamente.');
    sign(14, -side, 'Obras en proceso', 'Disculpe las molestias. La cuadrilla está esperando el material… y el permiso… y el presupuesto.');
    npc(0, side - 0.5, 'constructor', 'Don Lencho (cuadrilla)');
    npc(-4, side - 0.5, 'constructor', 'Mae Yeiner (cuadrilla)');
    npc(6, -side + 0.5, 'constructor', 'Don Porfirio (el que mira)');
  } else if (ft.type === 'peaje') {
    const m = side;
    for (let al = -1; al <= 1; al++) for (let ac = m; ac <= m + 2; ac++) {
      const g = ground(al, ac);
      for (let dy = Math.min(g, 0) + 1; dy <= 0; dy++) put(al, ac, dy, K.concreto);
      const edge = al !== 0 || ac !== m + 1;
      for (let dy = 1; dy <= 3; dy++) put(al, ac, dy, edge ? (dy === 2 ? K.glass : K.concreto) : 0);
      put(al, ac, 4, K.zinc);
    }
    for (let ac = -Math.ceil(half); ac <= Math.ceil(half); ac++) put(0, ac, 1, K.barrera);
    put(0, m, 2, 0);
    sign(-8, m, 'Peaje', 'Tarifa: 1 colón. Se usa para darle mantenimiento a esta carretera (eso dicen).');
    npc(0, m + 1, 'peajero', 'Doña Grettel (peaje)');
  } else if (ft.type === 'presa') {
    // presa: carros y un bus, uno detrás de otro
    const cols = [K.paint_blue, K.repello_rojo, K.plaster, K.paint_green, K.paint_yellow];
    for (let c = 0; c < 4; c++) {
      const al0 = c * 6, col = cols[(c + i) % cols.length];
      for (let al = al0; al < al0 + 5; al++) for (const ac of [0.6, 1.4]) {
        const wheel = al === al0 || al === al0 + 4;
        put(al, ac, 1, wheel ? K.basalt : col);
        put(al, ac, 2, al === al0 + 1 || al === al0 + 3 ? K.glass : al === al0 + 2 ? col : 0);
      }
    }
    for (let al = 24; al < 35; al++) for (const ac of [0.4, 1.2, 2]) {
      put(al, ac, 1, al === 25 || al === 33 ? K.basalt : K.paint_yellow);
      put(al, ac, 2, al % 2 ? K.glass : K.paint_yellow);
      put(al, ac, 3, K.plaster);
    }
    sign(-6, -side, 'Presa', 'Tiempo estimado: lo que Dios quiera. Aproveche para comprar un vigorón al vendedor de la orilla.');
    npc(30, -side + 0.5, 'chofer', 'Don Memo (chofer del bus)');
  } else if (ft.type === 'derrumbe') {
    for (let al = -4; al <= 4; al++) for (let ac = -1; ac <= Math.ceil(half) + 1; ac++) {
      const hgt = Math.round(2.4 - Math.abs(al) * 0.4 + (ac - 1) * 0.3);
      for (let dy = 1; dy <= hgt; dy++) put(al, ac, dy, (al + ac + dy) % 3 ? K.dirt : K.cobble);
    }
    sign(-7, -side, 'Derrumbe', 'Paso regulado. El tractor viene en camino desde la semana pasada.');
  }
}
