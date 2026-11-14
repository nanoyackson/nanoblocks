// Más gente y animales del monte (v9.1), con el kit low-poly: saíno, cuche, Mico Malo, bécquer, Chatas, jaguar y cocodrilo.
import * as THREE from 'three';
import { Pieza, huevo } from './lowpoly.js';
import { pata, brasa } from './modelos-bravos.js';
import { makeMacheteMesh } from './models.js';
import { torsoHumano, brazoHumano, piernaHumana, articular } from './anatomia.js';

const G = () => new THREE.Group();
// las rosetas del jaguar: celdas con un punto corrido al azar; se pinta el anillo y queda el centro claro
function rosetas(u, escala, oscuro) {
  const x = u.x * escala, y = u.y * escala, z = u.z * escala;
  const cx = Math.floor(x), cy = Math.floor(y), cz = Math.floor(z);
  const h = Math.sin(cx * 12.9 + cy * 78.2 + cz * 37.7) * 43758.5, r = h - Math.floor(h);
  const d = Math.hypot(x - cx - 0.5 - (r - 0.5) * 0.3, y - cy - 0.5, z - cz - 0.5 + (r - 0.5) * 0.3);
  return d > 0.24 && d < 0.44 ? oscuro : null;
}

export function armarSaino(bravo = false) {
  const PEL = 0x3c3631, OSC = 0x24201c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.23, 0.23, 0.4, { y: 0.47, det: 3, grano: 0.3, forma: huevo(0.14) });
  // la crin parada a lo largo del lomo, y el collar claro que le da el nombre
  for (let i = 0; i < 11; i++) { const z = 0.3 - i * 0.065, h = (bravo ? 0.18 : 0.1) + (i % 3) * 0.03; P.tubo(bravo ? 0x5a1a14 : 0x1c1a18, [[0, 0.66, z], [0, 0.68 + h, z - 0.05]], [0.035, 0.003], { lados: 4, pasos: 1 }); }
  const collar = Array.from({ length: 13 }, (_, i) => [Math.cos((i / 12) * Math.PI * 2) * 0.215, 0.49 + Math.sin((i / 12) * Math.PI * 2) * 0.215, 0.22]);
  P.tubo(0xcfc6b0, collar, [0.035, 0.035], { lados: 4, pasos: 1, grano: 0.2 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.5, 0.36); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.15, 0.14, 0.17, { z: 0.08, det: 2, grano: 0.26 });
  C.tubo(0x3a3430, [[0, -0.02, 0.18], [0, -0.05, 0.32], [0, -0.06, 0.42]], [0.11, 0.08, 0.07], { lados: 7, grano: 0.2 });
  C.bulto(0x6a5a52, 0.07, 0.055, 0.02, { y: -0.06, z: 0.43, det: 2, brillo: 0.5 });
  for (const s of [-1, 1]) {
    C.tubo(0xe8e0d0, [[s * 0.06, -0.09, 0.3], [s * 0.08, bravo ? -0.26 : -0.17, 0.32]], [bravo ? 0.032 : 0.022, 0.003], { lados: 4, pasos: 1, amb: 0.95 });
    C.tubo(0x2a2420, [[s * 0.1, 0.11, -0.03], [s * 0.15, 0.23, -0.06]], [0.05, 0.012], { lados: 4, pasos: 1 });
    if (!bravo) C.bulto(0x0a0a0a, 0.022, 0.022, 0.015, { x: s * 0.085, y: 0.05, z: 0.21, det: 1, brillo: 1.3, amb: 0.9 });
  }
  head.add(C.malla());
  if (bravo) for (const s of [-1, 1]) head.add(brasa(0xff2a10, 0.024, s * 0.085, 0.05, 0.215));
  const pezuna = (Q, f) => Q.bulto(0x141210, 0.05, 0.03, 0.06, { x: f[0], y: f[1] + 0.015, z: f[2] + 0.01, det: 1 });
  const legs = [[-0.13, 0.24], [0.13, 0.24], [0.13, -0.24], [-0.13, -0.24]].map(([x, z]) => pata(body, x, 0.32, z, [[0, 0.06, 0], [0, -0.12, -0.02], [0, -0.3, 0]], [0.075, 0.042, 0.03], OSC, pezuna));
  g.userData = { body, head, legs };
  return g;
}

