// El pueblo se siente vivo: humo de los fogones saliendo de las casas al amanecer y al atardecer, ropa tendida que
// ondea en los patios, perros callejeros que le ladran a uno de noche y, en las noches de fiesta, el torito de pólvora
// que corre por la plaza echando chispas (y correteando a la gente).
import * as THREE from 'three';
import { SOLID, AIR } from './blocks.js';
import { fiestaHoy } from './fiestas2.js';
import { decir } from './misiones.js';

const techo = (w, x, z, y0) => { for (let y = y0 + 22; y > y0 - 2; y--) if (SOLID[w.getBlock(Math.floor(x), y, Math.floor(z))]) return y + 1; return null; };
const piso = (w, x, z, y0) => { for (let y = y0 + 4; y > y0 - 6; y--) if (SOLID[w.getBlock(Math.floor(x), y - 1, Math.floor(z))] && w.getBlock(Math.floor(x), y, Math.floor(z)) === AIR) return y; return null; };

// ---------- la ropa tendida ----------
const COLS = [0xe83a3a, 0xf4f4f0, 0x3a7ae8, 0xf0c020, 0xe85ad8, 0x3ab84a, 0x8a5a3a];
function tendedero() {
  const g = new THREE.Group();
  const madera = new THREE.MeshBasicMaterial({ color: 0x6a4424 });
  for (const s of [-1, 1]) { const poste = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), madera); poste.position.set(s * 1.6, 0.95, 0); g.add(poste); }
  const cuerda = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xdddddd }));
  cuerda.position.y = 1.85; g.add(cuerda);
  const prendas = [];
  for (let i = 0; i < 5; i++) {
    const piv = new THREE.Group(); piv.position.set(-1.25 + i * 0.62, 1.84, 0);
    const alto = 0.4 + Math.random() * 0.35;
    const prenda = new THREE.Mesh(new THREE.PlaneGeometry(0.42, alto), new THREE.MeshBasicMaterial({ color: COLS[(Math.random() * COLS.length) | 0], side: THREE.DoubleSide }));
    prenda.position.y = -alto / 2;
    piv.add(prenda); g.add(piv); prendas.push({ piv, f: Math.random() * 6 });
  }
  g.userData.prendas = prendas;
  return g;
}

export function tickPuebloVivo(g, dt) {
  if (g.dim !== 'tierra') { limpiarPuebloVivo(g); return; }
  const p = g.player.body.pos, w = g.world, t = g.time || 0;
  g.pvT = (g.pvT || 0) - dt;
  const near = g.nearestVillage(p.x, p.z);
  const enPueblo = near && near.dist < 70;
  if (g.pvT <= 0) {
    g.pvT = 1;
    // el pueblo cercano: casas con chimenea y patios para tender
    if (enPueblo && g.pvVid !== near.v.id) {
      limpiarPuebloVivo(g);
      g.pvVid = near.v.id;
      const casas = near.v.buildings.filter((b) => b.kind !== 'plaza' && b.kind !== 'iglesia');
      g.chimeneas = [];
      for (const b of casas.slice(0, 10)) {
        const cx = b.x + b.w * 0.7, cz = b.z + b.d * 0.3;
        const y = techo(w, cx, cz, near.v.y);
        if (y) g.chimeneas.push({ x: cx, y, z: cz, t: Math.random() * 5 });
      }
      g.tendederos = [];
      for (const b of casas.slice(0, 6)) {
        if (Math.random() < 0.45) continue;
        const x = b.x + b.w + 2, z = b.z + b.d / 2;
        const y = piso(w, x, z, near.v.y);
        if (y == null) continue;
        let libre = true;
        for (let k = -2; k <= 2; k++) for (let h = 0; h < 2; h++) if (w.getBlock(Math.floor(x), y + h, Math.floor(z + k))) libre = false;
        if (!libre) continue;
        const tend = tendedero();
        tend.position.set(x + 0.5, y, z);
        tend.rotation.y = Math.PI / 2;
        g.scene.add(tend);
        g.tendederos.push(tend);
      }
    }
    if (!enPueblo && g.pvVid) limpiarPuebloVivo(g);
  }
  if (!enPueblo) return;
  // humo de los fogones (de leña) al amanecer y al atardecer
  const fogones = t < 0.12 || t > 0.95 || (t > 0.4 && t < 0.52);
  if (fogones) for (const c of g.chimeneas || []) {
    c.t -= dt;
    if (c.t > 0) continue;
    c.t = 0.25 + Math.random() * 0.25;
    const viento = 0.4 + Math.sin((g.clock || 0) * 0.2) * 0.3;
    g.particles.spawn(c.x + (Math.random() - 0.5) * 0.3, c.y + 0.2, c.z + (Math.random() - 0.5) * 0.3, Math.random() < 0.5 ? [0.72, 0.72, 0.74] : [0.6, 0.6, 0.63], viento, 1.1 + Math.random() * 0.4, 0.2, 3.5 + Math.random() * 2, -0.05);
  }
  // la ropa ondea con el viento
  const viento = 0.5 + Math.sin((g.clock || 0) * 0.3) * 0.3;
  for (const td of g.tendederos || []) for (const pr of td.userData.prendas) { pr.f += dt * (2 + viento * 2); pr.piv.rotation.x = Math.sin(pr.f) * 0.25 * viento + 0.15 * viento; pr.piv.rotation.z = Math.sin(pr.f * 0.7) * 0.06; }
  // perros callejeros: de noche
  tickPerros(g, dt);
  // el torito de pólvora: noches de fiesta
  tickTorito(g, dt, near);
}

