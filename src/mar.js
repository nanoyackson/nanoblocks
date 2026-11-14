// Mar y costa: peces de colores en cardumen, delfines que siguen el bote y saltan, ballena jorobada que sopla
// y canta, tiburón martillo (protegido), y el bote de remos. Todas nadan con `swim` (kind.update propio).
import { atacar } from './golpes.js';
import { mult, lv as skillLv } from './habilidades.js';
import { tickRafting } from './rafting.js';
import * as THREE from 'three';
import { armarBote } from './modelos-vehiculos.js';
import { armarDelfin, armarBallena, armarTiburon, vestirPez } from './modelos-mar.js';
import { FLUID, AIR, SOLID, esPescado } from './blocks.js';
import { alCaerAgua } from './pesca.js';
import { pal, tintModel } from './models.js';
import { hearts } from './fauna.js';

export const FISH = { pargo: 361, corvina: 362, guapote: 363, dorado: 364 };
export const BOAT_ITEM = 358;
const isFish = (id) => esPescado(id); // v12.7.0: el registro de blocks.js

const waterAt = (w, x, y, z) => FLUID[w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))] === 1;
// altura de la superficie del agua sobre (x, y, z): el primer bloque sin agua hacia arriba
function surfaceAbove(w, x, y, z) {
  let yy = Math.floor(y);
  for (let k = 0; k < 40 && waterAt(w, x, yy + 1, z); k++) yy++;
  return yy + 1;
}

// ---------- nado genérico ----------
export function swim(m, dt, opt) {
  const g = m.game, w = g.world, b = m.body, u = m.group.userData;
  m.hurtT = Math.max(0, m.hurtT - dt);
  m.attackCd = Math.max(0, m.attackCd - dt);
  m.thinkT -= dt;
  m.panic = Math.max(0, m.panic - dt);
  const pl = g.player.body.pos;
  const dpl = Math.hypot(pl.x - b.pos.x, pl.y - b.pos.y, pl.z - b.pos.z);
  const inW = waterAt(w, b.pos.x, b.pos.y + m.kind.h * 0.5, b.pos.z);
  m.data.leapT = Math.max(0, (m.data.leapT || 0) - dt);
  if (inW) {
    m.data.dry = 0;
    const custom = opt.goal ? opt.goal(m, g, dpl) : null;
    if (custom) m.goal = custom;
    else if (!m.goal || m.thinkT <= 0 || b.hitWall) {
      m.thinkT = 2 + Math.random() * 4;
      m.goal = null;
      const r = opt.range || 10;
      for (let k = 0; k < 10; k++) {
        const gx = b.pos.x + (Math.random() - 0.5) * 2 * r, gz = b.pos.z + (Math.random() - 0.5) * 2 * r;
        const gy = b.pos.y + (Math.random() - 0.5) * (opt.vr || 4);
        if (waterAt(w, gx, gy, gz) && waterAt(w, gx, gy + m.kind.h, gz)) { m.goal = { x: gx, y: gy, z: gz }; break; }
      }
      if (!m.goal) m.goal = { x: b.pos.x, y: b.pos.y - 1, z: b.pos.z };
    }
    // espantarse del jugador
    if (opt.shy && dpl < opt.shy && !custom) m.goal = { x: b.pos.x + (b.pos.x - pl.x) * 3, y: b.pos.y - 1, z: b.pos.z + (b.pos.z - pl.z) * 3 };
    const dx = m.goal.x - b.pos.x, dy = m.goal.y - b.pos.y, dz = m.goal.z - b.pos.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const sp = opt.speed * (m.speedMul || 1);
    m.speedMul = 1;
    const k = Math.min(1, dt * (opt.accel || 2));
    b.vel.x += ((dx / d) * sp - b.vel.x) * k;
    b.vel.y += ((dy / d) * sp * 0.6 - b.vel.y) * k;
    b.vel.z += ((dz / d) * sp - b.vel.z) * k;
    // no asomarse fuera del agua (salvo un salto)
    if (m.data.leapT <= 0 && b.vel.y > 0 && !waterAt(w, b.pos.x, b.pos.y + m.kind.h + 0.2, b.pos.z)) b.vel.y = Math.min(b.vel.y, -0.2);
    b.step(w, dt, { flying: true });
    if (d < 1) m.thinkT = 0;
  } else {
    // fuera del agua: cae; varado en tierra aletea y se ahoga de a poco
    b.step(w, dt);
    if (b.onGround) {
      m.data.dry = (m.data.dry || 0) + dt;
      if (Math.random() < dt * 2.5) { b.vel.y = 3.5; b.vel.x = (Math.random() - 0.5) * 3; b.vel.z = (Math.random() - 0.5) * 3; }
      if (m.data.dry > 15 && Math.random() < dt) m.hurt(1, b.pos.x, b.pos.z);
    }
  }
  // rumbo y animación
  const hs = Math.hypot(b.vel.x, b.vel.z);
  if (hs > 0.05) {
    let dyaw = Math.atan2(b.vel.x, b.vel.z) - m.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    m.yaw += dyaw * Math.min(1, dt * (opt.turn || 4));
    m.rollS = (m.rollS || 0) + (Math.max(-0.4, Math.min(0.4, -dyaw * 0.4)) - (m.rollS || 0)) * Math.min(1, dt * 5);
  } else m.rollS = (m.rollS || 0) * Math.pow(0.05, dt);
  if (u.body) u.body.rotation.z = m.rollS || 0;
  m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
  m.group.rotation.y = m.yaw;
  m.pitchS = (m.pitchS || 0) + (Math.max(-0.7, Math.min(0.7, -b.vel.y * (inW ? 0.12 : 0.2))) - (m.pitchS || 0)) * Math.min(1, dt * 6);
  if (u.body) u.body.rotation.x = m.pitchS;
  const flap = m.t * (opt.tailSpeed || 9) * (0.6 + Math.min(1, hs / Math.max(0.1, opt.speed)));
  if (u.tail) u.tail.rotation[opt.tailAxis || 'y'] = Math.sin(flap) * (opt.tailAmp || 0.4);
  if (u.fins) u.fins.forEach((f, i) => { f.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(flap * 0.7) * 0.2); });
  m.idleT -= dt;
  if (m.idleT <= 0 && m.kind.idleSound) {
    const [a, bb] = m.kind.idleEvery || [10, 25];
    m.idleT = a + Math.random() * (bb - a);
    if (dpl < (opt.hearFar || 24)) g.audio.play(m.kind.idleSound, { pos: m.soundPos(), vol: opt.idleVol || 0.7 });
  }
  if (b.pos.y < -10) m.dead = true;
  tintModel(m.group, m.lightLevel(), m.hurtT > 0 ? Math.min(1, m.hurtT * 3) * 0.7 : 0);
  return inW;
}

