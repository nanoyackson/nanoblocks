// Los animales menores (v9.5), con el kit low-poly: mono congo, murciélago, quetzal, tortuga, colibrí, morfo, tití, tepezcuintle,
// rana calzonuda y gato.
import * as THREE from 'three';
import { Pieza, aplastarPanza, huevo } from './lowpoly.js';
import { pata } from './modelos-bravos.js';

const G = () => new THREE.Group();
const ojitos = (P, x, y, z, r = 0.026, color = 0x0c0a08) => { for (const s of [-1, 1]) P.bulto(color, r, r, r * 0.7, { x: s * x, y, z, det: 1, brillo: 1.4, amb: 0.9 }); };

export function armarMono() {
  const NEGRO = 0x201a16, DORADO = 0x8a6a30, CARA = 0x2e2622;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el congo: negro, con el manto dorado a los costados
  P.bulto(NEGRO, 0.19, 0.18, 0.26, { y: 0.42, det: 3, rot: [-0.25, 0, 0], grano: 0.34, pinta: (u) => (Math.abs(u.x) > 0.62 && u.y > -0.3 ? DORADO : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.55, 0.24); body.add(head);
  const C = new Pieza();
  C.bulto(NEGRO, 0.13, 0.13, 0.12, { y: 0.05, z: 0.07, det: 3, grano: 0.3 });
  C.bulto(CARA, 0.085, 0.085, 0.05, { y: 0.03, z: 0.16, det: 2, grano: 0.1 });
  // la barba y el buche que le da el rugido
  C.bulto(NEGRO, 0.1, 0.09, 0.08, { y: -0.08, z: 0.11, det: 2, grano: 0.36 });
  ojitos(C, 0.04, 0.06, 0.205, 0.016, 0x8a5a20);
  C.tubo(0x120c0a, [[-0.04, -0.015, 0.205], [0, -0.03, 0.215], [0.04, -0.015, 0.205]], [0.006, 0.008, 0.006], { lados: 3, pasos: 2 });
  head.add(C.malla());
  const mano = (Q, f) => Q.bulto(CARA, 0.04, 0.03, 0.05, { x: f[0], y: f[1] + 0.015, z: f[2] + 0.01, det: 1 });
  const legs = [[-0.13, 0.17, 0.42], [0.13, 0.17, 0.42], [0.13, -0.17, 0.32], [-0.13, -0.17, 0.32]].map(([x, z, h], i) => pata(body, x, h, z, i < 2 ? [[0, 0.02, 0], [0, -h * 0.5, -0.02], [0, -h + 0.02, 0.02]] : [[0, 0.02, 0], [0, -h * 0.45, 0.05], [0, -h + 0.02, 0]], [0.06, 0.042, 0.034], NEGRO, mano, { grano: 0.32 }));
  const tail = G(); tail.position.set(0, 0.45, -0.24); tail.rotation.x = 0.6; body.add(tail);
  const T = new Pieza();
  T.tubo(NEGRO, [[0, 0, 0], [0, 0, -0.34], [0.04, 0.08, -0.56], [0.1, 0.2, -0.56]], [0.04, 0.032, 0.026, 0.012], { lados: 5, grano: 0.3 });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarMurcielago() {
  const OSC = 0x261d19, MEMB = 0x3a2a26;
  const g = G(), body = G(); body.position.y = 0.17; g.add(body);
  const P = new Pieza();
  P.bulto(OSC, 0.07, 0.08, 0.09, { det: 2, grano: 0.3 });
  P.bulto(OSC, 0.055, 0.055, 0.05, { y: 0.05, z: 0.07, det: 2, grano: 0.3 });
  for (const s of [-1, 1]) P.tubo(MEMB, [[s * 0.03, 0.09, 0.05], [s * 0.06, 0.17, 0.03]], [0.03, 0.004], { lados: 4, pasos: 1 });
  ojitos(P, 0.022, 0.06, 0.115, 0.009);
  body.add(P.malla());
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.07, 0.02, 0);
    // la membrana entre los dedos
    for (let k = 0; k < 4; k++) { const a = -0.15 + k * 0.42; W.bulto(MEMB, 0.15, 0.008, 0.05, { x: side * (0.12 + Math.cos(a) * 0.05), z: -0.03 - Math.sin(a) * 0.1, det: 1, rot: [0, side * a, 0], grano: 0.2 }); W.tubo(OSC, [[0, 0, 0.01], [side * (0.15 + Math.cos(a) * 0.1), 0.004, -0.02 - Math.sin(a) * 0.16]], [0.01, 0.003], { lados: 3, pasos: 1 }); }
    p.add(W.malla()); body.add(p); return { p, side };
  });
  g.userData = { body, wings };
  return g;
}

