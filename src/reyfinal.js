// La arena del Rey Zopilote (v12.16.1, fase 3 del diseño de jefes y final): «El Redondel de la Cumbre».
// Al usar la Corona se arma un redondel de piedra de 26 de radio con un altar y 8 faroles, y una cornisa de seguridad abajo. Para que la
// pelea no deje un cráter, CADA bloque que se cambia se anota en un diario [x, y, z, idViejo] (tope MAX_CAMBIOS) y se restaura al
// terminar, al morir, al salir al menú, al cambiar de dimensión y al cargar el mundo. `g.rey` (el estado de la pelea) NO se guarda; lo
// único que viaja en la partida es `meta.reyArena` = el diario, para que un cierre brusco de la pestaña (o un mundo guardado en plena
// pelea) se limpie solo al volver. Con invitados: arma y restaura SOLO el anfitrión; los cambios viajan por la sincronía normal de
// bloques (`setBlock` → `redCambio`), de modo que los invitados ven el redondel y también ven cómo se deshace (sin bloques fantasma).
// La Corona no se pierde: si el Rey no fue vencido, se devuelve (al morir, al salir, al cargar).
import { SOLID, BLOCK_BY_KEY as K, AIR } from './blocks.js';

export const ID_CORONA = 552; // la misma de final.js (acá para no hacer un ciclo de importaciones)
export const R_REDONDEL = 26, R_FASE2 = 18, R_FASE3 = 14, MAX_CAMBIOS = 8000, CORNISA = 6;
const llave = (x, y, z) => `${x},${y},${z}`;
const esHost = (g) => !g.meta || !g.meta.invitado;

// pone un bloque aunque su trozo no esté cargado (entonces solo queda en los cambios del mundo y se aplica al generarlo)
function poner(g, x, y, z, id) {
  const w = g.world;
  if (w.isLoaded(x, z)) w.setBlock(x, y, z, id, { updates: false }); else w.aplicarRemoto(x, y, z, id);
}
// un cambio de la pelea: anota el viejo (una sola vez por celda) y lo hace. false = no cupo o no se puede tocar
function cambiar(g, x, y, z, id) {
  const R = g.rey, w = g.world;
  if (y < 2 || y > 240 || !w.isLoaded(x, z)) return false;
  const old = w.getBlock(x, y, z);
  if (old === id) return true;
  const k = llave(x, y, z);
  if (!R.diario.has(k)) {
    if (R.diario.size >= MAX_CAMBIOS || w.getBE(x, y, z)) return false; // cofres, camas y demás con datos: no se tocan
    R.diario.set(k, [x, y, z, old]);
  }
  w.setBlock(x, y, z, id, { updates: false });
  return true;
}
// lo que viaja en la partida (solo el diario)
function sellar(g) {
  const R = g.rey;
  g.meta.reyArena = { d: [...R.diario.values()], corona: true, vencido: !!R.vencido };
}

