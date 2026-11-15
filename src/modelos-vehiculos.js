// Los vehículos (v10.5), con el kit low-poly: el carro tico con sus raspones, el bote de remos, la avioneta, la moto y la bici.
import * as THREE from 'three';
import { Pieza, cubico, huevo } from './lowpoly.js';

const G = () => new THREE.Group();
const luz = (color, rx, ry, rz, x, y, z) => { const P = new Pieza(); P.bulto(color, rx, ry, rz, { x, y, z, det: 1, amb: 1.1, grano: 0 }); const m = P.malla(); m.userData.glow = true; return m; };
// una llanta que gira en X: la banda, el rin y sus tornillos
function llanta(r, ancho) {
  const P = new Pieza();
  P.tubo(0x222226, [[-ancho / 2, 0, 0], [ancho / 2, 0, 0]], [r, r], { lados: 12, pasos: 1, grano: 0.14, pliegue: (a) => 1 + (Math.sin(a * 12) > 0 ? 0.03 : 0) });
  for (const s of [-1, 1]) { P.tubo(0xa8a8ae, [[s * ancho / 2, 0, 0], [s * (ancho / 2 + 0.012), 0, 0]], [r * 0.55, r * 0.5], { lados: 8, pasos: 1, brillo: 1 }); for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; P.bulto(0x4a4a50, 0.016, r * 0.1, r * 0.1, { x: s * (ancho / 2 + 0.016), y: Math.cos(a) * r * 0.3, z: Math.sin(a) * r * 0.3, det: 0 }); } }
  return P.malla();
}

export function armarCarro(color) {
  const g = G(), body = G(); g.add(body);
  const VIDRIO = 0x9ac8e0, OXIDO = 0x784628;
  const rayones = (u) => (Math.sin(u.x * 23 + 1) * Math.sin(u.z * 31) > 0.9 ? OXIDO : null);
  const P = new Pieza();
  // el chasis, con trompa y cajuela
  P.bulto(color, 0.86, 0.27, 1.66, { y: 0.6, det: 4, brillo: 1, grano: 0.05, forma: cubico(0.42), pinta: rayones });
  // la cabina: los vidrios van pintados en las caras
  P.bulto(color, 0.75, 0.34, 0.86, { y: 1.13, z: -0.25, det: 4, brillo: 0.8, grano: 0.05, forma: (v) => { cubico(0.42)(v); if (v.y > 0) { v.x *= 0.88; v.z *= 0.86; } }, pinta: (u) => {
    if (u.y < 0.62 && u.y > -0.5 && (Math.abs(u.z) > 0.55 || Math.abs(u.x) > 0.55)) return VIDRIO;
    return null;
  } });
  // bompers, placa, retrovisores y la antena
  for (const z of [1.7, -1.7]) P.tubo(0x3a3a3e, [[-0.86, 0.42, z * 0.97], [0, 0.42, z], [0.86, 0.42, z * 0.97]], [0.07, 0.07, 0.07], { lados: 5, brillo: 0.7 });
  P.bulto(0xf4f4f0, 0.25, 0.08, 0.012, { y: 0.6, z: -1.71, det: 1, amb: 1 });
  for (const s of [-1, 1]) P.bulto(0x2a2a2e, 0.09, 0.05, 0.03, { x: s * 0.86, y: 1, z: 0.5, det: 1, brillo: 1 });
  P.tubo(0x2a2a2e, [[-0.5, 1.46, -0.9], [-0.54, 1.96, -1.04]], [0.012, 0.004], { lados: 3, pasos: 1 });
  body.add(P.malla());
  // v13.2.4: el interior (se ve en primera persona, con los ojos dentro de la cabina; las paredes de la cabina son de una sola cara y desde adentro no estorban):
  // el tablero, el volante, los marcos del parabrisas y el borde del techo. Todo queda por debajo y a los lados de la vista hacia adelante.
  const I = new Pieza();
  I.bulto(0x2a2a2e, 0.62, 0.07, 0.15, { y: 0.93, z: 0.38, det: 2, brillo: 0.6, grano: 0.04, forma: cubico(0.3) }); // el tablero
  I.tubo(0x1c1c20, Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return [Math.cos(a) * 0.13, 0.9 + Math.sin(a) * 0.1 * 0.8, 0.22 + Math.sin(a) * 0.1]; }), [0.022, 0.022], { lados: 4, pasos: 1, brillo: 0.5 }); // el volante, al frente del asiento
  I.tubo(0x1c1c20, [[0, 0.88, 0.3], [0, 0.8, 0.45]], [0.02, 0.02], { lados: 4, pasos: 1 }); // la columna
  for (const s of [-1, 1]) I.tubo(color, [[s * 0.64, 0.86, 0.42], [s * 0.6, 1.44, 0.14]], [0.045, 0.04], { lados: 4, pasos: 1, brillo: 0.8, grano: 0.05 }); // los marcos del parabrisas
  I.tubo(color, [[-0.6, 1.45, 0.14], [0.6, 1.45, 0.14]], [0.04, 0.04], { lados: 4, pasos: 1, brillo: 0.8 }); // el borde del techo
  body.add(I.malla());
  for (const s of [-1, 1]) { body.add(luz(0xfff2b0, 0.16, 0.09, 0.03, s * 0.58, 0.68, 1.64)); body.add(luz(0xc81818, 0.15, 0.08, 0.03, s * 0.6, 0.68, -1.64)); }
  const wheels = [[-0.86, 1.05], [0.86, 1.05], [-0.86, -1.1], [0.86, -1.1]].map(([x, z]) => { const w = G(); w.position.set(x, 0.32, z); w.add(llanta(0.31, 0.26)); body.add(w); return w; });
  g.userData = { body, wheels };
  return g;
}

