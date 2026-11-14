// Hilo aparte del "Horizonte lejano": calcula alturas y colores del terreno a baja resolución,
// con el mismo generador del mundo, para no trabar el juego.
import { Generator, SEA } from './worldgen.js';
import { hash3 } from './noise.js';
import { construirBaldosa } from './lodmesh.js';

let gen = null;

const COL = {
  grass: [0.33, 0.56, 0.2], dirt: [0.42, 0.3, 0.2], sand: [0.84, 0.77, 0.55], sandSide: [0.74, 0.66, 0.46],
  snow: [0.93, 0.95, 0.98], stone: [0.48, 0.48, 0.5], stoneSide: [0.4, 0.4, 0.42], water: [0.16, 0.34, 0.68],
  leaf: [0.2, 0.42, 0.14], birch: [0.36, 0.52, 0.22], ice: [0.68, 0.8, 0.96],
  basalt: [0.3, 0.3, 0.33], basaltSide: [0.24, 0.24, 0.27], lava: [1.0, 0.45, 0.08], jungle: [0.12, 0.34, 0.1],
};

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'init') { gen = new Generator(m.seed, m.genVersion || 1, 'tierra', m.tipo || 'normal'); return; }
  if (m.type !== 'tile' || !gen) return;
  const { id, x0, z0, cells, step } = m;
  const N = cells + 2; // borde de 1 celda para las caras laterales
  const h = new Int16Array(N * N);
  const top = new Float32Array(N * N * 3);
  const side = new Float32Array(N * N * 3);
  const water = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wx = x0 + (i - 1) * step + (step >> 1), wz = z0 + (j - 1) * step + (step >> 1);
    const c = gen.column(wx, wz);
    let height = c.h;
    let t, s;
    const k = j * N + i;
    switch (c.biome) {
      case 'desert': case 'beach': t = COL.sand; s = COL.sandSide; break;
      case 'ocean': t = COL.sand; s = COL.sandSide; break;
      case 'snowy': t = COL.snow; s = COL.dirt; break;
      case 'mountains': t = height > 104 ? COL.snow : COL.stone; s = COL.stoneSide; break;
      case 'paramo': t = [0.62, 0.56, 0.32]; s = COL.dirt; break;
      case 'volcano': {
        const kk = c.volcanoK || 0;
        if (kk < 0.5) { const tint = Generator.tintFor(c.temp, c.wet); t = [COL.grass[0] * tint[0], COL.grass[1] * tint[1], COL.grass[2] * tint[2]]; s = COL.dirt; }
        else { t = COL.basalt; s = COL.basaltSide; }
        break;
      }
      default: {
        const tint = Generator.tintFor(c.temp, c.wet);
        t = [COL.grass[0] * tint[0], COL.grass[1] * tint[1], COL.grass[2] * tint[2]]; s = COL.dirt;
      }
    }
    // copas de árboles: bosques con manchas más altas y oscuras
    const r = hash3(gen.seed, Math.floor(wx / step), 555, Math.floor(wz / step));
    if (height > SEA && (c.biome === 'forest' && r < 0.55 || c.biome === 'jungle' && r < 0.8 || c.biome === 'plains' && r < 0.06 || c.biome === 'snowy' && r < 0.12 || c.biome === 'nuboso' && r < 0.6 || c.biome === 'bosque_seco' && r < 0.1 || c.biome === 'manglar' && r < 0.45)) {
      height += c.biome === 'jungle' ? 9 + Math.floor(r * 6) : 4 + Math.floor(r * 4);
      const tint = Generator.tintFor(c.temp, c.wet);
      const lc = c.biome === 'jungle' ? COL.jungle : c.biome === 'forest' && r < 0.15 ? COL.birch : COL.leaf;
      t = [lc[0] * tint[0], lc[1] * tint[1], lc[2] * tint[2]]; s = [t[0] * 0.75, t[1] * 0.75, t[2] * 0.75];
    }
    if (c.lavaTop && c.lavaTop > height) { height = c.lavaTop; t = COL.lava; s = COL.basaltSide; }
    if (height < SEA) {
      water[k] = 1;
      t = c.biome === 'snowy' || c.temp < -0.35 ? COL.ice : COL.water;
      // el agua más profunda se ve más oscura
      const deep = Math.min(1, (SEA - height) / 18);
      t = [t[0] * (1 - deep * 0.45), t[1] * (1 - deep * 0.35), t[2] * (1 - deep * 0.2)];
      height = SEA;
    }
    // pequeña variación para que no se vea plano
    const v = 0.94 + hash3(gen.seed, wx, 7, wz) * 0.1;
    h[k] = height;
    top[k * 3] = t[0] * v; top[k * 3 + 1] = t[1] * v; top[k * 3 + 2] = t[2] * v;
    side[k * 3] = s[0] * v; side[k * 3 + 1] = s[1] * v; side[k * 3 + 2] = s[2] * v;
  }
  // v12.0.1: la malla también se arma aquí (antes, 2–3 ms por baldosa en el hilo principal)
  const { pos, col, idx } = construirBaldosa({ h, top, side, water, cells, step });
  self.postMessage({ id, pos, col, idx, cells, step, x0, z0 }, [pos.buffer, col.buffer, idx.buffer]);
};
