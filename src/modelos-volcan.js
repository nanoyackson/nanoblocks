// Las criaturas del volcán y la Arpía (v10.0), con el kit low-poly: ceniciento, zopilote de fuego, Señor del Arenal y Arpía de la Tormenta.
// Lo de fuego va en una malla aparte marcada glow: las grietas de brasa alumbran aunque todo alrededor esté oscuro.
import * as THREE from 'three';
import { Pieza, huevo } from './lowpoly.js';
import { pata, brasa } from './modelos-bravos.js';

const G = () => new THREE.Group();
// vetas de brasa sobre un elipsoide: zigzags cortos pegados a la superficie
function vetas(F, n, rx, ry, rz, cy = 0, cz = 0, color = 0xff8a20) {
  for (let i = 0; i < n; i++) {
    const a = i * 2.399, h = -0.8 + ((i * 37) % 17) / 10, r = Math.sqrt(Math.max(0.05, 1 - h * h));
    const p = (da, dh) => { const hh = Math.max(-0.95, Math.min(0.95, h + dh)), rr = Math.sqrt(1 - hh * hh); return [Math.cos(a + da) * rr * rx * 1.02, cy + hh * ry * 1.02, cz + Math.sin(a + da) * rr * rz * 1.02]; };
    F.tubo(i % 3 ? color : 0xffc040, [p(0, 0), p(0.14 / Math.max(r, 0.3), 0.14), p(-0.04, 0.3)], [0.018, 0.024, 0.006], { lados: 3, pasos: 1, amb: 1.1, grano: 0 });
  }
}
function brilloEn(padre, F) { const m = F.malla(); m.userData.glow = true; padre.add(m); }

export function armarCeniciento() {
  const ASH = 0x3a3633, OSC = 0x24211f;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza(), F = new Pieza();
  P.bulto(ASH, 0.32, 0.42, 0.21, { y: 1.1, det: 3, grano: 0.4 });
  vetas(F, 16, 0.32, 0.42, 0.21, 1.1);
  body.add(P.malla()); brilloEn(body, F);
  const head = G(); head.position.set(0, 1.5, 0); body.add(head);
  const C = new Pieza(), Fc = new Pieza();
  C.bulto(ASH, 0.26, 0.26, 0.26, { y: 0.25, det: 3, grano: 0.4, pinta: (u) => (u.z > 0.5 && u.y < -0.25 ? OSC : null) });
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; C.tubo(OSC, [[Math.cos(a) * 0.17, 0.44, Math.sin(a) * 0.17], [Math.cos(a) * 0.22, 0.62 + (i % 2) * 0.08, Math.sin(a) * 0.22]], [0.06, 0.006], { lados: 4, pasos: 1, grano: 0.3 }); }
  vetas(Fc, 7, 0.26, 0.26, 0.26, 0.25);
  Fc.bulto(0xff5010, 0.1, 0.022, 0.015, { y: 0.14, z: 0.255, det: 1, amb: 1.1 }); // la boca de brasa
  head.add(C.malla()); brilloEn(head, Fc);
  for (const s of [-1, 1]) head.add(brasa(0xff7a10, 0.05, s * 0.11, 0.28, 0.245, 0.7));
  const legs = [-0.15, 0.15].map((x) => { const l = pata(body, x, 0.72, 0, [[0, 0.04, 0], [0, -0.32, 0.02], [0, -0.7, 0]], [0.15, 0.12, 0.12], ASH, (Q, f) => Q.bulto(OSC, 0.13, 0.06, 0.17, { x: f[0], y: f[1] + 0.03, z: f[2] + 0.04, det: 1, grano: 0.3 }), { grano: 0.4, lados: 7 }); const Fl = new Pieza(); Fl.tubo(0xff8a20, [[0.12, -0.1, 0.06], [0.11, -0.28, 0.08], [0.1, -0.44, 0.05]], [0.018, 0.024, 0.006], { lados: 3, pasos: 1, amb: 1.1, grano: 0 }); brilloEn(l, Fl); return l; });
  const arms = [-0.42, 0.42].map((x) => { const s = Math.sign(x); const a = pata(body, x, 1.45, 0, [[0, 0.04, 0], [s * 0.02, -0.34, 0], [0, -0.74, 0.02]], [0.14, 0.12, 0.13], ASH, (Q, f) => { Q.bulto(OSC, 0.13, 0.12, 0.13, { x: f[0], y: f[1] - 0.04, z: f[2], det: 1, grano: 0.3 }); }, { grano: 0.4, lados: 7 }); const Fa = new Pieza(); Fa.tubo(0xff8a20, [[s * 0.12, -0.14, 0.06], [s * 0.1, -0.34, 0.08], [s * 0.11, -0.52, 0.05]], [0.018, 0.024, 0.006], { lados: 3, pasos: 1, amb: 1.1, grano: 0 }); brilloEn(a, Fa); return a; });
  g.userData = { body, head, legs, arms };
  return g;
}

