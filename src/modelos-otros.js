// Los últimos personajes (v10.3), con el kit low-poly: el Bailarín Elegante, la Bruja Zárate, el Murciélago Rey, el congo gigante, el
// minero fantasma, el toro del redondel, las ánimas de la procesión, el sapo y el zancudo.
import * as THREE from 'three';
import { Pieza, cubico, huevo } from './lowpoly.js';
import { pata, brasa } from './modelos-bravos.js';
import { torsoHumano, brazoHumano, piernaHumana, articular } from './anatomia.js';

const G = () => new THREE.Group();
const mechon = (P, color, x, y, z, dx, dy, dz, r = 0.05) => P.tubo(color, [[x, y, z], [x + dx * 0.55, y + dy * 0.55, z + dz * 0.55], [x + dx, y + dy, z + dz]], [r, r * 0.7, r * 0.1], { lados: 4, pasos: 2, grano: 0.24 });
const transparente = (g, op, salvo) => g.traverse((o) => { if (o.isMesh && o !== salvo && !o.userData.glow) { o.material.transparent = true; o.material.opacity = op; } }); // escriben profundidad: si no, el agua los tapa y se ven por dentro
const ojitos = (P, x, y, z, r = 0.03, color = 0x0c0a08) => { for (const s of [-1, 1]) P.bulto(color, r, r, r * 0.7, { x: s * x, y, z, det: 1, brillo: 1.4, amb: 0.9 }); };

export function armarBailarin() {
  const TRAJE = 0x1e1e26, PIEL = 0xc09070, ORO = 0xe0a020;
  const g = G(), body = G(); g.add(body);
  const legs = [-1, 1].map((sx) => { const l = G(), A = new Pieza(), Q = new Pieza(); l.position.set(sx * 0.12, 0.82, 0); const j = piernaHumana(A, { abajo: Q, s: 0.0683, tela: TRAJE, lados: 10, pasos: 2 }); articular(l, A, Q, j); body.add(l); return l; });
  // abajo, zapatos de charol… o patas de gallo
  const zapatos = legs.map((l) => { const Q = new Pieza(); Q.bulto(0x0a0a0c, 0.11, 0.05, 0.17, { y: -0.78, z: 0.05, det: 2, brillo: 1.6, forma: (v) => { if (v.y < 0) v.y *= 0.4; } }); const z = Q.malla(); z.position.set(-l.junta.position.x, -l.junta.position.y, -l.junta.position.z); l.junta.add(z); return z; });
  const patas = legs.map((l) => { const pa = G(), Q = new Pieza(); pa.position.set(-l.junta.position.x, -0.8 - l.junta.position.y, 0.04 - l.junta.position.z); for (const a of [-0.5, 0, 0.5, Math.PI]) Q.tubo(ORO, [[0, 0.02, 0], [Math.sin(a) * 0.12, 0.01, Math.cos(a) * 0.12], [Math.sin(a) * 0.2, -0.02, Math.cos(a) * 0.2]], [0.03, 0.022, 0.003], { lados: 4, pasos: 2 }); pa.add(Q.malla()); pa.visible = false; l.junta.add(pa); return pa; });
  const P = new Pieza();
  // el saco cruzado, la camisa, la corbata roja y las solapas
  torsoHumano(P, { color: TRAJE, s: 0.0583, y0: 0.82, lados: 20, pasos: 2, complexion: { hombro: 1, cintura: 0.9, cadera: 0.94 }, pinta: (u) => { if (u.yu > 12.55) return PIEL; const ancho = Math.max(0, (u.yu - 6) * 0.018); return Math.abs(u.a - 0.25) < ancho ? 0xf2f0ea : null; } });
  P.tubo(0xa01818, [[0, 1.42, 0.16], [0, 1.2, 0.17], [0, 1, 0.17]], [0.03, 0.045, 0.012], { lados: 4, brillo: 0.6 });
  for (const s of [-1, 1]) P.tubo(0x14141a, [[s * 0.1, 1.46, 0.14], [s * 0.15, 1.28, 0.165], [s * 0.04, 1.02, 0.17]], [0.022, 0.03, 0.012], { lados: 3 });
  // los faldones del frac
  for (const s of [-1, 1]) P.tubo(TRAJE, [[s * 0.14, 0.86, -0.06], [s * 0.16, 0.6, -0.14], [s * 0.15, 0.36, -0.16]], [0.09, 0.08, 0.01], { lados: 4, brillo: 0.4 });
  body.add(P.malla());
  const Br = new Pieza();
  Br.bulto(0xd0b040, 0.024, 0.024, 0.012, { x: 0.17, y: 1.35, z: 0.17, det: 1, amb: 1.1, brillo: 1.4 });
  const broche = Br.malla(); broche.userData.glow = true; body.add(broche);
  const head = G(); head.position.set(0, 1.58, 0); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.19, 0.2, 0.18, { y: 0.19, det: 3, grano: 0.06, forma: cubico(0.7), pinta: (u) => (u.y > 0.62 ? 0x1a1210 : null) });
  C.tubo(0x101010, [[-0.15, 0.14, 0.17], [-0.05, 0.115, 0.195], [0.05, 0.115, 0.195], [0.15, 0.14, 0.17]], [0.004, 0.014, 0.014, 0.004], { lados: 3 }); // el bigote fino
  // el sombrero de copa, con cinta roja
  C.bulto(0x0e0e10, 0.29, 0.024, 0.28, { y: 0.35, det: 3, brillo: 0.5 });
  C.tubo(0x0e0e10, [[0, 0.34, 0], [0, 0.54, 0], [0, 0.72, 0]], [0.205, 0.19, 0.2], { lados: 12, pasos: 1, brillo: 0.5 });
  C.bulto(0x0e0e10, 0.2, 0.01, 0.2, { y: 0.72, det: 2, brillo: 0.5 });
  C.tubo(0xa01818, [[0, 0.375, 0], [0, 0.435, 0]], [0.209, 0.205], { lados: 12, pasos: 1 });
  head.add(C.malla());
  const ojos = G(); ojos.position.set(0, 0.25, 0.183);
  for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.026, 1), new THREE.MeshBasicMaterial({ color: 0x1a1a1a })); o.position.set(s * 0.08, 0, 0); ojos.add(o); }
  head.add(ojos);
  const brazos = [-1, 1].map((sx) => { const a = G(), Q = new Pieza(), Q2 = new Pieza(); a.position.set(sx * 0.34, 1.5, 0); const j = brazoHumano(Q, { abajo: Q2, s: 0.0585, lado: sx, tela: TRAJE, piel: 0xf2f0ea, manga: -9.1, lados: 10, pasos: 2 }); articular(a, Q, Q2, j); body.add(a); return a; });
  g.userData = { body, head, legs, brazos, patas, zapatos, ojos };
  return g;
}

