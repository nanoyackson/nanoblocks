// Más fauna tica (v9.4), con el kit low-poly: perezoso, mono cara blanca, tucán, lapa, iguana y armadillo.
import * as THREE from 'three';
import { Pieza, huevo, aplastarPanza, bandas } from './lowpoly.js';
import { pata } from './modelos-bravos.js';

const G = () => new THREE.Group();
const ojitos = (P, x, y, z, r = 0.026, color = 0x0c0a08) => { for (const s of [-1, 1]) P.bulto(color, r, r, r * 0.7, { x: s * x, y, z, det: 1, brillo: 1.4, amb: 0.9 }); };

export function armarPerezoso() {
  const PEL = 0x8f7755, OSC = 0x5e4a34, CARA = 0xd6c6a8, MUSGO = 0x6a7a42;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el pelo lleva musgo: de verdad les crecen algas
  P.bulto(PEL, 0.23, 0.2, 0.33, { y: 0.3, det: 3, grano: 0.34, pinta: (u) => (Math.sin(u.x * 9 + 2) * Math.sin(u.z * 8) > 0.55 && u.y > 0 ? MUSGO : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.32, 0.32); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.16, 0.14, 0.13, { z: 0.08, det: 3, grano: 0.3 });
  C.bulto(CARA, 0.115, 0.1, 0.05, { z: 0.17, det: 2, amb: 0.85, grano: 0.1 });
  for (const s of [-1, 1]) C.tubo(0x2a1e16, [[s * 0.03, 0.03, 0.215], [s * 0.08, 0.02, 0.205], [s * 0.125, -0.02, 0.17]], [0.016, 0.02, 0.01], { lados: 4 }); // el antifaz
  ojitos(C, 0.055, 0.03, 0.222, 0.016);
  C.bulto(0x2a1e16, 0.018, 0.013, 0.01, { y: -0.01, z: 0.225, det: 1 });
  C.tubo(0x5a4636, [[-0.05, -0.04, 0.213], [0, -0.058, 0.222], [0.05, -0.04, 0.213]], [0.005, 0.006, 0.005], { lados: 3, pasos: 2 }); // la sonrisa
  head.add(C.malla());
  const garra = (Q, f) => { for (const d of [-1, 0, 1]) Q.tubo(0x2a2018, [[f[0] + d * 0.025, f[1], f[2]], [f[0] + d * 0.03, f[1] + 0.07, f[2] + 0.03], [f[0] + d * 0.03, f[1] + 0.09, f[2] + 0.09]], [0.014, 0.012, 0.002], { lados: 3, pasos: 1, brillo: 0.6 }); };
  const legs = [[-0.18, 0.2], [0.18, 0.2], [0.18, -0.2], [-0.18, -0.2]].map(([x, z]) => pata(body, x, 0.42, z, [[0, -0.04, 0], [0, 0.2, 0.02], [0, 0.44, 0]], [0.075, 0.06, 0.05], OSC, garra, { grano: 0.3 }));
  g.userData = { body, head, legs, arms: legs };
  return g;
}

export function armarCaraBlanca() {
  const NEGRO = 0x1a1715, BLANCO = 0xe8e0d2, CARA = 0xd0a08c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(NEGRO, 0.17, 0.17, 0.24, { y: 0.42, det: 3, rot: [-0.2, 0, 0], grano: 0.3, pinta: (u) => (u.z > 0.45 ? BLANCO : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.58, 0.2); body.add(head);
  const C = new Pieza();
  // la capita negra arriba, el pelo blanco alrededor y la cara rosada
  C.bulto(BLANCO, 0.125, 0.12, 0.115, { y: 0.04, z: 0.07, det: 3, grano: 0.2, pinta: (u) => (u.y > 0.55 ? NEGRO : null) });
  C.bulto(CARA, 0.08, 0.08, 0.04, { y: 0.02, z: 0.165, det: 2, grano: 0.1 });
  C.bulto(CARA, 0.05, 0.035, 0.03, { y: -0.03, z: 0.2, det: 1, grano: 0.1 });
  ojitos(C, 0.04, 0.04, 0.2, 0.016);
  for (const s of [-1, 1]) C.bulto(CARA, 0.022, 0.04, 0.02, { x: s * 0.125, y: 0.05, z: 0.06, det: 1 });
  head.add(C.malla());
  const mano = (Q, f) => Q.bulto(0x3a2c26, 0.04, 0.03, 0.05, { x: f[0], y: f[1] + 0.015, z: f[2] + 0.01, det: 1 });
  const legs = [[-0.12, 0.15, 0.42], [0.12, 0.15, 0.42], [0.12, -0.15, 0.34], [-0.12, -0.15, 0.34]].map(([x, z, h], i) => pata(body, x, h, z, i < 2 ? [[0, 0.02, 0], [0, -h * 0.5, -0.02], [0, -h + 0.02, 0.02]] : [[0, 0.02, 0], [0, -h * 0.45, 0.05], [0, -h + 0.02, 0]], [0.055, 0.04, 0.032], NEGRO, mano, { grano: 0.3 }));
  const tail = G(); tail.position.set(0, 0.5, -0.22); tail.rotation.x = -0.9; body.add(tail);
  const T = new Pieza();
  T.tubo(NEGRO, [[0, 0, 0], [0, 0.04, -0.3], [0.06, 0.02, -0.5], [0.12, 0.12, -0.56]], [0.038, 0.03, 0.024, 0.01], { lados: 5, grano: 0.3 });
  tail.add(T.malla());
  const loot = G(); loot.position.set(0, 0.4, 0.3); body.add(loot);
  g.userData = { body, head, legs, tail, loot };
  return g;
}

export function armarTucan() {
  const NEGRO = 0x16161a, AMARILLO = 0xf0d040;
  const g = G(), body = G(); body.position.y = 0.22; g.add(body);
  const P = new Pieza();
  P.bulto(NEGRO, 0.11, 0.13, 0.2, { det: 3, grano: 0.12, brillo: 0.6, forma: huevo(-0.1), pinta: (u) => (u.z > 0.42 && u.y > -0.25 ? AMARILLO : u.z > 0.55 && u.y < -0.25 ? 0xc82020 : null) });
  for (const s of [-1, 1]) P.tubo(0x4a7ab0, [[s * 0.04, -0.12, 0.02], [s * 0.05, -0.2, 0.03]], [0.014, 0.012], { lados: 4, pasos: 1 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.1, 0.16); body.add(head);
  const C = new Pieza();
  C.bulto(NEGRO, 0.085, 0.085, 0.08, { y: 0.03, z: 0.04, det: 2, brillo: 0.6, pinta: (u) => (u.z > 0.3 && u.y < 0 ? AMARILLO : null) });
  // el pico enorme: verde, naranja y la punta roja
  C.tubo(0x6fbf3a, [[0, 0.03, 0.1], [0, 0.04, 0.24], [0, 0, 0.38], [0, -0.05, 0.44]], [0.058, 0.055, 0.035, 0.006], { lados: 8, pasos: 3, brillo: 1.1, grano: 0.05, pinta: (u) => (u.x > 0.78 ? 0xd6201e : u.x > 0.44 ? 0xf08a1e : null) });
  C.tubo(0x202018, [[0, 0.005, 0.12], [0, 0.002, 0.28], [0, -0.03, 0.4]], [0.006, 0.005, 0.003], { lados: 3, pasos: 2 });
  for (const s of [-1, 1]) { C.bulto(0x46b0ff, 0.03, 0.03, 0.02, { x: s * 0.07, y: 0.05, z: 0.07, det: 1, amb: 1 }); C.bulto(0x0a0a0a, 0.015, 0.015, 0.01, { x: s * 0.086, y: 0.05, z: 0.075, det: 1, amb: 0.9, brillo: 1.4 }); }
  head.add(C.malla());
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.1, 0.05, 0);
    for (let k = 0; k < 6; k++) W.bulto(NEGRO, 0.035, 0.014, 0.11 + (k % 2) * 0.01, { x: side * (0.03 + k * 0.058), z: -0.04, det: 1, brillo: 0.6, grano: 0.1 });
    p.add(W.malla()); body.add(p); return { p, side };
  });
  const tail = G(); tail.position.set(0, 0, -0.18); body.add(tail);
  const T = new Pieza();
  for (const d of [-1, 0, 1]) T.bulto(NEGRO, 0.035, 0.012, 0.16, { x: d * 0.035, z: -0.15, det: 1, rot: [0, d * 0.1, 0], brillo: 0.6 });
  tail.add(T.malla());
  g.userData = { body, head, wings, tail };
  return g;
}

export function armarLapa() {
  const ROJO = 0xd62f2a, AMARILLO = 0xf2c428, AZUL = 0x286ed2, BLANCO = 0xf0ebe0;
  const g = G(), body = G(); body.position.y = 0.25; g.add(body);
  const P = new Pieza();
  P.bulto(ROJO, 0.115, 0.13, 0.22, { det: 3, grano: 0.14, brillo: 0.4, forma: huevo(-0.08) });
  for (const s of [-1, 1]) P.tubo(0x3a3a3a, [[s * 0.05, -0.12, 0.03], [s * 0.05, -0.2, 0.04]], [0.014, 0.012], { lados: 4, pasos: 1 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.08, 0.2); body.add(head);
  const C = new Pieza();
  // la cara blanca desnuda y el pico curvo
  C.bulto(ROJO, 0.095, 0.095, 0.09, { y: 0.04, z: 0.06, det: 3, grano: 0.14, pinta: (u, n) => (Math.abs(n.x) > 0.55 && u.z > 0.02 && u.y < 0.5 ? BLANCO : null) });
  C.tubo(0xe8e2d0, [[0, 0.07, 0.13], [0, 0.07, 0.21], [0, 0.0, 0.26], [0, -0.07, 0.235]], [0.055, 0.05, 0.03, 0.005], { lados: 7, pasos: 3, brillo: 0.9 });
  C.tubo(0x1d1b18, [[0, -0.01, 0.13], [0, -0.04, 0.18], [0, -0.05, 0.2]], [0.04, 0.03, 0.012], { lados: 6, pasos: 2, brillo: 0.6 });
  for (const s of [-1, 1]) { C.bulto(0xf4e8a0, 0.018, 0.018, 0.012, { x: s * 0.09, y: 0.06, z: 0.08, det: 1, amb: 1 }); C.bulto(0x0a0a0a, 0.011, 0.011, 0.008, { x: s * 0.1, y: 0.06, z: 0.082, det: 1, brillo: 1.4 }); }
  head.add(C.malla());
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.1, 0.06, 0);
    // las plumas del ala: rojo en el hombro, la banda amarilla y las puntas azules
    for (let k = 0; k < 9; k++) {
      const t = k / 8, color = t < 0.33 ? ROJO : t < 0.56 ? AMARILLO : AZUL;
      W.bulto(color, 0.04, 0.012, 0.13 + t * 0.05, { x: side * (0.03 + k * 0.057), z: -0.05 - t * 0.04, det: 1, rot: [0, side * t * 0.2, 0], brillo: 0.6, grano: 0.1 });
    }
    p.add(W.malla()); body.add(p); return { p, side };
  });
  const tail = G(); tail.position.set(0, 0, -0.2); body.add(tail);
  const T = new Pieza();
  for (const d of [-1, 0, 1]) T.tubo(ROJO, [[d * 0.02, 0, 0], [d * 0.04, 0, -0.28], [d * 0.05, -0.02, -0.56]], [0.035, 0.03, 0.006], { lados: 4, pinta: (u) => (u.x > 0.5 ? AZUL : null) });
  tail.add(T.malla());
  g.userData = { body, head, wings, tail };
  return g;
}

