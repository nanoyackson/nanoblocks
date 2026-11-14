// El Archivo Municipal (sátira ficticia): una mazmorra bajo el monte, «Bodega 3, por falta de espacio». Nueve oficinas con funcionarios de turno, tres
// sellos que hay que juntar para que abra la Ventanilla, y la Jefa de Ventanilla, que no atiende: despacha. Adentro está el expediente que Zenaida metió
// hace años. Es contenido de medio juego, que paga con un arma propia. Estado: meta.archivo; la pelea, g.ventanilla (no se guarda).
import { BLOCK_BY_KEY as K, AIR } from './blocks.js';
import { anotar } from './diario.js';
import { entregarCarta } from './historia.js';
import { puestoSombra } from './asedio.js';
import { sitioLibre } from './encargos.js';
import { CARTAS_CORREO } from './correo_cartas.js';
import { difOf } from './supervivencia.js';
import { anilloAviso, COLOR_AVISO } from './golpes.js';

export const SELLO = 519, SELLO_GOMA = 520;
const COLON = 360, ESENCIA = 499, TAM = 9, CELDA = 10, HONDO = 13, ALTO = 5;
const PLACAS = [
  ['Pida su número', 'El dispensador da el 4.812. En la pantalla dice: «Atendiendo: 12». La pantalla tiene polvo.'],
  ['Horario', 'Lunes a viernes, de 10 a 11. Cerrado por almuerzo de 10 a 11.'],
  ['Aviso', 'Se les recuerda a los funcionarios que ya fallecidos deben igual marcar tarjeta.'],
  ['Sala de espera', 'Una silla con una Sombra de polvo en la forma de alguien que esperó mucho.'],
  ['Archivo', 'Expedientes del 1 al 40.000. El 40.001 está en estudio.'],
  ['Requisitos', 'Tres sellos: el de Trámite, el de Visto Bueno y el de Vuelva Mañana. Los tres en Ventanilla.'],
  ['Buzón de sugerencias', 'Está lleno. Lo tapiaron.'],
  ['Felicitaciones', 'Empleado del mes: nadie. Enero de 1978.'],
];

