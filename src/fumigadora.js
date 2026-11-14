// La avioneta fumigadora: de día, sobre los campos de los pueblos (cafetales, bananales, milpas y potreros), a veces pasa una
// avioneta amarilla volando bajito, ida y vuelta, soltando una nube blanca. Si a uno le cae encima, se marea un rato.
// Todo es de ver. Estado: g.fumiga (no se guarda), g.fumigaCd (segundos de juego).
import * as THREE from 'three';
import { disposeModel } from './models.js';

const PASADAS = 4, VEL = 16;
function avioneta() {
  const g = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const c = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(col)); m.position.set(x, y, z); g.add(m); return m; };
  c(0.9, 0.9, 4.2, 0xf0c020, 0, 0, 0); // el fuselaje
  c(0.7, 0.5, 0.9, 0x6ab0e0, 0, 0.55, 0.6); // la cabina
  c(8, 0.12, 1.3, 0xe8b818, 0, 0.35, 0.6); c(7, 0.12, 1.1, 0xe8b818, 0, -0.45, 0.6); // las dos alas
  for (const s of [-1, 1]) c(0.08, 0.8, 0.08, 0x3a3a3a, s * 2.5, -0.05, 0.6); // los montantes
  c(2.6, 0.1, 0.8, 0xe8b818, 0, 0.2, -1.9); c(0.1, 1, 0.8, 0xe8b818, 0, 0.6, -1.9); // la cola
  c(7.4, 0.1, 0.1, 0x6a6a72, 0, -0.6, 0.2); // la barra de las boquillas
  const helice = new THREE.Group(); helice.position.set(0, 0, 2.2); g.add(helice);
  const h = new THREE.Mesh(new THREE.BoxGeometry(2, 0.18, 0.06), mb(0x2a2a2a)); helice.add(h);
  g.userData = { helice };
  return g;
}
export function limpiarFumiga(g) {
  const F = g.fumiga;
  if (!F) return;
  g.scene.remove(F.av); disposeModel(F.av);
  g.audio.setEmitter('fumiga', null, null);
  g.fumiga = null;
}
function empezar(g, campo) {
  const av = avioneta(); g.scene.add(av);
  const a = Math.random() < 0.5 ? 0 : Math.PI / 2;
  g.fumiga = { av, cx: campo.x, cz: campo.z, y: campo.y + 9, ang: a, pasada: 0, s: -45, lado: -6, nube: [] };
  g.ui.toast('✈ Se oye un motor bajito… ¡viene la avioneta fumigadora sobre el campo!', 3200);
}
// cada segundo: ¿pasa la avioneta?
export function tickFumiga(g) {
  if (g.fumiga || g.dim !== 'tierra' || g.daylight < 0.5 || (g.clock || 0) < (g.fumigaCd || 0) || Math.random() > 1 / 120) return;
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 90 || !v.v.buildings) return;
  const campos = v.v.buildings.filter((b) => ['cafetal', 'bananal', 'milpa', 'potrero'].includes(b.kind) && Math.hypot(b.x + 10 - p.x, b.z + 10 - p.z) < 60);
  if (!campos.length) return;
  const b = campos[Math.floor(Math.random() * campos.length)];
  g.fumigaCd = (g.clock || 0) + 900;
  empezar(g, { x: b.x + b.w / 2, z: b.z + b.d / 2, y: b.y || p.y });
}
// cada cuadro: vuela, rocía y marea a quien esté debajo
export function cuadroFumiga(g, dt) {
  const F = g.fumiga;
  if (!F) return;
  if (g.dim !== 'tierra') { limpiarFumiga(g); return; }
  F.s += VEL * dt;
  const dx = Math.cos(F.ang), dz = Math.sin(F.ang), ida = F.pasada % 2 === 0 ? 1 : -1, lx = -dz, lz = dx;
  const x = F.cx + dx * F.s * ida + lx * F.lado, z = F.cz + dz * F.s * ida + lz * F.lado;
  F.av.position.set(x, F.y + Math.sin(F.s * 0.1) * 0.3, z);
  F.av.rotation.set(0, Math.atan2(dx * ida, dz * ida), Math.sin(F.s * 0.05) * 0.08);
  F.av.userData.helice.rotation.z += dt * 40;
  g.audio.setEmitter('fumiga', 'loop.motor', { x, y: F.y, z }, 0.7);
  // la nube que va dejando (sobre el campo)
  const sobreCampo = Math.abs(F.s) < 22;
  if (sobreCampo) for (let i = 0; i < 3; i++) { const l = (Math.random() - 0.5) * 7; g.particles.spawn(x + lx * l, F.y - 0.8, z + lz * l, [0.93, 0.95, 0.9], (Math.random() - 0.5) * 0.6, -1.4 - Math.random(), (Math.random() - 0.5) * 0.6, 3.5, 0.15); }
  if (sobreCampo) { F.nube.push({ x, z, t: 6 }); }
  F.nube = F.nube.filter((n) => (n.t -= dt) > 0);
  // ¿uno está debajo de la nube?
  const p = g.player.body.pos;
  if (g.mode === 'survival' && !F.avisoMareo && F.nube.some((n) => Math.abs((p.x - n.x) * lx + (p.z - n.z) * lz) < 4.5 && Math.hypot(p.x - n.x, p.z - n.z) < 6 && p.y < F.y && n.t < 4.5)) {
    F.avisoMareo = true;
    g.addEffect('mareo', 10);
    g.ui.toast('🤢 ¡Le cayó la nube de la fumigadora! Huele horrible y todo da vueltas', 3000);
    g.achieve('fumigado', 'Me fumigaron');
  }
  if (F.s > 45) { F.s = -45; F.pasada++; F.lado += 4; if (F.pasada >= PASADAS) { limpiarFumiga(g); g.achieve('fumigadora', 'Vi pasar la avioneta fumigadora'); } }
}
export function pruebaFumiga(g) {
  limpiarFumiga(g);
  const p = g.player.body.pos;
  empezar(g, { x: p.x, z: p.z, y: Math.floor(p.y) });
  return 'La avioneta fumigadora pasa encima de usted (cuatro pasadas)';
}