export function armarIguana() {
  const VERDE = 0x729552, OSC = 0x4e6b3a, CLARO = 0xc8b080;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(VERDE, 0.14, 0.11, 0.3, { y: 0.17, det: 3, grano: 0.2, forma: aplastarPanza(0.7), pinta: (u) => (u.y < -0.5 ? CLARO : Math.sin(u.z * 14) > 0.6 ? OSC : null) });
  // la cresta de púas
  for (let i = 0; i < 13; i++) { const z = 0.3 - i * 0.05, h = 0.1 - Math.abs(i - 2) * 0.005; P.tubo(0x86a862, [[0, 0.26, z], [0, 0.26 + h, z - 0.02]], [0.018, 0.002], { lados: 3, pasos: 1 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.2, 0.28); body.add(head);
  const C = new Pieza();
  C.bulto(VERDE, 0.09, 0.08, 0.125, { z: 0.1, det: 2, grano: 0.2, forma: (v) => { v.x *= 1 - v.z * 0.2; } });
  C.bulto(CLARO, 0.018, 0.075, 0.065, { y: -0.09, z: 0.06, det: 2 }); // la papada
  ojitos(C, 0.075, 0.03, 0.13, 0.02, 0xc8a020);
  for (const s of [-1, 1]) C.bulto(0x0a0a0a, 0.008, 0.012, 0.008, { x: s * 0.09, y: 0.03, z: 0.135, det: 1 });
  head.add(C.malla());
  const dedos = (Q, f) => { for (const d of [-1, 0, 1]) Q.tubo(OSC, [[f[0], f[1], f[2]], [f[0] + d * 0.05, f[1] - 0.01, f[2] + 0.07]], [0.012, 0.003], { lados: 3, pasos: 1 }); };
  const legs = [[-0.16, 0.18], [0.16, 0.18], [0.16, -0.18], [-0.16, -0.18]].map(([x, z]) => { const s = Math.sign(x); return pata(body, x, 0.12, z, [[0, 0.03, 0], [s * 0.05, 0.01, 0.01], [s * 0.08, -0.1, 0.02]], [0.042, 0.032, 0.024], VERDE, dedos); });
  const tail = G(); tail.position.set(0, 0.15, -0.27); body.add(tail);
  const T = new Pieza();
  T.tubo(VERDE, [[0, 0.01, 0.06], [0, 0, -0.34], [0, -0.03, -0.76]], [0.085, 0.05, 0.008], { lados: 6, grano: 0.2, pinta: bandas(OSC, 7, 0.42) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarArmadillo() {
  const CONCHA = 0x7a7066, OSC = 0x5a5046, PIEL = 0xb8aa9a;
  const g = G(), body = G(); g.add(body);
  const S = new Pieza();
  // la concha: escudo adelante, escudo atrás y las bandas del medio
  S.bulto(CONCHA, 0.2, 0.17, 0.3, { det: 4, grano: 0.14, brillo: 0.4, forma: aplastarPanza(0.45), pinta: (u) => {
    if (Math.abs(u.z) < 0.42) { const f = u.z * 9 - Math.floor(u.z * 9); return f < 0.42 ? OSC : 0x8a8076; }
    return Math.sin(u.x * 22) * Math.sin(u.z * 22) > 0.3 ? OSC : null;
  } });
  const shell = S.malla(); shell.position.y = 0.2; body.add(shell);
  const head = G(); head.position.set(0, 0.2, 0.28); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.075, 0.07, 0.13, { z: 0.09, det: 2, grano: 0.14, forma: (v) => { v.x *= 1 - v.z * 0.4; v.y *= 1 - v.z * 0.3; } });
  C.bulto(CONCHA, 0.06, 0.02, 0.08, { y: 0.06, z: 0.07, det: 1 }); // la placa de la cabeza
  for (const s of [-1, 1]) C.tubo(PIEL, [[s * 0.05, 0.05, 0], [s * 0.075, 0.15, -0.03]], [0.03, 0.008], { lados: 4, pasos: 1 });
  ojitos(C, 0.052, 0.03, 0.13, 0.012);
  head.add(C.malla());
  const legs = [[-0.12, 0.18], [0.12, 0.18], [0.12, -0.18], [-0.12, -0.18]].map(([x, z]) => pata(body, x, 0.12, z, [[0, 0.03, 0], [0, -0.04, 0], [0, -0.11, 0.01]], [0.045, 0.035, 0.03], 0x9a8c7c, (Q, f) => { for (const d of [-1, 0, 1]) Q.tubo(0x2a241e, [[f[0] + d * 0.018, f[1] + 0.005, f[2] + 0.02], [f[0] + d * 0.024, f[1] - 0.005, f[2] + 0.07]], [0.01, 0.002], { lados: 3, pasos: 1 }); }));
  const tail = G(); tail.position.set(0, 0.2, -0.28); body.add(tail);
  const T = new Pieza();
  T.tubo(CONCHA, [[0, 0, 0.02], [0, -0.03, -0.16], [0, -0.08, -0.3]], [0.05, 0.03, 0.006], { lados: 6, pinta: bandas(OSC, 6, 0.42) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail, shell };
  return g;
}
