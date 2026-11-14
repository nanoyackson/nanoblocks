// El pez vela: mar adentro, a veces lo que pica en la caña es un pez vela. Empieza la pelea: cada clic derecho recoge cuerda, pero
// sube la tensión; cuando el pez corre, jala, y si la tensión llega al tope se revienta la cuerda. Cuando salta, afloja. Si se le
// trae hasta el bote, se le toma la foto y se devuelve al mar, como se hace en Costa Rica. Estado: g.pezVela (no se guarda), meta.velas.
import * as THREE from 'three';
import { SEA } from './worldgen.js';
import { disposeModel } from './models.js';
import { gainSkill } from './habilidades.js';
import { anotar } from './diario.js';
import { esCana } from './blocks.js';

export const FOTO_VELA = 531;
const LEJOS = 26, TIEMPO = 75;
const mb = (c) => new THREE.MeshBasicMaterial({ color: c });
function caja(g, w, h, d, c, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(x, y, z); g.add(m); return m; }
function modelo() {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  caja(cuerpo, 0.42, 0.26, 1.9, 0x16386a, 0, 0.12, 0); // lomo azul oscuro
  caja(cuerpo, 0.4, 0.22, 1.8, 0xc8d4dc, 0, -0.1, 0); // panza plateada
  for (let i = 0; i < 5; i++) caja(cuerpo, 0.42, 0.3, 0.05, 0x3a78c8, 0, 0, -0.6 + i * 0.3); // rayas
  caja(cuerpo, 0.05, 0.06, 0.95, 0x2a3a5a, 0, 0.05, 1.4); // el pico
  caja(cuerpo, 0.06, 0.06, 0.06, 0x101010, 0.2, 0.1, 0.8); caja(cuerpo, 0.06, 0.06, 0.06, 0x101010, -0.2, 0.1, 0.8);
  // la vela: la aleta dorsal enorme, con pintitas
  const vela = new THREE.Group(); vela.position.set(0, 0.25, 0); cuerpo.add(vela);
  for (let i = 0; i < 7; i++) { const h = 0.9 - Math.abs(i - 2) * 0.13; caja(vela, 0.03, h, 0.22, i % 2 ? 0x2a5ab8 : 0x234c9e, 0, h / 2, 0.6 - i * 0.22); caja(vela, 0.035, 0.05, 0.05, 0x80c8ff, 0, h * 0.5, 0.6 - i * 0.22); }
  // la cola en tijera
  const cola = new THREE.Group(); cola.position.set(0, 0.02, -0.95); cuerpo.add(cola);
  for (const s of [-1, 1]) { const a = caja(cola, 0.04, 0.5, 0.14, 0x16386a, 0, s * 0.22, -0.12); a.rotation.x = s * 0.6; }
  cuerpo.scale.setScalar(1.7); // como de tres metros, con el pico
  g.userData = { cuerpo, vela, cola };
  return g;
}
function barra(on) {
  let el = document.getElementById('vela-barra');
  if (!on) { if (el) el.remove(); return null; }
  if (!el) {
    el = document.createElement('div'); el.id = 'vela-barra';
    el.className = 'barra-mini'; // v11.13.5: el estilo vive en vidrio.css (#vela-barra)
    el.innerHTML = '<div id="vela-txt"></div><div class="barra-pista"><div id="vela-ten"></div></div><div class="barra-pista fina"><div id="vela-dist"></div></div>';
    document.body.append(el);
  }
  return el;
}
// ¿pica un pez vela? (al recoger una picada, en agua honda)
export function quizaPezVela(g, f) {
  if (g.pezVela || g.dim !== 'tierra') return false;
  if (!g.inventory.held || g.inventory.held.id !== 1101) return false; // v12.7.0 (C5-A1): el pez vela, solo con la caña de altamar
  const c = g.world.gen.column(Math.floor(f.pos.x), Math.floor(f.pos.z));
  if (c.biome !== 'ocean' || c.h > SEA - 8) return false;
  if (Math.random() > (g.meta.velas ? 0.12 : 0.2)) return false;
  const P = g.player.body.pos, dx = f.pos.x - P.x, dz = f.pos.z - P.z, l = Math.hypot(dx, dz) || 1;
  const m = modelo(); g.scene.add(m);
  g.pezVela = { f, m, dx: dx / l, dz: dz / l, D: Math.max(12, Math.min(LEJOS, l + 6)), ten: 0.2, fase: 'corre', ft: 2, t: 0, lado: 0, salto: 0 };
  g.audio.play('carrete', { vol: 1, pitch: 0.7 });
  g.audio.play('splash', { pos: f.pos, vol: 1, pitch: 0.7 });
  g.ui.toast('🎣 ¡Picó un pez vela! Clic derecho recoge: espere si corre, recoja si salta', 5200);
  return true;
}
// clic derecho durante la pelea: recoger cuerda
export function recogerPezVela(g) {
  const V = g.pezVela;
  if (!V) return false;
  const corre = V.fase === 'corre';
  V.D = Math.max(0, V.D - (corre ? 0.4 : 0.8));
  V.ten += corre ? 0.17 : V.fase === 'salta' ? 0.03 : 0.08;
  g.audio.play('carrete', { vol: 0.5, pitch: 1.1 + Math.random() * 0.2 });
  g.swing = 1; g.useCd = 0.12;
  return true;
}
function terminar(g, gano, msg) {
  const V = g.pezVela;
  if (!V) return;
  g.scene.remove(V.m); disposeModel(V.m); barra(false);
  if (V.f) V.f.remove();
  g.fishing = null; g.pezVela = null;
  if (!gano) { g.ui.toast(msg, 3400); return; }
  const M = g.meta; M.velas = (M.velas || 0) + 1;
  g.giveItem(FOTO_VELA, 1);
  g.addXP(40); gainSkill(g, 'pesca', 40);
  g.audio.play('aplausos', { ui: true, vol: 0.7 });
  g.ui.toast('📸 ¡Pez vela de dos metros! Foto, y de vuelta al mar. Le queda de recuerdo', 5200);
  g.achieve('pez_vela', 'Pez vela, y de vuelta al mar');
  if (M.velas >= 3) g.achieve('pez_vela3', 'Al timón de la pesca deportiva');
  anotar(g, 'Saqué un pez vela mar adentro. Le tomé la foto y lo devolví al agua.', '🐟');
}
// cada cuadro
export function cuadroPezVela(g, dt) {
  const V = g.pezVela;
  if (!V) return false;
  const P = g.player, p = P.body.pos, held = g.inventory.held;
  if (!P.alive || !held || !esCana(held.id) || g.dim !== 'tierra') { terminar(g, false, '🎣 Se soltó la caña… y el pez vela se fue'); return true; }
  V.t += dt; V.ft -= dt;
  // las fases del pez: corre (jala), salta (afloja) o descansa
  if (V.ft <= 0) {
    const r = Math.random();
    if (V.fase === 'corre' && r < 0.45) { V.fase = 'salta'; V.ft = 1.1; V.salto = 0; g.audio.play('splash', { pos: { x: p.x + V.dx * V.D, y: SEA, z: p.z + V.dz * V.D }, vol: 1 }); }
    else if (r < 0.5) { V.fase = 'corre'; V.ft = 1.4 + Math.random() * 1.8; V.lado = (Math.random() - 0.5) * 2; }
    else { V.fase = 'descansa'; V.ft = 1.2 + Math.random() * 1.5; }
  }
  if (V.fase === 'corre') { V.D = Math.min(LEJOS + 6, V.D + dt * 3); V.ten += dt * 0.12; }
  V.ten = Math.max(0, V.ten - dt * (V.fase === 'salta' ? 0.6 : V.fase === 'descansa' ? 0.32 : 0.06));
  // dónde anda: adelante, culebreando de lado
  const lad = Math.sin(V.t * 0.8) * 4 + V.lado * 3, x = p.x + V.dx * V.D - V.dz * lad, z = p.z + V.dz * V.D + V.dx * lad;
  let y = SEA + 0.55;
  const u = V.m.userData;
  if (V.fase === 'salta') { V.salto += dt / 1.1; y += Math.sin(Math.min(1, V.salto) * Math.PI) * 3.2; V.m.rotation.x = (0.5 - V.salto) * 1.6; if (Math.random() < dt * 25) g.particles.spawn(x, y, z, [0.85, 0.95, 1], 0, -1, 0, 0.6, 10); }
  else { V.m.rotation.x = 0; y += Math.sin(V.t * 6) * 0.06; if (Math.random() < dt * 10) g.particles.spawn(x, SEA + 1, z, [0.85, 0.95, 1], 0, 1, 0, 0.5, 6); }
  V.m.position.set(x, y, z);
  V.m.rotation.y = Math.atan2(-V.dx, -V.dz) + (V.fase === 'corre' ? Math.PI + Math.sin(V.t * 3) * 0.3 : Math.sin(V.t * 2) * 0.5);
  u.cola.rotation.y = Math.sin(V.t * (V.fase === 'corre' ? 18 : 7)) * 0.5;
  u.vela.scale.y = V.fase === 'salta' ? 1.2 : 0.75 + Math.sin(V.t * 2) * 0.05; // la vela se para al saltar
  if (V.f) { V.f.pos.x = x; V.f.pos.y = SEA + 0.5; V.f.pos.z = z; }
  g.shake = Math.max(g.shake || 0, V.ten * 0.25);
  // la barra
  const el = barra(true);
  el.querySelector('#vela-txt').textContent = V.fase === 'corre' ? '🐟 ¡Está corriendo! No recoja' : V.fase === 'salta' ? '🐟 ¡Saltó! Recoja ya' : '🐟 Descansa: recoja con cuidado';
  el.querySelector('#vela-ten').style.width = `${Math.min(100, V.ten * 100)}%`;
  el.querySelector('#vela-dist').style.width = `${Math.min(100, (V.D / (LEJOS + 6)) * 100)}%`;
  if (V.ten >= 1) { g.audio.play('toolbreak'); terminar(g, false, '🎣 ¡PAC! Se reventó la cuerda. El pez vela se fue saltando… Cuando corre, no se recoge'); return true; }
  if (V.D <= 2.5) { terminar(g, true); return true; }
  if (V.t > TIEMPO) terminar(g, false, '🎣 El pez vela se cansó menos que usted: escupió el anzuelo y se fue');
  return true;
}
export const limpiarPezVela = (g) => { const V = g.pezVela; if (!V) return; g.scene.remove(V.m); disposeModel(V.m); barra(false); g.pezVela = null; };
export function pruebaPezVela(g) {
  limpiarPezVela(g);
  if (!g.inventory.held || !esCana(g.inventory.held.id)) g.giveItem(357, 1);
  const p = g.player.body.pos, d = g.player.lookDir(), l = Math.hypot(d.x, d.z) || 1;
  const f = { pos: { x: p.x + (d.x / l) * 14, y: SEA + 0.5, z: p.z + (d.z / l) * 14 }, remove() {} };
  const m = modelo(); g.scene.add(m);
  g.pezVela = { f, m, dx: d.x / l, dz: d.z / l, D: 20, ten: 0.2, fase: 'corre', ft: 2, t: 0, lado: 0, salto: 0 };
  return 'Un pez vela en la línea: agarre la caña y recoja con clic derecho (cuando corre, espere)';
}