export function armarZopiloteFuego() {
  const NEGRO = 0x201c1a;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(NEGRO, 0.2, 0.18, 0.37, { y: 0.3, det: 3, grano: 0.2, forma: huevo(-0.1) });
  for (let i = 0; i < 7; i++) { const x = (i - 3) * 0.05; P.bulto(NEGRO, 0.04, 0.012, 0.18, { x, y: 0.31, z: -0.48, det: 1, rot: [0, x * 0.8, 0], grano: 0.2 }); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; P.tubo(0x4a4440, [[Math.cos(a) * 0.09, 0.4 + Math.sin(a) * 0.09, 0.32], [Math.cos(a) * 0.18, 0.38 + Math.sin(a) * 0.17, 0.28]], [0.05, 0.006], { lados: 3, pasos: 1 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.45, 0.4); body.add(head);
  const C = new Pieza();
  C.bulto(0xe04a2a, 0.1, 0.1, 0.13, { z: 0.08, det: 2, grano: 0.2 });
  C.tubo(0xe8d8b0, [[0, 0.01, 0.18], [0, 0.0, 0.28], [0, -0.07, 0.31]], [0.05, 0.04, 0.006], { lados: 5, brillo: 0.8 });
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0xffb040, 0.022, s * 0.08, 0.04, 0.13));
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(), F = new Pieza(); p.position.set(side * 0.2, 0.42, 0);
    W.tubo(NEGRO, [[0, 0, 0.1], [side * 0.45, 0.02, 0.1], [side * 0.9, 0, 0.06]], [0.06, 0.05, 0.02], { lados: 5 });
    for (let k = 0; k < 8; k++) { const t = k / 7, L = 0.24 - t * 0.04; W.bulto(NEGRO, 0.06, 0.012, L, { x: side * (0.06 + k * 0.118), z: -L * 0.65, det: 1, rot: [0, side * t * 0.2, 0], grano: 0.2 }); F.tubo(k % 2 ? 0xff7a14 : 0xffb030, [[side * (0.06 + k * 0.118), 0.002, -L * 1.2], [side * (0.06 + k * 0.118 + t * 0.03), 0.002, -L * 1.7]], [0.026, 0.003], { lados: 3, pasos: 1, amb: 1.1, grano: 0 }); }
    p.add(W.malla()); brilloEn(p, F); body.add(p); return { p, side };
  });
  g.userData = { body, head, wings, tail: null };
  return g;
}

