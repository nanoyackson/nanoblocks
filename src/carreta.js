// La carreta tica con bueyes: caja pintada a lo Sarchí, ruedas redondas con su mandala de colores (que giran), lanza,
// yugo y dos bueyes que caminan de verdad (patas, cabeza que cabecea, cola). Se pone en el suelo, clic derecho para
// sentarse y se maneja despacito: W avanza, S frena, A/D dobla. Shift se baja. Sube escalones de un bloque.
import * as THREE from 'three';
import { armarBuey } from './modelos-cosas.js';
import { BLOCKS, AIR } from './blocks.js';
import { tintModel } from './models.js';

export const CARRETA_ITEM = 487;
const BROCHA = 446;
// v12.4.2: la madera pintada que hay en el inventario da el color de la caja
const PINTURAS = { 151: '#b8202a', 101: '#3a98d8', 102: '#2a8a44', 103: '#e0b020', 104: '#d86aa0' };
const MAXV = 3.4;

function texCaja(fondo = '#b8202a') {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 16;
  const c = cv.getContext('2d');
  c.fillStyle = fondo; c.fillRect(0, 0, 32, 16);
  c.fillStyle = '#f0c020'; c.fillRect(0, 0, 32, 2); c.fillRect(0, 14, 32, 2);
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 8;
    c.fillStyle = '#2a6ad8'; c.beginPath(); c.moveTo(x, 4); c.lineTo(x + 3, 8); c.lineTo(x, 12); c.lineTo(x - 3, 8); c.fill();
    c.fillStyle = '#ffffff'; c.fillRect(x - 1, 7, 2, 2);
    c.fillStyle = '#2aa84a'; c.fillRect(x + 3, 3, 2, 2); c.fillRect(x + 3, 11, 2, 2);
  }
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return t;
}
function texRueda() {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32;
  const c = cv.getContext('2d');
  const cols = ['#b8202a', '#f0c020', '#2a6ad8', '#2aa84a', '#f4f4f0'];
  c.fillStyle = '#3a2410'; c.beginPath(); c.arc(16, 16, 16, 0, Math.PI * 2); c.fill();
  for (let r = 14, k = 0; r > 2; r -= 2.4, k++) { c.fillStyle = cols[k % cols.length]; c.beginPath(); c.arc(16, 16, r, 0, Math.PI * 2); c.fill(); }
  // la estrella de puntas (el mandala de Sarchí)
  c.fillStyle = '#f0c020';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.beginPath(); c.moveTo(16, 16); c.lineTo(16 + Math.cos(a - 0.15) * 13, 16 + Math.sin(a - 0.15) * 13); c.lineTo(16 + Math.cos(a + 0.15) * 13, 16 + Math.sin(a + 0.15) * 13); c.fill(); }
  c.fillStyle = '#b8202a'; c.beginPath(); c.arc(16, 16, 4, 0, Math.PI * 2); c.fill();
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return t;
}
const mb = (color) => new THREE.MeshBasicMaterial({ color });
const caja = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };


