// El hongo reventón (v8.5). Vive en las cuevas, el bosque nuboso y la selva: parece un hongo cualquiera,
// no se mueve y no hace nada… hasta que uno se le arrima a 3 bloques. Ahí se infla (tiembla y se pone rojo: ese es el aviso) y al
// segundo revienta en una nube de esporas que marea y envenena. Se esquiva alejándose a tiempo, o reventándolo de lejos con una
// flecha o la honda. Estado: mob 'hongo_reventon'.
import { SOLID, BLOCKS, AIR } from './blocks.js';
import { difOf } from './supervivencia.js';
import { armarHongo } from './modelos-bichos.js';
import { tintModel } from './models.js';
import { zonaSegura } from './historia.js';

function reventar(g, m) {
  if (m.data.reventado) return;
  m.data.reventado = true;
  const b = m.body.pos, pl = g.player.body.pos;
  if (g.golpeando === m && Math.hypot(pl.x - b.x, pl.z - b.z) > 5) g.achieve('hongo_lejos', 'De lejos, por si acaso');
  g.audio.play('pop', { pos: m.soundPos(), vol: 1, pitch: 0.6 });
  g.particles.burst(b.x, b.y + 0.6, b.z, [[0.75, 0.3, 0.55], [0.85, 0.8, 0.5], [0.6, 0.75, 0.3]], 44, 3.5);
  (g.nubes ||= []).push({ x: b.x, y: b.y, z: b.z, t: 5 });
  if (g.mode === 'survival' && g.player.alive && Math.hypot(pl.x - b.x, pl.z - b.z) < 3.2 && Math.abs(pl.y - b.y) < 2.5) {
    g.damagePlayer(2, null, null, 'Esporas de un hongo reventón', true);
    g.addEffect('veneno', 5); g.addEffect('mareo', 6);
    if (!g.meta.hongoAviso) { g.meta.hongoAviso = true; g.ui.toast('🍄 ¡Reventó! Si se infla, aléjese… o revéntelo de lejos', 3200); }
  }
  if (g.golpeando === m) g.killedMob(m); // reventarlo de un golpe o de un flechazo cuenta como baja
  m.dead = true;
}
export const HONGOS = {
  hongo_reventon: {
    name: 'Hongo reventón', w: 0.7, h: 0.8, health: 4, speed: 0, hostile: true, pasivo: true, attack: 0, hurtSound: 'pop', idleSound: null, idleEvery: [999, 999],
    particle: [[0.75, 0.3, 0.55]], drops: [], xp: 4, grupo: 'cuero',
    build() { return armarHongo(); },
    update(m, dt) {
      const g = m.game, D = m.data, b = m.body.pos, pl = g.player.body.pos;
      D.apuro = true;
      m.body.vel.x = m.body.vel.z = 0; m.body.step(g.world, dt);
      m.group.position.set(b.x, b.y, b.z);
      tintModel(m.group, m.lightLevel(), 0);
      const d = Math.hypot(pl.x - b.x, pl.z - b.z), cerca = d < 3 && Math.abs(pl.y - b.y) < 2.5 && g.mode === 'survival' && g.player.alive;
      if (cerca && !D.infla) { D.infla = 1.05; g.audio.play('rana', { pos: m.soundPos(), vol: 0.6, pitch: 1.8 }); }
      const u = m.group.userData;
      if (D.infla) {
        D.infla -= dt;
        const k = 1 - Math.max(0, D.infla) / 1.05, s = 1 + k * 0.7;
        u.som.scale.set(s, 1 + k * 0.4, s); u.body.position.x = Math.sin(m.t * 50) * 0.03 * k;
        if (D.infla <= 0) reventar(g, m);
      }
    },
    // al pegarle también revienta (de lejos no le llega; de cerca, sí)
    onHurt(m, g) { reventar(g, m); return false; },
  },
};
// cada cuadro: las nubes de esporas que quedan flotando
export function cuadroHongos(g, dt) {
  if (!g.nubes || !g.nubes.length) return;
  const pl = g.player.body.pos;
  g.nubes = g.nubes.filter((n) => {
    n.t -= dt;
    for (let k = 0; k < 3; k++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 2.8; g.particles.spawn(n.x + Math.cos(a) * r, n.y + Math.random() * 1.8, n.z + Math.sin(a) * r, [0.7, 0.72, 0.4], 0, 0.15, 0, 1, -0.15); }
    if (g.mode === 'survival' && g.player.alive && Math.hypot(pl.x - n.x, pl.z - n.z) < 2.8 && Math.abs(pl.y - n.y) < 2.5) g.addEffect('veneno', 1.5);
    return n.t > 0;
  });
}
// dónde nacen: en el suelo de las cuevas, del bosque nuboso y la selva, cerca de uno
export function hongosSpawn(E, g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles || (g.day || 1) < 2) return false;
  if (E.mobs.filter((m) => !m.dead && m.type === 'hongo_reventon').length >= 5) return false;
  const w = g.world, pl = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 18, x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z) || zonaSegura(g, x, z)) return false;
  const bio = w.gen.column(x, z).biome, enCueva = pl.y < 50;
  if (!enCueva && !['nuboso', 'jungle'].includes(bio)) return false;
  for (let y = Math.floor(pl.y) + 5; y > Math.floor(pl.y) - 8; y--) {
    const id = w.getBlock(x, y - 1, z);
    if (SOLID[id] && !(BLOCKS[id] && BLOCKS[id].leafy) && w.getBlock(x, y, z) === AIR && w.getBlock(x, y + 1, z) === AIR) return !!E.spawnMob('hongo_reventon', x + 0.5, y + 0.02, z + 0.5);
  }
  return false;
}
export function limpiarHongos(g) { g.nubes = []; }
export function pruebaHongos(g) {
  const p = g.player.body.pos, d = g.player.lookDir();
  const m = g.entities.spawnMob('hongo_reventon', p.x + d.x * 5, p.y + 0.3, p.z + d.z * 5);
  if (m) m.data.apuro = true;
  return 'Un hongo reventón delante: acérquese (se infla) o revéntelo de lejos';
}
