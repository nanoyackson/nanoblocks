// Fauna de Costa Rica: cada especie con modelo, sonido, comportamiento propio y una utilidad en el juego.
import { atacar, anilloAviso, brilloAmago } from './golpes.js';
import * as THREE from 'three';
import { armarRana, armarTortuguita } from './modelos-finales.js';
import { BLOCKS, ITEMS, BLOCK_BY_KEY as K, AIR, FLUID, itemName } from './blocks.js';
import { skinBox } from './models.js';
import { esUnico, extras } from './inventory.js';
import { SEA } from './worldgen.js';
import { armarJaguar, armarCocodrilo } from './modelos-monte.js';
import { armarQuetzal, armarTortuga, armarColibri, armarMorfo, armarTiti, armarTepezcuintle, armarCalzonuda } from './modelos-menores.js';
import { armarPerezoso, armarCaraBlanca, armarTucan, armarIguana, armarArmadillo } from './modelos-aves.js';
import { armarVenado, armarPizote, armarTerciopelo } from './modelos-finca.js';
import { desviada, tortuguitaAlMar } from './arrecife.js';

// ---------- ayudas para pintar y armar ----------
export const solid = (cols, n = 0.45) => (face, s) => s.fill(cols, (x, y) => 0.3 + s.noise(x, y, 3) * n + s.rnd() * 0.15);
export const box = (name, w, h, d, paint, x = 0, y = 0, z = 0, opts) => { const m = skinBox(name, w, h, d, paint, opts); m.position.set(x, y, z); return m; };
export const flat = (color, w, h, d, x, y, z, glow = false) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, z);
  if (glow) m.userData.glow = true;
  return m;
};
export const eyes = (parent, z, y, spread, size = 0.05, color = 0x111111, glow = false) => {
  parent.add(flat(color, size, size, 0.02, -spread, y, z, glow), flat(color, size, size, 0.02, spread, y, z, glow));
};
const near = (m, g, r) => Math.hypot(m.body.pos.x - g.player.body.pos.x, m.body.pos.y - g.player.body.pos.y, m.body.pos.z - g.player.body.pos.z) < r;
export const hearts = (g, p, n = 6, col = [1, 0.45, 0.6]) => g.particles.burst(p.x, p.y + 0.8, p.z, [col, [1, 0.7, 0.8]], n, 1.2);
const isFruit = (id) => id === 275 || id === 276 || id === 261;
const consume = (g) => { if (g.mode === 'survival') g.inventory.consumeHeld(1); };

// red + frasco: atrapar
function tryCatch(m, g, held, giveId, label) {
  if (!held || held.id !== 282) return false;
  const inv = g.inventory;
  if (inv.count(283) < 1) { g.ui.toast('Ocupa un frasco vacío', 1500); return true; }
  inv.remove(283, 1);
  inv.add(giveId, 1);
  if (inv.wearHeld()) g.audio.play('toolbreak');
  m.dead = true;
  g.audio.play('pop', { ui: true, vol: 0.3 });
  g.achieve(`atrapar_${m.type}`, label);
  return true;
}

// ---------- pieles ----------


