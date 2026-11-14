// Las ermitas de camino (v5.9): esas capillitas de cemento con su cruz que hay a la orilla de las carreteras. Uno las hace (tres
// piedras, una antorcha y una flor amarilla), las pone donde quiera y, con clic derecho, viaja a cualquier otra ermita que haya puesto:
// para volver a la casa o ir lejos a pelear sin caminar horas. Con criaturas bravas cerca no se puede (hay que salir del apuro
// primero), y entre viaje y viaje hay que esperar un ratito. Estado: meta.ermitas [{ x, y, z, nombre }] (se guarda).
import { BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { regionAt, REGIONES } from './regiones.js';

const ESPERA = 20;
const nombreDe = (g, x, z) => {
  const near = g.nearestVillage && g.nearestVillage(x, z);
  if (near && near.v.name && near.dist < 160) return `Ermita de ${near.v.name}`;
  const r = REGIONES[regionAt(g.world.gen, x, z)];
  return `Ermita de ${r ? r.name : 'camino'}`;
};
const lista = (g) => (g.meta.ermitas ||= []);
function registrar(g, x, y, z) {
  const L = lista(g);
  let e = L.find((q) => q.x === x && q.y === y && q.z === z);
  if (!e) {
    let nombre = nombreDe(g, x, z);
    const iguales = L.filter((q) => q.nombre.startsWith(nombre)).length;
    if (iguales) nombre += ` (${iguales + 1})`;
    e = { x, y, z, nombre };
    L.push(e);
    g.ui.toast(`⛪ ${nombre}: queda en la lista de ermitas`, 2400);
    g.achieve('ermita', 'La primera ermita');
    if (L.length >= 5) g.achieve('ermitas5', 'Cinco ermitas en el camino');
  }
  return e;
}
// clic derecho a una ermita: la lista para viajar
export function usarErmita(g, t) {
  if (!t || t.id !== K.ermita || g.dim !== 'tierra') return false;
  if (g.riding || g.zip || g.monta || g.vagon || g.globoViaje || g.planeo) { g.ui.toast('⛪ Bájese primero', 1500); return true; }
  const aqui = registrar(g, t.x, t.y, t.z);
  const otras = lista(g).filter((q) => q !== aqui);
  if (!otras.length) { g.ui.toast('⛪ Ponga otra ermita en otro lado y podrá viajar entre las dos', 2600); return true; }
  abrirLista(g, aqui, otras);
  return true;
}
// una ventana modal: el juego queda quieto y sin teclas (ui.state 'modal'); Esc la cierra
export function abrirModal(g, el, alCerrar) {
  g.releaseAll && g.releaseAll();
  g.ui.exitLock && g.ui.exitLock();
  g.paused = true; g.ui.state = 'modal';
  el.classList.add('modal-entra');
  document.body.appendChild(el);
  const tecla = (e) => { if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); cerrar(true); } };
  const cerrar = (relock) => {
    window.removeEventListener('keydown', tecla, true);
    if (document.body.classList.contains('calma')) el.remove();
    else { el.classList.remove('modal-entra'); el.classList.add('modal-sale'); setTimeout(() => el.remove(), 150); }
    if (g.running) { g.paused = false; g.ui.state = 'playing'; if (relock && g.ui.requestLock) g.ui.requestLock(); }
    if (alCerrar) alCerrar();
  };
  window.addEventListener('keydown', tecla, true);
  return cerrar;
}
function abrirLista(g, aqui, otras) {
  if (typeof document === 'undefined' || document.getElementById('ermitas')) return;
  const el = document.createElement('div');
  el.id = 'ermitas';
  const filas = otras.map((q, i) => ({ q, i, d: Math.round(Math.hypot(q.x - aqui.x, q.z - aqui.z)) })).sort((a, b) => a.d - b.d);
  el.innerHTML = `<div class="panel"><h2>⛪ ${aqui.nombre}</h2><p>¿A cuál ermita va?</p>${filas.map((f) => `<button data-i="${f.i}">${f.q.nombre} · ${f.d} bloques</button>`).join('')}<button class="cerrar">Quedarse aquí</button></div>`;
  const cerrar = abrirModal(g, el);
  el.querySelector('.cerrar').addEventListener('click', () => cerrar(true));
  el.querySelectorAll('button[data-i]').forEach((b) => b.addEventListener('click', () => { const q = otras[Number(b.dataset.i)]; cerrar(false); viajar(g, q); }));
}
function viajar(g, q) {
  const ck = g.clock || 0, p = g.player.body.pos;
  if ((g.meta.ermitaCd || 0) > ck) { g.ui.toast(`⛪ Todavía no: espere ${Math.ceil(g.meta.ermitaCd - ck)} segundos`, 1800); g.ui.requestLock && g.ui.requestLock(); return; }
  if (g.mode === 'survival' && g.entities.mobs.some((m) => !m.dead && !m.kind.pasivo && (m.kind.hostile || m.kind.boss) && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 14)) { g.ui.toast('⛪ Con criaturas bravas cerca no se puede: salga del apuro primero', 2400); g.ui.requestLock && g.ui.requestLock(); return; }
  g.meta.ermitaCd = ck + ESPERA;
  g.audio.play('campana', { ui: true, vol: 0.6, pitch: 0.9 });
  g.paused = true; // quieto mientras dura el fundido
  g.ui.sleepFade(() => {
    if (!g.running || !g.world || !g.player.alive) return; // salió del mundo o se murió en el fundido
    // al lado de la ermita, en un lugar libre
    let y = q.y;
    const x = q.x + 0.5, z = q.z + 1.5;
    while (y < q.y + 6 && (SOLID[g.world.getBlock(Math.floor(x), y, Math.floor(z))] || SOLID[g.world.getBlock(Math.floor(x), y + 1, Math.floor(z))])) y++;
    p.x = x; p.y = y; p.z = z;
    g.player.body.vel.x = g.player.body.vel.y = g.player.body.vel.z = 0; g.player.body.fallStart = null;
    g.ready = false; // que cargue el mundo de allá antes de soltar al jugador
    g.achieve('ermita_viaje', 'De ermita en ermita');
  }, () => { if (!g.running) return; g.paused = false; if (!g.player.alive) return; g.ui.toast(`⛪ ${q.nombre}`, 2200); g.ui.requestLock && g.ui.requestLock(); }, `Rumbo a la ${q.nombre.replace(/^Ermita/, 'ermita')}…`);
}
// si una ermita ya no está (la quitaron), sale de la lista cuando se pasa cerca
export function revisarErmitas(g) {
  const L = g.meta && g.meta.ermitas;
  if (!L || !L.length || g.dim !== 'tierra') return;
  const p = g.player.body.pos;
  g.meta.ermitas = L.filter((q) => Math.hypot(q.x - p.x, q.z - p.z) > 24 || !g.world.isLoaded(q.x, q.z) || g.world.getBlock(q.x, q.y, q.z) === K.ermita);
}
