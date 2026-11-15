// Generador v2 (mundos nuevos desde la v1.3): cuevas ricas y profundas, roca profunda, lagos subterráneos,
// lagos de lava, espeleotemas, zonas de musgo y hongos brillantes, geodas de cuarzo, ruinas con botín,
// esferas de piedra precolombinas, selva tropical y volcanes con cráter de lava.
import { Simplex, mulberry32, hash3 } from './noise.js';
import { guanacasteShape } from './estructuras.js';
import { BLOCK_BY_KEY as K, OPAQUE, TOOL_IDS, ARMOR_IDS, ITEMS } from './blocks.js';

export const CHUNK = 16;
export const HEIGHT = 128;
export const SEA = 62;
const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;

const VOLCANO_CELL = 640;
// v13.1.0 (C1 de cuevas): el cavado nuevo (generador 22). Todo lo de abajo solo corre con gen.version >= GEN_CUEVAS; los mundos 21 o
// menos se generan igual que siempre. Todo sale de la semilla (Simplex con seed y hash3), nunca de Math.random: cada máquina genera igual.
export const GEN_CUEVAS = 22;
// v13.2.0 (generador 23): lo hondo es más caliente. Lagos y charcos de lava por zonas (mismo molde que el agua por cuencas), cada vez
// más frecuentes y más altos conforme se baja. Los mundos 22 o menos no pasan por aquí: salen idénticos. Solo hash3 y Simplex (sin Math.random).
export const GEN_PROF = 23;
export const LAVA_TOPE = 30, LAVA_FONDO = 10;
const LAVA_ZONA = 28, LAVA_PROB = 0.75;
const BOCA_CELDA = 16, BOCA_PROB = 0.9, QUESO_BASE = 0.55, QUESO_PEND = 0.62, ESP_BASE = 0.05, ESP_PEND = 0.03;

export class GenV2 {
  constructor(gen) {
    this.gen = gen; // generador base (columnas, ruidos)
    const s = gen.seed;
    this.nNoodleA = new Simplex(s ^ 0x1111);
    this.nNoodleB = new Simplex(s ^ 0x2222);
    this.nAquifer = new Simplex(s ^ 0x3333);
    this.nLush = new Simplex(s ^ 0x4444);
    this.nDrip = new Simplex(s ^ 0x5555);
    this.nDeep = new Simplex(s ^ 0x6666);
    this.nTipo = new Simplex(s ^ 0x7777); // v22: tipo de cueva por región (sala, túnel o mixta)
    this.nCuenca = new Simplex(s ^ 0x8888); // v22: niveles de agua por cuenca (curvas, no cuadrícula)
    this.bocaCache = new Map();
    this.volcanoCache = new Map();
  }

  // ---------- volcanes ----------
  volcanoIn(cx, cz) {
    const k = `${cx},${cz}`;
    if (this.volcanoCache.has(k)) return this.volcanoCache.get(k);
    const seed = this.gen.seed;
    let v = null;
    if (hash3(seed, cx, 4040, cz) < 0.35) {
      v = {
        x: cx * VOLCANO_CELL + 140 + hash3(seed, cx, 1, cz) * (VOLCANO_CELL - 280),
        z: cz * VOLCANO_CELL + 140 + hash3(seed, cx, 2, cz) * (VOLCANO_CELL - 280),
        r: 75 + hash3(seed, cx, 3, cz) * 35,
        hgt: 48 + hash3(seed, cx, 4, cz) * 18,
      };
      // v5: cada volcán tiene su carácter: el Arenal (cono perfecto, activo) o el Poás (ancho, con laguna ácida)
      if (this.gen.version >= 5) {
        if (hash3(seed, cx, 5, cz) < 0.5) Object.assign(v, { kind: 'arenal', r: 62 + hash3(seed, cx, 3, cz) * 16, hgt: 64 + hash3(seed, cx, 4, cz) * 8, exp: 1.25, crf: 0.09, depth: 5 });
        else Object.assign(v, { kind: 'poas', r: 105 + hash3(seed, cx, 3, cz) * 20, hgt: 32 + hash3(seed, cx, 4, cz) * 6, exp: 1.9, crf: 0.3, depth: 12 });
      }
    }
    this.volcanoCache.set(k, v);
    return v;
  }

