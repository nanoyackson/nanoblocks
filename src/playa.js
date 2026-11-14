// La playa: cangrejos rojos que corren de lado y se meten en la arena, ermitaños que se esconden en su concha, y el pescador
// de atarraya que al amanecer y al atardecer tira la red desde la orilla. Si uno le habla, a veces regala un pescado.
import * as THREE from 'three';
import { AIR, BLOCKS, BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { SEA } from './worldgen.js';
import { decir } from './misiones.js';

const esAgua = (id) => BLOCKS[id] && BLOCKS[id].key === 'water';
const MATS = new Map();
const mat = (c) => { if (!MATS.has(c)) MATS.set(c, new THREE.MeshBasicMaterial({ color: c })); return MATS.get(c); };
const GEO = new Map();
const geo = (w, h, d) => { const k = `${w},${h},${d}`; if (!GEO.has(k)) GEO.set(k, new THREE.BoxGeometry(w, h, d)); return GEO.get(k); };
const caja = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo(w, h, d), mat(c)); m.position.set(x, y, z); return m; };

// ---------- los bichitos ----------
function cangrejo() {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  cuerpo.add(caja(0.26, 0.08, 0.17, 0xd8401e, 0, 0.1, 0), caja(0.2, 0.03, 0.13, 0xf06a3a, 0, 0.15, 0));
  for (const s of [-1, 1]) cuerpo.add(caja(0.015, 0.05, 0.015, 0x2a1810, s * 0.05, 0.17, 0.08), caja(0.03, 0.03, 0.03, 0x101010, s * 0.05, 0.2, 0.08));
  const patas = [], tenazas = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const p = new THREE.Group(); p.position.set(s * 0.13, 0.09, (i - 1) * 0.055);
      p.add(caja(0.12, 0.018, 0.018, 0xb0301a, s * 0.06, -0.02, 0));
      p.rotation.z = s * -0.5; cuerpo.add(p); patas.push(p);
    }
    const t = new THREE.Group(); t.position.set(s * 0.1, 0.11, 0.1);
    t.add(caja(0.07, 0.05, 0.09, 0xe0401e, 0, 0, 0.04)); cuerpo.add(t); tenazas.push(t);
  }
  g.userData = { cuerpo, patas, tenazas };
  return g;
}
const CONCHAS = [0xe8d8b8, 0xc88a5a, 0xd0a0a8, 0xb8b0a0];
function ermitano() {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  const c = CONCHAS[(Math.random() * CONCHAS.length) | 0];
  cuerpo.add(caja(0.15, 0.13, 0.17, c, 0, 0.12, -0.02), caja(0.1, 0.09, 0.09, c, 0, 0.17, -0.09), caja(0.05, 0.05, 0.05, 0x8a6a4a, 0, 0.2, -0.13));
  const patas = [];
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
    const p = new THREE.Group(); p.position.set(s * 0.06, 0.08, 0.08 + i * 0.03);
    p.add(caja(0.07, 0.015, 0.015, 0xd06a3a, s * 0.035, -0.03, 0));
    p.rotation.z = s * -0.6; cuerpo.add(p); patas.push(p);
  }
  const cara = caja(0.07, 0.05, 0.05, 0xd06a3a, 0, 0.1, 0.1); cuerpo.add(cara);
  g.userData = { cuerpo, patas, cara };
  return g;
}
function sueloArena(w, x, z, y0) {
  for (let y = Math.floor(y0) + 7; y > y0 - 8; y--) {
    const id = w.getBlock(x, y, z);
    if (esAgua(id)) return null;
    if (SOLID[id]) return id === K.sand && w.getBlock(x, y + 1, z) === AIR ? y + 1 : null;
  }
  return null;
}
function nacer(g, P) {
  const w = g.world, p = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 16;
  const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return;
  const y = sueloArena(w, x, z, p.y);
  if (y == null || y < SEA) return;
  const erm = P.bichos.filter((b) => b.erm).length < 3 && Math.random() < 0.35;
  const m = erm ? ermitano() : cangrejo();
  m.position.set(x + 0.5, y, z + 0.5);
  m.rotation.y = Math.random() * Math.PI * 2;
  m.scale.setScalar(0.01);
  g.scene.add(m);
  P.bichos.push({ m, erm, x: x + 0.5, y, z: z + 0.5, est: 'sale', t: 0, ph: Math.random() * 6, vx: 0, vz: 0, quieto: 1 + Math.random() * 3 });
}
function moverBichos(g, P, dt) {
  const w = g.world, p = g.player.body.pos;
  for (let i = P.bichos.length - 1; i >= 0; i--) {
    const b = P.bichos[i], u = b.m.userData, d = Math.hypot(b.x - p.x, b.z - p.z);
    b.t += dt;
    if (d > 42) { g.scene.remove(b.m); P.bichos.splice(i, 1); continue; }
    if (b.est === 'sale') { const k = Math.min(1, b.t / 0.35); b.m.scale.setScalar(Math.max(0.01, k)); b.m.position.y = b.y - (1 - k) * 0.2; if (k >= 1) { b.est = 'quieto'; b.t = 0; } continue; }
    if (b.est === 'entra') {
      const k = Math.min(1, b.t / 0.4); b.m.position.y = b.y - k * 0.3; b.m.scale.setScalar(Math.max(0.01, 1 - k * 0.6));
      if (k >= 1) { g.particles.burst(b.x, b.y + 0.05, b.z, [[0.86, 0.78, 0.55]], 5, 0.8); g.scene.remove(b.m); P.bichos.splice(i, 1); }
      continue;
    }
    if (b.erm) {
      // el ermitaño: despacito; si uno se acerca, se mete en la concha un rato
      const esconde = d < 2.6 && b.est !== 'escondido';
      if (esconde) { b.est = 'escondido'; b.t = 0; }
      if (b.est === 'escondido') {
        const k = Math.min(1, b.t / 0.15), s = 1 - k;
        for (const q of u.patas) q.scale.x = Math.max(0.01, s);
        u.cara.scale.setScalar(Math.max(0.01, s)); u.cuerpo.position.y = -0.07 * k;
        if (b.t > 3.5 && d > 3) { b.est = 'quieto'; b.t = 0; for (const q of u.patas) q.scale.x = 1; u.cara.scale.setScalar(1); u.cuerpo.position.y = 0; }
        continue;
      }
      if (b.est === 'quieto' && b.t > b.quieto) { const a = Math.random() * 6.28; b.vx = Math.cos(a) * 0.35; b.vz = Math.sin(a) * 0.35; b.m.rotation.y = Math.atan2(b.vx, b.vz); b.est = 'anda'; b.t = 0; b.dura = 2 + Math.random() * 4; }
      if (b.est === 'anda') {
        andar(w, b, dt);
        u.patas.forEach((q, n) => { q.rotation.x = Math.sin(b.t * 9 + n * 2) * 0.5; });
        u.cuerpo.rotation.z = Math.sin(b.t * 9) * 0.05;
        if (b.t > b.dura) { b.est = 'quieto'; b.t = 0; b.quieto = 2 + Math.random() * 5; }
      }
      continue;
    }
    // el cangrejo: de a ratitos, siempre de lado; si uno se le arrima, sale disparado y se entierra
    if (d < 3.6 && b.est !== 'huye') {
      const ax = b.x - p.x, az = b.z - p.z, l = Math.hypot(ax, az) || 1;
      b.vx = (ax / l) * 3.4; b.vz = (az / l) * 3.4; b.m.rotation.y = Math.atan2(-b.vz, b.vx) + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) + Math.PI / 2;
      b.est = 'huye'; b.t = 0;
    }
    if (b.est === 'quieto' && b.t > b.quieto) {
      const a = Math.random() * 6.28, v = 1 + Math.random() * 1.2;
      b.vx = Math.cos(a) * v; b.vz = Math.sin(a) * v; b.m.rotation.y = a + Math.PI / 2 * 0; b.est = 'corre'; b.t = 0; b.dura = 0.3 + Math.random() * 0.9;
    }
    if (b.est === 'corre' || b.est === 'huye') {
      const paso = !andar(w, b, dt);
      u.patas.forEach((q, n) => { q.rotation.x = Math.sin(b.t * 26 + n * 1.6) * 0.6; });
      if (b.est === 'corre' && (b.t > b.dura || paso)) { b.est = 'quieto'; b.t = 0; b.quieto = 0.6 + Math.random() * 3; }
      if (b.est === 'huye' && (b.t > 0.75 || paso)) { b.est = 'entra'; b.t = 0; }
    } else {
      // abre y cierra las tenazas
      u.tenazas.forEach((q, n) => { q.rotation.y = (n ? -1 : 1) * (0.2 + Math.sin(b.t * 2 + b.ph) * 0.2); });
    }
  }
}
// camina si hay arena al frente; devuelve false si se topó con algo (agua, zacate, un escalón grande)
function andar(w, b, dt) {
  const x = b.x + b.vx * dt, z = b.z + b.vz * dt, y = sueloArena(w, Math.floor(x), Math.floor(z), b.y);
  if (y == null || Math.abs(y - b.y) > 1) return false;
  b.x = x; b.z = z; b.y += (y - b.y) * Math.min(1, dt * 12);
  b.m.position.set(x, b.y, z);
  return true;
}

