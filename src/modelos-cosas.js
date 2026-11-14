// Lo último que quedaba en cajas (v10.7), con el kit low-poly: el bus, los bueyes de la carreta, el globo, la vagoneta, el patito de
// la feria, la rana de vidrio y la aguamala.
import * as THREE from 'three';
import { Pieza, cubico, huevo } from './lowpoly.js';

const G = () => new THREE.Group();

// ---------- el bus: la carrocería y las llantas (ventanas, puertas e interior siguen en bus.js) ----------
export function carroceriaBus() {
  const P = new Pieza();
  P.bulto(0xf2eee4, 1.2, 1.1, 3.8, { y: 1.55, det: 5, grano: 0.05, brillo: 0.5, forma: cubico(0.22), pinta: (u) => {
    if (u.y > -0.28 && u.y < -0.12) return 0xc82828; // las franjas
    if (u.y >= -0.12 && u.y < 0.02) return 0x285abe;
    return u.y < -0.86 ? 0x3c3c42 : null;
  } });
  return P.malla();
}
export function llantaBus(r, ancho) {
  const P = new Pieza();
  P.tubo(0x202024, [[-ancho / 2, 0, 0], [ancho / 2, 0, 0]], [r, r], { lados: 14, pasos: 1, grano: 0.14, pliegue: (a) => 1 + (Math.sin(a * 14) > 0 ? 0.025 : 0) });
  for (const s of [-1, 1]) { P.tubo(0xb0b0b6, [[s * ancho / 2, 0, 0], [s * (ancho / 2 + 0.014), 0, 0]], [r * 0.58, r * 0.5], { lados: 10, pasos: 1, brillo: 1 }); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; P.bulto(0x4a4a50, 0.02, r * 0.08, r * 0.08, { x: s * (ancho / 2 + 0.02), y: Math.cos(a) * r * 0.34, z: Math.sin(a) * r * 0.34, det: 0 }); } }
  return P.malla();
}
export function armarChofer() {
  const g = G(); g.position.set(-0.6, 0.9, 2.9);
  const P = new Pieza();
  P.bulto(0x3a6ab0, 0.26, 0.31, 0.16, { y: 0.5, det: 2, grano: 0.1, forma: cubico(0.8) });
  P.bulto(0xb07a50, 0.16, 0.17, 0.16, { y: 0.98, det: 2, grano: 0.06 });
  P.bulto(0x1a2a5a, 0.18, 0.07, 0.19, { y: 1.13, det: 2, forma: (v) => { if (v.y < 0) v.y = 0; } });
  P.bulto(0x1a2a5a, 0.12, 0.012, 0.09, { y: 1.13, z: 0.2, det: 1 });
  for (const s of [-1, 1]) P.bulto(0x12100c, 0.022, 0.024, 0.012, { x: s * 0.06, y: 1, z: 0.152, det: 0, amb: 0.9 });
  const aro = Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return [Math.cos(a) * 0.2, 0.75 + Math.sin(a) * 0.2, 0.35]; });
  P.tubo(0x222226, aro, [0.022, 0.022], { lados: 4, pasos: 1 });
  g.add(P.malla());
  return g;
}

