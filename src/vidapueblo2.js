// Más vida tica: el yigüirro (el ave nacional: brinca por los patios picoteando y canta, sobre todo cuando entra el
// invierno), los güilas jugando «quedó» en la plaza por las mañanas y el carretillero de frutas que recorre el pueblo.
import * as THREE from 'three';
import { SOLID, AIR } from './blocks.js';
import { decir } from './misiones.js';

const piso = (w, x, z, y0) => { for (let y = Math.floor(y0) + 6; y > y0 - 8; y--) if (SOLID[w.getBlock(Math.floor(x), y - 1, Math.floor(z))] && w.getBlock(Math.floor(x), y, Math.floor(z)) === AIR) return y; return null; };

// ===== el yigüirro =====
function yiguirro() {
  const g = new THREE.Group();
  const cafe = new THREE.MeshBasicMaterial({ color: 0x9a7a52 });
  const body = new THREE.Group(); g.add(body);
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.26), cafe); cuerpo.position.y = 0.14; body.add(cuerpo);
  const pecho = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0xc8aa80 })); pecho.position.set(0, 0.12, 0.12); body.add(pecho);
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.24, 0.12); body.add(cabeza);
  cabeza.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.11), cafe));
  const pico = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.08), new THREE.MeshBasicMaterial({ color: 0xc8a020 })); pico.position.set(0, -0.01, 0.09); cabeza.add(pico);
  for (const s of [-1, 1]) { const ojo = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xe8a020 })); ojo.position.set(s * 0.062, 0.02, 0.03); cabeza.add(ojo); }
  const cola = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.16), cafe); cola.position.set(0, 0.18, -0.18); cola.rotation.x = -0.4; body.add(cola);
  const alas = [];
  for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * 0.08, 0.18, 0); const ala = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.16), new THREE.MeshBasicMaterial({ color: 0x8a6a42 })); ala.position.x = s * 0.1; piv.add(ala); body.add(piv); alas.push({ piv, s }); }
  for (const s of [-1, 1]) { const pata = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.02), new THREE.MeshBasicMaterial({ color: 0x8a7050 })); pata.position.set(s * 0.04, 0.035, 0); body.add(pata); }
  g.userData = { body, cabeza, alas };
  return g;
}
export function tickYiguirros(g, dt) {
  const Y = (g.yiguirros ||= []);
  if (g.dim !== 'tierra') { limpiarVida2(g); return; }
  const p = g.player.body.pos, w = g.world, bio = g.env && g.env.biome;
  const quiere = g.daylight > 0.45 && ['plains', 'forest', 'bosque_seco', 'nuboso'].includes(bio) ? 3 : 0;
  g.yigT = (g.yigT || 0) - dt;
  if (Y.length < quiere && g.yigT <= 0) {
    g.yigT = 2;
    const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 8;
    const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, y = piso(w, x, z, p.y);
    if (y != null) { const m = yiguirro(); m.position.set(x, y, z); g.scene.add(m); Y.push({ m, t: Math.random() * 5, salto: 0, vuela: 0, dir: Math.random() * 6.28, canta: 3 + Math.random() * 8, picoteo: 0 }); }
  }
  for (let i = Y.length - 1; i >= 0; i--) {
    const b = Y[i], o = b.m.position, u = b.m.userData;
    b.t += dt;
    const d = Math.hypot(o.x - p.x, o.z - p.z);
    if (b.vuela > 0 || (d < 2.6 && !b.vuela)) {
      // se espanta: sale volando en curva y se va
      if (!b.vuela) { b.vuela = 0.01; b.dir = Math.atan2(o.z - p.z, o.x - p.x); }
      b.vuela += dt;
      o.x += Math.cos(b.dir) * 6 * dt; o.z += Math.sin(b.dir) * 6 * dt; o.y += (4 - b.vuela * 2) * dt;
      for (const a of u.alas) a.piv.rotation.z = a.s * Math.sin(b.t * 30) * 0.9;
      b.m.rotation.y = -b.dir + Math.PI / 2;
      if (b.vuela > 3) { g.scene.remove(b.m); Y.splice(i, 1); }
      continue;
    }
    // brinquitos y picoteo, como en los patios
    b.salto -= dt;
    if (b.salto <= 0) {
      b.salto = 0.8 + Math.random() * 2;
      b.dir += (Math.random() - 0.5) * 2;
      const nx = o.x + Math.cos(b.dir) * 0.6, nz = o.z + Math.sin(b.dir) * 0.6, ny = piso(w, nx, nz, o.y);
      if (ny != null && Math.abs(ny - o.y) <= 1) { b.desde = { x: o.x, y: o.y, z: o.z }; b.hacia = { x: nx, y: ny, z: nz }; b.bt = 0; }
      if (Math.random() < 0.4) b.picoteo = 0.6;
    }
    if (b.hacia) {
      b.bt += dt * 4;
      const k = Math.min(1, b.bt);
      o.x = b.desde.x + (b.hacia.x - b.desde.x) * k; o.z = b.desde.z + (b.hacia.z - b.desde.z) * k;
      o.y = b.desde.y + (b.hacia.y - b.desde.y) * k + Math.sin(k * Math.PI) * 0.18;
      if (k >= 1) b.hacia = null;
    }
    b.m.rotation.y = -b.dir + Math.PI / 2;
    b.picoteo = Math.max(0, b.picoteo - dt);
    u.cabeza.rotation.x = b.picoteo > 0 ? Math.abs(Math.sin(b.picoteo * 18)) * 0.9 : Math.sin(b.t * 2) * 0.1;
    for (const a of u.alas) a.piv.rotation.z = 0;
    // canta (más seguido cuando entra el invierno: dicen que el yigüirro anuncia las lluvias)
    b.canta -= dt;
    if (b.canta <= 0) {
      b.canta = (g.season === 'invierno' ? 5 : 10) + Math.random() * 8;
      if (d < 25) g.audio.play('yiguirro', { pos: { x: o.x, y: o.y + 0.3, z: o.z }, vol: 0.8, pitch: 0.95 + Math.random() * 0.1 });
      u.cabeza.rotation.x = -0.4;
      if (d < 12) g.achieve('yiguirro', 'El canto del yigüirro');
    }
    if (d > 40 || !quiere) { g.scene.remove(b.m); Y.splice(i, 1); }
  }
}