export function armarSenorArenal() {
  const ROCA = 0x2e2a28, OSC = 0x1a1817;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza(), F = new Pieza();
  // un gigante de basalto, de hombros enormes, con el magma corriéndole por dentro
  P.bulto(ROCA, 0.72, 0.8, 0.5, { y: 2, det: 4, grano: 0.5 });
  P.bulto(ROCA, 0.52, 0.34, 0.42, { y: 1.15, det: 3, grano: 0.5 });
  for (const s of [-1, 1]) P.bulto(OSC, 0.34, 0.3, 0.36, { x: s * 0.78, y: 2.62, det: 2, grano: 0.5 });
  // los picos de los hombros
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const a = i * 1.1 - 1.6; P.tubo(OSC, [[s * 0.78 + Math.sin(a) * 0.16, 2.78, Math.cos(a) * 0.16], [s * (0.86 + i * 0.04) + Math.sin(a) * 0.28, 3.12 + (i % 2) * 0.12, Math.cos(a) * 0.28]], [0.1, 0.008], { lados: 4, pasos: 1, grano: 0.3 }); }
  vetas(F, 30, 0.72, 0.8, 0.5, 2, 0, 0xff7a10);
  vetas(F, 10, 0.52, 0.34, 0.42, 1.15, 0, 0xff7a10);
  // el corazón de lava en el pecho
  F.bulto(0xffa020, 0.22, 0.24, 0.06, { y: 2.14, z: 0.47, det: 2, amb: 1.15, grano: 0.3, pinta: (u) => (Math.hypot(u.x, u.y) < 0.5 ? 0xffe070 : null) });
  body.add(P.malla()); brilloEn(body, F);
  const head = G(); head.position.set(0, 2.7, 0.05); body.add(head);
  const C = new Pieza(), Fc = new Pieza();
  C.bulto(ROCA, 0.42, 0.4, 0.38, { y: 0.35, det: 3, grano: 0.5, pinta: (u) => (u.y > 0.15 && u.y < 0.48 && u.z > 0.5 ? OSC : null) });
  // la corona de picos de basalto
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, h = 0.4 + (i % 2) * 0.22; C.tubo(OSC, [[Math.cos(a) * 0.28, 0.58, Math.sin(a) * 0.26], [Math.cos(a) * 0.36, 0.72 + h, Math.sin(a) * 0.34]], [0.1, 0.008], { lados: 5, pasos: 1, grano: 0.3 }); }
  Fc.bulto(0xff5010, 0.24, 0.05, 0.02, { y: 0.17, z: 0.37, det: 1, amb: 1.15 });
  for (let i = -3; i <= 3; i++) C.tubo(OSC, [[i * 0.07, 0.24, 0.385], [i * 0.07, 0.15, 0.4]], [0.03, 0.005], { lados: 3, pasos: 1 });
  vetas(Fc, 8, 0.42, 0.4, 0.38, 0.35, 0, 0xff7a10);
  head.add(C.malla()); brilloEn(head, Fc);
  for (const s of [-1, 1]) head.add(brasa(0xffd040, 0.1, s * 0.17, 0.42, 0.34, 0.6));
  const legs = [-0.32, 0.32].map((x) => { const l = pata(body, x, 0.98, 0, [[0, 0.04, 0], [0, -0.42, 0.04], [0, -0.96, 0]], [0.3, 0.25, 0.28], ROCA, (Q, f) => Q.bulto(OSC, 0.3, 0.12, 0.38, { x: f[0], y: f[1] + 0.06, z: f[2] + 0.08, det: 2, grano: 0.5 }), { grano: 0.5, lados: 8 }); const Fl = new Pieza(); for (const d of [-1, 1]) Fl.tubo(0xff7a10, [[d * 0.22, -0.2, 0.18], [d * 0.2, -0.44, 0.2], [d * 0.24, -0.68, 0.16]], [0.024, 0.032, 0.008], { lados: 3, pasos: 1, amb: 1.1, grano: 0 }); brilloEn(l, Fl); return l; });
  const arms = [-0.88, 0.88].map((x) => { const s = Math.sign(x); const a = pata(body, x, 2.55, 0, [[0, 0.04, 0], [s * 0.06, -0.66, 0.02], [0, -1.36, 0.04]], [0.26, 0.24, 0.27], ROCA, (Q, f) => { Q.bulto(OSC, 0.38, 0.32, 0.38, { x: f[0], y: f[1] - 0.15, z: f[2], det: 3, grano: 0.5 }); for (let i = -1; i <= 1; i++) Q.tubo(OSC, [[f[0] + i * 0.18, f[1] - 0.04, f[2] + 0.28], [f[0] + i * 0.2, f[1] - 0.04, f[2] + 0.48]], [0.08, 0.006], { lados: 4, pasos: 1 }); }, { grano: 0.5, lados: 8 }); const Fa = new Pieza(); for (const d of [-1, 1]) Fa.tubo(0xff7a10, [[s * 0.2 * d, -0.3, 0.2], [s * 0.22 * d, -0.66, 0.2], [s * 0.2 * d, -1, 0.21]], [0.024, 0.032, 0.008], { lados: 3, pasos: 1, amb: 1.1, grano: 0 }); brilloEn(a, Fa); return a; });
  g.userData = { body, head, legs, arms };
  return g;
}

