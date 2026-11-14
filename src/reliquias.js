// Los escondites de Zenaida: la abuela no confiaba en los bancos y guardó lo suyo en cofrecitos por todo el país. Desde el capítulo 4
// la brújula marca el primero; cada uno trae una reliquia y una nota que dice dónde está el siguiente. Son cinco, cada vez más lejos.
// Entre las reliquias está la chancleta, que se tira con clic derecho y vuelve sola. El estado vive en meta.escondites.
import * as THREE from 'three';
import { AIR, BLOCKS, BLOCK_BY_KEY as K, FLUID, SOLID } from './blocks.js';
import { anotar } from './diario.js';
import { ventaja } from './progreso.js';
import { entregarCarta } from './historia.js';
import { factorMejora } from './yunque.js';
import { difOf } from './supervivencia.js';

export const CHANCLETA = 505;
const ANCHO = 9, FONDO = 7, COLON = 360;
// reliquia y carta que trae (las cartas 11 a 15 de historia.js)
const ESCONDITES = [
  { id: 503, carta: 11, lejos: 220, nom: 'el machete' },
  { id: 504, carta: 12, lejos: 300, nom: 'el delantal' },
  { id: CHANCLETA, carta: 13, lejos: 380, nom: 'la chancleta', guardias: 2 },
  { id: 506, carta: 14, lejos: 460, nom: 'el sombrero', guardias: 3 },
  { id: 507, carta: 15, lejos: 540, nom: 'el cucharón', guardias: 3, grande: true },
];
const tiene = (g, id) => g.inventory.count(id) > 0 || g.inventory.armor.some((s) => s && s.id === id);

