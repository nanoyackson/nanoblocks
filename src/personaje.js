// El personaje (v10.4), con el kit low-poly, para que no desentone al lado de las criaturas: cuerpo con hombros y cintura, camisa de
// cuadros con cuello, botones y bolsa; jeans con remiendo en la rodilla; botas de cuero; cara con cejas, ojos, nariz, boca y orejas;
// pelo con mechones; sombrero de lona con su cinta; manos con dedos. Los pivotes son los de siempre (head, body, armL, armR, legL, legR),
// así que caminar, pegar, planear y la muerte siguen igual, y la armadura del vestidor le calza encima.
import * as THREE from 'three';
import { Pieza, cubico } from './lowpoly.js';
import { torsoHumano, brazoHumano, piernaHumana, frenteTorso, articular } from './anatomia.js';

const U = 1 / 16; // las medidas son en dieciseisavos de bloque, como el mundo
const hex = (c) => new THREE.Color(c).getHex();
const oscurecer = (h, k) => new THREE.Color(h).multiplyScalar(k).getHex();
// lo que se puede escoger en el vestidor (meta.apariencia): camisa, piel, pelo y sombrero
export const CAMISAS = [['Cuadros azul', '#3a78c0'], ['Cuadros rojo', '#b8402c'], ['Cuadros verde', '#3a8a4a'], ['Cuadros morado', '#6a4a9a'], ['Amarilla', '#d8a828'], ['Blanca', '#e4e0d4']];
export const PIELES = ['#e8bc94', '#c08a5e', '#a06a42', '#7a4a2a', '#5a341c'];
export const PELOS = ['#22160e', '#5a3418', '#a8742a', '#d8d0c0', '#101010', '#8a2a1a'];
const JEAN = 0x33456e, CUERO = 0x5a361c, SUELA = 0x1e140c, LONA = 0xd8bc72, BLANCO = 0xf0ece0;

