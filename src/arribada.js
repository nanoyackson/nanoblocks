// La arribada: cada 14 noches (desde el día 7), si uno está en la playa, cientos de tortugas lora salen del mar al
// mismo tiempo, suben a la arena, cavan, dejan su nido y vuelven al agua. Están protegidas: no se tocan.
import { armarLora } from './modelos-otros.js';
import { BLOCK_BY_KEY as K, FLUID, SOLID, AIR } from './blocks.js';
import { SEA } from './worldgen.js';
import { anotarArribada } from './arrecife.js';

export const noche_arribada = (g) => (g.day || 1) % 14 === 7;

export const TORTUGA_LORA = {
  name: 'Tortuga lora', w: 0.7, h: 0.35, health: 15, speed: 0.6, hurtSound: null, idleSound: null,
  particle: [[0.4, 0.45, 0.3]], drops: [],
  build() { return armarLora(); },
  brain(m, dt, c) {
    const { g } = c, w = g.world, b = m.body.pos, d = m.data;
    d.estado = d.estado || 'sube';
    d.t = (d.t || 0) + dt;
    if (!d.dir) d.dir = d.dirMar ? { x: -d.dirMar.x, z: -d.dirMar.z } : { x: 1, z: 0 };
    const enArena = w.getBlock(Math.floor(b.x), Math.floor(b.y) - 1, Math.floor(b.z)) === K.sand;
    if (d.estado === 'sube') {
      m.goTo(b.x + d.dir.x * 3, b.z + d.dir.z * 3, 1);
      if ((d.t > 3 + (d.seed || 0) * 4 && enArena && !FLUID[w.getBlock(Math.floor(b.x), Math.floor(b.y), Math.floor(b.z))]) || d.t > 20) { d.estado = 'cava'; d.t = 0; }
      return true;
    }
    if (d.estado === 'cava') {
      m.moving = false;
      if (Math.random() < dt * 3) g.particles.burst(b.x, b.y + 0.1, b.z, [[0.85, 0.78, 0.55]], 4, 1.2);
      if (d.t > 6) {
        // no todas dejan bloque de nido (si no, la playa queda tapizada)
        const x = Math.floor(b.x), y = Math.floor(b.y), z = Math.floor(b.z);
        if (Math.random() < 0.25 && w.getBlock(x, y, z) === AIR && SOLID[w.getBlock(x, y - 1, z)]) { w.setBlock(x, y, z, K.turtle_nest); w.setBE(x, y, z, { type: 'nest', lora: true, dia: g.day, eclosiona: (g.day || 1) + 5 }); } // v12.6.1: con entidad; v12.6.4: nacen a la quinta noche, como en la playa de verdad (fauna.js tickNests)
        d.estado = 'baja'; d.t = 0;
        g.arribadaNidos = (g.arribadaNidos || 0) + 1;
      }
      return true;
    }
    m.goTo(b.x - d.dir.x * 3, b.z - d.dir.z * 3, 1);
    if (FLUID[w.getBlock(Math.floor(b.x), Math.floor(b.y), Math.floor(b.z))] || d.t > 30) m.dead = true;
    return true;
  },
  animate(m, dt, u) { u.fins.forEach((f, i) => { f.rotation.y = Math.sin(m.t * 3 + i) * (m.moving ? 0.6 : (m.data.estado === 'cava' ? 0.4 : 0.1)); }); },
  onHurt(m, g) { g.ui.toast('¡No! Las tortugas lora están protegidas: deje que desoven en paz', 1800); return false; },
};

export function tickArribada(g, dt) {
  if (g.dim !== 'tierra' || g.daylight > 0.3 || !noche_arribada(g)) return;
  g.arribadaT = (g.arribadaT || 0) - dt;
  if (g.arribadaT > 0) return;
  g.arribadaT = 0.6;
  const p = g.player.body.pos, w = g.world, E = g.entities;
  const bio = g.env && g.env.biome;
  if (bio !== 'beach' && bio !== 'ocean') return;
  const vivas = E.mobs.filter((m) => m.type === 'tortuga_lora' && !m.dead).length;
  if (vivas >= 26) return;
  for (let k = 0; k < 40; k++) {
    const ax = Math.floor(p.x + (Math.random() - 0.5) * 50), az = Math.floor(p.z + (Math.random() - 0.5) * 50);
    if (!w.isLoaded(ax, az) || FLUID[w.getBlock(ax, SEA, az)] !== 1) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (w.getBlock(ax + dx * 3, SEA, az + dz * 3) === K.sand || w.getBlock(ax + dx * 3, SEA + 1, az + dz * 3) === K.sand) {
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const m = E.spawnMob('tortuga_lora', ax + dx + 0.5 + (Math.random() - 0.5) * 3 * Math.abs(dz), SEA + 1.1, az + dz + 0.5 + (Math.random() - 0.5) * 3 * Math.abs(dx));
          m.data.dirMar = { x: -dx, z: -dz }; m.data.seed = Math.random();
        }
        if (g.meta.arribadaAviso !== g.day) { g.meta.arribadaAviso = g.day; anotarArribada(g); g.ui.toast('🐢 ¡Arribada! Cientos de tortugas lora salen a desovar. No las toque; con una estaca de nido puede proteger los nidos', 4600); }
        g.arribadaVistas = (g.arribadaVistas || 0) + n;
        if (g.arribadaVistas >= 15) g.achieve('arribada', 'Vi la arribada');
        return;
      }
    }
  }
}
