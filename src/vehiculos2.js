// Dos ruedas: la bicicleta (sin gasolina, cansa un poco, en barro y arena va lentísima) y la moto (con gasolina,
// la más rápida en calle; en un hueco a toda velocidad lo bota). Se montan con clic derecho y se bajan con Shift.
import * as THREE from 'three';
import { cuadroBici, cuadroMoto, ruedaFina } from './modelos-vehiculos.js';
import { BLOCK_BY_KEY as K, BLOCKS, AIR } from './blocks.js';
import { tintModel } from './models.js';

export const BICI = 455, MOTO = 456;
const CALLE = new Set(['asfalto', 'asfalto_linea', 'asfalto_parche', 'concreto', 'acera', 'smooth_stone', 'cobble', 'baldosa_roja'].map((k) => K[k]).filter(Boolean));
const BLANDO = new Set(['sand', 'lodo', 'red_sand', 'snow', 'gravel'].map((k) => K[k]).filter(Boolean));
const HUECO = new Set([K.fondo_hueco, K.asfalto_roto, K.lodo].filter(Boolean));
const debajo = (w, b) => w.getBlock(Math.floor(b.pos.x), Math.floor(b.pos.y - 0.4), Math.floor(b.pos.z));

function rueda(r, ancho, x, y, z) { return ruedaFina(r, ancho, x, y, z); }

function base(nombre, item, extra) {
  return {
    name: nombre, w: 0.6, h: 1.1, health: 10, speed: 0, vehicle: true, dosRuedas: true, hurtSound: 'hueco', idleSound: null,
    particle: [[0.5, 0.5, 0.52]], drops: [],
    update(m, dt) {
      const g = m.game, b = m.body, u = m.group.userData;
      m.hurtT = Math.max(0, m.hurtT - dt);
      if (!(m.data.ridden && g.riding === m)) { m.data.ridden = false; m.data.v = 0; b.vel.x *= Math.pow(0.02, dt); b.vel.z *= Math.pow(0.02, dt); b.step(g.world, dt); }
      m.data.spin = (m.data.spin || 0) + (m.data.v || 0) * dt * 4;
      // las llantas son cubos: girarlas se ve raro, así que solo los rayos dan vueltas
      u.wheels.forEach((w) => { if (w.userData.rayos) w.userData.rayos.rotation.x = m.data.spin; });
      // inclinación al doblar (y parada de lado si nadie la usa)
      const lean = m.data.ridden ? -(m.data.steer || 0) * Math.min(0.35, Math.abs(m.data.v || 0) * 0.03) : 0.1;
      u.body.rotation.z += (lean - u.body.rotation.z) * Math.min(1, dt * 6);
      if (u.pedales) u.pedales.rotation.x = m.data.spin * 0.6;
      m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
      m.group.rotation.y = m.yaw;
      tintModel(m.group, m.lightLevel(), m.hurtT > 0 ? 0.5 : 0);
    },
    onHurt(m, g) {
      m.data.hits = (m.data.hits || 0) + 1; m.hurtT = 0.3;
      g.audio.play('hueco', { pos: m.soundPos(), vol: 0.5, pitch: 1.4 });
      if (m.data.hits >= 3) { if (g.riding === m) g.dismount(); m.dead = true; g.entities.dropItem(item, 1, m.body.pos.x, m.body.pos.y + 0.6, m.body.pos.z); }
      return false;
    },
    interact(m, g, held) {
      if (g.riding) return false;
      if (extra.gas && held && held.id === 390) { m.data.fuel = 100; if (g.mode === 'survival') g.inventory.consumeHeld(1); g.audio.play('balde', { pos: m.soundPos(), vol: 0.6 }); g.ui.toast('⛽ Tanque lleno', 1400); return true; }
      g.riding = m; m.data.ridden = true; g.player.flying = false;
      if (extra.gas) g.audio.play('carro.arranque', { pos: m.soundPos(), vol: 0.6 });
      g.ui.toast(`${extra.icono} W pedalea/acelera · S frena · A/D gira · Espacio ${extra.gas ? 'pita' : 'timbre'} · Shift se baja${extra.gas ? ` · ⛽ ${Math.round(m.data.fuel ?? 60)} %` : ''}`, 3200);
      g.achieve(extra.logro[0], extra.logro[1]);
      return true;
    },
    ride(g, m, dt, input) { montar(g, m, dt, input, extra); },
    ...extra.kind,
  };
}

