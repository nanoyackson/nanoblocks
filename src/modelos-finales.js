// Lo que quedaba de la fauna (v10.2), con el kit low-poly: mantarraya, pulpo, tiburón ballena, mapache, ranas, tortuguita y loro.
import * as THREE from 'three';
import { Pieza, huevo, bandas } from './lowpoly.js';
import { pata } from './modelos-bravos.js';

const G = () => new THREE.Group();
const ojitos = (P, x, y, z, r = 0.03, color = 0x0c0a08) => { for (const s of [-1, 1]) P.bulto(color, r, r, r * 0.7, { x: s * x, y, z, det: 1, brillo: 1.4, amb: 0.9 }); };

export function armarMantarraya() {
  const OSC = 0x28323e, CLARO = 0xebeef0;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(OSC, 0.3, 0.08, 0.5, { y: 0.12, det: 3, brillo: 0.5, grano: 0.08, pinta: (u) => (u.y < 0 ? CLARO : null) });
  // las aletas cefálicas, los «cuernitos» enroscados
  for (const s of [-1, 1]) P.tubo(OSC, [[s * 0.2, 0.12, 0.44], [s * 0.24, 0.12, 0.62], [s * 0.18, 0.1, 0.72]], [0.04, 0.035, 0.012], { lados: 4 });
  ojitos(P, 0.25, 0.17, 0.42, 0.03);
  body.add(P.malla());
  const alas = [-1, 1].map((s) => { const f = G(), F = new Pieza(); f.position.set(s * 0.27, 0.12, 0); F.bulto(OSC, 0.48, 0.03, 0.33, { x: s * 0.42, z: -0.06, det: 3, brillo: 0.5, grano: 0.08, forma: (v) => { v.z += Math.abs(v.x) * -0.55 * s * s; v.z *= 1 - Math.abs(v.x) * 0.5; }, pinta: (u) => (u.y < 0 ? CLARO : null) }); f.add(F.malla()); body.add(f); return f; });
  const tail = G(); tail.position.set(0, 0.12, -0.45); body.add(tail);
  const T = new Pieza();
  T.tubo(0x1e2630, [[0, 0, 0.04], [0, 0, -0.44], [0, 0.03, -0.9]], [0.022, 0.014, 0.003], { lados: 4 });
  tail.add(T.malla());
  g.userData = { body, tail, fins: [], alas };
  return g;
}

export function armarPulpo() {
  const C = 0xa84430, CLARO = 0xe69678;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(C, 0.24, 0.3, 0.27, { y: 0.56, z: -0.08, det: 3, grano: 0.2, forma: huevo(0), pinta: (u) => (Math.sin(u.x * 15) * Math.sin(u.y * 15 + 1) > 0.55 ? CLARO : null) });
  P.bulto(C, 0.2, 0.15, 0.18, { y: 0.34, det: 2, grano: 0.2 });
  for (const s of [-1, 1]) { P.bulto(0xf0e0a0, 0.055, 0.05, 0.03, { x: s * 0.13, y: 0.42, z: 0.14, det: 2, brillo: 1.2, amb: 1 }); P.bulto(0x161616, 0.04, 0.016, 0.012, { x: s * 0.13, y: 0.42, z: 0.168, det: 1, amb: 0.9 }); }
  body.add(P.malla());
  const pies = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, p = G(), Q = new Pieza();
    p.position.set(Math.sin(a) * 0.16, 0.28, Math.cos(a) * 0.16); p.rotation.order = 'YXZ'; p.rotation.y = a; p.rotation.x = 0.5;
    Q.tubo(C, [[0, 0, -0.02], [0, 0.02, 0.2], [(i % 2 ? 0.05 : -0.05), -0.02, 0.4], [(i % 2 ? 0.1 : -0.1), 0.05, 0.56]], [0.06, 0.045, 0.03, 0.006], { lados: 5, pasos: 3, grano: 0.14, pinta: bandas(CLARO, 9, 0.28) });
    p.add(Q.malla()); body.add(p); pies.push(p);
  }
  g.userData = { body, pies, fins: [] };
  return g;
}

