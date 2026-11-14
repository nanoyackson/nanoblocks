// Las alimañas y las almas (v9.8), con el kit low-poly: alacrán, tarántula, bocaracá, coral, falsa coral y alma en pena.
import * as THREE from 'three';
import { Pieza, huevo } from './lowpoly.js';

const G = () => new THREE.Group();

export function armarAlacran() {
  const C = 0x6a4a22, O = 0x3a2810;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el cuerpo de placas
  P.bulto(C, 0.065, 0.035, 0.115, { y: 0.055, det: 2, brillo: 0.8, grano: 0.1, pinta: (u) => (Math.sin(u.z * 16) > 0.4 ? O : null) });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) P.tubo(O, [[s * 0.05, 0.05, 0.06 - i * 0.05], [s * 0.11, 0.08, 0.07 - i * 0.055], [s * 0.15, 0, 0.08 - i * 0.06]], [0.01, 0.008, 0.002], { lados: 3, pasos: 1 });
  for (const s of [-1, 1]) {
    P.tubo(C, [[s * 0.05, 0.05, 0.09], [s * 0.11, 0.06, 0.13], [s * 0.09, 0.06, 0.19]], [0.014, 0.012, 0.014], { lados: 4, pasos: 2 });
    P.bulto(O, 0.028, 0.02, 0.04, { x: s * 0.09, y: 0.06, z: 0.225, det: 1, brillo: 0.9 });
    P.tubo(O, [[s * 0.075, 0.06, 0.25], [s * 0.065, 0.06, 0.29]], [0.012, 0.002], { lados: 3, pasos: 1 });
    P.tubo(O, [[s * 0.105, 0.06, 0.25], [s * 0.1, 0.06, 0.29]], [0.012, 0.002], { lados: 3, pasos: 1 });
  }
  body.add(P.malla());
  // la cola enroscada hacia adelante, con el aguijón
  const cola = G(); cola.position.set(0, 0.06, -0.1); body.add(cola);
  const T = new Pieza();
  T.tubo(C, [[0, 0, 0], [0, 0.04, -0.07], [0, 0.12, -0.08], [0, 0.17, -0.02], [0, 0.17, 0.04]], [0.024, 0.022, 0.02, 0.018, 0.016], { lados: 5, pasos: 3, brillo: 0.8, pinta: (u) => (Math.sin(u.x * 32) > 0.5 ? O : null) });
  T.bulto(O, 0.024, 0.024, 0.03, { y: 0.165, z: 0.06, det: 1, brillo: 1 });
  T.tubo(0x1a1008, [[0, 0.165, 0.085], [0, 0.135, 0.12]], [0.012, 0.002], { lados: 3, pasos: 1, brillo: 1 });
  cola.add(T.malla());
  g.userData = { body, legs: [], cola };
  return g;
}

export function armarTarantula() {
  const PEL = 0x4a3020, OSC = 0x2a1a10, NAR = 0xc06020;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.105, 0.09, 0.125, { y: 0.13, z: -0.1, det: 3, grano: 0.4, forma: huevo(-0.15), pinta: (u) => (u.y > 0.35 && Math.hypot(u.x, u.z + 0.1) < 0.5 ? NAR : null) });
  P.bulto(PEL, 0.085, 0.055, 0.08, { y: 0.11, z: 0.07, det: 2, grano: 0.4 });
  for (const s of [-1, 1]) { P.bulto(0x8a1810, 0.02, 0.03, 0.02, { x: s * 0.025, y: 0.08, z: 0.15, det: 1, brillo: 0.8 }); P.bulto(0x0a0a0a, 0.01, 0.01, 0.008, { x: s * 0.03, y: 0.14, z: 0.14, det: 0, brillo: 1.4 }); }
  body.add(P.malla());
  const patas = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const l = G(), Q = new Pieza(); l.position.set(s * 0.07, 0.1, 0.1 - i * 0.06); l.rotation.y = s > 0 ? -0.4 + i * 0.28 : Math.PI + 0.4 - i * 0.28;
    Q.tubo(OSC, [[0, 0, 0], [0.09, 0.09, 0], [0.18, 0.06, 0], [0.24, -0.09, 0]], [0.02, 0.018, 0.015, 0.006], { lados: 4, grano: 0.4, pinta: (u) => (u.x > 0.3 && u.x < 0.42 ? NAR : null) });
    l.add(Q.malla()); body.add(l); patas.push(l);
  }
  g.userData = { body, legs: [], patas };
  return g;
}

