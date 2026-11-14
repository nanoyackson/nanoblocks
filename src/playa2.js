// La playa brava: la corriente de resaca (jala mar adentro; se sale nadando paralelo a la playa, nunca contra ella), las aguamalas
// que flotan cerca de la orilla y dejan ardor (la sábila lo calma), y las rayas enterradas en la arena del agua bajita (si uno las
// pisa pican; arrastrando los pies, o sea agachado, se espantan solas). Estado: g.resaca (no se guarda).
import { difOf } from './supervivencia.js';
import { armarAguamala } from './modelos-cosas.js';
import { armarRaya } from './modelos-mar.js';
import { FLUID, BLOCK_BY_KEY as K } from './blocks.js';
import { tintModel } from './models.js';
import { SEA } from './worldgen.js';
import { hash3 } from './noise.js';

const CELDA = 26;
// ¿hay corriente de resaca en (x, z)? franjas fijas de la costa, unas sí y otras no
function corrienteEn(g, x, z) {
  const gen = g.world.gen, cx = Math.floor(x / CELDA), cz = Math.floor(z / CELDA);
  if (hash3(gen.seed, cx, 7771, cz) > 0.3) return null;
  const ox = (cx + 0.5) * CELDA, oz = (cz + 0.5) * CELDA;
  if (Math.hypot(x - ox, z - oz) > 6.5) return null;
  const col = gen.column(Math.floor(x), Math.floor(z));
  if (!(col.biome === 'ocean' || col.biome === 'beach') || col.h >= SEA || col.rio < 0.06) return null; // en los ríos no hay resaca
  // hacia dónde queda el mar: donde el fondo baja
  const h = (a, b) => gen.column(Math.floor(a), Math.floor(b)).h;
  let gx = h(x + 6, z) - h(x - 6, z), gz = h(x, z + 6) - h(x, z - 6);
  const l = Math.hypot(gx, gz);
  if (l < 0.5) return null;
  // tiene que haber arena o tierra cerca (no en alta mar)
  if (h(x - (gx / l) * 14, z - (gz / l) * 14) < SEA - 1) return null;
  return { x: -gx / l, z: -gz / l };
}
// cada cuadro: el jalón (una deriva firme mar adentro: contra ella no se avanza; de lado, sí)
export function tickResaca(g, dt) {
  const P = g.player, b = P.body;
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !P.alive || !b.inWater || g.riding) { if (g.resaca && !b.inWater) { g.resaca = null; g.resacaFuera = 0; } return; }
  if (g.resaca) {
    // corre el cuerpo mar adentro (la física del jugador se come un empujón de velocidad; así no)
    b.moveAxis(g.world, 'x', g.resaca.x * 2.2 * dt); b.moveAxis(g.world, 'z', g.resaca.z * 2.2 * dt); // con choque: no mete en bloques
  }
  g.resacaT = (g.resacaT || 0) - dt;
  if (g.resacaT > 0) return;
  g.resacaT = 0.4;
  const c = corrienteEn(g, b.pos.x, b.pos.z);
  if (c) {
    g.resacaFuera = 0;
    if (!g.resaca && !g.meta.resacaAviso) { g.meta.resacaAviso = true; g.ui.toast('🌊 ¡Resaca! No nade contra ella: nade paralelo a la playa', 4200); }
    g.resaca = c;
  } else if (g.resaca && (g.resacaFuera = (g.resacaFuera || 0) + 1) >= 3) {
    g.resaca = null; g.resacaFuera = 0;
    g.ui.toast('🌊 Se salió de la corriente. Ahora sí, a la orilla', 2200);
    g.achieve('resaca', 'Nadé paralelo a la playa');
  }
}
// ---------- las criaturas ----------
export const PLAYA2 = {
  // la aguamala: una campana morada medio transparente que va a la deriva, con los tentáculos colgando
  aguamala: {
    name: 'Aguamala', w: 0.5, h: 0.5, health: 2, speed: 0.3, swimmer: true, hurtSound: null, idleSound: null, idleEvery: [999, 999],
    particle: [[0.7, 0.55, 0.9], [0.8, 0.8, 1]], drops: [], xp: 1,
    build() { return armarAguamala(); },
    update(m, dt) {
      const g = m.game, b = m.body;
      // a la deriva, pegada a la superficie
      b.vel.y = ((SEA - 0.2) - b.pos.y) * 1.5;
      m.data.deriva = m.data.deriva || { x: Math.random() - 0.5, z: Math.random() - 0.5 };
      b.vel.x = m.data.deriva.x * 0.4; b.vel.z = m.data.deriva.z * 0.4;
      b.step(g.world, dt, { flying: true });
      m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
      const u = m.group.userData;
      u.campana.scale.set(1 + Math.sin(m.t * 2.5) * 0.08, 1 - Math.sin(m.t * 2.5) * 0.1, 1 + Math.sin(m.t * 2.5) * 0.08);
      u.tent.forEach((t, i) => { t.rotation.x = Math.sin(m.t * 2 + i) * 0.3; t.rotation.z = Math.cos(m.t * 1.7 + i) * 0.3; });
      if (!FLUID[g.world.getBlock(Math.floor(b.pos.x), Math.floor(b.pos.y), Math.floor(b.pos.z))]) m.data.deriva = { x: -m.data.deriva.x, z: -m.data.deriva.z };
      // el que la toca, se lleva el ardor
      const P = g.player, p = P.body.pos;
      m.data.cd = Math.max(0, (m.data.cd || 0) - dt);
      if (g.mode === 'survival' && P.alive && P.body.inWater && !g.riding && m.data.cd <= 0 && Math.hypot(p.x - b.pos.x, p.z - b.pos.z) < 0.9 && Math.abs(p.y + 0.6 - b.pos.y) < 1.2) {
        m.data.cd = 2;
        g.damagePlayer(2, null, null, 'El ardor de una aguamala', true, false);
        g.addEffect('ardor', 30);
        g.ui.toast('🪼 ¡Una aguamala! Arde. La sábila lo calma', 2600);
        g.achieve('aguamala', 'Me picó una aguamala');
      }
      if (Math.hypot(p.x - b.pos.x, p.z - b.pos.z) > 80) m.dead = true;
    },
  },
  // la raya: enterrada en la arena del agua bajita; casi ni se ve. Si se le pisa, pica; si uno se acerca arrastrando los pies, se va
  raya: {
    name: 'Raya', w: 0.8, h: 0.15, health: 8, speed: 1.6, swimmer: true, hurtSound: null, idleSound: null, idleEvery: [999, 999],
    particle: [[0.75, 0.68, 0.5]], drops: [], xp: 3,
    build() { return armarRaya(); },
    update(m, dt) {
      const g = m.game, b = m.body, D = m.data, P = g.player, p = P.body.pos;
      const d = Math.hypot(p.x - b.pos.x, p.z - b.pos.z);
      if (D.huye > 0) {
        D.huye -= dt;
        const l = d || 1; b.vel.x = -((p.x - b.pos.x) / l) * 3; b.vel.z = -((p.z - b.pos.z) / l) * 3;
        if (D.huye <= 0) m.dead = true; // se fue a lo hondo
      } else { b.vel.x = 0; b.vel.z = 0; }
      b.vel.y = -2;
      b.step(g.world, dt);
      m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
      m.group.rotation.y = Math.atan2(b.vel.x, b.vel.z) || m.group.rotation.y;
      m.group.userData.cola.rotation.y = Math.sin(m.t * (D.huye > 0 ? 12 : 1)) * 0.3;
      m.group.userData.cuerpo.scale.y = D.huye > 0 ? 1 + Math.sin(m.t * 10) * 0.4 : 1;
      tintModel(m.group, m.lightLevel(), m.hurtT > 0 ? 0.5 : 0);
      if (g.mode !== 'survival' || !P.alive || D.huye > 0) return;
      // uno se acerca arrastrando los pies (agachado): se espanta y se va
      if (P.sneaking && d < 2.4) { D.huye = 2.5; g.particles.burst(b.pos.x, b.pos.y + 0.2, b.pos.z, [[0.8, 0.75, 0.6]], 10, 1.2); if (!g.meta.rayaAviso2) { g.meta.rayaAviso2 = true; g.ui.toast('🐟 Una raya se fue nadando. En agua bajita, camine arrastrando los pies', 3400); g.achieve('raya_espantada', 'Arrastré los pies'); } return; }
      // la pisó
      if (d < 0.7 && P.body.inWater && Math.abs(p.y - b.pos.y) < 1) {
        D.huye = 2.5;
        g.damagePlayer(4, b.pos.x, b.pos.z, 'El aguijón de una raya', true, false);
        g.addEffect('paralisis', 12); g.addEffect('ardor', 20);
        g.ui.toast('🐟 ¡Pisó una raya! En agua bajita, camine arrastrando los pies', 3800);
        g.achieve('raya', 'Pisé una raya');
      }
      if (d > 80) m.dead = true;
    },
  },
};
// aparición: aguamalas en el mar cerca de la orilla, rayas en el agua bajita sobre arena
export function playaSpawn(E, g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles) return false;
  const w = g.world, pl = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 22;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const col = w.gen.column(x, z);
  if (!(col.biome === 'beach' || col.biome === 'ocean') || col.rio < 0.06) return false; // ni aguamalas ni rayas en los ríos
  const count = (t) => E.mobs.filter((m) => m.type === t && !m.dead).length;
  // el agua de la superficie y lo que hay abajo
  if (FLUID[w.getBlock(x, SEA - 1, z)] !== 1) return false;
  let fondo = SEA - 1; while (fondo > SEA - 12 && FLUID[w.getBlock(x, fondo, z)] === 1) fondo--;
  const hondo = SEA - 1 - fondo;
  if (hondo <= 2 && w.getBlock(x, fondo, z) === K.sand && count('raya') < 3 && Math.random() < 0.15) { E.spawnMob('raya', x + 0.5, fondo + 1.05, z + 0.5); return true; }
  if (hondo >= 2 && hondo <= 9 && count('aguamala') < 6 && Math.random() < 0.12) {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) E.spawnMob('aguamala', x + 0.5 + i * 1.5, SEA - 0.2, z + 0.5 + (i % 2) * 1.5);
    return true;
  }
  return false;
}
export function pruebaPlaya(g) {
  const p = g.player.body.pos;
  for (let i = 0; i < 3; i++) g.entities.spawnMob('aguamala', p.x + 3 + i, SEA - 0.2, p.z + 2);
  g.entities.spawnMob('raya', p.x + 1, p.y + 0.1, p.z - 2);
  return 'Tres aguamalas y una raya cerca (funcionan en el agua). La resaca está en franjas fijas de algunas playas';
}
