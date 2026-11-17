// v13.1.2 (C4 de cuevas): la vida y el sonido de la cueva. No cambia el terreno (no sube el generador).
//  · tres criaturas propias de cueva, con modelo original: el cangrejo ciego (donde hay agua), el grillo de cueva (en lo seco y oscuro) y el
//    escarabajo de calcita (entre estalagmitas y roca caliza). Las hace aparecer SOLO el anfitrión (entities.spawnMob descarta lo de un invitado),
//    con tope por zona (≤ 3 en 22 bloques, ≤ 2 de cada una) y tope total (6);
//  · goteo, agua corriendo y eco según el tamaño de la sala: a lo más 3 emisores de sonido a la vez (elegirEmisores). Todo es local a cada
//    persona (sin tráfico de red) y sale de sonidos sintetizados (audio.js synth), sin archivos nuevos;
//  · el brillo de los hongos y del cristal cambia de color con la región (motas de luz que flotan);
//  · una línea en la libreta la primera vez que se pisa cada tipo de cueva, y una ficha en el bestiario de cada criatura.
import * as THREE from 'three';
import { SOLID, AIR, FLUID, BLOCK_BY_KEY as K } from './blocks.js';
import { Pieza, huevo, bandas } from './lowpoly.js';
import { zonaSegura } from './historia.js';
import { regionAt } from './regiones.js';
import { anotar } from './diario.js';

const G = () => new THREE.Group();
const pivotePata = (x, y, z, giroY, malla) => { const p = G(); p.position.set(x, y, z); p.rotation.y = giroY; p.add(malla); return p; };

// ---------- modelos ----------
export function armarCangrejoCiego() {
  const g = G(), body = G(); body.position.y = 0.17; g.add(body);
  const P = new Pieza();
  // el caparazón pálido y sin ojos: solo dos muñones donde irían
  P.bulto(0xe9dccb, 0.3, 0.11, 0.22, { y: 0.05, det: 3, brillo: 0.5, grano: 0.1, forma: (v) => { if (v.y < 0) v.y *= 0.5; }, pinta: (u) => (u.y > 0.45 && Math.sin(u.x * 17) * Math.sin(u.z * 15) > 0.7 ? 0xc9b8a2 : null) });
  for (const s of [-1, 1]) P.tubo(0xdccfbd, [[s * 0.07, 0.1, 0.18], [s * 0.08, 0.16, 0.22]], [0.02, 0.014], { lados: 4, pasos: 1 });
  body.add(P.malla());
  const pinzas = [];
  for (const s of [-1, 1]) {
    const piv = G(); piv.position.set(s * 0.26, 0.03, 0.16); body.add(piv);
    const Q = new Pieza();
    Q.tubo(0xf0e4d2, [[0, 0, 0], [s * 0.04, 0.02, 0.1], [s * 0.03, 0.03, 0.2]], [0.035, 0.04, 0.05], { lados: 5 });
    Q.bulto(0xf4e9d8, 0.06, 0.05, 0.08, { x: s * 0.03, y: 0.04, z: 0.27, det: 2, brillo: 0.7 });
    piv.add(Q.malla()); pinzas.push(piv);
  }
  const patas = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const L = 0.24, Q = new Pieza();
    Q.tubo(0xd8c8b2, [[0, 0, 0], [L * 0.55, L * 0.42, 0], [L, L * 0.1, 0], [L * 1.15, -0.2, 0]], [0.03, 0.026, 0.018, 0.005], { lados: 4, pinta: bandas(0xf2e8d8, 3, 0.25) });
    patas.push({ piv: pivotePata(s * 0.26, 0, 0.08 - i * 0.13, s > 0 ? -0.2 : Math.PI + 0.2, Q.malla()), i, s });
    body.add(patas[patas.length - 1].piv);
  }
  g.userData = { body, patas, pinzas };
  return g;
}