// ---------- pieles ----------
const FISH_SKINS = [
  { name: 'pargo', cols: pal('#a8241c', '#c83a2a', '#e0563c', '#f08060'), belly: [250, 200, 180], drop: FISH.pargo },
  { name: 'loro', cols: pal('#1a6a8a', '#2a8aa8', '#3fb0c0', '#7ad8d0'), belly: [240, 220, 120], drop: FISH.corvina },
  { name: 'angel', cols: pal('#c8a018', '#e0c030', '#f0dc58', '#fff090'), belly: [40, 60, 160], drop: FISH.corvina },
  { name: 'cirujano', cols: pal('#1a2a8a', '#2a40b0', '#3c5ad0', '#6a86e8'), belly: [240, 220, 60], drop: FISH.pargo },
  { name: 'guapote', cols: pal('#3a4a2a', '#4e6034', '#647a42', '#88a060'), belly: [210, 200, 150], drop: FISH.guapote },
];

// ---------- peces ----------
const PEZ = {
  name: 'Pez', w: 0.4, h: 0.3, health: 3, speed: 2.2, swimmer: true, hurtSound: 'pez', idleSound: null,
  particle: [[0.9, 0.4, 0.3], [0.95, 0.9, 0.7]], drops: [],
  build() {
    const g = new THREE.Group();
    const body = new THREE.Group(); g.add(body);
    g.userData = { body, pending: true };
    return g;
  },
  dress(m) {
    const u = m.group.userData;
    if (!u.pending) return;
    u.pending = false;
    vestirPez(u, FISH_SKINS[m.data.variant || 0]);
  },
  update(m, dt) {
    if (m.group.userData.pending) this.dress(m);
    swim(m, dt, {
      speed: 2.2, range: 6, vr: 3, shy: 3.5, tailSpeed: 14, tailAmp: 0.5,
      // el cardumen sigue al primero
      goal: (mm, g) => {
        const lead = mm.data.school && g.entities.mobs.find((o) => o.type === 'pez' && o.data.school === mm.data.school && o !== mm && !o.dead && o.data.leader);
        if (!lead || mm.data.leader) return null;
        const o = mm.data.offset || (mm.data.offset = { x: (Math.random() - 0.5) * 2.5, y: (Math.random() - 0.5) * 1.2, z: (Math.random() - 0.5) * 2.5 });
        return { x: lead.body.pos.x + o.x, y: lead.body.pos.y + o.y, z: lead.body.pos.z + o.z };
      },
    });
  },
  // suelta el pescado de su especie
  onHurt(m, g, dmg) {
    if (m.health - dmg <= 0) g.entities.dropItem(FISH_SKINS[m.data.variant || 0].drop, 1, m.body.pos.x, m.body.pos.y + 0.3, m.body.pos.z);
  },
};