// ---------- el pescador de atarraya ----------
const FRASES = ['Hoy el mar está bueno, ¿oyó?', 'Esto es de paciencia. Y de brazo.', 'Mi tata tiraba la red más lejos. O eso cuenta.', '¡Ay, qué vara! Puro alga.', 'Aquí salen pargos, cuando quieren.'];
function orillaMar(g) {
  const w = g.world, p = g.player.body.pos;
  for (let k = 0; k < 90; k++) {
    const x = Math.floor(p.x + (Math.random() - 0.5) * 60), z = Math.floor(p.z + (Math.random() - 0.5) * 60);
    if (!w.isLoaded(x, z)) continue;
    const y = sueloArena(w, x, z, p.y);
    if (y == null) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let hondo = 0;
      for (let n = 1; n <= 7; n++) if (w.isLoaded(x + dx * n, z + dz * n) && esAgua(w.getBlock(x + dx * n, y - 1, z + dz * n))) hondo++;
      if (hondo >= 6) return { x, y, z, dx, dz };
    }
  }
  return null;
}
function redMalla() {
  const g = new THREE.Group();
  const malla = new THREE.Mesh(new THREE.ConeGeometry(1, 0.55, 14, 3, true), new THREE.MeshBasicMaterial({ color: 0xe8e4d0, wireframe: true, transparent: true, opacity: 0.8 }));
  malla.position.y = 0.27; g.add(malla);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(caja(0.05, 0.05, 0.05, 0x70747a, Math.cos(a), 0, Math.sin(a))); }
  return g;
}
function pescadorArranca(g, s) {
  const m = g.entities.spawnMob('vecino', s.x + 0.5, s.y + 0.2, s.z + 0.5);
  if (!m) return null;
  const here = { x: s.x, y: s.y, z: s.z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: 'Don Macho (pescador)', role: 'vecino', vid: `atarraya:${Math.random()}`, seed: 1777, lavar: true, atarraya: true });
  if (m.kind.dress) m.kind.dress(m);
  const red = redMalla(); red.scale.setScalar(0.01); g.scene.add(red);
  const balde = new THREE.Group(); balde.position.set(s.x + 0.5 - s.dz * 0.9, s.y, s.z + 0.5 + s.dx * 0.9); g.scene.add(balde);
  balde.add(caja(0.34, 0.32, 0.34, 0x4a6a8a, 0, 0.16, 0));
  return { m, s, red, balde, fase: 'junta', t: 0, peces: 0, tx: 0, tz: 0, charla: 8 };
}
function pescadorFin(g, A, ya) {
  g.scene.remove(A.red); g.scene.remove(A.balde);
  if (A.m && !A.m.dead) { if (ya) { A.m.dead = true; } else { A.m.data.lavar = false; A.m.data.irse = 3; } }
  g.pescador = null;
}
function tickPescador(g, dt) {
  const p = g.player.body.pos, t = g.time || 0;
  const toca = ((t > 0.015 && t < 0.13) || (t > 0.38 && t < 0.47)) && !(g.weather && g.weather.intensity > 0.5);
  let A = g.pescador;
  if (A && (!toca || Math.hypot(A.s.x - p.x, A.s.z - p.z) > 70)) { pescadorFin(g, A); A = null; }
  if (!A) {
    if (!toca) return;
    g.pescaT = (g.pescaT || 0) - dt;
    if (g.pescaT > 0) return;
    g.pescaT = 6;
    const s = orillaMar(g);
    if (s) A = g.pescador = pescadorArranca(g, s);
    if (!A) return;
  }
  const m = A.m, s = A.s, u = m.group.userData;
  if (m.dead) { pescadorFin(g, A, true); return; }
  m.moving = false;
  m.targetYaw = Math.atan2(s.dx, s.dz);
  A.t += dt;
  A.charla -= dt;
  if (A.charla <= 0) { A.charla = 18 + Math.random() * 14; if (Math.hypot(s.x - p.x, s.z - p.z) < 20) decir(g, m, FRASES[(Math.random() * FRASES.length) | 0], 3); }
  if (!A.avisado && Math.hypot(s.x - p.x, s.z - p.z) < 18) { A.avisado = true; g.achieve('atarraya', 'El pescador de atarraya'); }
  const brazos = (a, b) => { if (u.npcArms) u.npcArms.forEach((q, i) => { q.rotation.x = i ? b : a; q.rotation.z = 0; }); };
  const manoX = s.x + 0.5 + s.dx * 0.4, manoZ = s.z + 0.5 + s.dz * 0.4, manoY = s.y + 1.2;
  if (A.fase === 'junta') {
    // junta la red en la mano y la balancea
    const k = Math.sin(A.t * 3);
    brazos(-1.1 + k * 0.35, -0.8 - k * 0.25);
    A.red.position.set(manoX, manoY - 0.3, manoZ); A.red.scale.setScalar(0.18); A.red.rotation.y += dt * 2;
    if (A.t > 3) {
      A.fase = 'vuela'; A.t = 0;
      const lejos = 4 + Math.random() * 2.2;
      A.tx = s.x + 0.5 + s.dx * lejos + (Math.random() - 0.5) * 1.2; A.tz = s.z + 0.5 + s.dz * lejos + (Math.random() - 0.5) * 1.2;
      g.audio.play('swish', { pos: { x: manoX, y: manoY, z: manoZ }, vol: 0.5, pitch: 0.7 });
    }
  } else if (A.fase === 'vuela') {
    // se abre en el aire, como un plato, y cae en arco
    const k = Math.min(1, A.t / 1.1), abre = 1 - Math.pow(1 - k, 3);
    brazos(-2.2 + k * 1.2, -2.2 + k * 1.2);
    A.red.position.set(manoX + (A.tx - manoX) * k, manoY + Math.sin(k * Math.PI) * 2.2 + (SEA + 0.95 - manoY) * k, manoZ + (A.tz - manoZ) * k);
    A.red.scale.setScalar(0.18 + abre * 1.9); A.red.rotation.y += dt * 6;
    if (k >= 1) {
      A.fase = 'hunde'; A.t = 0;
      for (let n = 0; n < 26; n++) { const a = Math.random() * 6.28, r = 1.7 + Math.random() * 0.5; g.particles.spawn(A.tx + Math.cos(a) * r, SEA + 1, A.tz + Math.sin(a) * r, [0.85, 0.93, 1], Math.cos(a) * 0.5, 1.2 + Math.random(), Math.sin(a) * 0.5, 0.5, 14); }
      if (Math.hypot(A.tx - p.x, A.tz - p.z) < 28) g.audio.play('dig.cloth', { pos: { x: A.tx, y: SEA + 1, z: A.tz }, vol: 0.9, pitch: 0.6 });
    }
  } else if (A.fase === 'hunde') {
    brazos(-0.6, -0.6);
    A.red.position.y = SEA + 0.95 - Math.min(1, A.t / 2) * 0.55;
    if (A.t > 2.4) { A.fase = 'jala'; A.t = 0; A.pico = Math.random() < 0.45; }
  } else if (A.fase === 'jala') {
    // la jala a tirones, y se va cerrando
    const k = Math.min(1, A.t / 3.4), tiron = Math.abs(Math.sin(A.t * 5));
    brazos(-0.9 - tiron * 0.6, -0.9 - (1 - tiron) * 0.6);
    A.red.position.set(A.tx + (manoX - A.tx) * k, SEA + 0.5 + k * (manoY - 0.6 - SEA - 0.5), A.tz + (manoZ - A.tz) * k);
    A.red.scale.setScalar(2.08 - k * 1.85);
    if (k >= 1) {
      if (A.pico) {
        A.peces++;
        A.balde.add(caja(0.2, 0.05, 0.08, 0xc8d4dc, (Math.random() - 0.5) * 0.12, 0.34 + A.peces * 0.03, (Math.random() - 0.5) * 0.12));
        for (let n = 0; n < 8; n++) g.particles.spawn(manoX, manoY - 0.4, manoZ, [0.85, 0.92, 1], (Math.random() - 0.5) * 1.5, 1 + Math.random(), (Math.random() - 0.5) * 1.5, 0.4, 14);
        if (Math.hypot(s.x - p.x, s.z - p.z) < 16 && Math.random() < 0.5) decir(g, m, '¡Vea, vea! ¡Hay comida!', 2.4);
      }
      A.fase = 'junta'; A.t = 0;
    }
  }
}
export function atarrayaInteract(m, g) {
  if (!m.data.atarraya) return false;
  const A = g.pescador, dia = g.day || 1;
  if (g.mode === 'survival' && A && A.peces > 0 && g.meta.atarrayaDia !== dia) {
    g.meta.atarrayaDia = dia;
    A.peces--;
    g.giveItem(361 + ((Math.random() * 3) | 0), 1);
    g.ui.dialog(m.data.name, 'Tome uno, que hoy amaneció generoso el mar. Eso sí: cocínelo, no sea que le caiga mal.', 3600);
    g.achieve('atarraya_regalo', 'Un regalo del mar');
    return true;
  }
  g.ui.dialog(m.data.name, FRASES[(Math.random() * FRASES.length) | 0], 2800);
  return true;
}

// ---------- cada cuadro ----------
export function tickPlaya(g, dt) {
  if (g.dim !== 'tierra') { limpiarPlaya(g); return; }
  const P = (g.playa ||= { bichos: [], revisa: 0 });
  P.revisa -= dt;
  if (P.revisa <= 0) {
    P.revisa = 1.5;
    const tope = g.daylight < 0.35 ? 9 : 5;
    // las playas son angostas: varios intentos, si no casi nunca cae en arena
    for (let k = 0; k < 10 && P.bichos.length < tope; k++) { const n = P.bichos.length; nacer(g, P); if (P.bichos.length > n) break; }
  }
  moverBichos(g, P, dt);
  // que de noche no brillen: se apagan con la luz del día
  const luz = Math.max(0.25, g.daylight);
  if (P.luz === undefined || Math.abs(P.luz - luz) > 0.04) { P.luz = luz; for (const [c, m] of MATS) m.color.setHex(c).multiplyScalar(luz); }
  tickPescador(g, dt);
}
export function limpiarPlaya(g) {
  const P = g.playa;
  if (P) { for (const b of P.bichos) g.scene.remove(b.m); P.bichos.length = 0; }
  if (g.pescador) pescadorFin(g, g.pescador, true);
}
