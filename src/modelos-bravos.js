// Las criaturas bravas de cuatro patas (v9.0), con el kit low-poly: musculatura de verdad, patas dobladas y caras con carácter.
import * as THREE from 'three';
import { Pieza, huevo } from './lowpoly.js';

const G = () => new THREE.Group();
// un punto que brilla de noche: la luz del mundo no lo oscurece
export const brasa = (color, r, x, y, z, sy = 1) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshBasicMaterial({ color })); m.position.set(x, y, z); m.scale.y = sy; m.userData.glow = true; return m; };
// una pata colgada de su pivote en la cadera: el juego la balancea en X al caminar
// v11.8: arriba lleva un muslo (o paleta) redondo que se mete en el cuerpo y tapa la unión; antes el tubo salía pelado de la
// cadera y la pata se veía pegada con goma. Y 8 lados en vez de 6, para que no se vea cuadrada
export function pata(padre, x, y, z, puntos, radios, color, pezuna, opts = {}) {
  const p = G(), P = new Pieza(); p.position.set(x, y, z);
  const { muslo = true, ...resto } = opts, r0 = radios[0], top = puntos[0];
  if (muslo) P.bulto(color, r0 * 1.3, r0 * 1.8, r0 * 1.45, { x: top[0], y: top[1] + r0 * 0.55, z: top[2], det: 2, grano: resto.grano ?? 0.14, ...(resto.brillo !== undefined ? { brillo: resto.brillo } : {}) });
  P.tubo(color, puntos, radios, { lados: 8, grano: 0.14, ...resto });
  if (pezuna) pezuna(P, puntos[puntos.length - 1]);
  p.add(P.malla()); padre.add(p);
  return p;
}

export function armarChupacabras() {
  const PIEL = 0x5e6a62, OSCURA = 0x48524c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el cuerpo jorobado y flaco, con las costillas marcadas
  P.bulto(PIEL, 0.24, 0.25, 0.48, { y: 0.84, z: -0.04, det: 3, rot: [0.24, 0, 0], grano: 0.24, forma: huevo(-0.18), pinta: (u) => {
    if (u.z > -0.1 && u.z < 0.6 && Math.abs(u.y) < 0.55) { const f = u.z * 8 - Math.floor(u.z * 8); if (f < 0.3) return OSCURA; }
    return u.y < -0.55 ? 0x7a857c : null;
  } });
  // la cresta de espinas moradas, más grandes en la joroba
  for (let i = 0; i < 9; i++) {
    const k = 1 - Math.abs(i - 3.5) / 4.5, z = 0.34 - i * 0.1, y = 1.09 - i * 0.022 + (i < 4 ? (i - 4) * 0.03 : 0), h = 0.1 + k * 0.24;
    P.tubo(i % 2 ? 0x6a1e6a : 0x9a2e9a, [[0, y - 0.04, z], [0, y + h * 0.6, z - 0.05], [0, y + h, z - 0.14]], [0.05, 0.03, 0.003], { lados: 5, pasos: 2, brillo: 0.5 });
  }
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.88, 0.42); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.19, 0.17, 0.2, { y: 0.05, z: 0.12, det: 3, grano: 0.2, forma: (v) => { if (v.y < 0) v.x *= 1 + v.y * 0.35; } });
  // la quijada abierta, con la boca roja y los colmillos
  C.bulto(OSCURA, 0.13, 0.05, 0.13, { y: -0.14, z: 0.14, det: 2, grano: 0.2 });
  C.bulto(0x4a0e0e, 0.11, 0.035, 0.1, { y: -0.08, z: 0.17, det: 1, amb: 0.8 });
  for (const s of [-1, 1]) {
    C.tubo(0xf0e8d0, [[s * 0.075, -0.04, 0.27], [s * 0.07, -0.16, 0.28]], [0.022, 0.003], { lados: 4, pasos: 1, amb: 0.95 });
    C.tubo(0xf0e8d0, [[s * 0.05, -0.14, 0.25], [s * 0.05, -0.06, 0.25]], [0.016, 0.003], { lados: 4, pasos: 1, amb: 0.95 });
    // los ojos negros rasgados, y las orejas de murciélago
    C.bulto(0x08080a, 0.085, 0.05, 0.03, { x: s * 0.1, y: 0.08, z: 0.28, det: 2, rot: [0, 0, s * 0.42], brillo: 1.4, amb: 0.9 });
    C.tubo(OSCURA, [[s * 0.14, 0.17, 0.04], [s * 0.26, 0.32, -0.04], [s * 0.3, 0.48, -0.1]], [0.07, 0.05, 0.004], { lados: 4, grano: 0.2 });
  }
  head.add(C.malla());
  const brillo = G(); brillo.position.set(0, 0.08, 0.31);
  for (const s of [-1, 1]) brillo.add(brasa(0xff2a18, 0.026, s * 0.1, 0, 0));
  head.add(brillo);
  const garras = (P2, f) => { for (const d of [-1, 0, 1]) P2.tubo(0xe0d8c0, [[f[0] + d * 0.03, f[1], f[2]], [f[0] + d * 0.05, f[1] - 0.02, f[2] + 0.1]], [0.02, 0.003], { lados: 4, pasos: 1, amb: 0.95 }); };
  const brazos = [-1, 1].map((s) => pata(body, s * 0.2, 0.86, 0.3, [[0, 0.04, 0], [s * 0.04, -0.3, -0.05], [0, -0.58, 0.05], [0, -0.82, 0.04]], [0.075, 0.055, 0.045, 0.04], PIEL, garras));
  const atras = [-1, 1].map((s) => pata(body, s * 0.22, 0.92, -0.34, [[0, 0.02, 0], [s * 0.03, -0.32, 0.17], [s * 0.02, -0.6, -0.1], [0, -0.88, 0.02]], [0.13, 0.08, 0.05, 0.04], PIEL, garras));
  const tail = G(); tail.position.set(0, 0.95, -0.44); tail.rotation.x = 0.35; body.add(tail);
  const T = new Pieza();
  T.tubo(OSCURA, [[0, 0, 0], [0, 0.02, -0.34], [0.04, -0.03, -0.72]], [0.05, 0.03, 0.006], { lados: 5, grano: 0.2 });
  tail.add(T.malla());
  g.userData = { body, head, legs: [brazos[0], atras[0], brazos[1], atras[1]], brazos, brillo, tail };
  return g;
}