export function armarZarate(vestido) {
  const PIEL = 0xc89a78, CANAS = 0xe8e8ec;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.tubo(vestido, [[0, 0.92, 0], [0, 0.5, 0], [0, 0.02, 0]], [0.24, 0.3, 0.42], { lados: 12, pasos: 2, grano: 0.14, pliegue: (a, t) => 1 + Math.sin(a * 6) * 0.08 * t });
  P.bulto(vestido, 0.25, 0.28, 0.16, { y: 1.08, det: 3, grano: 0.14 });
  P.bulto(0x24503a, 0.31, 0.12, 0.2, { y: 1.3, det: 2, grano: 0.2 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; mechon(P, 0x1a3a2a, Math.cos(a) * 0.28, 1.24, Math.sin(a) * 0.18, Math.cos(a) * 0.04, -0.18 - (i % 3) * 0.04, Math.sin(a) * 0.04, 0.025); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.4, 0); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.17, 0.175, 0.16, { y: 0.17, det: 3, grano: 0.14, pinta: (u) => (u.y > 0.4 || u.z < -0.3 ? CANAS : Math.sin(u.y * 22 + u.x * 4) > 0.8 ? 0xa87858 : null) });
  C.bulto(CANAS, 0.09, 0.08, 0.08, { y: 0.36, z: -0.14, det: 2, grano: 0.2 }); // el moño
  C.tubo(0xa87858, [[0, 0.2, 0.14], [0, 0.15, 0.25], [0, 0.08, 0.27]], [0.04, 0.03, 0.01], { lados: 5 }); // la nariz larga
  C.bulto(0x7a5a48, 0.012, 0.012, 0.01, { x: 0.02, y: 0.13, z: 0.255, det: 0 });
  C.tubo(0x4a2a20, [[-0.06, 0.06, 0.15], [0, 0.04, 0.165], [0.06, 0.07, 0.15]], [0.006, 0.01, 0.006], { lados: 3, pasos: 2 });
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0x8aff6a, 0.028, s * 0.08, 0.21, 0.14, 0.8));
  // la lora en el hombro
  const lora = G(); lora.position.set(0.28, 1.365, 0);
  const L = new Pieza();
  L.bulto(0x2aa84a, 0.065, 0.085, 0.08, { y: 0.08, det: 2, brillo: 0.7 });
  L.bulto(0xe8c020, 0.05, 0.05, 0.05, { y: 0.18, z: 0.05, det: 1, brillo: 0.6 });
  L.tubo(0x3a3a30, [[0, 0.17, 0.1], [0, 0.14, 0.14]], [0.02, 0.004], { lados: 3, pasos: 1 });
  L.bulto(0xd83030, 0.03, 0.03, 0.02, { y: 0.12, z: 0.08, det: 0 });
  ojitos(L, 0.04, 0.19, 0.075, 0.009);
  lora.add(L.malla()); body.add(lora);
  const mano = (Q, f) => Q.bulto(PIEL, 0.05, 0.06, 0.05, { x: f[0], y: f[1] - 0.03, z: f[2], det: 1 });
  const arms = [-0.33, 0.33].map((sx) => pata(body, sx, 1.3, 0, [[0, 0.03, 0], [0, -0.26, 0], [0, -0.54, 0.01]], [0.08, 0.08, 0.09], vestido, mano, { lados: 7 }));
  // el bastón torcido
  const B = new Pieza();
  B.tubo(0x5a3a1a, [[0, 0.08, 0.1], [0.04, -0.28, 0.1], [-0.04, -0.7, 0.1], [0.02, -1.1, 0.1]], [0.035, 0.03, 0.03, 0.025], { lados: 5, grano: 0.24 });
  B.bulto(0x3a2410, 0.06, 0.05, 0.06, { y: 0.1, z: 0.1, det: 1 });
  arms[0].add(B.malla());
  const legs = [-0.1, 0.1].map((x) => { const l = G(); l.position.set(x, 0.4, 0); body.add(l); return l; });
  g.userData = { body, head, legs, arms, lora };
  return g;
}

