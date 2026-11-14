// Los animales de finca y de monte abierto (v9.2), con el kit low-poly: danta, venado, pizote, terciopelo, vaca, perro, caballo y gallina.
import * as THREE from 'three';
import { Pieza, huevo, bandas } from './lowpoly.js';
import { pata } from './modelos-bravos.js';

const G = () => new THREE.Group();
const ojitos = (P, x, y, z, r = 0.03, color = 0x0c0a08) => { for (const s of [-1, 1]) P.bulto(color, r, r, r * 0.7, { x: s * x, y, z, det: 1, brillo: 1.4, amb: 0.9 }); };

export function armarDanta() {
  const PEL = 0x4a3f39, OSC = 0x2e2724, CREMA = 0xd0c4ad;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // cuerpo de barril, más alto atrás, y la crin corta del cogote
  P.bulto(PEL, 0.46, 0.42, 0.74, { y: 0.82, z: -0.05, det: 4, grano: 0.16, forma: huevo(-0.12), pinta: (u) => (u.y < -0.55 ? OSC : null) });
  for (let i = 0; i < 8; i++) P.tubo(OSC, [[0, 1.2 - i * 0.008, 0.55 - i * 0.07], [0, 1.28 - i * 0.008, 0.5 - i * 0.07]], [0.04, 0.005], { lados: 4, pasos: 1 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.95, 0.55); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.26, 0.26, 0.3, { z: 0.08, det: 3, grano: 0.16, pinta: (u) => (u.y < -0.3 && u.z > 0 ? CREMA : null) });
  ojitos(C, 0.2, 0.08, 0.26, 0.032);
  head.add(C.malla());
  // la trompa que se mueve
  const trunk = G(); trunk.position.set(0, -0.08, 0.34); head.add(trunk);
  const T = new Pieza();
  T.tubo(OSC, [[0, 0.02, 0], [0, -0.02, 0.2], [0, -0.1, 0.36]], [0.14, 0.1, 0.08], { lados: 8, pasos: 3, grano: 0.2, pinta: bandas(0x3a322c, 7, 0.4) });
  T.bulto(0x1c1816, 0.08, 0.05, 0.03, { y: -0.1, z: 0.38, det: 1 });
  trunk.add(T.malla());
  const orejas = [-1, 1].map((s) => {
    const e = G(), E = new Pieza(); e.position.set(s * 0.2, 0.22, 0.1);
    E.bulto(PEL, 0.08, 0.1, 0.03, { y: 0.06, det: 2, grano: 0.16, pinta: (u) => (Math.hypot(u.x, u.y) > 0.72 ? 0xf0e8d8 : null) });
    e.add(E.malla()); head.add(e); return e;
  });
  const pezuna = (Q, f) => Q.bulto(0x1c1816, 0.12, 0.05, 0.13, { x: f[0], y: f[1] + 0.025, z: f[2] + 0.02, det: 2 });
  const legs = [[-0.26, 0.42], [0.26, 0.42], [0.26, -0.5], [-0.26, -0.5]].map(([x, z]) => pata(body, x, 0.5, z, [[0, 0.05, 0], [0, -0.2, -0.02], [0, -0.48, 0]], [0.16, 0.11, 0.1], OSC, pezuna, { grano: 0.16 }));
  const tail = G(); tail.position.set(0, 1, -0.76); body.add(tail);
  const Co = new Pieza();
  Co.tubo(OSC, [[0, 0, 0], [0, -0.08, -0.04], [0, -0.16, -0.03]], [0.05, 0.04, 0.02], { lados: 5, pasos: 2 });
  tail.add(Co.malla());
  g.userData = { body, head, legs, tail, ears: orejas, trunk };
  return g;
}

