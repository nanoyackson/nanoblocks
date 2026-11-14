// La costa: pelícanos en fila que pasan rasando las olas (aletean en cadena, uno detrás del otro, y planean) y que de
// vez en cuando se clavan al agua a pescar; y las fragatas, que planean altísimo con su cola de tijera.
import * as THREE from 'three';
import { SEA } from './worldgen.js';
import { haciaMar } from './marcielo.js';

const mb = (c) => new THREE.MeshBasicMaterial({ color: c });
const caja = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(x, y, z); return m; };
const ease = (k) => k * k * (3 - 2 * k);

// ala de dos partes (brazo y mano) para que el aleteo se doble como el de verdad
function ala(s, largo, ancho, color, punta) {
  const hombro = new THREE.Group();
  const brazo = caja(largo * 0.5, 0.04, ancho, color, s * largo * 0.25, 0, 0); hombro.add(brazo);
  const muneca = new THREE.Group(); muneca.position.x = s * largo * 0.5; hombro.add(muneca);
  muneca.add(caja(largo * 0.5, 0.035, ancho * 0.8, color, s * largo * 0.25, 0, -ancho * 0.08));
  muneca.add(caja(largo * 0.12, 0.03, ancho * 0.7, punta, s * largo * 0.48, 0, -ancho * 0.1));
  return { hombro, muneca, s };
}

function pelicano() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  body.add(caja(0.34, 0.3, 0.8, 0x7a7266));
  body.add(caja(0.2, 0.06, 0.3, 0x5a544c, 0, 0.02, -0.5)); // cola
  // cuello encogido en vuelo, cabeza blanca con su gorrito amarillo y el pico largo con bolsa
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.16, 0.46); body.add(cabeza);
  cabeza.add(caja(0.16, 0.18, 0.2, 0xf2efe6));
  cabeza.add(caja(0.12, 0.04, 0.1, 0xf2d060, 0, 0.1, 0));
  const pico = new THREE.Group(); pico.position.set(0, -0.02, 0.1); pico.rotation.x = 0.25; cabeza.add(pico);
  pico.add(caja(0.08, 0.05, 0.62, 0xc8a050, 0, 0, 0.31), caja(0.07, 0.07, 0.5, 0x8a6a40, 0, -0.06, 0.26));
  const alas = [ala(-1, 1.5, 0.42, 0x6a6258, 0x2a2622), ala(1, 1.5, 0.42, 0x6a6258, 0x2a2622)];
  for (const a of alas) { a.hombro.position.set(a.s * 0.16, 0.06, 0.05); body.add(a.hombro); }
  g.userData = { body, alas, cabeza };
  return g;
}
export function fragata() { // v12.7.1: también la usa la fragata que caza tortuguitas (arrecife.js)
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  body.add(caja(0.18, 0.16, 0.7, 0x16161a));
  body.add(caja(0.08, 0.05, 0.3, 0x9a9aa0, 0, -0.02, 0.45)); // pico
  for (const s of [-1, 1]) { const c = caja(0.05, 0.03, 0.55, 0x16161a, s * 0.08, 0, -0.55); c.rotation.y = s * 0.3; body.add(c); } // tijera
  const alas = [ala(-1, 1.7, 0.3, 0x1e1e24, 0x101014), ala(1, 1.7, 0.3, 0x1e1e24, 0x101014)];
  for (const a of alas) { a.hombro.position.set(a.s * 0.08, 0.02, 0.05); a.hombro.rotation.z = a.s * 0.12; a.muneca.rotation.z = -a.s * 0.3; a.muneca.rotation.y = a.s * 0.35; body.add(a.hombro); }
  g.userData = { body, alas };
  return g;
}

function sobreMar(g, x, z) { return g.world.gen.column(Math.floor(x), Math.floor(z)).h < SEA - 1; }

