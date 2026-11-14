// La panga de los pescadores: en la tarde, en las playas cerca de los pueblos, llega una panga del mar con Don Macario y su
// hijo, varan en la arena y venden la pesca del día, fresquita (clic derecho a Don Macario: tres pescados por ₡6). A los dos
// minutos se van. Estado: g.panga (no se guarda), g.pangaDia.
import * as THREE from 'three';
import { SEA } from './worldgen.js';
import { SOLID } from './blocks.js';
import { haciaMar } from './marcielo.js';
import { disposeModel } from './models.js';
import { decir } from './misiones.js';

const COLON = 360, PRECIO = 6, PESCA = [361, 362, 363, 364], QUEDA = 120;
function bote() {
  const g = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const c = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(col)); m.position.set(x, y, z); g.add(m); return m; };
  c(1.8, 0.6, 5, 0xf4f4f4, 0, 0.3, 0); c(1.86, 0.18, 5.05, 0x2a6ad8, 0, 0.62, 0); // casco blanco con su franja azul
  c(1.2, 0.6, 1, 0xf4f4f4, 0, 0.3, 2.8); c(0.6, 0.5, 0.6, 0xf4f4f4, 0, 0.3, 3.4); // la proa
  c(1.6, 0.08, 4.4, 0x8a6438, 0, 0.62, -0.1); // las tablas
  c(0.5, 0.7, 0.5, 0x2a2a2e, 0, 0.75, -2.6); c(0.12, 0.5, 0.12, 0x1a1a1a, 0, 0.2, -2.9); // el motor fuera de borda
  for (let i = 0; i < 3; i++) c(0.5, 0.35, 0.4, [0xd04030, 0x3a8ad0, 0xf0c020][i], -0.4 + i * 0.4, 0.85, 0.5 - i * 0.5); // las hieleras
  c(1.5, 0.05, 0.6, 0x2a6a3a, 0, 0.9, 1.4); // la red
  return g;
}
export function limpiarPanga(g) {
  const P = g.panga;
  if (!P) return;
  g.scene.remove(P.bote); disposeModel(P.bote);
  for (const m of P.gente) if (m && !m.dead) m.dead = true;
  g.audio.setEmitter('panga', null, null);
  g.panga = null;
}
function orilla(g, a) {
  const p = g.player.body.pos, dx = Math.cos(a), dz = Math.sin(a);
  for (let d = 0; d < 60; d++) { const x = p.x + dx * d, z = p.z + dz * d; if (g.world.gen.column(Math.floor(x), Math.floor(z)).h < SEA - 1) return { x: x - dx, z: z - dz, dx, dz }; }
  return null;
}
function suelo(g, x, z) { let y = SEA + 8; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
function empezar(g) {
  const a = haciaMar(g);
  if (a == null) return false;
  const O = orilla(g, a);
  if (!O) return false;
  const b = bote(); g.scene.add(b);
  g.panga = { bote: b, O, fase: 'llega', t: 0, gente: [], ventas: 0 };
  g.pangaDia = g.day || 1;
  g.audio.play('loop.motor', { ui: true, vol: 0.2 });
  return true;
}
// cada segundo
export function tickPanga(g) {
  const P = g.panga;
  if (P) {
    P.t++;
    if (g.dim !== 'tierra' || Math.hypot(g.player.body.pos.x - P.O.x, g.player.body.pos.z - P.O.z) > 120) { limpiarPanga(g); return; }
    if (P.fase === 'vende' && P.t > QUEDA) { P.fase = 'sale'; P.t = 0; for (const m of P.gente) if (m && !m.dead) m.dead = true; P.gente = []; }
    return;
  }
  const t = g.time || 0;
  if (g.dim !== 'tierra' || t < 0.34 || t > 0.42 || g.pangaDia === (g.day || 1) || Math.random() > 1 / 30) return;
  const env = g.env && g.env.biome;
  if (env !== 'beach') return;
  const v = g.nearestVillage && g.nearestVillage(g.player.body.pos.x, g.player.body.pos.z);
  if (!v || v.dist > 140) return;
  empezar(g);
}
// cada cuadro: la panga entra, vara y después sale
export function cuadroPanga(g, dt) {
  const P = g.panga;
  if (!P) return;
  const O = P.O, b = P.bote;
  P.tt = (P.tt || 0) + dt;
  let d = 0;
  if (P.fase === 'llega') { d = Math.max(0, 40 - P.tt * 4.5); if (d <= 0) { P.fase = 'vende'; P.t = 0; varar(g, P); } }
  else if (P.fase === 'vende') d = 0;
  else { P.sal = (P.sal || 0) + dt; d = P.sal * 4.5; if (d > 60) { limpiarPanga(g); return; } }
  const x = O.x + O.dx * (d + 2), z = O.z + O.dz * (d + 2);
  b.position.set(x, SEA - 0.15 + Math.sin(P.tt * 1.5) * 0.08 * (d > 0 ? 1 : 0.3), z);
  b.rotation.y = Math.atan2(-O.dx, -O.dz) + (P.fase === 'sale' ? Math.PI : 0);
  if (d > 0 && Math.random() < dt * 20) g.particles.spawn(x - O.dx * 2.5, SEA + 0.6, z - O.dz * 2.5, [0.9, 0.95, 1], 0, 0.8, 0, 0.6, 6);
  g.audio.setEmitter('panga', d > 0 ? 'loop.motor' : null, { x, y: SEA + 1, z }, 0.35);
}
function varar(g, P) {
  const O = P.O, lx = -O.dz, lz = O.dx;
  ['Don Macario, pescador', 'Kevin, el hijo de Don Macario'].forEach((n, i) => {
    const x = O.x - O.dx * 1.5 + lx * (i ? 1.5 : -1.5), z = O.z - O.dz * 1.5 + lz * (i ? 1.5 : -1.5);
    const m = g.entities.spawnMob('vecino', x, suelo(g, x, z) + 0.1, z);
    if (!m) return;
    Object.assign(m.data, { role: 'vecino', name: n, panga: !i, seed: 9001 + i, home: { x: Math.floor(x), y: 0, z: Math.floor(z) }, plaza: { x: Math.floor(x), y: 0, z: Math.floor(z) }, vid: 'panga', animo: { tipo: 'panga' } });
    if (m.kind.dress) m.kind.dress(m);
    P.gente.push(m);
  });
  if (P.gente[0]) decir(g, P.gente[0], '¡Pescado fresco, recién salido! ¡Pargo, corvina, dorado!', 4);
  if (Math.hypot(g.player.body.pos.x - O.x, g.player.body.pos.z - O.z) < 60) g.ui.toast('🚤 Varó una panga: Don Macario vende la pesca (clic derecho, ₡6 por tres)', 4400);
}
// clic derecho a Don Macario
export function pangaInteract(m, g) {
  if (!m.data.panga) return false;
  const P = g.panga;
  if (!P || P.fase !== 'vende') return false;
  if (P.ventas >= 4) { decir(g, m, 'Diay, ya se me acabó. Mañana traemos más.', 2.6); return true; }
  if (g.inventory.count(COLON) < PRECIO) { decir(g, m, `Son ₡${PRECIO} los tres, con gusto. Con la plata vuelva.`, 2.6); return true; }
  g.inventory.remove(COLON, PRECIO);
  for (let i = 0; i < 3; i++) g.giveItem(PESCA[Math.floor(Math.random() * (i === 2 && Math.random() < 0.3 ? 4 : 3))], 1);
  P.ventas++;
  g.audio.play('monedas', { ui: true, vol: 0.5 });
  decir(g, m, ['¡Fresquito! Esta mañana todavía nadaba.', 'Hágalo frito con patacones, ya verá.', '¡Gracias! Que le aproveche.'][Math.floor(Math.random() * 3)], 2.8);
  g.achieve('panga', 'Pescado fresco de la panga');
  return true;
}
export function pruebaPanga(g) {
  limpiarPanga(g);
  return empezar(g) ? 'Una panga viene llegando a la orilla (unos 9 segundos)' : 'Aquí no hay mar abierto cerca: pruébelo en una playa';
}
