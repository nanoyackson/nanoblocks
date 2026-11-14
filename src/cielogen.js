// Generador de la dimensión de las Tierras del Cielo: islas flotantes con pasto, árboles y flores sobre un mar
// de nubes blandas (se puede caminar encima), y templos de piedra celeste con oro y jade en algunas islas.
// Sin gráficos (lo puede usar un worker).
import { Simplex, hash3, mulberry32 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

const CH = 16;
const idx = (x, y, z) => x + z * CH + y * CH * CH;
const CELL = 72;
export const CLOUD_Y = 24;

function noises(gen) {
  if (!gen.skyN) { const s = gen.seed ^ 0x5c1e5; gen.skyN = { a: new Simplex(s), b: new Simplex(s ^ 0x31), c: new Simplex(s ^ 0x62) }; }
  return gen.skyN;
}

// una isla por celda (a veces ninguna): centro, radio, altura
export function islandIn(gen, gx, gz) {
  gen.skyCache = gen.skyCache || new Map();
  const k = `${gx},${gz}`;
  if (gen.skyCache.has(k)) return gen.skyCache.get(k);
  const s = gen.seed;
  let isl = null;
  if (hash3(s, gx, 2121, gz) < 0.82 || (gx === 0 && gz === 0)) {
    isl = {
      x: gx * CELL + 16 + hash3(s, gx, 1, gz) * (CELL - 32), z: gz * CELL + 16 + hash3(s, gx, 2, gz) * (CELL - 32),
      y: 52 + Math.floor(hash3(s, gx, 3, gz) * 46), r: 9 + hash3(s, gx, 4, gz) * 15, temple: hash3(s, gx, 5, gz) < 0.18,
    };
    if (gx === 0 && gz === 0) { isl.x = 0; isl.z = 0; isl.y = 70; isl.r = 20; isl.temple = false; }
  }
  gen.skyCache.set(k, isl);
  return isl;
}

export function columnCielo(gen, x, z) {
  const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL);
  let top = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const isl = islandIn(gen, gx + dx, gz + dz);
    if (!isl) continue;
    const d = Math.hypot(x - isl.x, z - isl.z);
    if (d < isl.r) top = Math.max(top, isl.y + Math.floor((1 - d / isl.r) * 3));
  }
  return { h: top || CLOUD_Y, biome: 'cielo', temp: 0.2, wet: 0.2, island: !!top };
}