function tickPerros(g, dt) {
  const E = g.entities, p = g.player.body.pos;
  const noche = g.daylight < 0.3;
  const perros = E.mobs.filter((m) => m.data && m.data.callejero && !m.dead);
  g.perroT = (g.perroT ?? 20) - dt;
  if (noche && perros.length < 2 && g.perroT <= 0) {
    g.perroT = 40 + Math.random() * 60;
    const a = Math.random() * Math.PI * 2;
    const x = p.x + Math.cos(a) * 14, z = p.z + Math.sin(a) * 14;
    const y = piso(g.world, x, z, Math.floor(p.y));
    if (y != null) {
      const n = 1 + (Math.random() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) { const m = E.spawnMob('perro', x + i, y + 0.2, z); m.data.callejero = { t: 0 }; }
      if (!g.meta.callejeroAviso) { g.meta.callejeroAviso = true; g.ui.toast('🐕 ¡Guau, guau! Los perros del barrio le ladran al desconocido', 2400); }
      g.achieve('perros_callejeros', 'Me ladraron los perros del barrio');
    }
  }
}
// el cerebro del perro callejero (lo llama el perro en finca.js)
export function perroCallejero(m, g, dt, c) {
  const C = m.data.callejero;
  if (!C) return false;
  const { distP, dxp, dzp } = c;
  C.t += dt;
  if (C.t > 14 || g.daylight > 0.45 || C.huye) {
    // se va
    C.huye = true;
    m.goTo(m.body.pos.x - dxp * 3, m.body.pos.z - dzp * 3, 1.6);
    if (C.t > 22 || distP > 30) m.dead = true;
    return true;
  }
  if (distP < 2.5) { C.huye = true; return true; }
  // se acerca hasta unos 5 bloques y ladra
  if (distP > 5.5) m.goTo(g.player.body.pos.x, g.player.body.pos.z, 1.2); else { m.moving = false; m.targetYaw = Math.atan2(dxp, dzp); }
  C.ladra = (C.ladra ?? 0.5) - dt;
  if (C.ladra <= 0) { C.ladra = 0.7 + Math.random() * 0.8; g.audio.play('perro', { pos: m.soundPos(), vol: 0.9, pitch: 0.9 + Math.random() * 0.3 }); m.data.ladrido = 0.25; }
  return true;
}