export function armarQuetzal() {
  const VERDE = 0x18a764, CLARO = 0x3fcf88, ROJO = 0xc82028;
  const g = G(), body = G(); body.position.y = 0.2; g.add(body);
  const P = new Pieza();
  P.bulto(VERDE, 0.095, 0.115, 0.16, { det: 3, brillo: 1, grano: 0.12, forma: huevo(-0.08), pinta: (u) => (u.y < -0.1 && u.z > -0.3 ? ROJO : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.1, 0.13); body.add(head);
  const C = new Pieza();
  C.bulto(VERDE, 0.07, 0.075, 0.07, { y: 0.03, z: 0.04, det: 2, brillo: 1 });
  // el copete de cerdas, de oreja a oreja
  for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.018; C.tubo(CLARO, [[x, 0.08, 0.04], [x * 1.2, 0.15 - Math.abs(i - 3) * 0.012, 0.0]], [0.02, 0.004], { lados: 3, pasos: 1, brillo: 1 }); }
  C.tubo(0xf2c428, [[0, 0.025, 0.1], [0, 0.015, 0.145]], [0.022, 0.006], { lados: 5, pasos: 1, brillo: 0.8 });
  ojitos(C, 0.055, 0.045, 0.075, 0.015);
  head.add(C.malla());
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.09, 0.04, 0);
    for (let k = 0; k < 6; k++) W.bulto(k > 3 ? 0x1a2a26 : VERDE, 0.032, 0.011, 0.1 + k * 0.006, { x: side * (0.03 + k * 0.05), z: -0.04, det: 1, brillo: 1, grano: 0.1 });
    p.add(W.malla()); body.add(p); return { p, side };
  });
  // las plumas larguísimas de la cola
  const tail = G(); tail.position.set(0, 0, -0.15); body.add(tail);
  const T = new Pieza();
  for (const [d, L] of [[-1, 0.94], [1, 0.82]]) T.tubo(CLARO, [[d * 0.012, 0, 0], [d * 0.03, -0.03, -L * 0.5], [d * 0.04, -0.12, -L]], [0.02, 0.03, 0.004], { lados: 4, brillo: 1.1, grano: 0.06 });
  T.bulto(0xf0f0e8, 0.04, 0.012, 0.09, { z: -0.1, det: 1 });
  tail.add(T.malla());
  g.userData = { body, head, wings, tail };
  return g;
}

export function armarTortuga() {
  const CONCHA = 0x735c3a, OSC = 0x3a2c1a, PIEL = 0x607756;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el caparazón con sus placas
  P.bulto(CONCHA, 0.45, 0.2, 0.54, { y: 0.26, det: 4, brillo: 0.5, grano: 0.14, forma: aplastarPanza(0.4), pinta: (u) => {
    if (u.y < -0.1) return 0xc8b888;
    const a = Math.sin(u.x * 8) * Math.sin(u.z * 8);
    return Math.abs(a) < 0.1 ? OSC : a > 0.55 ? 0x8a6f47 : null;
  } });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.28, 0.5); body.add(head);
  const C = new Pieza();
  C.tubo(PIEL, [[0, -0.02, -0.08], [0, 0, 0.1]], [0.11, 0.1], { lados: 7, pasos: 1, grano: 0.2 });
  C.bulto(PIEL, 0.13, 0.11, 0.15, { z: 0.14, det: 2, grano: 0.24, forma: (v) => { v.x *= 1 - v.z * 0.2; } });
  ojitos(C, 0.1, 0.05, 0.19, 0.024);
  head.add(C.malla());
  const flippers = [[-0.33, 0.3, 0.46], [0.33, 0.3, 0.46], [0.3, -0.35, 0.32], [-0.3, -0.35, 0.32]].map(([x, z, L]) => {
    const s = Math.sign(x), l = G(), F = new Pieza(); l.position.set(x, 0.2, z);
    F.bulto(PIEL, L * 0.6, 0.03, 0.12, { x: s * L * 0.5, z: -0.04, det: 2, grano: 0.24, rot: [0, s * 0.35, 0] });
    l.add(F.malla()); body.add(l); return l;
  });
  g.userData = { body, head, legs: [], flippers };
  return g;
}