export function armarMicoMalo() {
  const PEL = 0x24201c, CARA = 0x6a4638;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PEL, 0.2, 0.26, 0.17, { y: 0.62, det: 3, rot: [0.35, 0, 0], grano: 0.34, pinta: (u) => (u.z > 0.45 && u.y < 0.3 && Math.abs(u.x) < 0.5 ? 0x3e3028 : null) });
  // los mechones de pelo erizado
  for (let i = 0; i < 12; i++) { const a = i * 2.399, r = 0.12 + (i % 3) * 0.05, y = 0.48 + (i % 5) * 0.08; P.tubo(0x1a1614, [[Math.cos(a) * r, y, -0.1], [Math.cos(a) * r * 1.3, y + 0.05, -0.24]], [0.03, 0.003], { lados: 3, pasos: 1 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.88, 0.1); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.17, 0.16, 0.15, { y: 0.1, z: 0.04, det: 3, grano: 0.32 });
  C.bulto(CARA, 0.125, 0.105, 0.05, { y: 0.07, z: 0.15, det: 2, grano: 0.2 });
  C.bulto(CARA, 0.075, 0.05, 0.06, { y: -0.005, z: 0.19, det: 2, grano: 0.2 });
  C.tubo(0x1a0a08, [[-0.07, -0.02, 0.235], [0, -0.05, 0.25], [0.08, -0.01, 0.23]], [0.009, 0.012, 0.009], { lados: 3, pasos: 3 }); // la boca torcida
  for (const s of [-1, 1]) {
    C.tubo(0xf0e8d0, [[s * 0.035, -0.04, 0.245], [s * 0.04, -0.09, 0.25]], [0.012, 0.002], { lados: 3, pasos: 1, amb: 0.95 });
    C.bulto(0x2e2824, 0.03, 0.06, 0.05, { x: s * 0.18, y: 0.12, z: 0.02, det: 1 });
    C.tubo(0x0c0a08, [[s * 0.1, 0.17, 0.17], [s * 0.03, 0.13, 0.2]], [0.016, 0.012], { lados: 3, pasos: 1 }); // el ceño
  }
  head.add(C.malla());
  const fuego = G(); fuego.position.set(0, 0.1, 0.19);
  for (const s of [-1, 1]) fuego.add(brasa(0xff7a10, 0.028, s * 0.06, 0, 0));
  head.add(fuego);
  const mano = (Q, f) => { Q.bulto(CARA, 0.06, 0.05, 0.06, { x: f[0], y: f[1], z: f[2], det: 1 }); for (const d of [-1, 0, 1]) Q.tubo(CARA, [[f[0] + d * 0.03, f[1] - 0.03, f[2] + 0.02], [f[0] + d * 0.045, f[1] - 0.1, f[2] + 0.06]], [0.016, 0.006], { lados: 3, pasos: 1 }); };
  const brazos = [-1, 1].map((s) => pata(body, s * 0.22, 0.78, 0.06, [[0, 0.04, 0], [s * 0.05, -0.3, -0.04], [s * 0.02, -0.62, 0.05]], [0.075, 0.055, 0.045], PEL, mano, { grano: 0.3 }));
  const piernas = [-1, 1].map((s) => pata(body, s * 0.12, 0.42, -0.04, [[0, 0.04, 0], [s * 0.03, -0.18, 0.1], [0, -0.38, 0.02]], [0.095, 0.06, 0.045], PEL, mano, { grano: 0.3 }));
  const tail = G(); tail.position.set(0, 0.5, -0.14); tail.rotation.x = -0.9; body.add(tail);
  const T = new Pieza();
  T.tubo(PEL, [[0, 0, 0], [0, 0.14, -0.36], [0.1, 0.1, -0.7], [0.2, 0.26, -0.84], [0.14, 0.38, -0.78]], [0.05, 0.04, 0.032, 0.026, 0.012], { lados: 5, grano: 0.3 });
  tail.add(T.malla());
  g.userData = { body, head, legs: [brazos[0], piernas[0], brazos[1], piernas[1]], brazos, tail, fuego };
  return g;
}