export function genCielo(gen, cx, cz, blocks) {
  const n = noises(gen);
  const x0 = cx * CH, z0 = cz * CH;
  const out = [];
  const gx0 = Math.floor((x0 - 30) / CELL), gx1 = Math.floor((x0 + CH + 30) / CELL);
  const gz0 = Math.floor((z0 - 30) / CELL), gz1 = Math.floor((z0 + CH + 30) / CELL);
  // mar de nubes blandas abajo (con huecos por donde se ve el vacío)
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const wx = x0 + lx, wz = z0 + lz;
    const v = n.a.fbm2(wx * 0.02, wz * 0.02, 3);
    if (v > -0.18) {
      const th = 1 + Math.floor(Math.max(0, v + 0.18) * 4);
      for (let y = CLOUD_Y - th + 1; y <= CLOUD_Y; y++) blocks[idx(lx, y, lz)] = K.nube;
    }
  }
  for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) {
    const isl = islandIn(gen, gx, gz);
    if (!isl) continue;
    const R = isl.r, depth = R * 0.9;
    for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
      const wx = x0 + lx, wz = z0 + lz;
      const d = Math.hypot(wx - isl.x, wz - isl.z);
      const edge = R + n.b.noise2(wx * 0.1, wz * 0.1) * 3;
      if (d > edge) continue;
      const k = 1 - d / edge;
      const top = isl.y + Math.floor(k * 3);
      // la isla es como un trompo: ancha arriba y en punta abajo
      const bottom = isl.y - Math.floor(Math.sqrt(k) * depth * (0.7 + n.c.noise2(wx * 0.08, wz * 0.08) * 0.3));
      for (let y = bottom; y <= top; y++) {
        let id = y === top ? K.grass : y > top - 3 ? K.dirt : hash3(gen.seed, wx, y, wz) < 0.05 ? K.jade_ore || K.piedra_cielo : K.piedra_cielo;
        if (y === bottom && k < 0.5 && hash3(gen.seed, wx, 77, wz) < 0.3) id = K.nube;
        blocks[idx(lx, y, lz)] = id;
      }
      // pasto, flores y arbolitos
      const r = hash3(gen.seed, wx, 999, wz);
      if (k > 0.15 && blocks[idx(lx, top + 1, lz)] === 0) {
        if (r < 0.012 && !isl.temple) {
          for (let y = top + 1; y <= top + 5; y++) blocks[idx(lx, y, lz)] = K.log;
        } else if (r < 0.1) blocks[idx(lx, top + 1, lz)] = r < 0.04 ? K.flower_red : r < 0.07 ? K.flower_yellow : K.tall_grass;
      }
    }
    // copas de los arbolitos (pueden cruzar el borde del chunk)
    for (let dz = -Math.ceil(R); dz <= Math.ceil(R); dz++) for (let dx = -Math.ceil(R); dx <= Math.ceil(R); dx++) {
      const wx = Math.floor(isl.x) + dx, wz = Math.floor(isl.z) + dz;
      if (hash3(gen.seed, wx, 999, wz) >= 0.012 || isl.temple) continue;
      const d = Math.hypot(wx - isl.x, wz - isl.z);
      if (d > R * 0.85) continue;
      const top = isl.y + Math.floor((1 - d / (R + 1)) * 3);
      for (let ly = -1; ly <= 1; ly++) for (let lz2 = -2; lz2 <= 2; lz2++) for (let lx2 = -2; lx2 <= 2; lx2++) {
        if (Math.hypot(lx2, ly * 1.5, lz2) > 2.3) continue;
        const bx = wx + lx2 - x0, bz = wz + lz2 - z0, by = top + 6 + ly;
        if (bx < 0 || bx >= CH || bz < 0 || bz >= CH) continue;
        if (blocks[idx(bx, by, bz)] === 0) blocks[idx(bx, by, bz)] = K.leaves;
      }
    }
    if (isl.temple) templo(gen, isl, x0, z0, blocks, out);
  }
  return out;
}

// templo de piedra celeste con columnas de oro y un cofre en el centro
function templo(gen, isl, x0, z0, blocks, out) {
  const cx = Math.floor(isl.x), cz = Math.floor(isl.z), base = isl.y + 3;
  const set = (x, y, z, id) => { const bx = x - x0, bz = z - z0; if (bx < 0 || bx >= CH || bz < 0 || bz >= CH || y < 1 || y > 126) return; blocks[idx(bx, y, bz)] = id; };
  for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
    set(cx + dx, base, cz + dz, Math.abs(dx) === 5 || Math.abs(dz) === 5 ? K.piedra_cielo : (dx + dz) % 2 ? K.calcite : K.piedra_cielo);
    for (let y = base + 1; y <= base + 7; y++) set(cx + dx, y, cz + dz, 0);
    if (Math.abs(dx) <= 4 && Math.abs(dz) <= 4) set(cx + dx, base + 7, cz + dz, Math.abs(dx) === 4 || Math.abs(dz) === 4 ? K.oro_volcanico : K.piedra_cielo);
  }
  for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, -4], [0, 4], [-4, 0], [4, 0]]) for (let y = base + 1; y <= base + 6; y++) set(cx + dx, y, cz + dz, y === base + 6 ? K.oro_volcanico : K.calcite);
  set(cx, base + 1, cz, K.chest);
  if (cx - x0 >= 0 && cx - x0 < CH && cz - z0 >= 0 && cz - z0 < CH) {
    const rnd = mulberry32(cx * 31 + cz * 17 + gen.seed);
    const pool = [[278, 1, 2], [274, 1, 2], [273, 2, 5], [369, 1, 3], [259, 2, 6], [285, 1, 1], [380, 1, 2], [388, 1, 1]];
    const slots = new Array(27).fill(null);
    for (let k = 0; k < 6; k++) { const [id, a, b] = pool[Math.floor(rnd() * pool.length)]; let i = Math.floor(rnd() * 27); while (slots[i]) i = (i + 1) % 27; slots[i] = { id, count: a + Math.floor(rnd() * (b - a + 1)) }; }
    out.push({ x: cx - x0, y: base + 1, z: cz - z0, id: K.chest, be: { type: 'chest', facing: 0, slots } });
  }
  set(cx, base + 6, cz, K.lamp);
}