// ---------- armar ----------
export function armarRedondel(g, px, py, pz, dirx = 0, dirz = 1) {
  if (!esHost(g) || g.dim !== 'tierra' || g.rey) return false;
  const cx = Math.floor(px), cz = Math.floor(pz), fy = Math.floor(py) - 1; // fy = la capa del piso (donde pisa el jugador)
  const R = g.rey = { cx, cz, fy, R: R_REDONDEL, diario: new Map(), piso: [], faroles: [], sendero: null, cola: [], vencido: false, t: 0, muerto: false, fase: 1 };
  const piedra = K.stone, basalto = K.basalt, ladrillo = K.cobble, farol = K.farol;
  // el piso, del centro hacia afuera (si el tope se acaba, lo que queda sin tocar es la orilla)
  const celdas = [];
  for (let dx = -R_REDONDEL; dx <= R_REDONDEL; dx++) for (let dz = -R_REDONDEL; dz <= R_REDONDEL; dz++) {
    const r = Math.hypot(dx, dz);
    if (r <= R_REDONDEL + 0.2) celdas.push({ x: cx + dx, z: cz + dz, r });
  }
  celdas.sort((a, b) => a.r - b.r);
  for (const c of celdas) {
    const banda = Math.floor(c.r / 4) % 2 === 0;
    if (!cambiar(g, c.x, fy, c.z, banda ? piedra : basalto)) continue;
    R.piso.push(c);
    for (let h = 1; h <= 3; h++) { const o = g.world.getBlock(c.x, fy + h, c.z); if (SOLID[o] || (o !== AIR && c.r > 3 && h === 1)) cambiar(g, c.x, fy + h, c.z, AIR); } // despeja matas, ramas y laderas
    if (g.world.getBlock(c.x, fy - 1, c.z) === AIR) cambiar(g, c.x, fy - 1, c.z, piedra); // que no quede hueco justo debajo
  }
  // el altar (la Corona encima) y los 8 postes con farol, en la orilla del último redondel
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) cambiar(g, cx + dx, fy + 1, cz + dz, ladrillo);
  cambiar(g, cx, fy + 2, cz, ladrillo); cambiar(g, cx, fy + 3, cz, farol);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8, x = cx + Math.round(Math.cos(a) * (R_FASE3 - 2)), z = cz + Math.round(Math.sin(a) * (R_FASE3 - 2));
    cambiar(g, x, fy + 1, z, ladrillo); cambiar(g, x, fy + 2, z, ladrillo); cambiar(g, x, fy + 3, z, farol);
    R.faroles.push({ x, y: fy + 3, z });
  }
  // el sendero baja por detrás del jugador: tres de ancho, un escalón por bloque
  const l = Math.hypot(dirx, dirz) || 1, ux = -dirx / l, uz = -dirz / l; // al revés de adonde mira (ahí nace el Rey)
  R.sendero = { ux, uz };
  for (let i = 1; i <= 10; i++) for (let l = -1; l <= 1; l++) {
    const x = Math.round(cx + ux * (R_REDONDEL + i) - uz * l), z = Math.round(cz + uz * (R_REDONDEL + i) + ux * l), y = fy - i;
    for (let h = y + 1; h <= fy + 3; h++) if (SOLID[g.world.getBlock(x, h, z)]) cambiar(g, x, h, z, AIR);
    cambiar(g, x, y, z, piedra);
  }
  // la cornisa de seguridad: 6 abajo, solo donde no hay nada (si hay ladera, la ladera ya es cornisa)
  for (const c of R.piso) if (c.r >= R_FASE3 - 1 && g.world.getBlock(c.x, fy - CORNISA, c.z) === AIR) cambiar(g, c.x, fy - CORNISA, c.z, piedra);
  sellar(g);
  if (g.red && g.red.aviso) g.red.aviso('👑 Se armó el Redondel de la Cumbre');
  return true;
}

