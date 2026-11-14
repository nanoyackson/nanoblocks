// Finca tica: gallinas, vacas, perro zaguate y caballo criollo. Cría, huevos, leche y montar a caballo.
import { BLOCK_BY_KEY as K, esPescado, PESCADOS } from './blocks.js';
import { hearts } from './fauna.js';
import { armarGallina, armarVaca, armarPerro, armarCaballo } from './modelos-finca.js';
import { armarGato } from './modelos-menores.js';
import { perroTrae } from './compas.js';
import { gatoTrae } from './extras10.js';
import { perroCallejero } from './pueblovivo.js';
import { lealtadZaguate, atenderZaguate } from './finca2.js';

const consume = (g) => { if (g.mode === 'survival') g.inventory.consumeHeld(1); };

// ---------- cría: alimentar a dos adultos de la misma especie = una cría ----------
function feedForLove(m, g, held, foods) {
  if (!held || !foods.includes(held.id)) return false;
  if (m.data.baby) { consume(g); m.data.grow = (m.data.grow || 0) + 60; hearts(g, m.body.pos, 4, [0.6, 1, 0.5]); return true; }
  if ((m.data.loveCd || 0) > 0) { g.ui.toast('Todavía no quiere más crías', 1200); return true; }
  consume(g);
  m.data.love = 20;
  // bien comida, la gallina pone más (4 min)
  m.data.maizT = 240;
  hearts(g, m.body.pos, 8);
  return true;
}

function loveBrain(m, dt, g) {
  m.data.loveCd = Math.max(0, (m.data.loveCd || 0) - dt);
  if (m.data.baby) {
    m.data.grow = (m.data.grow || 0) + dt;
    if (m.data.grow > 300) { m.data.baby = false; m.group.userData.babyScale = 1; }
  }
  if (!(m.data.love > 0)) return false;
  m.data.love -= dt;
  if (Math.random() < dt * 3) g.particles.spawn(m.body.pos.x + (Math.random() - 0.5) * 0.6, m.body.pos.y + m.kind.h + 0.2, m.body.pos.z + (Math.random() - 0.5) * 0.6, [1, 0.45, 0.6], 0, 0.6, 0, 0.8, -0.5, true);
  const mate = g.entities.mobs.find((o) => o !== m && o.type === m.type && o.data.love > 0 && !o.data.baby && Math.hypot(o.body.pos.x - m.body.pos.x, o.body.pos.z - m.body.pos.z) < 10);
  if (!mate) return false;
  m.goTo(mate.body.pos.x, mate.body.pos.z, 1);
  if (Math.hypot(mate.body.pos.x - m.body.pos.x, mate.body.pos.z - m.body.pos.z) < 1.3) {
    m.data.love = mate.data.love = 0;
    m.data.loveCd = mate.data.loveCd = 300;
    const baby = g.entities.spawnMob(m.type, m.body.pos.x, m.body.pos.y + 0.3, m.body.pos.z);
    baby.data.baby = true; baby.data.grow = 0;
    if (m.tamed) baby.tamed = true;
    hearts(g, m.body.pos, 14);
    g.achieve(`cria_${m.type}`, `Nació una cría de ${m.kind.name.toLowerCase()}`);
  }
  return true;
}

function babyAnim(m) {
  const s = m.data.baby ? 0.5 + Math.min(1, (m.data.grow || 0) / 300) * 0.25 : 1;
  m.group.userData.babyScale = s;
}

// ---------- pieles ----------

