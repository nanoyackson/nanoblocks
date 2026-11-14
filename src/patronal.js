// v12.15.4 (C8-B «La fiesta patronal»): cada pueblo tiene su santo y su fiesta de 3 días en un ciclo de 24 días (santoDia = 1 + hash(id) % 24).
//   Día 1 «la novena» (noche): velas, procesión de vecinos con farol, +1 de reputación al encender una vela.
//   Día 2 «la cimarrona y el tope» (día): banda de 6 músicos que recorre la plaza, tope de caballos con premio de 10 u, instrumentos que se tocan.
//   Día 3 «la mascarada y la pólvora»: cabezonas, baile en la tarima, castillo de pólvora de noche.
//   La mayordomía: apadrinar la fiesta (60 u + 20 tamales + 5 bombetas) da la banda, +5 de reputación y ×1.5 en el mostrador durante la fiesta.
// Diseño: docs/revisiones/DISENO_CONTENIDO_C5-C8.md §C8-B. Estado (se guarda, pequeño): meta.patronal = { velas, velaDada:{clave:1}, tope:{clave:1}, comp, mayor:{ clave, vid, inicio, fase, hasta } }.
// En red: el anfitrión decide y simula lo que toca estado (los músicos, los caballos, el premio, la mayordomía, la reputación); las criaturas las ve todo el
// mundo como siempre; la música, el estandarte, la tarima, la pólvora y los instrumentos los corre cada pantalla (no tocan nada compartido).
// Simplificado a propósito (CHANGELOG): sin cinta de «mejor jinete» (logro), sin chinamos, sin placa/brújula con el nombre del santo (sale en los avisos),
// sonido reutilizado (loop de comparsa, caja, pito), sin sonido nuevo.
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { villageAt, CELL as VCELL } from './pueblogen.js';
import { decir } from './misiones.js';
export { factorMayordomo } from './mayordomia.js';
import { Rocket } from './fiesta.js';
import { flat } from './fauna.js';
import { ponerFarol, ponerCabezona, quitarCabezona } from './fiestas2.js';

export const TAMBOR = 1180, TROMPETA = 1181, BANDA = 1185, VELA = 1186;
const COLON = 360, TAMAL = 353, BOMBETA = 374, HERRADURA = 1143;
const COSTO = 60, CICLO = 24, SANTOS = ['San Isidro', 'San Antonio', 'Santiago', 'la Candelaria', 'Santa Cruz', 'la Virgen de los Ángeles'];

const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
export const santoDia = (v) => 1 + (hash(v.id) % CICLO);
export const santoDe = (v) => SANTOS[(hash(v.id) >>> 7) % SANTOS.length];
// dónde está el pueblo en su fiesta: dia 0 = los 2 días de antes (la mayordomía), 1–3 = la fiesta; null = nada. inicio = día absoluto del día 1
export function faseFiesta(day, v) {
  const d = (((day || 1) - 1) % CICLO) + 1, rel = (d - santoDia(v) + CICLO) % CICLO;
  if (rel < 3) return { dia: rel + 1, rel, inicio: day - rel };
  if (rel >= CICLO - 2) return { dia: 0, rel, inicio: day + (CICLO - rel) };
  return null;
}
const M_ = (g) => (g.meta.patronal && typeof g.meta.patronal === 'object' ? g.meta.patronal : (g.meta.patronal = { velas: 0, velaDada: {}, tope: {}, comp: 0, mayor: null }));
const anfitrion = (g) => !g.meta.invitado;
const llave = (v, F) => `${v.id}:${F.inicio}`;