// ---------- delfín ----------
const DELFIN = {
  name: 'Delfín nariz de botella', w: 0.9, h: 0.7, health: 20, speed: 4.5, swimmer: true, hurtSound: 'delfin', idleSound: 'delfin', idleEvery: [6, 16],
  particle: [[0.4, 0.45, 0.5], [0.9, 0.95, 1]], drops: [],
  build() { return armarDelfin(); },
  update(m, dt) {
    const g = m.game, b = m.body, w = g.world;
    const inW = swim(m, dt, {
      speed: 4.5, range: 16, vr: 3, accel: 1.6, turn: 2.5, tailAxis: 'x', tailSpeed: 7, tailAmp: 0.35, hearFar: 32,
      goal: (mm, gg, dpl) => {
        // si el jugador va en bote, lo acompañan a los lados
        const r = gg.riding;
        if (r && r.kind.boat && dpl < 40) {
          const side = mm.data.side || (mm.data.side = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2));
          const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw);
          return { x: r.body.pos.x + fz * side + fx * 3, y: r.body.pos.y - 1.4, z: r.body.pos.z - fx * side + fz * 3 };
        }
        return null;
      },
    });
    // saltos: cerca de la superficie, de vez en cuando (más si van con el bote)
    if (inW && m.data.leapT <= 0 && !waterAt(w, b.pos.x, b.pos.y + 1.6, b.pos.z) && Math.random() < dt * (g.riding && g.riding.kind.boat ? 0.35 : 0.08)) {
      m.data.leapT = 1.2;
      b.vel.y = 7.5;
      const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
      b.vel.x = fx * 6; b.vel.z = fz * 6;
      g.audio.play('splash', { pos: m.soundPos(), vol: 0.5 });
      g.particles.burst(b.pos.x, b.pos.y + 0.6, b.pos.z, [[0.8, 0.9, 1], [1, 1, 1]], 14, 3);
    }
    if (!inW && m.data.leapT > 0) {
      // en el aire: arco con la nariz apuntando a donde va
      m.group.userData.body.rotation.x = Math.max(-0.9, Math.min(0.9, -b.vel.y * 0.13));
      if (!m.data.splashed && b.vel.y < 0 && waterAt(w, b.pos.x, b.pos.y - 0.3, b.pos.z)) { m.data.splashed = true; g.audio.play('splash', { pos: m.soundPos(), vol: 0.6 }); g.particles.burst(b.pos.x, b.pos.y, b.pos.z, [[0.8, 0.9, 1], [1, 1, 1]], 18, 3.5); }
    } else m.data.splashed = false;
  },
  onHurt(m, g) {
    g.ui.toast('¡No! Los delfines son amigos 🐬', 1600);
    m.panic = 3;
    return false;
  },
  interact(m, g, held) {
    if (held && isFish(held.id)) {
      if (g.mode === 'survival') g.inventory.consumeHeld(1);
      hearts(g, m.body.pos, 8, [0.5, 0.8, 1]);
      g.audio.play('delfin', { pos: m.soundPos(), vol: 0.9 });
      g.addEffect('delfin', 180);
      g.ui.toast('🐬 Gracia del delfín: nada mucho más rápido', 2000);
      g.achieve('delfin', 'Amistad con los delfines');
      return true;
    }
    return false;
  },
};