function montar(g, m, dt, input, cfg) {
  const p = g.player, b = m.body, w = g.world, d = m.data;
  if (input.sneak) { d.v = 0; if (cfg.gas) g.audio.setEmitter('moto', 'loop.motor', null); g.dismount(); return; }
  d.v ??= 0; if (cfg.gas) d.fuel ??= 60;
  const suelo = debajo(w, b);
  const sinGas = cfg.gas && d.fuel <= 0;
  const maxV = sinGas ? 0 : CALLE.has(suelo) ? cfg.calle : BLANDO.has(suelo) ? cfg.blando : cfg.monte;
  if (input.forward) d.v = Math.min(maxV, d.v + cfg.accel * dt);
  else if (input.back) d.v = Math.max(-1.5, d.v - 14 * dt);
  else d.v *= Math.pow(0.35, dt);
  if (d.v > maxV + 0.1) d.v -= Math.min(d.v - maxV, 10 * dt);
  // pedalear cansa (da hambre); la moto gasta gasolina
  if (!cfg.gas && input.forward) p.hungerT += dt * 1.6;
  d.steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  m.yaw += d.steer * Math.min(1, Math.abs(d.v) / 3 + 0.3) * cfg.giro * dt;
  const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
  b.vel.x = fx * d.v; b.vel.z = fz * d.v;
  const bx = b.pos.x, bz = b.pos.z;
  b.step(w, dt);
  if (b.hitWall) {
    const ax = Math.floor(b.pos.x + fx * 0.9), az = Math.floor(b.pos.z + fz * 0.9), ay = Math.floor(b.pos.y);
    if (b.onGround && !BLOCKS[w.getBlock(ax, ay + 1, az)].solid && !BLOCKS[w.getBlock(ax, ay + 2, az)].solid) b.pos.y += 1.05;
    else if (Math.abs(d.v) > 4) { g.audio.play('hueco', { pos: b.pos, vol: 0.8 }); g.shake = Math.max(g.shake || 0, 0.4); d.v *= -0.2; }
  }
  const moved = Math.hypot(b.pos.x - bx, b.pos.z - bz);
  if (cfg.gas) { d.fuel = Math.max(0, d.fuel - moved / 50); if (sinGas && !d.toldGas) { d.toldGas = true; g.ui.toast('⛽ La moto se quedó sin gasolina', 2000); } }
  // huecos: a buena velocidad, lo pueden botar
  d.holeCd = Math.max(0, (d.holeCd || 0) - dt);
  if (b.onGround && d.v > 5 && d.holeCd <= 0 && HUECO.has(suelo)) {
    d.holeCd = 0.6; b.vel.y = 3; g.audio.play('hueco', { pos: b.pos, vol: 0.8 }); g.shake = Math.max(g.shake || 0, 0.4);
    if (Math.random() < (cfg.gas ? 0.25 : 0.35)) {
      g.dismount(); p.body.vel.y = 5; p.body.vel.x = fx * d.v * 0.6; p.body.vel.z = fz * d.v * 0.6; d.v = 0;
      g.damagePlayer(cfg.gas ? 3 : 2, null, null, cfg.gas ? 'Se cayó de la moto' : 'Se cayó de la bici', true);
      g.ui.toast(cfg.gas ? '🏍 ¡Lo botó la moto en el hueco!' : '🚲 ¡Se fue de jupa! Maldito hueco', 2200);
      g.achieve('jupa', 'De jupa contra el suelo');
      return;
    }
  }
  if (input.jump && (g.clock || 0) > (d.pitoCd || 0)) { d.pitoCd = (g.clock || 0) + 0.5; g.audio.play(cfg.gas ? 'pito' : 'click', { pos: b.pos, vol: cfg.gas ? 0.8 : 0.9, pitch: cfg.gas ? 1.4 : 2.2 }); }
  if (cfg.gas) g.audio.setEmitter('moto', 'loop.motor', sinGas ? null : { x: b.pos.x, y: b.pos.y + 0.5, z: b.pos.z }, 0.2 + Math.min(0.35, Math.abs(d.v) / 40));
  g.dosRuedasDist = (g.dosRuedasDist || 0) + moved;
  if (g.dosRuedasDist > 1000) g.achieve('ruedas_1000', 'Mil bloques en dos ruedas');
  // el jugador va encima
  p.body.pos.x = b.pos.x - fx * 0.15; p.body.pos.z = b.pos.z - fz * 0.15; p.body.pos.y = b.pos.y + 0.55;
  p.body.vel.x = p.body.vel.y = p.body.vel.z = 0; p.body.onGround = true; p.body.fallStart = null;
  p.eyeHeight = 1.25;
}

export const DOS_RUEDAS = {
  bici: base('Bicicleta', BICI, {
    icono: '🚲', calle: 10, monte: 6, blando: 2.2, accel: 6, giro: 2.4, logro: ['bici', 'Pedaleando por Tiquicia'],
    kind: {
      build() {
        const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
        const C = [0xc82a2a, 0x2a6ac8, 0x2a9a4a, 0xe0b020][Math.floor(Math.random() * 4)];
        const wheels = [rueda(0.34, 0.06, 0, 0.34, 0.5), rueda(0.34, 0.06, 0, 0.34, -0.5)];
        wheels.forEach((w) => body.add(w));
        const ped = cuadroBici(body, C);
        g.userData = { body, wheels, pedales: ped };
        return g;
      },
    },
  }),
  moto: base('Moto', MOTO, {
    icono: '🏍', gas: true, calle: 21, monte: 9, blando: 4, accel: 9, giro: 2.1, logro: ['moto', 'Motorizado'],
    kind: {
      build() {
        const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
        const PAINT = [0xc83038, 0x2a2a30, 0x3a6ac8][Math.floor(Math.random() * 3)];
        const wheels = [rueda(0.36, 0.14, 0, 0.36, 0.62), rueda(0.36, 0.16, 0, 0.36, -0.6)];
        wheels.forEach((w) => body.add(w));
        cuadroMoto(body, PAINT);
        g.userData = { body, wheels };
        return g;
      },
    },
  }),
};

// poner la bici o la moto en el suelo
export function ponerDosRuedas(g, held, t) {
  const tipo = held.id === BICI ? 'bici' : held.id === MOTO ? 'moto' : null;
  if (!tipo) return false;
  if (!t || g.dim !== 'tierra' || g.world.getBlock(t.x, t.y + 1, t.z) !== AIR) { g.ui.toast('Se pone en el suelo', 1200); return true; }
  const m = g.entities.spawnMob(tipo, t.x + 0.5, t.y + 1.05, t.z + 0.5);
  m.tamed = true; m.yaw = g.player.yaw + Math.PI; if (tipo === 'moto') m.data.fuel = 50;
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.audio.play('dig.wood', { pos: { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 }, vol: 0.4, pitch: 1.4 });
  return true;
}
