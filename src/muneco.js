// El muñeco de práctica (v8.1): un saco relleno de zacate en un palo. Se pone en el suelo (clic derecho con él en la mano) y aguanta
// todo: sirve para practicar la cadena de golpes, ver cuánto pega cada arma y probar las debilidades. Clic derecho le cambia el
// «material» (tela de Sombra, caparazón, cuero, escama, piedra o nada), así uno ve el «¡Débil!» y el «Resiste» de cada arma.
// Cada 3 segundos de pelea dice el daño por segundo. Agachado + clic derecho se recoge. Ítem 559; el mob es 'muneco'.
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { box, flat, solid } from './fauna.js';
import { pal, tintModel } from './models.js';

export const MUNECO = 559;
const MATERIALES = [[null, 'sin material'], ['sombra', 'tela de Sombra'], ['caparazon', 'caparazón'], ['cuero', 'cuero'], ['reptil', 'escama'], ['piedra', 'piedra']];
const SACO = pal('#b89a5a', '#c8aa68', '#a8884a', '#d8ba78');
export const MUNECOS = {
  muneco: {
    name: 'Muñeco de práctica', w: 0.7, h: 1.9, health: 9999, speed: 0, hostile: false, hurtSound: 'dig.cloth', idleSound: null, idleEvery: [999, 999],
    particle: [[0.85, 0.75, 0.4], [0.7, 0.6, 0.3]], drops: [], xp: 0,
    build() {
      const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      body.add(flat(0x6a4a28, 0.14, 1.9, 0.14, 0, 0.95, 0)); // el palo
      body.add(flat(0x5a3a1c, 0.9, 0.12, 0.12, 0, 1.35, 0)); // los brazos
      const saco = box('muneco-saco', 0.66, 0.8, 0.44, solid(SACO, 0.5), 0, 1.15, 0); body.add(saco);
      for (let i = 0; i < 3; i++) saco.add(flat(0x7a5a2a, 0.68, 0.03, 0.46, 0, -0.25 + i * 0.25, 0)); // las costuras
      const cab = box('muneco-cabeza', 0.42, 0.42, 0.42, solid(SACO, 0.5), 0, 1.78, 0); body.add(cab);
      cab.add(flat(0x2a1a0a, 0.08, 0.08, 0.02, -0.1, 0.05, 0.215), flat(0x2a1a0a, 0.08, 0.08, 0.02, 0.1, 0.05, 0.215), flat(0x2a1a0a, 0.2, 0.03, 0.02, 0, -0.1, 0.215));
      for (let i = 0; i < 5; i++) { const z = flat(0xe8d070, 0.04, 0.16, 0.04, -0.16 + i * 0.08, 0.26, 0); z.rotation.z = (i - 2) * 0.25; cab.add(z); } // el zacate que se sale
      const letrero = new THREE.Group(); letrero.position.set(0, 0.55, 0.085); body.add(letrero); // pegado al palo (v11.11.1: antes flotaba enfrente)
      letrero.add(flat(0xe8e0c8, 0.5, 0.22, 0.03, 0, 0, 0));
      g.userData = { body, letrero };
      return g;
    },
    update(m, dt) {
      const D = m.data, g = m.game;
      m.health = 9999; D.vmax = 9999; m.stunT = 0;
      m.body.vel.x = m.body.vel.z = 0; m.body.vel.y = Math.min(m.body.vel.y, 0); // clavado en el suelo: los golpes no lo hacen brincar
      m.body.step(g.world, dt);
      m.group.position.set(m.body.pos.x, m.body.pos.y, m.body.pos.z);
      tintModel(m.group, m.lightLevel(), 0);
      // se bambolea con los golpes
      D.mece = Math.max(0, (D.mece || 0) - dt * 2.5);
      m.group.userData.body.rotation.z = Math.sin(m.t * 18) * 0.25 * D.mece;
      m.group.rotation.y = m.yaw || 0;
      // el daño por segundo: cada 3 segundos de pelea
      if (D.suma && (g.clock || 0) - D.desde >= 3) {
        const seg = Math.max(1, (g.clock || 0) - D.desde); // la ventana entera, con las pausas entre golpe y golpe
        g.ui.toast(`🎯 Muñeco (${MATERIALES[D.mat || 0][1]}): ${D.suma.toFixed(1)} de daño en ${seg.toFixed(1)} s · ${(D.suma / seg).toFixed(1)} por segundo`, 2600);
        D.suma = 0; D.desde = null;
      }
    },
    onHurt(m, g, dmg) {
      const D = m.data;
      if (!D.desde) D.desde = g.clock || 0;
      D.suma = (D.suma || 0) + dmg; D.ultimo = g.clock || 0; D.mece = 1;
      m.health = 9999 + dmg; // aguanta todo
      return true;
    },
    // clic derecho: cambiar de material; agachado, recogerlo
    interact(m, g) {
      if (g.player.sneaking) { m.dead = true; g.giveItem(MUNECO, 1); quitarAnotado(g, m); g.ui.toast('🎯 Recogió el muñeco', 1200); return true; }
      const D = m.data;
      D.mat = ((D.mat || 0) + 1) % MATERIALES.length;
      D.grupo = MATERIALES[D.mat][0];
      const A = anotado(g, m); if (A) A.mat = D.mat;
      g.ui.toast(`🎯 El muñeco ahora es de ${MATERIALES[D.mat][1]}: pruebe las armas`, 2000);
      g.audio.play('dig.cloth', { ui: true, vol: 0.5 });
      return true;
    },
  },
};
// los muñecos no se guardan como criaturas: quedan anotados (meta.munecos) y se vuelven a parar cuando uno pasa cerca
const anotado = (g, m) => m.data.puesto && (g.meta.munecos || []).find((q) => q.x === m.data.puesto.x && q.y === m.data.puesto.y && q.z === m.data.puesto.z);
function quitarAnotado(g, m) { const A = anotado(g, m); if (A) g.meta.munecos = g.meta.munecos.filter((q) => q !== A); }
export function tickMunecos(g) {
  const L = g.meta && g.meta.munecos;
  if (!L || !L.length || g.dim !== 'tierra') return;
  const p = g.player.body.pos;
  for (const q of L) {
    if (Math.hypot(q.x - p.x, q.z - p.z) > 48 || !g.world.isLoaded(q.x, q.z)) continue;
    if (g.entities.mobs.some((m) => !m.dead && m.type === 'muneco' && m.data.puesto && m.data.puesto.x === q.x && m.data.puesto.y === q.y && m.data.puesto.z === q.z)) continue;
    const m = g.entities.spawnMob('muneco', q.x + 0.5, q.y + 0.01, q.z + 0.5);
    if (m) { m.data.apuro = true; m.data.puesto = { x: q.x, y: q.y, z: q.z }; m.data.mat = q.mat || 0; m.data.grupo = MATERIALES[m.data.mat][0]; }
  }
}
// clic derecho con el muñeco en la mano, apuntando al suelo: lo para ahí
export function ponerMuneco(g, id, t) {
  if (id !== MUNECO) return false;
  if (g.dim !== 'tierra') { g.ui.toast('🎯 Aquí no se sostiene: párelo en la tierra', 1400); return true; }
  if (g.mobTarget && g.mobTarget.mob && g.mobTarget.mob.type === 'muneco') return false; // apuntándole a uno: es para cambiarlo o recogerlo
  if (!t || !SOLID[t.id] || t.ny !== 1) { g.ui.toast('🎯 Apunte al suelo para pararlo', 1200); return true; }
  if ((g.meta.munecos || []).some((q) => q.x === t.x && q.y === t.y + 1 && q.z === t.z)) { g.ui.toast('🎯 Ahí ya hay uno', 1200); return true; }
  const m = g.entities.spawnMob('muneco', t.x + 0.5, t.y + 1.01, t.z + 0.5);
  if (!m) return true;
  const p = g.player.body.pos; m.yaw = Math.atan2(p.x - m.body.pos.x, p.z - m.body.pos.z);
  m.data.apuro = true; m.data.mat = 0;
  (g.meta.munecos ||= []).push({ x: t.x, y: t.y + 1, z: t.z, mat: 0 }); m.data.puesto = { x: t.x, y: t.y + 1, z: t.z };
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.audio.play('dig.wood', { ui: true, vol: 0.6 });
  g.achieve('muneco', 'A practicar');
  return true;
}