// ---------- ballena jorobada ----------
const BALLENA = {
  name: 'Ballena jorobada', w: 2.6, h: 2.2, health: 200, speed: 1.6, swimmer: true, hurtSound: 'ballena', idleSound: 'ballena', idleEvery: [18, 40],
  particle: [[0.15, 0.17, 0.2], [0.9, 0.95, 1]], drops: [],
  build() { return armarBallena(); },
  update(m, dt) {
    const g = m.game, b = m.body, w = g.world;
    m.data.breath = (m.data.breath ?? 20) - dt;
    const inW = swim(m, dt, {
      speed: 1.6, range: 30, vr: 6, accel: 0.6, turn: 0.8, tailAxis: 'x', tailSpeed: 2.2, tailAmp: 0.3, hearFar: 90, idleVol: 1,
      // cada tanto sube a respirar
      goal: (mm) => (mm.data.breath <= 0 ? { x: b.pos.x + Math.sin(mm.yaw) * 8, y: surfaceAbove(w, b.pos.x, b.pos.y, b.pos.z) - 2.2, z: b.pos.z + Math.cos(mm.yaw) * 8 } : null),
    });
    const top = surfaceAbove(w, b.pos.x, b.pos.y, b.pos.z);
    if (inW && m.data.breath <= 0 && b.pos.y + 2.4 >= top - 0.2) {
      // soplido: chorro de agua por el espiráculo
      m.data.breath = 25 + Math.random() * 25;
      const hx = b.pos.x + Math.sin(m.yaw) * 3, hz = b.pos.z + Math.cos(m.yaw) * 3;
      for (let k = 0; k < 40; k++) g.particles.spawn(hx + (Math.random() - 0.5) * 0.4, top + 0.2, hz + (Math.random() - 0.5) * 0.4, [0.92, 0.96, 1], (Math.random() - 0.5) * 1.5, 7 + Math.random() * 4, (Math.random() - 0.5) * 1.5, 1.4, 9);
      g.audio.play('splash', { pos: { x: hx, y: top, z: hz }, vol: 0.8, pitch: 0.6 });
      // y a veces salta fuera del agua
      if (Math.random() < 0.3) { m.data.leapT = 3; b.vel.y = 9; }
      g.achieve('ballena', 'Vi una ballena jorobada');
    }
    if (!inW && m.data.leapT > 0 && b.vel.y < 0 && !m.data.splashed && waterAt(w, b.pos.x, b.pos.y, b.pos.z)) {
      m.data.splashed = true;
      g.audio.play('explode', { pos: m.soundPos(), vol: 0.35, pitch: 0.5 });
      g.particles.burst(b.pos.x, b.pos.y + 1, b.pos.z, [[0.8, 0.9, 1], [1, 1, 1]], 60, 6);
    }
    if (inW) m.data.splashed = false;
  },
  onHurt(m, g) { g.ui.toast('Las ballenas jorobadas visitan Costa Rica para tener sus crías. ¡Déjela tranquila!', 2600); return false; },
};

// ---------- tiburón martillo ----------
const TIBURON = {
  name: 'Tiburón martillo', w: 0.9, h: 0.7, health: 28, speed: 3.6, swimmer: true, hurtSound: 'pez', idleSound: null,
  particle: [[0.4, 0.45, 0.5], [0.7, 0.1, 0.1]], drops: [],
  build() { return armarTiburon(); },
  update(m, dt) {
    const g = m.game, pl = g.player.body.pos, b = m.body;
    const playerInWater = waterAt(g.world, pl.x, pl.y + 0.5, pl.z) && !g.riding;
    swim(m, dt, {
      speed: 3.2, range: 18, vr: 4, accel: 1.8, turn: 3, tailSpeed: 6, tailAmp: 0.45,
      goal: (mm, gg, dpl) => {
        if (gg.mode !== 'survival' || !playerInWater || dpl > 16 || mm.panic > 0) return null;
        mm.speedMul = 1.5;
        return { x: pl.x, y: pl.y + 0.4, z: pl.z };
      },
    });
    const d = Math.hypot(pl.x - b.pos.x, pl.y + 0.5 - b.pos.y, pl.z - b.pos.z);
    if (playerInWater && g.mode === 'survival' && d < 1.6 && m.attackCd <= 0 && m.panic <= 0) {
      atacar(m, g, { tipo: 'mordida', prep: 0.5, dano: 4, causa: 'Mordida de tiburón martillo', alcance: 1.6, altura: 2.6, cd: 1.6, alSoltar: () => g.audio.play('splash', { pos: m.soundPos(), vol: 0.6 }) });
    }
  },
  onHurt(m, g) {
    m.panic = 6; // se va
    if (!m.data.warned) { m.data.warned = true; g.ui.toast('Los tiburones martillo están protegidos en la Isla del Coco 🦈', 2400); }
  },
};