export function armarVenado() {
  const PEL = 0x9a724a, CLARO = 0xe8e4dc, OSC = 0x5a3e26;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.22, 0.24, 0.52, { y: 0.97, det: 3, grano: 0.14, forma: huevo(0.08), pinta: (u) => (u.y < -0.5 ? CLARO : null) });
  body.add(P.malla());
  const neck = G(); neck.position.set(0, 1.12, 0.38); neck.rotation.x = -0.35; body.add(neck);
  const N = new Pieza();
  N.tubo(PEL, [[0, -0.08, 0], [0, 0.2, 0.04], [0, 0.42, 0.06]], [0.14, 0.1, 0.09], { lados: 7, grano: 0.14 });
  // la cabeza fina con el hocico oscuro y las astas ramificadas
  N.bulto(PEL, 0.12, 0.12, 0.2, { y: 0.48, z: 0.14, det: 3, grano: 0.12, forma: (v) => { v.x *= 1 - v.z * 0.3; v.y *= 1 - v.z * 0.2; }, pinta: (u) => (u.z > 0.72 ? OSC : u.y < -0.4 ? CLARO : null) });
  ojitos(N, 0.09, 0.53, 0.2, 0.024);
  for (const s of [-1, 1]) {
    N.bulto(PEL, 0.035, 0.09, 0.055, { x: s * 0.14, y: 0.6, z: 0.02, det: 2, rot: [0, 0, -s * 0.7], pinta: (u) => (u.z > 0.4 ? CLARO : null) });
    N.tubo(0xd8c8a8, [[s * 0.07, 0.58, 0.04], [s * 0.16, 0.76, -0.02], [s * 0.2, 0.94, 0.06]], [0.024, 0.02, 0.005], { lados: 4, amb: 0.9 });
    N.tubo(0xd8c8a8, [[s * 0.15, 0.73, -0.01], [s * 0.08, 0.86, 0.06]], [0.015, 0.004], { lados: 3, pasos: 1, amb: 0.9 });
    N.tubo(0xd8c8a8, [[s * 0.18, 0.84, 0.02], [s * 0.28, 0.94, 0.02]], [0.013, 0.004], { lados: 3, pasos: 1, amb: 0.9 });
  }
  neck.add(N.malla());
  const pezuna = (Q, f) => Q.bulto(0x241a12, 0.045, 0.03, 0.055, { x: f[0], y: f[1] + 0.015, z: f[2] + 0.01, det: 1 });
  const legs = [[-0.14, 0.34], [0.14, 0.34], [0.14, -0.34], [-0.14, -0.34]].map(([x, z], i) => pata(body, x, 0.82, z, i < 2 ? [[0, 0.06, 0], [0, -0.34, 0.02], [0, -0.8, 0]] : [[0, 0.08, 0], [0, -0.3, -0.1], [0, -0.8, 0]], [0.09, 0.045, 0.032], OSC, pezuna));
  const tail = G(); tail.position.set(0, 1.08, -0.5); body.add(tail);
  const T = new Pieza();
  T.bulto(CLARO, 0.08, 0.13, 0.04, { y: -0.08, det: 2, amb: 0.85, pinta: (u) => (u.z < -0.2 ? PEL : null) });
  tail.add(T.malla());
  g.userData = { body, head: neck, legs, tail, headRx: -0.35 };
  return g;
}