// ---------- especies ----------
export const FAUNA = {
  // ===== Perezoso: cuelga de las ramas, casi no se mueve; un abrazo da Calma =====
  perezoso: {
    name: 'Perezoso', w: 0.6, h: 0.6, health: 10, speed: 0.25, hurtSound: 'perezoso', idleSound: 'perezoso', idleEvery: [20, 40],
    particle: [[0.5, 0.42, 0.32]], drops: [], noJump: true,
    build() { return armarPerezoso(); },
    brain(m, dt, c) {
      const { g } = c;
      const w = g.world, b = m.body.pos;
      const above = w.getBlock(Math.floor(b.x), Math.floor(b.y + m.kind.h + 0.2), Math.floor(b.z));
      m.data.hang = !!BLOCKS[above].leafy || BLOCKS[above].key === 'jungle_log';
      m.frozen = m.data.hang;
      m.moving = false;
      if (m.data.hang) {
        // de vez en cuando avanza lentísimo por debajo de las ramas
        m.data.moveT = (m.data.moveT ?? 30 + Math.random() * 60) - dt;
        if (m.data.moveT <= 0) {
          m.data.moveT = 40 + Math.random() * 80;
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
          for (const [dx, dz] of dirs) {
            const nx = Math.floor(b.x) + dx, nz = Math.floor(b.z) + dz, ny = Math.floor(b.y);
            if (w.getBlock(nx, ny, nz) === AIR && BLOCKS[w.getBlock(nx, ny + 1, nz)].leafy) { m.data.slide = { x: nx + 0.5, z: nz + 0.5 }; m.targetYaw = Math.atan2(dx, dz); break; }
          }
        }
        if (m.data.slide) {
          const s = m.data.slide;
          b.x += Math.sign(s.x - b.x) * Math.min(Math.abs(s.x - b.x), dt * 0.25);
          b.z += Math.sign(s.z - b.z) * Math.min(Math.abs(s.z - b.z), dt * 0.25);
          m.walk += dt * 1.2; m.walkAmt = 1;
          if (Math.abs(s.x - b.x) + Math.abs(s.z - b.z) < 0.02) m.data.slide = null;
        }
      } else if (m.thinkT <= 0) { m.thinkT = 6; m.moving = Math.random() < 0.6; m.targetYaw = Math.random() * 6.28; }
      return true;
    },
    animate(m, dt, u) {
      // colgado: patas hacia arriba agarrando la rama, el cuerpo cuelga
      const hang = m.data.hang;
      u.body.rotation.z = hang ? Math.PI : 0;
      u.body.position.y = hang ? m.kind.h + 0.15 : 0;
      u.legs.forEach((l, i) => { l.rotation.x = hang ? Math.sin(m.walk + i) * 0.3 * m.walkAmt : Math.sin(m.walk * 0.5 + i) * 0.2; });
      u.head.rotation.z = hang ? Math.PI : 0;
      m.walkAmt *= Math.pow(0.2, dt);
    },
    interact(m, g) {
      g.addEffect('calma', 150);
      hearts(g, m.body.pos, 10);
      g.audio.play('perezoso', { pos: m.soundPos() });
      g.ui.toast('Abrazó a un perezoso: anda con Calma (el hambre baja lento)', 2400);
      g.achieve('abrazo_perezoso', 'Abrazo de perezoso');
      return true;
    },
    onHurt(m, g) { g.ui.toast('¡Pobre perezoso!', 1200); },
  },

  // ===== Mono cara blanca: roba lo que esté tirado y huye; con banano se hace tu amigo y te trae cosas =====
  cara_blanca: {
    name: 'Mono cara blanca', w: 0.45, h: 0.7, health: 8, speed: 3, hurtSound: 'cara_blanca', idleSound: 'cara_blanca', idleEvery: [5, 12],
    particle: [[0.1, 0.1, 0.1], [0.9, 0.88, 0.82]], drops: [],
    build() { return armarCaraBlanca(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp } = c;
      m.data.friendT = Math.max(0, (m.data.friendT || 0) - dt);
      const b = m.body.pos;
      if (m.data.item) {
        m.data.holdT = (m.data.holdT || 0) + dt;
        if (m.data.friendT > 0) {
          // amigo: te trae lo que encontró
          m.follow(distP, dxp, dzp, 1.6);
          if (distP < 2.2) { g.entities.dropItem(m.data.item.id, m.data.item.count, b.x, b.y + 0.6, b.z, { x: dxp * 0.6, y: 3, z: dzp * 0.6 }, 0.1, m.data.item.dur, m.data.item.extra); m.data.item = null; m.data.holdT = 0; g.audio.play('cara_blanca', { pos: m.soundPos() }); }
        } else {
          // ladrón: corre lejos del jugador y suelta el botín después de un rato
          m.targetYaw = Math.atan2(-dxp, -dzp) + Math.sin(m.t) * 0.6;
          m.moving = distP < 18; m.speedMul = 1.7;
          if (m.data.holdT > 30) { g.entities.dropItem(m.data.item.id, m.data.item.count, b.x, b.y + 0.6, b.z, null, 0.5, m.data.item.dur, m.data.item.extra); m.data.item = null; m.data.holdT = 0; }
        }
        return true;
      }
      // buscar algo brillante tirado en el suelo
      let best = null, bd = 9;
      for (const it of g.entities.items) {
        if (it.age < 1.5) continue;
        const d = Math.hypot(it.body.pos.x - b.x, it.body.pos.z - b.z);
        if (d < bd && Math.abs(it.body.pos.y - b.y) < 3) { bd = d; best = it; }
      }
      if (best) {
        m.goTo(best.body.pos.x, best.body.pos.z, 1.5);
        if (bd < 0.9) {
          m.data.item = { id: best.id, count: best.count, dur: best.dur, extra: best.extra };
          best.dead = true;
          g.audio.play('cara_blanca', { pos: m.soundPos(), vol: 0.9 });
          if (m.data.friendT <= 0 && near(m, g, 20)) g.ui.toast('¡Un mono cara blanca se robó algo!', 1600);
        }
        return true;
      }
      if (m.data.friendT > 0) { m.follow(distP, dxp, dzp, 3); return true; }
      return false;
    },
    animate(m, dt, u) {
      const want = m.data.item ? m.data.item.id : null;
      if (want !== m.data.shownItem) {
        while (u.loot.children.length) u.loot.remove(u.loot.children[0]);
        m.data.shownItem = want;
      }
      u.tail.rotation.y = Math.sin(m.t * 2) * 0.4;
      u.head.rotation.z = Math.sin(m.t * 3) * 0.08;
      if (want !== null && !u.loot.children.length) u.loot.add(flat(0xffd84a, 0.12, 0.12, 0.12, 0, 0, 0, true));
    },
    interact(m, g, held) {
      if (held && held.id === 275) {
        consume(g);
        m.data.friendT = 300;
        hearts(g, m.body.pos);
        g.ui.toast('El mono cara blanca es su amigo (5 min): le trae lo que encuentre', 2400);
        g.achieve('amigo_mono', 'Un amigo travieso');
        return true;
      }
      return false;
    },
  },

  // ===== Tucán: domesticado con fruta, te sigue y cada tanto te trae frutas =====
  tucan: {
    name: 'Tucán', w: 0.45, h: 0.45, health: 6, speed: 4, flying: true, flyHigh: true, hurtSound: 'tucan', idleSound: 'tucan', idleEvery: [6, 14],
    particle: [[0.1, 0.1, 0.1], [0.95, 0.85, 0.2]], drops: [],
    build() { return armarTucan(); },
    flyGoal(m, g) {
      if (!m.tamed) return null;
      const p = g.player.body.pos;
      // mascota: revolotea cerca y cada tanto trae fruta
      m.data.fruitT = (m.data.fruitT ?? 25) - 0.5;
      if (m.data.fruitT <= 0) {
        m.data.fruitT = 50 + Math.random() * 30;
        g.entities.dropItem(Math.random() < 0.5 ? 275 : 276, 1, m.body.pos.x, m.body.pos.y, m.body.pos.z, { x: 0, y: 1, z: 0 }, 0.3);
        g.audio.play('tucan', { pos: m.soundPos() });
      }
      return { x: p.x + Math.sin(m.t * 0.5) * 2.5, y: p.y + 2.6, z: p.z + Math.cos(m.t * 0.5) * 2.5 };
    },
    interact(m, g, held) {
      if (held && isFruit(held.id) && !m.tamed) {
        consume(g);
        m.tamed = true;
        hearts(g, m.body.pos, 8, [0.95, 0.85, 0.2]);
        g.ui.toast('¡El tucán ahora anda con usted y le trae frutas!', 2200);
        g.achieve('tucan', 'Amistad de pico grande');
        return true;
      }
      return false;
    },
  },

  // ===== Quetzal: rarísimo, en bosques altos; verlo es un logro; a veces suelta una pluma =====
  quetzal: {
    name: 'Quetzal', w: 0.4, h: 0.4, health: 6, speed: 3, flying: true, flyHigh: true, hurtSound: 'quetzal', idleSound: 'quetzal', idleEvery: [7, 15],
    particle: [[0.1, 0.65, 0.4], [0.85, 0.12, 0.12]], drops: [],
    build() { return armarQuetzal(); },
    flyGoal(m, g) {
      if (near(m, g, 9)) g.achieve('quetzal', '¡Viste un quetzal! El ave más bella de Costa Rica');
      m.data.molt = (m.data.molt ?? 30) - 0.5;
      if (m.data.molt <= 0) { m.data.molt = 40; if (near(m, g, 14) && Math.random() < 0.35) g.entities.dropItem(278, 1, m.body.pos.x, m.body.pos.y, m.body.pos.z, { x: 0, y: -0.5, z: 0 }, 0.3); }
      return null;
    },
  },

  // ===== Jaguar: de noche acecha agachado y salta si te acercás =====
  jaguar: {
    name: 'Jaguar', w: 0.8, h: 0.9, health: 26, speed: 3.2, hurtSound: 'jaguar', idleSound: 'jaguar', idleEvery: [10, 25],
    particle: [[0.8, 0.6, 0.2], [0.1, 0.08, 0.05]], drops: [],
    build() { return armarJaguar(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      m.data.pounceCd = Math.max(0, (m.data.pounceCd || 0) - dt);
      const night = g.daylight < 0.35;
      const hunting = night && distP < 18 && g.player.alive && g.mode === 'survival' && m.health > m.kind.health * 0.45;
      m.data.crouch = false;
      if (m.health <= m.kind.health * 0.45) { m.panic = Math.max(m.panic, 1); return false; }
      if (!hunting) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      if (!m.data.growled) { m.data.growled = true; g.audio.play('jaguar', { pos: m.soundPos(), vol: 1 }); }
      if (distP > 5) { m.moving = true; m.speedMul = 0.5; m.data.crouch = true; }
      else if (m.data.pounceCd <= 0 && m.body.onGround) {
        // ¡salto! primero se agazapa, para que se vea venir
        m.data.pounceCd = 3.5; m.moving = false;
        atacar(m, g, { tipo: 'mordida', prep: 0.65, lunge: 0, cd: 0.4, esquivar: true, alSoltar: () => { const p2 = g.player.body.pos, q = m.body.pos, l2 = Math.hypot(p2.x - q.x, p2.z - q.z) || 1; m.body.vel.x = ((p2.x - q.x) / l2) * 9; m.body.vel.z = ((p2.z - q.z) / l2) * 9; m.body.vel.y = 6.5; g.audio.play('jaguar', { pos: m.soundPos(), vol: 1, pitch: 1.3 }); } });
      } else { m.moving = distP > 1; m.speedMul = 1.3; }
      if (distP < 1.6 && Math.abs(pl.y - m.body.pos.y) < 1.5 && m.attackCd <= 0) atacar(m, g, { tipo: 'mordida', prep: 0.5, dano: 6, causa: 'Le cayó un jaguar', alcance: 1.6, cd: 1.2 });
      return true;
    },
    animate(m, dt, u) {
      const k = m.data.crouch ? 1 : 0;
      m.data.cr = (m.data.cr || 0) + (k - (m.data.cr || 0)) * Math.min(1, dt * 6);
      u.body.position.y = -m.data.cr * 0.18;
      u.tail.rotation.y = Math.sin(m.t * (m.data.crouch ? 6 : 1.5)) * 0.4;
    },
  },

  // ===== Cocodrilo: acecha en ríos y costas; muerde a quien nada cerca =====
  cocodrilo: {
    name: 'Cocodrilo', w: 0.9, h: 0.5, health: 24, speed: 1.4, swimmer: true, hurtSound: 'cocodrilo', idleSound: 'cocodrilo', idleEvery: [14, 30],
    particle: [[0.25, 0.32, 0.18]], drops: [[271, 1, 2], [262, 0, 1]],
    onHurt(m) { if (m.data.giro > 0) { m.data.giro = Math.min(m.data.giro, 0.15); } return true; }, // pegarle lo hace soltar
    build() { return armarCocodrilo(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const b = m.body;
      if (b.inWater) {
        // flotar con los ojos fuera del agua
        const top = Math.floor(b.pos.y) + 1;
        const surf = FLUID[g.world.getBlock(Math.floor(b.pos.x), top, Math.floor(b.pos.z))] === 1 ? top + 0.6 : top - 0.1;
        b.vel.y = (surf - 0.35 - b.pos.y) * 3;
      }
      // v12.8.1: el aviso de la vuelta del gigante; si uno sigue a menos de 2.5 en el agua al terminar, lo agarra
      if (m.data.preGiro > 0) {
        m.data.preGiro -= dt; anilloAviso(g, b.pos.x, Math.max(b.pos.y, g.player.body.pos.y) + 0.3, b.pos.z, 1.8, dt, m); // v12.8.4: radio 1.8 y a la altura del jugador (antes quedaba bajo el agua)
        if (m.data.preGiro <= 0) {
          m.data.preGiro = 0;
          if (g.player.alive && g.player.body.inWater && Math.hypot(g.player.body.pos.x - b.pos.x, g.player.body.pos.z - b.pos.z) < 1.8) { m.data.giro = 1.3; g.ui.toast('🐊 ¡La vuelta de la muerte! Péguele o salga del agua', 2400); }
        }
        return true;
      }
      // la vuelta de la muerte: mientras gira, el jugador da vueltas y se hunde con él
      if (m.data.giro > 0 && (!g.player.alive || !g.player.body.inWater)) { m.data.giro = 0; m.group.rotation.z = 0; }
      if (m.data.giro > 0) {
        m.data.giro -= dt;
        const pb = g.player.body; pb.pos.x += (b.pos.x - pb.pos.x) * Math.min(1, dt * 6); pb.pos.z += (b.pos.z - pb.pos.z) * Math.min(1, dt * 6); pb.vel.y = Math.min(pb.vel.y, -2);
        g.player.yaw += dt * 9; m.group.rotation.z = m.data.giro * 9;
        m.data.giroT = (m.data.giroT || 0) - dt; if (m.data.giroT <= 0) { m.data.giroT = 0.45; g.atacante = m; g.damagePlayer(1.5, b.pos.x, b.pos.z, 'La vuelta de la muerte de un cocodrilo', true, false); g.atacante = null; }
        if (m.data.giro <= 0) { m.data.giro = 0; m.group.rotation.z = 0; }
        return true;
      }
      const prey = g.player.alive && g.mode === 'survival' && ((g.player.body.inWater && distP < 10) || distP < 3);
      if (prey) {
        m.targetYaw = Math.atan2(dxp, dzp);
        m.moving = distP > 1.2; m.speedMul = b.inWater ? 2.6 : 1.4;
        if (distP < 1.8 && Math.abs(pl.y - b.pos.y) < 1.5 && m.attackCd <= 0) {
          if (m.type === 'cocodrilo_gigante' && !m.atk && !(m.data.brilloT > m.t)) { brilloAmago(m, g); m.data.brilloT = m.t + 1.2; } // v12.8.1 (fase 2): la mordida del gigante, con brillo dorado; v12.8.6: con candado
          atacar(m, g, { tipo: 'mordida', prep: 0.55, dano: 5, causa: 'Mordida de cocodrilo', alcance: 1.8, cd: 1.6, alSoltar: () => { m.data.snap = 0.4; }, alGolpe: (llego) => {
          if (!llego) return;
          // en el agua, a veces lo agarra y da la vuelta de la muerte: gira, lo hunde y le bota lo que tiene en la mano
          if (g.player.body.inWater && Math.random() < 0.3 && !m.data.giro && m.type === 'cocodrilo_gigante') { m.data.preGiro = 1.0; m.attackCd = 2.6; g.ui.toast('🐊 ¡Va a dar la vuelta de la muerte! Salga del anillo', 1600); } // v12.8.4: 1 s (con 0.6 nadando no se alcanzaba a salir) // v12.8.1 (fase 2): el gigante avisa
          else if (g.player.body.inWater && Math.random() < 0.3 && !m.data.giro) {
            m.data.giro = 1.3; m.attackCd = 2.6;
            g.ui.toast('🐊 ¡La vuelta de la muerte! Péguele o salga del agua', 2400);
            const inv = g.inventory, s = inv.held;
            if (s && !esUnico(s.id) && s.dur === undefined && !s.mejora && !s.filo && Math.random() < 0.5) { const it = { ...s }; inv.slots[inv.selected] = null; inv.changed(); g.entities.dropItem(it.id, it.count, b.pos.x, b.pos.y + 0.5, b.pos.z, undefined, 1.5, it.dur, extras(it)); g.ui.toast(`🐊 Se le soltó ${itemName(it.id)} en el agua`, 2600); }
          }
          g.audio.play('cocodrilo', { pos: m.soundPos(), vol: 1, pitch: 1.4 });
          } });
        }
        return true;
      }
      if (!b.inWater) {
        // en tierra busca volver al agua
        m.data.seekT = (m.data.seekT || 0) - dt;
        if (m.data.seekT <= 0) {
          m.data.seekT = 3;
          const w = g.world;
          for (let r = 2; r < 12; r += 2) for (let a = 0; a < 8; a++) {
            const x = Math.floor(b.pos.x + Math.cos(a) * r), z = Math.floor(b.pos.z + Math.sin(a) * r);
            if (FLUID[w.getBlock(x, Math.floor(b.pos.y), z)] === 1 || FLUID[w.getBlock(x, Math.floor(b.pos.y) - 1, z)] === 1) { m.data.water = { x: x + 0.5, z: z + 0.5 }; r = 99; break; }
          }
        }
        if (m.data.water) { m.goTo(m.data.water.x, m.data.water.z, 0.8); return true; }
      }
      return false;
    },
    animate(m, dt, u) {
      m.data.snap = Math.max(0, (m.data.snap || 0) - dt);
      u.headRx = -Math.sin(m.data.snap * 8) * 0.5;
      u.tail.rotation.y = Math.sin(m.t * 2) * 0.25 * (m.body.inWater ? 1.5 : 0.5);
    },
  },

  // ===== Tortuga marina: de noche sube a la playa, cava y deja un nido; luego vuelve al mar =====
  tortuga: {
    name: 'Tortuga marina', w: 0.9, h: 0.45, health: 14, speed: 0.7, swimmer: true, noJump: false, hurtSound: 'tortuga', idleSound: 'tortuga', idleEvery: [20, 40],
    particle: [[0.4, 0.5, 0.35]], drops: [],
    build() { return armarTortuga(); },
    brain(m, dt, c) {
      const { g } = c;
      const b = m.body, w = g.world;
      m.data.state = m.data.state || 'arrive';
      if (b.inWater && m.data.state !== 'leave') b.vel.y = Math.max(b.vel.y, 0.6);
      if (m.data.state === 'arrive') {
        if (!m.data.beach) {
          for (let r = 3; r < 24 && !m.data.beach; r += 2) for (let a = 0; a < 12; a++) {
            const x = Math.floor(b.pos.x + Math.cos(a / 12 * 6.28) * r), z = Math.floor(b.pos.z + Math.sin(a / 12 * 6.28) * r);
            let y = SEA + 4; while (y > SEA - 2 && w.getBlock(x, y, z) === AIR) y--;
            if (w.getBlock(x, y, z) === K.sand && w.getBlock(x, y + 1, z) === AIR && y >= SEA) { m.data.beach = { x: x + 0.5, y, z: z + 0.5 }; break; }
          }
          if (!m.data.beach) { m.data.state = 'leave'; return true; }
        }
        const t = m.data.beach;
        m.goTo(t.x, t.z, 1);
        if (Math.hypot(t.x - b.pos.x, t.z - b.pos.z) < 0.8) { m.data.state = 'dig'; m.data.digT = 7; }
        return true;
      }
      if (m.data.state === 'dig') {
        m.moving = false;
        m.data.digT -= dt;
        if (Math.random() < dt * 8) g.particles.dust(b.pos.x, b.pos.y, b.pos.z, K.sand, 3);
        if (m.data.digT <= 0) {
          const x = Math.floor(b.pos.x), y = Math.floor(b.pos.y) - 1, z = Math.floor(b.pos.z);
          if (w.getBlock(x, y, z) === K.sand) {
            w.setBlock(x, y, z, K.turtle_nest);
            w.setBE(x, y, z, { type: 'nest', hatch: (g.clock || 0) + 150 + Math.random() * 90 });
          }
          m.data.state = 'leave';
        }
        return true;
      }
      // volver al mar: caminar hacia donde baja la playa (agua)
      if (!m.data.sea) {
        for (let r = 2; r < 24 && !m.data.sea; r += 2) for (let a = 0; a < 12; a++) {
          const x = Math.floor(b.pos.x + Math.cos(a / 12 * 6.28) * r), z = Math.floor(b.pos.z + Math.sin(a / 12 * 6.28) * r);
          if (FLUID[w.getBlock(x, SEA, z)] === 1) { m.data.sea = { x: x + 0.5, z: z + 0.5 }; break; }
        }
      }
      if (m.data.sea) m.goTo(m.data.sea.x, m.data.sea.z, 1);
      if (b.inWater && m.data.state === 'leave') { m.data.goneT = (m.data.goneT || 0) + dt; if (m.data.goneT > 6) m.dead = true; }
      return true;
    },
    animate(m, dt, u) {
      const s = Math.sin(m.t * (m.body.inWater ? 3 : 4)) * (m.moving ? 0.5 : 0.1);
      u.flippers.forEach((f, i) => { f.rotation.y = (i % 2 ? -s : s); });
    },
  },

  // tortuguita recién nacida: corre al mar
  tortuguita: {
    name: 'Tortuguita', w: 0.3, h: 0.18, health: 2, speed: 1.6, swimmer: true, hurtSound: 'tortuga', idleSound: 'tortuga', idleEvery: [30, 60],
    particle: [[0.3, 0.3, 0.25]], drops: [],
    build() { return armarTortuguita(); },
    brain(m, dt, c) {
      const { g } = c;
      const b = m.body, w = g.world;
      if (desviada(m, dt)) return true; // v12.6.0: la luz de una antorcha la confunde
      if (!m.data.sea) {
        for (let r = 2; r < 30 && !m.data.sea; r += 2) for (let a = 0; a < 16; a++) {
          const x = Math.floor(b.pos.x + Math.cos(a / 16 * 6.28) * r), z = Math.floor(b.pos.z + Math.sin(a / 16 * 6.28) * r);
          if (FLUID[w.getBlock(x, SEA, z)] === 1) { m.data.sea = { x: x + 0.5, z: z + 0.5 }; break; }
        }
      }
      if (m.data.sea) m.goTo(m.data.sea.x, m.data.sea.z, 1);
      if (b.inWater) {
        m.data.swimT = (m.data.swimT || 0) + dt;
        if (m.data.swimT > 3) {
          m.dead = true;
          tortuguitaAlMar(g, m); // v12.6.0: las de un nido protegido pagan (arrecife.js)
          if (near(m, g, 24)) { g.achieve('tortuguitas', 'Viste a las tortuguitas llegar al mar'); g.particles.burst(b.pos.x, b.pos.y + 0.5, b.pos.z, [[0.7, 0.85, 1]], 6, 1); }
        }
      }
      return true;
    },
    animate(m, dt, u) { const s = Math.sin(m.t * 12) * 0.6; u.flippers.forEach((f, i) => { f.rotation.y = i ? -s : s; }); },
  },

  // ===== Ranas: saltan. La calzonuda croa con lluvia; la dardo envenena al tocarla =====
  rana_calzonuda: frogKind('Rana calzonuda', '#3aa83a', '#ff3a1e', '#2a6ad2', false),
  rana_dardo: frogKind('Rana dardo', '#d6201e', '#111111', '#1a3ad0', true),

  // ===== Colibrí: zumba en las flores; poliniza (los cultivos cerca crecen más rápido) =====
  colibri: {
    name: 'Colibrí', w: 0.2, h: 0.2, health: 2, speed: 6, flying: true, hurtSound: 'colibri', idleSound: 'colibri', idleEvery: [3, 6],
    particle: [[0.2, 0.8, 0.5]], drops: [],
    build() { return armarColibri(); },
    flyGoal(m, g) {
      // buscar una flor cerca y quedarse flotando frente a ella
      m.data.flowerT = (m.data.flowerT ?? 0) - 0.5;
      if (!m.data.flower || m.data.flowerT <= 0) {
        m.data.flowerT = 6 + Math.random() * 6;
        const w = g.world, b = m.body.pos;
        m.data.flower = null;
        for (let i = 0; i < 40; i++) {
          const x = Math.floor(b.x + (Math.random() - 0.5) * 16), y = Math.floor(b.y + (Math.random() - 0.5) * 6), z = Math.floor(b.z + (Math.random() - 0.5) * 16);
          const id = w.getBlock(x, y, z);
          if (id === K.flower_red || id === K.flower_yellow) { m.data.flower = { x: x + 0.5 + (Math.random() - 0.5) * 0.6, y: y + 0.7, z: z + 0.5 + (Math.random() - 0.5) * 0.6 }; break; }
        }
      }
      return m.data.flower;
    },
    flapSpeed: 60,
  },

  // ===== Mariposa morfo azul: vuela errática; se atrapa con red y frasco =====
  morfo: {
    name: 'Mariposa morfo', w: 0.25, h: 0.25, health: 1, speed: 1.6, flying: true, hurtSound: 'aleteo', idleSound: 'aleteo', idleEvery: [20, 40],
    particle: [[0.3, 0.6, 1]], drops: [],
    build() { return armarMorfo(); },
    flapSpeed: 9,
    erratic: true,
    interact(m, g, held) { return tryCatch(m, g, held, 286, 'Atrapó una morfo azul'); },
  },

  // ===== Terciopelo: serpiente venenosa en el pasto; si te acercás mucho, ataca =====
  terciopelo: {
    name: 'Terciopelo', w: 0.4, h: 0.25, health: 8, speed: 1.4, noJump: true, hurtSound: 'serpiente', idleSound: 'serpiente', idleEvery: [10, 20],
    particle: [[0.3, 0.22, 0.15]], drops: [],
    build() { return armarTerciopelo(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      if (distP < 2.6 && !g.player.sneaking && g.mode === 'survival' && g.player.alive && Math.abs(pl.y - m.body.pos.y) < 1.5) {
        m.targetYaw = Math.atan2(dxp, dzp);
        m.moving = false;
        if (m.attackCd <= 0) {
          atacar(m, g, { tipo: 'latigazo', prep: 0.42, dano: 3, causa: 'Mordida de terciopelo', alcance: 1.5, cd: 2.2, alSoltar: () => { m.data.strike = 0.35; g.audio.play('serpiente', { pos: m.soundPos(), vol: 1 }); }, alGolpe: (llego) => {
            if (!llego) return;
            const bota = g.inventory.armor[3];
            if (bota && ITEMS[bota.id] && ITEMS[bota.id].antiCulebra) { g.ui.toast('🥾 Las botas de bécquer aguantaron el colmillo: sin veneno', 2000); return; }
            g.addEffect('veneno', 12);
            // el veneno de la terciopelo pudre la carne: baja la vida máxima hasta que se cure con suero o guaco
            const P = g.player; P.necrosis = Math.min(4, (P.necrosis || 0) + 1); g.meta.necrosis = P.necrosis; P.health = Math.min(P.health, P.maxHealth);
            g.ui.toast(`¡Veneno! Se le está pudriendo la herida: ${P.maxHealth / 2} corazones de tope. Suero antiofídico o guaco (selva)`, 3200);
          } });
        }
        return true;
      }
      return false;
    },
    animate(m, dt, u) {
      m.data.strike = Math.max(0, (m.data.strike || 0) - dt);
      const amp = m.moving ? 0.07 : 0.02;
      u.segs.forEach((s, i) => { s.position.x = Math.sin(m.t * 6 - i * 0.9) * amp * (1 + i * 0.3); });
      u.head.position.z = 0.45 + Math.sin(m.data.strike * 9) * 0.25;
      u.head.position.y = 0.08 + (m.data.strike > 0 ? 0.08 : 0);
    },
  },

  // ===== Pizote: andan en manada; si hay cultivos cerca, se los comen (con fruta los distraés) =====
  pizote: {
    name: 'Pizote', w: 0.5, h: 0.5, health: 8, speed: 2.2, hurtSound: 'pizote', idleSound: 'pizote', idleEvery: [6, 14],
    particle: [[0.45, 0.32, 0.2]], drops: [],
    build() { return armarPizote(); },
    brain(m, dt, c) {
      const { g } = c;
      m.data.fedT = Math.max(0, (m.data.fedT || 0) - dt);
      if (m.data.fedT > 0 || g.daylight < 0.4) return false;
      // ¿hay cultivos cerca? ir a comérselos
      const b = m.body.pos;
      m.data.lookT = (m.data.lookT || 0) - dt;
      if (m.data.lookT <= 0) {
        m.data.lookT = 2;
        m.data.crop = null;
        for (const k of g.world.crops) {
          const [x, y, z] = k.split(',').map(Number);
          if (Math.hypot(x - b.x, z - b.z) < 10 && Math.abs(y - b.y) < 3) { m.data.crop = { x, y, z }; break; }
        }
      }
      const cr = m.data.crop;
      if (!cr) {
        // la manada: la primera que se encuentre manda, y las demás la siguen en fila con la cola parada
        if (m.data.cria === undefined) { m.data.cria = Math.random() < 0.3; if (m.data.cria) m.group.userData.babyScale = 0.62; }
        m.data.jefaT = (m.data.jefaT || 0) - dt;
        if (m.data.jefaT <= 0) {
          m.data.jefaT = 3;
          m.data.jefa = g.entities.mobs.find((o) => o.type === 'pizote' && !o.dead && Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z) < 18) || null;
          if (m.data.jefa === m) m.data.jefa = null;
        }
        const j = m.data.jefa;
        if (!j || j.dead) return false;
        const d = Math.hypot(j.body.pos.x - b.x, j.body.pos.z - b.z);
        if (d < 2.4) return false;
        m.goTo(j.body.pos.x, j.body.pos.z, d > 7 ? 1.5 : 1.1);
        return true;
      }
      m.goTo(cr.x + 0.5, cr.z + 0.5, 1.2);
      if (Math.hypot(cr.x + 0.5 - b.x, cr.z + 0.5 - b.z) < 1) {
        const id = g.world.getBlock(cr.x, cr.y, cr.z);
        if (BLOCKS[id].crop) {
          g.world.setBlock(cr.x, cr.y, cr.z, AIR);
          g.particles.blockBreak(cr.x, cr.y, cr.z, id, 10);
          g.audio.play('pizote', { pos: m.soundPos() });
          if (near(m, g, 24)) g.ui.toast('¡Los pizotes se están comiendo la cosecha!', 1800);
        }
        m.data.crop = null;
      }
      return true;
    },
    animate(m, dt, u) { u.tail.rotation.z = Math.sin(m.t * 2) * 0.2; u.headRx = 0.3 + Math.sin(m.t * 5) * 0.1; },
    interact(m, g, held) {
      if (held && isFruit(held.id)) {
        consume(g);
        for (const o of g.entities.mobs) if (o.type === 'pizote' && Math.hypot(o.body.pos.x - m.body.pos.x, o.body.pos.z - m.body.pos.z) < 12) o.data.fedT = 600;
        hearts(g, m.body.pos);
        g.ui.toast('La manada de pizotes está contenta: dejan en paz sus cultivos (10 min)', 2400);
        return true;
      }
      return false;
    },
  },

  // ===== Venado cola blanca: pasta en grupo y sale disparado si te acercás (levanta la cola blanca) =====
  venado: {
    name: 'Venado cola blanca', w: 0.7, h: 1.4, health: 14, speed: 4.2, hurtSound: 'resoplido', idleSound: null,
    particle: [[0.55, 0.4, 0.26]], drops: [[262, 1, 2], [271, 0, 2]],
    build() { return armarVenado(); },
    brain(m, dt, c) {
      const { g, dxp, dzp, distP } = c;
      // asustadizo: si te acercás (y no venís agachado) sale corriendo con la cola parada
      const sneaking = g.keys && (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight'));
      if (distP < (sneaking ? 4 : 9) || m.panic > 0) { m.data.flee = 3; }
      if ((m.data.flee = Math.max(0, (m.data.flee || 0) - dt)) > 0) {
        const b = m.body.pos;
        m.goTo(b.x - dxp * 3, b.z - dzp * 3, 1.6);
        if (m.body.onGround && Math.random() < dt * 2) m.body.vel.y = 6;
        return true;
      }
      return false;
    },
    animate(m, dt, u) { u.tail.rotation.x = (m.data.flee || 0) > 0 ? -1.2 : -0.2; if (!m.moving) u.headRx = -0.35 + Math.sin(m.t * 0.8) * 0.5 + 0.5; else u.headRx = -0.35; },
  },

  // ===== Armadillo: de noche hurga la tierra; si te acercás se hace una bolita =====
  armadillo: {
    name: 'Armadillo', w: 0.45, h: 0.35, health: 8, speed: 1.4, hurtSound: 'pizote', idleSound: null,
    particle: [[0.55, 0.5, 0.45]], drops: [],
    build() { return armarArmadillo(); },
    brain(m, dt, c) {
      // bolita: no se mueve y no le hace nada el que le pegue poquito
      m.data.ball = c.distP < 3.5 ? 4 : Math.max(0, (m.data.ball || 0) - dt);
      if (m.data.ball > 0) { m.moving = false; return true; }
      return false;
    },
    onHurt(m, g, dmg) { if (m.data.ball > 0 && dmg < 4) { g.ui.toast('El armadillo hecho bolita ni lo sintió', 1400); return false; } return true; },
    animate(m, dt, u) {
      const k = (m.data.ballK = (m.data.ballK || 0) + ((m.data.ball > 0 ? 1 : 0) - (m.data.ballK || 0)) * Math.min(1, dt * 8));
      u.head.visible = k < 0.6; u.tail.visible = k < 0.6; u.legs.forEach((l) => { l.visible = k < 0.6; });
      u.shell.scale.set(1 + k * 0.15, 1 + k * 0.6, 1 - k * 0.35);
      u.body.position.y = -k * 0.08;
    },
  },

  // ===== Rana calzonuda: verde con ojos rojos enormes, costados azules y patas anaranjadas; de noche brinca =====
  calzonuda: {
    name: 'Rana calzonuda', w: 0.25, h: 0.2, health: 2, speed: 1.6, hurtSound: 'rana', idleSound: 'rana', idleEvery: [4, 10],
    particle: [[0.3, 0.75, 0.25]], drops: [],
    build() { return armarCalzonuda(); },
    brain(m, dt) {
      // a brincos cortos
      if (m.body.onGround && Math.random() < dt * 0.8) { const a = Math.random() * Math.PI * 2; m.body.vel.x = Math.cos(a) * 2.2; m.body.vel.z = Math.sin(a) * 2.2; m.body.vel.y = 5; m.yaw = Math.atan2(m.body.vel.x, m.body.vel.z); }
      m.moving = !m.body.onGround;
      return true;
    },
  },

  // ===== Mono tití: chiquitico, anaranjado con la cara blanca y el hocico negro; anda en tropa y brinca =====
  titi: {
    name: 'Mono tití', w: 0.35, h: 0.45, health: 5, speed: 3.6, hurtSound: 'titi', idleSound: 'titi', idleEvery: [3, 8],
    particle: [[0.85, 0.55, 0.2]], drops: [],
    build() { return armarTiti(); },
    brain(m, dt, c) {
      // brincan a cada rato; si alguien se acerca de golpe, salen en estampida (pero curiosos se quedan mirando)
      const { distP } = c;
      if (m.body.onGround && m.moving && Math.random() < dt * 1.5) m.body.vel.y = 6.5;
      if (distP < 3 && (c.g.player.sprinting)) { m.data.flee = 2.5; }
      if ((m.data.flee = Math.max(0, (m.data.flee || 0) - dt)) > 0) {
        const b = m.body.pos;
        m.goTo(b.x - c.dxp * 3, b.z - c.dzp * 3, 1.8);
        if (m.body.onGround) m.body.vel.y = 7;
        return true;
      }
      return false;
    },
    animate(m, dt, u) { u.tail.rotation.x = 0.5 + Math.sin(m.t * 3) * 0.2; },
  },

  // ===== Tepezcuintle: roedor grande, café con filas de manchas blancas; sale de noche y corre al agua =====
  tepezcuintle: {
    name: 'Tepezcuintle', w: 0.5, h: 0.45, health: 9, speed: 2.4, hurtSound: 'tepezcuintle', idleSound: 'tepezcuintle', idleEvery: [8, 16],
    particle: [[0.45, 0.3, 0.18]], drops: [],
    build() { return armarTepezcuintle(); },
    brain(m, dt, c) {
      // asustadizo: si te acercás corre buscando agua para tirarse
      if (c.distP < 6) m.data.flee = 3;
      if ((m.data.flee = Math.max(0, (m.data.flee || 0) - dt)) > 0) {
        const b = m.body.pos;
        m.goTo(b.x - c.dxp * 3, b.z - c.dzp * 3, 1.7);
        return true;
      }
      return false;
    },
    onHurt(m, g, dmg) {
      if (m.health - dmg <= 0 && g.mode === 'survival') {
        // cazarlo está prohibido: multa del guardaparques
        const COLON = 360, n = Math.min(10, g.inventory.count(COLON));
        if (n) g.inventory.remove(COLON, n);
        g.ui.toast(`🚫 ¡Cazar tepezcuintle está prohibido! Multa de ${n} colones. Los animales del bosque se cuidan.`, 3600);
        g.achieve('multa', 'Multa por cazar');
      }
      return true;
    },
  },

  // ===== Iguana: toma sol; sale corriendo si te acercás =====
  iguana: {
    name: 'Iguana', w: 0.5, h: 0.3, health: 6, speed: 1.2, hurtSound: 'serpiente', idleSound: 'tortuga', idleEvery: [30, 60],
    particle: [[0.4, 0.55, 0.3]], drops: [],
    build() { return armarIguana(); },
    brain(m, dt, c) {
      const { distP, dxp, dzp } = c;
      if (distP < 5) { m.targetYaw = Math.atan2(-dxp, -dzp); m.moving = true; m.speedMul = 3.2; return true; }
      // tomar sol: casi siempre quieta
      if (m.thinkT <= 0) { m.thinkT = 8 + Math.random() * 10; m.moving = Math.random() < 0.2; m.targetYaw = Math.random() * 6.28; }
      return true;
    },
    animate(m, dt, u) { u.tail.rotation.y = Math.sin(m.t * (m.moving ? 8 : 0.7)) * 0.3; u.headRx = m.moving ? 0 : Math.sin(m.t * 0.5) * 0.15; },
  },
};

function frogKind(name, body, eyeCol, legCol, poison) {
  return {
    name, w: 0.3, h: 0.25, health: 2, speed: 0, hurtSound: 'rana', idleSound: 'rana', idleEvery: poison ? [10, 20] : [4, 9], noJump: true,
    particle: [[0.3, 0.7, 0.3]], drops: [],
    build() { return armarRana(body, eyeCol, legCol, poison); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp } = c;
      m.data.hopT = (m.data.hopT ?? Math.random() * 2) - dt;
      const scared = distP < 3;
      if (m.body.onGround && m.data.hopT <= 0) {
        m.data.hopT = scared ? 0.5 : 1.5 + Math.random() * 3;
        const yaw = scared ? Math.atan2(-dxp, -dzp) + (Math.random() - 0.5) : Math.random() * 6.28;
        m.yaw = m.targetYaw = yaw;
        m.body.vel.x = Math.sin(yaw) * 2.6; m.body.vel.z = Math.cos(yaw) * 2.6; m.body.vel.y = 5.5;
        m.data.jump = 0.4;
      }
      m.moving = false;
      // la rana dardo envenena si la tocás
      if (poison && distP < 0.8 && g.mode === 'survival' && !m.data.touched) {
        m.data.touched = 4;
        g.addEffect('veneno', 8);
        g.ui.toast('¡Tocó una rana dardo! Es venenosa', 1800);
      }
      if (m.data.touched) m.data.touched = Math.max(0, m.data.touched - dt);
      // croar de noche o con lluvia (la calzonuda)
      if (!poison && (g.daylight < 0.35 || (g.weather && g.weather.intensity > 0.4))) m.idleT = Math.min(m.idleT, 3 + Math.random() * 3);
      return true;
    },
    animate(m, dt, u) {
      m.data.jump = Math.max(0, (m.data.jump || 0) - dt);
      u.frogLegs.forEach((l) => { l.position.z = -0.03 - m.data.jump * 0.25; });
      // garganta que se infla al croar
    },
    interact(m, g, held) { return poison ? tryCatch(m, g, held, 284, 'Atrapó una rana dardo (¡con cuidado!)') : false; },
  };
}

// ---------- aparición por bioma ----------
export function faunaSpawn(E, g, x, y, z, col, ground) {
  const count = (t) => E.mobs.filter((m) => m.type === t).length;
  const day = g.daylight > 0.45, night = g.daylight < 0.3;
  const rain = g.weather && g.weather.intensity > 0.4;
  const w = g.world;
  const r = Math.random();
  const leafy = BLOCKS[ground].leafy;
  if (col.biome === 'jungle') {
    if (leafy && count('perezoso') < 2 && r < 0.15) {
      // colgar debajo de la copa
      let yy = y - 1;
      while (yy > y - 6 && w.getBlock(x, yy, z) !== AIR) yy--;
      if (w.getBlock(x, yy, z) === AIR && w.getBlock(x, yy - 1, z) === AIR) { const s = E.spawnMob('perezoso', x + 0.5, yy - 0.6, z + 0.5); s.data.hang = true; return true; }
    }
    if (day && count('tucan') < 3 && r < 0.3) { E.spawnMob('tucan', x + 0.5, y + 4, z + 0.5); return true; }
    if (day && count('morfo') < 4 && r < 0.45) { E.spawnMob('morfo', x + 0.5, y + 2, z + 0.5); return true; }
    if (!leafy && count('cara_blanca') < 4 && r < 0.6 && day) { for (let i = 0; i < 3; i++) E.spawnMob('cara_blanca', x + 0.5 + i * 0.4, y + 1, z + 0.5); return true; }
    if (!leafy && (night || rain) && count('rana_calzonuda') < 5 && r < 0.75) { E.spawnMob('rana_calzonuda', x + 0.5, y + 1, z + 0.5); return true; }
    if (!leafy && count('rana_dardo') < 2 && r < 0.85) { E.spawnMob('rana_dardo', x + 0.5, y + 1, z + 0.5); return true; }
    if (!leafy && night && count('jaguar') < 1 && r < 0.9 && g.mode === 'survival' && g.meta.dificultad !== 'tranquilo') { E.spawnMob('jaguar', x + 0.5, y + 1, z + 0.5); return true; }
    if (!leafy && count('terciopelo') < 2 && r < 0.96) { E.spawnMob('terciopelo', x + 0.5, y + 1, z + 0.5); return true; }
  }
  if ((col.biome === 'nuboso' || ((col.biome === 'forest' || col.biome === 'jungle') && col.h > 78)) && count('quetzal') < (col.biome === 'nuboso' ? 3 : 1) && Math.random() < 0.06 && day) { E.spawnMob('quetzal', x + 0.5, y + 5, z + 0.5); return true; }
  if ((col.biome === 'plains' || col.biome === 'forest' || col.biome === 'jungle') && day && count('colibri') < 3 && Math.random() < 0.25) {
    for (let i = 0; i < 20; i++) {
      const fx = x + Math.floor((Math.random() - 0.5) * 10), fz = z + Math.floor((Math.random() - 0.5) * 10);
      const fid = w.getBlock(fx, y + 1, fz);
      if (fid === K.flower_red || fid === K.flower_yellow) { E.spawnMob('colibri', fx + 0.5, y + 2, fz + 0.5); return true; }
    }
  }
  if ((col.biome === 'forest' || col.biome === 'jungle') && day && !leafy && count('pizote') < 5 && Math.random() < 0.15) { const n = 3 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) E.spawnMob('pizote', x + 0.5 + (i % 2), y + 1, z + 0.5 + Math.floor(i / 2)); return true; }
  if (['jungle', 'manglar', 'nuboso'].includes(col.biome) && night && count('calzonuda') < 4 && Math.random() < 0.12) { for (let i = 0; i < 2; i++) E.spawnMob('calzonuda', x + 0.5 + i, y + 1, z + 0.5); return true; }
  if ((col.biome === 'jungle' || col.biome === 'forest') && day && !leafy && (col.temp ?? 0.6) > 0.55 && count('titi') < 6 && Math.random() < 0.06) { const n = 4 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) E.spawnMob('titi', x + 0.5 + (i % 3) * 0.6, y + 1, z + 0.5 + Math.floor(i / 3) * 0.6); return true; }
  if (['jungle', 'forest', 'manglar'].includes(col.biome) && night && !leafy && count('tepezcuintle') < 2 && Math.random() < 0.08) { E.spawnMob('tepezcuintle', x + 0.5, y + 1, z + 0.5); return true; }
  if (['plains', 'forest', 'bosque_seco'].includes(col.biome) && day && !leafy && count('venado') < 4 && Math.random() < 0.08) { const n = 2 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) E.spawnMob('venado', x + 0.5 + i, y + 1, z + 0.5 + (i % 2)); return true; }
  if (['plains', 'bosque_seco', 'forest'].includes(col.biome) && night && !leafy && count('armadillo') < 2 && Math.random() < 0.12) { E.spawnMob('armadillo', x + 0.5, y + 1, z + 0.5); return true; }
  if ((col.biome === 'beach' || col.biome === 'desert') && day && count('iguana') < 3 && Math.random() < 0.3) { E.spawnMob('iguana', x + 0.5, y + 1, z + 0.5); return true; }
  if (col.biome === 'beach' && night && count('tortuga') < 2 && Math.random() < 0.25) {
    // aparece en el agua cerca de la playa
    for (let i = 0; i < 12; i++) {
      const ax = x + Math.floor((Math.random() - 0.5) * 24), az = z + Math.floor((Math.random() - 0.5) * 24);
      if (FLUID[w.getBlock(ax, SEA, az)] === 1 && FLUID[w.getBlock(ax, SEA - 1, az)] === 1) { E.spawnMob('tortuga', ax + 0.5, SEA - 0.5, az + 0.5); return true; }
    }
  }
  // cocodrilos en ríos y desembocaduras (agua dulce poco profunda cerca de tierra)
  if ((col.biome === 'beach' || col.biome === 'jungle' || col.biome === 'plains') && count('cocodrilo') < 2 && Math.random() < 0.12) {
    for (let i = 0; i < 12; i++) {
      const ax = x + Math.floor((Math.random() - 0.5) * 20), az = z + Math.floor((Math.random() - 0.5) * 20);
      if (FLUID[w.getBlock(ax, SEA, az)] === 1 && !FLUID[w.getBlock(ax, SEA - 3, az)] && g.world.gen.column(ax, az).biome !== 'ocean') { E.spawnMob('cocodrilo', ax + 0.5, SEA - 0.3, az + 0.5); return true; }
    }
  }
  return false;
}