export function armarToroGuaco() {
  const NEG = 0x1e1e24, PIEL2 = 0x2a2a32;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el cuerpo enorme, con la giba y el cuarto trasero bien marcados
  P.bulto(NEG, 0.44, 0.42, 0.74, { y: 0.92, z: -0.06, det: 4, brillo: 0.35, grano: 0.12, forma: huevo(0.14) });
  P.bulto(NEG, 0.36, 0.3, 0.36, { y: 1.28, z: 0.32, det: 3, brillo: 0.4, grano: 0.12 });
  P.bulto(PIEL2, 0.37, 0.36, 0.3, { y: 0.98, z: -0.56, det: 3, brillo: 0.3, grano: 0.12 });
  // las brasas que le asoman en el lomo
  for (let i = 0; i < 14; i++) { const a = i * 2.399, r = 0.1 + (i % 5) * 0.05; P.bulto(0xa02a08, 0.03, 0.012, 0.05, { x: Math.cos(a) * r, y: 1.33 + (i % 3) * 0.02, z: -0.1 + Math.sin(a) * r * 2, det: 1, amb: 1.3 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.05, 0.62); body.add(head);
  const C = new Pieza();
  C.bulto(NEG, 0.25, 0.24, 0.3, { y: -0.03, z: 0.16, det: 3, brillo: 0.4, grano: 0.12 });
  C.bulto(PIEL2, 0.19, 0.15, 0.13, { y: -0.14, z: 0.38, det: 2, brillo: 0.4, grano: 0.14 });
  for (const s of [-1, 1]) {
    C.bulto(0x0a0a0c, 0.03, 0.025, 0.015, { x: s * 0.08, y: -0.11, z: 0.5, det: 1 }); // las ventanas de la nariz
    // los cuernos largos y claros, abiertos y curvos para adelante
    C.tubo(0xd8ccb0, [[s * 0.18, 0.16, 0.05], [s * 0.42, 0.2, 0.05], [s * 0.6, 0.36, 0.16], [s * 0.56, 0.58, 0.34]], [0.075, 0.062, 0.042, 0.005], { lados: 7, brillo: 0.9, pinta: (u) => (u.x > 0.72 ? 0x4a4438 : null) });
    C.tubo(NEG, [[s * 0.24, 0.05, -0.04], [s * 0.4, 0.02, -0.08], [s * 0.46, -0.06, -0.08]], [0.05, 0.05, 0.01], { lados: 4 });
  }
  // la argolla de la nariz
  const aro = Array.from({ length: 11 }, (_, i) => [Math.sin((i / 10) * Math.PI * 2) * 0.06, -0.24 + Math.cos((i / 10) * Math.PI * 2) * 0.06, 0.5]);
  C.tubo(0xc0b8a0, aro, [0.014, 0.014], { lados: 4, pasos: 2, brillo: 1.2 });
  head.add(C.malla());
  const fuego = G(); fuego.position.set(0, 0.06, 0.4);
  for (const s of [-1, 1]) fuego.add(brasa(0xff5a10, 0.042, s * 0.15, 0, 0, 0.75));
  head.add(fuego);
  const pezuna = (P2, f) => P2.bulto(0x0a0a0c, 0.1, 0.06, 0.12, { x: f[0], y: f[1] + 0.02, z: f[2] + 0.02, det: 2, brillo: 0.8 });
  const legs = [[-0.27, 0.42], [0.27, 0.42], [0.27, -0.56], [-0.27, -0.56]].map(([x, z], i) => pata(body, x, 0.74, z, i < 2 ? [[0, 0.04, 0], [0, -0.3, -0.03], [0, -0.7, 0]] : [[0, 0.06, 0], [0, -0.26, -0.1], [0, -0.7, 0]], [0.17, 0.1, 0.07], 0x141418, pezuna, { brillo: 0.3 }));
  const tail = G(); tail.position.set(0, 1.2, -0.84); body.add(tail);
  const T = new Pieza();
  T.tubo(NEG, [[0, 0, 0], [0, -0.3, -0.08], [0, -0.6, -0.04]], [0.04, 0.03, 0.02], { lados: 5 });
  T.bulto(0x0a0a0c, 0.08, 0.16, 0.08, { y: -0.72, z: -0.04, det: 2, grano: 0.3 });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail, brasa: fuego };
  return g;
}

export function armarPuma() {
  const PEL = 0xb8926a, CLARO = 0xeadcc0, OSCURO = 0x3a2a20;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el cuerpo largo y bajo, con los hombros altos
  P.bulto(PEL, 0.23, 0.23, 0.56, { y: 0.62, det: 3, grano: 0.14, pinta: (u) => (u.y < -0.5 ? CLARO : null) });
  P.bulto(PEL, 0.22, 0.24, 0.2, { y: 0.68, z: 0.34, det: 2, grano: 0.14 });
  P.bulto(PEL, 0.24, 0.25, 0.22, { y: 0.64, z: -0.36, det: 2, grano: 0.14 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.76, 0.5); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.17, 0.15, 0.17, { y: 0.03, z: 0.1, det: 3, grano: 0.12 });
  C.bulto(CLARO, 0.1, 0.07, 0.08, { y: -0.05, z: 0.25, det: 2, amb: 0.8 });
  C.bulto(0x7a3a30, 0.032, 0.022, 0.015, { y: -0.01, z: 0.325, det: 1 });
  C.tubo(OSCURO, [[0, -0.05, 0.31], [0, -0.09, 0.32]], [0.006, 0.006], { lados: 3, pasos: 1 });
  for (const s of [-1, 1]) {
    C.bulto(OSCURO, 0.055, 0.06, 0.025, { x: s * 0.12, y: 0.18, z: 0.03, det: 2 });
    C.bulto(0xd8b890, 0.03, 0.035, 0.012, { x: s * 0.12, y: 0.17, z: 0.052, det: 1 });
    C.tubo(OSCURO, [[s * 0.03, -0.05, 0.3], [s * 0.1, -0.06, 0.25]], [0.008, 0.006], { lados: 3, pasos: 1 }); // la raya de la boca
    for (let k = -1; k <= 1; k++) C.tubo(0xf4ecdc, [[s * 0.08, -0.05 + k * 0.012, 0.28], [s * 0.24, -0.05 + k * 0.04, 0.26]], [0.004, 0.001], { lados: 3, pasos: 1, amb: 1 }); // los bigotes
  }
  head.add(C.malla());
  const ojos = G(); ojos.position.set(0, 0.07, 0.24);
  for (const s of [-1, 1]) ojos.add(brasa(0xd8c030, 0.03, s * 0.08, 0, 0, 0.7));
  head.add(ojos);
  const zarpa = (P2, f) => P2.bulto(CLARO, 0.075, 0.04, 0.09, { x: f[0], y: f[1] + 0.02, z: f[2] + 0.02, det: 2, amb: 0.8 });
  const legs = [[-0.15, 0.36], [0.15, 0.36], [0.15, -0.38], [-0.15, -0.38]].map(([x, z], i) => pata(body, x, 0.52, z, i < 2 ? [[0, 0.06, 0], [0, -0.22, -0.02], [0, -0.48, 0.02]] : [[0, 0.08, 0], [0, -0.16, -0.1], [0, -0.48, 0]], [0.1, 0.065, 0.05], 0xa8835a, zarpa));
  const tail = G(); tail.position.set(0, 0.72, -0.56); tail.rotation.x = 0.4; body.add(tail);
  const T = new Pieza();
  T.tubo(PEL, [[0, 0, 0], [0, -0.06, -0.4], [0, 0.04, -0.82], [0, 0.18, -1]], [0.06, 0.05, 0.05, 0.05], { lados: 6, grano: 0.14, pinta: (u) => (u.x > 0.72 ? OSCURO : null) });
  tail.add(T.malla());
  g.userData = { body, head, legs, tail, ojos };
  return g;
}