// ---------- el torito de pólvora ----------
function torito() {
  const g = new THREE.Group();
  const madera = new THREE.MeshBasicMaterial({ color: 0x6a4424 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 1.3), new THREE.MeshBasicMaterial({ color: 0x2a1a10 }));
  g.add(cuerpo);
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), madera); cabeza.position.set(0, 0.15, 0.75); g.add(cabeza);
  for (const s of [-1, 1]) { const cuerno = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.07), new THREE.MeshBasicMaterial({ color: 0xf0e8d0 })); cuerno.position.set(s * 0.28, 0.4, 0.75); cuerno.rotation.z = s * 0.6; g.add(cuerno); }
  // las varillas con los cohetitos
  for (let i = 0; i < 6; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), madera); v.position.set((i % 2 ? 1 : -1) * 0.3, 0.38, -0.5 + (i >> 1) * 0.45); g.add(v); }
  return g;
}
function tickTorito(g, dt, near) {
  const E = g.entities, p = g.player.body.pos;
  const toca = !!fiestaHoy(g) && g.daylight < 0.3 && near && near.dist < 60;
  let T = E.mobs.find((m) => m.data && m.data.torito && !m.dead);
  if (!toca) { if (T) { T.data.torito = null; T.data.irse = 2; const u = T.group.userData; if (u.toro) { u.body.remove(u.toro); u.toro = null; } } return; }
  if (!T) {
    const c = near.v;
    T = E.spawnMob('vecino', c.x + 3, (c.y || p.y) + 1, c.z + 3);
    const here = { x: Math.floor(c.x), y: Math.floor(c.y || p.y), z: Math.floor(c.z) };
    Object.assign(T.data, { home: here, plaza: { ...here }, name: 'El del torito', role: 'vecino', vid: `torito:${Math.random()}`, seed: 4321, torito: { cx: c.x, cz: c.z, meta: null, t: 0 } });
    if (T.kind.dress) T.kind.dress(T);
    g.ui.toast('🐂🎆 ¡Salió el torito de pólvora! ¡Corran!', 2800);
    g.achieve('torito', '¡El torito!');
  }
  const D = T.data.torito, u = T.group.userData;
  if (u.pending) { if (T.kind.dress) T.kind.dress(T); return; }
  if (!u.toro && u.body) { u.toro = torito(); u.toro.position.set(0, 2.15, 0); u.body.add(u.toro); }
  D.t += dt;
  // corre por la plaza: a veces persigue al jugador
  const d = Math.hypot(T.body.pos.x - p.x, T.body.pos.z - p.z);
  D.cambia = (D.cambia ?? 0) - dt;
  if (D.cambia <= 0 || !D.meta) {
    D.cambia = 2 + Math.random() * 3;
    D.meta = d < 14 && Math.random() < 0.5 ? null : { x: D.cx + (Math.random() - 0.5) * 18, z: D.cz + (Math.random() - 0.5) * 18 };
  }
  const objetivo = D.meta || { x: p.x, z: p.z };
  T.goTo(objetivo.x, objetivo.z, 2.2);
  // las chispas y los cohetitos
  const b = T.body.pos;
  for (let k = 0; k < 6; k++) g.particles.spawn(b.x + (Math.random() - 0.5) * 0.8, b.y + 2.6, b.z + (Math.random() - 0.5) * 1.2, Math.random() < 0.5 ? [1, 0.75, 0.2] : [1, 0.95, 0.6], (Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6, 0.5 + Math.random() * 0.4, 9, true);
  D.truene = (D.truene ?? 0.3) - dt;
  if (D.truene <= 0) { D.truene = 0.2 + Math.random() * 0.5; g.audio.play('bombeta', { pos: { x: b.x, y: b.y + 2.5, z: b.z }, vol: 0.45, pitch: 1.3 + Math.random() * 0.5 }); }
  // si lo alcanza: chispazo
  D.toca = Math.max(0, (D.toca || 0) - dt);
  if (d < 1.6 && D.toca <= 0 && g.mode === 'survival') {
    D.toca = 2;
    g.damagePlayer(1, b.x, b.z, 'Lo correteó el torito de pólvora', true);
    g.player.body.vel.x += (p.x - b.x) * 3; g.player.body.vel.z += (p.z - b.z) * 3; g.player.body.vel.y = 4;
    decir(g, T, '¡Jajaja, corra, corra!', 2);
    g.achieve('torito_alcanza', 'Me alcanzó el torito');
  }
}

export function limpiarPuebloVivo(g) {
  for (const td of g.tendederos || []) g.scene.remove(td);
  g.tendederos = []; g.chimeneas = []; g.pvVid = null;
}