  // Modifica la columna base: volcanes y selva.
  shapeColumn(x, z, col) {
    // v16: el cauce de un río no se levanta con el cerro ni con el volcán (antes quedaba colgado, como una zanja seca o con agua en bajada)
    let kr = 1;
    if (this.gen.version >= 16 && col.rio < 0.045 && col.h >= SEA - 3) kr = (col.rio / 0.045) * (col.rio / 0.045);
    const h0 = col.h;
    const vcx = Math.floor(x / VOLCANO_CELL), vcz = Math.floor(z / VOLCANO_CELL);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const v = this.volcanoIn(vcx + dx, vcz + dz);
      if (!v) continue;
      const d = Math.hypot(x - v.x, z - v.z);
      if (d >= v.r) continue;
      const k = 1 - d / v.r;
      const base = Math.max(col.h, SEA + 2);
      const exp = v.exp || 1.7, crf = v.crf || 0.16, depth = v.depth || 10;
      const cone = Math.pow(k, exp) * v.hgt;
      const rim = Math.max(col.h, SEA + 2) + v.hgt * Math.pow(1 - crf, exp) * 0.98;
      const cr = v.r * crf;
      let h = base + cone;
      let lavaTop = 0, acidTop = 0;
      if (d < cr) {
        // cráter: el Poás con laguna ácida turquesa; los demás con lago de lava
        h = rim - depth * Math.sqrt(1 - d / cr) - 2;
        if (v.kind === 'poas') acidTop = Math.floor(rim - depth * 0.55);
        else lavaTop = Math.floor(rim - (v.kind === 'arenal' ? 3 : 7));
      }
      // v17: cerca de la boca el río ya no rebaja el cono (en v16 dejaba el cráter colgado sobre una torre con la lava al aire)
      const kv = this.gen.version >= 17 ? kr + (1 - kr) * Math.min(1, Math.max(0, (k - 0.35) / 0.3)) : kr;
      if (kv < 1 && d >= cr) h = h0 + (h - h0) * kv;
      col.h = Math.max(6, Math.min(HEIGHT - 6, Math.floor(h)));
      if (k > 0.35) col.biome = 'volcano';
      col.lavaTop = lavaTop;
      col.acidTop = acidTop;
      col.volcanoK = k;
      col.volcanoKind = v.kind;
    }
    if (col.biome === 'forest' || col.biome === 'plains') {
      if (col.temp > 0.22 && col.wet > 0.22 && col.h > SEA + 1) col.biome = 'jungle';
    }
    if (this.gen.version >= 5 && col.biome !== 'volcano' && col.biome !== 'ocean') {
      const cc = this.cerroNear(x, z);
      if (cc) {
        const d = Math.hypot(x - cc.x, z - cc.z) / cc.r;
        const lift = cc.hgt * Math.exp(-d * d * 3.2) * (1 + this.nDrip.noise2(x * 0.02, z * 0.02) * 0.08);
        const hc = Math.max(col.h, SEA + 2) + lift;
        col.h = Math.min(HEIGHT - 4, Math.floor(kr < 1 ? col.h + (hc - col.h) * kr : hc));
        col.cerroK = Math.max(0, 1 - d);
        if (col.h > 96) { col.biome = 'paramo'; col.temp = -0.12; col.wet = -0.25; }
        else if (col.h > 84 && col.biome === 'mountains') col.biome = 'forest';
      }
    }
    // v16: la playa o el mar que un cerro o un volcán dejó tierra adentro y en alto ya no son playa (eran paredes de arenisca)
    if (this.gen.version >= 16 && col.h > SEA + 3 && (col.biome === 'beach' || col.biome === 'ocean')) col.biome = 'plains';
    // v4: bosque nuboso en las alturas húmedas, manglar en costas cálidas y húmedas, bosque seco en llanuras cálidas
    if (this.gen.version >= 4 && col.biome !== 'volcano') {
      if (col.h > 82 && col.h < 108 && col.wet > 0.02 && col.temp > -0.3 && ['forest', 'jungle', 'mountains', 'plains'].includes(col.biome)) col.biome = 'nuboso';
      else if (col.h >= SEA - 3 && col.h <= SEA + 1 && col.wet > 0.12 && col.temp > 0.05 && ['beach', 'plains', 'forest', 'jungle', 'ocean'].includes(col.biome)) col.biome = 'manglar';
      else if (col.biome === 'plains' && col.temp > 0.12 && col.wet < -0.02) col.biome = 'bosque_seco';
    }
    // v10: en Costa Rica no neva. Lo «nevado» pasa a páramo en lo alto y a bosque frío más abajo; las cumbres son páramo
    if (this.gen.version >= 10 && col.biome !== 'volcano' && col.biome !== 'ocean') {
      const paramo = () => { col.biome = 'paramo'; col.temp = -0.12; col.wet = -0.25; col.cerroK = col.cerroK ?? 1; };
      if (col.biome === 'snowy') { if (col.h > 84) paramo(); else { col.biome = col.h > 74 ? 'nuboso' : 'forest'; col.temp = Math.max(col.temp, 0.02); } }
      else if (col.biome === 'mountains' && col.h > 100) paramo();
    }
    return col;
  }

  // ---------- Cerro Chirripó (uno por región grande) ----------
  cerroNear(x, z) {
    const CELL = 1300;
    const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const c = this.cerroIn(gx + dx, gz + dz);
      if (c && Math.abs(x - c.x) < c.r * 1.3 && Math.abs(z - c.z) < c.r * 1.3) return c;
    }
    return null;
  }

  cerroIn(gx, gz) {
    this.cerroCache = this.cerroCache || new Map();
    const k = `${gx},${gz}`;
    if (this.cerroCache.has(k)) return this.cerroCache.get(k);
    const seed = this.gen.seed;
    let c = null;
    if (hash3(seed, gx, 7070, gz) < 0.55) {
      c = { x: Math.floor(gx * 1300 + 300 + hash3(seed, gx, 1, gz) * 700), z: Math.floor(gz * 1300 + 300 + hash3(seed, gx, 2, gz) * 700), r: 150 + hash3(seed, gx, 3, gz) * 30, hgt: 60 };
      // no encima de un volcán
      const v = this.volcanoIn(Math.floor(c.x / VOLCANO_CELL), Math.floor(c.z / VOLCANO_CELL));
      if (v && Math.hypot(v.x - c.x, v.z - c.z) < v.r + c.r) c = null;
    }
    this.cerroCache.set(k, c);
    return c;
  }

  // ---------- cuevas ----------
  isCave(x, y, z, h) {
    const g = this.gen;
    if (g.isCave(x, y, z)) return true;
    // túneles finos ("fideos")
    const a = this.nNoodleA.noise3(x * 0.045, y * 0.06, z * 0.045);
    if (Math.abs(a) < 0.04) {
      const b = this.nNoodleB.noise3(x * 0.045, y * 0.06, z * 0.045);
      if (Math.abs(b) < 0.04) return true;
    }
    // cavernas enormes más arriba que antes, pero lejos de la superficie
    if (y < 56 && y < h - 10) {
      const c = g.nCaveC.noise3(x * 0.011, y * 0.018, z * 0.011);
      if (c > 0.5 - (56 - y) * 0.003) return true;
    }
    return false;
  }

  // ---------- v22: cuevas rediseñadas ----------
  // Bocas: rampas que bajan en diagonal desde la superficie hasta una sala chica. Una por celda de 40 con cierta probabilidad; todo por hash.
  bocaIn(gx, gz) {
    const k = gx * 100003 + gz;
    let b = this.bocaCache.get(k);
    if (b !== undefined) return b;
    b = null;
    const seed = this.gen.seed;
    if (hash3(seed, gx, 9101, gz) < BOCA_PROB) {
      const ex = Math.floor(gx * BOCA_CELDA + 6 + hash3(seed, gx, 9102, gz) * (BOCA_CELDA - 12)), ez = Math.floor(gz * BOCA_CELDA + 6 + hash3(seed, gx, 9103, gz) * (BOCA_CELDA - 12));
      const col = this.gen.column(ex, ez);
      if (col.h >= SEA + 3 && !['ocean', 'volcano', 'manglar'].includes(col.biome) && !(col.rio < 0.07)) {
        const ang = hash3(seed, gx, 9104, gz) * 6.2832;
        const D = Math.min(22 + hash3(seed, gx, 9105, gz) * 16, col.h - 16);
        if (D >= 12) b = { x: ex, z: ez, h: col.h, dx: Math.cos(ang), dz: Math.sin(ang), D, r: 2.3 + hash3(seed, gx, 9106, gz) * 1.2, fase: hash3(seed, gx, 9107, gz) * 6.2832, k: 1.5 };
      }
    }
    this.bocaCache.set(k, b);
    return b;
  }

  // Las bocas que tocan un trozo (su rectángulo más el largo máximo de la rampa).
  bocasDe(cx, cz) {
    const out = [], x0 = cx * CHUNK, z0 = cz * CHUNK, m = 38 * 1.5 + 6;
    for (let gz = Math.floor((z0 - m) / BOCA_CELDA); gz <= Math.floor((z0 + CHUNK + m) / BOCA_CELDA); gz++) for (let gx = Math.floor((x0 - m) / BOCA_CELDA); gx <= Math.floor((x0 + CHUNK + m) / BOCA_CELDA); gx++) {
      const b = this.bocaIn(gx, gz);
      if (!b) continue;
      const ex = b.x + b.dx * b.D * b.k, ez = b.z + b.dz * b.D * b.k, r = b.r + 6;
      if (Math.max(b.x, ex) + r < x0 || Math.min(b.x, ex) - r > x0 + CHUNK || Math.max(b.z, ez) + r < z0 || Math.min(b.z, ez) - r > z0 + CHUNK) continue;
      out.push(b);
    }
    return out;
  }

  // Por columna: tipo de cueva (se calcula una vez por columna, no por bloque).
  cuevaColumna(wx, wz, col) {
    let t = this.nTipo.noise2(wx * 0.0035, wz * 0.0035);
    // el bioma inclina el tipo: más sala (húmeda) en selva, manglar y bosque nuboso; más túnel (seca, caliza) en el seco
    const b = col.biome;
    if (b === 'jungle' || b === 'manglar' || b === 'nuboso') t += 0.14;
    else if (b === 'desert' || b === 'bosque_seco') t -= 0.12;
    const q = Math.max(-0.35, Math.min(0.45, t));
    return { thr: QUESO_BASE - q * QUESO_PEND, esp: ESP_BASE + (0.35 - q) * ESP_PEND };
  }

  // Nivel del agua subterránea de una columna (0 = seca): escalones por cuenca, contornos de un ruido y no una cuadrícula.
  nivelAgua(wx, wz) {
    const n = this.nCuenca.noise2(wx * 0.006 + 40, wz * 0.006 - 17);
    if (n < 0.14) return 0;
    return 18 + 3 * Math.min(5, Math.floor((n - 0.14) * 11));
  }

  // Nivel de la lava de una columna (0 = sin lava arriba del piso de siempre, que es y<=10). Zonas de ~28 bloques con el borde ondulado;
  // cada zona tiene lava con probabilidad LAVA_PROB y un nivel entre 11 y LAVA_TOPE (más zonas bajas que altas: crece hacia el fondo).
  // Donde hay agua subterránea no hay lava (se enfriarían una a la otra).
  nivelLava(wx, wz) {
    if (this.nivelAgua(wx, wz)) return 0;
    const o = Math.floor(this.nDeep.noise2(wx * 0.045 + 11, wz * 0.045 - 7) * 9);
    const rx = Math.floor((wx + o) / LAVA_ZONA), rz = Math.floor((wz - o) / LAVA_ZONA), s = this.gen.seed;
    if (hash3(s, rx, 901, rz) >= LAVA_PROB) return 0;
    const t = hash3(s, rx, 902, rz);
    return LAVA_FONDO + 1 + Math.floor(t * t * (LAVA_TOPE - LAVA_FONDO - 1));
  }

  cueva22(x, y, z, h, cc, bocas) {
    for (let i = 0; i < bocas.length; i++) {
      const m = bocas[i], t = m.h - y;
      if (t < -2 || t > m.D + 5) continue;
      const tt = Math.max(0, Math.min(m.D, t));
      const w = Math.sin(tt * 0.35 + m.fase) * 1.3;
      const px = m.x + m.dx * tt * m.k - m.dz * w, pz = m.z + m.dz * tt * m.k + m.dx * w;
      const ddx = x - px, ddz = z - pz;
      const rr = t > m.D ? 4.6 : m.r * (1 - tt / m.D * 0.25);
      if (ddx * ddx + ddz * ddz < rr * rr) return true;
    }
    const g = this.gen;
    // capa 51-60: casi sin huecos (menos agujeros que rompen la superficie)
    const fade = y > 50 ? Math.max(0, 1 - (y - 50) / 9) : 1;
    // sala: grandes y raras, según la región
    let c = -9;
    if (y > 12 && y < 52 && y < h - 8) {
      c = g.nCaveC.noise3(x * 0.011, y * 0.019, z * 0.011);
      if (c > cc.thr + Math.abs(y - 30) * 0.004 + (1 - fade) * 0.3) return true;
    }
    // espagueti: túneles largos
    const e = cc.esp * fade;
    if (e > 0.004) {
      const a = g.nCaveA.noise3(x * 0.018, y * 0.03, z * 0.018);
      if (Math.abs(a) < e && Math.abs(g.nCaveB.noise3(x * 0.018, y * 0.03, z * 0.018)) < e) return true;
    }
    // fideos: finos y solo pegados a una sala, para unirla con el resto
    if (c > cc.thr - 0.14) {
      const na = this.nNoodleA.noise3(x * 0.045, y * 0.06, z * 0.045);
      if (Math.abs(na) < 0.05 && Math.abs(this.nNoodleB.noise3(x * 0.045, y * 0.06, z * 0.045)) < 0.05) return true;
    }
    return false;
  }

  generate(cx, cz, blocks, tint, colAt) {
    const g = this.gen, seed = g.seed;
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const rnd = mulberry32((seed ^ Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ 0x5eed) >>> 0);
    const structures = [];
    const v22 = g.version >= GEN_CUEVAS;
    const bocas = v22 ? this.bocasDe(cx, cz) : null;
    const v23 = g.version >= GEN_PROF;

    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = x0 + lx, wz = z0 + lz;
      const col = colAt(lx, lz);
      const { h, biome } = col;
      if (tint) {
        const tc = g.constructor.tintFor(col.temp, col.wet);
        const ti = (lx + lz * CHUNK) * 3;
        tint[ti] = tc[0]; tint[ti + 1] = tc[1]; tint[ti + 2] = tc[2];
      }
      const underwater = h < SEA;
      let top, filler;
      switch (biome) {
        case 'desert': case 'beach': top = K.sand; filler = K.sand; break;
        case 'ocean': {
          const f = hash3(seed, wx >> 3, 7, wz >> 3);
          top = f < 0.55 ? K.sand : f < 0.8 ? K.gravel : K.clay; filler = top === K.clay ? K.clay : K.sand; break;
        }
        case 'snowy': top = underwater ? K.dirt : K.snow_grass; filler = K.dirt; break;
        case 'manglar': top = underwater ? K.clay : K.dirt; filler = K.clay; break;
        case 'mountains': top = h > 104 ? K.snow : K.stone; filler = K.stone; break;
        case 'volcano': {
          // faldas con pasto y grava, a media altura basalto con vetas de piedra, arriba obsidiana
          const r = hash3(seed, wx, 9, wz);
          const streak = this.nDrip.noise2(wx * 0.08, wz * 0.08);
          const k = col.volcanoK;
          if (k < 0.5) { top = r < 0.25 ? K.gravel : K.grass; filler = K.dirt; }
          else if (k < 0.82) { top = streak > 0.35 ? K.stone : streak < -0.45 ? K.gravel : K.basalt; filler = K.basalt; }
          else { top = r < 0.35 ? K.obsidian : K.basalt; filler = K.basalt; }
          break;
        }
        default: top = underwater ? K.dirt : K.grass; filler = K.dirt;
      }
      const deepTop = 14 + Math.floor(this.nDeep.noise2(wx * 0.05, wz * 0.05) * 3);
      // lagos subterráneos por regiones de 48x48 con su propio nivel; en los bordes queda una pared
      // natural para que el agua no se escape a las cuevas secas de al lado
      const AQ = 48;
      const rx = Math.floor(wx / AQ), rz = Math.floor(wz / AQ);
      const aqOn = hash3(seed, rx, 777, rz) < 0.45;
      const aqLevel = 18 + Math.floor(hash3(seed, rx, 778, rz) * 18);
      const mx = ((wx % AQ) + AQ) % AQ, mz = ((wz % AQ) + AQ) % AQ;
      const aqBorder = mx < 2 || mx >= AQ - 2 || mz < 2 || mz >= AQ - 2;
      // cerca del mar no se cavan cuevas a la altura del agua (si no, el mar se metería al tocarlas)
      // v22: agua por cuencas. Se tapa con una pared fina (que sigue el contorno de la cuenca, no una recta) solo donde un vecino tiene menos agua
      let aq22 = 0, selloLo = 0, cc22 = null;
      if (v22) {
        cc22 = this.cuevaColumna(wx, wz, col);
        aq22 = this.nivelAgua(wx, wz);
        selloLo = aq22;
        if (aq22) for (let k = 0; k < 4; k++) selloLo = Math.min(selloLo, this.nivelAgua(wx + (k === 0) - (k === 1), wz + (k === 2) - (k === 3)));
      }
      // v23: el nivel de la lava de esta columna y el más bajo de sus cuatro vecinas (la pared que la contiene)
      let lv23 = 0, lavaLo = 0;
      if (v23) {
        lv23 = this.nivelLava(wx, wz);
        if (lv23) { lavaLo = lv23; for (let k = 0; k < 4; k++) lavaLo = Math.min(lavaLo, this.nivelLava(wx + (k === 0) - (k === 1), wz + (k === 2) - (k === 3)) || LAVA_FONDO); }
      }
      let nearSea = false;
      if (!underwater) for (let dz = -2; dz <= 2 && !nearSea; dz++) for (let dx = -2; dx <= 2; dx++) { if (colAt(lx + dx, lz + dz).h < SEA) { nearSea = true; break; } }
      const carveTop = underwater || biome === 'beach' ? h - 4 : h - (biome === 'volcano' ? 3 : 0);
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0) id = K.bedrock;
        else if (y <= 3 && hash3(seed, wx, y, wz) < 0.55 - y * 0.12) id = K.bedrock;
        else if (y === h) id = top;
        else if (y > h - 4) id = filler;
        else if (biome === 'desert' && y > h - 8) id = K.sandstone;
        else if (y < deepTop) id = K.deep_rock;
        else if (y < deepTop + 3 && hash3(seed, wx, y, wz) < (deepTop + 3 - y) / 4) id = K.deep_rock;
        else id = biome === 'volcano' && y > h - 12 ? K.basalt : K.stone;
        const sealed = v22 ? ((aq22 > 0 && y > selloLo && y <= aq22 && y > 10 && selloLo < aq22) || (nearSea && y > SEA - 9) || (lv23 > 0 && y > lavaLo && y <= lv23)) : ((aqBorder && y <= 37 && y > 10) || (nearSea && y > SEA - 9));
        if (id !== K.bedrock && y > 4 && y <= carveTop && !sealed && (v22 ? this.cueva22(wx, y, wz, h, cc22, bocas) : this.isCave(wx, y, wz, h))) {
          if (y <= 10 || (lv23 && y <= lv23)) id = K.lava; // lagos de lava en lo más hondo (v23: y charcos más arriba)
          else if (v22 ? y <= aq22 : (aqOn && y <= aqLevel)) id = K.water; // lagos subterráneos
          else id = 0;
        }
        blocks[idx(lx, y, lz)] = id;
      }
      if (underwater) {
        for (let y = h + 1; y <= SEA; y++) blocks[idx(lx, y, lz)] = K.water;
        if (biome === 'snowy' || (biome === 'ocean' && col.temp < -0.35 && this.gen.version < 10)) blocks[idx(lx, SEA, lz)] = K.ice;
      }
      if (col.lavaTop) for (let y = h + 1; y <= col.lavaTop; y++) blocks[idx(lx, y, lz)] = K.lava;
      if (col.acidTop) {
        for (let y = h + 1; y <= col.acidTop; y++) blocks[idx(lx, y, lz)] = K.agua_acida;
        if (h < col.acidTop) blocks[idx(lx, h, lz)] = hash3(seed, wx, 31, wz) < 0.4 ? K.azufre_bloque : K.gravel;
      }
    }

    // ---- minerales por altura (cada uno tiene su franja preferida) ----
    const veinOres = [
      { id: K.coal_ore, deep: K.coal_ore, veins: 16, size: 10, y0: 40, y1: 115 },
      { id: K.iron_ore, deep: K.deep_iron_ore, veins: 9, size: 7, y0: 4, y1: 72, peak: 16 },
      { id: K.gold_ore, deep: K.deep_gold_ore, veins: 4, size: 6, y0: 4, y1: 34 },
      { id: K.diamond_ore, deep: K.deep_diamond_ore, veins: 3, size: 5, y0: 3, y1: 17 },
      { id: K.gravel, deep: K.gravel, veins: 4, size: 14, y0: 20, y1: 70 },
      { id: K.clay, deep: K.clay, veins: 1, size: 10, y0: 30, y1: 60 },
    ];
    const randY = (o) => {
      if (o.peak) { const t = (rnd() + rnd()) / 2; return Math.floor(o.y0 + t * (o.y1 - o.y0)); } // triangular
      return Math.floor(o.y0 + rnd() * (o.y1 - o.y0));
    };
    for (const ore of veinOres) {
      for (let v = 0; v < ore.veins; v++) {
        let x = Math.floor(rnd() * CHUNK), y = randY(ore), z = Math.floor(rnd() * CHUNK);
        for (let s = 0; s < ore.size; s++) {
          if (x >= 0 && x < CHUNK && z >= 0 && z < CHUNK && y > 0 && y < HEIGHT) {
            const i = idx(x, y, z);
            if (blocks[i] === K.stone) blocks[i] = ore.id;
            else if (blocks[i] === K.deep_rock) blocks[i] = ore.deep;
          }
          const d = Math.floor(rnd() * 6);
          if (d === 0) x++; else if (d === 1) x--; else if (d === 2) y++; else if (d === 3) y--; else if (d === 4) z++; else z--;
        }
      }
    }
    // jade: muy raro, en lo más hondo y casi siempre junto a lava
    if (rnd() < 0.45) {
      for (let tries = 0; tries < 30; tries++) {
        const x = 1 + Math.floor(rnd() * 14), y = 3 + Math.floor(rnd() * 10), z = 1 + Math.floor(rnd() * 14);
        if (blocks[idx(x, y, z)] !== K.deep_rock) continue;
        let nearLava = false;
        for (let dy = -2; dy <= 2 && !nearLava; dy++) for (let dz = -2; dz <= 2 && !nearLava; dz++) for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx, yy = y + dy, zz = z + dz;
          if (xx >= 0 && xx < 16 && zz >= 0 && zz < 16 && yy > 0 && blocks[idx(xx, yy, zz)] === K.lava) { nearLava = true; break; }
        }
        if (!nearLava && rnd() < 0.8) continue;
        blocks[idx(x, y, z)] = K.jade_ore;
        if (rnd() < 0.5 && blocks[idx(x, y + 1, z)] === K.deep_rock) blocks[idx(x, y + 1, z)] = K.jade_ore;
        break;
      }
    }

    // ---- decoración de cuevas ----
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = x0 + lx, wz = z0 + lz;
      const h = colAt(lx, lz).h;
      for (let y = 6; y < h - 4; y++) {
        const i = idx(lx, y, lz);
        if (blocks[i] !== 0) continue;
        const below = blocks[i - 256], above = blocks[i + 256];
        const lush = this.nLush.noise3(wx * 0.03, y * 0.05, wz * 0.03) > 0.42;
        const drip = this.nDrip.noise3(wx * 0.03, y * 0.05, wz * 0.03) > 0.4;
        const r = hash3(seed, wx, y, wz);
        // v13: cuevas de cristal (en lo hondo, por zonas): racimos que brillan en el piso y el techo, y cristal en las paredes
        if (this.gen.version >= 13 && y < 46 && this.nLush.noise3(wx * 0.035 + 777, y * 0.07, wz * 0.035 - 333) > 0.5) {
          if (OPAQUE[below] && below !== K.bedrock && r < 0.22) { blocks[i] = K.cristal; if (r < 0.08) blocks[i - 256] = K.cristal_bloque; continue; }
          if (OPAQUE[above] && r < 0.18) { blocks[i] = K.cristal; if (r < 0.06) blocks[i + 256] = K.cristal_bloque; continue; }
        }
        if (OPAQUE[below] && below !== K.bedrock) {
          if (lush) {
            blocks[i - 256] = K.moss;
            if (r < 0.1) blocks[i] = K.glow_mushroom;
            else if (r < 0.3) blocks[i] = K.tall_grass;
          } else if (drip && r < 0.12) blocks[i] = K.stalagmite;
          else if (y < 50 && r < 0.012) blocks[i] = K.glow_mushroom;
        } else if (OPAQUE[above]) {
          if (lush && r < 0.16) {
            if (OPAQUE[above]) blocks[i + 256] = K.moss;
            blocks[i] = K.vine;
            if (blocks[i - 256] === 0 && r < 0.08) blocks[i - 256] = K.vine;
          } else if (drip && r < 0.14) blocks[i] = K.stalactite;
        }
      }
    }

    // ---- geodas de cuarzo ----
    if (rnd() < 0.05) {
      const cxl = 6 + Math.floor(rnd() * 4), cyl = 14 + Math.floor(rnd() * 26), czl = 6 + Math.floor(rnd() * 4);
      const R = 4.3 + rnd() * 0.6;
      for (let dy = -5; dy <= 5; dy++) for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
        const x = cxl + dx, y = cyl + dy, z = czl + dz;
        if (x < 0 || x >= 16 || z < 0 || z >= 16 || y < 2) continue;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + hash3(seed, x0 + x, y, z0 + z) * 0.5;
        if (d > R) continue;
        const i = idx(x, y, z);
        if (d > R - 0.8) blocks[i] = K.basalt;
        else if (d > R - 1.6) blocks[i] = K.calcite;
        else if (d > R - 2.3) blocks[i] = K.quartz_block;
        else blocks[i] = 0;
      }
    }

    // ---- ruinas subterráneas con botín ----
    if (rnd() < 0.07) {
      const W = 7, H = 5;
      const ox = 1 + Math.floor(rnd() * (16 - W - 1)), oz = 1 + Math.floor(rnd() * (16 - W - 1));
      const minH = Math.min(colAt(ox, oz).h, colAt(ox + W, oz + W).h);
      const oy = 12 + Math.floor(rnd() * Math.max(1, minH - 28));
      if (oy + H < minH - 6) {
        for (let y = 0; y < H; y++) for (let z = 0; z < W; z++) for (let x = 0; x < W; x++) {
          const wall = x === 0 || z === 0 || x === W - 1 || z === W - 1 || y === 0 || y === H - 1;
          const i = idx(ox + x, oy + y, oz + z);
          if (wall) blocks[i] = y === 0 || rnd() < 0.45 ? K.mossy : K.cobble;
          else blocks[i] = 0;
        }
        // telarañas en las esquinas de arriba y una lámpara rota
        for (const [x, z] of [[1, 1], [W - 2, 1], [1, W - 2], [W - 2, W - 2]]) if (rnd() < 0.7) blocks[idx(ox + x, oy + H - 2, oz + z)] = K.cobweb;
        // dos aberturas para que se conecte con cuevas
        blocks[idx(ox, oy + 1, oz + 3)] = 0; blocks[idx(ox, oy + 2, oz + 3)] = 0;
        blocks[idx(ox + W - 1, oy + 1, oz + 3)] = 0; blocks[idx(ox + W - 1, oy + 2, oz + 3)] = 0;
        const nChests = 1 + (rnd() < 0.4 ? 1 : 0);
        for (let c = 0; c < nChests; c++) {
          const x = ox + (c ? W - 2 : 1), z = oz + 3 + (c ? 1 : -1);
          blocks[idx(x, oy + 1, z)] = K.chest;
          structures.push({ x, y: oy + 1, z, be: { type: 'chest', facing: c ? 3 : 1, slots: lootTable(rnd), viejo: true } });
        }
      }
    }
    if (g.version >= 3) this.seaFeatures(cx, cz, blocks, colAt, structures);
    return structures;
  }

  // ---- v3: arrecifes de coral en mar tibio y poco profundo, naufragios con cofre ----
  seaFeatures(cx, cz, blocks, colAt, structures) {
    const g = this.gen, seed = g.seed;
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const rs = mulberry32((seed ^ Math.imul(cx, 2654435761) ^ Math.imul(cz, 40503) ^ 0x0cea) >>> 0);
    const CORALS = [K.coral_red, K.coral_orange, K.coral_yellow, K.coral_purple];
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = colAt(lx, lz);
      if (col.biome !== 'ocean' || col.temp < -0.05 || col.h < SEA - 18 || col.h > SEA - 3) continue;
      const wx = x0 + lx, wz = z0 + lz;
      const reef = this.nDrip.noise2(wx * 0.045, wz * 0.045) + this.nLush.noise2(wx * 0.15 + 50, wz * 0.15) * 0.35;
      if (reef < 0.3) continue;
      if (hash3(seed, wx, 777, wz) > 0.32 + (reef - 0.3) * 0.4) continue;
      const hr = hash3(seed, wx, 778, wz);
      const tall = hr < 0.55 ? 1 : 1 + Math.floor(hr * Math.min(3, SEA - col.h - 2));
      let c = CORALS[Math.floor((this.nDeep.noise2(wx * 0.09, wz * 0.09) * 0.5 + 0.5) * 4) & 3];
      if (g.version >= 20 && this.nLush.noise2(wx * 0.025 + 311, wz * 0.025 - 97) > 0.22) c = K.coral_blanco; // v12.6.0 (C5-B): parches de arrecife blanqueado
      for (let y = col.h + 1; y <= col.h + tall && y < SEA - 1; y++) blocks[idx(lx, y, lz)] = c !== K.coral_blanco && hash3(seed, wx, y, wz) < 0.15 ? CORALS[(CORALS.indexOf(c) + 1) & 3] : c;
      if (hash3(seed, wx, 779, wz) < 0.3) blocks[idx(lx, col.h, lz)] = K.sand;
    }
    // naufragio: un barco de madera medio enterrado, de costado
    if (rs() < 0.035) {
      const L = 11, Wd = 5;
      const alongX = rs() < 0.5;
      const sx = 2 + Math.floor(rs() * 2), sz = 2 + Math.floor(rs() * 2);
      const mid = colAt(sx + 4, sz + 2);
      if (mid.biome === 'ocean' && mid.h <= SEA - 8) {
        const by = mid.h;
        const at = (i, j) => (alongX ? [sx + i, sz + j] : [sx + j, sz + i]);
        for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
          const [lx, lz] = at(i, j);
          if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK) continue;
          const bow = i === 0 || i === L - 1;
          const inside = j > 0 && j < Wd - 1 && !bow;
          const narrow = (i < 2 || i > L - 3) && (j === 0 || j === Wd - 1);
          if (narrow) continue;
          blocks[idx(lx, by, lz)] = K.planks; // casco
          for (let y = by + 1; y <= by + 2; y++) {
            if (inside) blocks[idx(lx, y, lz)] = K.water;
            else if (rs() < 0.8) blocks[idx(lx, y, lz)] = y === by + 2 && rs() < 0.4 ? K.log : K.planks; // costados (con huecos)
          }
          if (inside && rs() < 0.25) blocks[idx(lx, by + 3, lz)] = K.planks; // restos de cubierta
        }
        // mástil quebrado
        const [mx, mz] = at(4, 2);
        for (let y = by + 1; y < by + 1 + 3 + Math.floor(rs() * 4) && y < SEA; y++) blocks[idx(mx, y, mz)] = K.log;
        // cofre del capitán
        const [chx, chz] = at(7, 2);
        blocks[idx(chx, by + 1, chz)] = K.chest;
        const slots = lootTable(rs);
        // botín de mar: perlas, oro, bota vieja, mapa… y a veces un bote
        const extra = [[369, 1 + Math.floor(rs() * 3)], [259, 2 + Math.floor(rs() * 5)], [367, 3], [358, 1]];
        for (const [id, n] of extra) { if (rs() < 0.6) { let k = Math.floor(rs() * 27); while (slots[k]) k = (k + 1) % 27; slots[k] = { id, count: n }; } }
        structures.push({ x: chx, y: by + 1, z: chz, be: { type: 'chest', facing: alongX ? 0 : 1, slots, viejo: true } });
      }
    }
  }

  // ---- v4: guanacastes, ceibas, bosque nuboso, manglares y aguas termales ----
  decorate4(cx, cz, blocks, colAt, M) {
    const g = this.gen, seed = g.seed;
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const put = (wx, y, wz, id, onlyAir) => {
      const lx = wx - x0, lz = wz - z0;
      if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || y < 1 || y >= HEIGHT) return;
      const i = idx(lx, y, lz);
      const cur = blocks[i];
      if (onlyAir && cur !== 0 && cur !== K.tall_grass && cur !== K.water && cur !== K.helecho) return;
      blocks[i] = id;
    };
    const R = 13;
    for (let wz = z0 - R; wz < z0 + CHUNK + R; wz++) for (let wx = x0 - R; wx < x0 + CHUNK + R; wx++) {
      const r = hash3(seed, wx, 4242, wz);
      if (r > 0.016) continue;
      const lx = wx - x0, lz = wz - z0;
      const col = lx >= -M && lx < CHUNK + M && lz >= -M && lz < CHUNK + M ? colAt(lx, lz) : g.column(wx, wz);
      const rr = mulberry32(Math.floor(r * 1e9) ^ 0x7ee);
      const b = col.biome;
      if ((b === 'bosque_seco' && r < 0.0022) || (b === 'plains' && r < 0.0003)) this.guanacaste(put, wx, col.h, wz, rr);
      else if (b === 'jungle' && r < 0.0008 && col.h > SEA + 1) this.ceiba(put, wx, col.h, wz, rr);
      else if (b === 'nuboso' && r < 0.0075 && Math.abs(lx - 8) < 13 && Math.abs(lz - 8) < 13) this.arbolNuboso(put, wx, col.h, wz, rr);
      else if (b === 'manglar' && r < 0.012 && Math.abs(lx - 8) < 13 && Math.abs(lz - 8) < 13) this.mangle(put, wx, col.h, wz, rr);
    }
    // páramo del Chirripó: pajonales y lagunas glaciares
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = colAt(lx, lz);
      if (col.biome !== 'paramo') continue;
      const wx = x0 + lx, wz = z0 + lz;
      const lake = this.nLush.noise2(wx * 0.03, wz * 0.03);
      if (lake > 0.62 && col.cerroK < 0.5) { blocks[idx(lx, col.h, lz)] = K.water; blocks[idx(lx, col.h - 1, lz)] = lake > 0.7 ? K.water : K.gravel; continue; }
      const top = blocks[idx(lx, col.h, lz)];
      if (top === K.grass) {
        const q = hash3(seed, wx, 4545, wz);
        if (q < 0.35) blocks[idx(lx, col.h + 1, lz)] = K.pajon;
        else if (q < 0.4) blocks[idx(lx, col.h, lz)] = K.stone;
      }
    }
    // suelo del bosque nuboso: helechos, musgo y bromelias
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = colAt(lx, lz);
      if (col.biome !== 'nuboso' || col.h <= SEA) continue;
      const wx = x0 + lx, wz = z0 + lz;
      const above = blocks[idx(lx, col.h + 1, lz)];
      if (above !== 0 && above !== K.tall_grass) continue;
      const q = hash3(seed, wx, 4343, wz);
      if (q < 0.16) blocks[idx(lx, col.h + 1, lz)] = K.helecho;
      else if (q < 0.3) blocks[idx(lx, col.h + 1, lz)] = K.musgo;
      else if (q < 0.33) blocks[idx(lx, col.h + 1, lz)] = K.bromelia;
    }
    // aguas termales en las faldas de los volcanes
    const rs = mulberry32((seed ^ Math.imul(cx, 668265263) ^ Math.imul(cz, 374761393) ^ 0x7e57) >>> 0);
    if (rs() < 0.22) {
      const cxp = 4 + Math.floor(rs() * 8), czp = 4 + Math.floor(rs() * 8);
      const c0 = colAt(cxp, czp);
      if (c0.volcanoK > 0.06 && c0.volcanoK < 0.4 && c0.h > SEA + 1) {
        const h = c0.h, rad = 2.2 + rs() * 1.3;
        for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
          const d = Math.hypot(dx, dz), x = cxp + dx, z = czp + dz;
          if (x < 0 || x >= CHUNK || z < 0 || z >= CHUNK) continue;
          if (d <= rad) {
            for (let y = h - 1; y <= h; y++) blocks[idx(x, y, z)] = K.water;
            blocks[idx(x, h - 2, z)] = K.travertino;
            for (let y = h + 1; y < h + 4; y++) blocks[idx(x, y, z)] = 0;
          } else if (d <= rad + 1.2) {
            blocks[idx(x, h, z)] = K.travertino;
            for (let y = h + 1; y < h + 3; y++) if (blocks[idx(x, y, z)] !== 0) blocks[idx(x, y, z)] = 0;
          }
        }
      }
    }
  }

  // Guanacaste: tronco corto y copa enorme y plana como sombrilla
  guanacaste(put, wx, h, wz, rr) {
    guanacasteShape((dx, dy, dz, id, onlyAir) => put(wx + dx, h + dy, wz + dz, id, onlyAir), rr, false);
  }

  // Ceiba: gigante de la selva con tronco de 2x2, raíces tablares y copa ancha arriba del dosel
  ceiba(put, wx, h, wz, rr) {
    const H = 20 + Math.floor(rr() * 7);
    for (let y = h - 1; y <= h + H; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(wx + dx, y, wz + dz, K.jungle_log);
    // raíces tablares
    for (const [dx, dz, ox, oz] of [[1, 0, 2, 0], [-1, 0, -1, 0], [0, 1, 0, 2], [0, -1, 0, -1], [1, 1, 2, 1], [-1, -1, -1, 0]]) {
      for (let k = 0; k < 3; k++) for (let y = h + 1; y <= h + 3 - k; y++) put(wx + ox + dx * k, y, wz + oz + dz * k, K.jungle_log);
    }
    const top = h + H;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 5; k++) put(wx + (dx > 0 ? 1 : 0) + dx * k, top - 2 + Math.floor(k / 3), wz + (dz > 0 ? 1 : 0) + dz * k, K.jungle_log);
    const Rc = 8 + rr() * 1.5;
    for (let dz = -10; dz <= 10; dz++) for (let dx = -10; dx <= 10; dx++) {
      const d = Math.hypot(dx - 0.5, dz - 0.5);
      const n = hash3(1, wx + dx, top, wz + dz);
      if (d <= Rc && n > 0.1) put(wx + dx, top, wz + dz, K.jungle_leaves, true);
      if (d <= Rc - 2 && n > 0.15) put(wx + dx, top + 1, wz + dz, K.jungle_leaves, true);
      if (d <= Rc - 4.5) put(wx + dx, top + 2, wz + dz, K.jungle_leaves, true);
      // bejucos colgando del borde
      if (d > Rc - 1.5 && d <= Rc && n > 0.82) for (let k = 1; k <= 3 + Math.floor(n * 9); k++) put(wx + dx, top - k, wz + dz, K.vine, true);
    }
  }

  // Bosque nuboso: árboles medianos con musgo, copas redondas, bromelias encima y bejucos
  arbolNuboso(put, wx, h, wz, rr) {
    const H = 5 + Math.floor(rr() * 5);
    for (let y = h + 1; y <= h + H; y++) put(wx, y, wz, K.tronco_musgoso);
    const top = h + H;
    for (let dy = -2; dy <= 2; dy++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const d = Math.hypot(dx, dy * 1.4, dz);
      if (d <= 3.1 && hash3(2, wx + dx, top + dy, wz + dz) > 0.12) put(wx + dx, top + dy, wz + dz, K.leaves, true);
    }
    for (let k = 0; k < 4; k++) {
      const dx = Math.floor(rr() * 5) - 2, dz = Math.floor(rr() * 5) - 2;
      put(wx + dx, top + 3, wz + dz, K.bromelia, true);
      const vx = wx + (rr() < 0.5 ? -3 : 3), vz = wz + Math.floor(rr() * 5) - 2;
      for (let y = top - 1; y > top - 2 - Math.floor(rr() * 4); y--) put(vx, y, vz, K.vine, true);
    }
  }

  // Mangle: raíces en zancos que se meten al agua y copa redonda
  mangle(put, wx, h, wz, rr) {
    const base = Math.max(h, SEA) + 2;
    const H = 3 + Math.floor(rr() * 3);
    for (let y = base; y <= base + H; y++) put(wx, y, wz, K.jungle_log);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      if (rr() < 0.3) continue;
      for (let k = 1; k <= 3; k++) { const y = base - k + 1; if (y < h - 1) break; put(wx + dx * (k > 1 ? 2 : 1), y, wz + dz * (k > 1 ? 2 : 1), K.jungle_log); }
    }
    const top = base + H;
    for (let dy = -1; dy <= 2; dy++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      if (Math.hypot(dx, dy * 1.6, dz) <= 3.2 && hash3(3, wx + dx, top + dy, wz + dz) > 0.1) put(wx + dx, top + dy, wz + dz, K.jungle_leaves, true);
    }
  }

  // Árboles de selva y esferas de piedra (después de la superficie)
  decorate(cx, cz, blocks, colAt, M) {
    const g = this.gen, seed = g.seed;
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const put = (x, y, z, id, onlyAir) => {
      if (x < 0 || x >= CHUNK || z < 0 || z >= CHUNK || y < 1 || y >= HEIGHT) return;
      const i = idx(x, y, z);
      if (onlyAir && blocks[i] !== 0 && blocks[i] !== K.tall_grass) return;
      blocks[i] = id;
    };
    for (let lz = -M; lz < CHUNK + M; lz++) for (let lx = -M; lx < CHUNK + M; lx++) {
      const wx = x0 + lx, wz = z0 + lz;
      const col = colAt(lx, lz);
      if (col.biome !== 'jungle' || col.h <= SEA) continue;
      const r = hash3(seed, wx, 999, wz);
      if (r >= 0.05) {
        // arbustos bajos
        if (r < 0.09 && lx >= 0 && lx < 16 && lz >= 0 && lz < 16) { put(lx, col.h + 1, lz, K.jungle_log, true); put(lx, col.h + 2, lz, K.jungle_leaves, true); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(lx + dx, col.h + 1, lz + dz, K.jungle_leaves, true); }
        continue;
      }
      if (lx >= 0 && lx < CHUNK && lz >= 0 && lz < CHUNK && blocks[idx(lx, col.h, lz)] !== K.grass) continue;
      const trunk = 7 + Math.floor(hash3(seed, wx, 31, wz) * 6);
      const base = col.h + 1, topY = base + trunk - 1;
      for (let ly = topY - 2; ly <= topY + 1; ly++) {
        const rad = ly <= topY - 1 ? 3 : 2;
        for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
          if (dx * dx + dz * dz > rad * rad + 1) continue;
          put(lx + dx, ly, lz + dz, K.jungle_leaves, true);
          // lianas colgando del borde de la copa
          if (ly === topY - 2 && dx * dx + dz * dz >= (rad - 1) * (rad - 1) && hash3(seed, wx + dx, ly, wz + dz) < 0.35) {
            const len = 1 + Math.floor(hash3(seed, wx + dx, 3, wz + dz) * 4);
            for (let k = 1; k <= len; k++) put(lx + dx, ly - k, lz + dz, K.vine, true);
          }
        }
      }
      for (let k = 0; k < trunk; k++) put(lx, base + k, lz, K.jungle_log, false);
    }
    // cafetos silvestres en las faldas y caña a la orilla del agua
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = colAt(lx, lz);
      const top = col.h;
      const i = idx(lx, top, lz);
      const r = hash3(seed, x0 + lx, 8080, z0 + lz);
      if (blocks[i] === K.grass && blocks[i + 256] === 0 && (col.biome === 'forest' || col.biome === 'plains') && top > 74 && top < 96 && r < 0.025) blocks[i + 256] = r < 0.012 ? K.cafe3 : K.cafe2;
      if ((blocks[i] === K.grass || blocks[i] === K.sand || blocks[i] === K.dirt) && top >= SEA && blocks[i + 256] === 0 && r > 0.93 && (col.biome === 'jungle' || col.biome === 'plains' || col.biome === 'beach')) {
        let water = false;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = lx + dx, zz = lz + dz; if (xx >= 0 && xx < 16 && zz >= 0 && zz < 16 && blocks[idx(xx, top, zz)] === K.water) water = true; }
        if (water) { const hh = 1 + Math.floor(hash3(seed, x0 + lx, 3, z0 + lz) * 3); for (let k = 1; k <= hh; k++) blocks[idx(lx, top + k, lz)] = K.cane; }
      }
    }
    // esferas de piedra (Diquís) en llanuras
    const rnd = mulberry32((seed ^ Math.imul(cx, 2654435761) ^ Math.imul(cz, 40503)) >>> 0);
    if (rnd() < 0.02) {
      const lx = 4 + Math.floor(rnd() * 8), lz = 4 + Math.floor(rnd() * 8);
      const col = colAt(lx, lz);
      if (col.biome === 'plains' && col.h > SEA + 1) {
        const r = 2 + rnd() * 1.4;
        const cyw = col.h + r - 0.6;
        const n = Math.ceil(r);
        for (let dy = -n; dy <= n; dy++) for (let dz = -n; dz <= n; dz++) for (let dx = -n; dx <= n; dx++) {
          if (dx * dx + (dy + 0.5) * (dy + 0.5) + dz * dz > r * r) continue;
          put(lx + dx, Math.round(cyw + dy), lz + dz, K.smooth_stone, false);
        }
      }
    }
  }
}