// ---------- los bueyes ----------
export function armarBuey(color) {
  const OSC = 0x2a2420, g = G(), oscuro = new THREE.Color(color).multiplyScalar(0.82).getHex();
  const P = new Pieza();
  P.bulto(color, 0.32, 0.33, 0.7, { y: 0.97, det: 4, grano: 0.1, forma: huevo(0.08), pinta: (u) => (u.y < -0.5 ? oscuro : null) });
  P.bulto(color, 0.22, 0.17, 0.22, { y: 1.26, z: 0.34, det: 2, grano: 0.1 }); // la giba
  P.bulto(oscuro, 0.08, 0.24, 0.18, { y: 0.72, z: 0.56, det: 2, grano: 0.12 }); // la papada
  g.add(P.malla());
  const cabeza = G(); cabeza.position.set(0, 1.12, 0.72); g.add(cabeza);
  const C = new Pieza();
  C.bulto(color, 0.19, 0.2, 0.24, { z: 0.12, det: 3, grano: 0.1 });
  C.bulto(0xd8b0a0, 0.14, 0.1, 0.08, { y: -0.08, z: 0.33, det: 2, brillo: 0.5 });
  for (const s of [-1, 1]) {
    C.bulto(OSC, 0.032, 0.032, 0.022, { x: s * 0.13, y: 0.07, z: 0.28, det: 1, brillo: 1.4, amb: 0.9 });
    C.bulto(0x1a1412, 0.02, 0.018, 0.01, { x: s * 0.06, y: -0.06, z: 0.405, det: 0 });
    C.tubo(0xe8e0c8, [[s * 0.15, 0.17, 0.05], [s * 0.34, 0.24, 0.05], [s * 0.42, 0.42, 0.13]], [0.05, 0.04, 0.005], { lados: 6, brillo: 0.9 });
    C.bulto(oscuro, 0.09, 0.04, 0.05, { x: s * 0.24, y: 0.05, z: -0.02, det: 1, rot: [0, 0, s * 0.4] });
  }
  cabeza.add(C.malla());
  const patas = [[-0.2, 0.48], [0.2, 0.48], [-0.2, -0.48], [0.2, -0.48]].map(([x, z], i) => {
    const p = G(), Q = new Pieza(); p.position.set(x, 0.66, z);
    Q.tubo(color, i < 2 ? [[0, 0.06, 0], [0, -0.26, 0.01], [0, -0.58, 0]] : [[0, 0.08, 0], [0, -0.22, -0.08], [0, -0.58, 0]], [0.13, 0.08, 0.07], { lados: 6, grano: 0.1 });
    Q.bulto(OSC, 0.09, 0.05, 0.1, { y: -0.61, z: 0.015, det: 1, brillo: 0.6 });
    p.add(Q.malla()); g.add(p); return p;
  });
  const cola = G(); cola.position.set(0, 1.15, -0.68); g.add(cola);
  const T = new Pieza();
  T.tubo(color, [[0, 0, 0], [0, -0.3, -0.05], [0, -0.54, -0.03]], [0.035, 0.025, 0.018], { lados: 5 });
  T.bulto(OSC, 0.06, 0.11, 0.06, { y: -0.63, z: -0.03, det: 1, grano: 0.3 });
  cola.add(T.malla());
  g.userData = { cabeza, patas, cola };
  return g;
}

// ---------- el globo ----------
export function armarGlobo() {
  const g = G(), body = G(); g.add(body);
  const COLORES = [0x1a3aa8, 0xf4f4f4, 0xd02020, 0xf4f4f4, 0x1a3aa8];
  const P = new Pieza();
  // la bolsa: una lágrima al revés, de gajos a rayas
  P.bulto(0x1a3aa8, 3.5, 3.8, 3.5, { y: 7, det: 8, grano: 0.05, brillo: 0.35, forma: (v) => { if (v.y < 0) { const k = 1 + v.y * 0.72; v.x *= k; v.z *= k; v.y *= 1.1; } }, pinta: (u) => { const a = (Math.atan2(u.z, u.x) / (Math.PI * 2) + 0.5) * 20; return COLORES[Math.floor(a) % 5]; } });
  P.tubo(0x1a3aa8, [[0, 3.1, 0], [0, 3.5, 0]], [0.5, 0.75], { lados: 12, pasos: 1 });
  // el quemador y los mecates
  P.tubo(0x5a5a62, [[0, 2.15, 0], [0, 2.45, 0]], [0.28, 0.2], { lados: 8, pasos: 1, brillo: 1 });
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) P.tubo(0x3a2a1a, [[x, 0.95, z], [x * 0.68, 2.3, z * 0.68], [x * 0.6, 3.3, z * 0.6]], [0.022, 0.022, 0.022], { lados: 3, pasos: 1 });
  // la canasta de mimbre tejido
  P.bulto(0x8a6438, 0.76, 0.46, 0.76, { y: 0.46, det: 5, grano: 0.2, forma: cubico(0.3), pinta: (u) => ((Math.floor(u.x * 9 + 20) + Math.floor(u.y * 7 + 20) + Math.floor(u.z * 9 + 20)) % 2 ? 0x6a4c2a : null) });
  const borde = Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = 0.8 / Math.max(Math.abs(c), Math.abs(s)); return [c * k, 0.93, s * k]; });
  P.tubo(0x5a3e22, borde, [0.06, 0.06], { lados: 4, pasos: 1, grano: 0.2 });
  body.add(P.malla());
  const Ll = new Pieza();
  Ll.bulto(0xff9a20, 0.16, 0.36, 0.16, { y: 2.8, det: 2, amb: 1.1, grano: 0.2, forma: huevo(0), pinta: (u) => (u.y < -0.2 ? 0xffe080 : null) });
  const llama = Ll.malla(); llama.userData.glow = true; llama.visible = false; body.add(llama);
  g.userData = { body, llama };
  return g;
}

