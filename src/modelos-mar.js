// La vida del mar y las aves de monte (v10.1), con el kit low-poly: delfín, ballena, tiburón martillo, peces, manatí, baula, raya, los
// marineros fantasma de la goleta, martilla, pava y chompipe.
import * as THREE from 'three';
import { Pieza, huevo } from './lowpoly.js';
import { pata, brasa } from './modelos-bravos.js';

const G = () => new THREE.Group();
const ojitos = (P, x, y, z, r = 0.03, color = 0x0c0a08) => { for (const s of [-1, 1]) P.bulto(color, r, r, r * 0.7, { x: s * x, y, z, det: 1, brillo: 1.4, amb: 0.9 }); };
const hx = (c) => (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]);
const contrasombra = (claro, desde = -0.15) => (u) => (u.y < desde ? claro : null); // lomo oscuro y panza clara, como todo pez de mar abierto

export function vestirPez(u, sk) {
  const color = hx(sk.cols[1]), oscuro = hx(sk.cols[0]), panza = hx(sk.belly);
  const P = new Pieza();
  P.bulto(color, 0.08, 0.135, 0.22, { y: 0.15, det: 2, brillo: 0.9, grano: 0.1, forma: huevo(0.2), pinta: (q) => (q.y < -0.25 ? panza : Math.abs(q.x) > 0.5 && Math.sin(q.z * 15) > 0.4 ? oscuro : null) });
  ojitos(P, 0.075, 0.19, 0.14, 0.022);
  P.bulto(oscuro, 0.012, 0.075, 0.1, { y: 0.31, z: -0.02, det: 1 });
  for (const s of [-1, 1]) P.bulto(oscuro, 0.05, 0.012, 0.04, { x: s * 0.1, y: 0.1, z: 0.07, det: 0, rot: [0, 0, s * 0.5] });
  u.body.add(P.malla());
  u.tail = G(); u.tail.position.set(0, 0.15, -0.21);
  const T = new Pieza();
  for (const s of [-1, 1]) T.bulto(color, 0.012, 0.075, 0.1, { y: s * 0.06, z: -0.08, det: 1, rot: [s * 0.5, 0, 0], grano: 0.1 });
  u.tail.add(T.malla()); u.body.add(u.tail);
}

export function armarDelfin() {
  const GRIS = 0x5a6a7a, CLARO = 0xdce1e6;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(GRIS, 0.3, 0.3, 0.86, { y: 0.35, det: 4, brillo: 1, grano: 0.05, forma: huevo(0.16), pinta: contrasombra(CLARO) });
  P.bulto(GRIS, 0.24, 0.24, 0.24, { y: 0.4, z: 0.82, det: 3, brillo: 1, grano: 0.05, pinta: contrasombra(CLARO) });
  P.tubo(GRIS, [[0, 0.31, 0.98], [0, 0.29, 1.2], [0, 0.29, 1.34]], [0.13, 0.08, 0.05], { lados: 7, brillo: 0.9, pinta: (u) => (u.x > 0.8 ? CLARO : null) });
  P.tubo(0x2a3038, [[-0.1, 0.27, 1.06], [0, 0.265, 1.35], [0.1, 0.27, 1.06]], [0.006, 0.008, 0.006], { lados: 3, pasos: 3 }); // la sonrisa
  P.tubo(GRIS, [[0, 0.62, 0.1], [0, 0.82, -0.08], [0, 0.94, -0.26]], [0.16, 0.08, 0.008], { lados: 4, brillo: 0.9, pliegue: (a) => (Math.abs(Math.cos(a)) > 0.7 ? 0.22 : 1) });
  ojitos(P, 0.2, 0.44, 0.92, 0.035);
  body.add(P.malla());
  const fins = [-1, 1].map((s) => { const f = G(), F = new Pieza(); f.position.set(s * 0.27, 0.22, 0.35); F.bulto(GRIS, 0.2, 0.025, 0.1, { x: s * 0.18, z: -0.03, det: 2, brillo: 0.9, rot: [0, s * 0.3, 0] }); f.add(F.malla()); body.add(f); return f; });
  const tail = G(); tail.position.set(0, 0.35, -0.75); body.add(tail);
  const T = new Pieza();
  T.tubo(GRIS, [[0, 0, 0.1], [0, 0, -0.3], [0, 0, -0.5]], [0.15, 0.08, 0.05], { lados: 7, brillo: 0.9 });
  for (const s of [-1, 1]) T.bulto(GRIS, 0.24, 0.025, 0.12, { x: s * 0.2, z: -0.56, det: 2, brillo: 0.9, rot: [0, -s * 0.35, 0] });
  tail.add(T.malla());
  g.userData = { body, tail, fins };
  return g;
}

