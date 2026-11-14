// La avioneta: se pone en el suelo (mejor en un llano largo o en la pista del aeropuerto), clic derecho para subirse.
// W acelera, S baja el motor; la avioneta va hacia donde uno mira con el mouse (subir/bajar y doblar). Despega pasando
// cierta velocidad; si va muy despacio en el aire pierde sustentación y cae de trompa. Aterrizar suave o… ¡pum!
// Gasta gasolina (el bidón la llena). Shift para bajarse (en el aire, mejor no).
import { armarAvioneta } from './modelos-vehiculos.js';
import { influencerEvento } from './influencer.js';
import { BLOCKS, AIR } from './blocks.js';
import { tintModel } from './models.js';

export const AVIONETA_ITEM = 477;
const DESPEGUE = 13, MAXV = 32, PERDIDA = 9;

export const AVIONETA = {
  name: 'Avioneta', w: 1.4, h: 1.3, health: 30, speed: 0, vehicle: true, hurtSound: 'hueco', idleSound: null,
  particle: [[0.9, 0.9, 0.92], [0.8, 0.2, 0.2]], drops: [],
  build() { return armarAvioneta(); },
  update(m, dt) {
    const g = m.game, b = m.body, u = m.group.userData, d = m.data;
    m.hurtT = Math.max(0, m.hurtT - dt);
    if (!(d.ridden && g.riding === m)) {
      d.ridden = false; d.v = 0; d.motor = false;
      if (!d.volando) { b.vel.x *= Math.pow(0.05, dt); b.vel.z *= Math.pow(0.05, dt); }
      b.step(g.world, dt); d.roll = 0;
      // sin piloto en el aire: cae de trompa y se hace pedazos
      if (d.volando) { d.pitch = Math.max(-1.2, (d.pitch || 0) - dt); if (b.onGround) { const p = b.pos; g.particles.burst(p.x, p.y + 1, p.z, [[1, 0.6, 0.2], [0.3, 0.3, 0.32]], 60, 6); g.audio.play('explode', { pos: { x: p.x, y: p.y, z: p.z }, vol: 1 }); m.dead = true; g.entities.dropItem(258, 2, p.x, p.y + 1, p.z); g.ui.toast('💥 La avioneta sin piloto se estrelló', 2200); } }
      else d.pitch = 0;
    }
    d.giroHelice = (d.giroHelice || 0) + ((d.motor ? 42 : (d.v || 0) * 0.5) - (d.giroHelice || 0)) * Math.min(1, dt * 1.6);
    u.helice.rotation.z += dt * d.giroHelice;
    u.body.rotation.x = -(d.pitch || 0);
    u.body.rotation.z = d.roll || 0;
    m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
    m.group.rotation.y = m.yaw;
    tintModel(m.group, m.lightLevel(), m.hurtT > 0 ? 0.5 : 0);
  },
  onHurt(m, g) {
    m.data.hits = (m.data.hits || 0) + 1; m.hurtT = 0.3;
    g.audio.play('hueco', { pos: m.soundPos(), vol: 0.6, pitch: 1.2 });
    if (m.data.hits >= 4 && g.riding !== m) { m.dead = true; g.entities.dropItem(AVIONETA_ITEM, 1, m.body.pos.x, m.body.pos.y + 1, m.body.pos.z); }
    return false;
  },
  interact(m, g, held) {
    if (g.riding) return false;
    if (held && held.id === 390) { m.data.fuel = 100; if (g.mode === 'survival') g.inventory.consumeHeld(1); g.audio.play('balde', { pos: m.soundPos(), vol: 0.6 }); g.ui.toast('⛽ Tanque de la avioneta lleno', 1400); return true; }
    g.riding = m; m.data.ridden = true; g.player.flying = false;
    m.data.fuel ??= 60;
    g.player.yaw = m.yaw + Math.PI; g.player.pitch = 0;
    g.audio.play('carro.arranque', { pos: m.soundPos(), vol: 0.7, pitch: 0.8 });
    g.ui.toast(`✈ W acelera · S baja el motor · el mouse apunta (arriba/abajo y doblar) · despega a buena velocidad · Shift se baja · ⛽ ${Math.round(m.data.fuel)} %`, 4200);
    g.achieve('avioneta', 'Piloto de avioneta');
    return true;
  },
  ride(g, m, dt, input) { volar(g, m, dt, input); },
};