export function armarBote() {
  const MADERA = 0x7e5430, OSC = 0x5a3a1e, AZUL = 0x2a6ea2;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el casco: afuera azul y blanco; adentro, tablas
  P.bulto(AZUL, 0.68, 0.34, 1.44, { y: 0.42, det: 4, grano: 0.1, forma: (v) => { v.x *= 1 - Math.abs(v.z) ** 3 * 0.75; if (v.y > 0) v.y = 0; }, pinta: (u, n) => { if (n.y > 0.9) return Math.floor((u.x + 1) * 7) % 2 ? MADERA : OSC; return u.y > -0.2 ? 0xf0ece0 : null; } });
  // la borda
  const borde = Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * Math.PI * 2, z = Math.sin(a), x = Math.cos(a) * (1 - Math.abs(z) ** 3 * 0.75); return [x * 0.68, 0.47, z * 1.44]; });
  P.tubo(OSC, borde, [0.05, 0.05], { lados: 4, pasos: 1, grano: 0.2 });
  P.bulto(MADERA, 0.58, 0.04, 0.17, { y: 0.54, z: -0.1, det: 1, forma: cubico(0.4), grano: 0.2 }); // la banca
  body.add(P.malla());
  const paddles = [-1, 1].map((sx) => {
    const p = G(), inner = G(), R = new Pieza(); p.position.set(sx * 0.68, 0.5, 0.1); inner.rotation.y = sx * 1.2; inner.rotation.x = 0.4;
    R.tubo(MADERA, [[0, 0, -0.8], [0, 0, 0.7]], [0.03, 0.03], { lados: 5, pasos: 1, grano: 0.2 });
    R.bulto(MADERA, 0.02, 0.125, 0.18, { z: 0.78, det: 1, grano: 0.2 });
    inner.add(R.malla()); p.add(inner); body.add(p); return { p, sx };
  });
  g.userData = { body, paddles };
  return g;
}

