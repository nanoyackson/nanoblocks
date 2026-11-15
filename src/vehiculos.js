// El carro viejo de segunda: se compra en el taller, se pone en el suelo y se maneja (W acelera, S frena y da
// reversa, A/D giran, Espacio pita, Shift para bajarse). Gasta gasolina (un bidón lo llena) y sufre los huecos de
// la carretera: cada hueco lo sacude y le puede reventar una llanta; con llantas reventadas va despacito hasta que
// el mecánico o la llantera se las cambian. Va mejor sobre el asfalto que por el monte.
import * as THREE from 'three';
import { armarCarro } from './modelos-vehiculos.js';
import { BLOCKS, BLOCK_BY_KEY as K, AIR } from './blocks.js';
import { tintModel } from './models.js';

export const CARRO_ITEM = 414;
const ROAD = new Set(['asfalto', 'asfalto_linea', 'asfalto_parche', 'concreto', 'acera', 'smooth_stone', 'gravel', 'cobble'].map((k) => K[k]).filter(Boolean));
const HOLE = new Set([AIR, K.water, K.fondo_hueco, K.asfalto_roto, K.lodo].filter((x) => x !== undefined));
const COLORS = [['#b8202a', '#c83038', '#a01820'], ['#2a5ab8', '#3a6ac8', '#1a4aa0'], ['#e8e0c8', '#f4ecd8', '#d8d0b8'], ['#2a7a3a', '#3a8a4a', '#1a6a2a'], ['#c8a020', '#d8b030', '#b89010']];

export const CARRO = {
  name: 'Carro viejo', w: 1.7, h: 1.5, health: 20, speed: 0, vehicle: true, hurtSound: 'hueco', idleSound: null,
  particle: [[0.6, 0.6, 0.62], [0.3, 0.3, 0.32]], drops: [],
  build() { const c = COLORS[Math.floor(Math.random() * COLORS.length)]; return armarCarro(new THREE.Color(c[1]).getHex()); },
  update(m, dt) {
    const g = m.game, b = m.body, u = m.group.userData;
    m.hurtT = Math.max(0, m.hurtT - dt);
    m.data.fuel ??= 60;
    m.data.llantas ??= 4;
    if (!(m.data.ridden && g.riding === m)) {
      m.data.ridden = false; m.data.v = 0;
      b.vel.x *= Math.pow(0.02, dt); b.vel.z *= Math.pow(0.02, dt);
      b.step(g.world, dt);
    }
    m.data.spin = (m.data.spin || 0) + (m.data.v || 0) * dt * 3.2;
    u.wheels.forEach((w, i) => { w.rotation.x = m.data.spin; if (i < 2) w.rotation.y = (m.data.steer || 0) * 0.45; });
    // con una llanta reventada se ladea
    u.body.rotation.z = (4 - m.data.llantas) * 0.03;
    u.body.position.y = m.data.bumpT > 0 ? Math.sin(m.data.bumpT * 30) * 0.05 : 0;
    m.data.bumpT = Math.max(0, (m.data.bumpT || 0) - dt);
    m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
    m.group.rotation.y = m.yaw;
    tintModel(m.group, m.lightLevel(), m.hurtT > 0 ? 0.5 : 0);
  },
  onHurt(m, g) {
    // a golpes se desarma y vuelve a ser el ítem (con lo que tenga de gasolina y llantas)
    m.data.hits = (m.data.hits || 0) + 1;
    m.hurtT = 0.3;
    g.audio.play('hueco', { pos: m.soundPos(), vol: 0.7 });
    if (m.data.hits >= 4) {
      if (g.riding === m) g.dismount();
      m.dead = true;
      g.entities.dropItem(CARRO_ITEM, 1, m.body.pos.x, m.body.pos.y + 0.8, m.body.pos.z);
    }
    return false;
  },
  interact(m, g, held) {
    if (g.riding) return false;
    if (held && held.id === 390) {
      m.data.fuel = 100;
      if (g.mode === 'survival') g.inventory.consumeHeld(1);
      g.audio.play('balde', { pos: m.soundPos(), vol: 0.6 });
      g.ui.toast('⛽ Tanque lleno. (El bidón salió de la refinería que no refina… misterio)', 2400);
      return true;
    }
    g.riding = m;
    m.data.ridden = true;
    g.player.flying = false;
    g.audio.play('carro.arranque', { pos: m.soundPos(), vol: 0.8 });
    g.ui.toast(`🚗 W/S acelera y frena · A/D gira · Espacio pita · Shift se baja · ⛽ ${Math.round(m.data.fuel ?? 60)} % · llantas ${m.data.llantas ?? 4}/4`, 3600);
    g.achieve('carro', 'Carro de segunda');
    return true;
  },
};