export function armarReyMurcielago() {
  const OSC = 0x201714, MEMB = 0x3a2622, ORO = 0xe8c040;
  const g = G(), body = G(); body.position.y = 0.6; g.add(body);
  const P = new Pieza();
  P.bulto(OSC, 0.38, 0.44, 0.42, { det: 3, grano: 0.34 });
  P.bulto(OSC, 0.32, 0.27, 0.27, { y: 0.6, z: 0.15, det: 3, grano: 0.3 });
  P.bulto(0x3a2a24, 0.13, 0.09, 0.08, { y: 0.52, z: 0.4, det: 2, grano: 0.14 }); // el hocico de hoja
  P.tubo(0x3a2a24, [[0, 0.56, 0.44], [0, 0.72, 0.46]], [0.05, 0.006], { lados: 4, pasos: 1 });
  for (const s of [-1, 1]) {
    P.tubo(MEMB, [[s * 0.2, 0.8, 0.1], [s * 0.34, 1.12, 0.06], [s * 0.42, 1.4, 0]], [0.13, 0.09, 0.006], { lados: 5, grano: 0.2 });
    P.tubo(0xf4f0e0, [[s * 0.08, 0.46, 0.42], [s * 0.08, 0.3, 0.43]], [0.03, 0.004], { lados: 4, pasos: 1, amb: 0.95 });
  }
  // el collar de pelo
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; mechon(P, 0x3a2a24, Math.cos(a) * 0.32, 0.38, Math.sin(a) * 0.32 + 0.08, Math.cos(a) * 0.1, -0.16, Math.sin(a) * 0.1, 0.06); }
  body.add(P.malla());
  for (const s of [-1, 1]) { const e = brasa(0xff2a2a, 0.06, s * 0.14, 0.66, 0.38, 0.7); body.add(e); }
  // la corona
  const cor = G(); cor.position.set(0, 0.9, 0.15);
  const K = new Pieza();
  K.tubo(ORO, [[0, -0.02, 0], [0, 0.04, 0]], [0.24, 0.25], { lados: 12, pasos: 1, amb: 1, brillo: 1 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.tubo(ORO, [[Math.cos(a) * 0.24, 0.04, Math.sin(a) * 0.24], [Math.cos(a) * 0.27, 0.22, Math.sin(a) * 0.27]], [0.06, 0.005], { lados: 4, pasos: 1, amb: 1, brillo: 1 }); K.bulto(0xc82030, 0.025, 0.025, 0.02, { x: Math.cos(a) * 0.25, z: Math.sin(a) * 0.25, y: 0.02, det: 0, amb: 1 }); }
  const corona = K.malla(); corona.userData.glow = true; cor.add(corona); body.add(cor);
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.35, 0.1, 0);
    // los dedos largos y la membrana entre ellos
    for (let k = 0; k < 5; k++) { const a = -0.2 + k * 0.38, L = 1.7 - k * 0.2; W.tubo(OSC, [[0, 0, 0.04], [side * Math.cos(a) * L * 0.55, 0.05, -Math.sin(a) * L * 0.55], [side * Math.cos(a) * L, 0, -Math.sin(a) * L]], [0.05, 0.03, 0.008], { lados: 4 }); W.bulto(MEMB, L * 0.5, 0.02, 0.2, { x: side * Math.cos(a + 0.19) * L * 0.5, z: -Math.sin(a + 0.19) * L * 0.5, det: 2, rot: [0, side * (a + 0.19), 0], grano: 0.24 }); }
    p.add(W.malla()); body.add(p); return { p, side };
  });
  g.userData = { body, wings };
  return g;
}

