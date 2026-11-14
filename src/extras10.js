// Plan 10: la rana de vidrio (de noche en el bosque nuboso y la selva: el cuerpo transparente deja ver el corazón que
// late y los huesitos), los huecos de la calle con una mata sembrada (sátira ficticia: «¿Y la muni?») y el gato que trae
// regalos a la casa (lagartijas que se le escapan, hojas, plumas y a veces algo bueno).
import { armarRanaVidrio } from './modelos-cosas.js';
import { BLOCK_BY_KEY as K, SOLID, AIR } from './blocks.js';
import { hearts } from './fauna.js';

// ===== la rana de vidrio =====
export const RANA_VIDRIO = {
  name: 'Rana de vidrio', w: 0.3, h: 0.22, health: 2, speed: 0, hurtSound: 'rana', idleSound: 'rana', idleEvery: [5, 12], noJump: true,
  particle: [[0.6, 0.95, 0.6]], drops: [],
  build() { return armarRanaVidrio(); },
  brain(m, dt, c) {
    const { distP, dxp, dzp } = c;
    m.data.hopT = (m.data.hopT ?? 2 + Math.random() * 4) - dt;
    if (m.body.onGround && m.data.hopT <= 0) {
      const susto = distP < 1.6;
      m.data.hopT = susto ? 1 : 4 + Math.random() * 6;
      const yaw = susto ? Math.atan2(-dxp, -dzp) : Math.random() * 6.28;
      m.yaw = m.targetYaw = yaw;
      m.body.vel.x = Math.sin(yaw) * 1.8; m.body.vel.z = Math.cos(yaw) * 1.8; m.body.vel.y = 4.6;
    }
    m.moving = false;
    return true;
  },
  animate(m, dt, u) {
    // el corazón late (más rápido si uno está cerca)
    const d = Math.hypot(m.body.pos.x - m.game.player.body.pos.x, m.body.pos.z - m.game.player.body.pos.z);
    const lat = Math.pow(Math.max(0, Math.sin(m.t * (d < 3 ? 14 : 8))), 6);
    u.corazon.scale.setScalar(1 + lat * 0.5);
    u.frogLegs.forEach((l) => { l.rotation.x = m.body.onGround ? 0 : -0.6; });
  },
  interact(m, g) {
    hearts(g, m.body.pos, 5, [0.6, 1, 0.6]);
    g.ui.toast('🐸 Rana de vidrio: se le ve el corazón latiendo. ¡No la toque mucho!', 3000);
    g.achieve('rana_vidrio', 'Se le ve el corazón');
    return true;
  },
};
export function ranaVidrioSpawn(E, g) {
  if (g.dim !== 'tierra' || g.daylight > 0.3) return false;
  const p = g.player.body.pos, bio = g.env && g.env.biome;
  if (!['nuboso', 'jungle'].includes(bio) || E.mobs.filter((m) => m.type === 'rana_vidrio' && !m.dead).length >= 4 || Math.random() > 0.15) return false;
  const w = g.world;
  const x = Math.floor(p.x + (Math.random() - 0.5) * 16), z = Math.floor(p.z + (Math.random() - 0.5) * 16);
  if (!w.isLoaded(x, z)) return false;
  let y = Math.floor(p.y) + 5;
  while (y > 1 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
  if (w.getBlock(x, y, z) !== AIR) return false;
  E.spawnMob('rana_vidrio', x + 0.5, y + 0.05, z + 0.5);
  return true;
}

// ===== los huecos con matas (sátira ficticia) =====
const CALLE = () => new Set([K.asfalto, K.asfalto_linea, K.asfalto_parche, K.asfalto_roto]);
const MATAS = () => [K.flower_red, K.flower_yellow, K.tall_grass].filter(Boolean);
export function tickHuecosMata(g, dt) {
  if (g.dim !== 'tierra' || g.daylight < 0.45) return;
  g.huecoT = (g.huecoT ?? 20) - dt;
  if (g.huecoT > 0) return;
  g.huecoT = 60 + Math.random() * 90;
  const p = g.player.body.pos, w = g.world, v = g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 70) return;
  const H = (g.meta.huecosMata ||= []);
  if (H.filter(([x, , z]) => Math.hypot(x - v.v.x, z - v.v.z) < 80).length >= 6) return;
  const C = CALLE();
  for (let t = 0; t < 60; t++) {
    const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 10;
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    for (let y = Math.floor(p.y) + 3; y > p.y - 4; y--) {
      if (!C.has(w.getBlock(x, y, z))) continue;
      if (w.getBlock(x, y + 1, z) !== AIR) break;
      // el hueco: se hunde un bloque, tierra al fondo y la mata sembrada con mucho cariño
      w.setBlock(x, y, z, K.dirt);
      const mata = MATAS()[Math.floor(Math.random() * MATAS().length)];
      if (mata) w.setBlock(x, y + 1, z, mata);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (C.has(w.getBlock(x + dx, y, z + dz)) && Math.random() < 0.6) w.setBlock(x + dx, y, z + dz, K.asfalto_roto);
      H.push([x, y, z]);
      g.particles.burst(x + 0.5, y + 1.2, z + 0.5, [[0.4, 0.8, 0.3], [1, 0.4, 0.4]], 10, 1.2);
      g.ui.toast('🌼 Alguien sembró una mata en el hueco de la calle. Al lado dice con tiza: «¿Y la muni?»', 3400);
      g.achieve('hueco_mata', '¿Y la muni?');
      return;
    }
  }
}