function blockUnder(w, x, y, z) { return w.getBlock(Math.floor(x), Math.floor(y - 0.4), Math.floor(z)); }

export function carRide(g, m, dt, input) {
  const p = g.player, b = m.body, w = g.world, d = m.data;
  if (input.sneak) { d.v = 0; g.audio.setEmitter('carro', 'loop.motor', null); g.dismount(); return; }
  d.fuel ??= 60; d.llantas ??= 4; d.v ??= 0;
  const under = blockUnder(w, b.pos.x, b.pos.y, b.pos.z);
  const onRoad = ROAD.has(under);
  const sinGas = d.fuel <= 0;
  const maxV = sinGas ? 0 : (onRoad ? 15 : 7) * (d.llantas >= 4 ? 1 : d.llantas <= 0 ? 0.2 : 0.4 + d.llantas * 0.12);
  const throttle = input.forward ? 1 : input.back ? -1 : 0;
  if (throttle > 0) d.v = Math.min(maxV, d.v + 7 * dt);
  else if (throttle < 0) d.v = d.v > 0.5 ? d.v - 16 * dt : Math.max(-maxV * 0.4, d.v - 5 * dt);
  else d.v *= Math.pow(onRoad ? 0.5 : 0.25, dt);
  if (Math.abs(d.v) > maxV + 0.1) d.v *= Math.pow(0.2, dt);
  if (sinGas && !d.toldGas) { d.toldGas = true; g.ui.toast('⛽ Se quedó sin gasolina. Un bidón de la bomba lo arregla', 2600); }
  if (!sinGas) d.toldGas = false;
  // dirección: gira más mientras más rápido va (y al revés en reversa)
  d.steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  m.yaw += d.steer * Math.min(1, Math.abs(d.v) / 4) * Math.sign(d.v || 1) * 1.9 * dt;
  const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
  b.vel.x = fx * d.v; b.vel.z = fz * d.v;
  const bx = b.pos.x, bz = b.pos.z;
  b.step(w, dt);
  if (b.hitWall) {
    // sube un escalón de un bloque; si es pared, choca
    const ax = Math.floor(b.pos.x + fx * 1.4), az = Math.floor(b.pos.z + fz * 1.4), ay = Math.floor(b.pos.y);
    if (b.onGround && !BLOCKS[w.getBlock(ax, ay + 1, az)].solid && !BLOCKS[w.getBlock(ax, ay + 2, az)].solid) b.pos.y += 1.05;
    else if (Math.abs(d.v) > 3) { g.audio.play('hueco', { pos: b.pos, vol: 0.9, pitch: 0.7 }); g.shake = Math.max(g.shake || 0, 0.5); if (Math.abs(d.v) > 10) g.damagePlayer(2, null, null, 'Se estrelló con el carro', true); d.v *= -0.25; }
  }
  const moved = Math.hypot(b.pos.x - bx, b.pos.z - bz);
  d.fuel = Math.max(0, d.fuel - moved / 35);
  // los huecos: alguna de las cuatro llantas cae en uno
  d.holeCd = Math.max(0, (d.holeCd || 0) - dt);
  if (b.onGround && Math.abs(d.v) > 3 && d.holeCd <= 0) {
    const rx = fz, rz = -fx;
    for (const [sf, sr] of [[1.05, -0.86], [1.05, 0.86], [-1.1, -0.86], [-1.1, 0.86]]) {
      const wx = b.pos.x + fx * sf + rx * sr, wz = b.pos.z + fz * sf + rz * sr;
      const id = blockUnder(w, wx, b.pos.y, wz);
      if (!HOLE.has(id)) continue;
      // un hueco de verdad: alrededor hay calle
      const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oz]) => ROAD.has(blockUnder(w, wx + ox, b.pos.y, wz + oz)));
      if (!around) continue;
      d.holeCd = 0.5; d.bumpT = 0.35;
      b.vel.y = 2.5 + Math.abs(d.v) * 0.18;
      g.shake = Math.max(g.shake || 0, 0.25 + Math.abs(d.v) * 0.03);
      g.audio.play('hueco', { pos: b.pos, vol: 0.9 });
      g.meta.huecos = (g.meta.huecos || 0) + 1;
      if (g.meta.huecos === 1) g.ui.toast('💥 ¡PLOP! Cayó en un hueco', 1400);
      if (g.meta.huecos >= 25) g.achieve('huecos', 'Doctorado en huecos');
      if (d.llantas > 0 && Math.random() < 0.06 + Math.abs(d.v) * 0.012) {
        d.llantas--;
        g.audio.play('llanta', { pos: b.pos, vol: 1 });
        g.ui.toast(d.llantas > 0 ? `💨 ¡Se le reventó una llanta! Le quedan ${d.llantas}. El mecánico o la llantera se la cambian` : '💨 Va en puros rines… busque una llantera', 3000);
        g.achieve('llanta', 'Llanta reventada');
      }
      break;
    }
  }
  if (input.jump && (g.clock || 0) > (d.pitoCd || 0)) { d.pitoCd = (g.clock || 0) + 0.6; g.audio.play('pito', { pos: b.pos, vol: 0.9 }); }
  g.audio.setEmitter('carro', 'loop.motor', sinGas ? null : { x: b.pos.x, y: b.pos.y + 0.6, z: b.pos.z }, 0.25 + Math.min(0.4, Math.abs(d.v) / 30));
  if (moved > 0) g.carDist = (g.carDist || 0) + moved;
  if ((g.carDist || 0) > 500) g.achieve('carretera', 'De paseo por la carretera');
  // el jugador va sentado adentro
  p.body.pos.x = b.pos.x - fx * 0.2; p.body.pos.z = b.pos.z - fz * 0.2; p.body.pos.y = b.pos.y + 0.55;
  p.body.vel.x = p.body.vel.y = p.body.vel.z = 0;
  p.body.onGround = true; p.body.fallStart = null;
  p.eyeHeight = 0.6; // v13.2.4: los ojos de una persona sentada, DENTRO de la cabina (antes 1.2: por encima del techo, que tapaba media pantalla)
}

// el mecánico o la llantera: cambia las llantas reventadas del carro que esté cerca (10 colones cada una)
export function repairCar(g) {
  const p = g.player.body.pos;
  const car = g.entities.mobs.find((m) => m.type === 'carro' && !m.dead && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 14);
  if (!car) return null;
  const malas = 4 - (car.data.llantas ?? 4);
  if (malas <= 0) return 'Ese carro está bien de llantas. ¡Pero cuidado con los huecos!';
  const cost = malas * 10;
  if (g.inventory.count(360) < cost) return `Son ${cost} colones por ${malas} llanta${malas > 1 ? 's' : ''}. Vuelva cuando tenga la platita.`;
  g.inventory.remove(360, cost);
  car.data.llantas = 4;
  g.audio.play('monedas', { ui: true, vol: 0.5 });
  g.achieve('llantera', 'Cliente de la llantera');
  return `Listo, ${malas} llanta${malas > 1 ? 's' : ''} nueva${malas > 1 ? 's' : ''}: ${cost} colones. Con tanto hueco, nos vemos la otra semana.`;
}
