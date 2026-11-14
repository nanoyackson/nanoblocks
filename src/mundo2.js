// El mundo se siente vivo: neblina espesa en la montaña al amanecer, luciérnagas en las noches de verano y sapos
// que salen a cantar en las noches de lluvia (y que se pueden besar, por si acaso).
import { armarSapo } from './modelos-otros.js';
import { SOLID, AIR } from './blocks.js';
import { decir } from './misiones.js';

// ---------- neblina del amanecer (0..1) ----------
export function nieblaAmanecer(g) {
  if (g.dim !== 'tierra') return 0;
  const t = g.time || 0;
  // el sol sale en 0: neblina desde un poco antes hasta media mañana, más espesa al salir el sol
  const d = t > 0.5 ? t - 1 : t;
  if (d < -0.05 || d > 0.11) return 0;
  const k = d < 0 ? (d + 0.05) / 0.05 : 1 - Math.max(0, d - 0.04) / 0.07;
  const y = g.player.body.pos.y;
  const alto = Math.max(0, Math.min(1, (y - 78) / 14));
  const bio = g.env && g.env.biome;
  const monte = bio === 'paramo' || bio === 'volcano' || bio === 'nuboso' ? 1 : alto;
  return Math.max(0, Math.min(1, k * monte * 0.85));
}

const lloviendo = (g) => !!(g.weather && g.weather.intensity > 0.5 && !g.dry && !g.cold);
const superficie = (g) => {
  const p = g.player.body.pos;
  return p.y > g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).h - 4;
};

export function tickMundo2(g, dt) {
  if (g.dim !== 'tierra') { if (g.chichOn) { g.audio.setEmitter('chicharras', 'loop.chicharras', null); g.chichOn = false; g.chichK = 0; } return; }
  const noche = g.daylight < 0.3, p = g.player.body.pos;
  // avisito de la neblina (una vez por mañana)
  if (nieblaAmanecer(g) > 0.5 && g.meta.nieblaAviso !== g.day) { g.meta.nieblaAviso = g.day; g.ui.toast('🌫 Amaneció con neblina espesa en la montaña', 2400); g.achieve('neblina', 'Entre la neblina'); }
  // ---- luciérnagas: noches secas, en el monte o el potrero ----
  const bio = g.env && g.env.biome;
  if (noche && !lloviendo(g) && g.season !== 'invierno' && ['forest', 'plains', 'jungle', 'bosque_seco', 'nuboso', 'manglar'].includes(bio) && superficie(g)) {
    g.lucT = (g.lucT || 0) - dt;
    if (g.lucT <= 0) {
      g.lucT = 0.03;
      const a = Math.random() * Math.PI * 2, r = 2.5 + Math.random() * 11;
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const h = g.world.gen.column(Math.floor(x), Math.floor(z)).h;
      g.particles.spawn(x, h + 1.3 + Math.random() * 2.5, z, [0.8 + Math.random() * 0.2, 1, 0.25], (Math.random() - 0.5) * 0.5, (Math.random() - 0.3) * 0.4, (Math.random() - 0.5) * 0.5, 0.6 + Math.random() * 1.2, 0, true);
    }
    g.lucTiempo = (g.lucTiempo || 0) + dt;
    if (g.lucTiempo > 20) g.achieve('luciernagas', 'Noche de luciérnagas');
  } else g.lucTiempo = 0;
  // ---- los congos aúllan al amanecer en la selva y el monte ----
  const tt = g.time || 0, amanece = tt > 0.97 || tt < 0.06;
  if (amanece && ['jungle', 'forest', 'nuboso', 'manglar'].includes(bio) && superficie(g)) {
    g.congoT = (g.congoT ?? 2) - dt;
    if (g.congoT <= 0) {
      g.congoT = 4 + Math.random() * 7;
      const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 35;
      const pos = { x: p.x + Math.cos(a) * r, y: p.y + 8, z: p.z + Math.sin(a) * r };
      g.audio.play('mono', { pos, vol: 1.3, pitch: 0.5 + Math.random() * 0.2 });
      setTimeout(() => g.audio.play('mono', { pos, vol: 1.1, pitch: 0.55 + Math.random() * 0.2 }), 500 + Math.random() * 500);
      if (g.meta.congosAviso !== g.day) { g.meta.congosAviso = g.day; g.ui.toast('🐒 A lo lejos, los congos aúllan: así amanece en la selva', 2600); g.achieve('congos_amanecer', 'El despertador de la selva'); }
    }
  }
  // ---- gallos que cantan en los pueblos al amanecer ----
  if (amanece) {
    const v = g.nearestVillage(p.x, p.z);
    if (v && v.dist < 90 && superficie(g)) {
      g.galloT = (g.galloT ?? 1) - dt;
      if (g.galloT <= 0) {
        g.galloT = 2.5 + Math.random() * 6;
        const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 30;
        g.audio.play('gallo', { pos: { x: v.v.x + Math.cos(a) * r, y: (v.v.y || p.y) + 2, z: v.v.z + Math.sin(a) * r }, vol: 0.9, pitch: 0.88 + Math.random() * 0.25 });
        if (g.meta.galloAviso !== g.day) { g.meta.galloAviso = g.day; g.ui.toast('🐓 ¡Kikirikí! Los gallos del pueblo anuncian el día', 2400); g.achieve('gallos', 'Despertado por los gallos'); }
      }
    }
  }
  // ---- chicharras en las tardes de verano (entran y se van suave) ----
  const tarde = tt > 0.27 && tt < 0.46;
  const quiereCh = tarde && g.season === 'verano' && !lloviendo(g) && ['bosque_seco', 'plains', 'forest', 'jungle'].includes(bio) && superficie(g) ? 1 : 0;
  g.chichK = (g.chichK || 0) + (quiereCh - (g.chichK || 0)) * Math.min(1, dt * 0.5);
  if (g.chichK > 0.02) g.audio.setEmitter('chicharras', 'loop.chicharras', { x: p.x + 6, y: p.y + 6, z: p.z + 4 }, 0.45 * g.chichK);
  else if (g.chichOn) g.audio.setEmitter('chicharras', 'loop.chicharras', null);
  g.chichOn = g.chichK > 0.02;
  if (g.chichK > 0.8 && g.meta.chichAviso !== g.day) { g.meta.chichAviso = g.day; g.achieve('chicharras', 'Tarde de chicharras'); }
  // ---- sapos: noches de lluvia ----
  const E = g.entities;
  g.sapoT = (g.sapoT || 0) - dt;
  if (g.sapoT <= 0) {
    g.sapoT = 2;
    const sapos = E.mobs.filter((m) => m.type === 'sapo' && !m.dead);
    if (noche && lloviendo(g) && superficie(g) && sapos.length < 6) {
      const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 12;
      const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
      if (g.world.isLoaded(x, z)) {
        let y = Math.floor(p.y) + 6;
        while (y > 1 && !SOLID[g.world.getBlock(x, y - 1, z)]) y--;
        if (g.world.getBlock(x, y, z) === AIR) {
          E.spawnMob('sapo', x + 0.5, y + 0.1, z + 0.5);
          if (!g.meta.sapoAviso) { g.meta.sapoAviso = true; g.ui.toast('🐸 Con el aguacero salieron los sapos a cantar', 2400); }
        }
      }
    }
    // cuando escampa o amanece, se van
    if (!lloviendo(g) || !noche) for (const s of sapos) if (Math.hypot(s.body.pos.x - p.x, s.body.pos.z - p.z) > 14) s.dead = true;
  }
}

