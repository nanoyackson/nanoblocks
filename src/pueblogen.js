// Generación de pueblos ticos (sin gráficos: también la usa el hilo del horizonte lejano).
// Plaza de fútbol, iglesia con campanario, pulpería, soda, parada de bus y casitas de colores con techo de teja.
import { hash3, mulberry32 } from './noise.js';
import { BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { planVillage6, buildStreets, buildKind6 } from './pueblo6.js';

export const CELL = 384;
const SEA = 62;
const TREE = new Set([K.log, K.leaves, K.birch_log, K.birch_leaves, K.jungle_log, K.jungle_leaves, K.vine]);

// v13.3.0 (I1, generador 24): suelo firme bajo lo construido. `toc` trae por columna del trozo el bloque más bajo que escribió la obra (32767 = ninguno): si debajo
// quedó un vacío de hasta 14 bloques con roca firme al fondo (un hueco de cueva que la obra dejó colgando), se rellena con piedra. No toca el agua ni lo hondo.
export function rellenarBajoObras(blocks, idx, toc) {
  for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
    const t = toc[lx + lz * 16];
    if (t === 32767 || t <= 3) continue;
    let y = t - 1, n = 0;
    while (y >= 1 && n <= 14 && blocks[idx(lx, y, lz)] === 0) { y--; n++; }
    if (n === 0 || n > 14 || y < 1 || !SOLID[blocks[idx(lx, y, lz)]]) continue;
    for (let k = 1; k <= n; k++) blocks[idx(lx, y + k, lz)] = K.cobble;
  }
}

// ---------- elegir dónde hay pueblo ----------
export function villageAt(gen, cx, cz) {
  const key = `${cx},${cz}`;
  gen.villageCache = gen.villageCache || new Map();
  if (gen.villageCache.has(key)) return gen.villageCache.get(key);
  let v = null;
  const s = gen.seed;
  const v6 = gen.version >= 6, m = v6 ? 110 : 70;
  if (hash3(s, cx, 9191, cz) < 0.45) {
    const x = Math.floor(cx * CELL + m + hash3(s, cx, 1, cz) * (CELL - 2 * m));
    const z = Math.floor(cz * CELL + m + hash3(s, cx, 2, cz) * (CELL - 2 * m));
    const c = gen.column(x, z);
    const ok = (v6 ? ['plains', 'forest', 'jungle', 'bosque_seco'] : ['plains', 'forest', 'jungle']).includes(c.biome) && c.h > SEA + 2 && c.h < 92;
    let flat = ok;
    if (ok) for (const [dx, dz] of [[20, 0], [-20, 0], [0, 20], [0, -20], [14, 14], [-14, -14]]) if (Math.abs(gen.column(x + dx, z + dz).h - c.h) > 7) flat = false;
    if (flat) v = (v6 && planVillage6(gen, x, z, c.h, hash3(s, cx, 3, cz))) || planVillage(gen, x, z, c.h, hash3(s, cx, 3, cz));
  }
  gen.villageCache.set(key, v);
  return v;
}

const COLORS = ['paint_blue', 'paint_green', 'paint_yellow', 'paint_pink', 'adobe', 'plaster'];