// ===== güilas jugando «quedó» =====
export function tickQuedo(g, dt) {
  if (g.dim !== 'tierra') return;
  const p = g.player.body.pos, E = g.entities, t = g.time || 0;
  const near = g.nearestVillage(p.x, p.z);
  const toca = near && near.dist < 55 && t > 0.07 && t < 0.24 && g.daylight > 0.45;
  const kids = E.mobs.filter((m) => m.data && m.data.quedo && !m.dead);
  if (!toca) { for (const k of kids) { k.data.quedo = null; k.data.irse = 3; } return; }
  if (kids.length < 5) {
    g.quedoT = (g.quedoT || 0) - dt;
    if (g.quedoT <= 0) {
      g.quedoT = 0.5;
      const c = near.v, a = Math.random() * Math.PI * 2;
      const x = c.x + Math.cos(a) * 3, z = c.z + Math.sin(a) * 3, y = piso(g.world, x, z, c.y || p.y);
      if (y != null) {
        const m = E.spawnMob('vecino', x, y + 0.2, z);
        const here = { x: Math.floor(x), y, z: Math.floor(z) };
        Object.assign(m.data, { home: here, plaza: { ...here }, name: ['Mateo', 'Ximena', 'Santi', 'Ashley', 'Jordan', 'Fabi'][(Math.random() * 6) | 0] + ' (güila)', role: 'vecino', vid: `quedo:${Math.random()}`, seed: 950 + ((Math.random() * 60) | 0), quedo: { cx: c.x, cz: c.z, es: kids.length === 0 } });
        if (m.kind.dress) m.kind.dress(m);
        m.group.userData.babyScale = 0.66;
      }
    }
  }
  const quien = kids.find((k) => k.data.quedo.es);
  for (const k of kids) {
    const Q = k.data.quedo, b = k.body.pos;
    Q.cd = Math.max(0, (Q.cd || 0) - dt);
    if (Q.es) {
      // el que la lleva persigue al más cercano
      let obj = null, od = Infinity;
      for (const o of kids) { if (o === k) continue; const dd = Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z); if (dd < od) { od = dd; obj = o; } }
      if (obj) {
        k.goTo(obj.body.pos.x, obj.body.pos.z, Q.cd > 0 ? 0.3 : 2);
        if (od < 0.9 && Q.cd <= 0) {
          Q.es = false; obj.data.quedo.es = true; obj.data.quedo.cd = 1.5;
          decir(g, k, '¡Quedó!', 1.2);
          if (Math.hypot(b.x - p.x, b.z - p.z) < 20) g.achieve('quedo', '¡Quedó!');
        }
      }
    } else if (quien) {
      // los demás huyen del que la lleva, sin salirse de la plaza
      const qx = quien.body.pos.x, qz = quien.body.pos.z, dd = Math.hypot(qx - b.x, qz - b.z);
      if (dd < 5) {
        let hx = b.x + (b.x - qx), hz = b.z + (b.z - qz);
        if (Math.hypot(hx - Q.cx, hz - Q.cz) > 8) { hx = Q.cx + (Math.random() - 0.5) * 6; hz = Q.cz + (Math.random() - 0.5) * 6; }
        k.goTo(hx, hz, 1.9);
      } else if (!k.moving || Math.random() < dt) k.goTo(Q.cx + (Math.random() - 0.5) * 10, Q.cz + (Math.random() - 0.5) * 10, 0.8);
    }
  }
}