export function armarTiburonBallena() {
  const AZUL = 0x3a4e68, PUNTO = 0xebf0f5, CLARO = 0xe0e4e8;
  const dibujo = (u) => { if (u.y < -0.2) return CLARO; const a = u.z * 16, b = u.x * 11 + Math.floor(a) * 0.5; return a - Math.floor(a) < 0.35 && b - Math.floor(b) < 0.32 ? PUNTO : null; };
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(AZUL, 1.08, 0.9, 2.9, { y: 0.9, det: 4, grano: 0.08, forma: huevo(0.08), pinta: dibujo });
  P.bulto(AZUL, 1.15, 0.65, 0.9, { y: 0.75, z: 3.1, det: 3, grano: 0.08, forma: (v) => { if (v.y > 0) v.y *= 0.8; }, pinta: dibujo });
  P.tubo(0x14161a, [[-0.92, 0.55, 3.1], [-0.6, 0.48, 3.9], [0, 0.45, 4.02], [0.6, 0.48, 3.9], [0.92, 0.55, 3.1]], [0.04, 0.08, 0.1, 0.08, 0.04], { lados: 4 }); // la bocota de filtrar
  for (const s of [-1, 1]) P.tubo(0x5a6e88, [[s * 0.6, 1.3, 2], [s * 0.6, 1.63, 0], [s * 0.6, 1.2, -2.2]], [0.05, 0.07, 0.03], { lados: 4 }); // las crestas
  P.tubo(AZUL, [[0, 1.74, 0], [0, 2.3, -0.5], [0, 2.56, -1]], [0.46, 0.2, 0.01], { lados: 4, pliegue: (a) => (Math.abs(Math.cos(a)) > 0.7 ? 0.2 : 1) });
  ojitos(P, 1.08, 0.92, 3.5, 0.1);
  // las rémoras pegadas abajo
  for (const [x, z] of [[-0.5, 0.8], [0.4, -0.6]]) P.bulto(0x7a7a6a, 0.08, 0.06, 0.3, { x, y: 0.04, z, det: 1, grano: 0.2 });
  body.add(P.malla());
  const fins = [-1, 1].map((s) => { const f = G(), F = new Pieza(); f.position.set(s * 0.8, 0.4, 1.4); F.bulto(AZUL, 0.8, 0.06, 0.38, { x: s * 0.72, z: -0.14, det: 2, grano: 0.08, rot: [0, s * 0.3, 0], pinta: (u) => (Math.sin(u.x * 17) * Math.sin(u.z * 13) > 0.5 ? PUNTO : null) }); f.add(F.malla()); body.add(f); return f; });
  const tail = G(); tail.position.set(0, 0.9, -2.6); body.add(tail);
  const T = new Pieza();
  T.tubo(AZUL, [[0, 0, 0.3], [0, 0, -1], [0, 0.04, -1.9]], [0.7, 0.4, 0.2], { lados: 9, grano: 0.08, pinta: (u) => (Math.sin(u.x * 40) > 0.75 ? PUNTO : null) });
  T.bulto(AZUL, 0.08, 1.5, 0.42, { y: 0.74, z: -2.06, det: 2, rot: [-0.4, 0, 0], grano: 0.08 });
  T.bulto(AZUL, 0.08, 0.66, 0.3, { y: -0.42, z: -2, det: 2, rot: [0.5, 0, 0], grano: 0.08 });
  tail.add(T.malla());
  g.userData = { body, tail, fins };
  return g;
}