// ---------- bote ----------
const BOTE = {
  name: 'Bote', w: 1.4, h: 0.6, health: 6, speed: 0, boat: true, hurtSound: 'dig.wood', idleSound: null,
  particle: [[0.55, 0.4, 0.25], [0.4, 0.3, 0.18]], drops: [],
  build() { return armarBote(); },
  update(m, dt) {
    const g = m.game, b = m.body, w = g.world, u = m.group.userData;
    m.hurtT = Math.max(0, m.hurtT - dt);
    // la lancha: el mismo bote con un motor fuera de borda atrás
    if (m.data.motor && !u.motor) {
      const mo = new THREE.Group(); mo.position.set(0, 0.35, -1.25);
      const caja = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a2a30 })); caja.position.y = 0.2;
      const tapa = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.32), new THREE.MeshLambertMaterial({ color: 0xc82a2a })); tapa.position.y = 0.45;
      const pata = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), new THREE.MeshLambertMaterial({ color: 0x3a3a40 })); pata.position.y = -0.25;
      mo.add(caja, tapa, pata); (u.body || m.group).add(mo); u.motor = mo;
    }
    if (!(m.data.ridden && g.riding === m)) {
      m.data.ridden = false;
      // flota en la superficie; en tierra se queda quieto
      const surf = findSurface(w, b.pos.x, b.pos.y, b.pos.z);
      if (surf !== null) {
        b.vel.y += ((surf - 0.28 - b.pos.y) * 6 - b.vel.y) * Math.min(1, dt * 4);
        b.vel.x *= Math.pow(0.4, dt); b.vel.z *= Math.pow(0.4, dt);
        b.step(w, dt, { flying: true });
      } else { b.vel.x *= Math.pow(0.02, dt); b.vel.z *= Math.pow(0.02, dt); b.step(w, dt); }
    }
    // remar
    const row = m.data.rowing || 0;
    m.data.rowPhase = (m.data.rowPhase || 0) + dt * 5 * row;
    for (const { p, sx } of u.paddles) { p.rotation.y = sx * Math.sin(m.data.rowPhase) * 0.6 * row; p.rotation.x = (Math.cos(m.data.rowPhase) * 0.25) * row; }
    const bob = Math.sin(m.t * 1.6) * 0.03;
    m.group.position.set(b.pos.x, b.pos.y + bob, b.pos.z);
    m.group.rotation.y = m.yaw;
    u.body.rotation.z = Math.sin(m.t * 1.1) * 0.03;
    tintModel(m.group, m.lightLevel(), m.hurtT > 0 ? 0.5 : 0);
  },
  onHurt(m, g) {
    // a golpes se desarma y suelta el bote como ítem
    m.data.hits = (m.data.hits || 0) + 1;
    m.hurtT = 0.3;
    g.audio.play('dig.wood', { pos: m.soundPos(), vol: 0.7 });
    if (m.data.hits >= 3) {
      if (g.riding === m) g.dismount();
      m.dead = true;
      g.entities.dropItem(BOAT_ITEM, 1, m.body.pos.x, m.body.pos.y + 0.6, m.body.pos.z);
    }
    return false;
  },
  interact(m, g, held) {
    if (m.data.motor && held && held.id === 390 && !g.riding) { m.data.fuel = 100; m.data.toldGas = false; if (g.mode === 'survival') g.inventory.consumeHeld(1); g.audio.play('balde', { pos: m.soundPos(), vol: 0.6 }); g.ui.toast('⛽ Lancha con el tanque lleno', 1400); return true; }
    if (g.riding) return false;
    g.mountBoat(m);
    return true;
  },
};

// superficie del agua bajo/en (x, y, z) dentro de 3 bloques, o null
function findSurface(w, x, y, z) {
  const y0 = Math.floor(y + 0.6);
  for (let yy = y0; yy > y0 - 2; yy--) if (waterAt(w, x, yy, z)) return surfaceAbove(w, x, yy, z) - 0.1; // agua en la quilla o justo debajo (antes 3: «flotaba» sobre la orilla de un charco)
  return null;
}
// ¿cuántos puntos del casco (unos 2.6 de largo y 1.1 de ancho) tocan un bloque sólido a la altura del agua? 0 = libre
function cascoChoca(w, x, y, z, yaw) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), hy = Math.floor(y + 0.35);
  let n = 0;
  for (const d of [-1.25, -0.6, 0, 0.6, 1.25]) for (const l of [-0.5, 0, 0.5]) {
    const cx = x + fx * d + fz * l, cz = z + fz * d - fx * l;
    if (SOLID[w.getBlock(Math.floor(cx), hy, Math.floor(cz))]) n++;
  }
  return n;
}