export function armarPizote() {
  const PEL = 0x7f5a38, CLARO = 0xd8c8a8, OSC = 0x2a1c12;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.17, 0.16, 0.34, { y: 0.37, det: 3, grano: 0.24, pinta: (u) => (u.y < -0.5 ? CLARO : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.4, 0.3); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.115, 0.1, 0.13, { z: 0.06, det: 2, grano: 0.22 });
  // el hocico largo y respingado, con la cara marcada
  C.tubo(OSC, [[0, -0.01, 0.14], [0, -0.03, 0.28], [0, 0.0, 0.39]], [0.06, 0.04, 0.03], { lados: 6, pasos: 3 });
  for (const s of [-1, 1]) { C.bulto(CLARO, 0.03, 0.02, 0.03, { x: s * 0.06, y: 0.07, z: 0.14, det: 1, amb: 0.9 }); C.bulto(OSC, 0.035, 0.04, 0.02, { x: s * 0.09, y: 0.11, z: 0, det: 1 }); }
  ojitos(C, 0.065, 0.04, 0.165, 0.02);
  head.add(C.malla());
  const legs = [[-0.11, 0.2], [0.11, 0.2], [0.11, -0.2], [-0.11, -0.2]].map(([x, z]) => pata(body, x, 0.26, z, [[0, 0.04, 0], [0, -0.1, 0], [0, -0.24, 0.02]], [0.06, 0.04, 0.038], OSC));
  // la cola anillada, siempre parada
  const tail = G(); tail.position.set(0, 0.45, -0.3); tail.rotation.x = -1.1; body.add(tail);
  const T = new Pieza();
  T.tubo(PEL, [[0, 0, 0], [0, 0.04, -0.3], [0, 0.0, -0.6]], [0.05, 0.05, 0.02], { lados: 6, pinta: bandas(OSC, 6, 0.42) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarTerciopelo() {
  const CAFE = 0x615032, OSC = 0x2a2014, CLARO = 0xd2be96;
  const dibujo = (u) => { if (u.y < -0.35) return 0xc8b890; const r = Math.abs(u.x) + Math.abs(u.z) * 0.85; return u.y > 0 ? (r < 0.4 ? OSC : r < 0.56 ? CLARO : null) : null; };
  const g = G(), body = G(); g.add(body);
  const segs = [];
  for (let i = 0; i < 7; i++) {
    const S = new Pieza();
    S.bulto(CAFE, 0.09 - i * 0.006, 0.066 - i * 0.004, 0.125, { det: 2, grano: 0.14, brillo: 0.4, pinta: dibujo });
    const s = S.malla(); s.position.set(0, 0.07, 0.3 - i * 0.18); body.add(s); segs.push(s);
  }
  const C = new Pieza();
  // la cabeza de lanza: ancha atrás y puntiaguda adelante
  C.bulto(CAFE, 0.12, 0.06, 0.14, { det: 3, brillo: 0.4, grano: 0.12, forma: (v) => { v.x *= 1 - v.z * 0.5; }, pinta: (u) => (u.y > 0.35 && Math.abs(u.x) < 0.2 ? OSC : u.y < -0.3 ? 0xc8b890 : null) });
  for (const s of [-1, 1]) { C.bulto(0xe0c040, 0.022, 0.022, 0.022, { x: s * 0.08, y: 0.03, z: 0.03, det: 1, brillo: 1.5, amb: 0.95 }); C.bulto(0x0a0a0a, 0.006, 0.018, 0.008, { x: s * 0.098, y: 0.03, z: 0.035, det: 1, amb: 0.9 }); }
  C.tubo(0xd02020, [[0, -0.02, 0.12], [0, -0.02, 0.2]], [0.008, 0.004], { lados: 3, pasos: 1 });
  for (const s of [-1, 1]) C.tubo(0xd02020, [[0, -0.02, 0.2], [s * 0.03, -0.025, 0.25]], [0.004, 0.001], { lados: 3, pasos: 1 });
  const head = C.malla(); head.position.set(0, 0.08, 0.45); body.add(head);
  g.userData = { body, head, segs };
  return g;
}

export function armarVaca() {
  const PEL = 0xe6e0d4, SOMBRA = 0xc8c0b0, TROMPA = 0x4a4038;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // brahman: clara, con giba y la papada colgando
  P.bulto(PEL, 0.38, 0.36, 0.72, { y: 0.92, det: 4, grano: 0.1, pinta: (u) => (u.y < -0.5 ? SOMBRA : null) });
  P.bulto(PEL, 0.17, 0.15, 0.2, { y: 1.22, z: 0.4, det: 3, grano: 0.1, pinta: (u) => (u.y > 0.6 ? SOMBRA : null) });
  P.bulto(SOMBRA, 0.09, 0.26, 0.2, { y: 0.66, z: 0.56, det: 2, grano: 0.12 });
  // la ubre
  P.bulto(0xe4b8a8, 0.14, 0.09, 0.15, { y: 0.56, z: -0.38, det: 2 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 1, 0.65); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.2, 0.22, 0.26, { z: 0.08, det: 3, grano: 0.1 });
  C.bulto(TROMPA, 0.15, 0.11, 0.09, { y: -0.1, z: 0.32, det: 2, brillo: 0.5 });
  ojitos(C, 0.15, 0.08, 0.24, 0.032);
  for (const s of [-1, 1]) {
    C.bulto(SOMBRA, 0.05, 0.14, 0.04, { x: s * 0.27, y: -0.03, z: 0.05, det: 2, rot: [0, 0, s * 0.4] }); // las orejas caídas
    C.tubo(0x9a9080, [[s * 0.12, 0.2, 0.05], [s * 0.2, 0.3, 0.03], [s * 0.18, 0.42, 0.08]], [0.04, 0.03, 0.005], { lados: 5, brillo: 0.5 });
  }
  head.add(C.malla());
  const pezuna = (Q, f) => Q.bulto(0x3a342c, 0.1, 0.05, 0.12, { x: f[0], y: f[1] + 0.025, z: f[2] + 0.02, det: 2 });
  const legs = [[-0.22, 0.45], [0.22, 0.45], [0.22, -0.45], [-0.22, -0.45]].map(([x, z], i) => pata(body, x, 0.62, z, i < 2 ? [[0, 0.06, 0], [0, -0.26, 0.01], [0, -0.6, 0]] : [[0, 0.08, 0], [0, -0.22, -0.08], [0, -0.6, 0]], [0.14, 0.08, 0.07], PEL, pezuna));
  const tail = G(); tail.position.set(0, 1.1, -0.68); body.add(tail);
  const T = new Pieza();
  T.tubo(SOMBRA, [[0, 0, 0], [0, -0.3, -0.05], [0, -0.52, -0.03]], [0.035, 0.025, 0.018], { lados: 5 });
  T.bulto(0x8a8070, 0.06, 0.11, 0.06, { y: -0.62, z: -0.03, det: 1, grano: 0.3 });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarPerro() {
  const PEL = 0x9c7a50, MANCHA = 0xebe0cc, OSC = 0x6b4a2a;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // zaguate: flaco, con manchas claras
  P.bulto(PEL, 0.17, 0.17, 0.36, { y: 0.56, det: 3, grano: 0.14, forma: huevo(0.16), pinta: (u) => (Math.sin(u.x * 7 + 1) * Math.sin(u.z * 6) > 0.5 || u.y < -0.55 ? MANCHA : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.62, 0.33); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.14, 0.13, 0.14, { y: 0.02, z: 0.08, det: 3, grano: 0.12 });
  C.tubo(OSC, [[0, -0.03, 0.17], [0, -0.05, 0.3]], [0.085, 0.065], { lados: 7, pasos: 2 });
  C.bulto(0x1a1210, 0.035, 0.028, 0.02, { y: -0.03, z: 0.365, det: 1, brillo: 1.2 });
  C.tubo(0x2a1a14, [[-0.05, -0.08, 0.31], [0, -0.09, 0.355], [0.05, -0.08, 0.31]], [0.005, 0.006, 0.005], { lados: 3, pasos: 2 });
  ojitos(C, 0.07, 0.07, 0.205, 0.026);
  head.add(C.malla());
  const ears = [-1, 1].map((s) => {
    const e = G(), E = new Pieza(); e.position.set(s * 0.12, 0.13, 0.05);
    E.bulto(OSC, 0.045, 0.09, 0.025, { x: s * 0.02, y: -0.06, det: 2, grano: 0.14 });
    e.add(E.malla()); head.add(e); return e;
  });
  const legs = [[-0.1, 0.22], [0.1, 0.22], [0.1, -0.22], [-0.1, -0.22]].map(([x, z], i) => pata(body, x, 0.4, z, i < 2 ? [[0, 0.04, 0], [0, -0.16, 0.01], [0, -0.38, 0.02]] : [[0, 0.06, 0], [0, -0.12, -0.07], [0, -0.38, 0]], [0.07, 0.045, 0.04], PEL, (Q, f) => Q.bulto(MANCHA, 0.05, 0.03, 0.065, { x: f[0], y: f[1] + 0.015, z: f[2] + 0.015, det: 1 })));
  const tail = G(); tail.position.set(0, 0.62, -0.34); tail.rotation.x = -0.7; body.add(tail);
  const T = new Pieza();
  T.tubo(PEL, [[0, 0, 0], [0, 0.02, -0.18], [0, 0.08, -0.34]], [0.04, 0.032, 0.012], { lados: 5 });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail, ears };
  return g;
}

export function armarCaballo() {
  const PEL = 0x6b4529, CRIN = 0x1e1410, CLARO = 0xf0ece0;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.33, 0.34, 0.72, { y: 1.06, det: 4, grano: 0.08, brillo: 0.5, forma: huevo(0.1) });
  P.bulto(PEL, 0.32, 0.33, 0.26, { y: 1.12, z: -0.44, det: 3, grano: 0.08, brillo: 0.5 });
  body.add(P.malla());
  const neck = G(); neck.position.set(0, 1.25, 0.55); neck.rotation.x = 0.45; body.add(neck);
  const N = new Pieza();
  N.tubo(PEL, [[0, -0.14, -0.02], [0, 0.26, 0.04], [0, 0.66, 0.05]], [0.24, 0.17, 0.13], { lados: 8, grano: 0.08, brillo: 0.4 });
  // la crin cae a lo largo del cogote
  for (let i = 0; i < 13; i++) { const y = -0.06 + i * 0.065, z = -0.17 + i * 0.012; N.tubo(CRIN, [[0, y, z], [(i % 2 ? 1 : -1) * 0.08, y - 0.12, z - 0.06], [(i % 2 ? 1 : -1) * 0.12, y - 0.26, z - 0.03]], [0.05, 0.035, 0.006], { lados: 4, pasos: 2 }); }
  neck.add(N.malla());
  const head = G(); head.position.set(0, 0.62, 0.05); head.rotation.x = -0.45; neck.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.15, 0.16, 0.32, { z: 0.08, det: 3, grano: 0.08, brillo: 0.4, forma: (v) => { v.x *= 1 - v.z * 0.22; v.y *= 1 - v.z * 0.26; }, pinta: (u) => (u.y > 0.35 && Math.abs(u.x) < 0.2 && u.z > -0.3 ? CLARO : u.z > 0.85 ? 0x2a1c14 : null) });
  ojitos(C, 0.14, 0.07, 0.04, 0.03);
  for (const s of [-1, 1]) { C.tubo(0x3a2414, [[s * 0.09, 0.15, -0.1], [s * 0.1, 0.32, -0.12]], [0.05, 0.006], { lados: 5, pasos: 1 }); C.bulto(0x0c0806, 0.018, 0.018, 0.01, { x: s * 0.05, y: -0.03, z: 0.39, det: 1 }); }
  // el copete
  for (const d of [-0.04, 0, 0.04]) C.tubo(CRIN, [[d, 0.16, -0.06], [d * 1.5, 0.14, 0.1], [d * 2, 0.08, 0.16]], [0.03, 0.022, 0.005], { lados: 4, pasos: 2 });
  head.add(C.malla());
  const casco = (Q, f) => { Q.bulto(CLARO, 0.1, 0.05, 0.1, { x: f[0], y: f[1] + 0.09, z: f[2], det: 2 }); Q.bulto(0x1a1410, 0.095, 0.05, 0.11, { x: f[0], y: f[1] + 0.03, z: f[2] + 0.01, det: 2, brillo: 0.5 }); };
  const legs = [[-0.2, 0.5], [0.2, 0.5], [0.2, -0.5], [-0.2, -0.5]].map(([x, z], i) => pata(body, x, 0.84, z, i < 2 ? [[0, 0.06, 0], [0, -0.34, 0.02], [0, -0.82, 0]] : [[0, 0.08, 0], [0, -0.3, -0.1], [0, -0.82, 0]], [0.14, 0.07, 0.055], PEL, casco, { brillo: 0.3 }));
  const tail = G(); tail.position.set(0, 1.25, -0.68); tail.rotation.x = 0.35; body.add(tail);
  const T = new Pieza();
  for (const d of [-0.05, 0, 0.05]) T.tubo(CRIN, [[d * 0.4, 0, 0], [d, -0.34, -0.02], [d * 1.8, -0.76, 0]], [0.05, 0.05, 0.008], { lados: 4 });
  tail.add(T.malla());
  // la montura
  const saddle = G(), S = new Pieza();
  S.bulto(0x5a2a14, 0.3, 0.08, 0.28, { y: 1.42, z: 0.05, det: 3, brillo: 0.5, forma: (v) => { if (v.y < 0) v.y = 0; } });
  S.tubo(0x3a1a0c, [[0, 1.46, 0.28], [0, 1.58, 0.31]], [0.05, 0.07], { lados: 6, pasos: 1, brillo: 0.5 });
  S.tubo(0x7a4a2a, [[-0.33, 1.42, 0.05], [-0.35, 1.2, 0.05], [-0.32, 0.94, 0.05]], [0.018, 0.018, 0.018], { lados: 4 });
  S.tubo(0x7a4a2a, [[0.33, 1.42, 0.05], [0.35, 1.2, 0.05], [0.32, 0.94, 0.05]], [0.018, 0.018, 0.018], { lados: 4 });
  for (const s of [-1, 1]) S.bulto(0x8a8a90, 0.05, 0.03, 0.05, { x: s * 0.32, y: 0.92, z: 0.05, det: 1, brillo: 1 });
  saddle.add(S.malla()); saddle.visible = false; body.add(saddle);
  g.userData = { body, head: neck, legs, tail, saddle, headRx: 0.45 };
  return g;
}

export function armarGallina() {
  const cafe = Math.random() < 0.5, PLUMA = cafe ? 0x94592a : 0xf2ede4, OSC = cafe ? 0x6a3e1c : 0xc8c0b4;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PLUMA, 0.16, 0.16, 0.22, { y: 0.36, det: 3, grano: 0.2, forma: huevo(-0.1), pinta: (u) => (u.y < -0.45 ? OSC : null) });
  // la cola levantada
  for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.03; P.tubo(i % 2 ? OSC : PLUMA, [[x, 0.42, -0.16], [x * 1.6, 0.56, -0.26], [x * 2.2, 0.66, -0.26]], [0.04, 0.035, 0.006], { lados: 4, pasos: 2 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.5, 0.17); body.add(head);
  const C = new Pieza();
  C.tubo(PLUMA, [[0, -0.08, -0.03], [0, 0.04, 0.02]], [0.09, 0.07], { lados: 7, pasos: 1, grano: 0.2 });
  C.bulto(PLUMA, 0.08, 0.085, 0.08, { y: 0.09, z: 0.03, det: 2, grano: 0.2 });
  C.tubo(0xf0a020, [[0, 0.085, 0.1], [0, 0.065, 0.18]], [0.03, 0.004], { lados: 5, pasos: 1, brillo: 0.6 });
  // la cresta y la barbilla
  for (let i = 0; i < 4; i++) C.bulto(0xd0201a, 0.016, 0.04 - Math.abs(i - 1.5) * 0.006, 0.024, { y: 0.19 - Math.abs(i - 1.5) * 0.012, z: -0.03 + i * 0.03, det: 1 });
  C.bulto(0xd0201a, 0.016, 0.035, 0.022, { y: 0.015, z: 0.1, det: 1 });
  ojitos(C, 0.07, 0.11, 0.06, 0.016);
  head.add(C.malla());
  const legs = [-0.07, 0.07].map((x) => pata(body, x, 0.24, 0, [[0, 0.02, 0], [0, -0.1, -0.01], [0, -0.22, 0.01]], [0.03, 0.018, 0.016], 0xe0a020, (Q, f) => { for (const a of [-0.5, 0, 0.5, Math.PI]) Q.tubo(0xe0a020, [[f[0], f[1], f[2]], [f[0] + Math.sin(a) * 0.08, f[1] - 0.005, f[2] + Math.cos(a) * 0.08]], [0.013, 0.004], { lados: 3, pasos: 1 }); }));
  const henWings = [-1, 1].map((s) => {
    const w = G(), W = new Pieza(); w.position.set(s * 0.15, 0.45, 0);
    W.bulto(OSC, 0.03, 0.1, 0.17, { y: -0.08, z: -0.02, det: 2, grano: 0.2, pinta: (u) => (Math.sin(u.z * 12) > 0.3 ? PLUMA : null) });
    w.add(W.malla()); body.add(w); return w;
  });
  g.userData = { body, head, legs, henWings };
  return g;
}