export function armarCongoGigante() {
  const NEGRO = 0x201a16, DORADO = 0x8a6a30, CARA = 0x342820;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(NEGRO, 0.58, 0.56, 0.7, { y: 1.45, det: 4, rot: [-0.3, 0, 0], grano: 0.36, pinta: (u) => (Math.abs(u.x) > 0.6 && u.y > -0.4 ? DORADO : null) });
  for (let i = 0; i < 26; i++) { const a = i * 2.399, r = 0.45 + (i % 3) * 0.08, z = -0.5 + (i / 25) * 1; mechon(P, i % 3 ? NEGRO : DORADO, Math.cos(a) * r, 1.3 + Math.sin(a) * 0.32, z, Math.cos(a) * 0.14, -0.26, -0.04, 0.09); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.95, 0.62); body.add(head);
  const C = new Pieza();
  C.bulto(NEGRO, 0.38, 0.37, 0.33, { y: 0.1, z: 0.18, det: 3, grano: 0.34 });
  C.bulto(CARA, 0.25, 0.22, 0.1, { y: 0.08, z: 0.44, det: 3, grano: 0.14 });
  C.bulto(NEGRO, 0.33, 0.2, 0.22, { y: -0.2, z: 0.3, det: 2, grano: 0.4 }); // la barba y el buche
  for (let i = 0; i < 12; i++) { const x = -0.26 + i * 0.047; mechon(C, NEGRO, x, -0.26, 0.44 - Math.abs(x) * 0.4, x * 0.3, -0.3 - (i % 3) * 0.08, 0.02, 0.05); }
  C.tubo(0x120c0a, [[-0.16, 0.2, 0.5], [-0.05, 0.16, 0.54]], [0.03, 0.024], { lados: 3, pasos: 1 }); // el ceño
  C.tubo(0x120c0a, [[0.16, 0.2, 0.5], [0.05, 0.16, 0.54]], [0.03, 0.024], { lados: 3, pasos: 1 });
  for (const s of [-1, 1]) C.tubo(0xf0e8d0, [[s * 0.06, -0.04, 0.545], [s * 0.06, -0.12, 0.555]], [0.02, 0.003], { lados: 3, pasos: 1, amb: 0.95 }); // van en la cabeza: la boca se estira al aullar
  head.add(C.malla());
  const Bo = new Pieza();
  Bo.bulto(0x5a0e0e, 0.1, 0.022, 0.02, { det: 1, amb: 0.95 });
  for (const s of [-1, 1]) Bo.tubo(0xf0e8d0, [[s * 0.06, 0.015, 0.012], [s * 0.06, -0.06, 0.02]], [0.018, 0.003], { lados: 3, pasos: 1, amb: 0.95 });
  const boca = Bo.malla(); boca.position.set(0, -0.06, 0.53); head.add(boca);
  for (const s of [-1, 1]) head.add(brasa(0xd8a020, 0.06, s * 0.12, 0.14, 0.51, 0.75));
  const mano = (Q, f) => { Q.bulto(CARA, 0.17, 0.09, 0.2, { x: f[0], y: f[1] + 0.05, z: f[2] + 0.05, det: 2 }); for (const d of [-1, 0, 1]) Q.tubo(CARA, [[f[0] + d * 0.1, f[1] + 0.04, f[2] + 0.18], [f[0] + d * 0.13, f[1] + 0.02, f[2] + 0.34]], [0.05, 0.02], { lados: 4, pasos: 1 }); };
  const legs = [[-0.36, 0.42, 1.05], [0.36, 0.42, 1.05], [0.36, -0.42, 0.85], [-0.36, -0.42, 0.85]].map(([x, z, h], i) => pata(body, x, h, z, i < 2 ? [[0, 0.06, 0], [0, -h * 0.5, -0.05], [0, -h + 0.04, 0.04]] : [[0, 0.06, 0], [0, -h * 0.45, 0.1], [0, -h + 0.04, 0]], [0.22, 0.16, 0.14], NEGRO, mano, { grano: 0.36, lados: 7 }));
  const tail = G(); tail.position.set(0, 1.3, -0.62); tail.rotation.x = 0.7; body.add(tail);
  const T = new Pieza();
  T.tubo(NEGRO, [[0, 0, 0], [0, 0, -0.9], [0.18, 0.26, -1.5], [0.42, 0.62, -1.48]], [0.13, 0.1, 0.08, 0.03], { lados: 6, grano: 0.36 });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail, boca };
  return g;
}