export function armarBallena() {
  const OSC = 0x262c36, CLARO = 0xc8cdd2, BLANCO = 0xe6e6dc;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // la jorobada: panza con surcos, cabeza con tubérculos, percebes y aletas largas y blancas
  P.bulto(OSC, 1.28, 1.08, 3.1, { y: 1.1, det: 4, grano: 0.1, forma: huevo(0.08), pinta: (u) => (u.y < -0.25 ? (Math.floor(u.x * 11 + 20) % 2 ? 0x8a9096 : CLARO) : null) });
  for (let i = 0; i < 26; i++) { const a = i * 2.399, h = 0.15 + ((i * 37) % 13) / 18, r = Math.sqrt(1 - h * h), z = ((i * 53) % 29) / 14.5 - 1; P.bulto(BLANCO, 0.06, 0.03, 0.06, { x: Math.cos(a) * r * 1.22 * Math.sqrt(Math.max(0.1, 1 - z * z)), y: 1.1 + h * 1.04 * Math.sqrt(Math.max(0.1, 1 - z * z)), z: z * 2.9, det: 0, grano: 0.2 }); } // los percebes
  P.bulto(OSC, 1.05, 0.85, 1.2, { y: 1, z: 3.25, det: 3, grano: 0.1, pinta: (u) => (u.y < -0.25 ? CLARO : null) });
  for (let i = 0; i < 18; i++) { const x = ((i * 37) % 11) / 5.5 - 1, z = 2.9 + ((i * 53) % 13) / 8; const q = 1 - ((x * 0.7) / 1.05) ** 2 - ((z - 3.25) / 1.2) ** 2; if (q > 0.05) P.bulto(0x3e4652, 0.08, 0.06, 0.08, { x: x * 0.7, y: 1 + 0.85 * Math.sqrt(q), z, det: 1 }); } // pegados al perfil de la cabeza
  P.tubo(0x12161c, [[-1, 0.75, 3], [-0.7, 0.68, 4.1], [0, 0.65, 4.42], [0.7, 0.68, 4.1], [1, 0.75, 3]], [0.03, 0.04, 0.04, 0.04, 0.03], { lados: 4 }); // la boca
  P.tubo(OSC, [[0, 2.04, -0.9], [0, 2.32, -1.2], [0, 2.3, -1.5]], [0.3, 0.16, 0.02], { lados: 5 });
  ojitos(P, 1.02, 0.95, 3.5, 0.13);
  body.add(P.malla());
  const fins = [-1, 1].map((s) => { const f = G(), F = new Pieza(); f.position.set(s * 0.8, 0.6, 2.2); F.bulto(BLANCO, 1.7, 0.09, 0.38, { x: s * 1.6, z: -0.14, det: 3, grano: 0.14, rot: [0, s * 0.18, 0], pinta: (u) => (u.z < -0.6 && Math.sin(u.x * 18) > 0.4 ? CLARO : null) }); f.add(F.malla()); body.add(f); return f; });
  const tail = G(); tail.position.set(0, 1.1, -2.75); body.add(tail);
  const T = new Pieza();
  T.tubo(OSC, [[0, 0, 0.3], [0, 0, -1.1], [0, 0, -2.1]], [0.8, 0.5, 0.26], { lados: 9, grano: 0.1 });
  for (const s of [-1, 1]) T.bulto(OSC, 1, 0.1, 0.56, { x: s * 0.92, z: -2.4, det: 3, grano: 0.1, rot: [0, -s * 0.28, 0], pinta: (u) => (u.y < 0 ? BLANCO : null) });
  tail.add(T.malla());
  g.userData = { body, tail, fins };
  return g;
}