export function armarGrilloCueva() {
  const g = G(), body = G(); body.position.y = 0.2; g.add(body);
  const P = new Pieza();
  // cuerpo largo y jorobado, color de tierra mojada, con las antenas más largas que él
  P.bulto(0x8a6a48, 0.1, 0.1, 0.22, { y: 0.06, z: -0.05, det: 3, forma: huevo(-0.2), brillo: 0.4, grano: 0.12, pinta: (u) => (u.y > 0.3 && Math.abs(u.x) < 0.12 ? 0x5a4028 : null) });
  P.bulto(0x9a7a55, 0.085, 0.085, 0.1, { y: 0.02, z: 0.2, det: 2, brillo: 0.5 });
  for (const s of [-1, 1]) P.bulto(0x181008, 0.022, 0.022, 0.022, { x: s * 0.05, y: 0.04, z: 0.27, det: 1, brillo: 1.2 });
  body.add(P.malla());
  const anten = [];
  for (const s of [-1, 1]) {
    const piv = G(); piv.position.set(s * 0.03, 0.06, 0.27); body.add(piv);
    const Q = new Pieza();
    Q.tubo(0x6a4e32, [[0, 0, 0], [s * 0.12, 0.12, 0.3], [s * 0.3, 0.2, 0.62]], [0.012, 0.008, 0.003], { lados: 3, pasos: 3 });
    piv.add(Q.malla()); anten.push({ piv, s });
  }
  const patas = [];
  for (let i = 0; i < 2; i++) for (const s of [-1, 1]) {
    const Q = new Pieza();
    Q.tubo(0x7a5a3a, [[0, 0, 0], [s * 0.12, 0.1, 0], [s * 0.2, 0, 0], [s * 0.24, -0.18, 0]], [0.018, 0.015, 0.01, 0.004], { lados: 4 });
    const piv = G(); piv.position.set(s * 0.07, 0.02, 0.12 - i * 0.1); piv.add(Q.malla()); body.add(piv);
    patas.push({ piv, i, s });
  }
  // las patas de atrás, grandes, de brincar
  const zanc = [];
  for (const s of [-1, 1]) {
    const Q = new Pieza();
    Q.tubo(0x8a6a48, [[0, 0, 0], [s * 0.1, 0.22, -0.12], [s * 0.2, 0.05, -0.3], [s * 0.24, -0.18, -0.34]], [0.04, 0.03, 0.016, 0.005], { lados: 5, pinta: bandas(0x4a3420, 3, 0.2) });
    const piv = G(); piv.position.set(s * 0.07, 0.04, -0.12); piv.add(Q.malla()); body.add(piv);
    zanc.push({ piv, s });
  }
  g.userData = { body, patas, anten, zanc };
  return g;
}

export function armarEscarabajoCalcita() {
  const g = G(), body = G(); body.position.y = 0.17; g.add(body);
  const P = new Pieza();
  // el caparazón cubierto de costra de calcita: crema con puntos de cuarzo
  const shell = G(); body.add(shell);
  const S = new Pieza();
  S.bulto(0xd6cab0, 0.27, 0.17, 0.33, { y: 0.03, z: -0.04, det: 4, brillo: 0.9, grano: 0.14, forma: (v) => { if (v.y < 0) v.y *= 0.35; }, pinta: (u) => {
    if (u.y > 0.2 && Math.sin(u.x * 23) * Math.sin(u.z * 21) > 0.62) return 0xf4f0e4;
    return u.y > 0.1 && Math.abs(u.x) < 0.04 ? 0x8a7c60 : null;
  } });
  shell.add(S.malla());
  P.bulto(0xb8aa8a, 0.15, 0.1, 0.12, { y: 0.0, z: 0.3, det: 2, brillo: 0.5, grano: 0.1 });
  for (const s of [-1, 1]) {
    P.bulto(0x181410, 0.025, 0.025, 0.025, { x: s * 0.07, y: 0.04, z: 0.38, det: 1, brillo: 1.3 });
    P.tubo(0x9a8c70, [[s * 0.05, 0.02, 0.38], [s * 0.1, 0.1, 0.5], [s * 0.16, 0.12, 0.58]], [0.014, 0.01, 0.004], { lados: 3, pasos: 2 });
  }
  const head = P.malla(); body.add(head);
  const legs = [], patas = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const L = 0.22, Q = new Pieza();
    Q.tubo(0xa89a7c, [[0, 0, 0], [L * 0.5, L * 0.4, 0], [L, L * 0.1, 0], [L * 1.1, -0.17, 0]], [0.026, 0.022, 0.015, 0.005], { lados: 4 });
    const piv = pivotePata(s * 0.2, 0, 0.12 - i * 0.12, s > 0 ? -0.3 : Math.PI + 0.3, Q.malla());
    body.add(piv); patas.push({ piv, i, s }); legs.push(piv);
  }
  g.userData = { body, patas, shell, head, legs };
  return g;
}