// ===== el carretillero de frutas =====
function carretilla() {
  const g = new THREE.Group();
  const madera = new THREE.MeshBasicMaterial({ color: 0x8a5a2a });
  const caja = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.9), madera); caja.position.set(0, 0.55, 0); g.add(caja);
  const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), new THREE.MeshBasicMaterial({ color: 0x2a2a2e })); rueda.rotation.z = Math.PI / 2; rueda.position.set(0, 0.22, 0.5); g.add(rueda);
  for (const s of [-1, 1]) { const mango = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.7), madera); mango.position.set(s * 0.3, 0.55, -0.7); g.add(mango); }
  const cols = [0xf0a020, 0xe85a2a, 0x3ab84a, 0xf0d040, 0xd83a3a];
  for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshBasicMaterial({ color: cols[i % cols.length] })); f.position.set((Math.random() - 0.5) * 0.55, 0.75 + Math.random() * 0.1, (Math.random() - 0.5) * 0.75); g.add(f); }
  g.userData.rueda = rueda;
  return g;
}
const GRITOS = ['¡Mangos, mangos! ¡Lleve los mangos!', '¡Papaya, piña, mamones! ¡Baratico!', '¡Aguacates a cien! ¡Bueno, a uno!', '¡La fruta más fresca del pueblo!'];
export function tickCarretillero(g, dt) {
  if (g.dim !== 'tierra') return;
  const p = g.player.body.pos, E = g.entities, t = g.time || 0;
  const near = g.nearestVillage(p.x, p.z);
  const toca = near && near.dist < 70 && t > 0.08 && t < 0.38 && g.daylight > 0.45;
  let C = E.mobs.find((m) => m.data && m.data.carretillero && !m.dead);
  if (!toca) { if (C) { C.data.carretillero = null; C.data.irse = 3; } return; }
  if (!C) {
    const c = near.v, x = c.x + 8, z = c.z, y = piso(g.world, x, z, c.y || p.y);
    if (y == null) return;
    C = E.spawnMob('vecino', x, y + 0.2, z);
    const here = { x: Math.floor(x), y, z: Math.floor(z) };
    Object.assign(C.data, { home: here, plaza: { ...here }, name: 'Don Chepe (el de las frutas)', role: 'vecino', vid: `carreta:${Math.random()}`, seed: 777, carretillero: { cx: c.x, cz: c.z, meta: null } });
    if (C.kind.dress) C.kind.dress(C);
  }
  const D = C.data.carretillero, u = C.group.userData;
  if (u.pending) return;
  if (!u.carretilla && u.body) { u.carretilla = carretilla(); u.carretilla.position.set(0, 0, 0.75); u.body.add(u.carretilla); }
  const b = C.body.pos;
  if (!D.meta || Math.hypot(D.meta.x - b.x, D.meta.z - b.z) < 1.2) D.meta = { x: D.cx + (Math.random() - 0.5) * 40, z: D.cz + (Math.random() - 0.5) * 40 };
  C.goTo(D.meta.x, D.meta.z, 0.7);
  if (u.carretilla) u.carretilla.userData.rueda.rotation.x += C.walkAmt * dt * 6;
  D.grito = (D.grito ?? 2) - dt;
  if (D.grito <= 0 && Math.hypot(b.x - p.x, b.z - p.z) < 25) { D.grito = 8 + Math.random() * 6; decir(g, C, GRITOS[(Math.random() * GRITOS.length) | 0], 3); g.achieve('carretillero', '¡Mangos, mangos!'); }
}
export function carretilleroInteract(m, g) {
  if (!m.data.carretillero) return false;
  if (g.mode === 'survival') {
    if (g.inventory.count(360) < 1) { decir(g, m, 'Un colón la fruta, mi amor. ¡Vuelva cuando tenga!', 2.5); return true; }
    g.inventory.remove(360, 1);
  }
  const [id, nombre] = [[377, 'un mango'], [276, 'una papaya'], [467, 'una piña']][(Math.random() * 3) | 0];
  g.giveItem(id, 1);
  g.audio.play('monedas', { ui: true, vol: 0.4 });
  decir(g, m, `¡Tome ${nombre}, bien maduro! ¡Pura vida!`, 2.5);
  return true;
}
export function limpiarVida2(g) { for (const b of g.yiguirros || []) g.scene.remove(b.m); g.yiguirros = []; }