export function armarTiburon() {
  const GRIS = 0x5a646a, CLARO = 0xe1e4e6;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(GRIS, 0.29, 0.3, 1.06, { y: 0.35, det: 4, grano: 0.06, brillo: 0.7, forma: huevo(0.2), pinta: contrasombra(CLARO) });
  // la cabeza de martillo
  P.bulto(GRIS, 0.72, 0.08, 0.2, { y: 0.42, z: 1.12, det: 3, grano: 0.06, brillo: 0.7, forma: (v) => { v.z -= Math.abs(v.x) * 0.5; }, pinta: contrasombra(CLARO, -0.05) });
  for (const s of [-1, 1]) { P.bulto(0xd8c040, 0.05, 0.05, 0.05, { x: s * 0.7, y: 0.44, z: 0.98, det: 1, brillo: 1.4, amb: 0.95 }); P.bulto(0x0a0a0a, 0.03, 0.04, 0.03, { x: s * 0.73, y: 0.44, z: 0.98, det: 1, amb: 0.9 }); }
  P.tubo(0x2a2228, [[-0.12, 0.34, 1], [0, 0.32, 1.06], [0.12, 0.34, 1]], [0.01, 0.014, 0.01], { lados: 3, pasos: 2 });
  P.tubo(GRIS, [[0, 0.62, 0.3], [0, 0.92, 0.02], [0, 1.16, -0.16]], [0.22, 0.1, 0.008], { lados: 4, brillo: 0.7, pliegue: (a) => (Math.abs(Math.cos(a)) > 0.7 ? 0.18 : 1) });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) P.tubo(0x3a4248, [[s * 0.285, 0.46 - i * 0.015, 0.68 - i * 0.07], [s * 0.285, 0.3 - i * 0.015, 0.7 - i * 0.07]], [0.008, 0.008], { lados: 3, pasos: 1 }); // las agallas
  body.add(P.malla());
  const fins = [-1, 1].map((s) => { const f = G(), F = new Pieza(); f.position.set(s * 0.27, 0.2, 0.4); F.bulto(GRIS, 0.28, 0.025, 0.14, { x: s * 0.26, z: -0.08, det: 2, brillo: 0.7, rot: [0, s * 0.4, 0] }); f.add(F.malla()); body.add(f); return f; });
  const tail = G(); tail.position.set(0, 0.38, -0.95); body.add(tail);
  const T = new Pieza();
  T.tubo(GRIS, [[0, 0, 0.14], [0, 0, -0.34], [0, 0.03, -0.56]], [0.15, 0.08, 0.05], { lados: 7, brillo: 0.7 });
  T.bulto(GRIS, 0.03, 0.44, 0.14, { y: 0.26, z: -0.68, det: 2, rot: [-0.45, 0, 0], brillo: 0.7 });
  T.bulto(GRIS, 0.03, 0.2, 0.1, { y: -0.14, z: -0.6, det: 1, rot: [0.45, 0, 0], brillo: 0.7 });
  tail.add(T.malla());
  g.userData = { body, tail, fins };
  return g;
}

export function armarManati() {
  const GR = 0x7a7e82, CLARO = 0x9a9ea2;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(GR, 0.42, 0.34, 0.76, { y: 0.35, det: 4, grano: 0.2, forma: huevo(0.08), pinta: contrasombra(CLARO, -0.4) });
  body.add(P.malla());
  const C = new Pieza();
  C.bulto(GR, 0.27, 0.22, 0.22, { det: 3, grano: 0.2 });
  // el hocico carnoso con sus bigotes
  C.bulto(CLARO, 0.21, 0.13, 0.1, { y: -0.07, z: 0.2, det: 2, grano: 0.2 });
  for (const s of [-1, 1]) { C.bulto(0x3a3e42, 0.02, 0.016, 0.01, { x: s * 0.06, y: -0.01, z: 0.285, det: 0 }); for (let k = 0; k < 4; k++) C.tubo(0xd8d8d0, [[s * (0.05 + k * 0.03), -0.11, 0.28], [s * (0.07 + k * 0.04), -0.17, 0.3]], [0.004, 0.001], { lados: 3, pasos: 1 }); }
  ojitos(C, 0.2, 0.08, 0.15, 0.02);
  const head = C.malla(); head.position.set(0, 0.33, 0.8); body.add(head);
  const tail = G(); tail.position.set(0, 0.35, -0.65); body.add(tail);
  const T = new Pieza();
  // la cola de paleta redonda
  T.tubo(GR, [[0, 0, 0.1], [0, 0, -0.14]], [0.26, 0.18], { lados: 8, pasos: 1, grano: 0.2 });
  T.bulto(GR, 0.4, 0.05, 0.3, { z: -0.34, det: 3, grano: 0.2 });
  tail.add(T.malla());
  const fins = [-1, 1].map((s) => { const f = G(), F = new Pieza(); f.position.set(s * 0.38, 0.22, 0.4); F.bulto(GR, 0.17, 0.03, 0.1, { x: s * 0.15, det: 2, grano: 0.2 }); f.add(F.malla()); body.add(f); return f; });
  g.userData = { body, head, legs: [], tail, fins };
  return g;
}