// ---------- la vagoneta de la mina ----------
export function armarVagoneta() {
  const HIERRO = 0x6a6a72, OXIDO = 0x8a5a34;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(OXIDO, 0.5, 0.31, 0.7, { y: 0.52, det: 4, grano: 0.24, forma: (v) => { cubico(0.35)(v); if (v.y < 0) { v.x *= 1 + v.y * 0.16; v.z *= 1 + v.y * 0.12; } }, pinta: (u, n) => (n.y > 0.8 ? 0x2a2622 : Math.sin(u.x * 15) * Math.sin(u.z * 13) > 0.72 ? HIERRO : null) });
  // los cantos de hierro y sus remaches
  const borde = Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = 1 / Math.max(Math.abs(c), Math.abs(s)); return [c * k * 0.5, 0.82, s * k * 0.7]; });
  P.tubo(0x3a3a40, borde, [0.04, 0.04], { lados: 4, pasos: 1, brillo: 0.8 });
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) P.bulto(0x3a3a40, 0.012, 0.02, 0.02, { x: s * 0.5, y: 0.66, z: -0.55 + i * 0.157, det: 0, brillo: 1 });
  P.bulto(HIERRO, 0.46, 0.05, 0.62, { y: 0.22, det: 2, forma: cubico(0.4) });
  body.add(P.malla());
  const ruedas = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const r = G(), R = new Pieza(); r.position.set(sx * 0.4, 0.12, sz * 0.42);
    R.tubo(0x2a2a2e, [[-0.03, 0, 0], [0.03, 0, 0]], [0.12, 0.12], { lados: 10, pasos: 1, brillo: 0.8 });
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; R.bulto(0x6a6a72, 0.036, 0.016, 0.016, { y: Math.cos(a) * 0.07, z: Math.sin(a) * 0.07, det: 0 }); }
    r.add(R.malla()); body.add(r); ruedas.push(r);
  }
  g.userData = { body, ruedas };
  return g;
}

// ---------- el patito de la feria ----------
export function armarPatito() {
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(0xffd23a, 0.22, 0.14, 0.05, { y: 0.16, det: 3, brillo: 0.9, grano: 0.05, forma: (v) => { v.y += v.x * v.x * -0.25; } });
  P.bulto(0xffd23a, 0.1, 0.1, 0.05, { x: 0.13, y: 0.36, det: 2, brillo: 0.9, grano: 0.05 });
  P.tubo(0xffd23a, [[0.09, 0.22, 0], [0.13, 0.32, 0]], [0.08, 0.07], { lados: 6, pasos: 1, brillo: 0.9 });
  P.tubo(0xff7a1a, [[0.21, 0.35, 0], [0.31, 0.34, 0]], [0.035, 0.012], { lados: 5, pasos: 1, brillo: 0.8 });
  for (const s of [-1, 1]) P.bulto(0x111111, 0.02, 0.02, 0.01, { x: 0.16, y: 0.4, z: s * 0.048, det: 0, brillo: 1.5 });
  P.bulto(0xe8b020, 0.09, 0.05, 0.055, { x: -0.05, y: 0.18, det: 2, brillo: 0.7 });
  P.tubo(0xffd23a, [[-0.2, 0.2, 0], [-0.26, 0.3, 0]], [0.05, 0.008], { lados: 4, pasos: 1 });
  body.add(P.malla());
  g.userData = { body };
  return g;
}

