// Pulido visual: polvo al correr (del color del suelo), huellas en la arena y el barro, gotas al salir del agua
// y hojas que caen de los árboles (secas en verano).
import { BLOCKS, AIR, FLUID } from './blocks.js';
import { tilePixels } from './textures.js';

const colorCache = new Map();
function coloresDe(id) {
  if (colorCache.has(id)) return colorCache.get(id);
  const b = BLOCKS[id];
  let px = null;
  if (b && b.tex) { const t = typeof b.tex === 'string' ? b.tex : b.tex.top || b.tex.side; try { px = tilePixels(t); } catch { px = null; } }
  const out = px && px.length ? px : [[0.45, 0.36, 0.25]];
  colorCache.set(id, out);
  return out;
}
const HUELLA = new Set(['sand', 'red_sand', 'gravel', 'dirt', 'mud', 'barro', 'snow', 'arena_negra']);

export function tickPulido(g, dt) {
  if (!g.player.alive || g.hudHidden === 'cine') return;
  const P = g.particles, pl = g.player, b = pl.body, p = b.pos, w = g.world;
  const suelo = w.getBlock(Math.floor(p.x), Math.floor(p.y - 0.2), Math.floor(p.z));
  const vel = Math.hypot(b.vel.x, b.vel.z);
  // polvo al correr
  if (b.onGround && pl.sprinting && vel > 4 && suelo !== AIR && !FLUID[suelo]) {
    g.polvoT = (g.polvoT || 0) - dt;
    if (g.polvoT <= 0) {
      g.polvoT = 0.05;
      const cols = coloresDe(suelo);
      for (let k = 0; k < 2; k++) P.spawn(p.x - b.vel.x * 0.04 + (Math.random() - 0.5) * 0.4, p.y + 0.05, p.z - b.vel.z * 0.04 + (Math.random() - 0.5) * 0.4, cols[Math.floor(Math.random() * cols.length)], -b.vel.x * 0.08 + (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.8, -b.vel.z * 0.08 + (Math.random() - 0.5) * 0.6, 0.45 + Math.random() * 0.3, 4);
    }
  }
  // caminando sobre suelo suelto, un polvito de vez en cuando
  else if (b.onGround && vel > 2 && HUELLA.has(BLOCKS[suelo] && BLOCKS[suelo].key)) {
    g.polvoT = (g.polvoT || 0) - dt;
    if (g.polvoT <= 0) { g.polvoT = 0.2; const c = coloresDe(suelo); P.spawn(p.x + (Math.random() - 0.5) * 0.4, p.y + 0.04, p.z + (Math.random() - 0.5) * 0.4, c[Math.floor(Math.random() * c.length)], (Math.random() - 0.5) * 0.4, 0.5, (Math.random() - 0.5) * 0.4, 0.4, 2); }
  }
  // al pasar entre el zacate, las matas o las hojas se desprenden pedacitos
  if (vel > 1.2) {
    const x = Math.floor(p.x), z = Math.floor(p.z);
    for (const y of [Math.floor(p.y + 0.1), Math.floor(p.y + 1.2)]) {
      const id = w.getBlock(x, y, z), B = BLOCKS[id];
      if (!B || !(B.leafy || B.render === 'cross')) continue;
      g.rozaD = (g.rozaD || 0) + vel * dt;
      if (g.rozaD > 0.7) {
        g.rozaD = 0;
        const c = coloresDe(id);
        for (let k = 0; k < 4; k++) P.spawn(p.x + (Math.random() - 0.5) * 0.7, y + 0.2 + Math.random() * 0.6, p.z + (Math.random() - 0.5) * 0.7, c[Math.floor(Math.random() * c.length)], (Math.random() - 0.5) * 1.1, 0.9, (Math.random() - 0.5) * 1.1, 0.55, 7);
      }
      break;
    }
  }
  // andando en agua bajita, ondas alrededor de las piernas
  if (b.inWater && !b.headInWater && vel > 1) {
    g.ondaD = (g.ondaD || 0) + vel * dt;
    if (g.ondaD > 0.8) {
      g.ondaD = 0;
      let y = Math.floor(p.y);
      while (FLUID[w.getBlock(Math.floor(p.x), y + 1, Math.floor(p.z))] && y < p.y + 2) y++;
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; P.spawn(p.x + Math.cos(a) * 0.3, y + 0.92, p.z + Math.sin(a) * 0.3, [0.82, 0.92, 1], Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3, 0.45, 0); }
    }
  }
  // huellas en la arena, el barro y la grava: marquitas oscuras que duran unos segundos
  if (b.onGround && vel > 1 && HUELLA.has(BLOCKS[suelo] && BLOCKS[suelo].key)) {
    g.pasoD = (g.pasoD || 0) + vel * dt;
    if (g.pasoD > 0.9) {
      g.pasoD = 0;
      g.pie = !g.pie;
      const cols = coloresDe(suelo), c = cols[0];
      const lado = g.pie ? 0.18 : -0.18, ang = Math.atan2(b.vel.x, b.vel.z);
      const hx = p.x + Math.cos(ang) * lado, hz = p.z - Math.sin(ang) * lado;
      for (let k = 0; k < 3; k++) P.spawn(hx + Math.sin(ang) * (k - 1) * 0.08, Math.floor(p.y) + 0.03, hz + Math.cos(ang) * (k - 1) * 0.08, [c[0] * 0.55, c[1] * 0.5, c[2] * 0.45], 0, 0, 0, 6, 0);
    }
  }
  // gotas al salir del agua
  if (b.inWater) g.mojadoT = 3;
  else if ((g.mojadoT || 0) > 0) {
    g.mojadoT -= dt;
    g.gotaT = (g.gotaT || 0) - dt;
    if (g.gotaT <= 0) {
      g.gotaT = 0.07 + (3 - g.mojadoT) * 0.05;
      P.spawn(p.x + (Math.random() - 0.5) * 0.5, p.y + 0.4 + Math.random() * 1.2, p.z + (Math.random() - 0.5) * 0.5, [0.55, 0.75, 1], 0, -0.5, 0, 0.6, 16);
    }
  }
  // hojas que caen
  g.hojaT = (g.hojaT || 0) - dt;
  if (g.hojaT <= 0 && g.dim === 'tierra') {
    g.hojaT = 0.25;
    const verano = g.season === 'verano';
    for (let k = 0; k < 4; k++) {
      const x = Math.floor(p.x + (Math.random() - 0.5) * 24), z = Math.floor(p.z + (Math.random() - 0.5) * 24);
      for (let y = Math.floor(p.y) + 10; y > p.y - 2; y--) {
        const id = w.getBlock(x, y, z);
        if (id === AIR) continue;
        if (BLOCKS[id].leafy && w.getBlock(x, y - 1, z) === AIR) {
          const col = verano && Math.random() < 0.6 ? [[0.75, 0.55, 0.2], [0.65, 0.4, 0.15], [0.8, 0.7, 0.3]][k % 3] : [[0.3, 0.55, 0.2], [0.4, 0.62, 0.25], [0.5, 0.65, 0.2]][k % 3];
          const viento = g.weather && g.weather.intensity > 0.3 ? 1.5 : 0.4;
          P.spawn(x + Math.random(), y - 0.05, z + Math.random(), col, (Math.random() - 0.5) * viento, -0.3, (Math.random() - 0.5) * viento, 4 + Math.random() * 2, 0.35);
        }
        break;
      }
    }
  }
}
