// Más clima: la sequía de Guanacaste (en la segunda mitad del verano: cosechas a la mitad, más sed, remolinos de
// polvo) y el huracán ficticio «Chepe» en el Caribe (un día de tormenta con viento que empuja a quien esté a la
// intemperie y láminas de zinc volando; es solo de mentira: no rompe nada del mundo).
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { regionAt } from './regiones.js';

// ---------- sequía ----------
export function haySequia(g) {
  if (g.season !== 'verano') return false;
  const d = ((g.day || 1) - 1) % 14; // 0–6 verano, 7–13 invierno
  return d >= 3 && d <= 6;
}
export function tickSequia(g, dt) {
  g.sequia = haySequia(g);
  if (!g.sequia || g.dim !== 'tierra') { g.sequiaAviso = false; return; }
  const p = g.player.body.pos;
  if (regionAt(g.world.gen, p.x, p.z) !== 'guanacaste') return;
  if (!g.sequiaAviso) { g.sequiaAviso = true; g.ui.toast('☀ Sequía en Guanacaste: hace un calor seco, da más sed y las cosechas crecen a la mitad', 3600); g.achieve('sequia', 'Verano seco en Guanacaste'); }
  // remolinos de polvo
  g.remolinoT = (g.remolinoT ?? 8) - dt;
  if (g.remolinoT <= 0) { g.remolinoT = 12 + Math.random() * 20; g.remolino = { x: p.x + (Math.random() - 0.5) * 30, z: p.z + (Math.random() - 0.5) * 30, t: 6 }; }
  const R = g.remolino;
  if (R && R.t > 0) {
    R.t -= dt; R.x += dt * 1.5; R.z += dt * 0.8;
    const y0 = g.world.gen.column(Math.floor(R.x), Math.floor(R.z)).h + 1;
    for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2, h = Math.random() * 6, r = 0.3 + h * 0.25; g.particles.spawn(R.x + Math.cos(a) * r, y0 + h, R.z + Math.sin(a) * r, [0.72, 0.6, 0.42], -Math.sin(a) * 3, 1.2, Math.cos(a) * 3, 0.8, -0.5); }
  }
}

// ---------- huracán ficticio ----------
const lamMat = new THREE.MeshLambertMaterial({ color: 0xa8acb0 });
const lamGeo = new THREE.BoxGeometry(1.2, 0.05, 0.8);
function techo(g, p) { for (let y = Math.floor(p.y) + 2; y < Math.floor(p.y) + 25; y++) if (SOLID[g.world.getBlock(Math.floor(p.x), y, Math.floor(p.z))]) return true; return false; }
export function tickHuracan(g, dt) {
  const M = g.meta, d = g.day || 1;
  if (!M.huracan && d >= 8 && (M.huracanCd ?? 8) <= d && Math.random() < 0.0015) { M.huracan = { dia: d, dir: Math.random() * Math.PI * 2 }; M.huracanCd = d + 20 + Math.floor(Math.random() * 10); }
  if (M.huracan && d > M.huracan.dia) { M.huracan = null; g.huracanAviso = false; quitarLaminas(g); return; }
  if (!M.huracan || g.dim !== 'tierra') { quitarLaminas(g); return; }
  const p = g.player.body.pos;
  const cerca = ['caribe', 'norte'].includes(regionAt(g.world.gen, p.x, p.z));
  if (!cerca) { quitarLaminas(g); return; }
  if (!g.huracanAviso) { g.huracanAviso = true; g.ui.toast('🌀 ¡El huracán «Chepe» (ficticio) pasa cerca del Caribe! Vientos muy fuertes: busque techo', 4000); g.achieve('huracan', 'Sobreviví al huracán Chepe'); }
  if (g.weather && g.weather.type !== 'storm') { g.weather.set('storm'); g.weather.timer = 900; }
  const dir = M.huracan.dir + Math.sin((g.clock || 0) * 0.1) * 0.4;
  // el viento empuja a quien esté a la intemperie
  if (!g.riding && !techo(g, p)) { const b = g.player.body; b.vel.x += Math.cos(dir) * 9 * dt; b.vel.z += Math.sin(dir) * 9 * dt; const v = Math.hypot(b.vel.x, b.vel.z); if (v > 9) { b.vel.x *= 9 / v; b.vel.z *= 9 / v; } } // v12.1.3: con tope (9 m/s)
  // hojas y basura volando
  for (let k = 0; k < 5; k++) g.particles.spawn(p.x - Math.cos(dir) * 15 + (Math.random() - 0.5) * 20, p.y + Math.random() * 8, p.z - Math.sin(dir) * 15 + (Math.random() - 0.5) * 20, Math.random() < 0.6 ? [0.3, 0.55, 0.2] : [0.5, 0.42, 0.3], Math.cos(dir) * 18, (Math.random() - 0.3) * 3, Math.sin(dir) * 18, 1.6, 0.5);
  // láminas de zinc que pasan volando (de mentira)
  const L = (g.laminas = g.laminas || []);
  if (L.length < 6 && Math.random() < dt * 1.3) {
    const m = new THREE.Mesh(lamGeo, lamMat);
    m.position.set(p.x - Math.cos(dir) * 30 + (Math.random() - 0.5) * 20, p.y + 3 + Math.random() * 8, p.z - Math.sin(dir) * 30 + (Math.random() - 0.5) * 20);
    g.scene.add(m); L.push({ m, t: 4 });
    g.audio.play('hueco', { pos: { x: m.position.x, y: m.position.y, z: m.position.z }, vol: 0.4, pitch: 2.2 });
  }
  for (const l of L) { l.t -= dt; l.m.position.x += Math.cos(dir) * 16 * dt; l.m.position.z += Math.sin(dir) * 16 * dt; l.m.position.y += Math.sin(l.t * 5) * dt * 2; l.m.rotation.x += dt * 9; l.m.rotation.y += dt * 4; }
  for (let i = L.length - 1; i >= 0; i--) if (L[i].t <= 0) { g.scene.remove(L[i].m); L.splice(i, 1); }
}
function quitarLaminas(g) { if (g.laminas) { for (const l of g.laminas) g.scene.remove(l.m); g.laminas = []; } }
