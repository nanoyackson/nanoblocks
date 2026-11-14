// El Festival de la Luz: en las noches de fin de año, en los pueblos con calles, pasa una vez por noche un desfile de cinco
// carrozas forradas de bombillos que titilan (una estrella, una carreta pintada, un tucán, un árbol y un volcán), con tambores y
// pólvora. Todo es de ver (no son bloques). Estado: g.festival (no se guarda), g.festivalNoche (el día del último desfile).
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { fiestaHoy } from './fiestas2.js';
import { disposeModel } from './models.js';
import { Rocket } from './fiesta.js';

const VEL = 2.2, SEP = 10, COLORES = [0xff3a3a, 0xffd23a, 0x3aff6a, 0x3ab8ff, 0xff7aff, 0xffffff, 0xff9a2a];
const mb = (c) => new THREE.MeshBasicMaterial({ color: c, fog: false });
function caja(g, w, h, d, c, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(x, y, z); g.add(m); return m; }
// los bombillos: cajitas en fila por un borde, que después titilan cambiando de color
function bombillos(g, lista, x0, y0, z0, x1, y1, z1, n) {
  for (let i = 0; i <= n; i++) { const k = i / n, b = caja(g, 0.14, 0.14, 0.14, COLORES[i % COLORES.length], x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, z0 + (z1 - z0) * k); b.userData.fase = i; lista.push(b); }
}
function plataforma(color) {
  const g = new THREE.Group(), luces = [];
  caja(g, 3.2, 0.6, 5.2, color, 0, 0.7, 0);
  for (const s of [-1, 1]) for (const t of [-1, 1]) caja(g, 0.2, 0.5, 0.5, 0x1a1a1a, s * 1.5, 0.25, t * 1.9); // las llantas
  caja(g, 3.3, 0.12, 5.3, 0xf0e0a0, 0, 1.06, 0); // el borde dorado
  for (const s of [-1, 1]) { bombillos(g, luces, s * 1.65, 1.1, -2.6, s * 1.65, 1.1, 2.6, 16); bombillos(g, luces, -1.6, 1.1, s * 2.65, 1.6, 1.1, s * 2.65, 9); }
  return { g, luces };
}
const CARROZAS = [
  // la estrella
  () => { const { g, luces } = plataforma(0x1a2a8a); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2, b = a + Math.PI / 5; bombillos(g, luces, 0, 3.4, 0, Math.cos(a) * 1.8, 3.4 - Math.sin(a) * 1.8, 0, 6); bombillos(g, luces, Math.cos(a) * 1.8, 3.4 - Math.sin(a) * 1.8, 0, Math.cos(b) * 0.8, 3.4 - Math.sin(b) * 0.8, 0, 4); } caja(g, 0.12, 1.8, 0.12, 0xc0c0c0, 0, 2, 0); return { g, luces }; },
  // la carreta pintada
  () => { const { g, luces } = plataforma(0x8a1a1a); caja(g, 1.6, 0.9, 2.4, 0xd83a2a, 0, 1.75, 0); for (const s of [-1, 1]) { const r = new THREE.Group(); r.position.set(s * 0.95, 1.9, 0); g.add(r); for (let k = 0; k < 8; k++) { const p = caja(r, 0.08, 1.5, 0.22, COLORES[k % COLORES.length], 0, 0, 0); p.rotation.x = (k / 8) * Math.PI; } caja(r, 0.12, 0.3, 0.3, 0x1a1a1a, 0, 0, 0); g.userData.rueda = (g.userData.rueda || []).concat(r); } bombillos(g, luces, -0.8, 2.25, -1.2, -0.8, 2.25, 1.2, 8); bombillos(g, luces, 0.8, 2.25, -1.2, 0.8, 2.25, 1.2, 8); return { g, luces }; },
  // el tucán
  () => { const { g, luces } = plataforma(0x1a6a2a); caja(g, 1.1, 1.4, 1.6, 0x141414, 0, 2, 0); caja(g, 0.9, 0.7, 0.7, 0xf4f0d0, 0, 2.5, 0.75); caja(g, 0.6, 0.5, 1.6, 0xff9a1a, 0, 2.55, 1.85); caja(g, 0.5, 0.2, 0.6, 0x2a1a0a, 0, 2.7, 2.5); caja(g, 0.18, 0.18, 0.05, 0x3ab8ff, 0.3, 2.65, 1.12); caja(g, 0.18, 0.18, 0.05, 0x3ab8ff, -0.3, 2.65, 1.12); caja(g, 0.8, 0.3, 1, 0x141414, 0, 1.4, -1.1); bombillos(g, luces, 0, 3.3, -0.8, 0, 3.3, 1.2, 8); return { g, luces }; },
  // el árbol
  () => { const { g, luces } = plataforma(0xe8e8f0); for (let k = 0; k < 5; k++) caja(g, 2.6 - k * 0.5, 0.6, 2.6 - k * 0.5, 0x1a6a2a, 0, 1.4 + k * 0.6, 0); for (let k = 0; k < 5; k++) { const r = 1.3 - k * 0.25, y = 1.4 + k * 0.6; bombillos(g, luces, -r, y, r, r, y, r, 5); bombillos(g, luces, -r, y, -r, r, y, -r, 5); } caja(g, 0.5, 0.5, 0.5, 0xffd23a, 0, 4.6, 0); return { g, luces }; },
  // el volcán
  () => { const { g, luces } = plataforma(0x4a2a1a); for (let k = 0; k < 4; k++) caja(g, 2.8 - k * 0.6, 0.7, 3.6 - k * 0.7, k === 3 ? 0x6a3a22 : 0x5a3a28, 0, 1.45 + k * 0.7, 0); caja(g, 0.8, 0.2, 1, 0xff5a10, 0, 4.2, 0); for (const s of [-1, 1]) bombillos(g, luces, s * 1.4, 1.4, -1.6, s * 0.4, 4, -0.5, 7); g.userData.lava = true; return { g, luces }; },
];
function suelo(g, x, z, y0) { let y = Math.floor(y0) + 10; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
function empezar(g, v) {
  const s = v.streets.filter((q) => q.axis === 'x').sort((a, b) => Math.abs(a.z - v.z) - Math.abs(b.z - v.z))[0] || v.streets[0];
  const eje = s.axis, x0 = eje === 'x' ? s.x : s.x + s.w / 2, z0 = eje === 'x' ? s.z + s.d / 2 : s.z, largo = eje === 'x' ? s.w : s.d;
  const carrozas = CARROZAS.map((f, i) => { const c = f(); g.scene.add(c.g); return { ...c, i }; });
  g.festival = { eje, x0, z0, largo, t: 0, carrozas, y0: v.y || g.player.body.pos.y, alturas: new Map(), avisado: false };
  g.festivalNoche = g.day || 1;
  g.ui.toast('🎆 ¡Viene el Festival de la Luz! Las carrozas entran por la calle, llenas de bombillos', 4200);
}
export function limpiarFestival(g) {
  const F = g.festival;
  if (!F) return;
  for (const c of F.carrozas) { g.scene.remove(c.g); disposeModel(c.g); }
  g.audio.setEmitter('festival', null, null);
  g.festival = null;
}
// cada segundo: ¿empieza?
export function tickFestival(g) {
  if (g.festival || g.dim !== 'tierra' || fiestaHoy(g) !== 'fin_de_ano' || g.festivalNoche === (g.day || 1)) return;
  const t = g.time || 0;
  if (t < 0.6 || t > 0.9) return; // de noche, temprano
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 60 || !v.v.streets || !v.v.streets.length) return;
  empezar(g, v.v);
}
// cada cuadro: avanzan, titilan y tiran pólvora
export function cuadroFestival(g, dt) {
  const F = g.festival;
  if (!F) return;
  if (g.dim !== 'tierra') { limpiarFestival(g); return; }
  F.t += dt;
  const p = g.player.body.pos, parpadeo = Math.floor(F.t * 4);
  let medio = null, fuera = 0;
  for (const c of F.carrozas) {
    const s = F.t * VEL - c.i * SEP; // lo que lleva recorrido
    if (s < 0 || s > F.largo) { c.g.visible = false; if (s > F.largo) fuera++; continue; }
    c.g.visible = true;
    const x = F.eje === 'x' ? F.x0 + s : F.x0, z = F.eje === 'x' ? F.z0 : F.z0 + s, k = `${Math.floor(x)},${Math.floor(z)}`;
    if (!F.alturas.has(k)) F.alturas.set(k, suelo(g, x, z, F.y0));
    const y = F.alturas.get(k);
    c.g.position.set(x, y + Math.sin(F.t * 3 + c.i) * 0.03, z);
    c.g.rotation.y = F.eje === 'x' ? Math.PI / 2 : 0;
    for (const b of c.luces) b.material.color.setHex(COLORES[(b.userData.fase + parpadeo) % COLORES.length]);
    if (c.g.userData.rueda) for (const r of c.g.userData.rueda) r.rotation.x += dt * 1.5;
    if (c.g.userData.lava && Math.random() < dt * 8) g.particles.spawn(x, y + 4.4, z, Math.random() < 0.5 ? [1, 0.5, 0.1] : [0.5, 0.5, 0.5], (Math.random() - 0.5), 2, (Math.random() - 0.5), 1.2, -1, true);
    if (Math.random() < dt * 0.25) (g.rockets ||= []).push(new Rocket(g, x, y + 3, z));
    if (!medio) medio = { x, y: y + 2, z };
    if (!F.avisado && Math.hypot(x - p.x, z - p.z) < 10) { F.avisado = true; g.audio.play('aplausos', { ui: true, vol: 0.6 }); g.achieve('festival_luz', 'Vi pasar el Festival de la Luz'); }
  }
  g.audio.setEmitter('festival', 'loop.comparsa', medio, 0.9);
  if (fuera >= F.carrozas.length) { g.ui.toast('🎆 Pasó la última carroza. ¡Feliz fin de año!', 3000); limpiarFestival(g); }
}
export function pruebaFestival(g) {
  limpiarFestival(g);
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || !v.v.streets || !v.v.streets.length) return 'Hace falta un pueblo con calles cerca (de los nuevos)';
  empezar(g, v.v);
  return `Las carrozas entran por la calle de ${v.v.name || 'el pueblo'} (a ${Math.round(v.dist)} bloques)`;
}