export function armarBaula() {
  const NE = 0x2a2f36, CLARO = 0x565e68;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // la concha de cuero con sus siete quillas a lo largo
  P.bulto(NE, 0.5, 0.25, 0.8, { y: 0.16, det: 4, brillo: 0.5, grano: 0.1, forma: (v) => { v.x *= 1 + v.z * 0.18; if (v.y < 0) v.y *= 0.45; }, pinta: (u) => { if (u.y < -0.1) return 0xb8b4ac; return Math.abs(Math.sin(u.x * 11)) < 0.2 ? CLARO : Math.sin(u.x * 27) * Math.sin(u.z * 27) > 0.82 ? 0xd8d8d0 : null; } });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.18, 0.75); body.add(head);
  const C = new Pieza();
  C.tubo(NE, [[0, -0.02, -0.08], [0, 0, 0.1]], [0.16, 0.14], { lados: 8, pasos: 1, grano: 0.14 });
  C.bulto(NE, 0.17, 0.14, 0.17, { z: 0.16, det: 2, grano: 0.14, pinta: (u) => (u.y > 0.5 && Math.abs(u.x) < 0.3 ? 0xd88a9a : null) });
  ojitos(C, 0.13, 0.05, 0.24, 0.026);
  head.add(C.malla());
  const fins = [[-0.36, 0.45, 0.9], [0.36, 0.45, 0.9], [-0.26, -0.6, 0.45], [0.26, -0.6, 0.45]].map(([x, z, L]) => { const s = Math.sign(x), f = G(), F = new Pieza(); f.position.set(x, 0.13, z); F.bulto(NE, L * 0.55, 0.03, 0.16, { x: s * L * 0.5, z: -0.08, det: 2, grano: 0.1, rot: [0, s * 0.3, 0], pinta: (u) => (Math.sin(u.x * 13) > 0.7 ? CLARO : null) }); f.add(F.malla()); body.add(f); return f; });
  g.userData = { body, head, legs: [], fins };
  return g;
}

export function armarRaya() {
  const ARENA = 0xb8a878, MANCHA = 0x8a7a50;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(ARENA, 0.42, 0.045, 0.34, { det: 3, grano: 0.2, forma: (v) => { v.x *= 1 - Math.abs(v.z) * 0.55; }, pinta: (u) => (u.y < 0 ? 0xf0ecd8 : Math.sin(u.x * 15) * Math.sin(u.z * 15) > 0.5 ? MANCHA : null) });
  for (const s of [-1, 1]) P.bulto(0x4a3e28, 0.016, 0.016, 0.016, { x: s * 0.05, y: 0.04, z: 0.12, det: 0, brillo: 1.4 });
  const cuerpo = P.malla(); cuerpo.position.y = 0.04; body.add(cuerpo);
  const cola = G(); cola.position.set(0, 0.04, -0.3); body.add(cola);
  const T = new Pieza();
  T.tubo(MANCHA, [[0, 0, 0.04], [0, 0, -0.24], [0, 0.03, -0.46]], [0.024, 0.014, 0.004], { lados: 4 });
  T.tubo(0x2a2418, [[0, 0.02, -0.14], [0, 0.05, -0.24]], [0.008, 0.002], { lados: 3, pasos: 1 }); // el aguijón
  cola.add(T.malla());
  g.userData = { body, legs: [], cola, cuerpo };
  return g;
}