// ---------- el anillo que se achica (fases 2 y 3) ----------
export function achicar(g, nuevo) {
  const R = g.rey;
  if (!R || nuevo >= R.R || R.cola.length) return;
  let r = R.R; const paso = (R.R - nuevo) / 3;
  for (let i = 0; i < 3; i++) { const a = i === 2 ? nuevo : Math.round(r - paso); R.cola.push({ de: r, a, t: 2, listo: false, espera: i === 0 ? 3 : 0 }); r = a; }
}
function banda(R, de, a) { return R.piso.filter((c) => c.r > a && c.r <= de + 0.2); }
function tickAnillo(g, dt) {
  const R = g.rey, P = R.cola[0];
  if (!P) return;
  if (P.espera > 0) { P.espera -= dt; return; }
  const B = banda(R, P.de, P.a);
  if (!P.listo) { // la grieta: la franja se vuelve ceniza (se ve el borde gris) y se pinta de rojo el aviso
    P.listo = true;
    for (const c of B) cambiar(g, c.x, R.fy, c.z, K.ceniza);
    g.ui.toast('⚠ ¡El borde se cae! Corra hacia el centro', 1800);
    g.audio.play('dig.stone', { ui: true, vol: 0.8, pitch: 0.4 });
  }
  P.t -= dt;
  if (P.t > 0) { for (let k = 0; k < 14 && B.length; k++) { const c = B[(Math.random() * B.length) | 0]; g.particles.spawn(c.x + 0.5, R.fy + 1.1, c.z + 0.5, [0.95, 0.2, 0.15], 0, 0.8, 0, 0.5, 0, true); } return; }
  for (const c of B) { cambiar(g, c.x, R.fy, c.z, AIR); for (let h = 1; h <= 4; h++) cambiar(g, c.x, R.fy + h, c.z, AIR); } // se cae: la cornisa lo recibe
  g.shake = Math.max(g.shake || 0, 0.35);
  g.audio.play('dig.stone', { ui: true, vol: 1, pitch: 0.3 });
  R.R = P.a; R.cola.shift(); R.piso = R.piso.filter((c) => c.r <= P.a + 0.2);
  sellar(g);
}
// lo llama final.js cuando el Rey cambia de fase
export function alFase(g, fase) {
  const R = g.rey;
  if (!R) return;
  R.fase = fase;
  if (fase === 2) achicar(g, R_FASE2);
  if (fase === 3) achicar(g, R_FASE3);
}
export function reyVencido(g) { if (g.rey) { g.rey.vencido = true; g.rey.finT = 45; g.rey.remT = 0; sellar(g); } else if (g.meta.reyArena) g.meta.reyArena.vencido = true; }

// ---------- restaurar ----------
function sacarDeSolido(g) {
  const p = g.player.body.pos, w = g.world, x = Math.floor(p.x), z = Math.floor(p.z);
  let y = Math.floor(p.y), n = 0;
  while (n < 60 && (SOLID[w.getBlock(x, y, z)] || SOLID[w.getBlock(x, y + 1, z)])) { y++; n++; }
  if (n) { p.y = y + 0.05; g.player.body.vel.y = 0; }
}
// ---------- la gente de la ladera (v12.16.5, fase 6): vecinos inmortales que suben con faroles; los maneja reyremate.js ----------
export function quitarGente(g) { for (const m of g.entities.mobs) if (m.data && m.data.reyGente) m.dead = true; }
// el sitio de la fila i del sendero (0..9) con el lado l (-1..1): siempre piedra firme, afuera del redondel (no se cae con el anillo)
export function puestoLadera(g, fila, l) {
  const R = g.rey;
  if (!R || !R.sendero) return null;
  const { ux, uz } = R.sendero, x = Math.round(R.cx + ux * (R_REDONDEL + fila) - uz * l), z = Math.round(R.cz + uz * (R_REDONDEL + fila) + ux * l);
  return g.world.isLoaded(x, z) ? { x, y: R.fy - fila + 1, z } : null;
}
// Don Anselmo tapa «una grieta»: una vez, un arco de basalto en el borde roto del primer anillo (queda en el diario: se deshace con el resto)
export function taparBorde(g) {
  const R = g.rey;
  if (!R || R.tapado) return false;
  R.tapado = true;
  const pl = g.player.body.pos, a0 = Math.atan2(pl.z - R.cz, pl.x - R.cx);
  for (let k = -5; k <= 5; k++) for (let dr = 0; dr < 2; dr++) {
    const a = a0 + k * 0.045, r = R.R + 0.6 + dr, x = Math.round(R.cx + Math.cos(a) * r), z = Math.round(R.cz + Math.sin(a) * r);
    if (g.world.getBlock(x, R.fy, z) === AIR) cambiar(g, x, R.fy, z, K.basalt);
  }
  return true;
}
function quitarRey(g) {
  for (const m of g.entities.mobs) if (m.type === 'rey_zopilote' && !m.dead && !(m.data && m.data.vencido)) m.dead = true;
  quitarEscolta(g);
  g.rayosRey = []; // los círculos de rayo que quedaran
}
// la Corona vuelve si el Rey no cayó (y se recoge la que haya quedado tirada al morir, para no duplicarla)
function devolverCorona(g) {
  if (g.mode !== 'survival') return;
  for (const it of g.entities.items) if (!it.dead && it.id === ID_CORONA) it.dead = true;
  if (g.inventory.slots.some((s) => s && s.id === ID_CORONA)) return;
  const left = g.inventory.add(ID_CORONA, 1);
  if (left > 0) (g.meta.unicosPendientes ||= []).push({ id: ID_CORONA, count: left });
  g.inventory.changed();
  g.ui.toast('👑 La Corona vuelve a su bolso', 2600);
}
// deshace todo. motivo: 'fin' | 'muerte' | 'salir' | 'carga' | 'dim'. Idempotente.
export function restaurarRedondel(g, motivo = 'fin') {
  if (!g.world || !g.meta || !esHost(g)) return false;
  const lista = g.rey ? [...g.rey.diario.values()] : (g.meta.reyArena && g.meta.reyArena.d) || [];
  const vencido = g.rey ? g.rey.vencido : !!(g.meta.reyArena && g.meta.reyArena.vencido);
  if (!g.rey && !g.meta.reyArena) return false;
  for (let i = lista.length - 1; i >= 0; i--) { const [x, y, z, old] = lista[i]; poner(g, x, y, z, old); } // al revés: lo último que se hizo, primero que se deshace
  quitarGente(g); // los vecinos se van con el redondel
  g.rey = null; g.meta.reyArena = null;
  if (g.player.alive) sacarDeSolido(g);
  if (motivo !== 'fin' || !vencido) quitarRey(g);
  if (!vencido) devolverCorona(g);
  return true;
}
// al salir del mundo (antes de guardar)
export function limpiarRey(g) { if (g.rey || (g.meta && g.meta.reyArena)) restaurarRedondel(g, 'salir'); }

