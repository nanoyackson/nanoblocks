// Surf: con la tabla en la mano y metido en el mar, clic derecho para subirse. Uno rema hacia donde mira (W) y las
// olas vienen en series hacia la playa: si va remando cuando pasa una, ¡la agarra! y sale disparado con la espuma.
// Shift (o llegar a la arena) se baja. En el agua dulce no hay olas.
import * as THREE from 'three';
import { influencerEvento } from './influencer.js';
import { FLUID } from './blocks.js';
import { SEA } from './worldgen.js';

export const TABLA = 479;

function tabla() {
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 2.2), new THREE.MeshBasicMaterial({ color: 0xf4f0e0 }));
  g.add(cuerpo);
  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 2.1), new THREE.MeshBasicMaterial({ color: 0x2a9ad8 }));
  g.add(franja);
  const punta = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.3), new THREE.MeshBasicMaterial({ color: 0xe8603a }));
  punta.position.z = 1.0;
  g.add(punta);
  const quilla = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.25), new THREE.MeshBasicMaterial({ color: 0x2a2a2e }));
  quilla.position.set(0, -0.15, -0.9);
  g.add(quilla);
  return g;
}
const enMar = (g) => {
  const p = g.player.body.pos;
  const col = g.world.gen.column(Math.floor(p.x), Math.floor(p.z));
  return g.player.body.inWater && col.h < SEA - 1 && (col.biome === 'ocean' || col.biome === 'beach');
};
// hacia dónde queda la playa: la dirección (de 8) en que el fondo sube más rápido
function haciaPlaya(g) {
  const p = g.player.body.pos;
  let mejor = null, mh = -Infinity;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const h = g.world.gen.column(Math.floor(p.x + Math.cos(a) * 24), Math.floor(p.z + Math.sin(a) * 24)).h;
    if (h > mh) { mh = h; mejor = a; }
  }
  return mejor;
}

export function usarTabla(g) {
  if (g.surf) { bajar(g, '🏄 Se bajó de la tabla'); return; }
  if (!enMar(g)) { g.ui.toast('🏄 Métase al mar con la tabla en la mano (en el río no hay olas)', 2000); return; }
  const mesh = tabla();
  g.scene.add(mesh);
  g.surf = { mesh, t: 0, ola: null, olaCd: 3, v: 0, playa: haciaPlaya(g), olas: 0, tilt: 0, alto: 0 };
  g.ui.toast('🏄 W rema hacia donde mira · reme a la playa cuando venga la ola · Shift se baja', 3600);
  g.achieve('surf', 'Pura vida, mae: a surfear');
}
function bajar(g, txt) {
  const S = g.surf;
  if (!S) return;
  g.scene.remove(S.mesh);
  g.surf = null;
  if (txt) g.ui.toast(txt, 1400);
}
export function limpiarSurf(g) { bajar(g, null); }

// después del combate (que limpia forcedVel), como el parapente
export function tickSurf(g, dt) {
  const S = g.surf;
  if (!S) return;
  const pl = g.player, b = pl.body, w = g.world;
  const held = g.inventory.held;
  const sneak = g.keys && (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight'));
  if (!pl.alive || !held || held.id !== TABLA || sneak) { bajar(g, sneak ? '🏄 Se bajó de la tabla' : null); return; }
  // llegó a la arena
  if (FLUID[w.getBlock(Math.floor(b.pos.x), SEA, Math.floor(b.pos.z))] !== 1) { bajar(g, S.ola ? '🏄 ¡Llegó surfeando hasta la orilla!' : '🏄 Llegó a la orilla'); if (S.ola) g.achieve('surf_orilla', 'Hasta la orilla'); return; }
  S.t += dt;
  const remando = g.keys && g.keys.has('KeyW');
  const fx = -Math.sin(pl.yaw), fz = -Math.cos(pl.yaw);
  // las olas llegan en series
  S.olaCd -= dt;
  if (!S.ola && S.olaCd <= 0) {
    S.olaCd = 7 + Math.random() * 6;
    S.playa = haciaPlaya(g) ?? S.playa;
    const px = Math.cos(S.playa), pz = Math.sin(S.playa);
    // ¿va remando más o menos hacia la playa?
    if (remando && fx * px + fz * pz > 0.5) {
      S.ola = { t: 0, dur: 3.2 + Math.random() * 1.5 };
      S.olas++;
      g.audio.play('splash', { ui: true, vol: 0.8, pitch: 0.7 });
      g.ui.toast(S.olas === 1 ? '🌊 ¡Agarró la ola! ¡Wiiii!' : `🌊 ¡Otra ola! (${S.olas})`, 1400);
      g.achieve('surf_ola', 'Agarré una ola');
      influencerEvento(g, 'surfeando una ola', 15000);
      if (S.olas >= 10) g.achieve('surf_10', 'Surfista de Jacó');
    } else {
      g.audio.play('splash', { ui: true, vol: 0.4, pitch: 0.6 });
      if (!S.avisoOla) { S.avisoOla = true; g.ui.toast('🌊 Pasó una ola… la próxima reme hacia la playa', 1800); }
    }
  }
  let vel = remando ? 3.2 : 0.8;
  if (S.ola) {
    S.ola.t += dt;
    vel = 11 * (1 - S.ola.t / S.ola.dur * 0.4);
    if (S.ola.t >= S.ola.dur) S.ola = null;
    // espuma
    for (let k = 0; k < 3; k++) g.particles.spawn(b.pos.x - fx * 1.2 + (Math.random() - 0.5) * 1.5, SEA + 1.1, b.pos.z - fz * 1.2 + (Math.random() - 0.5) * 1.5, [1, 1, 1], (Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2, 0.6, 3);
  }
  S.v += (vel - S.v) * Math.min(1, dt * 2.5);
  pl.forcedVel = { x: fx * S.v, z: fz * S.v };
  // parado en la tabla, sobre el agua (con su vaivén)
  const yAgua = SEA + 1;
  // la ola levanta y empina la tabla poco a poco (y la baja igual)
  S.alto += ((S.ola ? 0.3 : 0) - S.alto) * Math.min(1, dt * 3);
  S.tilt += ((S.ola ? -0.14 : 0) - S.tilt) * Math.min(1, dt * 3);
  const vaiven = Math.sin(S.t * 2.2) * 0.08 * (1 - S.alto) + S.alto;
  const sube = Math.min(1, S.t / 0.35);
  b.pos.y = yAgua + 0.12 + vaiven; b.vel.y = 0; b.fallStart = null;
  S.mesh.position.set(b.pos.x, yAgua + 0.06 + vaiven - (1 - sube) * 0.4, b.pos.z);
  S.mesh.scale.setScalar(0.6 + 0.4 * sube);
  S.mesh.rotation.set(S.tilt + Math.sin(S.t * 1.7) * 0.05, (g.foto ? g.foto.yaw : pl.yaw) + Math.PI, Math.sin(S.t * 1.3) * 0.08 * (1 - S.alto * 2));
}