// el jugador rema: el bote sigue la mirada; W avanza, S retrocede, Ctrl rema fuerte
export function boatRide(g, m, dt, input) {
  const p = g.player, b = m.body, w = g.world;
  if (input.sneak) { g.dismount(); return; }
  let dy = (p.yaw + Math.PI) - m.yaw;
  while (dy > Math.PI) dy -= Math.PI * 2;
  while (dy < -Math.PI) dy += Math.PI * 2;
  // v11.9.2: el casco entero (proa, popa y costados) no entra en bloques, tampoco al girar junto a la orilla
  const nuevoYaw = m.yaw + dy * Math.min(1, dt * 2.5);
  const yaAntes = cascoChoca(w, b.pos.x, b.pos.y, b.pos.z, m.yaw), alGirar = cascoChoca(w, b.pos.x, b.pos.y, b.pos.z, nuevoYaw);
  if (alGirar === 0 || alGirar < yaAntes) m.yaw = nuevoYaw; // si ya rozaba, solo gira para soltarse, nunca para meterse más
  const f = input.forward ? 1 : input.back ? -0.4 : 0;
  const surf = findSurface(w, b.pos.x, b.pos.y, b.pos.z);
  const motor = m.data.motor && (m.data.fuel ?? 60) > 0;
  const speed = (surf !== null ? (motor ? (input.sprint ? 18 : 13) : input.sprint ? 8.5 : 5.5) : 0.3) * (m.data && m.data.cayuco ? 0.7 : 1); // en tierra apenas se arrastra (para volver al agua)
  const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
  const k = 1 - Math.exp(-(surf !== null ? 1.4 : 6) * dt);
  b.vel.x += (fx * f * speed - b.vel.x) * k;
  b.vel.z += (fz * f * speed - b.vel.z) * k;
  // el casco es más largo que la caja de choque: si en el próximo paso entraría en un bloque, no avanza (ni de lado)
  const dir = Math.sign(b.vel.x * fx + b.vel.z * fz);
  const px = b.pos.x + b.vel.x * dt * 2, pz = b.pos.z + b.vel.z * dt * 2;
  const ahora = cascoChoca(w, b.pos.x, b.pos.y, b.pos.z, m.yaw);
  if (cascoChoca(w, px, b.pos.y, pz, m.yaw) > Math.max(0, ahora - 1)) {
    const libreX = cascoChoca(w, px, b.pos.y, b.pos.z, m.yaw) <= Math.max(0, ahora - 1), libreZ = cascoChoca(w, b.pos.x, b.pos.y, pz, m.yaw) <= Math.max(0, ahora - 1);
    if (!libreX) b.vel.x = 0;
    if (!libreZ) b.vel.z = 0;
    // varar: desde el agua, a ras, contra un escalón de un bloque, y solo si el casco ya subido cabe entero
    const aRas = surf !== null && Math.abs(b.pos.y - (surf - 0.28)) < 0.35;
    if (aRas && f > 0 && dir > 0 && (m.data.vararT || 0) <= 0 && cascoChoca(w, b.pos.x + fx * 0.6, b.pos.y + 1.05, b.pos.z + fz * 0.6, m.yaw) === 0) { b.pos.y += 1.05; b.vel.x += fx * 1.5; b.vel.z += fz * 1.5; m.data.vararT = 1.2; }
  }
  m.data.vararT = Math.max(0, (m.data.vararT || 0) - dt);
  const bx = b.pos.x, bz = b.pos.z;
  if (surf !== null) {
    tickRafting(g, m, dt, true);
    b.vel.y += ((surf - 0.28 - b.pos.y) * 6 - b.vel.y) * Math.min(1, dt * 4);
    b.step(w, dt, { flying: true });
  } else b.step(w, dt);
  const moved = Math.hypot(b.pos.x - bx, b.pos.z - bz);
  m.data.rowing = Math.min(1, (m.data.rowing || 0) * 0.9 + (f !== 0 ? 0.2 : 0));
  if (m.data.motor) {
    m.data.fuel = Math.max(0, (m.data.fuel ?? 60) - moved / 60);
    if (!motor && !m.data.toldGas) { m.data.toldGas = true; g.ui.toast('⛽ La lancha se quedó sin gasolina: a remar se ha dicho', 2400); }
    g.audio.setEmitter('lancha', 'loop.motor', motor && surf !== null ? { x: b.pos.x, y: b.pos.y + 0.4, z: b.pos.z } : null, 0.2 + Math.min(0.3, moved * 3));
    if (motor && moved > 0.05 && surf !== null) for (let k = 0; k < 2; k++) g.particles.spawn(b.pos.x - fx * 1.6 + (Math.random() - 0.5) * 0.6, b.pos.y + 0.3, b.pos.z - fz * 1.6 + (Math.random() - 0.5) * 0.6, [0.92, 0.96, 1], -fx * 2 + (Math.random() - 0.5), 1.2, -fz * 2 + (Math.random() - 0.5), 0.8);
    if (motor) { g.lanchaDist = (g.lanchaDist || 0) + moved; if (g.lanchaDist > 300) g.achieve('lancha', 'Por los canales en lancha'); }
  }
  g.rowT = (g.rowT || 0) - dt * (f !== 0 && !motor ? 1 : 0);
  if (f !== 0 && g.rowT <= 0 && surf !== null && !motor) {
    g.rowT = input.sprint ? 0.75 : 1.1;
    g.audio.play('remo', { pos: b.pos, vol: 0.55 });
    for (const sx of [-1, 1]) g.particles.burst(b.pos.x + fz * sx * 1.1, b.pos.y + 0.3, b.pos.z - fx * sx * 1.1, [[0.8, 0.9, 1], [1, 1, 1]], 5, 1.5);
  }
  if (moved > 0.08 && surf !== null && Math.random() < 0.4) g.particles.spawn(b.pos.x - fx * 1.4, b.pos.y + 0.3, b.pos.z - fz * 1.4, [0.9, 0.95, 1], (Math.random() - 0.5), 0.8, (Math.random() - 0.5), 0.6);
  // el jugador va sentado en la banca
  p.body.pos.x = b.pos.x; p.body.pos.z = b.pos.z; p.body.pos.y = b.pos.y + 0.25;
  p.body.vel.x = p.body.vel.y = p.body.vel.z = 0;
  p.body.onGround = true; p.body.fallStart = null;
  p.eyeHeight = 1.15;
  if (surf !== null) g.boatDist = (g.boatDist || 0) + moved;
  if ((g.boatDist || 0) > 200) g.achieve('bote', 'Navegante del Pacífico');
}

