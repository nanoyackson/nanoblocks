// Las quemas de verano: en el bosque seco y en los llanos de Guanacaste, con el verano y sin lluvia, a veces se prende el monte. Se ve la columna de
// humo de lejos y avanza con el viento por el zacate, las matas y los árboles. Se apaga a baldazos de agua, se detiene con un cortafuegos (donde no
// hay nada que arda, no pasa) y se acaba sola con la lluvia o cuando ya no tiene qué quemar. Lo quemado queda en ceniza y troncos negros.
// Estado: g.quema (no se guarda); meta.quemaDia y meta.quemasApagadas.
import * as THREE from 'three';
import { BLOCKS, ITEMS, BLOCK_BY_KEY as K, AIR, FLUID } from './blocks.js';
import { anotar } from './diario.js';
import { difOf } from './supervivencia.js';
import { regionAt } from './regiones.js';
import { CHUNK, idx } from './worldgen.js';
import { key } from './world.js';
import { villageAt, CELL } from './pueblogen.js';

const COLON = 360, TOPE = 70, TOTAL = 260, DURA = 300, ARDE = 7;
const CENIZA = 602, QUEMADO = 601, REBROTE_TOPE = 1200;
const k2 = (x, z) => x + ',' + z;
const esTronco = (b) => b && /(^|_)log$/.test(b.key);
const arde = (id) => { const b = BLOCKS[id]; return !!b && !FLUID[id] && (b.leafy || esTronco(b) || id === K.grass || (b.render === 'cross' && !b.glow && !b.crop && (b.sound === 'grass' || b.sound === 'leaves'))); };
// lo que puso o cambió alguien (quien juega, una obra) no se quema: solo el monte como lo dejó la naturaleza
const tocado = (g, x, y, z) => { const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), m = g.world.mods.get(key(cx, cz)); return !!m && m.has(idx(x - cx * CHUNK, y, z - cz * CHUNK)); };
const seco = (g, x, z) => { const bio = g.world.gen.column(x, z).biome; return bio === 'bosque_seco' || (bio === 'plains' && regionAt(g.world.gen, x, z) === 'guanacaste'); };
// el bloque de más arriba de la columna, si es de los que arden
function tope(g, x, z, yRef) {
  const w = g.world;
  for (let y = yRef + 10; y >= yRef - 6; y--) {
    const id = w.getBlock(x, y, z);
    if (id === AIR) continue;
    return arde(id) ? y : null;
  }
  return null;
}
function cerca(g, x, z) {
  const M = g.meta, H = M.hist;
  if (H && H.casa && x > H.casa.x - 5 && x < H.casa.x + 14 && z > H.casa.z - 5 && z < H.casa.z + 12) return true;
  for (const q of [M.lote, M.spawn]) if (q && Math.hypot(q.x - x, q.z - z) < 16) return true;
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const v = villageAt(g.world.gen, cx + dx, cz + dz); if (v && Math.hypot(v.x - x, v.z - z) < 90) return true; }
  return false;
}
function prender(g, Q, x, z, yRef) {
  const k = k2(x, z);
  if (Q.celdas.has(k) || Q.hecho.has(k) || !g.world.isLoaded(x, z) || (!Q.libre && (!seco(g, x, z) || cerca(g, x, z)))) { Q.hecho.add(k); return false; }
  const y = tope(g, x, z, yRef);
  if (y === null || tocado(g, x, y, z)) return false;
  Q.celdas.set(k, { x, y, z, t: ARDE + Math.floor(Math.random() * 5) });
  return true;
}
// lo que deja el fuego en una columna: de arriba para abajo, hasta topar con algo que no arde
function quemar(g, c) {
  const w = g.world;
  let y = c.y;
  for (let n = 0; n < 12; n++, y--) {
    const id = w.getBlock(c.x, y, c.z), b = BLOCKS[id];
    if (id === AIR) continue;
    if (!arde(id) || tocado(g, c.x, y, c.z)) break;
    if (b.leafy || b.render === 'cross') w.setBlock(c.x, y, c.z, AIR, { updates: false });
    else if (esTronco(b)) w.setBlock(c.x, y, c.z, QUEMADO, { updates: false });
    else if (id === K.grass) {
      w.setBlock(c.x, y, c.z, K.dirt, { updates: false });
      if (w.getBlock(c.x, y + 1, c.z) === AIR) w.setBlock(c.x, y + 1, c.z, CENIZA, { updates: false });
      const R = (g.meta.rebrote ||= []);
      if (R.length < REBROTE_TOPE) R.push([c.x, y, c.z, g.day || 1]);
      break;
    }
  }
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
// cada segundo
export function tickQuema(g) {
  if (g.mode !== 'survival' || !g.meta || g.dim !== 'tierra') { if (g.quema) limpiarQuema(g); return; }
  rebrotar(g);
  const Q = g.quema;
  if (!Q) { quizaEmpezar(g); return; }
  Q.t++;
  const llueve = g.weather && g.weather.type !== 'clear';
  if (llueve) { terminar(g, Q, 'lluvia'); return; }
  const p = g.player.body.pos;
  let sx = 0, sz = 0, n = 0, masCerca = null, dCerca = 1e9;
  for (const [k, c] of [...Q.celdas]) {
    c.t--;
    // se riega: a veces brinca a una vecina, más fácil a favor del viento
    if (Math.random() < 0.3 && Q.celdas.size < TOPE && Q.quemadas < TOTAL && Q.t < DURA) {
      const [dx, dz] = Math.random() < 0.45 ? Q.viento : DIRS[Math.floor(Math.random() * 8)];
      prender(g, Q, c.x + dx, c.z + dz, c.y);
    }
    if (c.t <= 0) { Q.celdas.delete(k); Q.hecho.add(k); quemar(g, c); Q.quemadas++; continue; }
    sx += c.x; sz += c.z; n++;
    const d = Math.hypot(c.x + 0.5 - p.x, c.z + 0.5 - p.z);
    if (d < dCerca) { dCerca = d; masCerca = c; }
    // humo
    if (Math.random() < 0.3) g.particles.spawn(c.x + 0.5, c.y + 2, c.z + 0.5, [0.32, 0.3, 0.28], Q.viento[0] * 0.6, 2.2, Q.viento[1] * 0.6, 3.5, -0.6);
    // quien se para en el fuego, se quema
    if (d < 0.9 && Math.abs(p.y - (c.y + 1)) < 1.6 && g.player.alive && !g.player.effects.ignifugo) {
      g.damagePlayer(difOf(g).dmg * 1.5, null, null, 'Quemaduras en una quema de monte', true, false);
      if (!Q.avisoPie) { Q.avisoPie = true; g.ui.toast('🔥 ¡Se está quemando! Sálgase del fuego y eche agua desde el lado', 2600); }
    }
  }
  // cuenta como apagada si el último foco lo apagó uno, o si uno apagó más de lo que se quemó solo
  if (!n) { terminar(g, Q, Q.porBalde || (Q.apagadas >= 4 && Q.apagadas >= Q.quemadas) ? 'apagada' : 'sola'); return; }
  Q.centro = { x: sx / n, z: sz / n };
  // la columna de humo, que se ve de lejos
  for (let i = 0; i < 6; i++) g.particles.spawn(Q.centro.x + (Math.random() - 0.5) * 4, (masCerca ? masCerca.y : 70) + 4 + Math.random() * 6, Q.centro.z + (Math.random() - 0.5) * 4, [0.38, 0.36, 0.34], Q.viento[0], 3, Q.viento[1], 6, -0.4);
  g.audio.setEmitter('quema', 'loop.fire', masCerca && dCerca < 40 ? { x: masCerca.x + 0.5, y: masCerca.y + 1, z: masCerca.z + 0.5 } : null, Math.min(1, n / 12));
  if (!Q.avisoCerca && dCerca < 14) { Q.avisoCerca = true; g.ui.toast('🔥 Con baldes de agua se apaga. Donde no hay zacate ni matas, no pasa: cave un cortafuegos', 4200); }
}
function quizaEmpezar(g) {
  const M = g.meta, P = g.player, p = P.body.pos, dia = g.day || 1;
  if (!P.alive || g.season !== 'verano' || (g.weather && g.weather.type !== 'clear') || g.asedio || g.nocheLarga || g.ceniza || g.crecida) return;
  if (dia - (M.quemaDia || -99) < 4 || dia < 3) return;
  if (!seco(g, Math.floor(p.x), Math.floor(p.z))) return;
  // estando en zona seca: en promedio 5 minutos en la sequía y 10 fuera de ella; el freno de verdad son los 4 días entre una y otra
  const sequia = ((dia - 1) % 14) >= 3 && ((dia - 1) % 14) <= 6;
  if (Math.random() > (sequia ? 1 / 300 : 1 / 600)) return;
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = 28 + Math.random() * 22;
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!seco(g, x, z)) continue;
    const Q = { celdas: new Map(), hecho: new Set(), t: 0, quemadas: 0, apagadas: 0, centro: { x, z }, viento: DIRS[Math.floor(Math.random() * 8)] };
    if (!prender(g, Q, x, z, g.world.gen.column(x, z).h)) continue;
    prender(g, Q, x + 1, z, g.world.gen.column(x, z).h);
    M.quemaDia = dia;
    g.quema = Q;
    const rumbo = ['E', 'SE', 'S', 'SO', 'O', 'NO', 'N', 'NE'][((Math.round(Math.atan2(z - p.z, x - p.x) / (Math.PI / 4)) % 8) + 8) % 8];
    g.ui.toast(`🔥 Huele a humo. Se prendió el monte hacia el ${rumbo} (🔥 en la brújula)`, 4200);
    g.audio.play('ignite', { ui: true, vol: 0.4 });
    return;
  }
}
// el balde: lo llama el uso del balde con agua; devuelve true si cayó sobre fuego
export function apagarConBalde(g, x, y, z) {
  const Q = g.quema;
  if (!Q) return false;
  let n = 0;
  for (const [k, c] of [...Q.celdas]) {
    if (Math.hypot(c.x - x, c.z - z) <= 3.2 && Math.abs(c.y - y) <= 7) { Q.celdas.delete(k); Q.hecho.add(k); n++; }
  }
  if (!n) return false;
  Q.apagadas += n;
  if (!Q.celdas.size) Q.porBalde = true; // el último foco lo apagó uno
  for (let i = 0; i < 24; i++) g.particles.spawn(x + Math.random() * 2 - 0.5, y + 1 + Math.random(), z + Math.random() * 2 - 0.5, [0.85, 0.85, 0.85], (Math.random() - 0.5), 1.5 + Math.random(), (Math.random() - 0.5), 1.4, -1);
  g.audio.play('splash', { pos: { x: x + 0.5, y: y + 1, z: z + 0.5 }, vol: 0.7 });
  return true;
}
function terminar(g, Q, como) {
  limpiarQuema(g);
  const M = g.meta, m2 = Q.quemadas === 1 ? '1 metro cuadrado' : `${Q.quemadas} metros cuadrados`;
  if (como === 'lluvia') {
    g.ui.toast('🌧 Empezó a llover y la quema se apagó sola. Huele a monte mojado', 3200);
    anotar(g, 'Se prendió el monte y lo apagó un aguacero.', '🌧');
    return;
  }
  // cuenta como apagada si el último foco lo apagó uno, y no fue un solo baldazo a una chispa
  if (como === 'apagada' && Q.apagadas < 4) {
    g.ui.toast('🔥 La apagó a tiempo, antes de que agarrara. Así se hace', 2800);
    anotar(g, 'Agarré una quema chiquitica antes de que se regara.', '💧');
    return;
  }
  if (como === 'apagada') {
    M.quemasApagadas = (M.quemasApagadas || 0) + 1;
    const paga = Q.quemadas < 30 ? 40 : 20;
    g.giveItem(COLON, paga);
    g.ui.toast(`🚒 Apagada. La brigada de voluntarios del cantón le manda ₡${paga} y un «diay, gracias». Lo quemado: ${m2}`, 4600);
    g.achieve('quema_apagada', 'Apagafuegos de monte');
    if (M.quemasApagadas >= 3) g.achieve('quema_tres', 'Brigadista');
    if (M.quemasApagadas === 3) {
      g.giveItem(BOMBA, 1);
      g.ui.toast('🎒 Con la tercera, la brigada le da una bomba de espalda: se llena en cualquier río', 4600);
    }
    anotar(g, Q.quemadas < 30 ? 'Apagué una quema a baldazos antes de que agarrara fuerza.' : 'Apagué una quema, pero ya se había comido un buen pedazo de monte.', '🚒');
    return;
  }
  if (Q.quemadas < 5) { g.ui.toast('🔥 La chispa no agarró: se apagó sola. El humo ya se va', 2600); return; }
  g.ui.toast(`🔥 La quema se acabó sola: se comió ${m2} de monte. Con las lluvias rebrota`, 3600);
  g.achieve('quema_vista', 'Humo de verano');
  anotar(g, 'Vi arder el monte en verano. Queda negro, pero dicen que rebrota con las lluvias.', '🔥');
}
// ---------- el rebrote: con la lluvia, lo quemado vuelve a echar pasto (y alguna mata), tres columnas por segundo ----------
function rebrotar(g) {
  const R = g.meta.rebrote;
  if (!R || !R.length || g.quema || !g.weather || g.weather.type === 'clear') return;
  const w = g.world;
  let hechos = 0;
  for (let i = R.length - 1; i >= 0 && hechos < 3; i--) {
    const [x, y, z, dia] = R[i];
    if ((g.day || 1) - (dia || 0) > 40) { R.splice(i, 1); continue; } // muy viejo: ya rebrotó solo, sin que nadie lo viera
    if (!w.isLoaded(x, z)) continue;
    R.splice(i, 1); hechos++;
    if (w.getBlock(x, y, z) !== K.dirt) continue; // ya lo tocó uno: se respeta
    const arriba = w.getBlock(x, y + 1, z);
    if (arriba !== CENIZA && arriba !== AIR) continue;
    w.setBlock(x, y, z, K.grass);
    w.setBlock(x, y + 1, z, Math.random() < 0.22 ? K.tall_grass : AIR);
  }
  if (hechos && !R.length) {
    g.achieve('rebrote', 'Rebrotó el monte');
    anotar(g, 'Llovió sobre lo quemado y ya está verde otra vez. El monte no guarda rencor.', '🌱');
    g.ui.toast('🌱 Con las lluvias, el monte que se quemó ya rebrotó', 3200);
  }
}
// ---------- la bomba de espalda (la manda la brigada a quien ya apagó tres) ----------
export const BOMBA = 522;
export function usarBomba(g) {
  const s = g.inventory.held, def = ITEMS[BOMBA];
  if (g.useCd > 0) return;
  const { e, d } = g.eyeAndDir();
  const ft = g.world.raycast(e.x, e.y, e.z, d.x, d.y, d.z, 9, true);
  g.useCd = 0.35; g.swing = 1;
  if (ft && FLUID[ft.id] === 1) {
    if (s.dur >= def.durability) { g.ui.toast('💧 La bomba ya está llena', 1400); return; }
    s.dur = def.durability;
    g.audio.play('balde', { pos: { x: ft.x + 0.5, y: ft.y + 0.5, z: ft.z + 0.5 }, vol: 0.6 });
    g.ui.toast(`💧 Bomba llena: ${def.durability} rociadas`, 1600);
    return;
  }
  if ((s.dur ?? 0) <= 0) { g.ui.toast('💧 La bomba está vacía: apunte a un río o una laguna para llenarla', 2200); return; }
  // el chorro, se vea o no se vea fuego
  for (let i = 0; i < 18; i++) {
    const k = 1 + Math.random() * 7;
    g.particles.spawn(e.x + d.x * k, e.y + d.y * k - 0.3, e.z + d.z * k, [0.55, 0.75, 1], d.x * 3 + (Math.random() - 0.5), d.y * 3 + 0.5, d.z * 3 + (Math.random() - 0.5), 0.7, 12);
  }
  if (ft && apagarConBalde(g, ft.x, ft.y, ft.z)) { if (g.mode === 'survival') s.dur--; return; }
  g.audio.play('splash', { pos: { x: e.x + d.x * 4, y: e.y, z: e.z + d.z * 4 }, vol: 0.3 });
}
export function marcaQuema(g) { return g.quema && g.dim === 'tierra' ? g.quema.centro : null; }
export function limpiarQuema(g) { g.quema = null; if (malla) malla.count = 0; if (humo) for (const h of humo) h.s.visible = false; if (g.audio) g.audio.setEmitter('quema', 'loop.fire', null, 0); }
// para /prueba quema: la prende cerca, hacia donde uno mira
export function pruebaQuema(g) {
  const p = g.player.body.pos, d = g.player.lookDir();
  for (let r = 10; r < 40; r += 2) {
    const x = Math.floor(p.x + d.x * r), z = Math.floor(p.z + d.z * r);
    const Q = { celdas: new Map(), hecho: new Set(), t: 0, quemadas: 0, apagadas: 0, centro: { x, z }, libre: true, viento: [Math.sign(Math.round(d.x)), Math.sign(Math.round(d.z))] };
    if (!Q.viento[0] && !Q.viento[1]) Q.viento = [1, 0];
    if (!prender(g, Q, x, z, Math.floor(p.y))) continue;
    g.weather.type = 'clear';
    g.quema = Q;
    return `Quema a ${r} bloques, adelante (🔥 en la brújula). Apague con un balde de agua`;
  }
  return 'Aquí no hay nada que arda adelante: pruebe mirando a zacate o árboles';
}
// ---------- las llamas: cruces de planos dibujadas aparte (no son bloques: así nada queda guardado en el mundo) ----------
let malla = null, tex = null, humo = null;
const BOCANADAS = 22;
function textura() {
  const c = document.createElement('canvas'); c.width = 32; c.height = 16;
  const x2 = c.getContext('2d');
  // dos cuadros de 16×16, la llama corrida un poquito en cada uno
  for (let f = 0; f < 2; f++) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const cx = 7.5 + (f ? 0.8 : -0.8) * Math.sin(y * 0.7), lengua = Math.sin(x * 1.3 + f * 2) * 1.5;
    const d = Math.abs(x - cx) / (6.5 - (15 - y) * 0.25) + (15 - y + lengua) / 16;
    if (d >= 1) continue;
    x2.fillStyle = d < 0.4 ? '#fff2a0' : d < 0.62 ? '#ffc040' : d < 0.82 ? '#ff7a18' : '#d83a0c';
    x2.fillRect(f * 16 + x, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(0.5, 1);
  return t;
}
function crearMalla(g) {
  tex = textura();
  const a = new THREE.PlaneGeometry(1, 1), b = new THREE.PlaneGeometry(1, 1);
  b.rotateY(Math.PI / 2);
  const geo = new THREE.BufferGeometry();
  const pos = [...a.attributes.position.array, ...b.attributes.position.array], uv = [...a.attributes.uv.array, ...b.attributes.uv.array];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex([0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5]);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, depthWrite: false });
  malla = new THREE.InstancedMesh(geo, mat, TOPE);
  malla.frustumCulled = false; malla.count = 0;
  g.scene.add(malla);
}
// la columna de humo: bocanadas grandes que suben, crecen y se van con el viento; se ve de lejos
function columna(g, Q, dt) {
  if (!humo || humo[0].s.parent !== g.scene) {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x2 = c.getContext('2d'), gr = x2.createRadialGradient(16, 16, 2, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x2.fillStyle = gr; x2.fillRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(c);
    humo = [];
    for (let i = 0; i < BOCANADAS; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: 0x4a4440, transparent: true, depthWrite: false, opacity: 0 }));
      s.visible = false; g.scene.add(s);
      humo.push({ s, vida: (i / BOCANADAS) * 9 });
    }
  }
  const lista = [...Q.celdas.values()], y0 = lista.length ? lista.reduce((a, c) => a + c.y, 0) / lista.length + 2 : 70;
  for (const h of humo) {
    h.vida += dt;
    if (h.vida >= 9 || !h.s.visible) {
      if (!lista.length) { h.s.visible = false; continue; }
      const c = lista[Math.floor(Math.random() * lista.length)];
      h.vida = h.s.visible ? 0 : h.vida % 9; h.s.visible = true;
      h.s.position.set(c.x + 0.5, y0 + h.vida * 2.2, c.z + 0.5);
    }
    const k = h.vida / 9;
    h.s.position.x += Q.viento[0] * dt * (0.4 + k); h.s.position.z += Q.viento[1] * dt * (0.4 + k); h.s.position.y += dt * 2.2;
    const tam = 3 + k * 12; h.s.scale.set(tam, tam, 1);
    h.s.material.opacity = Math.min(1, k * 5) * (1 - k * 0.8) * 0.8;
  }
}
const MT = new THREE.Matrix4(), PO = new THREE.Vector3(), RO = new THREE.Quaternion(), ES = new THREE.Vector3(), EJE = new THREE.Vector3(0, 1, 0);
let reloj = 0;
// cada cuadro
export function dibujarQuema(g, dt) {
  const Q = g.quema;
  if (!Q || g.dim !== 'tierra') { if (malla) malla.count = 0; if (humo) for (const h of humo) h.s.visible = false; return; }
  if (!malla || malla.parent !== g.scene) crearMalla(g);
  columna(g, Q, dt);
  reloj += dt;
  tex.offset.x = Math.floor(reloj * 7) % 2 ? 0.5 : 0;
  const p = g.player.body.pos;
  let n = 0;
  for (const c of Q.celdas.values()) {
    if (n >= TOPE) break;
    const semilla = (c.x * 7 + c.z * 13) % 10, alto = 0.9 + 0.35 * Math.sin(reloj * 9 + semilla) + (c.t > 3 ? 0.3 : 0);
    RO.setFromAxisAngle(EJE, semilla * 0.3);
    PO.set(c.x + 0.5, c.y + 1 + alto / 2 - 0.05, c.z + 0.5); ES.set(1, alto, 1);
    MT.compose(PO, RO, ES);
    malla.setMatrixAt(n++, MT);
    // chispas que suben, solo cerca
    if (Math.random() < dt * 4 && Math.abs(c.x - p.x) + Math.abs(c.z - p.z) < 50) g.particles.spawn(c.x + 0.3 + Math.random() * 0.4, c.y + 1.5, c.z + 0.3 + Math.random() * 0.4, [1, 0.6, 0.15], (Math.random() - 0.5) * 0.6, 2 + Math.random() * 1.5, (Math.random() - 0.5) * 0.6, 1.2, -1, true);
  }
  malla.count = n;
  malla.instanceMatrix.needsUpdate = true;
}