export function armarArpia() {
  const GRIS = 0x8a909c, NEGRO = 0x24262c, BLANCO = 0xecece6, ALA = 0x4a4e5c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // pecho blanco con la banda negra, espalda gris pizarra
  P.bulto(NEGRO, 0.33, 0.48, 0.3, { y: 0.85, det: 4, grano: 0.14, forma: huevo(0), pinta: (u) => (u.z > 0.15 ? (u.y > 0.32 && u.y < 0.58 ? NEGRO : BLANCO) : Math.sin(u.y * 15) > 0.5 ? ALA : null) });
  // la cola de plumas barradas
  for (let i = 0; i < 7; i++) { const t = i / 6 - 0.5; P.bulto(i % 2 ? NEGRO : ALA, 0.07, 0.02, 0.36, { x: t * 0.42, y: 0.5, z: -0.56, det: 1, rot: [0.1, t * 0.5, 0], grano: 0.14, pinta: (u) => (Math.sin(u.z * 12) > 0.3 ? GRIS : null) }); }
  // las patas amarillas con garras enormes
  for (const x of [-0.15, 0.15]) {
    P.tubo(0xe8c040, [[x, 0.52, 0.06], [x, 0.3, 0.08], [x, 0.1, 0.08]], [0.1, 0.06, 0.06], { lados: 6, brillo: 0.5, pinta: (u) => (u.x < 0.35 ? BLANCO : null) });
    for (const a of [-0.65, 0, 0.65, Math.PI]) P.tubo(0x18181c, [[x, 0.1, 0.08], [x + Math.sin(a) * 0.14, 0.08, 0.08 + Math.cos(a) * 0.14], [x + Math.sin(a) * 0.24, -0.02, 0.08 + Math.cos(a) * 0.24]], [0.05, 0.04, 0.004], { lados: 4, pasos: 2, brillo: 1 });
  }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.4, 0.12); body.add(head);
  const C = new Pieza();
  C.bulto(GRIS, 0.22, 0.21, 0.22, { y: 0.2, det: 3, grano: 0.2 });
  // el disco de plumas de la cara y el pico ganchudo
  C.bulto(0xb0b4bc, 0.17, 0.16, 0.05, { y: 0.2, z: 0.19, det: 2, grano: 0.2 });
  C.tubo(0x1c1c20, [[0, 0.2, 0.2], [0, 0.2, 0.32], [0, 0.11, 0.41], [0, 0.02, 0.39]], [0.08, 0.07, 0.04, 0.005], { lados: 6, pasos: 3, brillo: 1 });
  C.tubo(0x18181c, [[-0.17, 0.33, 0.2], [-0.06, 0.28, 0.24]], [0.024, 0.02], { lados: 3, pasos: 1 }); // el ceño
  C.tubo(0x18181c, [[0.17, 0.33, 0.2], [0.06, 0.28, 0.24]], [0.024, 0.02], { lados: 3, pasos: 1 });
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0xbfe8ff, 0.036, s * 0.1, 0.24, 0.225, 0.8));
  // el copete doble que se levanta cuando ataca
  const crest = [-1, 1].map((s) => {
    const c = G(), Q = new Pieza(); c.position.set(s * 0.1, 0.38, -0.08);
    for (let k = 0; k < 4; k++) Q.tubo(NEGRO, [[(k - 1.5) * 0.02, 0, -k * 0.015], [(k - 1.5) * 0.04 + s * 0.04, 0.2 + k * 0.03, -0.05 - k * 0.02], [(k - 1.5) * 0.05 + s * 0.08, 0.36 + k * 0.03, -0.14 - k * 0.02]], [0.045, 0.035, 0.005], { lados: 4, grano: 0.14 });
    c.add(Q.malla()); head.add(c); return c;
  });
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.3, 1.15, 0);
    W.tubo(ALA, [[0, 0, 0.2], [side * 0.8, 0.04, 0.24], [side * 1.6, 0, 0.14]], [0.14, 0.1, 0.04], { lados: 7, brillo: 0.4 });
    for (let k = 0; k < 12; k++) { const t = k / 11, L = 0.48 + Math.sin(t * Math.PI) * 0.18; W.bulto(k % 2 ? ALA : 0x383c48, 0.08, 0.02, L, { x: side * (0.1 + k * 0.145), z: -L * 0.62, det: 1, rot: [0, side * t * 0.22, 0], grano: 0.14, brillo: 0.5, pinta: (u) => (Math.sin(u.z * 13) > 0.4 ? GRIS : null) }); }
    p.add(W.malla()); body.add(p); return { p, side };
  });
  g.userData = { body, head, wings, tail: null, crest };
  return g;
}