export function armarAvioneta() {
  const BLANCO = 0xf0f0f4, ROJO = 0xc82a2a, VIDRIO = 0x7ab8e0;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(BLANCO, 0.48, 0.48, 1.9, { y: 0.95, z: -0.05, det: 4, brillo: 1, grano: 0.04, forma: huevo(0.12), pinta: (u) => (u.y > -0.15 && u.y < 0.1 ? ROJO : null) });
  // la cabina de vidrio
  P.bulto(VIDRIO, 0.4, 0.3, 0.55, { y: 1.42, z: 0.5, det: 3, brillo: 1.6, grano: 0.02, amb: 0.9, pinta: (u) => (Math.abs(u.z) < 0.08 ? 0x3a3a40 : null) });
  // las alas y la cola, con las puntas rojas
  P.bulto(BLANCO, 3.1, 0.07, 0.56, { y: 1.42, z: 0.15, det: 3, brillo: 0.8, grano: 0.04, forma: (v) => { v.z *= 1 - Math.abs(v.x) * 0.25; }, pinta: (u) => (Math.abs(u.x) > 0.84 ? ROJO : null) });
  for (const s of [-1, 1]) P.tubo(0x8a8a90, [[s * 0.42, 0.8, 0.2], [s * 1.6, 1.38, 0.2]], [0.025, 0.025], { lados: 4, pasos: 1, brillo: 0.8 });
  P.bulto(BLANCO, 1.1, 0.04, 0.32, { y: 1.05, z: -1.6, det: 2, brillo: 0.8, forma: (v) => { v.z *= 1 - Math.abs(v.x) * 0.3; } });
  P.tubo(ROJO, [[0, 1.2, -1.3], [0, 1.6, -1.6], [0, 2.1, -1.84]], [0.34, 0.26, 0.14], { lados: 4, brillo: 0.8, pliegue: (a) => (Math.abs(Math.cos(a)) > 0.7 ? 0.14 : 1) });
  P.tubo(0x3a3a40, [[0, 0.95, 1.72], [0, 0.95, 2]], [0.3, 0.14], { lados: 10, pasos: 1, brillo: 1 });
  // el tren de aterrizaje
  for (const [x, z] of [[-0.6, 0.6], [0.6, 0.6], [0, -1.4]]) {
    P.tubo(0x3a3a3a, [[x * 0.65, 0.6, z], [x, 0.16, z]], [0.03, 0.03], { lados: 4, pasos: 1 });
    P.tubo(0x18181a, [[x - 0.06, 0.15, z], [x + 0.06, 0.15, z]], [0.15, 0.15], { lados: 10, pasos: 1 });
  }
  body.add(P.malla());
  const helice = G(); helice.position.set(0, 0.95, 2.05);
  const H = new Pieza();
  for (const s of [-1, 1]) { H.bulto(0x2a2a2e, 0.07, 0.42, 0.02, { y: s * 0.44, det: 2, brillo: 0.8, rot: [0, s * 0.2, 0], pinta: (u) => (Math.abs(u.y) > 0.82 ? 0xe8c020 : null) }); H.bulto(0x2a2a2e, 0.42, 0.07, 0.02, { x: s * 0.44, det: 2, brillo: 0.8, rot: [s * 0.2, 0, 0], pinta: (u) => (Math.abs(u.x) > 0.82 ? 0xe8c020 : null) }); }
  H.bulto(0xe8c020, 0.13, 0.13, 0.16, { z: 0.04, det: 2, brillo: 1, forma: huevo(-0.3) });
  helice.add(H.malla()); body.add(helice);
  body.add(luz(0xff3030, 0.07, 0.06, 0.07, -3.08, 1.42, 0.3), luz(0x30ff50, 0.07, 0.06, 0.07, 3.08, 1.42, 0.3));
  g.userData = { body, helice };
  return g;
}

export function cuadroBici(body, color) {
  const P = new Pieza();
  P.tubo(color, [[0, 0.64, 0.42], [0, 0.62, -0.15]], [0.025, 0.025], { lados: 5, pasos: 1, brillo: 1 });
  P.tubo(color, [[0, 0.62, -0.15], [0, 0.34, 0]], [0.025, 0.025], { lados: 5, pasos: 1, brillo: 1 });
  P.tubo(color, [[0, 0.34, 0], [0, 0.6, 0.42]], [0.03, 0.03], { lados: 5, pasos: 1, brillo: 1 });
  P.tubo(color, [[0.04, 0.34, -0.5], [0, 0.34, 0]], [0.016, 0.02], { lados: 4, pasos: 1, brillo: 1 });
  P.tubo(color, [[0.04, 0.34, -0.5], [0, 0.62, -0.15]], [0.016, 0.018], { lados: 4, pasos: 1, brillo: 1 });
  P.tubo(0x8a8a90, [[0, 0.34, 0.5], [0, 0.8, 0.44]], [0.02, 0.02], { lados: 5, pasos: 1, brillo: 1 }); // la horquilla
  P.tubo(0x3a3a3a, [[-0.26, 0.84, 0.46], [-0.12, 0.84, 0.44], [0.12, 0.84, 0.44], [0.26, 0.84, 0.46]], [0.018, 0.018, 0.018, 0.018], { lados: 4, brillo: 0.6 });
  P.tubo(0x8a8a90, [[0, 0.62, -0.15], [0, 0.78, -0.2]], [0.016, 0.016], { lados: 4, pasos: 1 });
  P.bulto(0x2a2a2a, 0.07, 0.03, 0.13, { y: 0.81, z: -0.2, det: 2, forma: huevo(0.2) }); // el sillín
  body.add(P.malla());
  const ped = G(); ped.position.set(0, 0.34, 0);
  const Q = new Pieza();
  Q.tubo(0x4a4a50, [[-0.03, 0, 0], [0.03, 0, 0]], [0.07, 0.07], { lados: 8, pasos: 1, brillo: 1 });
  for (const s of [-1, 1]) { Q.tubo(0x3a3a3a, [[s * 0.04, 0, 0], [s * 0.05, s * -0.12, 0]], [0.012, 0.012], { lados: 3, pasos: 1 }); Q.bulto(0x2a2a2a, 0.05, 0.012, 0.03, { x: s * 0.1, y: s * -0.13, det: 0 }); }
  ped.add(Q.malla()); body.add(ped);
  return ped;
}