export function armarMinero() {
  const ROPA = 0x5a6a7a, PIEL = 0xc8dcec, BRONCE = 0x8a7a40;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(ROPA, 0.25, 0.33, 0.15, { y: 1.02, det: 3, grano: 0.2 });
  P.tubo(0x3e4c5a, [[0, 0.72, 0], [0, 0.4, 0], [0, 0.08, 0]], [0.22, 0.24, 0.26], { lados: 9, pasos: 2, grano: 0.2, pliegue: (a, t) => 1 + Math.sin(a * 5) * 0.08 * t });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = 0.24; P.tubo(i % 2 ? 0x3e4c5a : 0x4a5866, [[Math.cos(a) * r, 0.1, Math.sin(a) * r], [Math.cos(a) * (r + 0.05), -0.12 - (i % 3) * 0.05, Math.sin(a) * (r + 0.05)]], [0.07, 0.005], { lados: 4, pasos: 1 }); }
  // los tirantes
  for (const s of [-1, 1]) P.tubo(0x3a2a20, [[s * 0.12, 0.74, 0.15], [s * 0.13, 1.34, 0.1]], [0.018, 0.018], { lados: 3, pasos: 1 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.34, 0); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.2, 0.21, 0.2, { y: 0.2, det: 3, grano: 0.14 });
  for (const s of [-1, 1]) C.bulto(0x2a3a4a, 0.045, 0.04, 0.012, { x: s * 0.085, y: 0.24, z: 0.185, det: 1 });
  for (let i = 0; i < 9; i++) { const x = -0.13 + i * 0.033; C.tubo(0x9aa8b4, [[x, 0.14, 0.19 - Math.abs(x) * 0.3], [x * 1.4, 0.06, 0.2]], [0.024, 0.004], { lados: 3, pasos: 1 }); } // el bigote canoso
  // el casco de bronce con su ala
  C.loft(BRONCE, [{ y: 0.295, rx: 0.15, rz: 0.15 }, { y: 0.3, rx: 0.206, rz: 0.21 }, { y: 0.375, rx: 0.214, rz: 0.218 }, { y: 0.46, rx: 0.175, rz: 0.18 }, { y: 0.515, rx: 0.095, rz: 0.1 }, { y: 0.53, rx: 0.01, rz: 0.01 }], { lados: 14, pasos: 2, brillo: 0.9 });
  C.bulto(BRONCE, 0.27, 0.018, 0.29, { y: 0.305, z: 0.03, det: 2, brillo: 0.9 });
  head.add(C.malla());
  head.add(brasa(0xfff0a0, 0.055, 0, 0.4, 0.215));
  const mano = (Q, f) => Q.bulto(PIEL, 0.05, 0.05, 0.05, { x: f[0], y: f[1] - 0.03, z: f[2], det: 1 });
  const brazos = [-1, 1].map((s) => pata(body, s * 0.32, 1.28, 0, [[0, 0.03, 0], [0, -0.28, 0], [0, -0.56, 0.01]], [0.075, 0.07, 0.06], ROPA, mano));
  // el pico al hombro
  const Pi = new Pieza();
  Pi.tubo(0x6a5a4a, [[0, -0.2, 0.15], [0, -0.8, 0.15]], [0.03, 0.03], { lados: 5, pasos: 1, grano: 0.2 });
  Pi.tubo(0x8a8a90, [[-0.24, -0.76, 0.15], [0, -0.82, 0.15], [0.24, -0.76, 0.15]], [0.008, 0.04, 0.008], { lados: 4, brillo: 1 });
  brazos[1].add(Pi.malla());
  transparente(g, 0.7);
  g.userData = { body, head, brazos };
  return g;
}