export function armarMapache() {
  const GRIS = 0x808084, CLARO = 0xf0f0ec, NEGRO = 0x1a1a1c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(GRIS, 0.17, 0.16, 0.28, { y: 0.33, det: 3, grano: 0.3, forma: huevo(-0.18) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.38, 0.28); body.add(head);
  const C = new Pieza();
  // el antifaz negro de ladrón y el hocico blanco
  C.bulto(0x9a9a9c, 0.135, 0.115, 0.12, { z: 0.08, det: 3, grano: 0.2, forma: (v) => { v.x *= 1 - v.z * 0.14; }, pinta: (u) => (u.z > 0.3 && u.y > -0.15 && u.y < 0.35 ? NEGRO : u.y > 0.55 && u.z > 0.2 ? CLARO : null) });
  C.bulto(CLARO, 0.06, 0.05, 0.07, { y: -0.04, z: 0.19, det: 2, amb: 0.85 });
  C.bulto(0x111111, 0.022, 0.018, 0.012, { y: -0.015, z: 0.258, det: 0, brillo: 1.3 });
  for (const s of [-1, 1]) { C.tubo(0x5a5a5e, [[s * 0.09, 0.09, 0.05], [s * 0.12, 0.18, 0.03]], [0.04, 0.008], { lados: 4, pasos: 1 }); C.bulto(0xe8e8e0, 0.018, 0.018, 0.012, { x: s * 0.065, y: 0.035, z: 0.195, det: 0, amb: 1, brillo: 1.3 }); }
  head.add(C.malla());
  const B = new Pieza();
  B.bulto(0xe8c040, 0.05, 0.04, 0.04, { det: 1, brillo: 1 });
  const botin = B.malla(); botin.position.set(0, -0.08, 0.27); botin.visible = false; head.add(botin);
  const legs = [[-0.1, 0.18], [0.1, 0.18], [0.1, -0.18], [-0.1, -0.18]].map(([x, z]) => pata(body, x, 0.22, z, [[0, 0.03, 0], [0, -0.09, 0], [0, -0.21, 0.01]], [0.055, 0.04, 0.036], 0x2a2a2c, (Q, f) => { for (const d of [-1, 0, 1]) Q.tubo(0x2a2a2c, [[f[0] + d * 0.02, f[1] + 0.01, f[2]], [f[0] + d * 0.035, f[1], f[2] + 0.06]], [0.012, 0.004], { lados: 3, pasos: 1 }); }));
  const tail = G(); tail.position.set(0, 0.36, -0.26); tail.rotation.x = -0.4; body.add(tail);
  const T = new Pieza();
  T.tubo(0x9a9a9c, [[0, 0, 0], [0, 0, -0.22], [0, 0, -0.44]], [0.05, 0.07, 0.03], { lados: 7, pasos: 3, grano: 0.3, pinta: bandas(0x2a2a2c, 6, 0.46) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail, botin };
  return g;
}

export function armarRana(colorHex, ojoHex, pataHex, venenosa) {
  const color = new THREE.Color(colorHex).getHex(), ojo = new THREE.Color(ojoHex).getHex(), patas = new THREE.Color(pataHex).getHex();
  const g = G(), b = G(); g.add(b);
  const P = new Pieza();
  P.bulto(color, 0.115, 0.075, 0.13, { y: 0.1, det: 3, brillo: 1, grano: 0.08, pinta: venenosa ? (u) => (Math.sin(u.x * 13 + 1) * Math.sin(u.z * 12) > 0.3 ? 0x111111 : null) : null });
  P.bulto(color, 0.09, 0.055, 0.07, { y: 0.13, z: 0.11, det: 2, brillo: 1 });
  P.tubo(0x1a1a14, [[-0.08, 0.115, 0.14], [0, 0.11, 0.18], [0.08, 0.115, 0.14]], [0.003, 0.004, 0.003], { lados: 3, pasos: 2 });
  for (const s of [-1, 1]) P.tubo(patas, [[s * 0.09, 0.08, 0.1], [s * 0.13, 0.05, 0.13], [s * 0.13, 0.01, 0.16]], [0.018, 0.014, 0.01], { lados: 4, pasos: 2 });
  b.add(P.malla());
  const E = new Pieza();
  for (const s of [-1, 1]) { E.bulto(ojo, 0.035, 0.035, 0.035, { x: s * 0.075, y: 0.185, z: 0.12, det: 2, amb: 1, brillo: 1.4 }); if (!venenosa) E.bulto(0x101010, 0.008, 0.024, 0.01, { x: s * 0.075, y: 0.185, z: 0.154, det: 1, amb: 0.9 }); }
  const ojos = E.malla(); if (!venenosa) ojos.userData.glow = true; b.add(ojos);
  const frogLegs = [-1, 1].map((s) => { const l = G(), Q = new Pieza(); l.position.set(s * 0.1, 0.05, -0.03); Q.bulto(patas, 0.04, 0.035, 0.08, { x: s * 0.03, y: 0.02, det: 2, brillo: 0.6 }); Q.tubo(patas, [[s * 0.05, -0.01, -0.06], [s * 0.07, -0.03, 0.06], [s * 0.08, -0.04, 0.15]], [0.02, 0.016, 0.01], { lados: 4, pasos: 2 }); for (const d of [-1, 0, 1]) Q.bulto(patas, 0.012, 0.006, 0.02, { x: s * 0.08 + d * 0.022, y: -0.045, z: 0.17, det: 0 }); l.add(Q.malla()); b.add(l); return l; });
  g.userData = { body: b, frogLegs };
  return g;
}

export function armarTortuguita() {
  const CONCHA = 0x735c3a, PIEL = 0x607756;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(CONCHA, 0.13, 0.065, 0.15, { y: 0.09, det: 2, brillo: 0.5, grano: 0.14, pinta: (u) => (u.y < -0.1 ? 0xc8b888 : null) });
  P.bulto(PIEL, 0.05, 0.045, 0.06, { y: 0.1, z: 0.17, det: 1 });
  ojitos(P, 0.04, 0.115, 0.205, 0.012);
  body.add(P.malla());
  const flippers = [[-0.11, 0.08], [0.11, 0.08]].map(([x, z]) => { const s = Math.sign(x), l = G(), F = new Pieza(); l.position.set(x, 0.06, z); F.bulto(PIEL, 0.08, 0.012, 0.035, { x: s * 0.07, det: 1, rot: [0, s * 0.35, 0] }); l.add(F.malla()); body.add(l); return l; });
  g.userData = { body, legs: [], flippers };
  return g;
}

export function armarLoro() {
  const VERDE = 0x48b048, OSC = 0x2a8a30, ROJO = 0xd82a2a;
  const g = G(), body = G(); body.position.y = 0.2; g.add(body);
  const P = new Pieza();
  P.bulto(VERDE, 0.095, 0.125, 0.11, { det: 3, brillo: 0.7, grano: 0.14, forma: huevo(-0.05) });
  for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.025; P.bulto(i % 2 ? OSC : 0x2a5ac8, 0.02, 0.008, 0.11, { x, y: -0.07, z: -0.18, det: 0, rot: [0.2, x, 0] }); }
  for (const s of [-1, 1]) P.tubo(0x8a8a80, [[s * 0.04, -0.11, 0], [s * 0.04, -0.17, 0.01]], [0.012, 0.01], { lados: 3, pasos: 1 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.14, 0.06); body.add(head);
  const C = new Pieza();
  C.bulto(VERDE, 0.08, 0.075, 0.08, { det: 2, brillo: 0.7, grano: 0.14, pinta: (u) => (u.y > 0.3 && u.z > 0.3 ? ROJO : null) });
  C.tubo(0xe8d070, [[0, 0.03, 0.06], [0, 0.02, 0.12], [0, -0.04, 0.13]], [0.04, 0.03, 0.005], { lados: 5, pasos: 2, brillo: 0.9 });
  ojitos(C, 0.06, 0.02, 0.045, 0.014);
  head.add(C.malla());
  const wings = [-1, 1].map((side) => { const p = G(), W = new Pieza(); p.position.set(side * 0.09, 0.03, 0); for (let k = 0; k < 5; k++) W.bulto(k > 2 ? 0x2a5ac8 : OSC, 0.024, 0.009, 0.08, { x: side * (0.02 + k * 0.038), z: -0.03, det: 0, brillo: 0.7 }); p.add(W.malla()); body.add(p); return { p, side }; });
  g.userData = { body, head, wings };
  return g;
}