// ---------- nidos de tortuga ----------
export function tickNests(g) {
  const w = g.world;
  for (const [ck, m] of w.blockEntities) {
    const [cx, cz] = ck.split(',').map(Number);
    if (!w.getChunk(cx, cz)) continue;
    for (const [i, be] of m) {
      if (be.type !== 'nest') continue;
      { const bx = cx * 16 + (i % 16), bz = cz * 16 + (Math.floor(i / 16) % 16), by = Math.floor(i / 256); if (w.getBlock(bx, by, bz) !== K.turtle_nest) { w.setBE(bx, by, bz, null); continue; } } // v12.6.5: nido que ya no está
      // v12.6.4: los de la tortuga lora (la arribada) nacen de noche desde el quinto día; los demás, con su reloj de siempre.
      // Un nido de lora de la 12.6.1 no trae «eclosiona»: se toma su día + 5
      if (be.lora ? !((g.day || 1) >= (Number.isFinite(be.eclosiona) ? be.eclosiona : (Number(be.dia) || 0) + 5) && g.daylight < 0.3) : (g.clock || 0) < be.hatch) continue;
      const x = cx * 16 + (i % 16), z = cz * 16 + (Math.floor(i / 16) % 16), y = Math.floor(i / 256);
      w.setBE(x, y, z, null);
      if (w.getBlock(x, y, z) === K.turtle_nest) w.setBlock(x, y, z, K.sand);
      const n = 3 + Math.floor(Math.random() * 4);
      for (let k = 0; k < n; k++) g.entities.spawnMob('tortuguita', x + 0.3 + Math.random() * 0.4, y + 1.05, z + 0.3 + Math.random() * 0.4);
      g.particles.dust(x + 0.5, y + 1, z + 0.5, K.sand, 12);
      if (Math.hypot(x - g.player.body.pos.x, z - g.player.body.pos.z) < 24) g.ui.toast('¡Están naciendo tortuguitas!', 2000);
      return; // de a una por cuadro
    }
  }
}