export function armarBocaraca() {
  const AM = 0xf0d040, OSC = 0x2a2010;
  const g = G(), body = G(); g.add(body);
  const segs = [];
  for (let i = 0; i < 7; i++) {
    const S = new Pieza();
    S.bulto(AM, 0.08 - i * 0.006, 0.058 - i * 0.004, 0.115, { det: 2, brillo: 1, grano: 0.1, pinta: (u) => (u.y > 0.2 && Math.sin(u.x * 11 + i) * Math.sin(u.z * 9) > 0.55 ? OSC : null) });
    const s = S.malla(); s.position.set(0, 0.07, 0.28 - i * 0.17); body.add(s); segs.push(s);
  }
  const C = new Pieza();
  C.bulto(AM, 0.115, 0.065, 0.13, { det: 3, brillo: 1, grano: 0.1, forma: (v) => { v.x *= 1 - v.z * 0.42; } });
  for (const s of [-1, 1]) {
    C.bulto(0x302010, 0.02, 0.022, 0.02, { x: s * 0.07, y: 0.03, z: 0.04, det: 1, brillo: 1.5, amb: 0.9 });
    // las «pestañas»: escamitas paradas encima de los ojos
    for (let k = 0; k < 4; k++) C.tubo(0xf8e070, [[s * (0.05 + k * 0.012), 0.055, 0.06 - k * 0.02], [s * (0.07 + k * 0.018), 0.12, 0.05 - k * 0.022]], [0.009, 0.002], { lados: 3, pasos: 1 });
  }
  C.tubo(0x1a1a1a, [[0, -0.02, 0.11], [0, -0.02, 0.19]], [0.008, 0.003], { lados: 3, pasos: 1 });
  const head = C.malla(); head.position.set(0, 0.08, 0.44); body.add(head);
  g.userData = { body, head, segs };
  return g;
}

export function armarCulebrita(venenosa) {
  const ANILLOS = venenosa ? [0xc82818, 0xf0d040, 0x141414, 0xf0d040] : [0xc82818, 0x141414, 0xf0e0b0, 0x141414];
  const g = G(), body = G(); g.add(body);
  const segs = [];
  for (let i = 0; i < 12; i++) {
    const seg = G(), S = new Pieza(), r = 0.05 - (i > 9 ? (i - 9) * 0.011 : 0); seg.position.set(0, 0.06, 0.3 - i * 0.075);
    S.bulto(ANILLOS[i % 4], r, 0.045, 0.05, { det: 1, brillo: 1, grano: 0.06 });
    seg.add(S.malla()); body.add(seg); segs.push(seg);
  }
  const head = G(); head.position.set(0, 0.06, 0.36);
  const C = new Pieza();
  C.bulto(0x141414, 0.05, 0.04, 0.06, { z: 0.03, det: 2, brillo: 1, pinta: (u) => (u.z < -0.45 ? (venenosa ? 0xf0d040 : 0xf0e0b0) : null) });
  for (const s of [-1, 1]) C.bulto(0x0a0a0a, 0.012, 0.012, 0.01, { x: s * 0.04, y: 0.02, z: 0.06, det: 0, brillo: 1.5 });
  head.add(C.malla()); body.add(head);
  g.userData = { body, head, legs: [], segs };
  return g;
}

export function armarAlma() {
  const MANTO = 0xd8dce6, SOMBRA = 0xb8bec8;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.tubo(MANTO, [[0, 1.3, 0], [0, 0.7, 0], [0, 0.1, 0]], [0.22, 0.3, 0.42], { lados: 14, pasos: 3, grano: 0.1, pliegue: (a, t) => 1 + Math.sin(a * 7 + t * 3) * 0.09 * t });
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 0.38, L = 0.14 + (i % 3) * 0.06; P.tubo(i % 2 ? MANTO : SOMBRA, [[Math.cos(a) * r, 0.14, Math.sin(a) * r], [Math.cos(a) * (r + 0.08), 0.14 - L, Math.sin(a) * (r + 0.08)]], [0.09, 0.005], { lados: 4, pasos: 1 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.32, 0); body.add(head);
  const C = new Pieza();
  // la capucha con el hueco oscuro donde iba la cara
  C.bulto(MANTO, 0.23, 0.25, 0.23, { y: 0.18, det: 3, grano: 0.1, forma: (v) => { if (v.z > 0.42 && v.y < 0.55 && Math.abs(v.x) < 0.68) v.z = 0.1; else if (v.y > 0) { v.y *= 1 + v.y * 0.3; v.z -= v.y * v.y * 0.3; } }, pinta: (u) => (u.z > 0.42 && u.y < 0.55 && Math.abs(u.x) < 0.68 ? 0x1a1c24 : null) });
  head.add(C.malla());
  for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 1), new THREE.MeshBasicMaterial({ color: 0xb8e0ff })); o.position.set(s * 0.07, 0.2, 0.09); o.userData.glow = true; head.add(o); }
  const brazos = [-1, 1].map((s) => {
    const a = G(), Q = new Pieza(); a.position.set(s * 0.3, 1.2, 0);
    Q.tubo(MANTO, [[0, 0.04, 0], [0, -0.26, 0], [0, -0.58, 0.01]], [0.08, 0.08, 0.12], { lados: 7, pasos: 2, grano: 0.1 });
    a.add(Q.malla()); body.add(a); return a;
  });
  g.traverse((o) => { if (o.isMesh) { o.material.transparent = true; o.material.opacity = 0.62; } });
  g.userData = { body, head, brazos };
  return g;
}