export function armarMarinero(capitan) {
  const ROPA = 0x4a6a5e, RAYA = 0xd8e8e0, PIEL = 0xb8e8c8;
  const g = G(), body = G(); g.add(body);
  body.scale.setScalar(capitan ? 1.25 : 1);
  const P = new Pieza();
  // de las rodillas para abajo ya no hay nada: es neblina
  P.bulto(ROPA, 0.26, 0.33, 0.15, { y: 1, det: 3, grano: 0.14, pinta: (u) => (!capitan && Math.floor(u.y * 5 + 9) % 2 ? RAYA : null) });
  P.tubo(ROPA, [[0, 0.8, 0], [0, 0.5, 0], [0, 0.18, 0]], [0.22, 0.25, 0.28], { lados: 10, pasos: 2, grano: 0.14, pliegue: (a, t) => 1 + Math.sin(a * 6) * 0.08 * t });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = 0.25; P.tubo(i % 2 ? ROPA : 0x3a5a50, [[Math.cos(a) * r, 0.2, Math.sin(a) * r], [Math.cos(a) * (r + 0.05), -0.04 - (i % 3) * 0.05, Math.sin(a) * (r + 0.05)]], [0.08, 0.005], { lados: 4, pasos: 1 }); }
  if (capitan) for (let i = 0; i < 6; i++) P.bulto(0xc8b060, 0.018, 0.018, 0.012, { x: i % 2 ? 0.08 : -0.08, y: 1.2 - Math.floor(i / 2) * 0.16, z: 0.15, det: 0, brillo: 1.2 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.32, 0); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.2, 0.21, 0.2, { y: 0.2, det: 3, grano: 0.14 });
  C.tubo(0x2a4a3a, [[-0.1, 0.1, 0.18], [0, 0.085, 0.2], [0.1, 0.1, 0.18]], [0.012, 0.018, 0.012], { lados: 4, pasos: 2 });
  for (const s of [-1, 1]) C.bulto(0x10251a, 0.045, 0.04, 0.012, { x: s * 0.085, y: 0.24, z: 0.185, det: 1 });
  if (capitan) {
    // el tricornio, el parche y la barba
    C.bulto(0x141a16, 0.32, 0.05, 0.3, { y: 0.42, det: 2, forma: (v) => { const a = Math.atan2(v.z, v.x); v.y += Math.cos(a * 3) * 0.9; } });
    C.bulto(0x141a16, 0.2, 0.13, 0.2, { y: 0.52, det: 2 });
    C.bulto(0x101010, 0.06, 0.05, 0.014, { x: -0.085, y: 0.24, z: 0.195, det: 1 });
    C.tubo(0x101010, [[-0.2, 0.34, 0.06], [-0.09, 0.3, 0.19], [0.18, 0.2, 0.15]], [0.008, 0.008, 0.008], { lados: 3 });
    for (let i = 0; i < 9; i++) { const x = -0.14 + i * 0.035; C.tubo(0x6a7a70, [[x, 0.1, 0.18 - Math.abs(x) * 0.3], [x * 0.7, -0.14 - (i % 3) * 0.05, 0.2]], [0.03, 0.004], { lados: 3, pasos: 1 }); }
  } else C.bulto(0x8a2a2a, 0.22, 0.09, 0.22, { y: 0.38, det: 2, grano: 0.2, forma: (v) => { if (v.y < 0) v.y = 0; } });
  head.add(C.malla());
  const brazos = [-1, 1].map((s) => pata(body, s * 0.32, 1.25, 0, [[0, 0.03, 0], [0, -0.28, 0], [0, -0.56, 0.01]], [0.075, 0.07, 0.06], ROPA, (Q, f) => Q.bulto(PIEL, 0.05, 0.05, 0.05, { x: f[0], y: f[1] - 0.03, z: f[2], det: 1 })));
  // el machete oxidado
  const M = new Pieza();
  M.bulto(0x7a8a80, 0.03, 0.012, 0.3, { y: -0.58, z: 0.34, det: 1, grano: 0.4, pinta: (u) => (Math.sin(u.z * 14) > 0.5 ? 0x7a4a30 : null) });
  brazos[1].add(M.malla());
  if (capitan) {
    // el farol verde
    const F = new Pieza();
    for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) F.tubo(0x2a3a30, [[x, -0.5, 0.1 + z], [x, -0.74, 0.1 + z]], [0.012, 0.012], { lados: 3, pasos: 1 });
    brazos[0].add(F.malla(), brasa(0x7aff9a, 0.08, 0, -0.62, 0.1, 1.2));
  }
  g.traverse((o) => { if (o.isMesh) { o.material.transparent = true; o.material.opacity = 0.75; } }); // escriben profundidad: si no, el agua los tapa y se ven por dentro
  g.userData = { body, head, brazos };
  return g;
}

