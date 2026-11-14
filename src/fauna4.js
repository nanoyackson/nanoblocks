// Más fauna tica: el oso hormiguero (tamandúa, con su chaleco negro, el hocico largo y la lengua que sale y entra), la martilla
// (kinkajú: dorada, de ojos grandes, sale de noche y se sube a los árboles) y la pava (el pavo de monte negro, con la papada roja).
// Ninguna hace daño. Aparecen solas según el bioma y la hora.
import { armarMartilla, armarPava } from './modelos-mar.js';
import { armarTamandua } from './modelos-silvestres.js';

export const FAUNA4 = {
  tamandua: {
    name: 'Oso hormiguero', w: 0.5, h: 0.6, health: 10, speed: 1.1, hostile: false, hurtSound: 'chancho.chillido', idleSound: null, idleEvery: [999, 999],
    particle: [[0.8, 0.7, 0.4]], drops: [], xp: 2,
    build() { return armarTamandua(); },
    animate(m, dt, u) {
      // olfatea el suelo y saca la lengua
      const huele = !m.moving && Math.sin(m.t * 0.7) > 0;
      u.headRx = huele ? 0.55 : Math.sin(m.t * 2) * 0.06;
      u.lengua.visible = huele && Math.sin(m.t * 14) > 0.2;
      u.cola.rotation.y = Math.sin(m.t * 1.2) * 0.25;
    },
  },
  martilla: {
    name: 'Martilla', w: 0.4, h: 0.45, health: 6, speed: 1.8, hostile: false, climber: true, hurtSound: 'titi', idleSound: 'titi', idleEvery: [10, 20],
    particle: [[0.8, 0.55, 0.25]], drops: [], xp: 2,
    build() { return armarMartilla(); },
    animate(m, dt, u) { u.cola.rotation.x = 0.3 + Math.sin(m.t * 1.5) * 0.4; u.cola.rotation.y = Math.sin(m.t * 0.8) * 0.3; },
  },
  pava: {
    name: 'Pava', w: 0.45, h: 0.75, health: 6, speed: 1.4, hostile: false, hurtSound: 'gallina', idleSound: 'gallina', idleEvery: [12, 22],
    particle: [[0.15, 0.15, 0.15]], drops: [[262, 1, 1]], xp: 2,
    build() { return armarPava(); },
    animate(m, dt, u) { u.headRx = m.moving ? Math.sin(m.t * 10) * 0.2 : Math.sin(m.t * 1.3) * 0.1; },
  },
};
// cada segundo: alguna aparece según el bioma y la hora
export function tickFauna4(g) {
  if (g.dim !== 'tierra' || Math.random() > 1 / 25) return;
  const p = g.player.body.pos, bio = g.env && g.env.biome, noche = g.daylight < 0.3, E = g.entities;
  const cuenta = (t) => E.mobs.filter((m) => m.type === t && !m.dead).length;
  let tipo = null;
  if (['jungle', 'forest', 'bosque_seco'].includes(bio) && !noche && cuenta('tamandua') < 1) tipo = 'tamandua';
  else if (['jungle', 'nuboso', 'forest'].includes(bio) && noche && cuenta('martilla') < 2) tipo = 'martilla';
  else if (['nuboso', 'jungle', 'mountains'].includes(bio) && !noche && cuenta('pava') < 2) tipo = 'pava';
  if (!tipo) return;
  const a = Math.random() * Math.PI * 2, x = p.x + Math.cos(a) * 20, z = p.z + Math.sin(a) * 20;
  if (!g.world.isLoaded(x, z)) return;
  let y = Math.floor(p.y) + 10; while (y > 1 && !g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))) y--;
  E.spawnMob(tipo, x, y + 0.1, z);
}
export function pruebaFauna4(g) {
  const p = g.player.body.pos, d = g.player.lookDir();
  ['tamandua', 'martilla', 'pava'].forEach((t, i) => g.entities.spawnMob(t, p.x + d.x * 4 + (i - 1) * 1.6 * d.z, p.y + 0.3, p.z + d.z * 4 - (i - 1) * 1.6 * d.x));
  return 'Un oso hormiguero, una martilla y una pava, delante';
}