// ---------- el sapo ----------
const CAFE = 0x7a6a3a, CAFE2 = 0x5a4a28, PANZA = 0xd8c890;
export const SAPO = {
  name: 'Sapo', w: 0.4, h: 0.3, health: 3, speed: 0, hurtSound: 'rana', idleSound: 'rana', idleEvery: [3, 8], noJump: true,
  particle: [[0.45, 0.4, 0.22]], drops: [],
  build() { return armarSapo(CAFE, CAFE2, PANZA); },
  brain(m, dt, c) {
    const { distP, dxp, dzp } = c;
    m.data.hopT = (m.data.hopT ?? Math.random() * 3) - dt;
    if (m.body.onGround && m.data.hopT <= 0) {
      const susto = distP < 2.5;
      m.data.hopT = susto ? 0.8 : 2.5 + Math.random() * 4;
      const yaw = susto ? Math.atan2(-dxp, -dzp) + (Math.random() - 0.5) : Math.random() * 6.28;
      m.yaw = m.targetYaw = yaw;
      m.body.vel.x = Math.sin(yaw) * 2.2; m.body.vel.z = Math.cos(yaw) * 2.2; m.body.vel.y = 4.2;
    }
    m.moving = false;
    return true;
  },
  animate(m, dt, u) {
    // el buche se infla cuando canta
    if (m.idleT > (m.data.idlePrev ?? 0) + 0.5) m.data.canta = 0.9;
    m.data.idlePrev = m.idleT;
    m.data.canta = Math.max(0, (m.data.canta || 0) - dt);
    u.buche.scale.setScalar(m.data.canta > 0 ? 1.6 + Math.sin(m.t * 30) * 0.25 : 1);
    u.frogLegs.forEach((l) => { l.rotation.x = m.body.onGround ? 0 : -0.6; });
  },
  interact(m, g) {
    g.meta.besos = (g.meta.besos || 0) + 1;
    if (Math.random() < 0.04 || g.meta.besos === 12) {
      // ¡era un príncipe encantado!
      const b = m.body.pos;
      m.dead = true;
      g.particles.burst(b.x, b.y + 0.5, b.z, [[1, 0.9, 0.4], [1, 0.6, 0.9], [0.8, 1, 1]], 50, 3);
      const v = g.entities.spawnMob('vecino', b.x, b.y + 0.2, b.z);
      g.giveItem(360, 20);
      setTimeout(() => { v.data.name = 'Príncipe (ex sapo)'; decir(g, v, '¡Por fin! Cuarenta años de sapo por una bruja de Escazú. Tenga, 20 colones de agradecimiento.'); }, 400);
      g.ui.toast('👑 ¡El sapo era un príncipe encantado!', 3000);
      g.achieve('principe_sapo', 'Besé un sapo (y funcionó)');
      return true;
    }
    g.ui.toast(['🐸 Le dio un beso al sapo… y nada. Era un sapo nomás.', '🐸 El sapo lo miró feo. Muy feo.', '🐸 Muack. El sapo sigue siendo sapo.', '🐸 «Croac». Ni las gracias.'][Math.floor(Math.random() * 4)], 1800);
    g.achieve('beso_sapo', 'Besé un sapo');
    return true;
  },
};