export function armarBecquer() {
  const CAFE = 0x7a6440, MANCHA = 0x3a2a18, CLARO = 0xc0a878;
  const g = G(), body = G(); g.add(body);
  const segs = [], N = 9;
  for (let i = 0; i < N; i++) {
    const k = 1 - Math.abs(i - 3) / 7, gros = 0.18 + k * 0.14, seg = G(), S = new Pieza();
    seg.position.set(0, gros / 2, 0.5 - i * 0.32);
    // en silla de montar, como la de verdad
    S.bulto(CAFE, gros * 0.62, gros * 0.54, 0.235, { det: 2, grano: 0.2, brillo: 0.4, pinta: (u) => {
      if (u.y < -0.45) return CLARO;
      if (i % 2 === 0) return u.y > -0.15 && Math.abs(u.z) < 0.62 ? MANCHA : null;
      return Math.abs(u.x) > 0.72 && Math.abs(u.z) < 0.4 ? MANCHA : null;
    } });
    seg.add(S.malla()); body.add(seg); segs.push(seg);
  }
  const head = G(); head.position.set(0, 0.12, 0.72);
  const C = new Pieza();
  C.bulto(CAFE, 0.14, 0.085, 0.18, { z: 0.1, det: 3, grano: 0.2, brillo: 0.4, forma: (v) => { v.x *= 1 - v.z * 0.32; }, pinta: (u) => (u.y > 0.35 && Math.abs(u.x) < 0.22 ? MANCHA : u.y < -0.3 ? CLARO : null) });
  head.add(C.malla());
  const ojos = G(); ojos.position.set(0, 0.05, 0.16);
  const O = new Pieza();
  for (const s of [-1, 1]) { O.bulto(0xe0b020, 0.03, 0.03, 0.03, { x: s * 0.095, det: 2, brillo: 1.5, amb: 0.9 }); O.bulto(0x0a0a0a, 0.008, 0.026, 0.012, { x: s * 0.118, det: 1, amb: 0.9 }); }
  ojos.add(O.malla()); head.add(ojos);
  const L = new Pieza();
  L.tubo(0xa02030, [[0, 0, 0], [0, 0, 0.1]], [0.012, 0.008], { lados: 4, pasos: 1 });
  for (const s of [-1, 1]) L.tubo(0xa02030, [[0, 0, 0.1], [s * 0.04, -0.005, 0.17]], [0.008, 0.002], { lados: 3, pasos: 1 });
  const lengua = L.malla(); lengua.position.set(0, -0.03, 0.26); head.add(lengua);
  body.add(head);
  g.userData = { body, head, legs: [], segs, ojos, lengua };
  return g;
}

const CAMISAS = [0x8a2a2a, 0x2a4a7a, 0x3a5a32, 0x5a5a5a, 0x7a5a22];
export function armarChata() {
  const PIEL = 0xa87a58, JEANS = 0x344668, PANUELO = 0x7a1a1a, GORRA = 0x1c1c1c, cam = CAMISAS[Math.floor(Math.random() * CAMISAS.length)];
  const g = G(), body = G(); g.add(body);
  const legs = [-1, 1].map((sx) => { const l = G(), A = new Pieza(), Q = new Pieza(); l.position.set(sx * 0.13, 0.82, 0); const j = piernaHumana(A, { abajo: Q, s: 0.0683, tela: JEANS, lados: 10, pasos: 2 }); Q.bulto(0x1a1a1a, 0.115, 0.06, 0.175, { y: -0.76, z: 0.05, det: 1, brillo: 0.5, forma: (v) => { if (v.y < 0) v.y *= 0.4; } }); articular(l, A, Q, j); body.add(l); return l; });
  const P = new Pieza();
  torsoHumano(P, { color: cam, s: 0.0583, y0: 0.82, lados: 16, pasos: 2, complexion: { hombro: 1.04, cintura: 1.05, cadera: 1 }, pinta: (u) => { if (u.yu < 1.7) return JEANS; if (u.yu < 2.6) return 0x2a1c10; if (u.yu > 12.55) return PIEL; return null; } });
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.58, 0); body.add(head);
  const C = new Pieza();
  // la cara y el pañuelo que le tapa boca y nariz, con sus pintitas
  C.bulto(PIEL, 0.19, 0.22, 0.19, { y: 0.19, det: 3, grano: 0.1, pinta: (u) => {
    if (u.y > -0.02) return null;
    return Math.sin(u.x * 22) * Math.sin(u.y * 22) > 0.8 && u.z > 0 ? 0xe8d8b8 : PANUELO;
  } });
  C.tubo(PANUELO, [[0, 0.1, -0.19], [0.03, -0.02, -0.25], [0.06, -0.12, -0.27]], [0.03, 0.05, 0.012], { lados: 4 }); // el nudo
  C.tubo(PANUELO, [[0, 0.1, -0.19], [-0.05, -0.02, -0.24], [-0.09, -0.1, -0.26]], [0.03, 0.05, 0.012], { lados: 4 });
  for (const s of [-1, 1]) {
    C.bulto(0xf0ece4, 0.04, 0.026, 0.015, { x: s * 0.08, y: 0.25, z: 0.178, det: 1, amb: 1 });
    C.bulto(0x161010, 0.022, 0.024, 0.012, { x: s * 0.08, y: 0.25, z: 0.19, det: 1, amb: 0.9 });
    C.tubo(0x241812, [[s * 0.13, 0.31, 0.17], [s * 0.04, 0.285, 0.195]], [0.014, 0.014], { lados: 3, pasos: 1 }); // el ceño
    C.bulto(PIEL, 0.025, 0.05, 0.035, { x: s * 0.195, y: 0.2, det: 1 });
  }
  // la gorra con su visera
  C.loft(GORRA, [{ y: 0.31, rx: 0.14, rz: 0.14 }, { y: 0.315, rx: 0.186, rz: 0.19 }, { y: 0.37, rx: 0.19, rz: 0.195 }, { y: 0.425, rx: 0.165, rz: 0.17 }, { y: 0.455, rx: 0.1, rz: 0.1 }, { y: 0.465, rx: 0.01, rz: 0.01 }], { lados: 14, pasos: 2, brillo: 0.2 });
  C.bulto(GORRA, 0.16, 0.016, 0.12, { y: 0.325, z: 0.235, det: 2, forma: (v) => { v.y += v.z * -0.28; } });
  head.add(C.malla());
  const brazos = [-1, 1].map((sx) => { const a = G(), Q = new Pieza(), Q2 = new Pieza(); a.position.set(sx * 0.36, 1.5, 0); const j = brazoHumano(Q, { abajo: Q2, s: 0.0585, lado: sx, tela: cam, piel: PIEL, manga: -9.1, lados: 10, pasos: 2 }); articular(a, Q, Q2, j); body.add(a); return a; });
  const mach = makeMacheteMesh(false); mach.scale.setScalar(0.85); mach.rotation.x = Math.PI / 2; mach.position.set(-brazos[1].junta.position.x, -0.66 - brazos[1].junta.position.y, 0.05 - brazos[1].junta.position.z);
  brazos[1].junta.add(mach);
  g.userData = { body, head, legs, brazos };
  return g;
}