export const CARRETA = {
  name: 'Carreta con bueyes', w: 1.6, h: 1.6, health: 40, speed: 0, vehicle: true, hurtSound: 'creak', idleSound: null,
  particle: [[0.7, 0.2, 0.2], [0.9, 0.75, 0.2]], drops: [],
  build() {
    const g = new THREE.Group();
    const body = new THREE.Group(); g.add(body);
    const pinta = new THREE.MeshBasicMaterial({ map: texCaja() });
    const madera = mb(0x6a4424);
    body.add(caja(1.36, 0.08, 1.9, madera, 0, 1.0, -0.3));
    for (const s of [-1, 1]) body.add(caja(0.08, 0.62, 1.9, pinta, s * 0.68, 1.33, -0.3));
    body.add(caja(1.36, 0.62, 0.08, pinta, 0, 1.33, -1.25), caja(1.36, 0.62, 0.08, pinta, 0, 1.33, 0.65));
    body.add(caja(1.7, 0.1, 0.1, madera, 0, 0.75, -0.3)); // el eje
    // ruedas redondas con mandala en las dos caras
    const tr = texRueda();
    const ruedas = [];
    for (const s of [-1, 1]) {
      const geo = new THREE.CylinderGeometry(0.75, 0.75, 0.12, 24);
      const r = new THREE.Mesh(geo, [mb(0x3a2410), new THREE.MeshBasicMaterial({ map: tr }), new THREE.MeshBasicMaterial({ map: tr })]);
      r.rotation.z = Math.PI / 2;
      const piv = new THREE.Group(); piv.position.set(s * 0.82, 0.75, -0.3); piv.add(r);
      body.add(piv); ruedas.push(piv);
    }
    // la lanza hasta el yugo y los bueyes
    body.add(caja(0.1, 0.1, 2.2, madera, 0, 1.0, 1.7));
    const yugo = caja(1.6, 0.14, 0.18, mb(0x5a3a1a), 0, 1.5, 2.75); body.add(yugo);
    const bueyes = [armarBuey(0xf0ece4), armarBuey(0x8a5a32)];
    bueyes[0].position.set(-0.45, 0, 3.0); bueyes[1].position.set(0.45, 0, 3.0);
    bueyes.forEach((b) => body.add(b));
    g.userData = { body, ruedas, bueyes, pinta }; // pinta: v12.4.2, se repinta con la brocha
    return g;
  },
  update(m, dt) {
    const g = m.game, b = m.body, u = m.group.userData, d = m.data;
    m.hurtT = Math.max(0, m.hurtT - dt);
    if (!(d.ridden && g.riding === m) && !d.rival /* a las rivales de la carrera las mueve carrera.js */) { d.ridden = false; d.v = (d.v || 0) * Math.pow(0.05, dt); b.vel.x = Math.sin(m.yaw) * d.v; b.vel.z = Math.cos(m.yaw) * d.v; b.step(g.world, dt); }
    const v = d.v || 0;
    d.paso = (d.paso || 0) + v * dt * 2.2;
    d.giro = (d.giro || 0) + v * dt / 0.75;
    u.ruedas.forEach((r) => { r.rotation.x = d.giro; });
    // los bueyes caminan (patas cruzadas), cabecean y mueven la cola; quietos, rumian
    const k = Math.min(1, v / 1.5);
    u.bueyes.forEach((bu, i) => {
      const U = bu.userData, f = d.paso + i * 0.5;
      U.patas.forEach((p, j) => { p.rotation.x = Math.sin(f + (j === 0 || j === 3 ? 0 : Math.PI)) * 0.45 * k; });
      U.cabeza.rotation.x = Math.sin(f * 2) * 0.08 * k + Math.sin(m.t * 0.7 + i) * 0.05 * (1 - k);
      U.cabeza.rotation.y = Math.sin(m.t * 0.4 + i * 2) * 0.12 * (1 - k);
      U.cola.rotation.z = Math.sin(m.t * 2.5 + i) * 0.35;
      bu.position.y = Math.abs(Math.sin(f)) * 0.03 * k;
    });
    u.body.rotation.z = Math.sin(d.paso * 1.3) * 0.015 * k; // el traqueteo
    m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
    m.group.rotation.y = m.yaw;
    if (m.data.color && m.group.userData.pinta && m.group.userData.pintado !== m.data.color) { const P = m.group.userData.pinta; if (P.map) P.map.dispose(); P.map = texCaja(m.data.color); P.needsUpdate = true; m.group.userData.pintado = m.data.color; }
    tintModel(m.group, m.lightLevel(), m.hurtT > 0 ? 0.5 : 0);
  },
  onHurt(m, g) {
    m.data.hits = (m.data.hits || 0) + 1; m.hurtT = 0.3;
    g.audio.play('creak', { pos: m.soundPos(), vol: 0.6 });
    if (m.data.hits >= 4 && g.riding !== m) { m.dead = true; g.entities.dropItem(CARRETA_ITEM, 1, m.body.pos.x, m.body.pos.y + 1, m.body.pos.z); }
    return false;
  },
  interact(m, g, held) {
    if (g.riding) return false;
    // v12.4.2: con la brocha y madera pintada en el inventario, se pinta la caja (gasta una madera)
    if (held && held.id === BROCHA) {
      const color = Object.keys(PINTURAS).map(Number).find((id) => g.inventory.count(id) > 0);
      if (!color) { g.ui.toast('🎨 Para pintar la carreta lleve madera pintada (la de Sarchí, celeste, verde, amarilla o rosada)', 2600); return true; }
      if (g.mode === 'survival') { g.inventory.remove(color, 1); held.dur = (held.dur ?? 96) - 1; if (held.dur <= 0) g.inventory.consumeHeld(1); g.inventory.changed(); }
      m.data.color = PINTURAS[color];
      g.ui.toast('🎨 ¡Carreta recién pintada!', 1800);
      return true;
    }
    // Mayús + clic derecho: la carga (9 casillas; se guarda con la carreta)
    if (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight')) {
      if (!Array.isArray(m.data.chest)) m.data.chest = new Array(9).fill(null);
      g.ui.openEntityChest(m, 'Carga de la carreta');
      return true;
    }
    g.riding = m; m.data.ridden = true; g.player.flying = false;
    g.audio.play('creak', { pos: m.soundPos(), vol: 0.7 });
    g.ui.toast('🐂 ¡Arre, bueyes! W avanza · S frena · A/D dobla · Shift se baja', 3200);
    g.achieve('carreta', 'Con los bueyes de Sarchí');
    return true;
  },
  ride(g, m, dt, input) {
    const p = g.player, b = m.body, w = g.world, d = m.data;
    if (input.sneak) { d.v = 0; g.dismount(); return; }
    d.v ??= 0;
    if (input.forward) d.v = Math.min(MAXV, d.v + 1.6 * dt);
    else if (input.back) d.v = Math.max(0, d.v - 4 * dt);
    else d.v = Math.max(0, d.v - 0.8 * dt);
    const giro = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    m.yaw += giro * 0.9 * dt * (0.4 + Math.min(1, d.v / 2));
    const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
    b.vel.x = fx * d.v; b.vel.z = fz * d.v;
    const x0 = b.pos.x, z0 = b.pos.z;
    b.step(w, dt);
    if (b.hitWall && b.onGround) {
      const ax = Math.floor(b.pos.x + fx * 1.2), az = Math.floor(b.pos.z + fz * 1.2), ay = Math.floor(b.pos.y);
      if (!BLOCKS[w.getBlock(ax, ay + 1, az)].solid && w.getBlock(ax, ay + 2, az) === AIR) b.pos.y += 1.05; else d.v = 0;
    }
    const recorrido = Math.hypot(b.pos.x - x0, b.pos.z - z0);
    g.carretaDist = (g.carretaDist || 0) + recorrido;
    if (g.carretaDist > 500) g.achieve('carreta_500', 'Toda la vida en carreta');
    // un mugido de vez en cuando y el crujido de la madera
    d.mugeT = (d.mugeT ?? 6) - dt;
    if (d.mugeT <= 0) { d.mugeT = 9 + Math.random() * 12; g.audio.play('vaca', { pos: { x: b.pos.x + fx * 3, y: b.pos.y + 1, z: b.pos.z + fz * 3 }, vol: 0.7, pitch: 0.75 }); }
    if (d.v > 0.5 && Math.random() < dt * 0.6) g.audio.play('creak', { pos: b.pos, vol: 0.35, pitch: 0.8 + Math.random() * 0.3 });
    // el jugador va sentado en la carreta
    p.body.pos.x = b.pos.x - fx * 0.5; p.body.pos.z = b.pos.z - fz * 0.5; p.body.pos.y = b.pos.y + 0.75;
    p.body.vel.x = p.body.vel.y = p.body.vel.z = 0; p.body.onGround = true; p.body.fallStart = null;
    p.eyeHeight = 1.2;
  },
};

export function ponerCarreta(g, held, t) {
  if (held.id !== CARRETA_ITEM) return false;
  if (!t || g.dim !== 'tierra' || g.world.getBlock(t.x, t.y + 1, t.z) !== AIR || g.world.getBlock(t.x, t.y + 2, t.z) !== AIR) { g.ui.toast('La carreta se pone en el suelo, en un lugar abierto', 1600); return true; }
  const m = g.entities.spawnMob('carreta', t.x + 0.5, t.y + 1.05, t.z + 0.5);
  m.tamed = true; m.yaw = g.player.yaw + Math.PI;
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.audio.play('vaca', { pos: { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 }, vol: 0.7, pitch: 0.75 });
  g.ui.toast('🐂 La carreta con sus bueyes está lista. Clic derecho para sentarse', 2400);
  return true;
}