export const FINCA = {
  // ===== Gallina: pone huevos; el gallo canta al amanecer =====
  gallina: {
    name: 'Gallina', w: 0.4, h: 0.6, health: 4, speed: 1.3, hurtSound: 'gallina', idleSound: 'gallina', idleEvery: [6, 15],
    particle: [[0.95, 0.93, 0.9]], drops: [[262, 0, 1]],
    build() { return armarGallina(); },
    brain(m, dt, c) {
      const { g } = c;
      // poner huevo cada tanto
      m.data.maizT = Math.max(0, (m.data.maizT || 0) - dt);
      m.data.eggT = (m.data.eggT ?? 120 + Math.random() * 180) - dt * (m.data.maizT > 0 ? 3 : 1);
      if (m.data.eggT <= 0 && !m.data.baby) {
        m.data.eggT = 180 + Math.random() * 180;
        // muy de vez en cuando… ¡un huevo de oro!
        const oro = Math.random() < 0.015;
        g.entities.dropItem(oro ? 259 : 287, oro ? 2 : 1, m.body.pos.x, m.body.pos.y + 0.3, m.body.pos.z, { x: 0, y: 1, z: 0 }, 0.5);
        if (oro && Math.hypot(m.body.pos.x - g.player.body.pos.x, m.body.pos.z - g.player.body.pos.z) < 16) { g.ui.toast('🥚✨ ¡La gallina puso un huevo de oro! (era oro de verdad)', 2600); g.achieve('huevo_oro', 'La gallina de los huevos de oro'); }
        g.audio.play('gallina', { pos: m.soundPos() });
      }
      // algún gallo canta al amanecer
      const dawn = g.time > 0.985 || g.time < 0.03;
      if (dawn && !m.data.crowed && Math.random() < dt * 0.05) { m.data.crowed = true; g.audio.play('gallo', { pos: m.soundPos(), vol: 1 }); }
      if (!dawn) m.data.crowed = false;
      // caer planeando
      if (!m.body.onGround && m.body.vel.y < -2) m.body.vel.y = -2;
      return loveBrain(m, dt, g);
    },
    animate(m, dt, u) {
      babyAnim(m);
      const flap = !m.body.onGround ? Math.sin(m.t * 30) * 0.8 : 0;
      u.henWings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.abs(flap); });
      u.head.position.z = 0.17 + (m.moving ? Math.sin(m.t * 10) * 0.03 : 0);
    },
    interact(m, g, held) { return feedForLove(m, g, held, [267, 269]); },
  },

  // ===== Vaca de Guanacaste: se ordeña con balde =====
  vaca: {
    name: 'Vaca', w: 0.9, h: 1.35, health: 12, speed: 1.1, hurtSound: 'vaca', idleSound: 'vaca', idleEvery: [10, 25],
    particle: [[0.9, 0.88, 0.84]], drops: [[271, 0, 2], [262, 1, 3]],
    build() { return armarVaca(); },
    brain(m, dt, c) { if (m.thinkT <= 0 && Math.random() < 0.4) m.graze = 3; return loveBrain(m, dt, c.g); },
    animate(m, dt, u) { babyAnim(m); u.tail.rotation.z = Math.sin(m.t * 2.5) * 0.25; },
    interact(m, g, held) {
      if (held && held.id === 289 && !m.data.baby) {
        consume(g);
        g.inventory.add(292, 1);
        g.audio.play('balde', { pos: m.soundPos(), vol: 0.5 });
        g.audio.play('vaca', { pos: m.soundPos(), vol: 0.7 });
        return true;
      }
      return feedForLove(m, g, held, [268, K.tall_grass]);
    },
  },

  // ===== Perro zaguate: con carne te sigue y te defiende de Sombras, jaguares y pizotes =====
  perro: {
    name: 'Perro zaguate', w: 0.5, h: 0.75, health: 16, speed: 3.2, hurtSound: 'perro', idleSound: 'perro', idleEvery: [12, 30],
    particle: [[0.55, 0.42, 0.28]], drops: [],
    build() { return armarPerro(); },
    brain(m, dt, c) {
      if (perroCallejero(m, c.g, dt, c)) return true;
      const { g, distP, dxp, dzp } = c;
      if (!m.tamed) return loveBrain(m, dt, g);
      lealtadZaguate(m, g); // v12.4.2
      // buscar enemigos cerca del dueño
      const pl = g.player.body.pos;
      let foe = null, fd = 12;
      for (const o of g.entities.mobs) {
        if (o === m || o.dying) continue;
        if (o.data.comensalFn || !(o.kind.hostile || o.type === 'jaguar' || o.type === 'pizote' || (o.type === 'cocodrilo' && !o.body.inWater))) continue;
        const d = Math.hypot(o.body.pos.x - pl.x, o.body.pos.z - pl.z);
        if (d < fd) { fd = d; foe = o; }
      }
      m.data.biteCd = Math.max(0, (m.data.biteCd || 0) - dt);
      if (foe && !m.data.sit) {
        m.goTo(foe.body.pos.x, foe.body.pos.z, 1.5);
        m.data.barkT = (m.data.barkT || 0) - dt;
        if (m.data.barkT <= 0) { m.data.barkT = 1.2; g.audio.play('perro', { pos: m.soundPos(), vol: 1 }); }
        const d = Math.hypot(foe.body.pos.x - m.body.pos.x, foe.body.pos.z - m.body.pos.z);
        if (d < 1.4 && m.data.biteCd <= 0) {
          m.data.biteCd = 0.8;
          g.audio.play('perro.gruñido', { pos: m.soundPos(), vol: 0.7 });
          if (foe.type === 'pizote' || foe.type === 'jaguar') { foe.panic = 6; foe.hurt(2, m.body.pos.x, m.body.pos.z); } else foe.hurt(4 + ((m.data.lealtad || 1) >= 3 ? 3 : 0), m.body.pos.x, m.body.pos.z); // v12.4.2: con lealtad 3, más duro
        }
        return true;
      }
      if (m.data.sit) { m.moving = false; return true; }
      if (perroTrae(m, g, dt, distP)) return true;
      m.follow(distP, dxp, dzp, 2.5);
      return true;
    },
    animate(m, dt, u) {
      babyAnim(m);
      u.tail.rotation.y = Math.sin(m.t * (m.tamed ? 14 : 4)) * (m.tamed ? 0.6 : 0.2);
      u.body.rotation.x = m.data.sit ? -0.45 : 0;
      u.ears.forEach((e, i) => { e.rotation.x = Math.sin(m.t * 3 + i) * 0.1; });
    },
    interact(m, g, held) {
      const meat = held && (held.id === 262 || held.id === 265);
      if (!m.tamed && meat) {
        consume(g);
        if (Math.random() < 0.5) { hearts(g, m.body.pos, 3, [0.6, 0.6, 0.6]); g.ui.toast('El perro todavía desconfía… déle más carne', 1400); return true; }
        m.tamed = true;
        hearts(g, m.body.pos, 12);
        g.audio.play('perro', { pos: m.soundPos() });
        g.ui.toast('¡Un perro zaguate ya es suyo! Anda con usted y pelea a su lado (clic derecho: sentarse)', 2600);
        g.achieve('perro', 'Mejor amigo zaguate');
        return true;
      }
      if (m.tamed && meat) { m.data.comio = g.day || 1; return feedForLove(m, g, held, [262, 265]); }
      if (m.tamed && atenderZaguate(m, g, held)) return true; // v12.4.2: cualquier comida o el collar
      if (m.tamed) { m.data.sit = !m.data.sit; return true; }
      return false;
    },
  },

  // ===== Gato del pueblo: anda por las calles, se sienta, maúlla; con pescado te adopta y le bufa al Duende =====
  gato: {
    name: 'Gato', w: 0.35, h: 0.45, health: 8, speed: 2.6, hurtSound: 'gato', idleSound: 'gato', idleEvery: [10, 25],
    particle: [[0.8, 0.5, 0.2]], drops: [],
    build() { return armarGato(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp } = c;
      m.data.sitT = Math.max(0, (m.data.sitT || 0) - dt);
      if (!m.tamed) {
        // a ratos se sienta a lamerse; si uno corre cerca, sale disparado
        if (distP < 3 && g.player.sprinting) { m.goTo(m.body.pos.x - dxp * 3, m.body.pos.z - dzp * 3, 1.8); return true; }
        if (m.data.sitT > 0) { m.moving = false; return true; }
        if (Math.random() < dt * 0.05) m.data.sitT = 4 + Math.random() * 6;
        return false;
      }
      // el gato de uno: lo sigue (a su manera) y le bufa a los duendes que se acerquen
      for (const o of g.entities.mobs) {
        if (o.type !== 'duende' || o.dead) continue;
        if (Math.hypot(o.body.pos.x - m.body.pos.x, o.body.pos.z - m.body.pos.z) < 8) {
          o.data.asustado = 2;
          if ((m.data.hissT = (m.data.hissT || 0) - dt) <= 0) { m.data.hissT = 2; g.audio.play('gato.bufido', { pos: m.soundPos(), vol: 0.9 }); if (!g.meta.gatoDuende) { g.meta.gatoDuende = true; g.ui.toast('🐈 ¡Su gato le bufó al Duende! Los duendes les tienen miedo a los gatos', 2800); } }
        }
      }
      if (m.data.sit) { m.moving = false; return true; }
      if (gatoTrae(m, g, dt, distP)) return true;
      m.follow(distP, dxp, dzp, 3);
      if (distP < 2 && (m.data.purrT = (m.data.purrT || 0) - dt) <= 0) { m.data.purrT = 8 + Math.random() * 8; g.audio.play('gato.ronroneo', { pos: m.soundPos(), vol: 0.6 }); }
      return true;
    },
    animate(m, dt, u) {
      babyAnim(m);
      const sentado = m.data.sitT > 0 || m.data.sit;
      u.body.rotation.x = sentado ? -0.55 : 0;
      u.tail.rotation.y = Math.sin(m.t * (m.tamed ? 3 : 1.5)) * 0.4;
      u.tail.rotation.x = sentado ? 0.3 : -1.0;
    },
    interact(m, g, held) {
      const pez = held && (held.id === 365 || esPescado(held.id)); // v12.7.0: el registro
      if (!m.tamed && pez) {
        consume(g);
        if (Math.random() < 0.4) { hearts(g, m.body.pos, 3, [0.6, 0.6, 0.6]); g.audio.play('gato', { pos: m.soundPos() }); g.ui.toast('El gato se comió el pescado… y se hace el desentendido. Dele otro', 1600); return true; }
        m.tamed = true;
        hearts(g, m.body.pos, 12);
        g.audio.play('gato.ronroneo', { pos: m.soundPos(), vol: 0.8 });
        g.ui.toast('🐈 ¡Un gato lo adoptó! (Él escogió, usted no.) Clic derecho: que se quede', 2800);
        g.achieve('gato', 'Adoptado por un gato');
        return true;
      }
      if (m.tamed && pez) return feedForLove(m, g, held, [365, ...PESCADOS]);
      if (m.tamed) { m.data.sit = !m.data.sit; g.audio.play('gato', { pos: m.soundPos(), vol: 0.7 }); return true; }
      g.audio.play('gato', { pos: m.soundPos(), vol: 0.7 });
      return true;
    },
  },

  // ===== Caballo criollo: se doma con manzanas o maíz, se le pone albarda y se monta =====
  caballo: {
    name: 'Caballo criollo', w: 0.95, h: 1.55, health: 20, speed: 2, hurtSound: 'resoplido', idleSound: 'resoplido', idleEvery: [10, 25],
    particle: [[0.4, 0.27, 0.16]], drops: [[271, 0, 2]],
    build() { return armarCaballo(); },
    brain(m, dt, c) {
      if (m.data.ridden) { m.frozen = true; m.moving = false; return true; }
      m.frozen = false;
      if (m.tamed && m.data.stay) { m.moving = false; return true; }
      return loveBrain(m, dt, c.g);
    },
    animate(m, dt, u) {
      babyAnim(m);
      u.saddle.visible = !!m.data.saddle;
      u.tail.rotation.z = Math.sin(m.t * 2) * 0.15;
      if (m.data.ridden) { const sw = Math.sin(m.walk) * m.walkAmt; u.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 2 ? sw : -sw) * 0.9; }); u.body.position.y = Math.abs(Math.cos(m.walk)) * 0.08 * m.walkAmt; }
    },
    interact(m, g, held) {
      if (m.data.arreo) return true; // el del sabanero no se presta
      if (m.data.baby) return feedForLove(m, g, held, [261, 268]);
      if (!m.tamed && held && (held.id === 261 || held.id === 268)) {
        consume(g);
        m.data.trust = (m.data.trust || 0) + 1;
        if (m.data.trust < 3) { hearts(g, m.body.pos, 3, [0.7, 0.7, 0.7]); g.audio.play('resoplido', { pos: m.soundPos() }); g.ui.toast(`El caballo le tiene confianza ${m.data.trust}/3`, 1200); return true; }
        m.tamed = true; hearts(g, m.body.pos, 12);
        g.audio.play('caballo', { pos: m.soundPos(), vol: 1 });
        g.ui.toast('¡Domó un caballo criollo! Póngale una albarda para montarlo', 2400);
        g.achieve('caballo', 'Sabanero de corazón');
        return true;
      }
      if (m.tamed && held && held.id === 293 && !m.data.saddle) {
        consume(g); m.data.saddle = true;
        g.audio.play('montura', { pos: m.soundPos(), vol: 0.8 });
        return true;
      }
      if (m.tamed && held && (held.id === 261 || held.id === 268)) return feedForLove(m, g, held, [261, 268]);
      if (m.tamed && m.data.saddle) { g.mount(m); return true; }
      if (m.tamed) { g.ui.toast('Necesita una albarda para montarlo', 1400); return true; }
      return false;
    },
  },
};