function planVillage(gen, x, z, y, r) {
  const rnd = mulberry32(Math.floor(r * 1e9));
  const v = { id: `${x},${z}`, x, z, y, buildings: [], npcs: [] };
  // plaza de fútbol en el centro
  v.buildings.push({ kind: 'plaza', x: x - 9, z: z - 6, w: 19, d: 13 });
  // iglesia al norte de la plaza, mirando a la plaza
  v.buildings.push({ kind: 'iglesia', x: x - 5, z: z - 22, w: 11, d: 14, face: 0 });
  // pulpería al este y soda al oeste
  v.buildings.push({ kind: 'pulperia', x: x + 13, z: z - 4, w: 8, d: 8, face: 3, color: 'paint_yellow' });
  v.buildings.push({ kind: 'soda', x: x - 21, z: z - 4, w: 8, d: 8, face: 1, color: 'paint_green' });
  // parada de bus al sur de la plaza
  v.buildings.push({ kind: 'parada', x: x + 2, z: z + 10, w: 5, d: 3 });
  // casitas alrededor
  const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.4 + 0.3;
    const rad = 26 + rnd() * 10;
    const hx = Math.floor(x + Math.cos(a) * rad), hz = Math.floor(z + Math.sin(a) * rad);
    const w = 6 + Math.floor(rnd() * 2), d = 6 + Math.floor(rnd() * 2);
    // la puerta mira hacia la plaza
    const dx = x - hx, dz = z - hz;
    const face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 1 : 3) : (dz > 0 ? 0 : 2);
    v.buildings.push({ kind: 'casa', x: hx - Math.floor(w / 2), z: hz - Math.floor(d / 2), w, d, face, color: COLORS[Math.floor(rnd() * COLORS.length)] });
  }
  // altura del piso de cada edificio: la del terreno en su centro (con cimientos)
  for (const b of v.buildings) b.y = b.kind === 'plaza' || b.kind === 'parada' ? y : Math.max(SEA + 1, gen.column(b.x + Math.floor(b.w / 2), b.z + Math.floor(b.d / 2)).h);
  { const ig = v.buildings[1]; const H = 7; v.bell = { x: ig.x + Math.floor(ig.w / 2), y: ig.y + H + 5, z: ig.face === 0 ? ig.z - 2 : ig.z + ig.d + 1 }; }
  // vecinos: el pulpero, la beata de la iglesia y uno por casa
  const mix = (a) => a.map((n) => [rnd(), n]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const men = mix(['Don Chepe', 'Don Beto', 'Mae Kevin', 'Don Rigo', 'Don Memo', 'Jefry', 'Don Tito', 'Maikol', 'Don Lalo', 'Brayan', 'Don Toño', 'Abuelo Pancho']);
  const women = mix(['Doña Lucía', 'Maritza', 'Doña Flor', 'Yorleny', 'Cindy', 'Doña Toña', 'Abuela Chayo', 'Pamela', 'Doña Mireya', 'Kimberly', 'Doña Cuca', 'Hazel']);
  let mi = 0, wi = 0;
  const pul = v.buildings[2];
  v.npcs.push({ role: 'pulpero', name: 'Don Mario (pulpero)', x: pul.x + 5, z: pul.z + 4, home: 2 });
  const soda = v.buildings[3];
  v.npcs.push({ role: 'sodera', name: 'Doña Rosa (soda)', x: soda.x + 4, z: soda.z + 4, home: 3 });
  const igl = v.buildings[1];
  v.npcs.push({ role: 'beata', name: women[wi++], x: igl.x + 5, z: igl.z + 7, home: 1 });
  v.buildings.forEach((b, i) => {
    if (b.kind !== 'casa') return;
    const role = rnd() < 0.3 ? 'sabanero' : 'vecino';
    const name = role === 'sabanero' || rnd() < 0.5 ? men[mi++ % men.length] : women[wi++ % women.length];
    v.npcs.push({ role, name, x: b.x + Math.floor(b.w / 2), z: b.z + Math.floor(b.d / 2), home: i });
  });
  return v;
}