export function armarJaguar() {
  const JAG = 0xc99238, CLARO = 0xf0e0c0, OSC = 0x281c0e;
  const manchas = (u) => (u.y < -0.5 ? CLARO : rosetas(u, 4.5, OSC));
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // pecho ancho y lomo musculoso: es el más pesado de los felinos de acá
  P.bulto(JAG, 0.27, 0.25, 0.58, { y: 0.6, det: 4, grano: 0.1, pinta: manchas });
  P.bulto(JAG, 0.27, 0.27, 0.22, { y: 0.65, z: 0.34, det: 3, grano: 0.1, pinta: manchas });
  P.bulto(JAG, 0.27, 0.27, 0.24, { y: 0.63, z: -0.36, det: 3, grano: 0.1, pinta: manchas });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.74, 0.5); body.add(head);
  const C = new Pieza();
  C.bulto(JAG, 0.22, 0.19, 0.2, { y: 0.03, z: 0.12, det: 3, grano: 0.1, pinta: (u) => (u.y < -0.45 ? CLARO : rosetas(u, 4, OSC)) });
  C.bulto(CLARO, 0.12, 0.08, 0.09, { y: -0.06, z: 0.3, det: 2, amb: 0.82 });
  C.bulto(0x5a2a24, 0.04, 0.026, 0.018, { y: 0, z: 0.385, det: 1 });
  for (const s of [-1, 1]) {
    C.bulto(OSC, 0.065, 0.07, 0.028, { x: s * 0.15, y: 0.2, z: 0.03, det: 2 });
    C.bulto(0xd8b070, 0.035, 0.04, 0.012, { x: s * 0.15, y: 0.19, z: 0.056, det: 1 });
    C.tubo(0xf0e8d0, [[s * 0.05, -0.1, 0.33], [s * 0.055, -0.17, 0.335]], [0.014, 0.002], { lados: 3, pasos: 1, amb: 0.95 });
    for (let k = -1; k <= 1; k++) C.tubo(0xf4ecdc, [[s * 0.09, -0.05 + k * 0.014, 0.33], [s * 0.28, -0.05 + k * 0.05, 0.3]], [0.004, 0.001], { lados: 3, pasos: 1, amb: 1 });
  }
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0xd6ff5a, 0.032, s * 0.1, 0.08, 0.29, 0.7));
  const zarpa = (Q, f) => Q.bulto(JAG, 0.09, 0.05, 0.11, { x: f[0], y: f[1] + 0.025, z: f[2] + 0.02, det: 2, pinta: () => CLARO });
  const legs = [[-0.17, 0.35], [0.17, 0.35], [0.17, -0.35], [-0.17, -0.35]].map(([x, z], i) => pata(body, x, 0.48, z, i < 2 ? [[0, 0.06, 0], [0, -0.2, -0.02], [0, -0.46, 0.02]] : [[0, 0.08, 0], [0, -0.14, -0.1], [0, -0.46, 0]], [0.125, 0.085, 0.065], JAG, zarpa, { pinta: (u) => (Math.sin(u.x * 47) > 0.86 ? OSC : null) }));
  const tail = G(); tail.position.set(0, 0.7, -0.56); tail.rotation.x = 0.5; body.add(tail);
  const T = new Pieza();
  T.tubo(JAG, [[0, 0, 0], [0, -0.03, -0.35], [0, 0.02, -0.7]], [0.065, 0.055, 0.05], { lados: 6, pinta: (u) => (u.x > 0.55 && Math.sin(u.x * 42) > 0.2 ? OSC : null) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail };
  return g;
}