export const MAR = { pez: PEZ, delfin: DELFIN, ballena: BALLENA, tiburon: TIBURON, bote: BOTE };

// ---------- aparición en el mar y los ríos ----------
export function seaSpawn(E, g) {
  const w = g.world, pl = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 34;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  // columna de agua: desde la superficie hacia abajo
  let top = 110;
  while (top > 1 && !waterAt(w, x, top, z)) { if (w.getBlock(x, top, z) !== AIR) return false; top--; }
  if (top <= 1) return false;
  let bottom = top;
  while (bottom > 1 && waterAt(w, x, bottom - 1, z)) bottom--;
  const depth = top - bottom + 1;
  if (depth < 2) return false;
  const col = w.gen.column(x, z);
  const ocean = col.biome === 'ocean' || col.biome === 'beach';
  const count = (t) => E.mobs.filter((m) => m.type === t).length;
  const roll = Math.random();
  if (count('pez') < 18 && roll < 0.5) {
    const n = 3 + Math.floor(Math.random() * 4);
    const variant = ocean ? Math.floor(Math.random() * 4) : 4;
    const school = Math.random();
    for (let i = 0; i < n; i++) {
      const y = bottom + 0.3 + Math.random() * Math.max(0.5, depth - 1.5);
      const m = E.spawnMob('pez', x + 0.5 + (Math.random() - 0.5) * 2, y, z + 0.5 + (Math.random() - 0.5) * 2);
      m.data = { variant, school, leader: i === 0 };
    }
    return true;
  }
  if (!ocean || depth < 6) return false;
  const night = g.daylight < 0.35;
  if (count('delfin') < 5 && roll < 0.62) {
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) E.spawnMob('delfin', x + 0.5 + i, top - 1.5, z + 0.5 + i * 0.5);
    return true;
  }
  if (count('tiburon') < 2 && roll < (night ? 0.75 : 0.68) && depth >= 8) { E.spawnMob('tiburon', x + 0.5, bottom + 2, z + 0.5); return true; }
  if (count('ballena') < 1 && roll > 0.97 && depth >= 12 && r > 26) { E.spawnMob('ballena', x + 0.5, top - 4, z + 0.5); return true; }
  return false;
}