function buscarPunto(g, E, H) {
  const gen = g.world.gen, cx = H.casa.x + ANCHO / 2, cz = H.casa.z + FONDO / 2;
  for (let k = 0; k < 80; k++) {
    const a = Math.random() * Math.PI * 2, r = E.lejos + Math.random() * 60;
    const x = Math.floor(cx + Math.cos(a) * r), z = Math.floor(cz + Math.sin(a) * r), c = gen.column(x, z);
    if (c.h <= 63 || c.h > 110 || ['ocean', 'volcano'].includes(c.biome)) continue;
    return { x, z };
  }
  return { x: Math.floor(cx + E.lejos), z: Math.floor(cz) };
}
function armar(g, R, E) {
  const w = g.world;
  // el suelo de verdad, cerca del punto: que no quede en el agua ni encima de un árbol
  for (let r = 0; r < 18; r++) for (let a = 0; a < 12; a++) {
    const x = Math.floor(R.x + Math.cos((a / 12) * 6.283) * r), z = Math.floor(R.z + Math.sin((a / 12) * 6.283) * r);
    if (!w.isLoaded(x, z)) continue;
    let y = 130;
    while (y > 62 && !SOLID[w.getBlock(x, y, z)] && !FLUID[w.getBlock(x, y, z)]) y--;
    const id = w.getBlock(x, y, z);
    if (FLUID[id] || y <= 62 || BLOCKS[id].leafy || w.getBlock(x, y + 1, z) !== AIR) continue;
    w.setBlock(x, y + 1, z, K.chest);
    g.stations.placed(K.chest, x, y + 1, z, 0);
    const be = w.getBE(x, y + 1, z);
    be.slots[0] = { id: E.id, count: 1 };
    if (R.pagado !== R.i) { be.slots[1] = { id: COLON, count: 10 + R.i * 5 }; R.pagado = R.i; } // los colones, una sola vez
    w.touchBE(x, y + 1, z);
    // tres piedras apiladas, para que se vea de lejos
    for (let n = 0; n < 3; n++) if (w.getBlock(x + 1, y + 1 + n, z) === AIR) w.setBlock(x + 1, y + 1 + n, z, K.cobble);
    R.cofre = { x, y: y + 1, z };
    return true;
  }
  return false;
}
function guardias(g, R, E) {
  const w = g.world, q = R.cofre, dia = g.day || 1;
  for (let i = 0; i < (E.guardias || 0) + (E.grande ? 1 : 0); i++) {
    const a = (i / 4) * 6.283, x = Math.floor(q.x + Math.cos(a) * 5), z = Math.floor(q.z + Math.sin(a) * 5);
    if (!w.isLoaded(x, z)) continue;
    let y = q.y + 6;
    while (y > q.y - 8 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
    const m = g.entities.spawnMob(E.grande && i === 0 ? 'sombra_grande' : 'sombra', x + 0.5, y + 0.2, z + 0.5);
    if (!m) continue;
    m.data.apuro = true; m.data.provoked = true;
    m.health += Math.min(14, Math.floor(dia / 2));
    g.particles.burst(x + 0.5, y + 1, z + 0.5, [[0.05, 0.02, 0.1], [0.3, 0.12, 0.4]], 12, 1.8);
  }
  g.audio.play('sombra', { ui: true, vol: 0.5 });
  g.ui.toast('🌑 Las Sombras también andaban buscando el escondite', 2600);
}
// cada segundo
export function tickEscondites(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  const H = g.meta.hist;
  if (!H || !H.casa || !H.hogar) return;
  let R = g.meta.escondites;
  if (!R) {
    if ((H.cap || 0) < 3) return;
    R = g.meta.escondites = { i: 0, ...buscarPunto(g, ESCONDITES[0], H), cofre: null };
    g.ui.toast('📦 Zenaida guardó cosas por todo el país: la brújula marca el primer escondite', 5000);
    anotar(g, 'Zenaida dejó escondites por todo el país. La brújula marca el primero.', '📦');
    return;
  }
  if (R.fin) return;
  const E = ESCONDITES[R.i], p = g.player.body.pos;
  if (tiene(g, E.id)) {
    entregarCarta(g, E.carta);
    g.addXP(25 + R.i * 15);
    g.audio.play('nivel', { ui: true, vol: 0.5 });
    if (R.i === 0) g.achieve('escondite1', 'El machete de Zenaida');
    if (R.i === 2) g.achieve('escondite3', 'La chancleta de Zenaida');
    anotar(g, `Encontré ${E.nom} de Zenaida.`, '📦');
    if (E.id === 507) g.meta.cucharon = true;
    R.i++;
    R.cofre = null; R.guardias = false;
    if (R.i >= ESCONDITES.length) {
      R.fin = g.day || 1; R.x = null; R.z = null;
      g.achieve('escondites', 'Todo lo que tenía');
      g.ui.regionBanner('Los cinco escondites', 'Ya tiene todo lo que Zenaida guardó');
      return;
    }
    Object.assign(R, buscarPunto(g, ESCONDITES[R.i], H));
    g.ui.toast(`📦 ¡${E.nom[0].toUpperCase()}${E.nom.slice(1)} de Zenaida! La carta dice dónde está el siguiente: mire la brújula`, 4600);
    return;
  }
  const d = Math.hypot(R.x - p.x, R.z - p.z);
  if (!R.cofre) {
    if (d < 44 && g.world.isLoaded(R.x, R.z) && armar(g, R, E)) g.ui.toast(`📦 Por aquí está el escondite: busque tres piedras apiladas`, 3000);
    return;
  }
  if (!R.guardias && d < 20 && E.guardias && g.settings.hostiles && difOf(g).hostiles) { R.guardias = true; guardias(g, R, E); }
  // si el cofre se quebró y el objeto se perdió, a los 5 minutos vuelve a aparecer: que no se trabe, pero que tampoco sea una fábrica
  if (g.world.isLoaded(R.cofre.x, R.cofre.z) && g.world.getBlock(R.cofre.x, R.cofre.y, R.cofre.z) !== K.chest) {
    R.roto = (R.roto || 0) + 1;
    if (R.roto > 300 && d > 30) { R.cofre = null; R.roto = 0; }
  }
}
export const puntoEscondite = (g) => { const R = g.meta && g.meta.escondites; return R && !R.fin && R.x != null ? { x: R.x, z: R.z } : null; };

// ---------- la chancleta: se tira y vuelve ----------
function modeloChancleta() {
  const g = new THREE.Group(), m = (c) => new THREE.MeshBasicMaterial({ color: c });
  const suela = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.42), m(0x8a5a30));
  const tira = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), m(0xd83a3a)); tira.position.set(0, 0.04, 0.06);
  g.add(suela, tira);
  return g;
}
export function lanzarChancleta(g) {
  if (g.chancleta) return false;
  const e = g.player.eye, d = g.player.lookDir(), s = g.inventory.held;
  const mesh = modeloChancleta(); g.scene.add(mesh);
  mesh.position.set(e.x + d.x * 0.6, e.y - 0.15 + d.y * 0.6, e.z + d.z * 0.6);
  g.chancleta = { mesh, vx: d.x * 19, vy: d.y * 19, vz: d.z * 19, t: 0, vuelve: false, hits: new Set(), dmg: 6 * g.damageBonus() * factorMejora(s) * ventaja.tiro(g) * (g.inventory.count(518) ? 1.6 : 1) };
  if (g.mode === 'survival') g.inventory.wearHeld();
  g.audio.play('swish', { ui: true, vol: 0.7, pitch: 1.2 });
  g.achieve('chancleta', 'La chancleta voladora');
  return true;
}
export function tickChancleta(g, dt) {
  const C = g.chancleta;
  if (!C) return;
  C.t += dt;
  const o = C.mesh.position, e = g.player.eye;
  if (!C.vuelve && (C.t > 0.55 || SOLID[g.world.getBlock(Math.floor(o.x), Math.floor(o.y), Math.floor(o.z))])) { C.vuelve = true; C.hits.clear(); }
  if (C.vuelve) {
    const dx = e.x - o.x, dy = e.y - 0.3 - o.y, dz = e.z - o.z, l = Math.hypot(dx, dy, dz) || 1, v = 24;
    C.vx = (dx / l) * v; C.vy = (dy / l) * v; C.vz = (dz / l) * v;
    if (l < 1 || C.t > 3) { limpiarChancleta(g); return; }
  }
  o.x += C.vx * dt; o.y += C.vy * dt; o.z += C.vz * dt;
  C.mesh.rotation.y += dt * 22; C.mesh.rotation.x = 0.4;
  for (const m of g.entities.mobs) {
    if (m.dead || m.dying || C.hits.has(m) || !(m.kind.hostile || m.kind.legend || m.kind.boss || m.kind.mini)) continue;
    const b = m.body.pos, h = (m.kind.h || 1.8) / 2;
    if (Math.hypot(b.x - o.x, b.z - o.z) > 1.1 || Math.abs(b.y + h - o.y) > h + 0.6) continue;
    C.hits.add(m);
    g.golpeando = m; try { m.hurt(C.dmg, g.player.body.pos.x, g.player.body.pos.z); } finally { g.golpeando = null; }
    g.audio.play('chancleta.golpe', { pos: { x: o.x, y: o.y, z: o.z }, vol: 1 });
    if (m.dying) { g.killedMob(m); g.achieve('chancleta_baja', 'Hasta las Sombras le tienen miedo'); }
  }
}
export function limpiarChancleta(g) { if (g.chancleta) { g.scene.remove(g.chancleta.mesh); g.chancleta = null; } }
