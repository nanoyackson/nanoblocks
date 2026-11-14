// La Sirena del río (leyenda): de noche, cerca del agua, aparece sentada en la orilla y canta. Su canto encanta:
// va jalando al jugador hacia el agua (agachado, tapándose los oídos, se resiste). Si uno llega al agua a su lado,
// lo hunde. Con una flor se va contenta y deja una escama (aire bajo el agua por un buen rato). Si le pegan, se zambulle.
import { armarSirena } from './modelos-leyendas.js';
import { FLUID, SOLID, BLOCK_BY_KEY as K } from './blocks.js';
import { hearts } from './fauna.js';

export const ESCAMA = 464;

export const SIRENA = {
  name: 'La Sirena del río', w: 0.6, h: 1.4, health: 30, speed: 0, legend: true, xp: 30, hurtSound: null, idleSound: null,
  particle: [[0.4, 0.9, 0.9], [0.9, 0.95, 1]], drops: [],
  build() { return armarSirena(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c, d = m.data, b = m.body.pos;
    m.noGravity = true; m.moving = false;
    if (g.daylight > 0.4) { despedir(m, g, 'La sirena se fue con la primera luz'); return true; }
    g.audio.setEmitter(`sirena${d.id || (d.id = Math.random())}`, 'loop.sirena', m.soundPos(), 0.95);
    m.targetYaw = Math.atan2(dxp, dzp);
    // el canto encanta: jala hacia ella (agachado se resiste)
    if (distP < 22 && distP > 1.5 && g.mode === 'survival' && g.player.alive) {
      if (!d.aviso) { d.aviso = true; g.ui.toast('🧜 Se oye un canto hermoso desde el agua… (agáchese para taparse los oídos)', 3600); }
      if (g.player.sneaking) {
        d.resiste = (d.resiste || 0) + dt;
        if (d.resiste > 15) g.achieve('sirena', 'Resistí el canto de la sirena');
      } else {
        const pb = g.player.body, k = (1 - distP / 22) * 3.2 + 0.8;
        pb.vel.x += (-dxp / distP) * k * dt * 6; pb.vel.z += (-dzp / distP) * k * dt * 6;
        if (Math.random() < dt * 0.4) g.addEffect('mareo', 2);
      }
    }
    // si uno cae al agua a su lado, lo hunde
    if (distP < 2.5 && g.player.body.inWater && g.mode === 'survival') {
      g.player.body.vel.y = Math.min(g.player.body.vel.y, -3);
      d.hunde = (d.hunde || 0) - dt;
      if (d.hunde <= 0) { d.hunde = 1.5; g.damagePlayer(2, b.x, b.z, 'Se lo llevó la sirena al fondo del río', true); }
    }
    // brillitos alrededor
    if (Math.random() < dt * 6) g.particles.spawn(b.x + (Math.random() - 0.5), b.y + 0.4 + Math.random(), b.z + (Math.random() - 0.5), [0.6, 1, 0.95], 0, 0.3, 0, 1.2, 0, true);
    return true;
  },
  animate(m, dt, u) {
    u.tail.rotation.x = Math.sin(m.t * 2) * 0.25;
    u.arms.forEach((a, i) => { a.rotation.x = -0.6 + Math.sin(m.t * 1.5 + i) * 0.3; a.rotation.z = (i ? -1 : 1) * 0.4; });
    u.head.rotation.z = Math.sin(m.t * 0.8) * 0.15;
  },
  interact(m, g, held) {
    if (held && (held.id === K.flower_red || held.id === K.flower_yellow)) {
      if (g.mode === 'survival') g.inventory.consumeHeld(1);
      hearts(g, m.body.pos, 12, [0.6, 1, 0.95]);
      g.entities.dropItem(ESCAMA, 1, m.body.pos.x, m.body.pos.y + 1, m.body.pos.z);
      g.achieve('sirena_flor', 'Una flor para la sirena');
      despedir(m, g, '🧜 La sirena sonrió, dejó una escama brillante y se fue nadando');
      return true;
    }
    return false;
  },
  onHurt(m, g) { despedir(m, g, '🧜 La sirena se zambulló y desapareció'); return false; },
  onRemove(m, g) { g.audio.setEmitter(`sirena${m.data.id}`, null, null); },
};
function despedir(m, g, txt) {
  if (m.dead) return;
  m.dead = true;
  g.audio.setEmitter(`sirena${m.data.id}`, null, null);
  g.particles.burst(m.body.pos.x, m.body.pos.y + 0.6, m.body.pos.z, [[0.6, 1, 0.95], [0.85, 0.95, 1]], 30, 2.5);
  g.audio.play('splash', { pos: m.soundPos(), vol: 0.7 });
  if (txt) g.ui.toast(txt, 2600);
}

// la escama: aire bajo el agua por 10 minutos
export function usarEscama(g) {
  g.addEffect('buceo', 600);
  g.ui.toast('🐚 La escama de sirena brilla: respira bajo el agua mucho más tiempo (10 min)', 2600);
}

// aparece de noche en la orilla de un río o lago cercano (de vez en cuando)
export function sirenaSpawn(E, g) {
  if (g.dim !== 'tierra' || g.daylight > 0.3 || g.mode !== 'survival') return false;
  if (!(g.env && g.env.water > 0.2)) return false;
  const laPide = g.meta.hist && g.meta.hist.cap === 5; // el capítulo de la flor: que no se quede uno varias noches sin saber si está roto
  g.sirenaCd = (g.sirenaCd ?? 300) - (laPide ? 40 : 2);
  if (g.sirenaCd > 0 || E.mobs.some((m) => m.type === 'sirena' && !m.dead)) return false;
  g.sirenaCd = laPide ? 120 : 600 + Math.random() * 600;
  if (!laPide && Math.random() > 0.5) return false;
  const w = g.world, p = g.player.body.pos;
  for (let k = 0; k < 30; k++) {
    const x = Math.floor(p.x + (Math.random() - 0.5) * 36), z = Math.floor(p.z + (Math.random() - 0.5) * 36);
    if (!w.isLoaded(x, z) || Math.hypot(x - p.x, z - p.z) < 10) continue;
    let y = Math.floor(p.y) + 6;
    while (y > 2 && !SOLID[w.getBlock(x, y, z)] && FLUID[w.getBlock(x, y, z)] !== 1) y--;
    if (FLUID[w.getBlock(x, y, z)] !== 1 || w.getBlock(x, y + 1, z) !== 0) continue;
    E.spawnMob('sirena', x + 0.5, y + 0.6, z + 0.5);
    if (laPide) g.ui.toast('🎵 Se oye un canto por el agua. Ahí anda la Sirena', 3600);
    return true;
  }
  return false;
}