export function armarColibri() {
  const g = G(), body = G(); body.position.y = 0.1; g.add(body);
  const P = new Pieza();
  P.bulto(0x1aa87a, 0.036, 0.04, 0.075, { det: 2, brillo: 1.3, grano: 0.08, pinta: (u) => (u.y < -0.1 && u.z > 0.1 ? 0xd6205a : null) });
  P.bulto(0x1aa87a, 0.028, 0.028, 0.028, { y: 0.02, z: 0.07, det: 1, brillo: 1.3 });
  P.tubo(0x1a1a1a, [[0, 0.02, 0.09], [0, 0.015, 0.2]], [0.007, 0.002], { lados: 3, pasos: 1 });
  for (const d of [-1, 0, 1]) P.bulto(0x0f7a5a, 0.012, 0.005, 0.05, { x: d * 0.012, z: -0.11, det: 0, brillo: 1 });
  body.add(P.malla());
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.035, 0.03, 0);
    W.bulto(0xc8f4ea, 0.075, 0.004, 0.028, { x: side * 0.07, det: 1, amb: 1 });
    p.add(W.malla()); body.add(p); return { p, side };
  });
  g.userData = { body, wings };
  return g;
}

export function armarMorfo() {
  const g = G(), body = G(); body.position.y = 0.12; g.add(body);
  const P = new Pieza();
  P.bulto(0x1a1410, 0.012, 0.012, 0.06, { det: 1 });
  for (const s of [-1, 1]) P.tubo(0x1a1410, [[s * 0.005, 0.005, 0.05], [s * 0.04, 0.03, 0.12]], [0.003, 0.001], { lados: 3, pasos: 1 });
  body.add(P.malla());
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.01, 0, 0);
    const pinta = (u) => (Math.hypot(u.x, u.z) > 0.72 ? 0x0a1a3a : null);
    W.bulto(0x2f86ff, 0.09, 0.003, 0.075, { x: side * 0.085, z: 0.04, det: 3, amb: 1.05, brillo: 1.4, pinta });
    W.bulto(0x2f86ff, 0.07, 0.003, 0.06, { x: side * 0.065, z: -0.05, det: 2, amb: 1.05, brillo: 1.4, pinta });
    const m = W.malla(); m.userData.glow = true; p.add(m); body.add(p); return { p, side };
  });
  g.userData = { body, wings };
  return g;
}