export function armarPersonaje(A, P, ap = {}) {
  const camisaIdx = ap.camisa || 0, camisa = hex((CAMISAS[camisaIdx] || CAMISAS[0])[1]);
  const piel = hex(PIELES[ap.piel ?? 1] || PIELES[1]), piel2 = oscurecer(piel, 0.84), pelo = hex(PELOS[ap.pelo || 0] || PELOS[0]);
  const conCuadros = camisaIdx < 4, raya = oscurecer(camisa, 0.55);
  const fija = (grp, malla) => { malla.userData.pj = true; grp.add(malla); return malla; };

  P.head.position.y = 1.5 + 1.2 * U; // con cuello: la cabeza no va pegada a los hombros
  // ---- cabeza ----
  const C = new Pieza();
  C.bulto(piel, 3.9 * U, 4 * U, 3.8 * U, { y: 4 * U, det: 3, grano: 0.05, forma: cubico(0.72) });
  // el pelo: un casquete con mechones y patillas
  C.bulto(pelo, 4.05 * U, 2.4 * U, 4 * U, { y: 6.5 * U, z: -0.25 * U, det: 3, grano: 0.2, forma: cubico(0.8) });
  C.bulto(pelo, 4 * U, 3.2 * U, 1.6 * U, { y: 4.6 * U, z: -2.8 * U, det: 2, grano: 0.2 });
  for (let i = 0; i < 7; i++) { const x = (-3 + i) * U; C.tubo(pelo, [[x, 6.4 * U, 3.4 * U], [x * 1.05, 5.5 * U, 3.95 * U], [x * 1.1 + (i % 2 ? 0.2 : -0.2) * U, (4.9 + (i % 3) * 0.2) * U, 3.95 * U]], [0.55 * U, 0.4 * U, 0.05 * U], { lados: 3, pasos: 2, grano: 0.2 }); }
  for (const s of [-1, 1]) {
    C.tubo(pelo, [[s * 3.9 * U, 6 * U, 1 * U], [s * 4 * U, 4.6 * U, 1.1 * U]], [0.7 * U, 0.2 * U], { lados: 3, pasos: 1 }); // las patillas
    C.bulto(piel, 0.55 * U, 1.1 * U, 0.75 * U, { x: s * 4.1 * U, y: 3.9 * U, z: 0.1 * U, det: 1 }); // las orejas
    // cejas, ojos con pupila y brillo, y los cachetes
    C.tubo(pelo, [[s * 2.5 * U, 5.1 * U, 3.75 * U], [s * 0.9 * U, 5 * U, 3.9 * U]], [0.26 * U, 0.26 * U], { lados: 3, pasos: 1 });
    C.bulto(0xf4f0e8, 0.85 * U, 0.6 * U, 0.2 * U, { x: s * 1.65 * U, y: 4.2 * U, z: 3.7 * U, det: 1, amb: 1 });
    C.bulto(0x5a3418, 0.42 * U, 0.52 * U, 0.14 * U, { x: s * 1.6 * U, y: 4.15 * U, z: 3.85 * U, det: 1, amb: 0.95 });
    C.bulto(0x12100c, 0.22 * U, 0.26 * U, 0.1 * U, { x: s * 1.6 * U, y: 4.15 * U, z: 3.95 * U, det: 0, amb: 0.9, brillo: 1.5 });
    C.bulto(0xc86a58, 0.75 * U, 0.42 * U, 0.1 * U, { x: s * 2.5 * U, y: 2.95 * U, z: 3.45 * U, det: 0, amb: 0.95 });
  }
  C.tubo(piel2, [[0, 4.3 * U, 3.75 * U], [0, 3.3 * U, 4.45 * U]], [0.4 * U, 0.65 * U], { lados: 5, pasos: 1 }); // la nariz
  C.tubo(0x7a3a2a, [[-1.3 * U, 2.25 * U, 3.55 * U], [0, 2.05 * U, 3.8 * U], [1.3 * U, 2.25 * U, 3.55 * U]], [0.14 * U, 0.26 * U, 0.14 * U], { lados: 3, pasos: 2 }); // la boca
  C.tubo(piel2, [[0, -1.6 * U, 0], [0, 0.4 * U, 0]], [1.55 * U, 1.55 * U], { lados: 9, pasos: 1 }); // el cuello
  fija(P.head, C.malla());
  // ---- el sombrero de lona: ala ancha y curva, copa abollada y cinta roja ----
  const H = new THREE.Group(); H.userData.pj = true; P.head.add(H); A.userData.hat = H; A.userData.sinSombrero = ap.sombrero === false;
  const S = new Pieza();
  S.bulto(LONA, 6.6 * U, 0.4 * U, 6.6 * U, { y: 8.1 * U, det: 3, grano: 0.14, forma: (v) => { const r = Math.hypot(v.x, v.z); v.y += r * r * Math.abs(v.x) * 2.2 - r * r * Math.abs(v.z) * 1.1; }, pinta: (u) => { const r = Math.hypot(u.x, u.z) * 6; return r - Math.floor(r) < 0.25 ? oscurecer(LONA, 0.8) : null; } });
  S.tubo(LONA, [[0, 8 * U, 0], [0, 9.6 * U, 0], [0, 10.8 * U, 0]], [3.9 * U, 3.6 * U, 3 * U], { lados: 10, pasos: 1, grano: 0.14 });
  S.bulto(LONA, 3 * U, 0.7 * U, 3 * U, { y: 10.8 * U, det: 2, grano: 0.14, forma: (v) => { if (v.y > 0 && Math.abs(v.x) < 0.4) v.y *= -0.3; } });
  S.tubo(0xa02020, [[0, 8.5 * U, 0], [0, 9.2 * U, 0]], [3.95 * U, 3.85 * U], { lados: 10, pasos: 1 });
  fija(H, S.malla());
  // ---- cuerpo: anatomía por secciones (anatomia.js): cadera con los jeans, faja, camisa, cuello, botones y bolsa ----
  // el cuadro va alineado a la vuelta y a la altura, como una tela de verdad
  const tela = (u) => (conCuadros && ((Math.floor(u.a * 16) + Math.floor(u.yu / 1.2 + 20)) % 2) ? raya : null);
  const T = new Pieza();
  torsoHumano(T, { color: camisa, s: U, pinta: (u) => { if (u.yu < 1.7) return JEAN; if (u.yu < 2.9) return 0x4a2a14; if (u.yu > 12.55) return piel2; return tela(u); } });
  // el cuello de la camisa, abierto, y la botonadura pegada al pecho
  for (const lado of [-1, 1]) T.tubo(BLANCO, [[lado * 0.25 * U, 12.35 * U, 1.75 * U], [lado * 1.15 * U, 12.55 * U, 1.3 * U], [lado * 2 * U, 12.25 * U, 0.55 * U]], [0.5 * U, 0.42 * U, 0.2 * U], { lados: 3, pasos: 2, amb: 0.95 });
  for (let i = 0; i < 5; i++) { const y = 11 - i * 1.65; T.bulto(BLANCO, 0.22 * U, 0.22 * U, 0.09 * U, { y: y * U, z: (frenteTorso(y) + 0.04) * U, det: 0, amb: 1 }); }
  T.bulto(oscurecer(camisa, 0.8), 1 * U, 0.95 * U, 0.1 * U, { x: 1.9 * U, y: 9.3 * U, z: (frenteTorso(9.3) - 0.28) * U, det: 1 }); // la bolsa
  T.bulto(0xd8b048, 0.85 * U, 0.6 * U, 0.16 * U, { y: 2.3 * U, z: (frenteTorso(2.3) + 0.08) * U, det: 1, brillo: 1.3, amb: 1 }); // la hebilla
  fija(P.body, T.malla());
  // ---- brazos: del hombro a la mano, arremangados ----
  for (const [arm, lado] of [[P.armL, -1], [P.armR, 1]]) {
    const B = new Pieza(), B2 = new Pieza();
    const jB = brazoHumano(B, { abajo: B2, s: U, lado, tela: camisa, piel, manga: -6.3, puno: BLANCO, lados: 18, pasos: 3, pinta: (u) => (conCuadros && ((Math.floor(u.a * 10) + Math.floor(u.yu / 1.2 + 20)) % 2) ? raya : null) });
    articular(arm, B, B2, jB, true);
  }
  // ---- piernas: jeans con costura, remiendo y botas de cuero ----
  [P.legL, P.legR].forEach((leg, k) => {
    const A2 = new Pieza(), L = new Pieza(), lado = k === 0 ? -1 : 1; // L es de la rodilla para abajo, con la bota
    const jL = piernaHumana(A2, { abajo: L, s: U, tela: JEAN, lados: 18, pasos: 3, pinta: (u) => {
      const afuera = lado > 0 ? u.a < 0.02 || u.a > 0.98 : Math.abs(u.a - 0.5) < 0.03;
      if (afuera) return 0xdcaa50; // la costura de afuera
      if (k === 0 && u.a > 0.14 && u.a < 0.36 && u.yu > -6.4 && u.yu < -4.6) return 0x6a5a3a; // el remiendo de la rodilla
      return null;
    } });
    // la bota
    L.loft(CUERO, [{ y: -12.2 * U, rx: 1.75 * U, rz: 1.85 * U, z: 0.1 * U }, { y: -10.8 * U, rx: 1.65 * U, rz: 1.75 * U }, { y: -9.2 * U, rx: 1.6 * U, rz: 1.7 * U }, { y: -8.8 * U, rx: 1.7 * U, rz: 1.8 * U }], { lados: 14, pasos: 2, brillo: 0.5 });
    L.bulto(CUERO, 1.75 * U, 0.95 * U, 2.7 * U, { y: -11.2 * U, z: 0.75 * U, det: 2, brillo: 0.5 });
    L.bulto(SUELA, 1.85 * U, 0.35 * U, 2.8 * U, { y: -11.85 * U, z: 0.75 * U, det: 1 });
    for (let j2 = 0; j2 < 3; j2++) L.tubo(0xe8d8b0, [[-0.7 * U, (-9.5 - j2 * 0.7) * U, 1.75 * U], [0.7 * U, (-9.5 - j2 * 0.7) * U, 1.75 * U]], [0.08 * U, 0.08 * U], { lados: 3, pasos: 1, amb: 1 });
    articular(leg, A2, L, jL, true);
  });
}

