// Generador de la dimensión del Inframundo Volcánico: una caverna enorme bajo un techo de basalto,
// con mar de lava, islas y columnas de basalto, ceniza, azufre, oro volcánico, magma, hongos de fuego
// y cascadas de lava que caen del techo. Sin gráficos (lo puede usar un worker).
import { Simplex, hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

export const LAVA_SEA = 37;
const CH = 16;
const idx = (x, y, z) => x + z * CH + y * CH * CH;

function noises(gen) {
  if (!gen.infN) {
    const s = gen.seed ^ 0x1f1f1f;
    gen.infN = { a: new Simplex(s), b: new Simplex(s ^ 0x55), c: new Simplex(s ^ 0xaa), d: new Simplex(s ^ 0x77), e: new Simplex(s ^ 0x99) };
  }
  return gen.infN;
}

export function columnInfra(gen, x, z) {
  const n = noises(gen);
  // piso continuo y caminable con lomas suaves; la lava queda en las hondonadas
  const floor = Math.floor(43 + n.a.fbm2(x * 0.007, z * 0.007, 4) * 24 + Math.max(0, n.b.fbm2(x * 0.025, z * 0.025, 2)) * 7);
  const ceil = Math.max(floor + 26, Math.floor(108 + n.c.fbm2(x * 0.018, z * 0.018, 3) * 8));
  return { h: Math.max(floor, LAVA_SEA), floor, ceil, biome: 'inframundo', temp: 0.6, wet: -1, lavaSea: floor < LAVA_SEA };
}

export function genInfra(gen, cx, cz, blocks) {
  const n = noises(gen);
  const seed = gen.seed;
  const x0 = cx * CH, z0 = cz * CH;
  for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
    const wx = x0 + lx, wz = z0 + lz;
    const { floor, ceil } = columnInfra(gen, wx, wz);
    const ash = n.d.noise2(wx * 0.025, wz * 0.025) > 0.15;
    blocks[idx(lx, 0, lz)] = K.bedrock;
    for (let y = 1; y <= floor; y++) {
      let id = K.basalt;
      const r = hash3(seed, wx, y, wz);
      if (y > floor - 3) id = ash ? K.ceniza : K.basalto_columnar;
      else if (n.e.noise3(wx * 0.08, y * 0.08, wz * 0.08) > 0.55 && r < 0.6) id = K.azufre_ore;
      else if (y < 45 && r < 0.012) id = K.oro_volcanico;
      else if (r < 0.02) id = K.obsidian;
      else if (r < 0.06) id = K.piedra_pomez;
      blocks[idx(lx, y, lz)] = id;
    }
    // la orilla del mar de lava es de magma
    if (floor <= LAVA_SEA + 1 && floor >= LAVA_SEA - 2) blocks[idx(lx, floor, lz)] = K.magma;
    for (let y = floor + 1; y <= LAVA_SEA; y++) blocks[idx(lx, y, lz)] = K.lava;
    // islas flotantes y estalactitas: escasas y bien arriba del piso, para que se pueda caminar
    const lo = Math.max(floor, LAVA_SEA) + 9;
    for (let y = lo; y < ceil; y++) {
      const nearCeil = Math.max(0, 1 - (ceil - y) / 9) * 0.4;
      const v = n.b.noise3(wx * 0.035, y * 0.05, wz * 0.035) + nearCeil;
      if (v > 0.7) blocks[idx(lx, y, lz)] = v > 0.82 ? K.basalt : K.basalto_columnar;
    }
    // columnas que van del piso al techo (de vez en cuando)
    if (n.e.noise2(wx * 0.09, wz * 0.09) > 0.86) for (let y = Math.max(floor, LAVA_SEA) + 1; y < ceil; y++) blocks[idx(lx, y, lz)] = K.basalto_columnar;
    for (let y = ceil; y < 127; y++) blocks[idx(lx, y, lz)] = hash3(seed, wx, y, wz) < 0.04 ? K.magma : K.basalt;
    blocks[idx(lx, 127, lz)] = K.bedrock;
    // hongos de fuego sobre la ceniza
    const top = blocks[idx(lx, floor, lz)];
    if (floor > LAVA_SEA && top === K.ceniza && blocks[idx(lx, floor + 1, lz)] === 0 && hash3(seed, wx, 777, wz) < 0.07) blocks[idx(lx, floor + 1, lz)] = K.hongo_fuego;
    // cascadas de lava del techo
    if (hash3(seed, wx, 555, wz) < 0.0016) {
      for (let y = ceil - 1; y > Math.max(floor, LAVA_SEA); y--) {
        if (blocks[idx(lx, y, lz)] !== 0) break;
        blocks[idx(lx, y, lz)] = K.lava_fall;
      }
    }
  }
  return [];
}