// ---------- las criaturas ----------
const PATAS = (m, u, vel, amp) => { for (const P of u.patas) P.piv.rotation.z = Math.sin(m.walk * vel + P.i * 2 + (P.s > 0 ? 0 : Math.PI)) * amp * m.walkAmt; };
export const CUEVA_FAUNA = {
  cangrejo_ciego: {
    name: 'Cangrejo ciego', w: 0.6, h: 0.3, health: 6, speed: 0.9, hurtSound: 'cangrejo_ciego', idleSound: 'cangrejo_ciego', idleEvery: [9, 20],
    particle: [[0.9, 0.85, 0.75]], drops: [[262, 0, 1]], xp: 3, grupo: 'caparazon',
    build() { return armarCangrejoCiego(); },
    animate(m, dt, u) {
      PATAS(m, u, 4.2, 0.35);
      u.pinzas.forEach((p, i) => { p.rotation.x = Math.sin(m.t * 1.7 + i * 2) * 0.12; });
    },
  },
  grillo_cueva: {
    name: 'Grillo de cueva', w: 0.35, h: 0.3, health: 4, speed: 1.7, erratic: false, hurtSound: 'grillo_cueva', idleSound: 'grillo_cueva', idleEvery: [5, 12],
    particle: [[0.55, 0.42, 0.28]], drops: [], xp: 2, grupo: 'caparazon',
    build() { return armarGrilloCueva(); },
    animate(m, dt, u) {
      PATAS(m, u, 7, 0.4);
      u.anten.forEach((a) => { a.piv.rotation.y = a.s * (0.2 + Math.sin(m.t * 3 + a.s) * 0.18); a.piv.rotation.x = Math.sin(m.t * 2.2) * 0.1; });
      u.zanc.forEach((z) => { z.piv.rotation.z = z.s * Math.max(0, Math.sin(m.walk * 3.5)) * 0.35 * m.walkAmt; });
    },
  },
  escarabajo_calcita: {
    name: 'Escarabajo de calcita', w: 0.55, h: 0.3, health: 10, speed: 0.7, hurtSound: 'dig.stone', idleSound: null, idleEvery: [999, 999],
    particle: [[0.85, 0.8, 0.68], [0.95, 0.95, 0.9]], drops: [[272, 0, 1]], xp: 4, grupo: 'caparazon',
    build() { return armarEscarabajoCalcita(); },
    // si uno se le arrima se hace bolita (parece una piedra) y no se mueve; al alejarse se estira otra vez
    brain(m, dt, c) {
      m.data.bola = c.distP < 3 ? 3 : Math.max(0, (m.data.bola || 0) - dt);
      if (m.data.bola > 0) { m.moving = false; return true; }
      return false;
    },
    onHurt(m, g, dmg) { if (m.data.bola > 0 && dmg < 3) { g.ui.toast('El escarabajo de calcita parece una piedra: ni lo sintió', 1400); return false; } return true; },
    animate(m, dt, u) {
      const k = (m.data.bolaK = (m.data.bolaK || 0) + ((m.data.bola > 0 ? 1 : 0) - (m.data.bolaK || 0)) * Math.min(1, dt * 8));
      u.legs.forEach((l) => { l.visible = k < 0.6; }); u.head.visible = k < 0.5;
      u.shell.scale.set(1 + k * 0.1, 1 + k * 0.45, 1 - k * 0.1);
      u.body.position.y = 0.17 - k * 0.04;
      if (!(k > 0.6)) PATAS(m, u, 3.4, 0.3);
    },
  },
};
export const TIPOS_CUEVA = Object.keys(CUEVA_FAUNA);