// ---------- cada cuadro ----------
export function cuadroRey(g, dt) {
  if (!g.world || !g.meta || !esHost(g)) return;
  const R = g.rey;
  if (!R) {
    // un diario pendiente de otra sesión (se cerró la pestaña en plena pelea): se limpia apenas se esté en la tierra
    if (g.meta.reyArena && g.dim === 'tierra' && g.player.alive) restaurarRedondel(g, 'carga');
    return;
  }
  if (g.dim !== 'tierra') { restaurarRedondel(g, 'dim'); return; }
  if (g.paused) return;
  R.t += dt;
  if (!g.player.alive) { R.muerto = true; return; }
  if (R.muerto) { restaurarRedondel(g, 'muerte'); return; } // ya revivió (en su cama): el redondel se deshace y la Corona vuelve
  if (R.vencido) { R.finT -= dt; if (R.finT <= 0) restaurarRedondel(g, 'fin'); return; }
  if (!g.entities.mobs.some((m) => !m.dead && m.type === 'rey_zopilote')) { if (R.t > 3) restaurarRedondel(g, 'fin'); return; } // el Rey ya no está (se fue, se quitó)
  tickAnillo(g, dt);
}

// ---------- la escolta (v12.16.2): zopilotes chicos de 6 de vida que bajan a molestar (el Rey los suelta en las fases 1 y 3) ----------
// hoy son vampiros chicos con 6 de vida (procedural: no hay arte de zopilote chico; anotado en el árbol). `max` = tope vivos a la vez.
export function soltarEscolta(g, rey, n, max) {
  const vivos = g.entities.mobs.filter((m) => !m.dead && !m.dying && m.data && m.data.escolta).length;
  const b = rey.body.pos;
  for (let i = 0; i < n && vivos + i < max; i++) {
    const a = Math.random() * Math.PI * 2, m = g.entities.spawnMob('vampiro', b.x + Math.cos(a) * 3, b.y + 1, b.z + Math.sin(a) * 3);
    if (!m) continue;
    m.health = 6; m.data.escolta = true; m.data.provoked = true; m.data.vmax = 6;
  }
}
export function quitarEscolta(g) { for (const m of g.entities.mobs) if (m.data && m.data.escolta) m.dead = true; }
