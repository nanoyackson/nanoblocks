// Generación del terreno: alturas, biomas, cuevas, minerales, árboles y plantas.
import { buildRoadsInChunk } from './carreteras.js';
import { Simplex, mulberry32, hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { GenV2 } from './worldgen2.js';
import { buildFuegoInChunk } from './fuego.js';
import { buildVillageInChunk } from './pueblogen.js';
import { genInfra, columnInfra } from './infragen.js';
import { genCielo, columnCielo } from './cielogen.js';
import { buildStructuresInChunk, cercaDeObra } from './estructuras.js';

export const CHUNK = 16;
export const HEIGHT = 128;
export const SEA = 62;

export const BIOMES = {
  plains: 'Llanura', forest: 'Bosque', desert: 'Desierto', snowy: 'Tundra nevada',
  beach: 'Playa', ocean: 'Océano', mountains: 'Montañas', jungle: 'Selva tropical', volcano: 'Volcán',
  nuboso: 'Bosque nuboso', manglar: 'Manglar', bosque_seco: 'Bosque seco', paramo: 'Páramo',
};

export function idx(x, y, z) { return x + z * CHUNK + y * CHUNK * CHUNK; }

export class Generator {
  // version 1 = mundos creados antes de la v1.3 (se mantienen idénticos); 2 = generador nuevo
  constructor(seed, version = 2, dim = 'tierra', tipo = 'normal') {
    this.seed = seed >>> 0;
    this.version = version;
    this.dim = dim;
    // v11.13.0: el tipo de mundo. «compacto» (Tiquicia de bolsillo): biomas 2.25 veces más chicos y las estructuras cerca
    // (estructuras.js: sitiosAnillo); se fija aquí, antes de que se llenen los cachés de estructuras y pueblos
    this.tipo = tipo === 'compacto' ? 'compacto' : 'normal';
    this.compacto = this.tipo === 'compacto';
    this.kb = this.compacto ? 2.25 : 1;
    this.kc = this.compacto ? 1.6 : 1; // continentes un poco más chicos: el mar queda cerca para lo de costa
    const s = this.seed;
    this.nCont = new Simplex(s ^ 0x1234);
    this.nHill = new Simplex(s ^ 0x2345);
    this.nMount = new Simplex(s ^ 0x3456);
    this.nTemp = new Simplex(s ^ 0x4567);
    this.nWet = new Simplex(s ^ 0x5678);
    this.nRiver = new Simplex(s ^ 0x6789);
    this.nCaveA = new Simplex(s ^ 0x789a);
    this.nCaveB = new Simplex(s ^ 0x89ab);
    this.nCaveC = new Simplex(s ^ 0x9abc);
    this.v2 = version >= 2 ? new GenV2(this) : null;
    if (this.v2) this.v2.cercaDeObra = (x, z) => cercaDeObra(this, x, z); // v13.3.0 (I1): bocaIn pregunta si hay una obra cerca
  }

  // Altura y bioma de una columna del mundo.
  column(x, z) {
    if (this.dim === 'inframundo') return columnInfra(this, x, z);
    if (this.dim === 'cielo') return columnCielo(this, x, z);
    const c = this.nCont.fbm2(x * 0.0016 * this.kc, z * 0.0016 * this.kc, 4); // en compacto, mares y tierras también más cerca
    const hill = this.nHill.fbm2(x * 0.008, z * 0.008, 4);
    const m = Math.max(0, this.nMount.fbm2(x * 0.004, z * 0.004, 3) - 0.12) * 1.7;
    let h = 64 + c * 24 + hill * 6 * (0.6 + Math.max(0, c)) + m * m * 60;
    // ríos: valles finos donde el ruido cruza por cero
    const r = Math.abs(this.nRiver.fbm2(x * 0.0025, z * 0.0025, 3));
    if (r < 0.045 && h > SEA - 2) {
      const k = r / 0.045; // 0 en el centro del río
      h = (SEA - 3) + (h - (SEA - 3)) * (k * k);
    }
    h = Math.max(6, Math.min(HEIGHT - 10, Math.floor(h)));
    const temp = this.nTemp.fbm2(x * 0.0011 * this.kb + 300, z * 0.0011 * this.kb, 3) - (h > 90 ? (h - 90) * 0.02 : 0);
    const wet = this.nWet.fbm2(x * 0.0013 * this.kb, z * 0.0013 * this.kb + 500, 3);
    let biome;
    if (h < SEA - 3) biome = 'ocean';
    else if (h <= SEA + 1 && temp > -0.3) biome = 'beach';
    else if (h > 92) biome = 'mountains';
    else if (temp < -0.3) biome = 'snowy';
    else if (temp > 0.28 && wet < 0.1) biome = 'desert';
    else if (wet > 0.08) biome = 'forest';
    else biome = 'plains';
    const col = { h, biome, temp, wet, rio: r };
    return this.v2 ? this.v2.shapeColumn(x, z, col) : col;
  }

  isCave(x, y, z) {
    // "espagueti": dos ruidos que cruzan por cero a la vez forman túneles
    const a = this.nCaveA.noise3(x * 0.022, y * 0.034, z * 0.022);
    if (Math.abs(a) < 0.075) {
      const b = this.nCaveB.noise3(x * 0.022, y * 0.034, z * 0.022);
      if (Math.abs(b) < 0.075) return true;
    }
    // cavernas grandes ("queso") en lo profundo
    if (y < 48) {
      const c = this.nCaveC.noise3(x * 0.014, y * 0.022, z * 0.014);
      if (c > 0.6 - (48 - y) * 0.002) return true;
    }
    return false;
  }

  // Llena un Uint8Array de un chunk.
  // Tinte suave del pasto y las hojas según temperatura y humedad (continuo, sin bordes entre chunks).
  static tintFor(temp, wet) {
    const cl = (v) => Math.max(0.72, Math.min(1.15, v));
    return [cl(1 + 0.16 * temp - 0.1 * wet), cl(1 + 0.03 * wet - 0.08 * Math.max(0, -temp)), cl(0.94 - 0.22 * temp + 0.1 * wet)];
  }

  // Llena el chunk y devuelve las estructuras con datos (cofres con botín).
  generate(cx, cz, blocks, tint) {
    if (this.dim === 'inframundo') return genInfra(this, cx, cz, blocks);
    if (this.dim === 'cielo') {
      // tinte del pasto y las hojas: verde fresco de altura (sin esto quedan negros)
      if (tint) { const tc = Generator.tintFor(0.05, 0.25); for (let i = 0; i < tint.length; i += 3) { tint[i] = tc[0]; tint[i + 1] = tc[1]; tint[i + 2] = tc[2]; } }
      return genCielo(this, cx, cz, blocks);
    }
    if (this.v2) {
      const M = 3, W = CHUNK + M * 2;
      const x0v = cx * CHUNK, z0v = cz * CHUNK;
      const colsV = new Array(W * W);
      for (let dz = 0; dz < W; dz++) for (let dx = 0; dx < W; dx++) colsV[dx + dz * W] = this.column(x0v + dx - M, z0v + dz - M);
      const colAtV = (lx, lz) => colsV[(lx + M) + (lz + M) * W];
      const structures = this.v2.generate(cx, cz, blocks, tint, colAtV);
      this.plantLife(cx, cz, blocks, colAtV, M);
      this.v2.decorate(cx, cz, blocks, colAtV, M);
      if (this.version >= 4) this.v2.decorate4(cx, cz, blocks, colAtV, M);
      // carreteras entre pueblos (generador v6): antes que los pueblos y monumentos, que se dibujan encima
      if (this.version >= 6) buildRoadsInChunk(this, cx, cz, blocks, idx, structures);
      // pueblos ticos (generador v3 en adelante): van de último para despejar árboles y plantas
      if (this.version >= 3) for (const st of buildVillageInChunk(this, cx, cz, blocks, idx)) structures.push(st);
      // monumentos ticos (generador v5)
      if (this.version >= 5) for (const st of buildStructuresInChunk(this, cx, cz, blocks, idx)) structures.push(st);
      // v12.15.2 (C7, generador v21): los tubos de lava de los volcanes y la cámara del magma
      if (this.version >= 21) for (const st of buildFuegoInChunk(this, cx, cz, blocks, idx, colAtV)) structures.push(st);
      return structures;
    }
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const seed = this.seed;
    // columnas con margen de 3 para árboles de los vecinos
    const M = 3, W = CHUNK + M * 2;
    const cols = new Array(W * W);
    for (let dz = 0; dz < W; dz++) for (let dx = 0; dx < W; dx++) cols[dx + dz * W] = this.column(x0 + dx - M, z0 + dz - M);
    const colAt = (lx, lz) => cols[(lx + M) + (lz + M) * W];

    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = x0 + lx, wz = z0 + lz;
      const { h, biome, temp, wet } = colAt(lx, lz);
      if (tint) {
        const tc = Generator.tintFor(temp, wet);
        const ti = (lx + lz * CHUNK) * 3;
        tint[ti] = tc[0]; tint[ti + 1] = tc[1]; tint[ti + 2] = tc[2];
      }
      const underwater = h < SEA;
      let top, filler;
      switch (biome) {
        case 'desert': top = K.sand; filler = K.sand; break;
        case 'beach': top = K.sand; filler = K.sand; break;
        case 'ocean': {
          const f = hash3(seed, wx >> 3, 7, wz >> 3);
          top = f < 0.55 ? K.sand : f < 0.8 ? K.gravel : K.clay; filler = top === K.clay ? K.clay : K.sand; break;
        }
        case 'snowy': top = underwater ? K.dirt : K.snow_grass; filler = K.dirt; break;
        case 'mountains': top = h > 104 ? K.snow : K.stone; filler = K.stone; break;
        default: top = underwater ? K.dirt : K.grass; filler = K.dirt;
      }
      const carveTopLimit = underwater || biome === 'beach' ? h - 4 : h;
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0) id = K.bedrock;
        else if (y <= 3 && hash3(seed, wx, y, wz) < 0.55 - y * 0.12) id = K.bedrock;
        else if (y === h) id = top;
        else if (y > h - 4) id = filler;
        else if (biome === 'desert' && y > h - 8) id = K.sandstone;
        else id = K.stone;
        if (id !== K.bedrock && y > 4 && y <= carveTopLimit && this.isCave(wx, y, wz)) {
          id = 0; // aire (lava en una versión futura)
        }
        blocks[idx(lx, y, lz)] = id;
      }
      if (underwater) {
        for (let y = h + 1; y <= SEA; y++) blocks[idx(lx, y, lz)] = K.water;
        if (biome === 'snowy' || (biome === 'ocean' && colAt(lx, lz).temp < -0.35)) blocks[idx(lx, SEA, lz)] = K.ice;
      }
    }

    // ---- minerales en vetas ----
    const rnd = mulberry32((seed ^ Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663)) >>> 0);
    const ores = [
      { id: K.coal_ore, veins: 18, size: 9, maxY: 110 },
      { id: K.iron_ore, veins: 10, size: 6, maxY: 64 },
      { id: K.gold_ore, veins: 3, size: 6, maxY: 32 },
      { id: K.diamond_ore, veins: 2, size: 5, maxY: 16 },
      { id: K.gravel, veins: 4, size: 14, maxY: 70 },
      { id: K.clay, veins: 1, size: 10, maxY: 60 },
    ];
    for (const ore of ores) {
      for (let v = 0; v < ore.veins; v++) {
        let x = Math.floor(rnd() * CHUNK), y = 5 + Math.floor(rnd() * (ore.maxY - 5)), z = Math.floor(rnd() * CHUNK);
        for (let s = 0; s < ore.size; s++) {
          if (x >= 0 && x < CHUNK && z >= 0 && z < CHUNK && y > 0 && y < HEIGHT) {
            const i = idx(x, y, z);
            if (blocks[i] === K.stone) blocks[i] = ore.id;
          }
          const d = Math.floor(rnd() * 6);
          if (d === 0) x++; else if (d === 1) x--; else if (d === 2) y++; else if (d === 3) y--; else if (d === 4) z++; else z--;
        }
      }
    }

    this.plantLife(cx, cz, blocks, colAt, M);
    return [];
  }

  // Árboles, cactus, pasto y flores (común a las dos versiones del generador)
  plantLife(cx, cz, blocks, colAt, M) {
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const seed = this.seed;
    // ---- árboles (incluye los de chunks vecinos que se meten en este) ----
    const put = (x, y, z, id, onlyAir) => {
      if (x < 0 || x >= CHUNK || z < 0 || z >= CHUNK || y < 1 || y >= HEIGHT) return;
      const i = idx(x, y, z);
      if (onlyAir && blocks[i] !== 0) return;
      blocks[i] = id;
    };
    for (let lz = -M; lz < CHUNK + M; lz++) for (let lx = -M; lx < CHUNK + M; lx++) {
      const wx = x0 + lx, wz = z0 + lz;
      const col = colAt(lx, lz);
      if (col.h <= SEA || col.h > 100) continue;
      const r = hash3(seed, wx, 999, wz);
      let density = 0;
      if (col.biome === 'jungle' || col.biome === 'volcano') continue;
      if (col.biome === 'forest') density = 0.03;
      else if (col.biome === 'plains') density = 0.0035;
      else if (col.biome === 'snowy') density = 0.008;
      else if (col.biome === 'desert') {
        // cactus: solo dentro de este chunk
        if (r < 0.004 && lx >= 0 && lx < CHUNK && lz >= 0 && lz < CHUNK) {
          const hh = 1 + Math.floor(hash3(seed, wx, 5, wz) * 3);
          for (let k = 1; k <= hh; k++) put(lx, col.h + k, lz, K.cactus, true);
        }
        continue;
      }
      if (r >= density) continue;
      // el suelo debe ser pasto (no cueva)
      if (lx >= 0 && lx < CHUNK && lz >= 0 && lz < CHUNK) {
        const g = blocks[idx(lx, col.h, lz)];
        if (g !== K.grass && g !== K.snow_grass) continue;
      }
      const birch = col.biome === 'forest' && hash3(seed, wx, 77, wz) < 0.3;
      const logId = birch ? K.birch_log : K.log;
      const leafId = birch ? K.birch_leaves : K.leaves;
      const trunk = 4 + Math.floor(hash3(seed, wx, 31, wz) * 3);
      const base = col.h + 1;
      const topY = base + trunk - 1;
      for (let ly = topY - 2; ly <= topY + 1; ly++) {
        const rad = ly <= topY - 1 ? 2 : 1;
        for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
          const corner = Math.abs(dx) === rad && Math.abs(dz) === rad;
          if (corner && (ly === topY + 1 || hash3(seed, wx + dx, ly, wz + dz) < 0.5)) continue;
          put(lx + dx, ly, lz + dz, leafId, true);
        }
      }
      for (let k = 0; k < trunk; k++) put(lx, base + k, lz, logId, false);
    }

    // ---- pasto alto y flores ----
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = colAt(lx, lz);
      if (col.h <= SEA) continue;
      const g = blocks[idx(lx, col.h, lz)];
      if (g !== K.grass) continue;
      const above = idx(lx, col.h + 1, lz);
      if (blocks[above] !== 0) continue;
      const r = hash3(seed, x0 + lx, 4242, z0 + lz);
      const grassChance = col.biome === 'jungle' ? 0.24 : col.biome === 'plains' ? 0.1 : 0.06;
      if (r < 0.012) blocks[above] = hash3(seed, x0 + lx, 1, z0 + lz) < 0.5 ? K.flower_red : K.flower_yellow;
      else if (r < grassChance) blocks[above] = K.tall_grass;
    }
  }

  // Busca un punto de aparición en tierra firme cerca del origen.
  findSpawn() {
    for (let r = 0; r < 4000; r += 8) {
      const steps = Math.max(1, Math.floor(r / 4));
      for (let s = 0; s < steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
        const c = this.column(x, z);
        if (c.h > SEA + 1 && c.h < 90 && (c.biome === 'plains' || c.biome === 'forest')) return { x: x + 0.5, y: c.h + 1, z: z + 0.5 };
      }
    }
    return { x: 0.5, y: 100, z: 0.5 };
  }
}
