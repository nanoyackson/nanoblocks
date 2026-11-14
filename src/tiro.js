// Tiro al blanco en el turno y la feria: con la honda (o la cerbatana) en la mano, clic derecho al feriante (2 colones,
// incluye 12 piedras). Salen seis patitos amarillos que pasan de lado a lado sobre una tablita; 30 segundos para
// botar los que pueda. Premios según cuántos: peluche de perezoso (6), copo (4-5), chicharrón (2-3).
import { armarPatito } from './modelos-cosas.js';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { decir } from './misiones.js';

export const PELUCHE = 486;
const COLON = 360, HONDA = 432, CERBATANA = 433, DUR = 30, N = 6;

export const PATITO = {
  name: 'Patito del tiro al blanco', w: 0.45, h: 0.45, health: 1, speed: 0, hurtSound: null, idleSound: null, noJump: true,
  particle: [[1, 0.85, 0.2], [1, 1, 1]], drops: [],
  build() { return armarPatito(); },
  update(m, dt) {
    const T = m.game.tiro, d = m.data, u = m.group.userData;
    if (!T || d.caido) {
      // al caer gira hacia atrás y desaparece
      d.caidoT = (d.caidoT || 0) + dt;
      u.body.rotation.x = -Math.min(Math.PI / 2, d.caidoT * 8);
      if (d.caidoT > 0.5 || !T) m.dead = true;
    } else {
      // va de un lado a otro sobre la tablita, con un saltito
      d.f = (d.f + dt * d.vel) % 2;
      const k = d.f < 1 ? d.f : 2 - d.f;
      const x = T.x0 + T.ax * (k - 0.5) * T.ancho, z = T.z0 + T.az * (k - 0.5) * T.ancho;
      m.body.pos.x = x; m.body.pos.z = z; m.body.pos.y = T.y + d.fila * 0.9 + Math.abs(Math.sin(m.t * 6)) * 0.06;
      m.yaw = T.yaw + (d.f < 1 ? 0 : Math.PI);
    }
    m.group.position.set(m.body.pos.x, m.body.pos.y, m.body.pos.z);
    m.group.rotation.y = m.yaw;
  },
  onHurt(m, g) {
    if (m.data.caido || !g.tiro) return false;
    m.data.caido = true;
    g.tiro.puntos++;
    g.audio.play('click', { pos: m.soundPos(), vol: 1, pitch: 1.8 });
    g.particles.burst(m.body.pos.x, m.body.pos.y + 0.3, m.body.pos.z, [[1, 0.85, 0.2], [1, 1, 1]], 12, 2);
    g.ui.toast(`🦆 ¡Le dio! ${g.tiro.puntos} de ${N}`, 900);
    return false;
  },
};

export function tiroInteract(m, g) {
  const held = g.inventory.held;
  if (m.data.role !== 'feriante' || !held || (held.id !== HONDA && held.id !== CERBATANA)) return false;
  if (g.tiro) { decir(g, m, '¡Apúrese, que se acaba el tiempo!', 2); return true; }
  if (g.mode === 'survival') {
    if (g.inventory.count(COLON) < 2) { decir(g, m, 'El tiro al blanco vale 2 colones, con 12 piedras incluidas. ¡Bote los seis patitos y se lleva el peluche!', 4); return true; }
    g.inventory.remove(COLON, 2);
    g.giveItem(held.id === HONDA ? K.cobble : 434, 12);
  }
  // la tablita con los patitos, a 7 bloques enfrente del jugador
  const p = g.player.body.pos, yaw = g.player.yaw;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const T = { x0: p.x + fx * 7, z0: p.z + fz * 7, y: p.y + 1, ax: fz, az: -fx, ancho: 5, yaw: Math.atan2(fx, fz), fin: (g.clock || 0) + DUR, puntos: 0, patos: [] };
  g.tiro = T;
  for (let i = 0; i < N; i++) {
    const pt = g.entities.spawnMob('patito', T.x0, T.y, T.z0);
    pt.data = { f: i / N * 2, vel: 0.35 + (i % 2) * 0.15, fila: i % 2 };
    T.patos.push(pt);
  }
  decir(g, m, '¡Listo! Tiene 30 segundos. ¡Apunte bien!', 3);
  g.audio.play('silbato', { ui: true, vol: 0.5 });
  g.achieve('tiro_blanco', 'Tiro al blanco');
  return true;
}

export function tickTiro(g) {
  const T = g.tiro;
  if (!T) return;
  const seg = Math.max(0, Math.ceil(T.fin - (g.clock || 0)));
  let el = document.getElementById('tiro');
  if (!el) { el = document.createElement('div'); el.id = 'tiro'; document.getElementById('hud').appendChild(el); }
  const txt = `🦆 ${T.puntos}/${N} · ⏱ ${seg} s`;
  if (el.textContent !== txt) el.textContent = txt;
  if (T.puntos < N && seg > 0) return;
  // premios
  let premio = null;
  if (T.puntos >= N) { premio = [PELUCHE, 1, '¡el peluche de perezoso!']; g.achieve('tiro_perfecto', 'Puntería de feria'); }
  else if (T.puntos >= 4) premio = [409, 1, 'un chocolate'];
  else if (T.puntos >= 2) premio = [397, 1, 'un chicharrón'];
  if (premio) g.giveItem(premio[0], premio[1]);
  g.ui.toast(premio ? `🎯 Botó ${T.puntos} patitos: se lleva ${premio[2]}` : `🎯 Botó ${T.puntos}… ¡casi! Otra vez será`, 3200);
  if (premio && T.puntos >= N) g.audio.play('aplausos', { ui: true, vol: 0.5 });
  g.tiro = null;
  el.remove();
}
export function limpiarTiro(g) { g.tiro = null; const el = document.getElementById('tiro'); if (el) el.remove(); }