export function armarCocodrilo() {
  const VERDE = 0x4a5c33, OSC = 0x2f3a22, PANZA = 0xb0b07a;
  const placas = (u) => (u.y < -0.4 ? PANZA : Math.sin(u.x * 18) * Math.sin(u.z * 22) > 0.35 ? OSC : null);
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(VERDE, 0.44, 0.2, 0.84, { y: 0.27, det: 4, grano: 0.16, forma: (v) => { if (v.y < 0) v.y *= 0.6; }, pinta: placas });
  // las dos filas de escudos del lomo
  for (let i = 0; i < 11; i++) for (const s of [-1, 1]) P.tubo(OSC, [[s * 0.11, 0.42, 0.62 - i * 0.13], [s * 0.11, 0.52, 0.6 - i * 0.13]], [0.05, 0.004], { lados: 4, pasos: 1, grano: 0.2 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.26, 0.75); body.add(head);
  const C = new Pieza();
  // el hocico largo, el ojo en lo alto y los dientes de lado a lado
  C.bulto(VERDE, 0.25, 0.13, 0.5, { z: 0.42, det: 3, grano: 0.16, forma: (v) => { v.x *= 1 - v.z * 0.34; if (v.y < 0) v.y *= 0.5; }, pinta: placas });
  C.bulto(OSC, 0.09, 0.05, 0.07, { y: 0.06, z: 0.87, det: 2 });
  for (const s of [-1, 1]) {
    C.bulto(VERDE, 0.08, 0.08, 0.1, { x: s * 0.16, y: 0.11, z: 0.2, det: 2, grano: 0.16 });
    C.bulto(0xc8b030, 0.05, 0.05, 0.04, { x: s * 0.17, y: 0.16, z: 0.26, det: 2, brillo: 1.5, amb: 0.95 });
    C.bulto(0x0a0a0a, 0.012, 0.04, 0.012, { x: s * 0.17, y: 0.16, z: 0.3, det: 1, amb: 0.9 });
    for (let i = 0; i < 9; i++) { const z = 0.12 + i * 0.09, x = s * (0.235 - i * 0.012); C.tubo(0xf0eadc, [[x, -0.03, z], [x, -0.11 - (i % 3) * 0.02, z]], [0.018, 0.003], { lados: 3, pasos: 1, amb: 0.95 }); }
  }
  head.add(C.malla());
  const tail = G(); tail.position.set(0, 0.26, -0.75); body.add(tail);
  const T = new Pieza();
  T.tubo(VERDE, [[0, 0, 0.1], [0, 0, -0.5], [0, 0.01, -1.2]], [0.26, 0.17, 0.02], { lados: 7, grano: 0.16, pinta: (u) => (Math.sin(u.x * 34) > 0.3 ? OSC : null) });
  for (let i = 0; i < 9; i++) { const z = -0.08 - i * 0.12, h = 0.2 - i * 0.012; T.tubo(OSC, [[0, h - 0.02, z], [0, h + 0.1 - i * 0.008, z - 0.03]], [0.05, 0.004], { lados: 4, pasos: 1 }); }
  tail.add(T.malla());
  const dedos = (Q, f) => { for (const d of [-1, 0, 1]) Q.tubo(OSC, [[f[0], f[1], f[2]], [f[0] + d * 0.08, f[1] - 0.02, f[2] + 0.12]], [0.03, 0.006], { lados: 3, pasos: 1 }); };
  const legs = [[-0.42, 0.45], [0.42, 0.45], [0.42, -0.45], [-0.42, -0.45]].map(([x, z]) => { const s = Math.sign(x); return pata(body, x, 0.2, z, [[0, 0.02, 0], [s * 0.1, -0.03, 0.02], [s * 0.14, -0.17, 0.04]], [0.1, 0.075, 0.06], VERDE, dedos); });
  g.userData = { body, head, legs, tail };
  return g;
}
