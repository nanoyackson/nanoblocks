// El concurso de gallo pinto: los días de fiesta, de día, en la plaza ponen una mesa con ollas y un jurado (Doña Hortensia, que
// lleva cuarenta años juzgando). Se le lleva un gallo pinto en la mano (clic derecho al jurado): lo prueba, lo califica contra el de
// los vecinos y, si gana, da premio. Una vez por día de fiesta. La nota sube con la habilidad de cocina y si el pinto lleva huevo.
// Estado: g.concurso (la mesa y el jurado; no se guarda), meta.concursoDia, meta.concursoGanados.
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { fiestaHoy } from './fiestas2.js';
import { disposeModel } from './models.js';
import { decir } from './misiones.js';
import { lv } from './habilidades.js';

export const CUCHARA = 534;
const COLON = 360, PINTO = 263, PINTO_HUEVO = 350;
const RIVALES = ['Doña Flor', 'Don Toño', 'Doña Chepa', 'Don Melvin', 'Doña Yamileth', 'Don Rigoberto', 'Doña Cuqui'];
const deDia = (g) => { const t = g.time || 0; return t > 0.05 && t < 0.4; };
function mesa(g, x, y, z) {
  const grupo = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const caja = (w, h, d, c, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(px, py, pz); grupo.add(m); return m; };
  caja(3.2, 0.12, 1.2, 0x8a6438, 0, 0.9, 0); // la mesa
  for (const [sx, sz] of [[-1.5, -0.5], [1.5, -0.5], [-1.5, 0.5], [1.5, 0.5]]) caja(0.1, 0.9, 0.1, 0x6a4a28, sx, 0.45, sz);
  caja(3.3, 0.02, 1.3, 0xe8e0c8, 0, 0.97, 0); // el mantel
  for (let i = 0; i < 4; i++) { const x0 = -1.2 + i * 0.8; caja(0.4, 0.28, 0.4, 0x2a2a2e, x0, 1.12, 0); caja(0.34, 0.04, 0.34, i % 2 ? 0x5a3a20 : 0x4a2e1a, x0, 1.27, 0); } // las ollas de pinto
  caja(0.6, 0.5, 0.04, 0xf0e8d0, 0, 1.45, -0.62); // el rótulo
  caja(0.5, 0.08, 0.05, 0xc02020, 0, 1.6, -0.6);
  grupo.position.set(x, y, z);
  g.scene.add(grupo);
  return grupo;
}
function suelo(g, x, z, y0) { let y = Math.floor(y0) + 8; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
export function quitarConcurso(g) {
  const C = g.concurso;
  if (!C) return;
  g.scene.remove(C.mesa); disposeModel(C.mesa);
  if (C.jurado && !C.jurado.dead) C.jurado.dead = true;
  g.concurso = null;
}
function armar(g, v) {
  const x = Math.floor(v.x) + 0.5, z = Math.floor(v.z) - 6 + 0.5, y = suelo(g, x, z, v.y || g.player.body.pos.y);
  const j = g.entities.spawnMob('vecino', x, y + 0.1, z - 1.4);
  if (!j) return;
  Object.assign(j.data, { role: 'jurado', name: 'Doña Hortensia, jurado del concurso', home: { x: Math.floor(x), y, z: Math.floor(z - 1.4) }, plaza: { x: Math.floor(x), y, z: Math.floor(z - 1.4) }, vid: `jurado:${v.id}`, seed: 77777, animo: { tipo: 'jurado' } });
  if (j.kind.dress) j.kind.dress(j);
  g.concurso = { mesa: mesa(g, x, y, z), jurado: j, x, y, z };
}
// cada segundo
export function tickConcurso(g) {
  const C = g.concurso, p = g.player.body.pos;
  if (C && !C.jurado.dead) { const j = C.jurado, d = Math.hypot(p.x - j.body.pos.x, p.z - j.body.pos.z); j.moving = false; if (d < 8) j.targetYaw = Math.atan2(p.x - j.body.pos.x, p.z - j.body.pos.z); }
  const hoy = g.dim === 'tierra' && !!fiestaHoy(g) && deDia(g);
  if (C && ((!hoy && !C.prueba) || Math.hypot(p.x - C.x, p.z - C.z) > 90 || C.jurado.dead)) { quitarConcurso(g); return; }
  if (C || !hoy) return;
  const v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 50 || !g.world.isLoaded(v.v.x, v.v.z - 6)) return;
  armar(g, v.v);
  if (g.mode === 'survival' && g.meta.concursoAviso !== g.day) { g.meta.concursoAviso = g.day; g.ui.toast('🍳 Concurso de gallo pinto en la plaza: lleve uno y déselo al jurado', 4200); }
}
// clic derecho al jurado
export function juradoInteract(m, g) {
  if (m.data.role !== 'jurado') return false;
  const M = g.meta, held = g.inventory.held;
  if ((M.concursoDia || 0) === (g.day || 1)) { decir(g, m, 'Ya probé el suyo hoy, mi amor. El otro día de fiesta, otra vez.', 3); return true; }
  if (!held || (held.id !== PINTO && held.id !== PINTO_HUEVO)) { decir(g, m, '¿Y el gallo pinto? Tráigalo en la mano, que aquí se juzga es pinto.', 3); return true; }
  g.inventory.consumeHeld(1);
  M.concursoDia = g.day || 1;
  // la nota: el plato, la mano en la cocina y la suerte del día
  const nota = Math.min(10, (held.id === PINTO_HUEVO ? 6.2 : 5) + lv(g, 'cocina') * 0.32 + Math.random() * 2.4);
  const rivales = [...RIVALES].sort(() => Math.random() - 0.5).slice(0, 3).map((n) => ({ n, nota: 6 + Math.random() * 2.6 }));
  const mejor = rivales.reduce((a, b) => (b.nota > a.nota ? b : a));
  const gano = nota > mejor.nota;
  const f = (x) => x.toFixed(1).replace('.', ',');
  decir(g, m, gano ? '¡Esto sí es un gallo pinto! Bien sudadito, con su culantro…' : nota > 7 ? 'Rico, rico… pero le faltó un poquito de algo.' : 'Mmm… ¿esto es de paquete? Siga practicando.', 3.6);
  g.ui.toast(`🍳 Concurso de gallo pinto — usted: ${f(nota)} · ${rivales.map((r) => `${r.n}: ${f(r.nota)}`).join(' · ')}`, 6000);
  if (gano) {
    M.concursoGanados = (M.concursoGanados || 0) + 1;
    g.giveItem(COLON, 20);
    if (M.concursoGanados === 1) g.giveItem(CUCHARA, 1);
    g.audio.play('aplausos', { ui: true, vol: 0.9 });
    setTimeout(() => g.ui.toast(`🏆 ¡Ganó el concurso de gallo pinto! ₡20${M.concursoGanados === 1 ? ' y la Cuchara de Oro del concurso' : ''}. ${mejor.n} no se lo cree`, 4200), 1200);
    g.achieve('concurso_pinto', 'El mejor gallo pinto del pueblo');
    if (M.concursoGanados >= 3) g.achieve('concurso_pinto3', 'Tres veces el mejor gallo pinto');
  } else g.audio.play('aplausos', { ui: true, vol: 0.3, pitch: 0.9 });
  return true;
}
export function pruebaConcurso(g) {
  quitarConcurso(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  armar(g, { x: p.x + d.x * 5, z: p.z + d.z * 5 + 6, y: p.y, id: 'prueba' });
  if (g.concurso) g.concurso.prueba = true;
  g.meta.concursoDia = 0; g.giveItem(PINTO_HUEVO, 2);
  return 'La mesa del concurso delante, con Doña Hortensia: agarre el gallo pinto y clic derecho a ella';
}