export function armarTiti() {
  const NAR = 0xd8842a, GRIS = 0x8a8a82, CARA = 0xf0e4d0;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(NAR, 0.105, 0.115, 0.17, { y: 0.3, det: 3, grano: 0.24, pinta: (u) => (u.y > 0.45 ? GRIS : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.42, 0.14); body.add(head);
  const C = new Pieza();
  C.bulto(GRIS, 0.09, 0.085, 0.08, { y: 0.03, z: 0.05, det: 2, grano: 0.2, pinta: (u) => (u.y > 0.5 ? 0x2a2622 : null) });
  C.bulto(CARA, 0.06, 0.055, 0.025, { y: 0.02, z: 0.115, det: 2, amb: 0.9 });
  C.bulto(0x1c1816, 0.035, 0.025, 0.02, { y: -0.01, z: 0.14, det: 1 }); // el hocico negro
  ojitos(C, 0.03, 0.04, 0.14, 0.013);
  for (const s of [-1, 1]) C.bulto(CARA, 0.018, 0.03, 0.012, { x: s * 0.095, y: 0.04, z: 0.03, det: 1 });
  head.add(C.malla());
  const legs = [[-0.07, 0.11], [0.07, 0.11], [0.07, -0.11], [-0.07, -0.11]].map(([x, z]) => pata(body, x, 0.2, z, [[0, 0.02, 0], [0, -0.09, 0], [0, -0.19, 0.01]], [0.03, 0.022, 0.018], NAR, null, { grano: 0.2 }));
  const tail = G(); tail.position.set(0, 0.32, -0.16); tail.rotation.x = 0.5; body.add(tail);
  const T = new Pieza();
  T.tubo(GRIS, [[0, 0, 0], [0, 0, -0.26], [0, 0.02, -0.5]], [0.024, 0.024, 0.02], { lados: 5, grano: 0.24, pinta: (u) => (u.x > 0.76 ? 0x1e1a16 : null) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarTepezcuintle() {
  const CAF = 0x6a4626, OSC = 0x3a2614, BLANCO = 0xecdfc8;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // las filas de manchas blancas a lo largo del costado
  P.bulto(CAF, 0.18, 0.17, 0.31, { y: 0.34, det: 4, grano: 0.2, forma: huevo(-0.14), pinta: (u) => {
    if (u.y < -0.55) return BLANCO;
    if (Math.abs(u.x) < 0.45) return null;
    const fila = Math.abs(u.y * 3.2 - Math.round(u.y * 3.2)), pos = Math.abs(u.z * 6 - Math.round(u.z * 6));
    return fila < 0.22 && pos < 0.3 ? BLANCO : null;
  } });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.4, 0.3); body.add(head);
  const C = new Pieza();
  C.bulto(CAF, 0.11, 0.1, 0.14, { z: 0.08, det: 2, grano: 0.18, forma: (v) => { v.y *= 1 - v.z * 0.15; } });
  C.bulto(0x2a1c10, 0.045, 0.03, 0.02, { y: -0.02, z: 0.215, det: 1 });
  ojitos(C, 0.085, 0.04, 0.13, 0.02);
  for (const s of [-1, 1]) { C.bulto(OSC, 0.03, 0.04, 0.015, { x: s * 0.08, y: 0.1, z: -0.01, det: 1 }); for (let k = -1; k <= 1; k++) C.tubo(0x1a1208, [[s * 0.04, -0.03, 0.19], [s * 0.15, -0.03 + k * 0.03, 0.16]], [0.003, 0.001], { lados: 3, pasos: 1 }); }
  head.add(C.malla());
  const legs = [[-0.11, 0.2], [0.11, 0.2], [0.11, -0.2], [-0.11, -0.2]].map(([x, z]) => pata(body, x, 0.2, z, [[0, 0.03, 0], [0, -0.08, 0], [0, -0.19, 0.01]], [0.05, 0.032, 0.028], OSC));
  g.userData = { body, head, legs, tail: null };
  return g;
}

export function armarCalzonuda() {
  const VERDE = 0x4cc236, AZUL = 0x2846be, NAR = 0xf08a2a;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // verde arriba, costados azules con rayas amarillas y panza clara
  P.bulto(VERDE, 0.095, 0.06, 0.12, { y: 0.11, det: 3, brillo: 0.9, grano: 0.08, pinta: (u) => (u.y < -0.4 ? 0xf0ecd8 : Math.abs(u.x) > 0.72 ? (Math.sin(u.z * 16) > 0.4 ? 0xf0d040 : AZUL) : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.12, 0.1); body.add(head);
  const O = new Pieza();
  O.bulto(VERDE, 0.075, 0.045, 0.06, { z: 0.02, det: 2, brillo: 0.9 });
  head.add(O.malla());
  // los ojos rojos saltones: se ven de noche
  const E = new Pieza();
  for (const s of [-1, 1]) { E.bulto(0xd81818, 0.036, 0.036, 0.036, { x: s * 0.065, y: 0.04, z: 0.02, det: 2, amb: 1, brillo: 1.4 }); E.bulto(0x101010, 0.008, 0.026, 0.01, { x: s * 0.065, y: 0.04, z: 0.055, det: 1, amb: 0.9 }); }
  const ojos = E.malla(); ojos.userData.glow = true; head.add(ojos);
  const dedos = (Q, f) => { for (const d of [-1, 0, 1]) Q.bulto(NAR, 0.012, 0.008, 0.012, { x: f[0] + d * 0.03, y: f[1], z: f[2] + 0.03, det: 1, amb: 1 }); };
  const legs = [[-0.1, 0.08], [0.1, 0.08], [0.11, -0.08], [-0.11, -0.08]].map(([x, z]) => { const s = Math.sign(x); return pata(body, x, 0.08, z, [[0, 0.02, 0], [s * 0.04, 0.03, 0], [s * 0.05, -0.06, 0.02]], [0.024, 0.02, 0.014], NAR, dedos, { lados: 4 }); });
  g.userData = { body, head, legs, tail: null };
  return g;
}

export function armarGato() {
  const tipo = Math.floor(Math.random() * 3), PEL = [0xd87a28, 0x222024, 0xf4f0e8][tipo], OREJA = tipo === 1 ? 0x2a2a2e : 0xe8c8a0, MANCHA = [0x96461a, null, 0x3c322c][tipo];
  const dibujo = (u) => { if (tipo === 0) return Math.sin(u.z * 14 + u.y * 3) > 0.45 ? MANCHA : null; if (tipo === 2) return Math.sin(u.x * 6 + 1) * Math.sin(u.z * 5 + 2) > 0.45 ? MANCHA : null; return null; };
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.105, 0.105, 0.22, { y: 0.31, det: 3, grano: 0.12, pinta: dibujo });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.42, 0.2); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.1, 0.09, 0.09, { y: 0.02, z: 0.06, det: 3, grano: 0.1, pinta: dibujo });
  for (const s of [-1, 1]) {
    C.tubo(PEL, [[s * 0.065, 0.08, 0.03], [s * 0.08, 0.17, 0.02]], [0.042, 0.004], { lados: 4, pasos: 1 });
    C.tubo(OREJA, [[s * 0.065, 0.09, 0.05], [s * 0.078, 0.15, 0.04]], [0.024, 0.003], { lados: 3, pasos: 1 });
    for (const k of [-1, 1]) C.tubo(0xf0f0f0, [[s * 0.05, -0.01, 0.14], [s * 0.17, -0.01 + k * 0.02, 0.13]], [0.002, 0.001], { lados: 3, pasos: 1, amb: 1 });
  }
  C.bulto(0xe88a9a, 0.014, 0.01, 0.008, { y: 0, z: 0.15, det: 1 });
  head.add(C.malla());
  const O = new Pieza();
  for (const s of [-1, 1]) { O.bulto(0x70d040, 0.02, 0.018, 0.01, { x: s * 0.045, y: 0.03, z: 0.135, det: 1, amb: 1 }); O.bulto(0x0a0a0a, 0.005, 0.016, 0.006, { x: s * 0.045, y: 0.03, z: 0.144, det: 1, amb: 0.9 }); }
  const ojos = O.malla(); ojos.userData.glow = true; head.add(ojos);
  const legs = [[-0.06, 0.14], [0.06, 0.14], [0.06, -0.14], [-0.06, -0.14]].map(([x, z]) => pata(body, x, 0.22, z, [[0, 0.03, 0], [0, -0.09, 0], [0, -0.21, 0.01]], [0.04, 0.026, 0.024], PEL, null));
  const tail = G(); tail.position.set(0, 0.36, -0.2); tail.rotation.x = -1; body.add(tail);
  const T = new Pieza();
  T.tubo(PEL, [[0, 0, 0], [0, 0, -0.18], [0.03, 0.06, -0.34]], [0.03, 0.025, 0.015], { lados: 5, pinta: tipo === 0 ? (u) => (Math.sin(u.x * 24) > 0.3 ? MANCHA : null) : undefined });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}
