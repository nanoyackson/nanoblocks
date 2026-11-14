// Más animales silvestres (v9.7), con el kit low-poly: zorro pelón, ardilla, guatusa, coyote y oso hormiguero.
import * as THREE from 'three';
import { Pieza, huevo, bandas } from './lowpoly.js';
import { pata, brasa } from './modelos-bravos.js';

const G = () => new THREE.Group();
const ojitos = (P, x, y, z, r = 0.02, color = 0x0c0a08) => { for (const s of [-1, 1]) P.bulto(color, r, r, r * 0.7, { x: s * x, y, z, det: 1, brillo: 1.4, amb: 0.9 }); };

export function armarZorroPelon() {
  const GRIS = 0xb0b0b0, BLANCO = 0xf4f4f0, ROSA = 0xf0a0b0, NEGRO = 0x2a2a2a;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(GRIS, 0.16, 0.14, 0.27, { y: 0.3, det: 3, grano: 0.34, forma: huevo(-0.14) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.34, 0.26); body.add(head);
  const C = new Pieza();
  // la cara blanca, el hocico largo y rosado, y las orejas negras peladas
  C.bulto(BLANCO, 0.1, 0.09, 0.11, { z: 0.08, det: 2, grano: 0.2 });
  C.tubo(BLANCO, [[0, -0.01, 0.16], [0, -0.03, 0.26], [0, -0.04, 0.33]], [0.06, 0.04, 0.022], { lados: 6 });
  C.bulto(ROSA, 0.024, 0.02, 0.016, { y: -0.04, z: 0.345, det: 1 });
  ojitos(C, 0.065, 0.04, 0.16, 0.018);
  for (const s of [-1, 1]) C.bulto(NEGRO, 0.04, 0.05, 0.012, { x: s * 0.085, y: 0.11, z: 0.03, det: 2, brillo: 0.5 });
  head.add(C.malla());
  const mano = (Q, f) => Q.bulto(ROSA, 0.03, 0.015, 0.04, { x: f[0], y: f[1] + 0.008, z: f[2] + 0.015, det: 1 });
  const legs = [[-0.1, 0.17], [0.1, 0.17], [0.1, -0.17], [-0.1, -0.17]].map(([x, z]) => pata(body, x, 0.2, z, [[0, 0.03, 0], [0, -0.08, 0], [0, -0.19, 0.01]], [0.05, 0.03, 0.026], 0x3a3a3a, mano));
  // la cola pelada y prensil
  const tail = G(); tail.position.set(0, 0.3, -0.25); tail.rotation.x = -0.3; body.add(tail);
  const T = new Pieza();
  T.tubo(0xe8a8b0, [[0, 0, 0], [0, -0.02, -0.26], [0.03, 0.03, -0.42], [0.08, 0.12, -0.42]], [0.035, 0.028, 0.02, 0.008], { lados: 5, brillo: 0.3 });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarArdilla() {
  const ROJO = 0xa05a2a, CLARO = 0xe8d0a8;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(ROJO, 0.08, 0.085, 0.135, { y: 0.17, det: 2, grano: 0.2, pinta: (u) => (u.y < -0.35 ? CLARO : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.24, 0.13); body.add(head);
  const C = new Pieza();
  C.bulto(ROJO, 0.065, 0.06, 0.07, { z: 0.05, det: 2, grano: 0.18, pinta: (u) => (u.y < -0.3 ? CLARO : null) });
  C.bulto(0x2a1a10, 0.012, 0.01, 0.008, { y: -0.005, z: 0.122, det: 0 });
  ojitos(C, 0.047, 0.018, 0.09, 0.012);
  for (const s of [-1, 1]) C.tubo(ROJO, [[s * 0.04, 0.05, 0.02], [s * 0.05, 0.1, 0.01]], [0.02, 0.003], { lados: 4, pasos: 1 });
  head.add(C.malla());
  const legs = [[-0.05, 0.08], [0.05, 0.08], [0.05, -0.08], [-0.05, -0.08]].map(([x, z]) => pata(body, x, 0.11, z, [[0, 0.02, 0], [0, -0.04, 0.01], [0, -0.1, 0.02]], [0.026, 0.018, 0.016], 0x6a3a1a));
  // la cola enorme y peluda, doblada sobre el lomo
  const tail = G(); tail.position.set(0, 0.2, -0.13); tail.rotation.x = -0.35; body.add(tail);
  const T = new Pieza();
  T.tubo(0xc07a3a, [[0, 0, -0.02], [0, 0.12, -0.13], [0, 0.28, -0.1], [0, 0.36, 0.02]], [0.04, 0.085, 0.085, 0.03], { lados: 7, pasos: 3, grano: 0.34 });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarGuatusa() {
  const NAR = 0xb06a2e, OSC = 0x4a2a12;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // alta de ancas y baja de adelante
  P.bulto(NAR, 0.14, 0.15, 0.25, { y: 0.35, det: 3, grano: 0.24, rot: [0.12, 0, 0], forma: huevo(-0.22), pinta: (u) => (u.y < -0.45 ? 0xd8a860 : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.4, 0.24); body.add(head);
  const C = new Pieza();
  C.bulto(NAR, 0.08, 0.075, 0.125, { z: 0.08, det: 2, grano: 0.2, forma: (v) => { v.x *= 1 - v.z * 0.28; v.y *= 1 - v.z * 0.2; } });
  C.bulto(0x3a2410, 0.02, 0.016, 0.012, { y: -0.015, z: 0.205, det: 0 });
  ojitos(C, 0.06, 0.03, 0.1, 0.018);
  for (const s of [-1, 1]) { C.bulto(0x7a4a1e, 0.026, 0.035, 0.01, { x: s * 0.06, y: 0.09, z: 0.01, det: 1 }); for (const k of [-1, 1]) C.tubo(0x1a1208, [[s * 0.03, -0.02, 0.18], [s * 0.11, -0.02 + k * 0.02, 0.16]], [0.002, 0.001], { lados: 3, pasos: 1 }); }
  head.add(C.malla());
  const legs = [[-0.08, 0.15], [0.08, 0.15], [0.08, -0.15], [-0.08, -0.15]].map(([x, z], i) => pata(body, x, 0.26, z, i < 2 ? [[0, 0.02, 0], [0, -0.1, 0], [0, -0.25, 0.01]] : [[0, 0.05, 0], [0, -0.08, -0.05], [0, -0.25, 0]], [0.04, 0.024, 0.02], OSC));
  g.userData = { body, head, legs, tail: null };
  return g;
}

export function armarCoyote() {
  const PEL = 0x9e8c6a, OSC = 0x6a5a44, CLARO = 0xd8c8a8;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.16, 0.17, 0.34, { y: 0.51, det: 3, grano: 0.28, forma: huevo(0.14), pinta: (u) => (u.y < -0.45 ? CLARO : u.y > 0.6 ? OSC : null) });
  for (let i = 0; i < 7; i++) P.tubo(OSC, [[0, 0.68, 0.28 - i * 0.08], [0, 0.74, 0.24 - i * 0.08]], [0.03, 0.004], { lados: 3, pasos: 1 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.6, 0.32); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.115, 0.1, 0.12, { z: 0.08, det: 2, grano: 0.24 });
  C.tubo(CLARO, [[0, -0.02, 0.16], [0, -0.04, 0.28], [0, -0.05, 0.36]], [0.07, 0.05, 0.03], { lados: 6 });
  C.bulto(0x2a2218, 0.024, 0.02, 0.015, { y: -0.04, z: 0.375, det: 1, brillo: 1 });
  for (const s of [-1, 1]) {
    C.tubo(OSC, [[s * 0.07, 0.08, 0.03], [s * 0.1, 0.22, 0]], [0.05, 0.005], { lados: 4, pasos: 1 });
    C.tubo(0xf0e8d0, [[s * 0.03, -0.07, 0.31], [s * 0.03, -0.11, 0.31]], [0.008, 0.001], { lados: 3, pasos: 1, amb: 0.95 });
  }
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0xe0c040, 0.022, s * 0.07, 0.04, 0.175, 0.8));
  const legs = [[-0.1, 0.22], [0.1, 0.22], [0.1, -0.22], [-0.1, -0.22]].map(([x, z], i) => pata(body, x, 0.38, z, i < 2 ? [[0, 0.04, 0], [0, -0.16, 0.01], [0, -0.37, 0.02]] : [[0, 0.06, 0], [0, -0.12, -0.07], [0, -0.37, 0]], [0.07, 0.04, 0.032], OSC, (Q, f) => Q.bulto(OSC, 0.04, 0.025, 0.055, { x: f[0], y: f[1] + 0.012, z: f[2] + 0.015, det: 1 })));
  const tail = G(); tail.position.set(0, 0.55, -0.32); tail.rotation.x = 0.6; body.add(tail);
  const T = new Pieza();
  T.tubo(PEL, [[0, 0, 0], [0, 0, -0.2], [0, 0, -0.42]], [0.05, 0.085, 0.015], { lados: 7, grano: 0.34, pinta: (u) => (u.x > 0.72 ? 0x241c14 : null) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarTamandua() {
  const CREMA = 0xd8c08a, NEGRO = 0x1e1a16;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el chaleco negro que le da la fama
  P.bulto(CREMA, 0.2, 0.19, 0.38, { y: 0.43, det: 3, grano: 0.24, pinta: (u) => (u.z < 0.35 && u.z > -0.75 && (u.y > 0.1 || Math.abs(u.x) > 0.7) ? NEGRO : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.48, 0.35); body.add(head);
  const C = new Pieza();
  C.bulto(CREMA, 0.1, 0.09, 0.12, { z: 0.08, det: 2, grano: 0.2 });
  C.tubo(CREMA, [[0, -0.01, 0.16], [0, -0.03, 0.36], [0, -0.04, 0.5]], [0.06, 0.04, 0.03], { lados: 6, pasos: 3 });
  C.bulto(NEGRO, 0.02, 0.016, 0.012, { y: -0.04, z: 0.515, det: 0 });
  ojitos(C, 0.07, 0.03, 0.15, 0.014);
  for (const s of [-1, 1]) C.bulto(NEGRO, 0.03, 0.045, 0.014, { x: s * 0.085, y: 0.1, z: 0, det: 1 });
  head.add(C.malla());
  const L = new Pieza();
  L.tubo(0xd06070, [[0, 0, -0.1], [0, 0, 0.1]], [0.012, 0.006], { lados: 4, pasos: 1 });
  const lengua = L.malla(); lengua.position.set(0, -0.05, 0.52); lengua.visible = false; head.add(lengua);
  const garra = (Q, f) => { for (const d of [-1, 1]) Q.tubo(0xd8d0b8, [[f[0] + d * 0.02, f[1] + 0.01, f[2] + 0.02], [f[0] + d * 0.024, f[1] - 0.005, f[2] + 0.1]], [0.012, 0.002], { lados: 3, pasos: 1 }); };
  const legs = [[-0.13, 0.25], [0.13, 0.25], [0.13, -0.25], [-0.13, -0.25]].map(([x, z]) => pata(body, x, 0.28, z, [[0, 0.03, 0], [0, -0.12, 0], [0, -0.27, 0.01]], [0.07, 0.05, 0.045], NEGRO, garra));
  const cola = G(); cola.position.set(0, 0.45, -0.35); cola.rotation.x = 0.5; body.add(cola);
  const T = new Pieza();
  T.tubo(CREMA, [[0, 0, 0], [0, 0, -0.3], [0.03, 0.04, -0.54]], [0.07, 0.05, 0.02], { lados: 6, grano: 0.24, pinta: bandas(0xa89060, 5, 0.3) });
  cola.add(T.malla());
  g.userData = { body, head, lengua, cola, legs };
  return g;
}