// ---------- construir lo que cae dentro de un chunk ----------
export function buildVillageInChunk(gen, cx, cz, blocks, idx) {
  const x0 = cx * 16, z0 = cz * 16;
  const out = [];
  const toc = gen.version >= 24 ? new Int16Array(256).fill(32767) : null; // v13.3.0 (I1): lo más bajo que escribió la obra en cada columna
  const vcx = Math.floor((x0 + 8) / CELL), vcz = Math.floor((z0 + 8) / CELL);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = villageAt(gen, vcx + dx, vcz + dz);
    if (!v) continue;
    const VR = v.R || 46;
    if (Math.abs(v.x - (x0 + 8)) > VR + 24 || Math.abs(v.z - (z0 + 8)) > VR + 24) continue;
    const set = (wx, wy, wz, id) => {
      const lx = wx - x0, lz = wz - z0;
      if (lx < 0 || lx >= 16 || lz < 0 || lz >= 16 || wy < 1 || wy >= 128) return;
      blocks[idx(lx, wy, lz)] = id;
      if (toc && id !== 0 && wy < toc[lx + lz * 16]) toc[lx + lz * 16] = wy;
    };
    const get = (wx, wy, wz) => {
      const lx = wx - x0, lz = wz - z0;
      if (lx < 0 || lx >= 16 || lz < 0 || lz >= 16) return -1;
      return blocks[idx(lx, wy, lz)];
    };
    const inChunk = (wx, wz) => wx >= x0 && wx < x0 + 16 && wz >= z0 && wz < z0 + 16;
    // despejar los árboles dentro del pueblo (troncos y hojas que quedarían flotando)
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      const wx = x0 + lx, wz = z0 + lz;
      if (v.R ? Math.max(Math.abs(wx - v.x), Math.abs(wz - v.z)) > VR : Math.hypot(wx - v.x, wz - v.z) > 46) continue;
      const hh = gen.column(wx, wz).h;
      for (let yy = hh + 1; yy < Math.min(128, hh + 26); yy++) if (TREE.has(blocks[idx(lx, yy, lz)])) blocks[idx(lx, yy, lz)] = 0;
    }
    // caminos de grava desde la plaza a cada edificio
    const c6 = { gen, set, get, inChunk, out, door: (dx, dy, dz, f) => door(set, out, dx, dy, dz, f, inChunk), foundation: (b) => foundation(gen, b, set, inChunk) };
    if (v.streets) buildStreets(c6, v);
    for (const b of v.streets ? [] : v.buildings) {
      if (b.kind === 'plaza') continue;
      const tx = b.x + Math.floor(b.w / 2), tz = b.z + Math.floor(b.d / 2);
      let px = v.x, pz = v.z;
      const steps = Math.abs(tx - px) + Math.abs(tz - pz);
      for (let k = 0; k < steps; k++) {
        if (px !== tx) px += Math.sign(tx - px); else pz += Math.sign(tz - pz);
        if (!inChunk(px, pz) && !inChunk(px + 1, pz)) continue;
        for (const ox of [0, 1]) {
          const hh = gen.column(px + ox, pz).h;
          if (hh < SEA) {
            // v13.3.0 (I2): el camino del caserío cruza el agua por un puentecito de tablones
            if (gen.version >= 24 && hh >= SEA - 8) { set(px + ox, SEA, pz, K.planks); for (let y = SEA + 1; y < SEA + 5; y++) if (get(px + ox, y, pz) > 0) set(px + ox, y, pz, 0); }
            continue;
          }
          set(px + ox, hh, pz, K.gravel);
          for (let y = hh + 1; y < hh + 7; y++) if (get(px + ox, y, pz) > 0) set(px + ox, y, pz, 0);
        }
      }
    }
    for (const b of v.buildings) if (!buildKind6(c6, b)) buildOne(gen, b, set, get, inChunk, out);
    // vecinos: se anotan cuando se carga el chunk del centro del pueblo
    if (inChunk(v.x, v.z)) for (const n of v.npcs) out.push({ npc: { ...n, village: v.id, vx: v.x, vz: v.z, vy: v.y + 1, y: (v.buildings[n.home] || v.buildings[0]).y + 1, bell: v.bell } });
  }
  if (toc) rellenarBajoObras(blocks, idx, toc);
  // las estructuras van en coordenadas del chunk
  for (const o of out) if (o.be) { o.x -= x0; o.z -= z0; }
  return out;
}

function foundation(gen, b, set, inChunk) {
  for (let z = b.z - 1; z <= b.z + b.d; z++) for (let x = b.x - 1; x <= b.x + b.w; x++) {
    if (!inChunk(x, z)) continue;
    const h = gen.column(x, z).h;
    for (let y = Math.min(h, b.y); y < b.y; y++) set(x, y, z, K.cobble);
    for (let y = b.y + 1; y < b.y + 14; y++) set(x, y, z, 0); // despejar árboles y lomas
    set(x, b.y, z, x === b.x - 1 || z === b.z - 1 || x === b.x + b.w || z === b.z + b.d ? K.grass : K.planks);
  }
}

// coloca la puerta (2 bloques) con su orientación
function door(set, out, x, y, z, facing, inChunk) {
  set(x, y, z, K.door_lower); set(x, y + 1, z, K.door_upper);
  if (inChunk(x, z)) out.push({ x, y, z, id: K.door_lower, be: { type: 'door', facing, hinge: 0, open: false } });
}