// ---------- dónde y cuántos salen (solo el anfitrión: spawnMob descarta lo de un invitado) ----------
export const TOPE_TOTAL = 6, TOPE_ZONA = 3, TOPE_ESPECIE = 2, RADIO_ZONA = 22;
const hayCerca = (w, x, y, z, esDe, r = 5) => { for (let dx = -r; dx <= r; dx += 2) for (let dz = -r; dz <= r; dz += 2) for (let dy = -3; dy <= 1; dy++) if (esDe(w.getBlock(x + dx, y + dy, z + dz))) return true; return false; };
const esAgua = (id) => id === K.water || (FLUID[id] && id !== K.lava);
const esCalcita = (id) => id === K.calcite || id === K.stalagmite || id === K.stalactite;
// qué especie le toca a un sitio, o null: agua → cangrejo; roca caliza → escarabajo; lo demás, seco y oscuro → grillo
export function especieDelSitio(w, x, y, z) {
  if (hayCerca(w, x, y, z, esAgua)) return 'cangrejo_ciego';
  if (hayCerca(w, x, y, z, esCalcita)) return 'escarabajo_calcita';
  return 'grillo_cueva';
}
export function cuevaFaunaSpawn(E, g) {
  if (g.dim !== 'tierra' || g.meta.invitado || !g.env || g.env.cave < 0.6 || Math.random() > 0.5) return false;
  const vivos = E.mobs.filter((m) => !m.dead && CUEVA_FAUNA[m.type]);
  if (vivos.length >= TOPE_TOTAL) return false;
  const w = g.world, pl = g.player.body.pos;
  for (let tries = 0; tries < 8; tries++) {
    const x = Math.floor(pl.x + (Math.random() - 0.5) * 36), z = Math.floor(pl.z + (Math.random() - 0.5) * 36), y0 = Math.floor(pl.y + (Math.random() - 0.5) * 10);
    if (Math.hypot(x - pl.x, z - pl.z) < 7 || !w.isLoaded(x, z) || zonaSegura(g, x, z)) continue;
    let y = null;
    for (let yy = y0 + 3; yy > y0 - 6; yy--) if (SOLID[w.getBlock(x, yy - 1, z)] && w.getBlock(x, yy, z) === AIR && w.getBlock(x, yy + 1, z) === AIR) { y = yy; break; }
    if (y === null || y > 56 || FLUID[w.getBlock(x, y - 1, z)]) continue;
    const zona = vivos.filter((m) => Math.hypot(m.body.pos.x - x, m.body.pos.z - z) < RADIO_ZONA && Math.abs(m.body.pos.y - y) < 12);
    if (zona.length >= TOPE_ZONA) continue;
    const t = especieDelSitio(w, x, y, z);
    if (zona.filter((m) => m.type === t).length >= TOPE_ESPECIE) continue;
    return !!E.spawnMob(t, x + 0.5, y + 0.05, z + 0.5);
  }
  return false;
}

// ---------- sonido: a lo más 3 emisores a la vez ----------
export const MAX_EMISORES = 3;
// de todas las fuentes que se vieron (gota, agua), las MAX más cercanas a quien escucha; de cada clase a lo más 2, y no dos de la misma
// clase pegadas (un charco con veinte bloques de agua suena como uno solo y no tapa el goteo)
export function elegirEmisores(fuentes, pos, max = MAX_EMISORES) {
  const orden = fuentes.map((f) => ({ f, d: Math.hypot(f.x - pos.x, f.y - pos.y, f.z - pos.z) })).sort((a, b) => a.d - b.d), out = [];
  for (const { f } of orden) {
    if (out.length >= max) break;
    if (out.filter((q) => q.tipo === f.tipo).length >= 2 || out.some((q) => q.tipo === f.tipo && Math.hypot(q.x - f.x, q.y - f.y, q.z - f.z) < 4)) continue;
    out.push(f);
  }
  return out;
}
// tamaño de la sala (0 chica … 1 enorme): hasta dónde llega el aire en 8 direcciones horizontales y hacia arriba
export function tamanoSala(w, pos) {
  const x = pos.x, y = pos.y + 1.2, z = pos.z;
  let suma = 0, n = 0;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    let d = 1;
    while (d < 20 && !SOLID[w.getBlock(Math.floor(x + dx * d), Math.floor(y), Math.floor(z + dz * d))]) d++;
    suma += d; n++;
  }
  let up = 1;
  while (up < 14 && !SOLID[w.getBlock(Math.floor(x), Math.floor(y + up), Math.floor(z))]) up++;
  return Math.max(0, Math.min(1, (suma / n / 20) * 0.7 + (up / 14) * 0.3));
}