// Botín de las ruinas
function lootTable(rnd) {
  const pool = [
    [378, 1, 1, 0.05], [258, 1, 5, 0.6], [259, 1, 4, 0.4], [260, 1, 2, 0.18], [257, 3, 12, 0.7], [263, 1, 3, 0.4], [261, 1, 4, 0.5],
    [267, 2, 6, 0.45], [269, 2, 6, 0.45], [271, 1, 4, 0.35], [K.torch, 4, 12, 0.6], [273, 1, 2, 0.08], [K.obsidian, 1, 3, 0.15],
    [TOOL_IDS.iron_pickaxe, 1, 1, 0.08], [ARMOR_IDS.iron_chest, 1, 1, 0.08], [ARMOR_IDS.iron_head, 1, 1, 0.1], [K.dynamite, 1, 3, 0.2],
  ];
  const slots = new Array(27).fill(null);
  for (const [id, a, b, p] of pool) {
    if (rnd() > p) continue;
    let k = Math.floor(rnd() * 27);
    while (slots[k]) k = (k + 1) % 27;
    slots[k] = { id, count: a + Math.floor(rnd() * (b - a + 1)) };
    if (ITEMS[id] && ITEMS[id].durability) slots[k].dur = ITEMS[id].durability;
  }
  return slots;
}