function buildOne(gen, b, set, get, inChunk, out) {
  const { x, z, w, d, y } = b;
  if (b.kind === 'plaza') {
    // cancha de fútbol: pasto, líneas de cal, marcos de madera
    for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) {
      if (!inChunk(xx, zz)) continue;
      const h = gen.column(xx, zz).h;
      for (let yy = Math.min(h, y); yy < y; yy++) set(xx, yy, zz, K.dirt);
      for (let yy = y + 1; yy < y + 10; yy++) set(xx, yy, zz, 0);
      const line = xx === x || xx === x + w - 1 || zz === z || zz === z + d - 1 || xx === x + Math.floor(w / 2);
      set(xx, y, zz, line ? K.calcite : K.grass);
    }
    for (const gx of [x + 1, x + w - 2]) {
      const mz = z + Math.floor(d / 2);
      for (const gz of [mz - 2, mz + 2]) for (let yy = y + 1; yy <= y + 2; yy++) set(gx, yy, gz, K.wool);
      for (let gz = mz - 2; gz <= mz + 2; gz++) set(gx, y + 3, gz, K.wool);
    }
    // faroles en las esquinas
    for (const [lx, lz] of [[x - 1, z - 1], [x + w, z - 1], [x - 1, z + d], [x + w, z + d]]) {
      for (let yy = y + 1; yy <= y + 2; yy++) set(lx, yy, lz, K.cobble);
      set(lx, y + 3, lz, K.lamp);
    }
    if (gen.version >= 19) set(x - 1, y + 1, z + Math.floor(d / 2), K.tablon_encargos); // v12.4.12 (C8-A): el tablón de encargos
    return;
  }
  if (b.kind === 'parada') {
    // techito de teja sobre cuatro postes, banca y rótulo
    for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) {
      if (!inChunk(xx, zz)) continue;
      const h = gen.column(xx, zz).h;
      for (let yy = Math.min(h, y); yy < y; yy++) set(xx, yy, zz, K.cobble);
      for (let yy = y + 1; yy < y + 6; yy++) set(xx, yy, zz, 0);
      set(xx, y, zz, K.cobble);
      set(xx, y + 4, zz, K.teja);
    }
    for (const [px2, pz2] of [[x, z], [x + w - 1, z], [x, z + d - 1], [x + w - 1, z + d - 1]]) for (let yy = y + 1; yy <= y + 3; yy++) set(px2, yy, pz2, K.log);
    for (let xx = x + 1; xx < x + w - 1; xx++) set(xx, y + 1, z + d - 1, K.planks);
    set(x + w, y + 1, z, K.log); set(x + w, y + 2, z, K.log); set(x + w, y + 3, z, K.paint_yellow);
    return;
  }
  foundation(gen, b, set, inChunk);
  const wallId = b.kind === 'iglesia' ? K.plaster : K[b.color] || K.adobe;
  const H = b.kind === 'iglesia' ? 7 : 4;
  // paredes con ventanas
  for (let zz = z; zz < z + d; zz++) for (let xx = x; xx < x + w; xx++) {
    const edge = xx === x || xx === x + w - 1 || zz === z || zz === z + d - 1;
    for (let yy = y + 1; yy <= y + H; yy++) {
      if (!edge) { set(xx, yy, zz, 0); continue; }
      const corner = (xx === x || xx === x + w - 1) && (zz === z || zz === z + d - 1);
      const win = !corner && yy === y + 2 && (((xx + zz) % 3 + 3) % 3 === 0);
      set(xx, yy, zz, corner ? K.log : win ? K.glass : wallId);
    }
  }
  // techo de teja escalonado (cae hacia los lados)
  const ridgeAlongX = w >= d;
  const half = Math.ceil((ridgeAlongX ? d : w) / 2);
  for (let k = 0; k <= half; k++) {
    const yy = y + H + 1 + Math.floor(k * 0.7);
    for (let zz = z - 1; zz <= z + d; zz++) for (let xx = x - 1; xx <= x + w; xx++) {
      const dist = ridgeAlongX ? Math.min(zz - (z - 1), z + d - zz) : Math.min(xx - (x - 1), x + w - xx);
      if (dist === k) set(xx, yy, zz, K.teja);
      else if (dist > k && Math.floor(k * 0.7) !== Math.floor((k + 1) * 0.7)) set(xx, yy, zz, K.teja);
    }
  }
  // puerta en el lado que mira a la plaza (facing: 0 +z, 1 +x, 2 -z, 3 -x)
  const f = b.face ?? 0;
  const mid = (len) => Math.floor(len / 2);
  const dpos = f === 0 ? [x + mid(w), z + d - 1] : f === 1 ? [x + w - 1, z + mid(d)] : f === 2 ? [x + mid(w), z] : [x, z + mid(d)];
  door(set, out, dpos[0], y + 1, dpos[1], f, inChunk);
  // por dentro
  if (b.kind === 'casa') {
    set(x + 1, y + 1, z + 1, K.bed); if (inChunk(x + 1, z + 1)) out.push({ x: x + 1, y: y + 1, z: z + 1, id: K.bed, be: { type: 'bed', facing: 0 } });
    set(x + w - 2, y + 1, z + 1, K.table); if (inChunk(x + w - 2, z + 1)) out.push({ x: x + w - 2, y: y + 1, z: z + 1, id: K.table, be: { type: 'table', grid: new Array(9).fill(null) } });
    set(x + w - 2, y + 1, z + d - 2, K.stove); if (inChunk(x + w - 2, z + d - 2)) out.push({ x: x + w - 2, y: y + 1, z: z + d - 2, id: K.stove, be: { type: 'stove', facing: 0, grid: new Array(9).fill(null) } });
    set(x + 1, y + 3, z + d - 2, K.lamp);
  } else if (b.kind === 'pulperia') {
    // la puerta da a la plaza (lado -x): clientes, mostrador, pulpero y estantes llenos al fondo
    for (let zz = z + 2; zz < z + d - 2; zz++) set(x + 4, y + 1, zz, K.planks); // mostrador
    for (let zz = z + 1; zz < z + d - 1; zz++) { set(x + w - 2, y + 1, zz, K.bookshelf); set(x + w - 2, y + 2, zz, K.bookshelf); }
    set(x + 2, y + 4, z + 2, K.lamp); set(x + 2, y + 4, z + d - 3, K.lamp);
  } else if (b.kind === 'soda') {
    // mesitas con banquitos, fogón y mostrador
    for (const [tx, tz] of [[x + 2, z + 2], [x + 2, z + d - 3], [x + 5, z + 2]]) { set(tx, y + 1, tz, K.planks); set(tx + 1, y + 1, tz, K.wool); }
    set(x + w - 2, y + 1, z + d - 2, K.stove); if (inChunk(x + w - 2, z + d - 2)) out.push({ x: x + w - 2, y: y + 1, z: z + d - 2, id: K.stove, be: { type: 'stove', facing: 3, grid: new Array(9).fill(null) } });
    set(x + 3, y + 4, z + 3, K.lamp);
  } else if (b.kind === 'iglesia') {
    for (let zz = z + 3; zz < z + d - 2; zz += 2) for (let xx = x + 2; xx < x + w - 2; xx++) if (xx !== x + mid(w)) set(xx, y + 1, zz, K.planks); // bancas
    const az = f === 0 ? z + 1 : z + d - 2;
    set(x + mid(w), y + 1, az, K.calcite); set(x + mid(w), y + 2, az, K.lamp);
    // campanario
    const bx = x + mid(w) - 1, bz = f === 0 ? z - 3 : z + d;
    for (let zz = bz; zz < bz + 3; zz++) for (let xx = bx; xx < bx + 3; xx++) if (inChunk(xx, zz)) for (let yy = Math.min(gen.column(xx, zz).h, y); yy < y; yy++) set(xx, yy, zz, K.cobble);
    for (let yy = y; yy <= y + H + 6; yy++) for (let zz = bz; zz < bz + 3; zz++) for (let xx = bx; xx < bx + 3; xx++) {
      const edge = xx === bx || xx === bx + 2 || zz === bz || zz === bz + 2;
      set(xx, yy, zz, yy === y ? K.cobble : edge ? (yy > y + H + 3 && (xx === bx + 1 || zz === bz + 1) ? 0 : K.plaster) : 0);
    }
    for (let zz = bz; zz < bz + 3; zz++) for (let xx = bx; xx < bx + 3; xx++) set(xx, y + H + 7, zz, K.teja);
    set(bx + 1, y + H + 5, bz + 1, K.lamp);
  }
}