// ---------- pesca ----------
// tabla: agua salada o dulce; el clima lluvioso pica más
export function fishLoot(salt) {
  const r = Math.random();
  if (r < 0.03) return { id: 369, n: 1, msg: '¡Una perla!' };
  if (r < 0.05) return { id: 259, n: 1 + Math.floor(Math.random() * 2), msg: '¡Oro de un naufragio!' };
  if (r < 0.12) return { id: 368, n: 1, msg: 'Una bota vieja… 🙄' };
  if (r < 0.15) return { id: 256, n: 2, msg: 'Palitos' };
  if (r < 0.17) return { id: 444, n: 1, msg: '¡Una botella con un mapa adentro!' };
  if (salt) return r < 0.25 ? { id: FISH.dorado, n: 1, msg: '¡Un dorado!' } : r < 0.6 ? { id: FISH.pargo, n: 1 } : { id: FISH.corvina, n: 1 };
  return r < 0.75 ? { id: FISH.guapote, n: 1 } : { id: FISH.corvina, n: 1 };
}

// Boya de la caña: la maneja el juego (game.fishing).
export class Bobber {
  constructor(g, x, y, z, vx, vy, vz) {
    this.g = g;
    this.pos = { x, y, z };
    this.vel = { x: vx, y: vy, z: vz };
    this.state = 'air';
    this.t = 0;
    this.mesh = new THREE.Group();
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), new THREE.MeshBasicMaterial({ color: 0xd82020 }));
    const white = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), new THREE.MeshBasicMaterial({ color: 0xf4f4f4 }));
    red.position.y = 0.1; white.position.y = 0;
    this.mesh.add(red, white);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3 * 12), 3));
    this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe8e8e0 }));
    this.line.frustumCulled = false;
    g.scene.add(this.mesh, this.line);
  }

  update(dt, tip) {
    const g = this.g, w = g.world, p = this.pos, v = this.vel;
    this.t += dt;
    if (this.state === 'air') {
      v.y -= 18 * dt;
      p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
      if (waterAt(w, p.x, p.y, p.z)) {
        this.state = 'wait';
        this.salt = ['ocean', 'beach'].includes(w.gen.column(Math.floor(p.x), Math.floor(p.z)).biome);
        this.surface = surfaceAbove(w, p.x, p.y, p.z) - 0.12;
        const rain = g.weather ? g.weather.intensity : 0;
        this.biteAt = this.t + (4 + Math.random() * 14) * (1 - rain * 0.4) * mult.mordida(g);
        alCaerAgua(g, this); // v12.7.0 (C5-A1): la zona, la caña y la carnada (pesca.js)
        g.audio.play('pez', { pos: p, vol: 0.4 });
        g.particles.burst(p.x, this.surface, p.z, [[0.8, 0.9, 1]], 8, 1.5);
      } else if (w.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) !== AIR) { this.state = 'ground'; }
    } else if (this.state === 'wait' || this.state === 'bite') {
      const target = this.surface + (this.state === 'bite' ? -0.3 : Math.sin(this.t * 2) * 0.03);
      p.y += (target - p.y) * Math.min(1, dt * (this.state === 'bite' ? 18 : 4));
      // el pez se acerca: burbujitas
      if (this.state === 'wait' && this.biteAt - this.t < 1.6 && Math.random() < dt * 8) g.particles.spawn(p.x + (Math.random() - 0.5) * 1.2, this.surface, p.z + (Math.random() - 0.5) * 1.2, [0.85, 0.95, 1], 0, 0.6, 0, 0.4, 0);
      if (this.state === 'wait' && this.t >= this.biteAt) {
        this.state = 'bite'; this.biteEnd = this.t + (skillLv(g, 'pesca') >= 5 ? 2.3 : 1.3);
        g.audio.play('pez', { pos: p, vol: 0.8 });
        g.particles.burst(p.x, this.surface, p.z, [[0.8, 0.9, 1], [1, 1, 1]], 14, 2.5);
      } else if (this.state === 'bite' && this.t > this.biteEnd) {
        // se escapó: vuelve a esperar
        this.state = 'wait'; this.biteAt = this.t + 3 + Math.random() * 10;
      }
    }
    this.mesh.position.set(p.x, p.y, p.z);
    // cuerda con comba desde la punta de la caña
    const a = this.line.geometry.attributes.position;
    for (let i = 0; i < 12; i++) {
      const s = i / 11;
      const sag = Math.sin(s * Math.PI) * (this.state === 'bite' ? 0.05 : 0.5);
      a.setXYZ(i, tip.x + (p.x - tip.x) * s, tip.y + (p.y + 0.15 - tip.y) * s - sag, tip.z + (p.z - tip.z) * s);
    }
    a.needsUpdate = true;
  }

  remove() {
    this.g.scene.remove(this.mesh, this.line);
    this.line.geometry.dispose(); this.line.material.dispose();
    this.mesh.children.forEach((c) => { c.geometry.dispose(); c.material.dispose(); });
  }
}