export function armarMartilla() {
  const ORO = 0xc88a3a, OSC = 0xa86a26;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(ORO, 0.15, 0.14, 0.24, { y: 0.3, det: 3, grano: 0.24 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.38, 0.24); body.add(head);
  const C = new Pieza();
  C.bulto(ORO, 0.115, 0.105, 0.105, { y: 0.02, z: 0.06, det: 2, grano: 0.2 });
  C.bulto(0x3a2410, 0.026, 0.02, 0.014, { y: -0.02, z: 0.168, det: 0 });
  // los ojos enormes de animal de noche
  for (const s of [-1, 1]) { C.bulto(0x101010, 0.045, 0.045, 0.025, { x: s * 0.055, y: 0.05, z: 0.145, det: 2, brillo: 1.6, amb: 0.9 }); C.bulto(OSC, 0.035, 0.03, 0.014, { x: s * 0.09, y: 0.12, z: 0.02, det: 1 }); }
  head.add(C.malla());
  const legs = [[-0.1, 0.16], [0.1, 0.16], [0.1, -0.16], [-0.1, -0.16]].map(([x, z]) => pata(body, x, 0.2, z, [[0, 0.03, 0], [0, -0.08, 0], [0, -0.19, 0.01]], [0.05, 0.034, 0.03], ORO));
  // la cola prensil enroscada
  const cola = G(); cola.position.set(0, 0.3, -0.23); body.add(cola);
  const T = new Pieza();
  T.tubo(ORO, [[0, 0, 0], [0, 0, -0.3], [0, -0.04, -0.5], [0.05, -0.14, -0.54], [0.08, -0.14, -0.44]], [0.04, 0.034, 0.028, 0.022, 0.012], { lados: 5, grano: 0.24 });
  cola.add(T.malla());
  g.userData = { body, head, cola, legs };
  return g;
}

export function armarPava() {
  const NEGRO = 0x26262c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(NEGRO, 0.17, 0.18, 0.27, { y: 0.47, det: 3, brillo: 0.7, grano: 0.14, forma: huevo(-0.1), pinta: (u) => (u.z > 0.2 && u.y > -0.5 && Math.sin(u.x * 19) * Math.sin(u.y * 19) > 0.5 ? 0xd8d8d8 : null) });
  for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.05; P.bulto(NEGRO, 0.05, 0.02, 0.28, { x, y: 0.44, z: -0.46, det: 1, rot: [0.1, x * 0.8, 0], brillo: 0.7 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.66, 0.22); body.add(head);
  const C = new Pieza();
  C.tubo(NEGRO, [[0, -0.06, -0.02], [0, 0.04, 0.02], [0, 0.1, 0.04]], [0.08, 0.06, 0.06], { lados: 6, brillo: 0.5 });
  C.bulto(NEGRO, 0.07, 0.07, 0.08, { y: 0.14, z: 0.05, det: 2, brillo: 0.7 });
  C.tubo(0x2a2a2a, [[0, 0.14, 0.12], [0, 0.12, 0.19]], [0.03, 0.008], { lados: 5, pasos: 1, brillo: 0.8 });
  C.bulto(0xd01818, 0.03, 0.07, 0.03, { y: 0.03, z: 0.1, det: 2, brillo: 0.6 }); // la papada roja
  for (let i = 0; i < 4; i++) { const z = 0.08 - i * 0.03; C.tubo(NEGRO, [[0, 0.2, z], [0, 0.28 - Math.abs(i - 2) * 0.012, z - 0.02]], [0.012, 0.002], { lados: 3, pasos: 1 }); }
  for (const s of [-1, 1]) C.bulto(0xd02020, 0.016, 0.016, 0.012, { x: s * 0.06, y: 0.16, z: 0.09, det: 0, brillo: 1.4, amb: 1 });
  head.add(C.malla());
  const legs = [-1, 1].map((s) => pata(body, s * 0.08, 0.32, 0, [[0, 0.02, 0], [0, -0.14, -0.01], [0, -0.3, 0.01]], [0.03, 0.02, 0.018], 0xd04040, (Q, f) => { for (const a of [-0.5, 0, 0.5, Math.PI]) Q.tubo(0xd04040, [[f[0], f[1], f[2]], [f[0] + Math.sin(a) * 0.09, f[1] - 0.005, f[2] + Math.cos(a) * 0.09]], [0.013, 0.004], { lados: 3, pasos: 1 }); }));
  g.userData = { body, head, legs };
  return g;
}

export function armarChompipe() {
  const NEGRO = 0x2a2a30, PIEL = 0xc8b8b0, ROJO = 0xd01818;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(NEGRO, 0.24, 0.23, 0.32, { y: 0.48, det: 3, brillo: 0.9, grano: 0.2, pinta: (u) => (u.y > 0.2 && Math.sin(u.z * 12) > 0.3 ? 0x3a6a5a : null) });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.72, 0.28); body.add(head);
  const C = new Pieza();
  C.tubo(PIEL, [[0, -0.1, -0.04], [0, 0.1, 0.02], [0, 0.27, 0.06]], [0.08, 0.06, 0.06], { lados: 6, grano: 0.24 });
  C.bulto(PIEL, 0.08, 0.07, 0.09, { y: 0.3, z: 0.08, det: 2, grano: 0.2 });
  C.tubo(0xd8a040, [[0, 0.29, 0.16], [0, 0.27, 0.23]], [0.032, 0.008], { lados: 5, pasos: 1, brillo: 0.6 });
  // las carúnculas del cuello
  for (let i = 0; i < 7; i++) C.bulto(ROJO, 0.028, 0.03, 0.028, { x: (i % 2 ? 0.03 : -0.03), y: 0.2 - i * 0.04, z: 0.09 - i * 0.012, det: 1, grano: 0.2 });
  for (const s of [-1, 1]) C.bulto(0x101010, 0.012, 0.012, 0.01, { x: s * 0.07, y: 0.32, z: 0.11, det: 0, brillo: 1.4 });
  head.add(C.malla());
  // el moco que cuelga
  const Mo = new Pieza();
  Mo.tubo(ROJO, [[0, 0, 0], [0, -0.07, 0.01], [0, -0.14, 0]], [0.024, 0.02, 0.012], { lados: 5, pasos: 2 });
  const moco = Mo.malla(); moco.position.set(0.02, 0.32, 0.19); head.add(moco);
  // la cola: plumas en abanico que se abren cuando se pone bravo
  const cola = G(); cola.position.set(0, 0.6, -0.3); body.add(cola);
  const plumas = [];
  for (let i = 0; i < 9; i++) { const p = G(), F = new Pieza(); F.bulto(i % 2 ? 0x2a2622 : 0x3a322a, 0.06, 0.3, 0.018, { y: 0.28, det: 2, grano: 0.14, pinta: (u) => (u.y > 0.78 ? 0xd8d0c0 : u.y > 0.55 ? 0x1a1612 : null) }); p.add(F.malla()); cola.add(p); plumas.push(p); }
  const patas = [-1, 1].map((s) => pata(body, s * 0.12, 0.3, 0, [[0, 0.02, 0], [0, -0.13, -0.01], [0, -0.28, 0.01]], [0.036, 0.024, 0.022], 0xc89060, (Q, f) => { for (const a of [-0.5, 0, 0.5, Math.PI]) Q.tubo(0xc89060, [[f[0], f[1], f[2]], [f[0] + Math.sin(a) * 0.1, f[1] - 0.005, f[2] + Math.cos(a) * 0.1]], [0.015, 0.004], { lados: 3, pasos: 1 }); }));
  g.userData = { body, head, cola, plumas, moco, legs: patas };
  return g;
}
