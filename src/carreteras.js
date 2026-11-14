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
  const off = (hash3(s, ax, 7071, az) - 0.5) * 0.5 * len;
  const mx = (ax + bx) / 2 + (-(bz - az) / len) * off, mz = (az + bz) / 2 + ((bx - ax) / len) * off;
  const N = Math.ceil(len * 1.3);
  const xs = [], zs = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = Math.round(u * u * ax + 2 * u * t * mx + t * t * bx), z = Math.round(u * u * az + 2 * u * t * mz + t * t * bz);
    if (xs.length && xs[xs.length - 1] === x && zs[zs.length - 1] === z) continue;
    xs.push(x); zs.push(z);
  }
  const n = xs.length;
  const h = xs.map((x, i) => gen.column(x, zs[i]).h);
  // agua honda: puente; agua baja (lagunas, manglar): relleno de tierra a la altura del mar
  const water = h.map((v) => v < SEA - 3);
  // no se hacen carreteras que crucen el mar
  let run = 0;
  for (const w of water) { run = w ? run + 1 : 0; if (run > 46) return null; }
  const ys = h.map((_, i) => {
    if (water[i]) return SEA + 1;
    let sum = 0, c = 0;
    for (let k = Math.max(0, i - 5); k <= Math.min(n - 1, i + 5); k++) if (!water[k]) { sum += Math.max(h[k], SEA + 1); c++; }
    return Math.max(SEA + 1, Math.round(sum / c));
  });
  const kind = A.city && B.city ? 'nacional' : !A.streets || !B.streets ? (hid < 0.6 ? 'lastre' : 'cantonal') : hid < 0.45 ? 'nacional' : 'cantonal';
  const seg = { id: `ruta@${ax},${az}`, xs, zs, ys, water, n, kind, w: kind === 'nacional' ? 5 : kind === 'cantonal' ? 4 : 3, A, B, feats: [] };
  seg.x0 = Math.min(...xs) - 8; seg.x1 = Math.max(...xs) + 8; seg.z0 = Math.min(...zs) - 8; seg.z1 = Math.max(...zs) + 8;
  // lo que pasa en la carretera
  const f = (k) => hash3(s, ax + k, 7100, az);
  const land = (i) => i > 8 && i < n - 9 && !water[i] && !water[i - 6] && !water[i + 6];
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
  for (const P of structuresNear(gen, (x0 + x1) / 2, (z0 + z1) / 2, Math.max(x1 - x0, z1 - z0) / 2, ROAD_TO)) {
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

const hcol = (s, x, z, k) => (Math.abs((x * 73856093) ^ (z * 19349663) ^ (s * 83492791) ^ (k * 2654435761)) % 100000) / 100000;

export function buildRoadsInChunk(gen, cx, cz, blocks, idx, out) {
  const x0 = cx * CH, z0 = cz * CH;
  const inChunk = (x, z) => x >= x0 && x < x0 + CH && z >= z0 && z < z0 + CH;
  const set = (x, y, z, id) => { if (inChunk(x, z) && y > 0 && y < 127) blocks[idx(x - x0, y, z - z0)] = id; };
  const get = (x, y, z) => (inChunk(x, z) && y > 0 && y < 127 ? blocks[idx(x - x0, y, z - z0)] : -1);
  for (const seg of roadsNear(gen, x0 + 8, z0 + 8, 12)) {
    const half = (seg.w - 1) / 2;
    const cols = new Map();
    for (let i = 0; i < seg.n; i++) {
      const px = seg.xs[i], pz = seg.zs[i];
      if (px < x0 - 4 || px > x0 + CH + 3 || pz < z0 - 4 || pz > z0 + CH + 3) continue;
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
        const d = Math.hypot(dx, dz);
        if (d > half + 0.5 || !inChunk(px + dx, pz + dz)) continue;
        const k = px + dx + (pz + dz) * 100000;
        const cur = cols.get(k);
        if (!cur || d < cur.d) cols.set(k, { x: px + dx, z: pz + dz, d, i });
      }
    }
    for (const c of cols.values()) {
      if (insideTown(seg.A, c.x, c.z) || insideTown(seg.B, c.x, c.z)) continue;
      const y = seg.ys[c.i], h = gen.column(c.x, c.z).h;
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
    if (inChunk(x, z)) out.push({ x, y: oy + dy, z, id: K.placa, be: { type: 'placa', facing: facingTo(ac), title, text } });
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