export function tickCosta(g, dt) {
  if (g.dim !== 'tierra') { limpiarCosta(g); return; }
  const p = g.player.body.pos;
  const C = (g.costa ||= { fila: null, fragatas: [], t: 0, revisa: 0, a: null });
  C.t += dt;
  C.revisa -= dt;
  if (C.revisa <= 0) { C.revisa = 6; C.a = g.daylight > 0.35 ? haciaMar(g) : null; }
  // ---- pelícanos ----
  if (!C.fila && C.a != null && Math.random() < dt * 0.05) {
    // la primera franja de mar abierto (sin tierra a los lados en el tramo que pasan cerca), mirando hacia el mar
    let hallado = null;
    for (const da of [0, 0.5, -0.5, 1, -1]) {
      const a = C.a + da, mar = { x: Math.cos(a), z: Math.sin(a) }, lado = { x: -mar.z, z: mar.x };
      for (let d = 12; d <= 80 && !hallado; d += 6) {
        const cx = p.x + mar.x * d, cz = p.z + mar.z * d;
        if (sobreMar(g, cx, cz) && sobreMar(g, cx - lado.x * 20, cz - lado.z * 20) && sobreMar(g, cx + lado.x * 20, cz + lado.z * 20)) hallado = { cx, cz, lado };
      }
      if (hallado) break;
    }
    if (hallado) {
      const { cx, cz, lado } = hallado;
      const sent = Math.random() < 0.5 ? 1 : -1, n = 4 + ((Math.random() * 4) | 0);
      const aves = [];
      for (let i = 0; i < n; i++) { const m = pelicano(); g.scene.add(m); aves.push({ m, i, est: 'fila', t: 0, ph: 0, vy: 0 }); }
      C.fila = { aves, x: cx - lado.x * 70 * sent, z: cz - lado.z * 70 * sent, vx: lado.x * 7 * sent, vz: lado.z * 7 * sent, t: 0, ciclo: 0, periodo: 1, avisado: false };
    }
  }
  const F = C.fila;
  if (F) {
    F.t += dt;
    F.x += F.vx * dt; F.z += F.vz * dt;
    const yaw = Math.atan2(F.vx, F.vz), ux = F.vx / 7, uz = F.vz / 7;
    // el que va adelante aletea cada tanto; los demás lo copian uno por uno
    F.ciclo += dt;
    if (F.ciclo > F.periodo) { F.ciclo = 0; F.periodo = 3 + Math.random() * 2.5; }
    for (const b of F.aves) {
      const o = b.m.position, u = b.m.userData;
      b.t += dt;
      if (b.est === 'fila') {
        const atras = b.i * 2.4;
        const x = F.x - ux * atras + (b.i % 2 ? 0.4 : -0.4) * uz, z = F.z - uz * atras - (b.i % 2 ? 0.4 : -0.4) * ux;
        // rasan el agua; si pasan sobre una punta de tierra, la remontan suave
        const suelo = Math.max(SEA, g.world.gen.column(Math.floor(x), Math.floor(z)).h + 1);
        b.alto = b.alto == null ? suelo : b.alto + (suelo - b.alto) * Math.min(1, dt * 2);
        const y = b.alto + 1.6 + Math.sin(F.t * 0.9 - b.i * 0.5) * 0.45;
        o.set(x, y, z);
        b.m.rotation.y = yaw;
        // ola de aleteo: el retraso de cada uno es su puesto en la fila
        const k = F.ciclo - b.i * 0.28; // tiempo desde que le tocó
        const bate = k > 0 && k < 1.6 ? Math.sin((k / 1.6) * Math.PI * 4) * Math.sin((k / 1.6) * Math.PI) : 0;
        for (const w of u.alas) { w.hombro.rotation.z = w.s * (bate * 0.55 + 0.04); w.muneca.rotation.z = w.s * (bate * 0.4 - 0.05); }
        u.body.rotation.z = Math.sin(F.t * 0.7 + b.i) * 0.06;
        u.body.rotation.x = 0;
        // de vez en cuando uno ve un pez: se sale de la fila, sube, se clava
        if (b.i > 0 && Math.random() < dt * 0.025 && Math.hypot(o.x - p.x, o.z - p.z) < 45) { b.est = 'sube'; b.t = 0; b.ini = { x, y, z }; }
      } else if (b.est === 'sube') {
        const k = Math.min(1, b.t / 1.2);
        o.set(b.ini.x + ux * b.t * 4, b.ini.y + ease(k) * 6, b.ini.z + uz * b.t * 4);
        for (const w of u.alas) { const f = Math.sin(b.t * 12) * 0.6; w.hombro.rotation.z = w.s * f; w.muneca.rotation.z = w.s * f * 0.7; }
        u.body.rotation.x = -0.3 * (1 - k);
        if (k >= 1) { b.est = 'cae'; b.t = 0; b.vy = -2; }
      } else if (b.est === 'cae') {
        // la clavada: alas hacia atrás, cuerpo de cabeza y en tirabuzón
        b.vy -= 22 * dt;
        o.y += b.vy * dt; o.x += ux * 2 * dt; o.z += uz * 2 * dt;
        u.body.rotation.x = Math.min(1.35, u.body.rotation.x + dt * 4);
        u.body.rotation.z += dt * 5;
        for (const w of u.alas) { w.hombro.rotation.z += (w.s * -0.5 - w.hombro.rotation.z) * Math.min(1, dt * 10); w.hombro.rotation.y = w.s * 0.8; w.muneca.rotation.z = -w.s * 0.6; }
        if (o.y <= SEA + 0.4) {
          b.est = 'flota'; b.t = 0; o.y = SEA + 0.4;
          for (let k = 0; k < 18; k++) { const an = Math.random() * Math.PI * 2; g.particles.spawn(o.x, SEA + 1, o.z, [0.85, 0.92, 1], Math.cos(an) * 2, 3 + Math.random() * 3, Math.sin(an) * 2, 0.6, 20); }
          g.audio.play('splash', { pos: { x: o.x, y: o.y, z: o.z }, vol: 0.8 });
          if (Math.hypot(o.x - p.x, o.z - p.z) < 40) g.achieve('pelicano', 'El pelícano se clavó');
        }
      } else if (b.est === 'flota') {
        // flota meciéndose, traga y se acomoda
        o.y = SEA + 0.75 + Math.sin(b.t * 1.6) * 0.08;
        u.body.rotation.x += (0 - u.body.rotation.x) * Math.min(1, dt * 3);
        u.body.rotation.z += (0 - u.body.rotation.z) * Math.min(1, dt * 3);
        u.cabeza.rotation.x = b.t < 2 ? -Math.sin(Math.min(1, b.t / 2) * Math.PI) * 0.7 : 0;
        for (const w of u.alas) { w.hombro.rotation.y += (0 - w.hombro.rotation.y) * Math.min(1, dt * 4); w.hombro.rotation.z += (w.s * -0.15 - w.hombro.rotation.z) * Math.min(1, dt * 4); w.muneca.rotation.z += (w.s * -1.4 - w.muneca.rotation.z) * Math.min(1, dt * 4); }
      }
    }
    if (!F.avisado) {
      const d = Math.hypot(F.x - p.x, F.z - p.z);
      if (d < 35) { F.avisado = true; if (!g.meta.pelicanoAviso) { g.meta.pelicanoAviso = true; g.ui.toast('🐦 Una fila de pelícanos pasa rasando las olas', 2800); } }
    }
    if (F.t > 24) { for (const b of F.aves) g.scene.remove(b.m); C.fila = null; }
  }
  // ---- fragatas, altísimas, en círculos lentos ----
  const quiere = C.a != null ? 2 : 0;
  if (C.fragatas.length < quiere && Math.random() < dt * 0.1) {
    const m = fragata(); g.scene.add(m);
    const mx = p.x + Math.cos(C.a) * 40, mz = p.z + Math.sin(C.a) * 40;
    C.fragatas.push({ m, cx: mx + (Math.random() - 0.5) * 30, cz: mz + (Math.random() - 0.5) * 30, r: 10 + Math.random() * 10, ang: Math.random() * 6.28, h: SEA + 30 + Math.random() * 12, vel: (Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.06), op: 0 });
  }
  for (let i = C.fragatas.length - 1; i >= 0; i--) {
    const f = C.fragatas[i], u = f.m.userData;
    f.ang += f.vel * dt;
    f.cx += Math.sin(C.t * 0.05 + i) * dt * 0.5;
    const x = f.cx + Math.cos(f.ang) * f.r, z = f.cz + Math.sin(f.ang) * f.r;
    f.m.position.set(x, f.h + Math.sin(C.t * 0.3 + i) * 1.5, z);
    f.m.rotation.y = Math.atan2(-Math.sin(f.ang) * Math.sign(f.vel), Math.cos(f.ang) * Math.sign(f.vel));
    u.body.rotation.z = -Math.sign(f.vel) * 0.35; // ladeadas en la térmica
    for (const w of u.alas) w.hombro.rotation.z = w.s * (0.12 + Math.sin(C.t * 0.8 + i) * 0.04);
    if (!quiere || Math.hypot(x - p.x, z - p.z) > 120) { g.scene.remove(f.m); C.fragatas.splice(i, 1); }
  }
}
export function limpiarCosta(g) {
  const C = g.costa;
  if (!C) return;
  if (C.fila) for (const b of C.fila.aves) g.scene.remove(b.m);
  for (const f of C.fragatas) g.scene.remove(f.m);
  g.costa = null;
}