export function cuadroMoto(body, color) {
  const P = new Pieza();
  P.bulto(color, 0.17, 0.15, 0.3, { y: 0.8, z: 0.12, det: 3, brillo: 1.4, grano: 0.04, forma: huevo(0.15) });
  P.bulto(0x5a5a60, 0.15, 0.14, 0.2, { y: 0.5, det: 2, brillo: 0.9, grano: 0.1, pinta: (u) => (Math.sin(u.y * 22) > 0.2 ? 0x3a3a40 : null) }); // el motor con aletas
  P.bulto(0x1a1a1a, 0.14, 0.05, 0.3, { y: 0.93, z: -0.3, det: 2, grano: 0.14, forma: cubico(0.7) }); // el asiento
  P.tubo(0x4a4a50, [[0, 0.5, 0.15], [0, 0.42, -0.2], [0, 0.36, -0.58]], [0.04, 0.036, 0.03], { lados: 5, brillo: 0.8 });
  P.tubo(0x8a8a90, [[0, 0.36, 0.62], [0, 1, 0.44]], [0.03, 0.03], { lados: 5, pasos: 1, brillo: 1 }); // la horquilla
  P.tubo(0x3a3a3a, [[-0.3, 1.08, 0.5], [-0.12, 1.04, 0.46], [0.12, 1.04, 0.46], [0.3, 1.08, 0.5]], [0.022, 0.022, 0.022, 0.022], { lados: 4, brillo: 0.6 });
  P.tubo(0xa8a8ae, [[0.16, 0.42, -0.1], [0.17, 0.44, -0.42], [0.17, 0.5, -0.7]], [0.04, 0.045, 0.05], { lados: 6, brillo: 1.3 }); // el escape
  P.bulto(color, 0.1, 0.03, 0.26, { y: 0.74, z: 0.62, det: 2, brillo: 1, forma: (v) => { v.y -= Math.abs(v.z) * 0.8; } }); // el guardabarros
  P.bulto(color, 0.09, 0.03, 0.24, { y: 0.75, z: -0.6, det: 2, brillo: 1, forma: (v) => { v.y -= Math.abs(v.z) * 0.8; } });
  body.add(P.malla());
  body.add(luz(0xfff2b0, 0.08, 0.075, 0.03, 0, 0.9, 0.6), luz(0xc81818, 0.06, 0.04, 0.02, 0, 0.92, -0.62));
}

// la rueda de la bici y de la moto: un aro de verdad, con los rayos en un grupo aparte, que es el que gira
export function ruedaFina(r, ancho, x, y, z) {
  const w = G(), P = new Pieza(); w.position.set(x, y, z);
  const n = 20, aro = Array.from({ length: n + 1 }, (_, i) => { const a = (i / n) * Math.PI * 2; return [0, Math.cos(a) * (r - ancho * 0.25), Math.sin(a) * (r - ancho * 0.25)]; });
  P.tubo(0x222226, aro, [ancho * 0.5, ancho * 0.5], { lados: 6, pasos: 1, grano: 0.14 });
  w.add(P.malla());
  const rayos = G(), R = new Pieza(), cant = ancho > 0.1 ? 6 : 10;
  for (let k = 0; k < cant; k++) { const a = (k / cant) * Math.PI * 2; R.tubo(0xb0b0b8, [[0, 0, 0], [0, Math.cos(a) * (r - ancho * 0.5), Math.sin(a) * (r - ancho * 0.5)]], [ancho > 0.1 ? 0.016 : 0.006, ancho > 0.1 ? 0.016 : 0.006], { lados: 3, pasos: 1, brillo: 1 }); }
  R.tubo(0x6a6a70, [[-ancho * 0.6, 0, 0], [ancho * 0.6, 0, 0]], [r * 0.14, r * 0.14], { lados: 8, pasos: 1, brillo: 1 });
  rayos.add(R.malla()); w.add(rayos); w.userData.rayos = rayos;
  return w;
}