// Aparición de animales de finca en llanuras y pastizales
export function fincaSpawn(E, g, x, y, z, col, ground) {
  // gatos en los pueblos
  if ((g.envPueblo || 0) > 0.3 && E.mobs.filter((m) => m.type === 'gato').length < 3 && Math.random() < 0.1) { E.spawnMob('gato', x + 0.5, y + 1, z + 0.5); return true; }
  const count = (t) => E.mobs.filter((m) => m.type === t).length;
  if (ground !== K.grass || g.daylight < 0.4) return false;
  const r = Math.random();
  if (col.biome === 'plains') {
    if (count('vaca') < 4 && r < 0.12) { for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) E.spawnMob('vaca', x + 0.5 + i, y + 1, z + 0.5); return true; }
    if (count('caballo') < 3 && r < 0.2) { for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) E.spawnMob('caballo', x + 0.5 + i * 1.5, y + 1, z + 0.5); return true; }
    if (count('gallina') < 5 && r < 0.32) { for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) E.spawnMob('gallina', x + 0.5 + i * 0.5, y + 1, z + 0.5); return true; }
  }
  if ((col.biome === 'plains' || col.biome === 'forest') && count('perro') < 1 && r < 0.36 && E.mobs.filter((m) => m.type === 'perro' && m.tamed).length === 0) { E.spawnMob('perro', x + 0.5, y + 1, z + 0.5); return true; }
  return false;
}
