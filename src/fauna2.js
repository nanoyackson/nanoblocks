// Más fauna tica: zorro pelón (se hace el muerto), ardilla (come maíz de la mano), guatusa (esconde semillas),
// coyotes en manada de noche, el manatí del Caribe y la tortuga baula que sale a desovar de noche.
import { atacar } from './golpes.js';
import { armarManati, armarBaula } from './modelos-mar.js';
import { armarZorroPelon, armarArdilla, armarGuatusa, armarCoyote } from './modelos-silvestres.js';
import { BLOCK_BY_KEY as K, FLUID, SOLID, AIR } from './blocks.js';
import { hearts } from './fauna.js';
import { swim } from './mar.js';
import { SEA } from './worldgen.js';

const huir = (m, c, r, vel = 1.7) => {
  if (c.distP < r) m.data.flee = 3;
  if ((m.data.flee = Math.max(0, (m.data.flee || 0) - (m.data.dt || 0.016))) > 0) { const b = m.body.pos; m.goTo(b.x - c.dxp * 3, b.z - c.dzp * 3, vel); return true; }
  return false;
};

export const FAUNA2 = {
  // ===== Zorro pelón (zarigüeya): de noche; si lo golpean se hace el muerto =====
  zorro_pelon: {
    name: 'Zorro pelón', w: 0.45, h: 0.4, health: 7, speed: 1.6, hurtSound: 'zorro_pelon', idleSound: null, idleEvery: [999, 999],
    particle: [[0.7, 0.7, 0.7]], drops: [],
    build() { return armarZorroPelon(); },
    brain(m, dt, c) {
      m.data.dt = dt;
      if (m.data.muerto > 0) { m.data.muerto -= dt; m.moving = false; if (m.data.muerto <= 0) m.data.flee = 4; return true; }
      return huir(m, c, 3, 1.5);
    },
    animate(m, dt, u) {
      const k = m.data.muerto > 0 ? 1 : 0;
      m.data.lado = (m.data.lado || 0) + (k - (m.data.lado || 0)) * Math.min(1, dt * 8);
      u.body.rotation.z = m.data.lado * Math.PI / 2;
      u.body.position.y = -m.data.lado * 0.12;
    },
    onHurt(m, g, dmg) {
      if (m.health - dmg > 0 && !m.data.fingio) {
        m.data.fingio = true; m.data.muerto = 6;
        g.ui.toast('🙃 El zorro pelón se hizo el muerto… ¡qué actor!', 2200);
        g.achieve('zorro_pelon', 'Se hizo el muerto');
      }
      return true;
    },
  },

  // ===== Ardilla: rápida, de día; con maíz en la mano se acerca a comer =====
  ardilla: {
    name: 'Ardilla', w: 0.25, h: 0.3, health: 4, speed: 3, hurtSound: 'ardilla', idleSound: 'ardilla', idleEvery: [10, 25],
    particle: [[0.6, 0.35, 0.2]], drops: [],
    build() { return armarArdilla(); },
    brain(m, dt, c) {
      m.data.dt = dt;
      const held = c.g.inventory.held;
      if (held && (held.id === 268 || held.id === 267) && c.distP < 9) {
        m.targetYaw = Math.atan2(c.dxp, c.dzp);
        if (c.distP > 1.4) { m.goTo(c.pl.x, c.pl.z, 1); } else m.moving = false;
        return true;
      }
      return huir(m, c, 4, 1.8);
    },
    animate(m, dt, u) { u.tail.rotation.x = -0.35 + Math.sin(m.t * 5) * 0.15; },
    interact(m, g, held) {
      if (held && (held.id === 268 || held.id === 267)) {
        if (g.mode === 'survival') g.inventory.consumeHeld(1);
        hearts(g, m.body.pos, 6);
        g.audio.play('ardilla', { pos: m.soundPos(), vol: 0.8 });
        g.achieve('ardilla', 'Le di de comer a una ardilla');
        return true;
      }
      return false;
    },
  },

  // ===== Guatusa: asustadiza; de vez en cuando entierra semillas (y uno las encuentra) =====
  guatusa: {
    name: 'Guatusa', w: 0.4, h: 0.4, health: 7, speed: 2.6, hurtSound: 'guatusa', idleSound: 'guatusa', idleEvery: [12, 30],
    particle: [[0.65, 0.4, 0.2]], drops: [],
    build() { return armarGuatusa(); },
    brain(m, dt, c) {
      m.data.dt = dt;
      if (huir(m, c, 6, 1.9)) return true;
      m.data.semT = (m.data.semT ?? 20 + Math.random() * 40) - dt;
      if (m.data.semT <= 0) {
        m.data.semT = 50 + Math.random() * 70; m.data.cava = 2;
        const b = m.body.pos;
        c.g.particles.burst(b.x, b.y + 0.1, b.z, [[0.45, 0.32, 0.2]], 8, 1);
        c.g.audio.play('arena', { pos: m.soundPos(), vol: 0.5 });
        if (c.distP < 12 && c.g.mode === 'survival') c.g.entities.dropItem([267, 269, 294][Math.floor(Math.random() * 3)], 1, b.x, b.y + 0.3, b.z);
      }
      if (m.data.cava > 0) { m.data.cava -= dt; m.moving = false; return true; }
      return false;
    },
    animate(m, dt, u) { u.headRx = m.data.cava > 0 ? 0.5 + Math.sin(m.t * 20) * 0.2 : 0; },
  },

  // ===== Coyote: en manada, de noche en lo seco; aúlla y ataca (le tiene miedo al fuego) =====
  coyote: {
    name: 'Coyote', w: 0.5, h: 0.65, health: 12, speed: 3.2, hostile: false, hurtSound: 'perro.gruñido', idleSound: 'coyote', idleEvery: [20, 45],
    particle: [[0.7, 0.6, 0.45]], drops: [[271, 0, 1]],
    build() { return armarCoyote(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const noche = g.daylight < 0.35;
      // le tienen miedo al fuego: una antorcha en la mano o una fogata cerca
      const held = g.inventory.held;
      const fuego = held && (held.id === K.torch || held.id === K.fogata);
      if (!noche || fuego || g.mode !== 'survival' || !g.player.alive) { if (distP < 8) { const b = m.body.pos; m.goTo(b.x - dxp * 3, b.z - dzp * 3, 1.5); return true; } return false; }
      if (distP > 16) return false;
      if (!m.data.aullo) { m.data.aullo = true; g.audio.play('coyote', { pos: m.soundPos(), vol: 1 }); m.data.howl = 1.5; }
      m.targetYaw = Math.atan2(dxp, dzp);
      m.moving = distP > 1.3; m.speedMul = distP > 5 ? 1.2 : 0.9;
      if (distP < 1.7 && Math.abs(pl.y - m.body.pos.y) < 1.5 && m.attackCd <= 0) atacar(m, g, { tipo: 'mordida', prep: 0.48, dano: 3, causa: 'Lo rodearon los coyotes', alcance: 1.7, cd: 1.4 });
      return true;
    },
    animate(m, dt, u) {
      m.data.howl = Math.max(0, (m.data.howl || 0) - dt);
      u.headRx = m.data.howl > 0 ? -0.9 : 0;
      u.tail.rotation.y = Math.sin(m.t * 3) * 0.2;
    },
  },

  // ===== Manatí: grandote y tranquilo, en el agua del Caribe; se deja acariciar =====
  manati: {
    name: 'Manatí', w: 1.1, h: 0.7, health: 30, speed: 1, swimmer: true, hurtSound: null, idleSound: null,
    particle: [[0.5, 0.52, 0.55]], drops: [],
    build() { return armarManati(); },
    update(m, dt) { swim(m, dt, { speed: 1.1, range: 8, vr: 2, accel: 0.8, turn: 1.2, tailAxis: 'x', tailSpeed: 2.2, tailAmp: 0.25, hearFar: 20 }); },
    interact(m, g) {
      hearts(g, m.body.pos, 8, [0.6, 0.85, 1]);
      g.ui.toast('🫶 El manatí se dejó acariciar. Son tranquilos y están protegidos.', 2200);
      g.achieve('manati', 'Amistad con el manatí');
      return true;
    },
    onHurt(m, g) { g.ui.toast('¡No! El manatí está en peligro de extinción', 1800); m.panic = 3; return false; },
  },

  // ===== Tortuga baula: la más grande; de noche sale del mar, cava y deja su nido =====
  baula: {
    name: 'Tortuga baula', w: 1.2, h: 0.6, health: 40, speed: 0.5, hurtSound: null, idleSound: null,
    particle: [[0.2, 0.22, 0.25]], drops: [],
    build() { return armarBaula(); },
    brain(m, dt, c) {
      const { g } = c, w = g.world, b = m.body.pos, d = m.data;
      d.estado = d.estado || 'sube';
      d.t = (d.t || 0) + dt;
      const arena = (x, z) => w.getBlock(Math.floor(x), Math.floor(b.y) - 1, Math.floor(z)) === K.sand;
      if (d.estado === 'sube') {
        // camina tierra adentro hasta la arena seca
        if (!d.dir) { d.dir = d.dirMar ? { x: -d.dirMar.x, z: -d.dirMar.z } : { x: 1, z: 0 }; }
        m.goTo(b.x + d.dir.x * 3, b.z + d.dir.z * 3, 1);
        if ((d.t > 6 && arena(b.x, b.z) && !FLUID[w.getBlock(Math.floor(b.x), Math.floor(b.y), Math.floor(b.z))]) || d.t > 25) { d.estado = 'cava'; d.t = 0; }
        return true;
      }
      if (d.estado === 'cava') {
        m.moving = false;
        if (Math.random() < dt * 3) { g.particles.burst(b.x, b.y + 0.1, b.z - 0.6, [[0.85, 0.78, 0.55]], 6, 1.4); }
        if (Math.random() < dt * 0.8) g.audio.play('arena', { pos: m.soundPos(), vol: 0.6 });
        if (d.t > 10) {
          const x = Math.floor(b.x), y = Math.floor(b.y), z = Math.floor(b.z - 1.2);
          if (w.getBlock(x, y, z) === AIR && SOLID[w.getBlock(x, y - 1, z)]) w.setBlock(x, y, z, K.turtle_nest);
          if (c.distP < 12) { g.ui.toast('🐢 ¡La baula dejó su nido! Cuídelo: en unos días nacen las tortuguitas', 2800); g.achieve('baula', 'Vi desovar a la baula'); }
          d.estado = 'baja'; d.t = 0;
        }
        return true;
      }
      // vuelve al mar y se va
      m.goTo(b.x - d.dir.x * 3, b.z - d.dir.z * 3, 1);
      if (FLUID[w.getBlock(Math.floor(b.x), Math.floor(b.y), Math.floor(b.z))] || d.t > 40) m.dead = true;
      return true;
    },
    animate(m, dt, u) { u.fins.forEach((f, i) => { f.rotation.y = Math.sin(m.t * 2 + i) * (m.moving ? 0.5 : 0.1); }); },
    onHurt(m, g) { g.ui.toast('¡No! La baula está en peligro crítico de extinción', 1800); return false; },
  },
};

// aparecen cerca del jugador según el bioma y la hora
export function fauna2Spawn(E, g) {
  if (g.dim !== 'tierra') return false;
  const w = g.world, pl = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 22;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const col = w.gen.column(x, z);
  const count = (t) => E.mobs.filter((m) => m.type === t && !m.dead).length;
  const day = g.daylight > 0.45, night = g.daylight < 0.3, bio = col.biome;
  const y = col.h + 1;
  const libre = w.getBlock(x, y, z) === AIR && SOLID[w.getBlock(x, y - 1, z)];
  const R = Math.random();
  if (libre && night && ['forest', 'jungle', 'plains', 'bosque_seco'].includes(bio) && count('zorro_pelon') < 2 && R < 0.1) { E.spawnMob('zorro_pelon', x + 0.5, y + 0.2, z + 0.5); return true; }
  if (libre && day && ['forest', 'nuboso', 'plains'].includes(bio) && count('ardilla') < 3 && R < 0.12) { E.spawnMob('ardilla', x + 0.5, y + 0.2, z + 0.5); return true; }
  if (libre && day && ['jungle', 'forest'].includes(bio) && count('guatusa') < 2 && R < 0.1) { E.spawnMob('guatusa', x + 0.5, y + 0.2, z + 0.5); return true; }
  if (libre && night && ['bosque_seco', 'plains', 'guanacaste'].includes(bio) && count('coyote') < 3 && R < 0.06 && g.mode === 'survival') { const n = 2 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) E.spawnMob('coyote', x + 0.5 + i, y + 0.2, z + 0.5 + (i % 2)); return true; }
  // manatí: agua tranquila de manglar o selva costera (lado del Caribe: x > 0 en el mapa tico de este mundo no aplica; basta el manglar)
  if (['manglar', 'jungle'].includes(bio) && count('manati') < 1 && R < 0.05 && FLUID[w.getBlock(x, SEA - 1, z)] === 1 && FLUID[w.getBlock(x, SEA - 2, z)] === 1) { E.spawnMob('manati', x + 0.5, SEA - 1.6, z + 0.5); return true; }
  // baula: de noche en la playa, sale del mar hacia la arena
  if (bio === 'beach' && night && count('baula') < 1 && R < 0.04) {
    for (let k = 0; k < 16; k++) {
      const ax = x + Math.floor((Math.random() - 0.5) * 20), az = z + Math.floor((Math.random() - 0.5) * 20);
      if (FLUID[w.getBlock(ax, SEA - 1, az)] !== 1) continue;
      // hacia dónde queda la tierra
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (w.getBlock(ax + dx * 4, SEA, az + dz * 4) === K.sand || w.getBlock(ax + dx * 4, SEA - 1, az + dz * 4) === K.sand) {
          const m = E.spawnMob('baula', ax + dx * 2 + 0.5, SEA + 0.3, az + dz * 2 + 0.5);
          m.data.dirMar = { x: -dx, z: -dz };
          return true;
        }
      }
    }
  }
  return false;
}