function volar(g, m, dt, input) {
  const p = g.player, b = m.body, w = g.world, d = m.data;
  d.v ??= 0; d.fuel ??= 60; if (!Number.isFinite(d.roll)) d.roll = 0; if (!Number.isFinite(d.pitch)) d.pitch = 0;
  const enAire = !b.onGround;
  const shift = input.sneak && !d.shiftPrev;
  d.shiftPrev = input.sneak;
  const ahora = g.clock || 0;
  if (shift) {
    if (enAire && d.v > 6 && !(d.confirma > ahora)) { d.confirma = ahora + 2.5; g.ui.toast('¡Está volando! Aterrice primero (o presione Shift otra vez para tirarse… ¿trae parapente?)', 2400); }
    else { d.motor = false; d.confirma = 0; g.audio.setEmitter('avioneta', 'loop.motor', null); g.dismount(); if (enAire) g.achieve('avion_salto', 'Me tiré de la avioneta'); return; }
  }
  const sinGas = d.fuel <= 0;
  d.motor = !sinGas && (input.forward || d.v > 2);
  if (input.forward && !sinGas) d.v = Math.min(MAXV, d.v + (enAire ? 7 : 5) * dt);
  else if (input.back) d.v = Math.max(0, d.v - (enAire ? 6 : 14) * dt);
  else if (!enAire) d.v *= Math.pow(0.5, dt);
  if (sinGas && enAire) d.v = Math.max(PERDIDA - 1, d.v - 2 * dt);
  // la dirección: hacia donde mira el piloto
  let dy = (p.yaw + Math.PI) - m.yaw;
  while (dy > Math.PI) dy -= Math.PI * 2;
  while (dy < -Math.PI) dy += Math.PI * 2;
  const giro = enAire ? 1.6 : 1.2;
  m.yaw += Math.max(-giro * dt, Math.min(giro * dt, dy * dt * 3));
  // se ladea según qué tan rápido dobla (como un avión de verdad)
  const giroVel = (m.yaw - (d.yawPrev ?? m.yaw)) / Math.max(dt, 1e-4);
  d.yawPrev = m.yaw;
  d.roll += ((enAire ? -giroVel * 0.42 : 0) - d.roll) * Math.min(1, dt * 3.5);
  d.roll = Math.max(-0.7, Math.min(0.7, d.roll));
  const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
  // cabeceo: con la vista (solo si va rápido), y si pierde sustentación se va de trompa
  const sustenta = d.v >= DESPEGUE || (enAire && d.v >= PERDIDA);
  let pitchMeta = sustenta ? Math.max(-0.6, Math.min(0.55, p.pitch)) : enAire ? -0.5 : 0;
  if (!enAire && pitchMeta < 0) pitchMeta = 0;
  d.pitch = (d.pitch || 0) + (pitchMeta - (d.pitch || 0)) * Math.min(1, dt * 2.5);
  const vy0 = b.vel.y;
  b.vel.x = fx * d.v * Math.cos(d.pitch); b.vel.z = fz * d.v * Math.cos(d.pitch);
  if (sustenta) b.vel.y = Math.sin(d.pitch) * d.v;
  else b.vel.y = vy0 - 18 * dt;
  if (d.volando && !sustenta && !d.avisoPerdida) { d.avisoPerdida = true; g.ui.toast('⚠ ¡Pérdida de sustentación! Acelere y baje la trompa', 2000); g.audio.play('click', { ui: true, vol: 0.8, pitch: 0.5 }); }
  if (sustenta) d.avisoPerdida = false;
  const vyAntes = b.vel.y, vAntes = d.v;
  const bx = b.pos.x, bz = b.pos.z;
  b.step(w, dt, { flying: sustenta && enAire });
  const moved = Math.hypot(b.pos.x - bx, b.pos.z - bz);
  d.fuel = Math.max(0, d.fuel - moved / 60);
  if (sinGas && !d.toldGas) { d.toldGas = true; g.ui.toast('⛽ ¡La avioneta se quedó sin gasolina! A planear…', 2400); }
  // despegue y aterrizaje
  let alto = 0;
  if (enAire) { const fx0 = Math.floor(b.pos.x), fz0 = Math.floor(b.pos.z); let yy = Math.floor(b.pos.y); while (alto < 6 && yy > 1 && !BLOCKS[w.getBlock(fx0, yy - 1, fz0)].solid) { yy--; alto++; } }
  if (enAire && !d.volando && alto >= 3) { d.volando = true; d.despegueX = b.pos.x; d.despegueZ = b.pos.z; g.ui.toast('✈ ¡Despegó!', 1400); g.achieve('despegue', 'Despegue'); influencerEvento(g, 'despegue en avioneta', 30000); }
  // «bloqueado»: chocó de frente (avanzó mucho menos de lo que debía)
  const bloqueado = b.hitWall && moved < vAntes * dt * Math.cos(d.pitch || 0) * 0.4;
  if (b.onGround && d.volando) {
    d.volando = false;
    if (vyAntes < -9 || (bloqueado && vAntes > 12)) return estrellarse(g, m);
    const dist = Math.hypot(b.pos.x - d.despegueX, b.pos.z - d.despegueZ);
    g.ui.toast(`🛬 ¡Aterrizaje! Voló ${Math.round(dist)} bloques`, 2000);
    g.achieve('aterrizaje', 'Aterricé sin un rasguño');
    influencerEvento(g, 'aterrizaje', 15000);
    if (dist > 1000) g.achieve('avion_1000', 'Vuelo largo');
  }
  // chocar de frente a buena velocidad
  if (bloqueado && vAntes > 12) return estrellarse(g, m);
  if (b.hitWall && !enAire) {
    const ax = Math.floor(b.pos.x + fx * 1.2), az = Math.floor(b.pos.z + fz * 1.2), ay = Math.floor(b.pos.y);
    if (!BLOCKS[w.getBlock(ax, ay + 1, az)].solid && w.getBlock(ax, ay + 2, az) === AIR) b.pos.y += 1.05;
    else d.v = 0;
  }
  if (b.pos.y > 200) { b.pos.y = 200; if (b.vel.y > 0) b.vel.y = 0; }
  g.audio.setEmitter('avioneta', 'loop.motor', d.motor ? { x: b.pos.x, y: b.pos.y + 1, z: b.pos.z } : null, 0.25 + Math.min(0.45, d.v / 50));
  // el piloto va en la cabina
  p.body.pos.x = b.pos.x + fx * 0.4; p.body.pos.z = b.pos.z + fz * 0.4; p.body.pos.y = b.pos.y + 0.45;
  p.body.vel.x = p.body.vel.y = p.body.vel.z = 0; p.body.onGround = true; p.body.fallStart = null;
  p.eyeHeight = 1.15;
  if (enAire && b.pos.y - w.gen.column(Math.floor(b.pos.x), Math.floor(b.pos.z)).h > 60) g.achieve('avion_alto', 'Sobre las nubes');
}