// el brazo en primera persona: la manga va hacia atrás (+z) y la mano hacia el frente (-z)
// v11.11.2: `puno` cierra los dedos alrededor de un mango que pasa de lado a lado (eje X, en AGARRE); `manga` (hex) viste el brazo
// con la armadura en vez de la camisa
export const AGARRE = [0, -0.035, -0.262]; // el centro del mango dentro del puño, en el espacio del brazo
export const PALMA = [0, -0.075, -0.2]; // la palma (mano abierta), donde se apoya un bloque
export function armarBrazoMano(ap = {}, { puno = false, manga = null, pulgarArriba = false } = {}) {
  const camisaIdx = ap.camisa || 0, camisa = manga ? hex(manga) : hex((CAMISAS[camisaIdx] || CAMISAS[0])[1]), piel = hex(PIELES[ap.piel ?? 1] || PIELES[1]), raya = oscurecer(camisa, 0.55);
  const P = new Pieza();
  P.tubo(camisa, [[0, 0, 0.5], [0, 0, 0.26], [0, 0, 0.06]], [0.115, 0.105, 0.1], { lados: 9, pasos: 3, grano: 0.06, amb: 0.82, pinta: !manga && camisaIdx < 4 ? (u) => (Math.floor(u.x * 8) % 2 ? raya : null) : undefined });
  P.tubo(manga ? oscurecer(camisa, 0.8) : BLANCO, [[0, 0, 0.08], [0, 0, 0.01]], [0.118, 0.114], { lados: 9, pasos: 1, amb: 0.95 }); // el puño de la manga
  P.tubo(piel, [[0, 0, 0.03], [0, 0, -0.13]], [0.09, 0.082], { lados: 8, pasos: 1, grano: 0.05 });
  P.bulto(piel, 0.09, 0.075, 0.085, { z: -0.2, det: 2, grano: 0.05 });
  if (puno) {
    // los dedos se doblan hacia abajo y hacia adentro, abrazando el mango; el pulgar cruza por encima
    for (const d of [-1, -0.33, 0.33, 1]) P.tubo(piel, [[d * 0.066, 0.03, -0.25], [d * 0.068, 0.012, -0.315], [d * 0.066, -0.05, -0.322], [d * 0.06, -0.09, -0.27]], [0.025, 0.024, 0.022, 0.019], { lados: 5, pasos: 3 });
    if (pulgarArriba) P.tubo(piel, [[0.06, 0.035, -0.18], [0.13, 0.05, -0.2], [0.215, 0.045, -0.215]], [0.032, 0.028, 0.022], { lados: 6, pasos: 3 }); // v13.3.5: el pulgar en alto (el escudo)
    else P.tubo(piel, [[-0.08, 0.02, -0.17], [-0.1, 0.0, -0.235], [-0.06, -0.045, -0.29]], [0.03, 0.024, 0.019], { lados: 5, pasos: 2 });
  } else {
    for (const d of [-1, -0.33, 0.33, 1]) P.tubo(piel, [[d * 0.066, 0.01, -0.26], [d * 0.07, 0.015, -0.33], [d * 0.07, -0.01, -0.38]], [0.024, 0.021, 0.015], { lados: 4, pasos: 2 });
    P.tubo(piel, [[-0.08, 0.02, -0.17], [-0.12, 0.05, -0.25]], [0.028, 0.019], { lados: 4, pasos: 1 }); // el pulgar
  }
  return P.malla();
}