export function armarToroRedondel() {
  const CAFE = 0x6a442a, OSC = 0x3a2418;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(CAFE, 0.4, 0.38, 0.68, { y: 0.88, z: -0.05, det: 4, grano: 0.14, brillo: 0.3, forma: huevo(0.14), pinta: (u) => (u.z > 0.72 && u.y < 0.3 ? 0xf0ece0 : null) });
  P.bulto(CAFE, 0.3, 0.24, 0.26, { y: 1.18, z: 0.3, det: 3, grano: 0.14 });
  // la divisa: cintas de colores en el lomo
  for (const [c, x] of [[0xd02020, -0.07], [0x1a3aa8, 0.07]]) P.tubo(c, [[x, 1.4, 0.3], [x * 1.6, 1.3, 0.02], [x * 2.2, 1, -0.12]], [0.03, 0.03, 0.01], { lados: 3 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 1, 0.6); body.add(head);
  const C = new Pieza();
  C.bulto(CAFE, 0.22, 0.21, 0.26, { y: -0.04, z: 0.14, det: 3, grano: 0.14 });
  C.bulto(OSC, 0.16, 0.12, 0.1, { y: -0.14, z: 0.34, det: 2, brillo: 0.5 });
  ojitos(C, 0.16, 0.05, 0.3, 0.032, 0x1a0c08);
  for (const s of [-1, 1]) { C.tubo(0xe8dcc0, [[s * 0.15, 0.13, 0.05], [s * 0.34, 0.16, 0.05], [s * 0.44, 0.34, 0.14]], [0.06, 0.05, 0.005], { lados: 6, brillo: 0.9, pinta: (u) => (u.x > 0.75 ? 0x3a342c : null) }); C.tubo(OSC, [[s * 0.2, 0.03, -0.04], [s * 0.34, 0, -0.06]], [0.04, 0.008], { lados: 4, pasos: 1 }); }
  head.add(C.malla());
  const pezuna = (Q, f) => Q.bulto(0x1a120c, 0.09, 0.05, 0.1, { x: f[0], y: f[1] + 0.025, z: f[2] + 0.015, det: 1, brillo: 0.6 });
  const legs = [[-0.24, 0.42], [0.24, 0.42], [0.24, -0.46], [-0.24, -0.46]].map(([x, z], i) => pata(body, x, 0.6, z, i < 2 ? [[0, 0.05, 0], [0, -0.24, 0.01], [0, -0.58, 0]] : [[0, 0.08, 0], [0, -0.2, -0.08], [0, -0.58, 0]], [0.14, 0.08, 0.065], OSC, pezuna));
  g.userData = { body, head, legs };
  return g;
}

export function armarAnima() {
  const MANTO = 0xecebe4, SOMBRA = 0xd4d3ca;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.tubo(MANTO, [[0, 1.2, 0], [0, 0.6, 0], [0, 0.06, 0]], [0.2, 0.26, 0.34], { lados: 12, pasos: 2, grano: 0.1, pliegue: (a, t) => 1 + Math.sin(a * 6 + t * 3) * 0.09 * t });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = 0.32; P.tubo(i % 2 ? MANTO : SOMBRA, [[Math.cos(a) * r, 0.08, Math.sin(a) * r], [Math.cos(a) * (r + 0.05), -0.06 - (i % 3) * 0.04, Math.sin(a) * (r + 0.05)]], [0.08, 0.005], { lados: 4, pasos: 1 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.3, 0); body.add(head);
  const C = new Pieza();
  C.bulto(MANTO, 0.21, 0.23, 0.21, { y: 0.16, det: 3, grano: 0.1, forma: (v) => { if (v.z > 0.42 && v.y < 0.55 && Math.abs(v.x) < 0.68) v.z = 0.05; else if (v.y > 0) { v.y *= 1 + v.y * 0.25; v.z -= v.y * v.y * 0.25; } }, pinta: (u) => (u.z > 0.42 && u.y < 0.55 && Math.abs(u.x) < 0.68 ? 0x101014 : null) });
  head.add(C.malla());
  // las manos juntas, con la vela
  const manos = G(); manos.position.set(0, 1, 0.24);
  const M = new Pieza();
  M.bulto(0xd8d2c4, 0.09, 0.045, 0.055, { det: 1 });
  M.tubo(0xf4ecd0, [[0, 0.02, 0.02], [0, 0.22, 0.02]], [0.025, 0.022], { lados: 6, pasos: 1, amb: 1 });
  manos.add(M.malla());
  const llama = brasa(0xffc040, 0.03, 0, 0.27, 0.02, 1.5); manos.add(llama);
  body.add(manos);
  transparente(g, 0.72, llama);
  g.userData = { body, head, llama, headRx: 0.35 }; // va con la cabeza gacha
  return g;
}

export function armarSapo(CAFE, CAFE2, PANZA) {
  const g = G(), b = G(); g.add(b);
  const P = new Pieza();
  P.bulto(CAFE, 0.18, 0.11, 0.18, { y: 0.13, det: 3, grano: 0.3, forma: (v) => { if (v.y < 0) v.y *= 0.7; }, pinta: (u) => (u.y < -0.35 ? PANZA : null) });
  P.bulto(CAFE, 0.14, 0.07, 0.09, { y: 0.16, z: 0.17, det: 2, grano: 0.26 });
  for (let i = 0; i < 12; i++) { const a = i * 2.399, h = 0.3 + ((i * 37) % 11) / 18, r = Math.sqrt(1 - h * h); P.bulto(CAFE2, 0.018, 0.013, 0.018, { x: Math.cos(a) * r * 0.18, y: 0.13 + h * 0.11, z: Math.sin(a) * r * 0.18, det: 0 }); }
  P.tubo(0x2a1c10, [[-0.12, 0.14, 0.18], [0, 0.13, 0.26], [0.12, 0.14, 0.18]], [0.004, 0.006, 0.004], { lados: 3, pasos: 2 });
  for (const s of [-1, 1]) P.tubo(CAFE2, [[s * 0.13, 0.08, 0.14], [s * 0.18, 0.04, 0.17], [s * 0.18, 0.01, 0.21]], [0.024, 0.02, 0.012], { lados: 4, pasos: 2 });
  b.add(P.malla());
  const E = new Pieza();
  for (const s of [-1, 1]) { E.bulto(0xd8b020, 0.04, 0.04, 0.04, { x: s * 0.09, y: 0.235, z: 0.15, det: 2, amb: 1, brillo: 1.4 }); E.bulto(0x111111, 0.024, 0.012, 0.01, { x: s * 0.09, y: 0.24, z: 0.188, det: 1, amb: 0.9 }); }
  const ojos = E.malla(); ojos.userData.glow = true; b.add(ojos);
  const Bu = new Pieza();
  Bu.bulto(PANZA, 0.08, 0.05, 0.06, { det: 2, grano: 0.1, brillo: 0.5 });
  const buche = Bu.malla(); buche.position.set(0, 0.07, 0.22); b.add(buche);
  const frogLegs = [-1, 1].map((s) => { const l = G(), Q = new Pieza(); l.position.set(s * 0.17, 0.06, -0.05); Q.bulto(CAFE2, 0.055, 0.05, 0.1, { x: s * 0.02, y: 0.02, det: 2, grano: 0.3 }); Q.tubo(CAFE2, [[s * 0.05, -0.02, -0.08], [s * 0.08, -0.04, 0.08], [s * 0.09, -0.05, 0.17]], [0.024, 0.02, 0.012], { lados: 4, pasos: 2 }); l.add(Q.malla()); b.add(l); return l; });
  g.userData = { body: b, frogLegs, buche };
  return g;
}

export function armarZancudo() {
  const OSC = 0x2a2620;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(OSC, 0.02, 0.022, 0.075, { det: 1, pinta: (u) => (Math.sin(u.z * 16) > 0.4 ? 0xd8d8d0 : null), z: -0.02 }); // las rayitas
  P.bulto(OSC, 0.02, 0.02, 0.02, { z: 0.06, det: 0 });
  P.tubo(0x1a1610, [[0, -0.005, 0.07], [0, -0.03, 0.17]], [0.006, 0.001], { lados: 3, pasos: 1 }); // la trompa
  for (const s of [-1, 1]) for (const z of [-0.03, 0, 0.03]) P.tubo(OSC, [[s * 0.012, -0.01, z], [s * 0.07, 0.03, z * 1.5], [s * 0.11, -0.08, z * 2]], [0.003, 0.0025, 0.001], { lados: 3, pasos: 1 });
  body.add(P.malla());
  const wings = [-1, 1].map((side) => { const p = G(), W = new Pieza(); p.position.set(side * 0.02, 0.02, 0); W.bulto(0xdde6ee, 0.06, 0.003, 0.02, { x: side * 0.06, det: 0, amb: 1 }); const m = W.malla(); m.material.transparent = true; m.material.opacity = 0.7; p.add(m); body.add(p); return { p, side }; });
  g.userData = { body, wings, head: null, tail: null };
  return g;
}

export function armarLora() {
  const OLIVA = 0x56683a, OSC = 0x3c4a28, PIEL = 0x6a7a4a;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // la lora: la más chiquita, de concha redonda y olivácea
  P.bulto(OLIVA, 0.33, 0.15, 0.41, { y: 0.12, det: 4, brillo: 0.4, grano: 0.14, forma: (v) => { if (v.y < 0) v.y *= 0.4; }, pinta: (u) => { if (u.y < -0.1) return 0xd8c890; const a = Math.sin(u.x * 8) * Math.sin(u.z * 8); return Math.abs(a) < 0.12 ? OSC : null; } });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.12, 0.42); body.add(head);
  const C = new Pieza();
  C.tubo(PIEL, [[0, -0.01, -0.08], [0, 0, 0.06]], [0.08, 0.07], { lados: 6, pasos: 1, grano: 0.2 });
  C.bulto(PIEL, 0.1, 0.085, 0.11, { z: 0.1, det: 2, grano: 0.2 });
  ojitos(C, 0.075, 0.035, 0.145, 0.018);
  head.add(C.malla());
  const fins = [[-0.27, 0.22, 0.5], [0.27, 0.22, 0.5], [-0.23, -0.3, 0.26], [0.23, -0.3, 0.26]].map(([x, z, l]) => { const s2 = Math.sign(x), f = G(), F = new Pieza(); f.position.set(x, 0.04, z); F.bulto(OLIVA, l * 0.56, 0.022, 0.09, { x: s2 * l * 0.5, z: -0.03, det: 2, rot: [0, s2 * 0.3, 0], grano: 0.2 }); f.add(F.malla()); body.add(f); return f; });
  g.userData = { body, head, legs: [], fins };
  return g;
}