function estrellarse(g, m) {
  const b = m.body.pos;
  g.audio.setEmitter('avioneta', 'loop.motor', null);
  g.dismount();
  g.particles.burst(b.x, b.y + 1, b.z, [[1, 0.6, 0.2], [0.3, 0.3, 0.32], [0.9, 0.9, 0.92]], 70, 7);
  g.audio.play('explode', { pos: { x: b.x, y: b.y, z: b.z }, vol: 1 });
  g.shake = Math.max(g.shake || 0, 1);
  g.damagePlayer(9, b.x, b.z, 'Se estrelló en avioneta', true);
  g.player.body.vel.y = 6;
  m.dead = true;
  for (let k = 0; k < 4; k++) g.entities.dropItem([258, 258, 9, 26][k], 1 + Math.floor(Math.random() * 2), b.x, b.y + 1, b.z);
  g.ui.toast('💥 ¡Se estrelló! La avioneta quedó hecha chatarra (algo se puede recoger)', 3000);
  g.achieve('avion_choque', 'Aterrizaje forzoso');
  influencerEvento(g, '¡SE ESTRELLÓ!', 60000);
}

export function ponerAvioneta(g, held, t) {
  if (held.id !== AVIONETA_ITEM) return false;
  if (!t || g.dim !== 'tierra' || g.world.getBlock(t.x, t.y + 1, t.z) !== AIR || g.world.getBlock(t.x, t.y + 2, t.z) !== AIR) { g.ui.toast('La avioneta se pone en el suelo, en un lugar abierto', 1600); return true; }
  const m = g.entities.spawnMob('avioneta', t.x + 0.5, t.y + 1.05, t.z + 0.5);
  m.tamed = true; m.yaw = g.player.yaw + Math.PI; m.data.fuel = 60;
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.audio.play('dig.wood', { pos: { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 }, vol: 0.5, pitch: 0.8 });
  g.ui.toast('✈ Avioneta lista. Clic derecho para subirse (necesita pista: un llano largo)', 2600);
  return true;
}
