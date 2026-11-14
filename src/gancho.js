// El gancho con mecate (v8.0): se apunta a un bloque a hasta 20 de distancia y, con clic derecho, el gancho vuela, se clava y lo
// jala a uno hasta allá. Para subir acantilados, cruzar un río o salir de un apuro. Se suelta solo al llegar, si algo lo tapa o con
// Espacio. Sin daño de caída mientras jala. Estado: g.gancho (no se guarda). Ítem 558.
import * as THREE from 'three';
import { SOLID } from './blocks.js';

export const GANCHO = 558;
export function usarGancho(g, id) {
  if (id !== GANCHO) return false;
  if (g.gancho || g.ganchoEspera) return true; // ya va jalando, o acaba de soltarse y pide un clic nuevo
  if (g.riding || g.zip || g.monta || g.vagon || g.globoViaje) return true;
  const e = g.player.eye, d = g.player.lookDir();
  const t = g.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, 20);
  if (!t || !SOLID[t.id]) { g.ui.toast('🪝 No hay de dónde agarrarse (hasta 20 bloques)', 1200); g.audio.play('swish', { ui: true, vol: 0.4, pitch: 1.4 }); return true; }
  const P = { x: t.x + 0.5 + (t.nx || 0) * 0.55, y: t.y + 0.5 + (t.ny || 0) * 0.55, z: t.z + 0.5 + (t.nz || 0) * 0.55 };
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const linea = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8a6a3a }));
  linea.frustumCulled = false; // la caja de la línea no se recalcula al moverla: sin esto se corta
  g.scene.add(linea);
  g.gancho = { P, t: 0, vuela: 0, dist: Math.hypot(P.x - e.x, P.y - e.y, P.z - e.z), linea };
  g.audio.play('swish', { ui: true, vol: 0.7, pitch: 0.9 });
  g.planeo = null;
  if (g.mode === 'survival' && g.inventory.wearHeld()) { g.audio.play('toolbreak'); g.ui.toast('¡Se reventó el mecate!'); }
  return true;
}
export function soltarGancho(g) {
  const G = g.gancho;
  if (!G) return;
  g.scene.remove(G.linea); G.linea.geometry.dispose(); G.linea.material.dispose();
  g.gancho = null;
  g.ganchoEspera = true;
  g.sinCaida = (g.clock || 0) + 1.2; // el aterrizaje después del jalón no duele
}
// cada cuadro, en vez del movimiento normal
export function ganchoUpdate(g, dt) {
  const G = g.gancho, b = g.player.body, e = g.player.eye;
  G.t += dt;
  // el gancho vuela primero (36 bloques por segundo) y después jala
  G.vuela = Math.min(G.dist, G.vuela + dt * 36);
  const k = G.vuela / G.dist, d = g.player.lookDir();
  const mano = new THREE.Vector3(e.x + d.x * 0.4 - Math.cos(g.player.yaw) * 0.25, e.y - 0.35, e.z + d.z * 0.4 + Math.sin(g.player.yaw) * 0.25);
  const punta = new THREE.Vector3(mano.x + (G.P.x - mano.x) * k, mano.y + (G.P.y - mano.y) * k, mano.z + (G.P.z - mano.z) * k);
  G.linea.geometry.setFromPoints([mano, punta]);
  if (k < 1) { b.step(g.world, dt); return; }
  if (!G.clavo) { G.clavo = true; g.audio.play('dig.stone', { pos: G.P, vol: 0.6, pitch: 1.5 }); }
  const dx = G.P.x - b.pos.x, dy = G.P.y - (b.pos.y + 0.9), dz = G.P.z - b.pos.z, L = Math.hypot(dx, dy, dz) || 1;
  const v = Math.min(20, 8 + G.t * 30);
  b.vel.x = (dx / L) * v; b.vel.y = (dy / L) * v + 1.5; b.vel.z = (dz / L) * v;
  b.step(g.world, dt);
  b.fallStart = null;
  // llegó, algo lo tapó o ya fue mucho rato
  if (L < 1.4 || (b.hitWall && G.t > 0.4 && L < 3) || G.t > 2.5) { b.vel.y = Math.max(b.vel.y * 0.3, 4); soltarGancho(g); }
}
