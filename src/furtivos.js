// Cazadores furtivos: en el monte (selva, bosque, nuboso), lejos de los pueblos, a veces un cazador ilegal deja cepos escondidos
// en el zacate, y en uno ya cayó un venado o un tepezcuintle. El cazador sale corriendo si lo ven. Pisar un cepo duele y enreda;
// agachado junto a uno (Shift) se desarma con cuidado. Con los tres desarmados, uno le avisa al guardaparques (de un sistema
// de áreas de conservación ficticio) y hay recompensa. Estado: g.furtivos (no se guarda), meta.furtivosCd (día).
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { disposeModel } from './models.js';
import { anotar } from './diario.js';

const COLON = 360, N = 3;
function cepo() {
  const g = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const c = (w, h, d, col, x, y, z, rx = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(col)); m.position.set(x, y, z); m.rotation.x = rx; g.add(m); return m; };
  c(0.7, 0.04, 0.7, 0x3a3a3e, 0, 0.02, 0); // la base
  c(0.12, 0.06, 0.12, 0x6a6a72, 0, 0.06, 0); // el plato
  const q1 = c(0.66, 0.05, 0.05, 0x5a5a62, 0, 0.09, 0.3, -0.5), q2 = c(0.66, 0.05, 0.05, 0x5a5a62, 0, 0.09, -0.3, 0.5); // las quijadas abiertas
  for (let i = 0; i < 5; i++) { c(0.04, 0.08, 0.04, 0x8a8a92, -0.26 + i * 0.13, 0.13, 0.27); c(0.04, 0.08, 0.04, 0x8a8a92, -0.26 + i * 0.13, 0.13, -0.27); } // los dientes
  c(0.04, 0.02, 0.8, 0x4a4a50, 0.4, 0.02, 0.2); // la cadena
  g.userData = { q1, q2 };
  return g;
}
function suelo(g, x, z, y0) { let y = Math.floor(y0) + 6; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
function cerrar(c) { c.cerrado = true; c.mesh.userData.q1.rotation.x = 0.1; c.mesh.userData.q2.rotation.x = -0.1; c.mesh.userData.q1.position.z = 0.06; c.mesh.userData.q2.position.z = -0.06; }
function armar(g, cx, cz) {
  const cepos = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + Math.random(), r = 4 + Math.random() * 6, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    const y = suelo(g, x, z, g.player.body.pos.y), mesh = cepo();
    mesh.position.set(Math.floor(x) + 0.5, y, Math.floor(z) + 0.5); mesh.rotation.y = Math.random() * 3;
    g.scene.add(mesh);
    cepos.push({ x: Math.floor(x) + 0.5, y, z: Math.floor(z) + 0.5, mesh, cerrado: false, desarmado: false, agachado: 0, presa: null });
  }
  // en uno ya cayó un animal
  const c0 = cepos[0], tipo = Math.random() < 0.5 ? 'venado' : 'tepezcuintle', m = g.entities.spawnMob(tipo, c0.x, c0.y + 0.2, c0.z);
  if (m) { m.data.animo = { tipo: 'atrapado' }; c0.presa = m; cerrar(c0); }
  // el cazador, un poco más allá
  const h = g.entities.spawnMob('vecino', cx + 8, suelo(g, cx + 8, cz, g.player.body.pos.y) + 0.1, cz);
  if (h) Object.assign(h.data, { role: 'vecino', name: 'Cazador furtivo', furtivo: true, seed: 4242, home: { x: Math.floor(cx + 8), y: 0, z: Math.floor(cz) }, plaza: { x: Math.floor(cx + 8), y: 0, z: Math.floor(cz) }, vid: 'furtivo', animo: { tipo: 'furtivo' } });
  if (h && h.kind.dress) h.kind.dress(h);
  g.furtivos = { cepos, cazador: h, x: cx, z: cz, huyo: false, avisado: false };
}
function quitarTirados(g) { for (const m of g.cepostirados || []) { g.scene.remove(m); disposeModel(m); } g.cepostirados = []; }
export function limpiarFurtivos(g, todo = false) {
  if (todo) quitarTirados(g);
  const F = g.furtivos;
  if (!F) return;
  for (const c of F.cepos) { g.scene.remove(c.mesh); disposeModel(c.mesh); if (c.presa && !c.presa.dead && c.presa.data.animo) c.presa.data.animo = null; }
  if (F.cazador && !F.cazador.dead) F.cazador.dead = true;
  g.furtivos = null;
}
const monte = (g) => g.env && ['jungle', 'forest', 'nuboso'].includes(g.env.biome);
// cada segundo
export function tickFurtivos(g) {
  if (g.cepostiradosT && --g.cepostiradosT <= 0) quitarTirados(g);
  const p = g.player.body.pos, F = g.furtivos;
  if (F) {
    if (g.dim !== 'tierra' || Math.hypot(p.x - F.x, p.z - F.z) > 90) { limpiarFurtivos(g); return; }
    if (!F.avisado && Math.hypot(p.x - F.x, p.z - F.z) < 20) { F.avisado = true; g.ui.toast('⚠ Algo brilla en el zacate… parecen cepos de metal. Hay un cazador furtivo por aquí', 4200); }
    return;
  }
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.meta || (g.day || 1) < 4 || (g.meta.furtivosCd || 0) > (g.day || 1) || g.daylight < 0.4 || !monte(g) || Math.random() > 1 / 300) return;
  const v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (v && v.dist < 80) return;
  g.meta.furtivosCd = (g.day || 1) + 3;
  const d = g.player.lookDir();
  armar(g, p.x + d.x * 14, p.z + d.z * 14);
}
// cada cuadro: pisar, desarmar, el cazador que huye
export function cuadroFurtivos(g, dt) {
  const F = g.furtivos;
  if (!F) return;
  const P = g.player, p = P.body.pos;
  const h = F.cazador;
  if (h && !h.dead) {
    const d = Math.hypot(h.body.pos.x - p.x, h.body.pos.z - p.z);
    if (!F.huyo && d < 11) { F.huyo = true; g.ui.toast('🏃 ¡El cazador furtivo lo vio y salió corriendo monte adentro!', 3000); g.audio.play('dig.leaves', { pos: h.soundPos(), vol: 1 }); }
    if (F.huyo) { const ax = h.body.pos.x - p.x, az = h.body.pos.z - p.z, l = Math.hypot(ax, az) || 1; h.goTo(h.body.pos.x + (ax / l) * 10, h.body.pos.z + (az / l) * 10, 2.2); if (d > 40) { h.dead = true; F.cazador = null; } }
  }
  for (const c of F.cepos) {
    if (c.desarmado) continue;
    if (c.presa && !c.presa.dead) { const b = c.presa.body.pos; b.x = c.x; b.z = c.z; c.presa.moving = false; if (Math.random() < dt * 0.3) g.audio.play('danta.hurt', { pos: { x: c.x, y: c.y + 0.5, z: c.z }, vol: 0.4, pitch: 1.6 }); }
    const d = Math.hypot(c.x - p.x, c.z - p.z);
    // pisarlo
    if (!c.cerrado && d < 0.55 && Math.abs(p.y - c.y) < 0.6 && !P.sneaking && g.mode === 'survival') {
      cerrar(c);
      g.damagePlayer(3, null, null, 'Pisó un cepo de cazador', true, false);
      g.addEffect('enredado', 4); g.shake = Math.max(g.shake || 0, 0.5);
      g.audio.play('chancleta.golpe', { ui: true, vol: 1, pitch: 0.7 });
      g.ui.toast('🦶 ¡AY! ¡Pisó un cepo! Agáchese (Shift) junto a los demás para desarmarlos con cuidado', 3600);
    }
    // desarmarlo agachado al lado
    if (d < 1.6 && P.sneaking) {
      c.agachado += dt;
      if (Math.random() < dt * 6) g.particles.spawn(c.x, c.y + 0.2, c.z, [0.6, 0.6, 0.65], 0, 0.6, 0, 0.3, 8);
      if (c.agachado > 1.5) {
        c.desarmado = true; cerrar(c);
        c.mesh.rotation.z = 1.2; c.mesh.position.y += 0.15; // de lado, desarmado
        g.audio.play('chest.close', { pos: { x: c.x, y: c.y, z: c.z }, vol: 0.6, pitch: 1.4 });
        if (c.presa && !c.presa.dead) { c.presa.data.animo = null; c.presa.panic = 4; g.ui.toast('🦌 ¡Lo soltó! Sale cojeando monte adentro… pero vivo', 3000); g.achieve('furtivo_presa', 'Liberé al animal del cepo'); c.presa = null; }
        else g.ui.toast(`🔧 Cepo desarmado (${F.cepos.filter((q) => q.desarmado).length} de ${N})`, 2000);
      }
    } else c.agachado = 0;
  }
  if (F.cepos.every((c) => c.desarmado)) {
    g.giveItem(COLON, 30);
    g.meta.reputation = (g.meta.reputation || 0) + 2;
    g.ui.toast('📻 Guardaparques (ficticio): «¡Gracias por la denuncia!» Le dan ₡30', 5000);
    g.achieve('furtivos', 'Desarmé los cepos del cazador furtivo');
    anotar(g, 'Encontré cepos de un cazador furtivo en el monte y los desarmé.', '⚠');
    g.cepostirados = (g.cepostirados || []).concat(F.cepos.map((c) => c.mesh)); F.cepos = []; // los cepos desarmados se quedan un rato tirados
    g.cepostiradosT = 20;
    limpiarFurtivos(g);
  }
}
export function marcaFurtivos(g) { const F = g.furtivos; return F && F.avisado && g.dim === 'tierra' ? { x: F.x, z: F.z } : null; }
export function pruebaFurtivos(g) {
  limpiarFurtivos(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  armar(g, p.x + d.x * 10, p.z + d.z * 10);
  return 'Tres cepos escondidos adelante (en uno cayó un animal) y el cazador más allá. Agáchese (Shift) junto a cada cepo para desarmarlo';
}
