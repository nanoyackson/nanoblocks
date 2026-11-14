// El abigeato: algunas noches, cerca de la casa, dos Chatas llegan a robarse una vaca. Uno le echa el mecate y se la lleva
// despacito monte adentro; el otro se queda atajando. Si se tumba al que la jala, la vaca queda libre. Si llega lejos, se perdió.
// Estado: g.abigeato (no se guarda), meta.abigeatoCd (día).
import * as THREE from 'three';
import { difOf } from './supervivencia.js';
import { puestoSombra } from './asedio.js';
import { anotar } from './diario.js';

const LEJOS = 55;
function casaDe(g) { const H = g.meta.hist; return H && H.casa ? H.casa : g.meta.spawn; }
function mecate(g) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xc8a868 })); l.frustumCulled = false; g.scene.add(l); return l; }
export function limpiarAbigeato(g) {
  const A = g.abigeato;
  if (!A) return;
  if (A.linea) { g.scene.remove(A.linea); A.linea.geometry.dispose(); A.linea.material.dispose(); }
  if (A.vaca && !A.vaca.dead && A.vaca.data.animo && A.vaca.data.animo.tipo === 'robada') A.vaca.data.animo = null;
  if (A.lider && !A.lider.dead && A.lider.data.animo) A.lider.data.animo = null;
  g.abigeato = null;
}
function empezar(g, vaca) {
  const p = g.player.body.pos, a = Math.atan2(vaca.body.pos.z - p.z, vaca.body.pos.x - p.x);
  const chatas = [];
  for (let i = 0; i < 2; i++) {
    const q = puestoSombra(g, vaca.body.pos.x, vaca.body.pos.z, Math.floor(vaca.body.pos.y), a + (i ? 0.5 : -0.5), 6);
    if (!q) return false;
    const m = g.entities.spawnMob('chata', q.x + 0.5, q.y + 0.1, q.z + 0.5);
    if (m) { m.data.apuro = true; chatas.push(m); }
  }
  if (chatas.length < 2) { for (const m of chatas) m.dead = true; return false; }
  const lider = chatas[0], huye = { x: vaca.body.pos.x + Math.cos(a) * LEJOS, z: vaca.body.pos.z + Math.sin(a) * LEJOS };
  lider.data.animo = { tipo: 'abigeo' }; lider.data.name = 'Chata con mecate';
  vaca.data.animo = { tipo: 'robada' };
  g.abigeato = { vaca, lider, otro: chatas[1], huye, x0: vaca.body.pos.x, z0: vaca.body.pos.z, linea: mecate(g), t: 0 };
  g.audio.play('vaca', { pos: vaca.soundPos(), vol: 1, pitch: 0.8 });
  g.ui.toast('🐄 ¡Se llevan una vaca! Unos Chatas la jalan: alcance al del mecate', 5000);
  return true;
}
// cada segundo
export function tickAbigeato(g) {
  if (g.abigeato || g.dim !== 'tierra' || g.mode !== 'survival' || !g.meta || !g.player.alive) return;
  const M = g.meta, d = g.day || 1;
  if (d < 6 || (M.abigeatoCd || 0) > d || g.daylight > 0.2 || !g.settings.hostiles || !difOf(g).hostiles || Math.random() > 1 / 180) return;
  const casa = casaDe(g), p = g.player.body.pos;
  if (!casa || Math.hypot(casa.x - p.x, casa.z - p.z) > 70) return;
  const vaca = g.entities.mobs.find((m) => m.type === 'vaca' && !m.dead && !m.dying && !m.data.animo && !m.tamed && !m.data.arreo && !m.data.sigue && Math.hypot(m.body.pos.x - casa.x, m.body.pos.z - casa.z) < 45 && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 50);
  if (!vaca) return;
  M.abigeatoCd = d + 5;
  empezar(g, vaca);
}
// cada cuadro
export function cuadroAbigeato(g, dt) {
  const A = g.abigeato;
  if (!A) return;
  if (g.dim !== 'tierra') { limpiarAbigeato(g); return; }
  A.t += dt;
  const { vaca, lider } = A;
  if (vaca.dead || vaca.dying) { limpiarAbigeato(g); return; }
  if (lider.dead && !lider.dying) { vaca.data.animo = null; limpiarAbigeato(g); return; } // se perdió de vista: ni rescate ni robo
  if (lider.dying) {
    vaca.data.animo = null;
    g.ui.toast('🐄 ¡Tumbó al del mecate! La vaca quedó libre y se vuelve sola para la casa', 3600);
    g.achieve('abigeato', 'No se llevaron la vaca');
    g.meta.reputation = (g.meta.reputation || 0) + 1;
    anotar(g, 'Unos Chatas se querían llevar una vaca. No pudieron.', '🐄');
    limpiarAbigeato(g);
    return;
  }
  // el del mecate camina monte adentro, mirando para atrás; la vaca va jalada, a tirones
  lider.goTo(A.huye.x, A.huye.z, 0.55);
  const lb = lider.body.pos, vb = vaca.body.pos, dl = Math.hypot(lb.x - vb.x, lb.z - vb.z);
  if (dl > 2.2) vaca.goTo(lb.x, lb.z, 1.3); else vaca.moving = false;
  if (Math.random() < dt * 0.4) g.audio.play('vaca', { pos: vaca.soundPos(), vol: 0.9, pitch: 0.85 });
  const pos = A.linea.geometry.attributes.position;
  pos.setXYZ(0, lb.x, lb.y + 1.1, lb.z); pos.setXYZ(1, vb.x, vb.y + 1.0, vb.z + 0.4); pos.needsUpdate = true;
  if (Math.hypot(vb.x - A.x0, vb.z - A.z0) > LEJOS - 4 || A.t > 150) {
    g.ui.toast('🐄 Se perdieron en el monte con la vaca… Mañana los vecinos van a preguntar', 4200);
    vaca.dead = true; lider.dead = true;
    limpiarAbigeato(g);
  }
}
export function pruebaAbigeato(g) {
  limpiarAbigeato(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  const vaca = g.entities.spawnMob('vaca', p.x + d.x * 8, p.y + 0.5, p.z + d.z * 8);
  if (!vaca) return 'No se pudo poner la vaca';
  return empezar(g, vaca) ? 'Dos Chatas se llevan una vaca: alcance al del mecate' : 'Aquí no hay dónde ponerlos: pruebe en terreno abierto';
}