// ---------- dónde ----------
function sitio(g, H) {
  const gen = g.world.gen;
  for (const [a0, b0, tol] of [[160, 300, 3], [130, 460, 5], [100, 700, 9]]) for (let t = 0; t < 200; t++) {
    const a = Math.random() * Math.PI * 2, r = a0 + Math.random() * (b0 - a0);
    const x = Math.floor(H.casa.x + Math.cos(a) * r), z = Math.floor(H.casa.z + Math.sin(a) * r), c = gen.column(x, z);
    if (c.h <= 70 || c.h > 100 || ['ocean', 'beach', 'manglar', 'volcano'].includes(c.biome)) continue;
    let plano = true;
    for (let dx = -18; dx <= 18 && plano; dx += 6) for (let dz = -18; dz <= 18; dz += 6) if (Math.abs(gen.column(x + dx, z + dz).h - c.h) > tol) { plano = false; break; }
    if (!plano || !sitioLibre(g, x, z, 20)) continue;
    return { x, y: c.h, z };
  }
  return null;
}
export function iniciarArchivo(g) {
  const A = (g.meta.archivo ||= { fase: 0 });
  if (A.fase === 0) A.fase = 1;
}
// ---------- la obra ----------
const celda = (Q, f, c) => ({ x0: Q.ox + 1 + c * CELDA, z0: Q.oz + 1 + f * CELDA });
function plan(g, A) {
  const P = A.pos, gen = g.world.gen, L = [], put = (x, y, z, id) => L.push([x, y, z, id]);
  const ox = P.x - 15, oz = P.z - 15, base = Math.max(14, P.y - HONDO);
  A.ox = ox; A.oz = oz; A.base = base;
  const ANCHO = CELDA * 3 + 1;
  // la caja: piso, techo y paredes de repello
  for (let dx = 0; dx < ANCHO; dx++) for (let dz = 0; dz < ANCHO; dz++) for (let y = base; y <= base + ALTO + 1; y++) {
    const borde = y === base || y === base + ALTO + 1 || dx % CELDA === 0 || dz % CELDA === 0;
    put(ox + dx, y, oz + dz, borde ? (y === base ? K.baldosa_roja : K.plaster) : AIR);
  }
  // puertas entre oficinas: la red que hay que caminar
  const hueco = (x, z, ejeX) => { for (let k = 0; k < 2; k++) for (let y = base + 1; y <= base + 2; y++) put(ejeX ? x : x + k, y, ejeX ? z + k : z, AIR); };
  for (let f = 0; f < 3; f++) for (let c = 0; c < 2; c++) if (!(f === 2)) hueco(ox + (c + 1) * CELDA, oz + 1 + f * CELDA + 4, true);
  for (let c = 0; c < 3; c++) for (let f = 0; f < 2; f++) if (!(f === 1 && c !== 1)) hueco(ox + 1 + c * CELDA + 4, oz + (f + 1) * CELDA, false);
  // las dos oficinas de atrás se abren desde la de la jefa, con una puerta a cada lado
  hueco(ox + CELDA, oz + 1 + 2 * CELDA + 4, true); hueco(ox + 2 * CELDA, oz + 1 + 2 * CELDA + 4, true);
  // la reja de la Ventanilla: entre la sala de espera (1,1) y la oficina de la jefa (2,1)
  const rx = ox + 1 + CELDA + 4, rz = oz + 2 * CELDA;
  for (let k = 0; k < 2; k++) for (let y = base + 1; y <= base + 2; y++) put(rx + k, y, rz, K.reja);
  A.reja = { x: rx, z: rz };
  // libreros, lámparas y sillas
  for (let f = 0; f < 3; f++) for (let c = 0; c < 3; c++) {
    const { x0, z0 } = celda(A, f, c);
    put(x0 + 4, base + ALTO, z0 + 4, K.lamp);
    if (f === 2 && c === 1) continue; // la de la jefa queda limpia, para pelear
    if ((f + c) % 2 === 0) for (const dz of [1, 6]) for (let dx = 1; dx <= 2; dx++) for (let y = base + 1; y <= base + 3; y++) { put(x0 + dx, y, z0 + dz, K.bookshelf); put(x0 + TAM - 1 - dx, y, z0 + dz, K.bookshelf); }
    else if (K.silla) for (const dx of [1, 3, 5, 7]) put(x0 + dx, base + 1, z0 + 7, K.silla);
  }
  // la grada de la entrada: sube desde la primera oficina (0,1) hasta el monte
  const sx = ox + CELDA + 5;
  for (let k = 0; ; k++) {
    const z = oz - k, y = base + 1 + k;
    const h = gen.column(sx, z).h;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 4; dy++) put(sx + dx, y + dy, z, dy === -1 || Math.abs(dx) === 2 || dy === 4 ? (y + dy > gen.column(sx + dx, z).h ? 'nada' : K.plaster) : AIR);
    if (y > h + 1 || k > 40) { A.boca = { x: sx, y, z: z - 1 }; break; }
  }
  return L;
}
function acabar(g, A) {
  const w = g.world, base = A.base;
  // el cartel de afuera
  const B = A.boca, by = w.gen.column(B.x + 2, B.z).h + 1;
  w.setBlock(B.x + 2, by, B.z, K.placa);
  w.setBE(B.x + 2, by, B.z, { title: 'Archivo Municipal', text: 'Bodega 3, por falta de espacio. Municipalidad de Tiquicia (ficticia). Prohibido el paso a toda persona con prisa.' });
  // los sellos, en tres oficinas
  const cofre = (f, c, items) => {
    const { x0, z0 } = celda(A, f, c), x = x0 + 4, z = z0 + 6, y = base + 1;
    w.setBlock(x, y, z, K.chest);
    g.stations.placed(K.chest, x, y, z, 0);
    const be = w.getBE(x, y, z);
    if (be && be.slots) { items.forEach(([id, count], i) => { be.slots[i] = { id, count }; }); w.touchBE(x, y, z); }
  };
  cofre(0, 0, [[SELLO, 1], [COLON, 15]]);
  cofre(0, 2, [[SELLO, 1], [COLON, 15]]);
  cofre(1, 2, [[SELLO, 1], [258, 6]]);
  cofre(1, 0, [[443, 1], [K.torch, 16]]);
  cofre(2, 0, [[ESENCIA, 3], [260, 1]]);
  cofre(2, 2, [[COLON, 40], [441, 2]]);
  // lo que dicen las paredes
  let n = 0;
  for (let f = 0; f < 3; f++) for (let c = 0; c < 3; c++) {
    if (f === 2 && c === 1) continue;
    const { x0, z0 } = celda(A, f, c), P = PLACAS[n++ % PLACAS.length], x = x0 + 7, z = z0 + 4;
    if (w.getBlock(x, base + 1, z) === AIR) { w.setBlock(x, base + 1, z, K.placa); w.setBE(x, base + 1, z, { title: P[0], text: P[1] }); }
  }
  const R = A.reja;
  w.setBlock(R.x - 2, base + 1, R.z - 1, K.placa);
  w.setBE(R.x - 2, base + 1, R.z - 1, { title: 'Ventanilla 3', text: 'Se atiende con tres sellos. Pase cuando le avisen. Nadie le va a avisar.' });
  A.fase = 3;
}
function tickObra(g, A) {
  const T = g.archivoObra, w = g.world;
  if (T.w !== w) { g.archivoObra = null; return; }
  for (let k = 0; k < 320 && T.i < T.L.length; k++) {
    const [x, y, z, id] = T.L[T.i++];
    if (id !== 'nada' && w.getBlock(x, y, z) !== id) w.setBlock(x, y, z, id, { updates: false }); // sin avisar: si no, la arena de arriba se viene abajo antes de poner el techo
  }
  if (T.i >= T.L.length) { g.archivoObra = null; acabar(g, A); }
}
export function tickArchivoCuadro(g) {
  if (g.archivoObra && g.meta && g.meta.archivo) tickObra(g, g.meta.archivo);
}
// ---------- los funcionarios ----------
function funcionarios(g, A, f, c, n, tipo = 'sombra') {
  const { x0, z0 } = celda(A, f, c), dia = g.day || 1;
  for (let i = 0; i < n; i++) {
    const q = puestoSombra(g, x0 + 4, z0 + 4, A.base + 1, (i / n) * Math.PI * 2 + Math.random(), 3);
    if (!q || q.y < A.base || q.y > A.base + ALTO) continue;
    const m = g.entities.spawnMob(i === 0 && dia >= 12 ? tipo : 'sombra', q.x + 0.5, q.y + 0.2, q.z + 0.5);
    if (!m) continue;
    m.data.apuro = true; m.data.provoked = true; m.data.archivo = true; m.data.name = 'Funcionario de turno';
    m.health += Math.min(12, Math.floor(dia / 3));
  }
}
// ---------- la Jefa ----------
function empezarJefa(g, A) {
  const { x0, z0 } = celda(A, 2, 1);
  const m = g.entities.spawnMob('jefa_ventanilla', x0 + 4.5, A.base + 1.2, z0 + 6.5);
  if (!m) return;
  m.data.apuro = true; m.data.provoked = true; m.data.angry = true; m.data.archivo = true;
  g.ventanilla = { m, t: 8, marca: null, fase: 0, hijos: [] };
  g.ui.regionBanner('La Jefa de Ventanilla', '«¡Siguiente!»');
  g.audio.play('rumble', { ui: true, vol: 0.7 });
}
function terminarJefa(g, texto) {
  const V = g.ventanilla;
  if (!V) return;
  if (V.m && !V.m.dead && !V.m.dying) V.m.dead = true;
  for (const m of V.hijos) if (!m.dead && !m.dying) m.dead = true;
  g.ventanilla = null;
  if (texto) g.ui.toast(texto, 3600);
}
export const limpiarArchivo = (g) => { terminarJefa(g); g.archivoObra = null; };
function tickJefa(g, A) {
  const V = g.ventanilla, p = g.player.body.pos, { x0, z0 } = celda(A, 2, 1);
  if (V.m.dead || V.m.dying) { vencerJefa(g, A); return; }
  if (!g.player.alive) { terminarJefa(g, '📋 Cerraron por almuerzo. Vuelva después'); return; }
  if (Math.hypot(p.x - (x0 + 4.5), p.z - (z0 + 4.5)) > 40 || p.y > A.base + 12) { terminarJefa(g, '📋 Se fue sin hacer fila. Tendrá que empezar de nuevo'); return; }
  const J = V.m, frac = J.health / J.kind.health;
  // no se sale de su oficina
  if (Math.hypot(J.body.pos.x - (x0 + 4.5), J.body.pos.z - (z0 + 4.5)) > 7) { J.body.pos.x = x0 + 4.5; J.body.pos.z = z0 + 4.5; J.body.pos.y = A.base + 1.2; }
  if (V.fase === 0 && frac < 0.66) { V.fase = 1; hijos(g, A, V); }
  if (V.fase === 1 && frac < 0.33) { V.fase = 2; hijos(g, A, V); }
  // el sellazo: marca el piso donde uno está y cae
  if (V.marca) {
    const M = V.marca;
    M.t--;
    // v12.16.0: el sellazo simple es DORADO (se para con el escudo y la deja aturdida); solo el doble de la fase 2 es rojo
    const col = M.doble ? COLOR_AVISO.rojo : COLOR_AVISO.dorado;
    g.particles.burst(M.x + 0.5, A.base + 1.1, M.z + 0.5, M.doble ? [[0.9, 0.1, 0.1], [1, 0.5, 0.2]] : [[1, 0.85, 0.2], [1, 0.95, 0.6]], 18, 1.4);
    anilloAviso(g, M.x + 0.5, A.base + 1, M.z + 0.5, 2.2, 1, V.m, col);
    if (M.doble) anilloAviso(g, M.x2 + 0.5, A.base + 1, M.z2 + 0.5, 2.2, 1, V.m, col);
    if (M.t <= 0) {
      V.marca = null;
      g.shake = 0.6;
      g.audio.play('rumble', { ui: true, vol: 0.6 });
      const dentro = Math.hypot(p.x - (M.x + 0.5), p.z - (M.z + 0.5)) < 2.2 || (M.doble && Math.hypot(p.x - (M.x2 + 0.5), p.z - (M.z2 + 0.5)) < 2.2);
      if (dentro && !M.doble && g.blocking) { V.t += 3; g.ui.toast('🛡 ¡Sello parado! La Jefa se quedó sin tinta', 1800); g.audio.play('armadura.metal', { ui: true, vol: 0.4, pitch: 1.6 }); return; }
      if (dentro) { g.damagePlayer(7, M.x + 0.5, M.z + 0.5, 'Sellazo de la Jefa de Ventanilla', true, true); g.addEffect('escalofrio', 3); }
      g.ui.toast('📋 ¡RECHAZADO!', 1000);
    }
    return;
  }
  V.t--;
  if (V.t <= 0) {
    V.t = frac < 0.33 ? 5 : 8;
    const doble = frac < 0.33 && V.alterna;
    V.alterna = !V.alterna; // en la fase 2 se alternan un sellazo dorado y un «doble» rojo
    V.marca = { x: Math.floor(p.x), z: Math.floor(p.z), t: 2, doble };
    if (doble) { const a = Math.random() * Math.PI * 2; V.marca.x2 = V.marca.x + Math.round(Math.cos(a) * 3); V.marca.z2 = V.marca.z + Math.round(Math.sin(a) * 3); }
    g.ui.toast(doble ? '📋 «¡Doble sello!» Salga de los dos círculos' : '📋 «Le falta un timbre.» Dorado: pare con el escudo', 1800);
  }
}
function hijos(g, A, V) {
  const { x0, z0 } = celda(A, 2, 1);
  for (let i = 0; i < 3; i++) {
    const q = puestoSombra(g, x0 + 4, z0 + 4, A.base + 1, (i / 3) * Math.PI * 2, 3);
    if (!q || q.y > A.base + ALTO) continue;
    const m = g.entities.spawnMob(i === 0 ? 'sombra_escudo' : 'sombra', q.x + 0.5, q.y + 0.2, q.z + 0.5);
    if (m) { m.data.apuro = true; m.data.provoked = true; m.data.archivo = true; m.data.name = 'Funcionario de turno'; V.hijos.push(m); }
  }
  g.ui.toast('📋 «Pase con el compañero.»', 1800);
}
function vencerJefa(g, A) {
  const V = g.ventanilla;
  for (const m of V.hijos) if (!m.dead && !m.dying) m.dead = true;
  g.ventanilla = null;
  A.fase = 5; A.dia = g.day || 1;
  g.giveItem(SELLO_GOMA, 1); g.giveItem(COLON, 120); g.giveItem(ESENCIA, 4);
  g.addXP(120);
  g.audio.play('aplausos', { ui: true, vol: 0.5 });
  g.ui.regionBanner('Se cerró la Ventanilla 3', 'Y ahí estaba el expediente de Zenaida');
  anotar(g, 'Le gané a la Jefa de Ventanilla. Encontré el expediente de la abuela.', '📁');
  g.achieve('vencer_jefa', 'Pase con el compañero');
  const i = CARTAS_CORREO.findIndex((c) => c.k === 'expediente');
  if (i >= 0) entregarCarta(g, 24 + i, true);
}
// lo llama el golpe de uno, con el sello en la mano
export function selloGolpe(g, mob, held) {
  if (!held || held.key !== 'sello_goma' || mob.dying || Math.random() > 0.3) return;
  mob.stunT = mob.kind.boss ? 0.8 : 1.6;
  mob.windT = 0;
  g.particles.burst(mob.body.pos.x, mob.body.pos.y + mob.kind.h + 0.2, mob.body.pos.z, [[0.9, 0.1, 0.1]], 8, 1.2);
  g.ui.combatFlash('parry', '¡SELLADO!');
}
// ---------- cada segundo ----------
export function tickArchivo(g) {
  const A = g.meta && g.meta.archivo;
  if (!A || !A.fase || g.mode !== 'survival' || g.dim !== 'tierra') return;
  const H = g.meta.hist, p = g.player.body.pos, w = g.world;
  if (!A.pos && H && H.casa) { A.pos = sitio(g, H); if (!A.pos) return; A.fase = 2; }
  if (A.fase === 2) {
    if (g.archivoObra) return;
    const d = Math.hypot(A.pos.x - p.x, A.pos.z - p.z);
    if (d < 60 && [[-20, -24], [20, -24], [-20, 20], [20, 20], [0, 0]].every(([a, b]) => w.isLoaded(A.pos.x + a, A.pos.z + b))) {
      const L = plan(g, A);
      if (L.every(([x, , z]) => w.isLoaded(x, z))) g.archivoObra = { L, i: 0, w };
    }
    return;
  }
  if (A.fase < 3) return;
  const dentro = p.y < A.base + ALTO + 1 && p.y > A.base - 1 && p.x > A.ox && p.x < A.ox + 31 && p.z > A.oz && p.z < A.oz + 31;
  if (dentro && !A.entro) { A.entro = g.day || 1; g.ui.regionBanner('Archivo Municipal', 'Tome su número'); anotar(g, 'Bajé al Archivo Municipal. Me dieron un número.', '📁'); }
  if (dentro) {
    const c = Math.floor((p.x - A.ox) / CELDA), f = Math.floor((p.z - A.oz) / CELDA), k = `${f},${c}`;
    A.vistas ||= {};
    if (!A.vistas[k] && f < 3 && c < 3 && !(f === 2 && c === 1)) {
      A.vistas[k] = true;
      if (!(f === 0 && c === 1) && g.settings.hostiles && difOf(g).hostiles) funcionarios(g, A, f, c, f === 1 && c === 1 ? 4 : 2, 'sombra_escudo');
    }
  }
  // la reja
  // quien rompe la reja a pico, también pasó
  if (A.fase === 3 && A.reja && w.isLoaded(A.reja.x, A.reja.z) && w.getBlock(A.reja.x, A.base + 1, A.reja.z) !== K.reja) A.fase = 4;
  if (A.fase === 3 && dentro && A.reja && g.inventory.count(SELLO) >= 3 && Math.hypot(A.reja.x - p.x, A.reja.z - p.z) < 5) {
    g.inventory.remove(SELLO, 3);
    for (let k = 0; k < 2; k++) for (let y = A.base + 1; y <= A.base + 2; y++) w.setBlock(A.reja.x + k, y, A.reja.z, AIR);
    A.fase = 4;
    g.audio.play('craft', { ui: true, vol: 0.5 });
    g.ui.toast('📋 Tres sellos. Se oye una voz: «¿Quién dejó pasar a esa persona?»', 3400);
  } else if (A.fase === 3 && dentro && A.reja && Math.hypot(A.reja.x - p.x, A.reja.z - p.z) < 5 && !A.rejaAviso) {
    A.rejaAviso = true;
    g.ui.toast(`📋 La Ventanilla pide tres sellos. Lleva ${g.inventory.count(SELLO)}`, 3000);
  }
  // la pelea
  if (g.ventanilla) { tickJefa(g, A); return; }
  if (A.fase === 4 && g.player.alive && dentro && p.z > A.oz + 2 * CELDA + 1 && p.x > A.ox + CELDA && p.x < A.ox + 2 * CELDA) {
    if (!g.settings.hostiles || !difOf(g).hostiles) { A.fase = 5; g.giveItem(SELLO_GOMA, 1); const i = CARTAS_CORREO.findIndex((c) => c.k === 'expediente'); if (i >= 0) entregarCarta(g, 24 + i, true); return; }
    empezarJefa(g, A);
  }
}
export const marcaArchivo = (g) => { const A = g.meta && g.meta.archivo; return A && A.fase >= 2 && A.fase < 5 ? (A.boca || A.pos) : null; };
export const textoArchivo = (g) => {
  const A = g.meta && g.meta.archivo;
  if (!A || !A.fase || A.fase >= 5) return null;
  return A.fase < 4 ? `📁 El Archivo Municipal (📁 en la brújula): lleva ${g.inventory.count(SELLO)} de 3 sellos` : '📁 Ya abrió la Ventanilla 3. Pase, que la Jefa no llama a nadie';
};
export function pruebaArchivo(g) {
  const A = (g.meta.archivo ||= { fase: 0 }), H = g.meta.hist, p = g.player.body.pos;
  A.fase = 1; A.pos = null; A.boca = null;
  H.casa = H.casa || { x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) };
  const guard = { ...H.casa };
  H.casa = { x: Math.floor(p.x) - 110, y: guard.y, z: Math.floor(p.z) };
  tickArchivo(g);
  H.casa = guard;
  return A.pos ? `Archivo a ${Math.round(Math.hypot(A.pos.x - p.x, A.pos.z - p.z))} bloques (📁 en la brújula)` : 'No encontré terreno plano cerca';
}