// ===== el gato que trae regalos =====
const REGALOS = [[null, 25, 'una lagartija… ¡que se le escapó!'], [K.leaves, 15, 'una hoja'], [256, 15, 'un palito'], [361, 10, 'un pescado (¿de dónde lo sacó?)'], [287, 8, 'un huevo de gallina (¿de quién?)'], [259, 4, '¡una pepita de oro!'], [369, 3, '¡una perla!']];
function sorteo() {
  let r = Math.random() * REGALOS.reduce((a, t) => a + t[1], 0);
  for (const t of REGALOS) { r -= t[1]; if (r <= 0) return t; }
  return REGALOS[0];
}
export function gatoTrae(m, g, dt, distP) {
  const d = m.data;
  if (d.sit) { d.trae = null; return false; }
  d.regaloCd = (d.regaloCd ?? 70 + Math.random() * 80) - dt;
  if (!d.trae) {
    if (d.regaloCd > 0 || distP > 8) return false;
    const a = Math.random() * Math.PI * 2, b = m.body.pos;
    d.trae = { fase: 'va', x: b.x + Math.cos(a) * 12, z: b.z + Math.sin(a) * 12, t: 0 };
  }
  const T = d.trae, b = m.body.pos, pl = g.player.body.pos;
  T.t += dt;
  if (T.fase === 'va') {
    // sale sigiloso, agachadito
    m.goTo(T.x, T.z, 1.3);
    if (T.t > 6 || Math.hypot(T.x - b.x, T.z - b.z) < 1.5) { T.fase = 'vuelve'; T.t = 0; T.cosa = sorteo(); }
    return true;
  }
  m.goTo(pl.x, pl.z, 1.5);
  if (distP < 1.8 || T.t > 12) {
    const [id, , nombre] = T.cosa;
    if (id) g.entities.dropItem(id, 1, pl.x, pl.y + 0.5, pl.z);
    g.ui.toast(`🐈 ${d.nombre || 'El gato'} le trajo ${nombre}`, 2400);
    g.audio.play('gato', { pos: m.soundPos(), vol: 1, pitch: 1.1 });
    hearts(g, b, 5, [1, 0.6, 0.8]);
    g.achieve('gato_regalo', 'Un regalito del gato');
    d.trae = null; d.regaloCd = 80 + Math.random() * 100;
  }
  return true;
}