// ---------- la rana de vidrio: se le ve todo por dentro ----------
export function armarRanaVidrio() {
  const VERDE = 0x9aff8a;
  const g = G(), b = G(); g.add(b);
  const cristal = (m) => { m.material.transparent = true; m.material.opacity = 0.34; m.material.depthWrite = false; m.renderOrder = 2; return m; };
  const P = new Pieza();
  P.bulto(VERDE, 0.125, 0.07, 0.14, { y: 0.09, det: 3, brillo: 1.2, grano: 0.04, amb: 0.95 });
  P.bulto(VERDE, 0.1, 0.05, 0.06, { y: 0.11, z: 0.15, det: 2, brillo: 1.2, amb: 0.95 });
  b.add(cristal(P.malla()));
  // por dentro: el corazón rojo, los huesitos blancos y la tripita
  const Co = new Pieza();
  Co.bulto(0xff2a3a, 0.045, 0.04, 0.04, { det: 2, amb: 1, brillo: 0.8 });
  const corazon = Co.malla(); corazon.position.set(0, 0.11, 0.03); b.add(corazon);
  const O = new Pieza();
  O.tubo(0xf0f0e8, [[0, 0.1, -0.1], [0, 0.11, 0.11]], [0.01, 0.01], { lados: 4, pasos: 1, amb: 1 });
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) O.tubo(0xf0f0e8, [[0, 0.105, -0.06 + k * 0.04], [s * 0.05, 0.095, -0.055 + k * 0.04]], [0.005, 0.003], { lados: 3, pasos: 1, amb: 1 });
  O.tubo(0xc8c0a8, [[0.04, 0.07, -0.08], [0.05, 0.065, -0.03], [0.01, 0.06, -0.02]], [0.022, 0.024, 0.018], { lados: 5, amb: 0.95 });
  // los ojos dorados grandes
  for (const s of [-1, 1]) { O.bulto(0xe8d070, 0.036, 0.036, 0.036, { x: s * 0.08, y: 0.16, z: 0.17, det: 2, amb: 1, brillo: 1.4 }); O.bulto(0x111111, 0.02, 0.01, 0.01, { x: s * 0.08, y: 0.16, z: 0.205, det: 0, amb: 0.9 }); }
  b.add(O.malla());
  const frogLegs = [-1, 1].map((s) => { const l = G(), Q = new Pieza(); l.position.set(s * 0.13, 0.03, -0.03); Q.tubo(VERDE, [[0, 0.02, -0.08], [s * 0.04, 0, 0.02], [s * 0.05, -0.02, 0.1]], [0.03, 0.022, 0.014], { lados: 5, amb: 0.95, brillo: 0.8 }); l.add(cristal(Q.malla())); b.add(l); return l; });
  g.userData = { body: b, frogLegs, corazon };
  return g;
}

// ---------- la aguamala ----------
export function armarAguamala() {
  const g = G(), body = G(); g.add(body);
  const translucida = (m, op) => { m.material.transparent = true; m.material.opacity = op; return m; };
  const P = new Pieza();
  P.bulto(0xb08ae0, 0.29, 0.25, 0.29, { det: 3, amb: 1, brillo: 0.9, grano: 0.06, forma: (v) => { if (v.y < 0) v.y *= 0.12; }, pinta: (u) => (Math.sin(Math.atan2(u.z, u.x) * 8) > 0.6 ? 0x9a74d0 : null) });
  P.bulto(0xe0c8ff, 0.12, 0.1, 0.12, { y: 0.03, det: 2, amb: 1.05 });
  const campana = translucida(P.malla(), 0.6); campana.position.y = 0.32; body.add(campana);
  const tent = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, t = G(), T = new Pieza(); t.position.set(Math.cos(a) * 0.17, 0.3, Math.sin(a) * 0.17);
    T.tubo(0xd0b0f0, [[0, 0, 0], [Math.sin(i) * 0.04, -0.2, Math.cos(i) * 0.04], [-Math.sin(i) * 0.05, -0.4, -Math.cos(i) * 0.03], [0, -0.58, 0]], [0.02, 0.016, 0.012, 0.003], { lados: 3, amb: 1 });
    t.add(translucida(T.malla(), 0.6)); body.add(t); tent.push(t);
  }
  g.userData = { body, legs: [], tent, campana };
  return g;
}