// ── el pueblo con fiesta que le toca a quien juega ──
function suelo(g, x, z, y0) {
  const w = g.world;
  let y = Math.floor(y0) + 8;
  while (y > Math.floor(y0) - 10 && !SOLID[w.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--;
  return y;
}
function pueblosCerca(g, x, z, celdas) {
  const gen = g.world.gen, cx = Math.floor(x / VCELL), cz = Math.floor(z / VCELL), r = [];
  for (let dz = -celdas; dz <= celdas; dz++) for (let dx = -celdas; dx <= celdas; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (v && v.streets) r.push({ v, d: Math.hypot(v.x - x, v.z - z) });
  }
  return r.sort((a, b) => a.d - b.d);
}

// ── decorado: tarima y estandarte en la plaza (visual, para todas las pantallas) ──
function decorado(g, v, poner) {
  const D = g.patronalDeco;
  if (!poner) { if (D) { g.scene.remove(D.group); D.group.traverse((o) => { if (o.material) o.material.dispose(); if (o.geometry) o.geometry.dispose(); }); g.patronalDeco = null; } return; }
  if (D && D.id === v.id) { D.tela.rotation.y = Math.sin((g.clock || 0) * 1.7) * 0.12; return; }
  if (!g.world.isLoaded(v.x + 7, v.z) || !g.world.isLoaded(v.x - 7, v.z)) return;
  decorado(g, null, false);
  const y = suelo(g, v.x + 0.5, v.z + 0.5, v.y || 70), grp = new THREE.Group();
  grp.position.set(v.x + 0.5, y, v.z + 0.5 - 4);
  const caja = (w, h, d, c, x, yy, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, yy, z); return m; };
  grp.add(caja(6, 0.35, 4, 0x9a6a3a, 0, 0.175, 0), caja(6.2, 0.1, 4.2, 0xc8a050, 0, 0.38, 0));
  for (const sx of [-2.8, 2.8]) grp.add(caja(0.14, 3.2, 0.14, 0x6a4626, sx, 1.9, -1.8));
  grp.add(caja(5.8, 0.1, 0.1, 0x6a4626, 0, 3.4, -1.8));
  const cols = [0xd02a2a, 0xf0c020, 0x2a6ad8, 0xf0f0f0, 0x2a9a4a], c0 = cols[hash(v.id) % 5];
  const tela = new THREE.Group(); tela.position.set(0, 3.3, -1.8);
  for (let k = 0; k < 6; k++) { const t = caja(0.9, 1.6, 0.04, k % 2 ? cols[(hash(v.id) + k) % 5] : c0, -2.3 + k * 0.92, -0.8, 0); tela.add(t); }
  grp.add(tela);
  g.scene.add(grp);
  g.patronalDeco = { id: v.id, group: grp, tela };
}

// ── los vecinos de la fiesta ──
const vecinos = (g) => g.entities.mobs.filter((m) => m.type === 'vecino' && !m.dead && m.data && m.group.userData && !m.group.userData.pending);
function crear(g, v, rol, nombre, i, ox, oz) {
  const x = v.x + ox, z = v.z + oz, y = suelo(g, x, z, v.y || 70);
  const m = g.entities.spawnMob('vecino', x, y + 0.1, z);
  if (!m) return null;
  m.data = { vid: `patronal:${v.id}:${rol}${i}`, name: nombre, role: rol, seed: 7100 + i * 37 + (hash(v.id) % 500), home: { x, y, z }, plaza: { x, y, z }, patronal: rol };
  m.kind.dress(m);
  return m;
}
function instrumento(m, i) {
  const u = m.group.userData;
  if (!u.body || u.instrumento) return;
  const I = new THREE.Group();
  if (i === 0 || i === 5 || i === 1) { // redoblante, bombo y platillos: una caja al frente
    const c = i === 5 ? 0.5 : 0.34, col = i === 1 ? 0xe8c040 : 0xa8683a;
    I.add(flat(col, c, c * 0.8, 0.22, 0, 0.9, 0.3), flat(0xf0ead8, c * 0.9, 0.02, c * 0.72, 0, 1.0, 0.3));
  } else { // trompeta, clarinete, bombardino: un tubo hacia adelante
    I.add(flat(i === 4 ? 0xd8b030 : 0xe8c040, 0.07, 0.07, 0.55, 0, 1.25, 0.32), flat(0xf4d860, 0.17, 0.17, 0.08, 0, 1.25, 0.62));
  }
  u.body.add(I); u.instrumento = I;
}
function quitarInstrumento(m) { const u = m.group.userData; if (u.instrumento) { u.body.remove(u.instrumento); u.instrumento = null; } }
const irse = (m) => { if (!m.data.irse) m.data.irse = 2; };

function apagar(g) {
  decorado(g, null, false);
  g.audio.setEmitter('cimarrona', 'loop.comparsa', null);
  for (const m of g.entities.mobs) {
    if (m.dead || !m.data || !m.data.patronal) continue;
    const D = m.data.patronal;
    if (D === 'cimarronero' || D === 'mayordomo' || D === 'jinete') { irse(m); quitarInstrumento(m); continue; }
    // vecinos del pueblo prestados a la fiesta: vuelven a lo suyo
    m.data.ruta = null; m.data.baila = false; m.data.patronal = null;
    const u = m.group.userData;
    if (u.farol && u.npcArms) { u.npcArms[1].remove(u.farol); u.farol = null; }
    if (m.data.cabe) { m.data.cabe = 0; quitarCabezona(m); }
  }
  g.patronalA = null;
}

// ── cada segundo ──
export function tickPatronal(g) {
  if (g.dim !== 'tierra' || !g.world || g.world.gen.version < 3 || !g.meta) { if (g.patronalA) apagar(g); return; }
  const p = g.player.body.pos, host = anfitrion(g), noche = g.daylight < 0.35, M = g.meta;
  // 1. aviso de la víspera (la fiesta de un pueblo a < 600 bloques)
  if (!g.patronalBusca || g.patronalBusca < (g.clock || 0)) {
    g.patronalBusca = (g.clock || 0) + 10;
    if (g.daylight > 0.4 && M.patronalAviso !== g.day) {
      for (const q of pueblosCerca(g, p.x, p.z, 3)) {
        const F = faseFiesta(g.day, q.v);
        if (q.d < 600 && F && F.dia === 0 && F.rel === CICLO - 1) { M.patronalAviso = g.day; g.ui.toast(`🔔 Mañana es la fiesta de ${santoDe(q.v)} en ${q.v.name || 'el pueblo'}: habrá novena, tope y cimarrona.`, 4600); break; }
      }
    }
    // el pueblo con fiesta (o su víspera de mayordomía) más cercano, a menos de 150 bloques
    const q = pueblosCerca(g, p.x, p.z, 1).find((e) => e.d < 150 && faseFiesta(g.day, e.v));
    const A = q ? { v: q.v, F: faseFiesta(g.day, q.v), d: q.d } : null;
    if (!A && g.patronalA) apagar(g);
    else if (A) g.patronalA = A;
  }
  const A = g.patronalA;
  if (!A) return;
  const v = A.v, F = faseFiesta(g.day, v); // el día pasa: la fase se recalcula cada segundo
  if (!F) { apagar(g); return; }
  A.F = F;
  const d = Math.hypot(v.x - p.x, v.z - p.z), clave = llave(v, F);
  A.d = d;
  if (d > 160) { apagar(g); return; }
  const fiesta = F.dia >= 1, dia = F.dia;
  decorado(g, v, fiesta && d < 90);
  // música de la cimarrona (día 2 de día) y de la comparsa (día 3 de día)
  const suena = (dia === 2 || dia === 3) && !noche && d < 110;
  g.audio.setEmitter('cimarrona', 'loop.comparsa', suena ? { x: v.x, y: (v.y || p.y) + 2, z: v.z } : null, 0.9);
  if (fiesta && d < 40 && g.daylight > 0.3 && g.patronalDicho !== clave) { g.patronalDicho = clave; g.ui.toast(`⛪ Fiesta de ${santoDe(v)} en ${v.name || 'el pueblo'}: ${['', 'la novena en la noche', 'la cimarrona y el tope', 'la mascarada y la pólvora'][dia]}`, 3600); }
  // la pólvora (día 3, de noche): castillo de bombetas en la plaza (visual, cada pantalla la suya)
  if (dia === 3 && noche && d < 70) {
    if (Math.random() < 0.5) (g.rockets ||= []).push(new Rocket(g, v.x + (Math.random() - 0.5) * 22, (v.y || p.y) + 2, v.z + (Math.random() - 0.5) * 18));
    if (d < 40) g.achieve('polvora_patronal', 'Pólvora en la fiesta');
  }
  // baile en la tarima con la máscara puesta
  if (dia === 3 && !noche && d < 18 && g.disguised) { g.patronalBaile = (g.patronalBaile || 0) + 1; if (g.patronalBaile === 15) g.achieve('baile_tarima', 'Bailé en la tarima'); } else if (d >= 18 || !g.disguised) g.patronalBaile = 0;
  if (d > 70) return;
  // ── lo que decide el anfitrión ──
  if (!host) return;
  const vs = vecinos(g);
  const mios = (rol) => g.entities.mobs.filter((m) => !m.dead && m.data && m.data.patronal === rol && !m.data.irse);
  // el presidente de la junta (mayordomía), de 2 días antes a la fiesta
  if (!mios('mayordomo').length && d < 50 && g.daylight > 0.3 && g.mode === 'survival') crear(g, v, 'mayordomo', `Don Chepe (presidente de la junta, fiesta de ${santoDe(v)})`, 0, 4, 3);
  // día 1, de noche: procesión corta (los vecinos con farol, vueltas a la plaza) y una vela gratis
  if (dia === 1 && noche) {
    let n = 0;
    for (const m of vs) {
      if (n >= 6 || m.data.role !== 'vecino' || m.data.vid.startsWith('patronal')) continue;
      n++;
      if (!m.data.ruta) { ponerFarol(m); m.frozen = false; m.data.patronal = 'procesion'; m.data.ruta = { cx: v.x, cz: v.z, r: 9, a: (n / 6) * Math.PI * 2 }; }
    }
    if (d < 35 && g.mode === 'survival') {
      const P = M_(g);
      if (!P.velaDada[clave]) { P.velaDada[clave] = 1; g.giveItem(VELA, 1); g.ui.toast('🕯 Le regalaron una vela de la novena: enciéndala en la plaza (clic derecho)', 3800); }
    }
  } else if (dia !== 1 || !noche) for (const m of vs) if (m.data.patronal === 'procesion') { m.data.ruta = null; m.data.patronal = null; const u = m.group.userData; if (u.farol && u.npcArms) { u.npcArms[1].remove(u.farol); u.farol = null; } }
  // día 2, de día: la cimarrona (6 músicos recorren la plaza) y el tope de caballos
  if (dia === 2 && !noche) {
    const band = mios('cimarronero');
    if (band.length < 6 && d < 60) {
      const NOMBRES = ['redoblante', 'platillos', 'trompeta', 'clarinete', 'bombardino', 'bombo'];
      for (let i = band.length; i < 6; i++) {
        const m = crear(g, v, 'cimarronero', `Cimarronero (${NOMBRES[i]})`, i, Math.cos(i) * 7, Math.sin(i) * 5);
        if (m) { m.frozen = false; m.data.ruta = { cx: v.x, cz: v.z, r: 7, a: (i / 6) * Math.PI * 2 }; m.data.i = i; band.push(m); }
      }
    }
    for (const m of band) if (m.group.userData.body) instrumento(m, m.data.i || 0);
    const jin = mios('jinete');
    if (jin.length < 6 && d < 60) { // seis jinetes en fila por la plaza, a 6 bloques uno de otro: el hueco entre dos es donde se mete uno
      const a = 0.4 + jin.length * 0.5;
      const m = g.entities.spawnMob('caballo', v.x + Math.cos(a) * 12, suelo(g, v.x + Math.cos(a) * 12, v.z + Math.sin(a) * 12, v.y || 70) + 0.1, v.z + Math.sin(a) * 12);
      if (m) { m.data.patronal = 'jinete'; m.data.ruta = { cx: v.x, cz: v.z, r: 12, a }; }
    }
    tope(g, v, clave, jin);
  } else {
    for (const m of mios('cimarronero').concat(mios('jinete'))) { irse(m); quitarInstrumento(m); }
  }
  // día 3, de día: cabezonas y comparsa que baila en la tarima
  if (dia === 3 && !noche) {
    let n = 0;
    for (const m of vs) {
      if (m.data.role !== 'vecino' || m.data.vid.startsWith('patronal') || m.data.patronal === 'procesion') continue;
      if (m.data.seed % 3 === 0) { ponerCabezona(m); m.data.cabe = 1; }
      if (n < 6) { n++; m.frozen = false; m.data.baila = true; m.data.patronal = 'baile'; m.data.ruta = m.data.ruta || { cx: v.x, cz: v.z - 4, r: 5, a: (n / 6) * Math.PI * 2 }; }
    }
  } else for (const m of vs) {
    if (m.data.patronal === 'baile') { m.data.baila = false; m.data.ruta = null; m.data.patronal = null; }
    if (m.data.cabe) { m.data.cabe = 0; quitarCabezona(m); }
  }
  if (g.mode === 'survival' && M.patronal && M.patronal.mayor && M.patronal.mayor.fase === 'hecho' && (g.day || 1) <= M.patronal.mayor.hasta && d < 40 && M.patronalMencion !== g.day) { M.patronalMencion = g.day; g.ui.toast('🎖 En el pueblo todavía hablan de su mayordomía', 2800); }
}

// ── el tope: mantener el caballo entre otros dos jinetes a media distancia, 90 s (ritmo suave, sin combate) ──
function tope(g, v, clave, jinetes) {
  const r = g.riding, P = M_(g);
  if (!r || r.dead || r.type !== 'caballo' || P.tope[clave] || g.mode !== 'survival') { g.patronalTope = null; return; }
  const p = r.body.pos, cerca = Math.hypot(p.x - v.x, p.z - v.z);
  if (cerca < 6 || cerca > 16 || jinetes.length < 2) { if (g.patronalTope) g.patronalTope.fuera = (g.patronalTope.fuera || 0) + 1; return; }
  const T = (g.patronalTope ||= { s: 0, aviso: false });
  const ds = jinetes.map((j) => Math.hypot(j.body.pos.x - p.x, j.body.pos.z - p.z)).sort((a, b) => a - b);
  // los jinetes se amontonan al andar: vale ir en el grupo (los dos más cercanos a ≤ 8 bloques; con herradura, 9) sin pegárseles (≥ 2,5; con herradura, 2)
  const lo = g.inventory.count(HERRADURA) ? 2 : 2.5, hi = g.inventory.count(HERRADURA) ? 9 : 8;
  if (!T.aviso) { T.aviso = true; g.ui.toast('🏇 Tope: vaya con el grupo de jinetes, sin pegárseles, 90 s. ¡Sin pisar a nadie!', 4200); }
  const pisa = vecinos(g).some((m) => Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 1.1 && !m.data.irse);
  if (pisa) { T.s = Math.max(0, T.s - 10); g.ui.toast('🏇 ¡Cuidado con la gente! Pierde 10 s', 1800); return; }
  if (ds[0] >= lo && ds[1] <= hi) T.s++;
  if (T.s > 0 && T.s % 30 === 0) g.ui.toast(`🏇 Tope: ${T.s} de 90 s`, 1400);
  if (T.s >= 90) {
    P.tope[clave] = 1; g.patronalTope = null;
    g.giveItem(COLON, 10);
    g.audio.play('monedas', { ui: true, vol: 0.7 });
    g.ui.toast('🏇 ¡Mejor jinete del tope! 10 u (₡5 000) de premio', 4200, 'importante');
    g.achieve('mejor_jinete', 'Mejor jinete del tope');
    g.addXP && g.addXP(40);
  }
}

// ── usar un ítem: tambor, trompeta (cualquier pantalla) y vela (la reputación la anota el anfitrión) ──
export function usarPatronal(g, held) {
  if (!held) return false;
  const p = g.player.body.pos;
  if (held.id === TAMBOR || held.id === TROMPETA) {
    const A = g.patronalA, enBanda = A && A.F.dia === 2 && A.d < 40;
    const beat = ((g.clock || 0) % 0.5) / 0.5, bien = beat < 0.2 || beat > 0.8; // cae cerca del compás de 120 por minuto
    const base = held.id === TAMBOR ? 'caja' : 'pito';
    g.audio.play(base, { vol: 0.8, pitch: bien ? (held.id === TROMPETA ? 1.25 : 1) : 0.7 + Math.random() * 0.15 });
    if (enBanda) {
      if (bien) {
        const P = M_(g); P.comp = (P.comp || 0) + 1;
        if (P.comp === 30) { g.achieve('cimarronero', 'Cimarronero'); g.ui.toast('🥁 ¡30 compases buenos! La cimarrona lo recibe como uno más', 3200); }
        g.particles.burst(p.x, p.y + 1.8, p.z, [[1, 0.85, 0.3]], 4, 0.8);
      } else g.ui.toast('🥁 Desentona… siga el compás de la banda', 1200);
    }
    return true;
  }
  if (held.id === VELA) {
    const A = g.patronalA;
    if (!A || A.F.dia !== 1 || A.d > 40) { g.ui.toast('🕯 La vela se enciende en la plaza, la noche de la novena (día 1 de la fiesta)', 2600); return true; }
    if (g.daylight > 0.35) { g.ui.toast('🕯 Espere a que caiga la noche para la novena', 2200); return true; }
    g.inventory.consumeHeld(1);
    g.audio.play('ignite', { vol: 0.6 });
    g.particles.burst(p.x + Math.sin(g.player.yaw || 0) * 1.2, p.y + 1.4, p.z + Math.cos(g.player.yaw || 0) * 1.2, [[1, 0.8, 0.3], [1, 0.95, 0.7]], 14, 0.9);
    if (anfitrion(g) && g.mode === 'survival') {
      const P = M_(g), clave = llave(A.v, A.F);
      P.velas = (P.velas || 0) + 1;
      const R = (g.meta.repPueblo ||= {});
      if (!P.rep) P.rep = {};
      if (!P.rep[clave]) { P.rep[clave] = 1; R[A.v.id] = (R[A.v.id] || 0) + 1; g.ui.toast(`🕯 Vela encendida a ${santoDe(A.v)}: +1 de reputación en ${A.v.name || 'el pueblo'}`, 3200); } else g.ui.toast(`🕯 Vela encendida (${P.velas} en total)`, 2000);
      if (P.velas >= 9) g.achieve('novena', 'La novena de verdad');
    } else g.ui.toast('🕯 Vela encendida', 1800);
    return true;
  }
  return false;
}

// ── clic derecho al presidente de la junta: la mayordomía ──
export function patronalInteract(m, g) {
  if (!m.data) return false;
  if (m.data.patronal === 'cimarronero') { decir(g, m, ['¡Arrímese y toque con nosotros!', '¡Que suene la cimarrona!', 'Siga el compás del tambor, mae.'][Math.floor(Math.random() * 3)], 3); return true; }
  if (m.data.patronal !== 'mayordomo') return false;
  const A = g.patronalA, dlg = (t, ms) => g.ui.dialog(m.data.name, t, ms || 5600);
  if (g.meta.invitado) { dlg('Eso de la mayordomía lo arregla la persona dueña del mundo. Pero ¡disfrute la fiesta!'); return true; }
  if (!A) return true;
  const P = M_(g), clave = llave(A.v, A.F), Y = P.mayor && P.mayor.clave === clave ? P.mayor : null, n = (id) => g.inventory.count(id);
  if (Y && Y.fase === 'hecho') { dlg('¡Qué buen mayordomo, mae! Ahí en la plaza lo vamos a mencionar todo el año.'); return true; }
  if (!Y) {
    if (A.F.dia !== 0) { dlg(`La fiesta de ${santoDe(A.v)} ya empezó, y la mayordomía se acuerda antes. ¡Pase a la tarima y a la cimarrona!`); return true; }
    if (n(COLON) < COSTO) { dlg(`Apadrinar la fiesta de ${santoDe(A.v)} sale en ${COSTO} u (₡${COSTO * 500}), más 20 tamales y 5 bombetas para el castillo. Es un gasto de prestigio: no da plata. Le faltan ${COSTO - n(COLON)} u.`, 7000); return true; }
    g.inventory.remove(COLON, COSTO);
    P.mayor = { clave, vid: A.v.id, inicio: A.F.inicio, fase: 'pago', hasta: A.F.inicio + 2 + CICLO };
    dlg('¡Dios se lo pague! Ya es el mayordomo. Ahora lléveme 20 tamales y 5 bombetas (antes de que acabe la fiesta) y le doy la banda.', 7000);
    g.audio.play('monedas', { ui: true, vol: 0.5 });
    return true;
  }
  if (n(TAMAL) < 20 || n(BOMBETA) < 5) { dlg(`Falta lo de la fiesta: 20 tamales (lleva ${n(TAMAL)}) y 5 bombetas (lleva ${n(BOMBETA)}).`); return true; }
  g.inventory.remove(TAMAL, 20); g.inventory.remove(BOMBETA, 5);
  Y.fase = 'hecho';
  g.giveItem(BANDA, 1);
  const R = (g.meta.repPueblo ||= {});
  R[A.v.id] = (R[A.v.id] || 0) + 5;
  g.audio.play('campana', { ui: true, vol: 0.7 });
  g.ui.toast(`🎖 Mayordomo de ${santoDe(A.v)}: banda, +5 de reputación y ventas ×1.5 en su mostrador mientras dure la fiesta`, 4800, 'importante');
  g.achieve('mayordomo', 'Mayordomo');
  g.addXP && g.addXP(80);
  dlg('¡Pura vida! Ahí tiene su banda de mayordomo. ¡Que viva el santo!', 5000);
  decir(g, m, '¡Viva el mayordomo!', 4);
  return true;
}
