// La gente del pueblo (v9.3), con el kit low-poly: cuerpo con hombros y cintura, brazos y piernas de verdad, faldas, sombreros y
// delantales. La cara la sigue poniendo pueblo.js (cara()), por eso la cabeza es una caja de esquinas redondeadas: el frente queda plano.
import * as THREE from 'three';
import { Pieza, cubico } from './lowpoly.js';
import { torsoHumano, brazoHumano, piernaHumana, articular } from './anatomia.js';

export const hx = (c) => (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]);
const oscurecer = (hex, k) => { const c = new THREE.Color(hex); return (Math.round(c.r * k * 255) << 16) | (Math.round(c.g * k * 255) << 8) | Math.round(c.b * k * 255); };
// el dibujo de la camisa: alineado a la vuelta (u.a) y a la altura (u.yu), como una tela de verdad
function dibujo(estilo, color) {
  const oscuro = oscurecer(color, 0.62);
  if (estilo === 'cuadros') return (u) => ((Math.floor(u.a * 16) + Math.floor(u.yu / 1.3 + 20)) % 2 ? oscuro : null);
  if (estilo === 'rayas') return (u) => (Math.floor(u.yu / 1.1 + 20) % 2 ? 0xebebe6 : null);
  if (estilo === 'rojinegra') return (u) => (Math.floor(u.a * 12) % 2 ? 0x141416 : null);
  if (estilo === 'sele') return (u) => (u.yu > 10.6 ? 0x1e3ca0 : u.yu > 9.8 ? 0xf0f0f0 : null);
  if (estilo === 'morada') return (u) => (u.yu > 9.2 && u.yu < 10.2 ? 0xf0f0f0 : null);
  return (u) => (Math.abs(u.a - 0.25) < 0.02 && Math.floor(u.yu / 1.2 + 20) % 2 ? oscuro : null); // la botonadura
}
const S_TORSO = 0.0583, S_BRAZO = 0.0585, S_PIERNA = 0.0625;
// cada quien con su contextura, según su semilla
export function contextura(semilla, conFalda) {
  const r = (Math.sin(semilla * 91.7) * 43758.5453) % 1, a = Math.abs(r);
  return conFalda ? { hombro: 0.86 + a * 0.1, cintura: 0.84 + a * 0.14, cadera: 1.04 + a * 0.1 } : { hombro: 0.94 + a * 0.16, cintura: 0.94 + a * 0.24, cadera: 0.96 + a * 0.1 };
}
export function torsoVecino(color, estilo, piel, pantalon, complexion) {
  const P = new Pieza(), pinta = dibujo(estilo, color);
  torsoHumano(P, { color, s: S_TORSO, y0: -0.35, lados: 16, pasos: 2, complexion, pinta: (u) => { if (u.yu < 1.7) return pantalon; if (u.yu < 2.6) return 0x2a1c10; if (u.yu > 12.55) return piel; return pinta(u); } });
  const c = oscurecer(color, estilo === 'lisa' ? 0.8 : 1);
  for (const s of [-1, 1]) P.tubo(c, [[s * 0.015, 0.378, 0.1], [s * 0.07, 0.388, 0.075], [s * 0.115, 0.37, 0.03]], [0.028, 0.024, 0.012], { lados: 3, pasos: 2 });
  const m = P.malla(); m.position.y = 1.1;
  // los trajes se montan leyendo las medidas del torso (bailes, cuidacarros, lavanderas, influencer)
  m.geometry.parameters = { width: 0.54, height: 0.74, depth: 0.32 };
  return m;
}
export function cabezaVecino(piel, pelo, melena) {
  const P = new Pieza();
  P.bulto(piel, 0.225, 0.225, 0.225, { y: 0.22, det: 3, grano: 0.06, forma: cubico(0.5), pinta: (u) => {
    if (u.y > 0.42) return pelo;
    if (u.z < -0.32 && u.y > -0.45) return pelo;
    if (Math.abs(u.x) > 0.7 && u.y > 0.15 && u.z < 0.25) return pelo;
    return null;
  } });
  if (melena) {
    // el pelo largo que cae sobre la espalda
    P.bulto(pelo, 0.23, 0.26, 0.09, { y: 0.09, z: -0.2, det: 2, grano: 0.2 });
    for (const s of [-1, 1]) P.tubo(pelo, [[s * 0.21, 0.32, -0.03], [s * 0.245, 0.1, -0.06], [s * 0.21, -0.08, -0.1]], [0.055, 0.06, 0.02], { lados: 5, grano: 0.2 });
  }
  return P.malla();
}
export function sombrero(color, ala, cinta = 0x2a1a10) {
  const P = new Pieza();
  // encajado en la cabeza: el ala queda a la altura de la frente y la copa envuelve la coronilla (la cabeza llega a 0.445)
  P.bulto(color, ala / 2, 0.03, ala / 2, { y: 0.385, det: 3, grano: 0.14, forma: (v) => { const r = Math.hypot(v.x, v.z); v.y += r * r * 0.9; } });
  P.loft(color, [{ y: 0.37, rx: 0.262, rz: 0.262 }, { y: 0.47, rx: 0.258, rz: 0.258 }, { y: 0.56, rx: 0.232, rz: 0.232 }, { y: 0.61, rx: 0.19, rz: 0.19 }, { y: 0.635, rx: 0.1, rz: 0.1 }, { y: 0.64, rx: 0.01, rz: 0.01 }], { lados: 16, pasos: 2, cuadrado: 2.7 });
  P.loft(cinta, [{ y: 0.4, rx: 0.268, rz: 0.268 }, { y: 0.455, rx: 0.266, rz: 0.266 }], { lados: 16, pasos: 1, cuadrado: 2.7 });
  return P.malla();
}
export function gorra(color) {
  const P = new Pieza();
  // calzada sobre la cabeza: baja hasta la frente, se cierra contra el pelo y la visera sale del borde
  P.loft(color, [{ y: 0.345, rx: 0.2, rz: 0.2 }, { y: 0.35, rx: 0.244, rz: 0.244 }, { y: 0.42, rx: 0.25, rz: 0.25 }, { y: 0.475, rx: 0.225, rz: 0.225 }, { y: 0.515, rx: 0.15, rz: 0.15 }, { y: 0.53, rx: 0.01, rz: 0.01 }], { lados: 16, pasos: 2, cuadrado: 2.7 });
  P.bulto(color, 0.19, 0.016, 0.13, { y: 0.362, z: 0.29, det: 2, forma: (v) => { v.y += v.z * -0.28 - Math.abs(v.x) * Math.abs(v.x) * 0.1; } });
  return P.malla();
}
export function mantilla() {
  const P = new Pieza();
  P.bulto(0x2a2a3a, 0.26, 0.29, 0.26, { y: 0.24, z: -0.03, det: 3, grano: 0.14, forma: cubico(0.6), pinta: (u) => (u.z > 0.5 && u.y < 0.6 && Math.abs(u.x) < 0.65 ? 0x3a3a4c : null) });
  // abierta al frente: el manto cae por detrás y a los lados
  const m = P.malla(); m.scale.z = 0.93; m.position.z = -0.03;
  return m;
}
export function delantal(color) {
  const P = new Pieza(), oscuro = oscurecer(color, 0.75);
  // el peto, la falda del delantal y la bolsa, pegados al cuerpo
  P.bulto(color, 0.13, 0.13, 0.012, { y: 1.2, z: 0.15, det: 3, grano: 0.08, forma: cubico(0.3) });
  P.bulto(color, 0.2, 0.2, 0.012, { y: 0.92, z: 0.15, det: 3, grano: 0.08, forma: cubico(0.3) });
  P.bulto(oscuro, 0.1, 0.05, 0.008, { y: 0.9, z: 0.165, det: 2, forma: cubico(0.3) });
  for (const s of [-1, 1]) P.tubo(oscuro, [[s * 0.11, 1.32, 0.15], [s * 0.1, 1.42, 0.11], [s * 0.06, 1.47, 0.04]], [0.014, 0.014, 0.014], { lados: 3 });
  P.tubo(oscuro, [[-0.19, 1.1, 0.14], [0, 1.11, 0.16], [0.19, 1.1, 0.14]], [0.014, 0.014, 0.014], { lados: 3 });
  return P.malla();
}
export function falda(color) {
  const P = new Pieza();
  P.tubo(color, [[0, 0.84, 0], [0, 0.62, 0], [0, 0.34, 0]], [0.25, 0.31, 0.38], { lados: 12, pasos: 2, grano: 0.14, pliegue: (a, t) => 1 + Math.sin(a * 6) * 0.07 * t });
  P.tubo(oscurecer(color, 0.7), [[0, 0.36, 0], [0, 0.32, 0]], [0.385, 0.39], { lados: 12, pasos: 1, pliegue: (a) => 1 + Math.sin(a * 6) * 0.07 });
  return P.malla();
}
export function piernaVecino(grupo, tela, zapato, conFalda, piel, botas) {
  const A = new Pieza(), P = new Pieza(); // P es de la rodilla para abajo
  const j = piernaHumana(A, { abajo: P, s: S_PIERNA, tela: conFalda ? piel : tela, fuerte: conFalda ? 0.86 : 1, lados: 10, pasos: 2 });
  if (botas) P.loft(botas, [{ y: -0.72, rx: 0.1, rz: 0.11 }, { y: -0.58, rx: 0.1, rz: 0.11 }, { y: -0.44, rx: 0.105, rz: 0.115 }], { lados: 10, pasos: 1, brillo: 0.5 });
  P.bulto(zapato, 0.105, 0.055, 0.165, { y: -0.7, z: 0.05, det: 1, brillo: 0.5, forma: (v) => { if (v.y < 0) v.y *= 0.4; } });
  articular(grupo, A, P, j);
}
export function brazoVecino(grupo, tela, piel, mangaCorta, lado, pinta) {
  const P = new Pieza(), B = new Pieza();
  const j = brazoHumano(P, { abajo: B, s: S_BRAZO, lado, tela, piel, manga: mangaCorta ? -3.4 : -9.1, lados: 10, pasos: 2, pinta });
  articular(grupo, P, B, j);
}
export function mecateEnrollado() {
  const P = new Pieza();
  for (let k = 0; k < 3; k++) { const aro = Array.from({ length: 11 }, (_, i) => [-0.13 + k * 0.022, -0.45 + Math.sin((i / 10) * Math.PI * 2) * 0.14, Math.cos((i / 10) * Math.PI * 2) * 0.14]); P.tubo(0xc8b080, aro, [0.016, 0.016], { lados: 4, pasos: 1, grano: 0.2 }); }
  return P.malla();
}