// ---------- el brillo cambia con la región ----------
const hsl = (h, s, l) => { const a = s * Math.min(l, 1 - l), f = (n) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; };
const hashS = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
// color de las motas de un hongo (por bioma) o de un cristal (por región): siempre el mismo en el mismo lugar
export function colorBrillo(tipo, bioma, region) {
  if (tipo === 'hongo') {
    if (['jungle', 'manglar', 'nuboso'].includes(bioma)) return [0.4, 1, 0.7];
    if (['desert', 'bosque_seco'].includes(bioma)) return [1, 0.75, 0.3];
    if (bioma === 'volcano') return [1, 0.45, 0.2];
    if (['paramo', 'mountains', 'snowy'].includes(bioma)) return [0.6, 0.8, 1];
    return [0.65, 0.95, 0.85];
  }
  return hsl(0.5 + hashS(String(region)) * 0.5, 0.85, 0.65); // cristal: un tono por región, de verde azulado a magenta
}

// v13.3.3: el salón de la Red Honda donde está el jugador (null si no hay o el generador es viejo)
function salonAqui(gen, p) {
  if (!gen || gen.version < 26 || !gen.v2 || !gen.v2.cmNodo) return null;
  const gx = Math.floor(p.x / 96), gz = Math.floor(p.z / 96);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = gen.v2.cmNodo(gx + dx, gz + dz);
    if (!n.salon) continue;
    const a = (p.x - n.x) / n.rx, b = (p.y - n.y) / n.ry, c = (p.z - n.z) / n.rz;
    if (a * a + b * b + c * c < 0.7) return n;
  }
  return null;
}
// ---------- cada cuadro ----------
const ESTADO = new WeakMap();
const nuevo = () => ({ t: 0, fuentes: [], emisores: [], sala: 0.5 });
export function cuadroCueva(g, dt) {
  if (g.dim !== 'tierra' || !g.world || !g.env || g.env.cave < 0.5 || !g.player || !g.player.alive) { g.salaCueva = 0.5; return; }
  const S = ESTADO.get(g) || (ESTADO.set(g, nuevo()), ESTADO.get(g));
  const w = g.world, e = g.player.body.pos, A = g.audio;
  S.t += dt;
  // cada 0.5 s: se miran algunos bloques alrededor (las fuentes de sonido y de brillo) y la sala
  if (S.t >= 0.5) {
    S.t = 0;
    S.sala += (tamanoSala(w, e) - S.sala) * 0.5; g.salaCueva = S.sala;
    const nuevas = S.fuentes.filter((f) => Math.hypot(f.x - e.x, f.z - e.z) < 12);
    const seen = new Set(nuevas.map((f) => `${f.x},${f.y},${f.z}`));
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(e.x + (Math.random() - 0.5) * 20), y = Math.floor(e.y + (Math.random() - 0.5) * 10), z = Math.floor(e.z + (Math.random() - 0.5) * 20);
      const id = w.getBlock(x, y, z), k = `${x},${y},${z}`;
      if (seen.has(k)) continue;
      if (id === K.stalactite) { nuevas.push({ tipo: 'gota', x: x + 0.5, y: y + 0.2, z: z + 0.5, prox: S.t + Math.random() * 3 }); seen.add(k); }
      else if (id === K.water && w.getBlock(x, y + 1, z) === AIR) { nuevas.push({ tipo: 'agua', x: x + 0.5, y: y + 0.9, z: z + 0.5, prox: Math.random() }); seen.add(k); }
      else if (id === K.glow_mushroom || id === K.cristal || id === K.cristal_bloque) {
        const bioma = w.gen.column(x, z).biome;
        const col = colorBrillo(id === K.glow_mushroom ? 'hongo' : 'cristal', bioma, regionAt(w.gen, x, z));
        g.particles.spawn(x + 0.5 + (Math.random() - 0.5) * 0.6, y + 0.6, z + 0.5 + (Math.random() - 0.5) * 0.6, col, (Math.random() - 0.5) * 0.1, 0.12, (Math.random() - 0.5) * 0.1, 1.4, -0.05, true);
        anotarCueva(g, id === K.glow_mushroom ? 'hongos' : 'cristal');
        // v13.4.4 (CC5): y suena: el cristal canta y el hongo burbujea (los tres emisores más cercanos)
        nuevas.push({ tipo: id === K.glow_mushroom ? 'hongo' : 'cristal', x: x + 0.5, y: y + 0.5, z: z + 0.5, prox: Math.random() * 4 }); seen.add(k);
      }
      else if (id === K.magma) {
        nuevas.push({ tipo: 'magma', x: x + 0.5, y: y + 0.9, z: z + 0.5, prox: Math.random() * 2 }); seen.add(k);
      }
    }
    S.fuentes = nuevas.slice(0, 30);
    // los tres emisores: lo más cercano; conservan su reloj si siguen siendo los mismos
    const viejos = new Map(S.emisores.map((q) => [`${q.x},${q.y},${q.z}`, q]));
    S.emisores = elegirEmisores(S.fuentes, e).map((f) => viejos.get(`${f.x},${f.y},${f.z}`) || f);
    // v13.3.3: al entrar a un salón de la Red Honda aparece su nombre (una vez por salón y visita)
    const sn = salonAqui(w.gen, e);
    if (sn !== S.salon) { S.salon = sn; if (sn) { const vv = (g.meta.salonesVistos ||= []), kk = sn.gx + ',' + sn.gz; if (!vv.includes(kk) && vv.length < 400) vv.push(kk); g.ui.toast('🏛 Salón ' + sn.nombre, 2600); anotarCueva(g, 'nombre'); } }
    if (S.sala > 0.7 && g.env.cave > 0.8) anotarCueva(g, 'sala');
    if (S.emisores.some((q) => q.tipo === 'gota')) anotarCueva(g, 'goteo');
    if (S.emisores.some((q) => q.tipo === 'agua')) anotarCueva(g, 'agua');
  }
  for (const q of S.emisores) {
    q.prox -= dt;
    if (q.prox > 0) continue;
    if (q.tipo === 'gota') { q.prox = 1.8 + Math.random() * 3.8; A.play('gota', { pos: q, vol: 0.45, pitch: 0.85 + Math.random() * 0.6 }); }
    else if (q.tipo === 'cristal') { q.prox = 4 + Math.random() * 6; A.play('cristal_canta', { pos: q, vol: 0.3, pitch: 0.9 + Math.random() * 0.3 }); }
    else if (q.tipo === 'hongo') { q.prox = 5 + Math.random() * 7; A.play('hongo_burbuja', { pos: q, vol: 0.28, pitch: 0.85 + Math.random() * 0.4 }); }
    else if (q.tipo === 'magma') { q.prox = 2 + Math.random() * 3; A.play('magma_burbujea', { pos: q, vol: 0.4, pitch: 0.9 + Math.random() * 0.2 }); }
    else { q.prox = 1.0 + Math.random() * 0.5; A.play('agua_corre', { pos: q, vol: 0.32, pitch: 0.9 + Math.random() * 0.2 }); }
  }
}
const LIBRETA = {
  sala: ['🏛', 'Entré a una sala enorme: la voz hace eco y las paredes se pierden en la oscuridad.'],
  goteo: ['💧', 'Oí goteo: el agua baja por las estalactitas, gota a gota, desde hace miles de años.'],
  agua: ['🌊', 'Hay agua corriendo bajo tierra. Se oye antes de verse.'],
  hongos: ['🍄', 'Los hongos de cueva dan una luz suave; su color cambia según el lugar donde crecen.'],
  nombre: ['🗺', 'Los salones grandes de la cueva tienen nombre: busque el farol y la placa del cairn en el centro.'],
  cristal: ['💎', 'El cristal de las cuevas brilla con un color distinto en cada región.'],
};
function anotarCueva(g, k) {
  const V = (g.meta.cuevasVistas ||= {});
  if (V[k] || g.meta.invitado) return;
  V[k] = 1;
  if (LIBRETA[k]) anotar(g, LIBRETA[k][1], LIBRETA[k][0]);
}
export function limpiarCueva(g) { ESTADO.delete(g); g.salaCueva = 0.5; }
// /prueba cuevavida
export function pruebaCuevaVida(g) {
  const p = g.player.body.pos, d = g.player.lookDir();
  TIPOS_CUEVA.forEach((t, i) => { g.entities.spawnMob(t, p.x + d.x * 5 - d.z * (i - 1) * 1.6, p.y + 0.3, p.z + d.z * 5 + d.x * (i - 1) * 1.6); });
  return 'Cangrejo ciego, grillo de cueva y escarabajo de calcita delante (acérquese al escarabajo: se hace bolita)';
}
