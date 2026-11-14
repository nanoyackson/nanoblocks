// Las leyendas ticas (v9.6), con el kit low-poly: el Cadejos, la Segua, el Padre sin Cabeza, la Llorona, la Carreta sin Bueyes, el
// Duende, la Mona y el Viejo del Monte. Son lo más propio del juego, así que llevan el mayor detalle.
import * as THREE from 'three';
import { Pieza, cubico, huevo } from './lowpoly.js';
import { pata, brasa } from './modelos-bravos.js';

const G = () => new THREE.Group();
// un mechón de pelo: sale de un punto y cae abriéndose
const mechon = (P, color, x, y, z, dx, dy, dz, r = 0.06) => P.tubo(color, [[x, y, z], [x + dx * 0.55, y + dy * 0.55, z + dz * 0.55], [x + dx, y + dy, z + dz]], [r, r * 0.7, r * 0.1], { lados: 4, pasos: 2, grano: 0.24 });
// un brazo de manga que cuelga de su hombro
function manga(padre, x, y, z, color, largo, r, mano) {
  const a = G(), P = new Pieza(); a.position.set(x, y, z);
  P.tubo(color, [[0, 0.04, 0], [0, -largo * 0.5, 0], [0, -largo, 0.01]], [r * 0.85, r, r * 1.2], { lados: 8, pasos: 2, grano: 0.14 });
  if (mano) mano(P, largo);
  a.add(P.malla()); padre.add(a);
  return a;
}
// lo que es espanto brilla solo y se dibuja medio transparente
function espectro(g, opacidad, orden, r, gr, b) {
  g.traverse((o) => { if (!o.isMesh) return; o.material.transparent = true; o.material.opacity = opacidad; o.material.depthWrite = false; o.material.color.setRGB(r, gr, b); o.userData.glow = true; o.renderOrder = orden; });
}

export function armarCadejos(blanco) {
  const PEL = blanco ? 0xdcdcd8 : 0x141418, OSC = blanco ? 0xb8b8b0 : 0x08080a, OJO = blanco ? 0x66ccff : 0xff2200;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // un perrazo más alto que un ternero: lomo arqueado y pecho enorme
  P.bulto(PEL, 0.42, 0.42, 0.84, { y: 1.06, det: 4, grano: 0.3, forma: huevo(0.16) });
  P.bulto(PEL, 0.46, 0.5, 0.36, { y: 1.16, z: 0.56, det: 3, grano: 0.3 });
  // la crin erizada, del cogote a la cola
  for (let i = 0; i < 22; i++) { const z = 0.82 - i * 0.075, y = 1.5 - Math.abs(i - 6) * 0.012, l = 0.2 + (i % 3) * 0.08, d = (i % 2 ? 0.06 : -0.06); mechon(P, blanco ? 0xf4f4f0 : 0x060608, d, y, z, d * 0.8, l, -0.16, 0.055); }
  // y el pelo que cuelga de la panza
  for (let i = 0; i < 16; i++) { const a = i * 2.399, x = Math.cos(a) * 0.32, z = -0.5 + (i / 15) * 1.1; mechon(P, OSC, x, 0.72, z, x * 0.2, -0.2, -0.04, 0.05); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.4, 0.85); body.add(head);
  const C = new Pieza();
  C.bulto(PEL, 0.32, 0.3, 0.3, { y: 0.05, z: 0.2, det: 3, grano: 0.3 });
  C.tubo(OSC, [[0, -0.04, 0.4], [0, -0.1, 0.62], [0, -0.13, 0.82]], [0.2, 0.16, 0.12], { lados: 8, pasos: 2, grano: 0.2 });
  C.bulto(0x0c0c0e, 0.07, 0.05, 0.04, { y: -0.1, z: 0.9, det: 2, brillo: 1.2 });
  // la mandíbula abierta, la lengua y los colmillos
  C.bulto(OSC, 0.13, 0.04, 0.24, { y: -0.3, z: 0.66, det: 2, grano: 0.2 });
  C.bulto(blanco ? 0xd88a9a : 0xa01818, 0.08, 0.02, 0.24, { y: -0.27, z: 0.72, det: 1, amb: 0.9 });
  for (const s of [-1, 1]) {
    C.tubo(0xf4f0e0, [[s * 0.1, -0.16, 0.76], [s * 0.1, -0.33, 0.78]], [0.035, 0.004], { lados: 4, pasos: 1, amb: 0.95 });
    C.tubo(0xf4f0e0, [[s * 0.08, -0.3, 0.72], [s * 0.08, -0.17, 0.72]], [0.025, 0.004], { lados: 4, pasos: 1, amb: 0.95 });
    C.tubo(PEL, [[s * 0.2, 0.26, 0.08], [s * 0.27, 0.48, 0.03], [s * 0.3, 0.62, -0.02]], [0.09, 0.06, 0.006], { lados: 5, grano: 0.24 });
    C.tubo(OSC, [[s * 0.1, 0.24, 0.47], [s * 0.2, 0.2, 0.42]], [0.035, 0.03], { lados: 4, pasos: 1 }); // el ceño
  }
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(OJO, 0.07, s * 0.16, 0.13, 0.45, 0.7));
  // las patas terminan en cascos de cabra (así lo cuentan los abuelos)
  const casco = (Q, f) => { Q.bulto(blanco ? 0x9a9690 : 0x4a4038, 0.15, 0.08, 0.16, { x: f[0], y: f[1] + 0.05, z: f[2] + 0.01, det: 2, brillo: 0.7 }); Q.tubo(0x2a2420, [[f[0], f[1], f[2] + 0.17], [f[0], f[1] + 0.13, f[2] + 0.17]], [0.016, 0.016], { lados: 3, pasos: 1 }); };
  const legs = [[-0.25, 0.55], [0.25, 0.55], [-0.25, -0.55], [0.25, -0.55]].map(([x, z], i) => pata(body, x, 0.8, z, i < 2 ? [[0, 0.06, 0], [0, -0.32, 0.02], [0, -0.78, 0]] : [[0, 0.1, 0], [0, -0.28, -0.14], [0, -0.78, 0]], [0.2, 0.13, 0.11], PEL, casco, { grano: 0.3 }));
  const tail = G(); tail.position.set(0, 1.25, -0.78); body.add(tail);
  const T = new Pieza();
  T.tubo(PEL, [[0, 0, 0], [0, 0.16, -0.36], [0, 0.1, -0.74]], [0.1, 0.13, 0.02], { lados: 7, grano: 0.34 });
  tail.add(T.malla());
  // las cadenas que arrastra el negro
  const chains = [];
  if (!blanco) for (const sx of [-0.46, 0.46]) {
    const c = G(), K = new Pieza(); c.position.set(sx, 1.2, 0.5);
    for (let i = 0; i < 8; i++) { const y = -i * 0.13, aro = Array.from({ length: 9 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return i % 2 ? [0, y + Math.sin(a) * 0.08, Math.cos(a) * 0.05] : [Math.cos(a) * 0.05, y + Math.sin(a) * 0.08, 0]; }); K.tubo(i % 2 ? 0x5a5a60 : 0x7a7a80, aro, [0.015, 0.015], { lados: 3, pasos: 1, brillo: 1 }); }
    c.add(K.malla()); body.add(c); chains.push(c);
  }
  g.userData = { body, head, legs, tail, chains };
  return g;
}

export function armarSegua() {
  const VESTIDO = 0xf0ece0, PIEL = 0xe0b898, PELO = 0x161210, HUESO = 0xd8cfb4;
  const CINTAS = [0xc82832, 0xf0be28, 0x285abe, 0x289646];
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // la enagua del traje típico, con sus cintas de colores
  P.tubo(VESTIDO, [[0, 1.12, 0], [0, 0.7, 0], [0, 0.02, 0]], [0.24, 0.36, 0.56], { lados: 16, pasos: 6, grano: 0.1, pliegue: (a, t) => 1 + Math.sin(a * 8) * 0.08 * t, pinta: (u) => {
    const f = u.x * 9;
    if (f > 6 && f < 6.45) return CINTAS[0];
    if (f > 6.8 && f < 7.25) return CINTAS[1];
    if (f > 7.6 && f < 8.05) return CINTAS[2];
    if (f > 8.4 && f < 8.85) return CINTAS[3];
    return null;
  } });
  // la blusa y los hombros descubiertos
  P.bulto(VESTIDO, 0.25, 0.3, 0.16, { y: 1.34, det: 3, grano: 0.1, pinta: (u) => (u.y > 0.6 ? PIEL : u.y > 0.42 ? CINTAS[0] : null) });
  P.tubo(PIEL, [[0, 1.54, 0], [0, 1.66, 0]], [0.09, 0.08], { lados: 7, pasos: 1 });
  body.add(P.malla());
  const mano = (Q, L) => Q.bulto(PIEL, 0.07, 0.08, 0.06, { y: -L - 0.05, det: 1 });
  const arms = [-0.33, 0.33].map((sx) => manga(body, sx, 1.6, 0, PIEL, 0.56, 0.07, mano));
  // la mujer bonita, para engañar
  const woman = G(); woman.position.set(0, 1.62, 0); body.add(woman);
  const W = new Pieza();
  W.bulto(PIEL, 0.2, 0.22, 0.2, { y: 0.21, det: 3, grano: 0.06, forma: cubico(0.72), pinta: (u) => (u.y > 0.42 || u.z < -0.25 || (Math.abs(u.x) > 0.72 && u.y > 0) ? PELO : null) });
  W.bulto(PELO, 0.22, 0.42, 0.09, { y: -0.08, z: -0.18, det: 2, grano: 0.2 });
  for (const s of [-1, 1]) {
    mechon(W, PELO, s * 0.19, 0.34, -0.03, s * 0.06, -0.62, -0.08, 0.06);
    W.bulto(0xf4f0e8, 0.042, 0.028, 0.012, { x: s * 0.085, y: 0.25, z: 0.196, det: 1, amb: 1 });
    W.bulto(0x2a1a10, 0.022, 0.026, 0.012, { x: s * 0.085, y: 0.25, z: 0.206, det: 1, amb: 0.9 });
    W.tubo(0x0a0806, [[s * 0.13, 0.285, 0.19], [s * 0.04, 0.3, 0.205]], [0.008, 0.008], { lados: 3, pasos: 1 }); // pestañas
    W.bulto(0xe89090, 0.035, 0.022, 0.008, { x: s * 0.13, y: 0.16, z: 0.19, det: 1 }); // chapas
  }
  W.tubo(0xc8202a, [[-0.05, 0.11, 0.2], [0, 0.095, 0.215], [0.05, 0.11, 0.2]], [0.012, 0.018, 0.012], { lados: 4, pasos: 2 }); // labios
  // la flor roja en el pelo
  for (let i = 0; i < 6; i++) { const a = i * 1.05; W.bulto(0xd81830, 0.045, 0.045, 0.02, { x: 0.17 + Math.cos(a) * 0.05, y: 0.39 + Math.sin(a) * 0.05, z: 0.12, det: 1, amb: 0.95 }); }
  W.bulto(0xf0c040, 0.025, 0.025, 0.02, { x: 0.17, y: 0.39, z: 0.14, det: 1, amb: 1 });
  woman.add(W.malla());
  // la cabeza de yegua descarnada, que aparece al transformarse
  const horse = G(); horse.position.set(0, 1.62, 0); horse.visible = false; body.add(horse);
  const H = new Pieza();
  H.bulto(HUESO, 0.2, 0.24, 0.26, { y: 0.2, z: 0.1, det: 3, grano: 0.16, pinta: (u) => (Math.hypot(Math.abs(u.x) - 0.72, u.y - 0.1) < 0.3 && u.z > 0 ? 0x0a0806 : null) });
  H.tubo(HUESO, [[0, 0.14, 0.28], [0, 0.06, 0.54], [0, 0.0, 0.76]], [0.17, 0.12, 0.1], { lados: 7, pasos: 2, grano: 0.2, pinta: (u) => (u.x > 0.8 ? 0xb8ae94 : null) });
  H.bulto(HUESO, 0.09, 0.03, 0.26, { y: -0.13, z: 0.56, det: 2, grano: 0.2 });
  for (const s of [-1, 1]) {
    H.bulto(0x1a1410, 0.03, 0.03, 0.012, { x: s * 0.05, y: 0.03, z: 0.85, det: 1 });
    for (let k = 0; k < 6; k++) { const z = 0.42 + k * 0.07, x = s * (0.095 - k * 0.004); H.tubo(0xf4eedc, [[x, -0.05, z], [x, -0.12, z]], [0.026, 0.012], { lados: 3, pasos: 1, amb: 0.95 }); }
  }
  for (let i = 0; i < 10; i++) mechon(H, PELO, (i % 2 ? 0.02 : -0.02), 0.42 - i * 0.05, -0.04 - i * 0.03, (i % 2 ? 0.08 : -0.08), -0.32, -0.08, 0.05); // la crin
  horse.add(H.malla());
  for (const s of [-1, 1]) horse.add(brasa(0xff3010, 0.05, s * 0.19, 0.24, 0.2, 0.8));
  // los cascos que asoman bajo el vestido
  const cascos = G(), Ca = new Pieza(); cascos.visible = false;
  for (const sx of [-0.13, 0.13]) Ca.bulto(0x3a3430, 0.1, 0.07, 0.13, { x: sx, y: 0.06, z: 0.1, det: 2, brillo: 0.6 });
  cascos.add(Ca.malla()); body.add(cascos);
  const legs = [-0.12, 0.12].map((sx) => { const l = G(); l.position.set(sx, 0.4, 0); body.add(l); return l; });
  g.userData = { body, woman, horse, head: woman, legs, arms, cascos };
  return g;
}

export function armarPadre() {
  const SOTANA = 0x16161c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.tubo(SOTANA, [[0, 0, 0], [0, 0.7, 0], [0, 1.4, 0]], [0.38, 0.3, 0.26], { lados: 14, pasos: 2, grano: 0.12, pliegue: (a, t) => 1 + Math.sin(a * 7) * 0.08 * (1 - t) });
  P.bulto(SOTANA, 0.34, 0.14, 0.24, { y: 1.42, det: 3, grano: 0.12 });
  // los botones de la sotana
  for (let i = 0; i < 9; i++) P.bulto(0x2e2e38, 0.018, 0.018, 0.012, { y: 1.3 - i * 0.12, z: 0.28 + i * 0.008, det: 0 });
  // el cuello blanco… y lo que queda encima
  P.tubo(0xf0f0f0, [[0, 1.5, 0], [0, 1.58, 0]], [0.15, 0.14], { lados: 10, pasos: 1, amb: 0.95 });
  P.tubo(0x8a1010, [[0, 1.58, 0], [0, 1.61, 0]], [0.12, 0.09], { lados: 10, pasos: 1, brillo: 0.9 });
  P.bulto(0xd0c8b8, 0.04, 0.03, 0.04, { y: 1.615, det: 1, amb: 1 });
  // el rosario, con su cruz
  const cuentas = [];
  for (let k = 0; k < 13; k++) { const x = Math.sin(k * 0.45) * 0.14, y = 1.5 - k * 0.055, z = 0.2 + k * 0.006; P.bulto(0xf0ece0, 0.02, 0.02, 0.02, { x, y, z, det: 0, amb: 1 }); cuentas.push(y); }
  P.tubo(0xf0ece0, [[0, 0.88, 0.28], [0, 0.72, 0.29]], [0.016, 0.016], { lados: 4, pasos: 1, amb: 1 });
  P.tubo(0xf0ece0, [[-0.05, 0.84, 0.285], [0.05, 0.84, 0.285]], [0.016, 0.016], { lados: 4, pasos: 1, amb: 1 });
  body.add(P.malla());
  const mano = (Q, L) => Q.bulto(0xc8c0b0, 0.06, 0.07, 0.055, { y: -L - 0.04, det: 1 });
  const arms = [-0.4, 0.4].map((sx) => manga(body, sx, 1.45, 0, SOTANA, 0.62, 0.11, mano));
  // la candela en la mano
  const Cn = new Pieza();
  Cn.tubo(0xf0e8d0, [[0, -0.72, 0.12], [0, -0.48, 0.12]], [0.035, 0.032], { lados: 7, pasos: 1, amb: 1 });
  arms[1].add(Cn.malla(), brasa(0xffc040, 0.045, 0, -0.42, 0.12, 1.5));
  arms[1].rotation.x = -0.9;
  // un fantasma: brilla apenas, para verse en la oscuridad sin dejar de ser negro
  g.traverse((o) => { if (!o.isMesh) return; if (!o.userData.glow) o.material.color.multiplyScalar(1.6); o.userData.glow = true; });
  const legs = [-0.1, 0.1].map((x) => { const l = G(); l.position.set(x, 0.4, 0); body.add(l); return l; });
  g.userData = { body, legs, arms };
  return g;
}

export function armarLlorona() {
  const VELO = 0xdce6ec, PELO = 0x12121a, PIEL = 0xd0d4dc;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el vestido largo que se deshace abajo
  P.tubo(VELO, [[0, 1.42, 0], [0, 0.8, 0], [0, 0.14, -0.03]], [0.25, 0.32, 0.46], { lados: 14, pasos: 3, grano: 0.1, pliegue: (a, t) => 1 + Math.sin(a * 7 + t * 4) * 0.09 * t });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = 0.42, L = 0.16 + (i % 4) * 0.05; P.tubo(i % 2 ? VELO : 0xc8d4dc, [[Math.cos(a) * r, 0.2, Math.sin(a) * r - 0.03], [Math.cos(a) * (r + 0.04), 0.2 - L * 0.5, Math.sin(a) * (r + 0.04) - 0.03], [Math.cos(a) * (r + 0.1), 0.2 - L, Math.sin(a) * (r + 0.1) - 0.03]], [0.1, 0.07, 0.006], { lados: 4, pasos: 2 }); }
  P.tubo(PIEL, [[0, 1.44, 0], [0, 1.62, 0]], [0.085, 0.075], { lados: 7, pasos: 1 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.62, 0); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.19, 0.22, 0.19, { y: 0.21, det: 3, grano: 0.06, forma: cubico(0.75), pinta: (u) => (u.y > 0.35 || u.z < -0.25 || (Math.abs(u.x) > 0.7 && u.y > -0.3) ? PELO : null) });
  // el pelo largo, mojado, que le tapa media cara
  C.bulto(PELO, 0.22, 0.5, 0.08, { y: -0.14, z: -0.18, det: 2, grano: 0.2 });
  for (let i = 0; i < 9; i++) { const x = -0.17 + i * 0.042; mechon(C, PELO, x, 0.42, 0.18 - Math.abs(x) * 0.2, x * 0.2, -0.28 - (i % 3) * 0.1 - Math.abs(x) * 1.1, 0.02, 0.03); }
  for (const s of [-1, 1]) {
    C.bulto(0x14141e, 0.05, 0.04, 0.012, { x: s * 0.085, y: 0.24, z: 0.19, det: 1, amb: 0.9 });
    C.tubo(0x78a0dc, [[s * 0.085, 0.21, 0.2], [s * 0.09, 0.08, 0.2]], [0.012, 0.018], { lados: 4, pasos: 1, brillo: 1.3, amb: 1 }); // las lágrimas
  }
  C.tubo(0x2a2a3a, [[-0.05, 0.08, 0.195], [0, 0.11, 0.205], [0.05, 0.08, 0.195]], [0.008, 0.012, 0.008], { lados: 3, pasos: 2 }); // la boca torcida de llanto
  head.add(C.malla());
  const mano = (Q, L) => { Q.bulto(PIEL, 0.06, 0.08, 0.05, { y: -L - 0.05, det: 1 }); for (const d of [-1, 0, 1]) Q.tubo(PIEL, [[d * 0.03, -L - 0.1, 0.01], [d * 0.035, -L - 0.22, 0.03]], [0.014, 0.004], { lados: 3, pasos: 1 }); };
  const arms = [-0.36, 0.36].map((sx) => manga(body, sx, 1.42, 0, VELO, 0.58, 0.09, mano));
  // pálida como un fantasma; se dibuja después del agua, para verse cuando flota sobre el río
  espectro(g, 0.82, 8, 1.15, 1.2, 1.3);
  g.userData = { body, head, arms };
  return g;
}

export function armarCarreta() {
  const ROJO = 0xb82424, AMARILLO = 0xf0c828, AZUL = 0x285ac8, MADERA = 0x6a4626;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // la caja pintada a la tica: tablas, franjas y puntas de estrella
  const pinta = (u) => { const f = u.y * 4 + 9, b = f - Math.floor(f); if (b < 0.14) return AMARILLO; const d = Math.sin(u.z * 18) * Math.sin(u.y * 15); return d > 0.72 ? AZUL : d < -0.72 ? 0xf0f0f0 : null; };
  P.bulto(ROJO, 0.65, 0.35, 0.95, { y: 1, det: 4, grano: 0.1, forma: cubico(0.3), pinta });
  P.bulto(MADERA, 0.7, 0.06, 1, { y: 0.62, det: 2, grano: 0.2, forma: cubico(0.3) });
  // el techo de cuero en arco
  for (let i = 0; i < 5; i++) { const z = -0.8 + i * 0.4, arco = [[-0.65, 1.32, z], [-0.45, 1.75, z], [0, 1.92, z], [0.45, 1.75, z], [0.65, 1.32, z]]; P.tubo(MADERA, arco, [0.03, 0.03, 0.03, 0.03, 0.03], { lados: 4 }); }
  // la lanza y el yugo… sin bueyes
  P.tubo(MADERA, [[0, 0.72, 0.9], [0, 0.72, 1.7], [0, 0.8, 2.6]], [0.07, 0.06, 0.05], { lados: 6, grano: 0.2 });
  P.tubo(MADERA, [[-0.7, 0.92, 2.65], [-0.34, 0.84, 2.65], [0.34, 0.84, 2.65], [0.7, 0.92, 2.65]], [0.05, 0.08, 0.08, 0.05], { lados: 6, grano: 0.2, pinta: (u) => (Math.sin(u.x * 30) > 0.5 ? AMARILLO : null) });
  body.add(P.malla());
  // las ruedas grandes pintadas, con su estrella
  const ruedas = [-1, 1].map((sx) => {
    const w = G(), R = new Pieza(); w.position.set(sx * 0.78, 0.62, 0);
    R.bulto(0xc83030, 0.06, 0.62, 0.62, { det: 4, grano: 0.06, pinta: (u) => {
      const r = Math.hypot(u.y, u.z), a = Math.atan2(u.y, u.z);
      if (r > 0.85) return 0x2a1e14;
      if (r < 0.16) return AMARILLO;
      const rayo = Math.cos(a * 8);
      return rayo > 0.4 + r * 0.3 ? AMARILLO : rayo < -0.75 ? AZUL : null;
    } });
    R.tubo(0x4a3220, [[-sx * 0.1, 0, 0], [sx * 0.1, 0, 0]], [0.1, 0.1], { lados: 8, pasos: 1 });
    w.add(R.malla()); body.add(w); return w;
  });
  // es un espanto: medio transparente, azulada y brillando sola
  espectro(g, 0.78, 7, 0.75, 0.85, 1.1);
  g.userData = { body, ruedas };
  return g;
}

export function armarDuende() {
  const VERDE = 0x3a7a34, PIEL = 0xe0b080, ROJO = 0xb81c1c;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(VERDE, 0.17, 0.19, 0.13, { y: 0.39, det: 3, grano: 0.14, forma: huevo(0) });
  P.tubo(0x3a2414, [[0, 0.29, 0], [0, 0.33, 0]], [0.16, 0.165], { lados: 8, pasos: 1, pliegue: (a) => (Math.abs(Math.sin(a)) > 0.7 ? 0.82 : 1), brillo: 0.5 });
  P.bulto(0xe0b840, 0.045, 0.035, 0.015, { y: 0.31, z: 0.145, det: 1, brillo: 1.3 }); // la hebilla
  body.add(P.malla());
  const head = G(); head.position.set(0, 0.56, 0.02); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.15, 0.14, 0.14, { y: 0.14, det: 3, grano: 0.08 });
  C.bulto(0xc87a5a, 0.05, 0.05, 0.055, { y: 0.13, z: 0.17, det: 2, brillo: 0.5 }); // la nariz de papa
  // la barba blanca, en mechones
  for (let i = 0; i < 9; i++) { const x = -0.11 + i * 0.0275; mechon(C, 0xeeeeea, x, 0.1, 0.13 - Math.abs(x) * 0.25, x * 0.3, -0.18 - (1 - Math.abs(x) * 7) * 0.08, 0.02, 0.035); }
  for (const s of [-1, 1]) {
    C.bulto(0xffffff, 0.03, 0.026, 0.012, { x: s * 0.065, y: 0.19, z: 0.135, det: 1, amb: 1 });
    C.bulto(0x1a1410, 0.016, 0.02, 0.01, { x: s * 0.06, y: 0.19, z: 0.144, det: 1, amb: 0.9 });
    C.tubo(0xeeeeea, [[s * 0.11, 0.24, 0.13], [s * 0.03, 0.225, 0.15]], [0.012, 0.012], { lados: 3, pasos: 1 }); // las cejas pícaras
    C.tubo(PIEL, [[s * 0.13, 0.15, 0], [s * 0.26, 0.26, -0.05]], [0.05, 0.005], { lados: 4, pasos: 1 }); // las orejas puntiagudas
  }
  // el gorro rojo en punta, doblado, con su campanita
  C.tubo(ROJO, [[0, 0.24, 0], [0, 0.42, -0.03], [0, 0.56, -0.12], [0.02, 0.56, -0.28]], [0.165, 0.11, 0.06, 0.02], { lados: 8, pasos: 3, grano: 0.14 });
  C.tubo(0xf0e0b0, [[0, 0.24, 0], [0, 0.28, 0]], [0.165, 0.16], { lados: 8, pasos: 1 });
  C.bulto(0xf0c040, 0.032, 0.032, 0.032, { x: 0.02, y: 0.54, z: -0.31, det: 1, brillo: 1.3 });
  head.add(C.malla());
  const bota = (Q, f) => { Q.bulto(0x3a2414, 0.07, 0.04, 0.1, { x: f[0], y: f[1] + 0.02, z: f[2] + 0.03, det: 2, brillo: 0.5 }); Q.tubo(0x3a2414, [[f[0], f[1] + 0.03, f[2] + 0.11], [f[0], f[1] + 0.08, f[2] + 0.16]], [0.03, 0.006], { lados: 4, pasos: 1 }); };
  const legs = [-0.08, 0.08].map((x) => pata(body, x, 0.24, 0, [[0, 0.03, 0], [0, -0.1, 0], [0, -0.22, 0]], [0.065, 0.05, 0.05], 0x6a4626, bota));
  const mano = (Q, L) => Q.bulto(PIEL, 0.04, 0.04, 0.04, { y: -L - 0.02, det: 1 });
  const arms = [-0.2, 0.2].map((x) => manga(body, x, 0.5, 0, VERDE, 0.24, 0.05, mano));
  // el saco del botín
  const S = new Pieza();
  S.bulto(0xb89a6a, 0.12, 0.13, 0.1, { det: 2, grano: 0.24, forma: (v) => { if (v.y > 0) { v.x *= 1 - v.y * 0.4; v.z *= 1 - v.y * 0.4; } } });
  S.tubo(0x6a4a2a, [[0, 0.11, 0], [0, 0.15, 0]], [0.05, 0.07], { lados: 6, pasos: 1 });
  const saco = S.malla(); saco.position.set(0, 0.42, -0.2); body.add(saco);
  g.userData = { body, head, legs, arms, saco, tail: null };
  return g;
}

export function armarMona() {
  const PELO = 0x2a2420, GRIS = 0x3a3a3a, CARA = 0xc8aa96, REBOZO = 0x6a2a4a;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // jorobada y peluda, con el rebozo de la bruja que fue
  P.bulto(PELO, 0.38, 0.42, 0.3, { y: 0.95, z: -0.05, det: 4, rot: [0.35, 0, 0], grano: 0.34 });
  P.bulto(REBOZO, 0.4, 0.16, 0.33, { y: 1.24, z: -0.08, det: 3, grano: 0.2, pinta: (u) => (Math.sin(u.x * 18) > 0.7 ? 0x4a1a34 : null) });
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; mechon(P, REBOZO, Math.cos(a) * 0.36, 1.16, -0.08 + Math.sin(a) * 0.3, Math.cos(a) * 0.06, -0.16, Math.sin(a) * 0.06, 0.03); }
  for (let i = 0; i < 18; i++) { const a = i * 2.399, r = 0.24 + (i % 3) * 0.05, y = 0.7 + (i % 5) * 0.08; mechon(P, 0x1a1614, Math.cos(a) * r, y, Math.sin(a) * r - 0.05, Math.cos(a) * 0.1, -0.16, Math.sin(a) * 0.1, 0.05); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.32, 0.22); body.add(head);
  const C = new Pieza();
  C.bulto(PELO, 0.23, 0.22, 0.2, { y: 0.03, det: 3, grano: 0.3 });
  C.bulto(CARA, 0.15, 0.15, 0.06, { y: 0.01, z: 0.15, det: 3, grano: 0.14, pinta: (u) => (Math.sin(u.y * 17 + u.x * 4) > 0.7 ? 0xa88a78 : null) }); // arrugas
  // la nariz ganchuda, con su verruga
  C.tubo(CARA, [[0, 0.06, 0.2], [0, 0.03, 0.31], [0, -0.05, 0.33]], [0.05, 0.04, 0.014], { lados: 6 });
  C.bulto(0x7a5a48, 0.016, 0.016, 0.014, { x: 0.03, y: 0.02, z: 0.31, det: 1 });
  C.bulto(0x2a1010, 0.09, 0.022, 0.015, { y: -0.1, z: 0.205, det: 1, amb: 0.9 });
  for (const s of [-1, 1]) {
    C.tubo(0xf4f0e0, [[s * 0.05, -0.09, 0.215], [s * 0.05, -0.17, 0.22]], [0.016, 0.003], { lados: 3, pasos: 1, amb: 0.95 });
    C.tubo(0x1a1412, [[s * 0.16, 0.13, 0.19], [s * 0.05, 0.08, 0.215]], [0.018, 0.016], { lados: 3, pasos: 1 }); // el ceño
  }
  // las greñas
  for (let i = 0; i < 12; i++) { const x = -0.2 + i * 0.036; mechon(C, GRIS, x, 0.22, -0.02, x * 0.8, -0.34 - (i % 3) * 0.1, -0.12, 0.05); }
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0xffd030, 0.038, s * 0.095, 0.06, 0.2, 0.75));
  const mano = (Q, L) => { Q.bulto(CARA, 0.09, 0.08, 0.09, { y: -L - 0.05, det: 1 }); for (const d of [-1, 0, 1]) Q.tubo(0x2a2018, [[d * 0.05, -L - 0.1, 0.03], [d * 0.06, -L - 0.2, 0.09]], [0.018, 0.003], { lados: 3, pasos: 1 }); };
  const arms = [-0.45, 0.45].map((x) => manga(body, x, 1.15, 0.1, PELO, 0.86, 0.09, mano));
  const legs = [-0.18, 0.18].map((x) => pata(body, x, 0.55, -0.05, [[0, 0.05, 0], [0, -0.22, 0.09], [0, -0.53, 0]], [0.15, 0.11, 0.09], PELO, (Q, f) => Q.bulto(CARA, 0.1, 0.05, 0.15, { x: f[0], y: f[1] + 0.03, z: f[2] + 0.05, det: 1 }), { grano: 0.34 }));
  g.userData = { body, head, arms, legs, tail: null };
  return g;
}

export function armarViejoMonte() {
  const CORTEZA = 0x4a3622, OSC = 0x2e2014, MUSGO = 0x3a6a22, CLARO = 0x6aa83c;
  const corteza = (u) => (Math.sin(Math.atan2(u.z, u.x) * 11 + u.y * 3) > 0.45 ? OSC : u.y > 0.5 && Math.sin(u.x * 13) > 0 ? MUSGO : null);
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(CORTEZA, 0.5, 0.64, 0.36, { y: 1.45, det: 4, grano: 0.2, pinta: corteza });
  // el musgo que le cae de los hombros y los hongos de repisa
  P.bulto(MUSGO, 0.58, 0.18, 0.42, { y: 2.02, det: 3, grano: 0.5, pinta: (u) => (Math.sin(u.x * 9) * Math.sin(u.z * 9) > 0.3 ? CLARO : null) });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; mechon(P, MUSGO, Math.cos(a) * 0.52, 1.94, Math.sin(a) * 0.38, Math.cos(a) * 0.05, -0.3 - (i % 3) * 0.14, Math.sin(a) * 0.05, 0.05); }
  for (const [x, y, z] of [[0.36, 1.2, 0.24], [0.42, 1.34, 0.14], [-0.38, 1.52, 0.22]]) P.bulto(0xc8a060, 0.11, 0.03, 0.09, { x, y, z, det: 2, grano: 0.2, forma: (v) => { if (v.y < 0) v.y *= 0.3; } });
  body.add(P.malla());
  const head = G(); head.position.set(0, 2.1, 0.05); body.add(head);
  const C = new Pieza();
  C.tubo(CORTEZA, [[0, 0, 0], [0, 0.28, 0], [0, 0.56, -0.02]], [0.33, 0.32, 0.28], { lados: 10, pasos: 2, grano: 0.2, pliegue: (a) => 1 + Math.sin(a * 9) * 0.05 });
  // el corte del tocón, con sus anillos
  for (const r of [0.26, 0.18, 0.1]) C.tubo(r === 0.18 ? 0xb89a68 : 0x9a7a4e, [[0, 0.57, -0.02], [0, 0.585, -0.02]], [r, r], { lados: 10, pasos: 1 });
  // la cara tallada en la madera
  C.bulto(OSC, 0.13, 0.04, 0.03, { y: 0.17, z: 0.3, det: 1, amb: 0.8 });
  C.bulto(CORTEZA, 0.05, 0.08, 0.06, { y: 0.26, z: 0.32, det: 2, grano: 0.2 });
  for (const s of [-1, 1]) C.tubo(OSC, [[s * 0.25, 0.42, 0.26], [s * 0.05, 0.36, 0.32]], [0.04, 0.035], { lados: 4, pasos: 1 });
  // la barba de bejucos
  for (let i = 0; i < 14; i++) { const x = -0.26 + i * 0.04; mechon(C, i % 3 ? MUSGO : 0x2e5a1c, x, 0.1, 0.27 - Math.abs(x) * 0.2, x * 0.2, -0.7 - (i % 4) * 0.14, 0.03, 0.05); }
  // los cuernos de ramas, con sus hojas
  for (const s of [-1, 1]) {
    C.tubo(CORTEZA, [[s * 0.22, 0.5, 0], [s * 0.42, 0.86, -0.04], [s * 0.5, 1.2, 0.04]], [0.07, 0.05, 0.012], { lados: 5, grano: 0.2 });
    C.tubo(CORTEZA, [[s * 0.38, 0.8, -0.03], [s * 0.2, 1.02, 0.03], [s * 0.16, 1.2, 0.08]], [0.04, 0.03, 0.008], { lados: 4 });
    C.tubo(CORTEZA, [[s * 0.46, 1, 0], [s * 0.68, 1.12, 0.02]], [0.03, 0.006], { lados: 4, pasos: 1 });
    for (const [x, y, z] of [[0.5, 1.26, 0.05], [0.16, 1.26, 0.09], [0.72, 1.14, 0.02]]) C.bulto(CLARO, 0.1, 0.08, 0.1, { x: s * x, y, z, det: 1, grano: 0.4 });
  }
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0x7aff5a, 0.055, s * 0.14, 0.3, 0.32, 0.7));
  const brazo = (x) => {
    const a = G(), A = new Pieza(); a.position.set(x, 1.85, 0);
    A.tubo(CORTEZA, [[0, 0.06, 0], [Math.sign(x) * 0.08, -0.5, 0.02], [0, -1.15, 0.05]], [0.17, 0.13, 0.12], { lados: 7, grano: 0.2 });
    // la mano de ramitas
    for (const d of [-1, -0.4, 0.3, 1]) A.tubo(OSC, [[d * 0.08, -1.18, 0.05], [d * 0.14, -1.42, 0.1], [d * 0.12, -1.58, 0.2]], [0.05, 0.035, 0.006], { lados: 4 });
    for (let i = 0; i < 4; i++) mechon(A, 0x2e5a1c, (i - 1.5) * 0.06, -0.3 - i * 0.14, 0.12, 0.02, -0.4, 0.02, 0.025);
    a.add(A.malla()); body.add(a); return a;
  };
  const arms = [brazo(-0.62), brazo(0.62)];
  const raiz = (Q, f) => { for (const a of [-1.2, -0.4, 0.4, 1.2, 2.8]) Q.tubo(OSC, [[f[0], f[1] + 0.1, f[2]], [f[0] + Math.sin(a) * 0.2, f[1] + 0.05, f[2] + Math.cos(a) * 0.2], [f[0] + Math.sin(a) * 0.42, f[1] + 0.02, f[2] + Math.cos(a) * 0.42]], [0.09, 0.06, 0.01], { lados: 4 }); };
  const legs = [-0.25, 0.25].map((x) => pata(body, x, 0.92, 0, [[0, 0.06, 0], [0, -0.42, 0.03], [0, -0.9, 0]], [0.2, 0.16, 0.17], CORTEZA, raiz, { grano: 0.2, pliegue: (a) => 1 + Math.sin(a * 5) * 0.08 }));
  g.userData = { body, head, arms, legs };
  return g;
}

export function armarTulevieja() {
  const TRAPO = 0x4a3e30, PIEL = 0xa89a88, TULE = 0xc8b070, PLUMA = 0x3e3024;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el vestido en jirones; de la cintura para abajo es pájaro
  P.tubo(TRAPO, [[0, 1.2, 0], [0, 0.8, 0], [0, 0.34, 0]], [0.2, 0.26, 0.3], { lados: 12, pasos: 2, grano: 0.2, pliegue: (a, t) => 1 + Math.sin(a * 6) * 0.1 * t });
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 0.28; mechon(P, i % 2 ? TRAPO : 0x2e261c, Math.cos(a) * r, 0.38, Math.sin(a) * r, Math.cos(a) * 0.08, -0.2 - (i % 3) * 0.06, Math.sin(a) * 0.08, 0.07); }
  // las patas de ave con garras
  for (const x of [-0.12, 0.12]) {
    P.tubo(0x6a5a3a, [[x, 0.4, 0], [x, 0.18, 0.02], [x, 0.04, 0.02]], [0.05, 0.035, 0.03], { lados: 5 });
    for (const a of [-0.6, 0, 0.6, Math.PI]) P.tubo(0x241c12, [[x, 0.04, 0.02], [x + Math.sin(a) * 0.12, 0.02, 0.02 + Math.cos(a) * 0.12], [x + Math.sin(a) * 0.18, -0.04, 0.02 + Math.cos(a) * 0.18]], [0.025, 0.018, 0.003], { lados: 3, pasos: 2 });
  }
  // un rebozo cruzado sobre el pecho
  P.bulto(0x6a5238, 0.22, 0.12, 0.17, { y: 1.12, det: 2, grano: 0.24 });
  body.add(P.malla());
  const head = G(); head.position.set(0, 1.3, 0.02); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.17, 0.17, 0.16, { y: 0.02, det: 3, grano: 0.2, pinta: (u) => (Math.sin(u.y * 19 + u.x * 5) > 0.72 ? 0x8a7a68 : null) });
  C.tubo(PIEL, [[0, 0.05, 0.14], [0, 0.0, 0.26], [0, -0.09, 0.27]], [0.05, 0.035, 0.01], { lados: 6 }); // la nariz ganchuda
  C.bulto(0x1a0c0c, 0.08, 0.02, 0.012, { y: -0.09, z: 0.155, det: 1, amb: 0.9 });
  for (let i = 0; i < 10; i++) { const x = -0.16 + i * 0.036; mechon(C, 0x8a8a84, x, 0.08, -0.08, x * 0.6, -0.36 - (i % 3) * 0.08, -0.06, 0.04); }
  // el sombrero de tule, ancho como una sombrilla
  C.bulto(TULE, 0.68, 0.04, 0.68, { y: 0.15, det: 4, grano: 0.16, forma: (v) => { const r = Math.hypot(v.x, v.z); v.y -= r * r * 1.6; }, pinta: (u) => { const r = Math.hypot(u.x, u.z) * 7; return r - Math.floor(r) < 0.4 ? 0xa08a54 : null; } });
  C.tubo(TULE, [[0, 0.13, 0], [0, 0.31, 0], [0, 0.43, 0]], [0.22, 0.2, 0.15], { lados: 10, pasos: 1, grano: 0.16 });
  C.bulto(TULE, 0.15, 0.04, 0.15, { y: 0.43, det: 2 });
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0xffd040, 0.032, s * 0.08, 0.05, 0.155, 0.8));
  const wings = [-1, 1].map((side) => {
    const p = G(), W = new Pieza(); p.position.set(side * 0.25, 1.1, -0.05);
    W.tubo(PLUMA, [[0, 0, 0.1], [side * 0.6, 0.03, 0.14], [side * 1.2, 0, 0.08]], [0.09, 0.07, 0.03], { lados: 6, grano: 0.2 });
    for (let k = 0; k < 9; k++) { const t = k / 8, L = 0.34 + Math.sin(t * Math.PI) * 0.1; W.bulto(k % 2 ? PLUMA : 0x2a2018, 0.08, 0.016, L, { x: side * (0.08 + k * 0.145), z: -L * 0.62, det: 1, rot: [0, side * t * 0.25, 0], grano: 0.2 }); }
    p.add(W.malla()); body.add(p); return { p, side };
  });
  g.userData = { body, head, wings, tail: null };
  return g;
}

export function armarSirena() {
  const PIEL = 0xe8c4a0, COLA = 0x2aa8a0, OSC = 0x1a8080, PELO = 0x1a3a2a;
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(PIEL, 0.17, 0.22, 0.11, { y: 0.78, det: 3, grano: 0.06, pinta: (u) => (u.y > 0.38 && u.y < 0.66 ? 0xe8e0f0 : null) });
  // las conchitas del collar
  for (let i = 0; i < 9; i++) { const a = -1.1 + i * 0.275; P.bulto(0xf0d8e0, 0.018, 0.018, 0.012, { x: Math.sin(a) * 0.13, y: 0.98 - Math.cos(a) * 0.05, z: 0.09 + Math.cos(a) * 0.02, det: 0, amb: 1 }); }
  body.add(P.malla());
  const head = G(); head.position.set(0, 1, 0); body.add(head);
  const C = new Pieza();
  C.bulto(PIEL, 0.145, 0.16, 0.14, { y: 0.15, det: 3, grano: 0.06, forma: cubico(0.75), pinta: (u) => (u.y > 0.4 || u.z < -0.2 || (Math.abs(u.x) > 0.72 && u.y > 0) ? PELO : null) });
  for (let i = 0; i < 12; i++) { const x = -0.15 + i * 0.027; mechon(C, i % 3 ? PELO : 0x2a5a42, x, 0.28, -0.1 - (1 - Math.abs(x) * 6) * 0.03, x * 0.8, -0.58 - (i % 4) * 0.08, -0.05, 0.04); }
  C.tubo(0xd85a6a, [[-0.035, 0.065, 0.14], [0, 0.058, 0.152], [0.035, 0.065, 0.14]], [0.008, 0.012, 0.008], { lados: 4, pasos: 2 });
  head.add(C.malla());
  for (const s of [-1, 1]) head.add(brasa(0x40e0d0, 0.028, s * 0.065, 0.16, 0.135, 0.8));
  const tail = G(); tail.position.set(0, 0.56, 0); body.add(tail);
  const T = new Pieza();
  // la cola de pescado, de escamas, que se curva hasta la aleta
  T.tubo(COLA, [[0, 0.06, 0], [0, -0.26, 0], [0, -0.52, 0.04], [0, -0.74, 0.1]], [0.16, 0.14, 0.09, 0.04], { lados: 10, pasos: 4, brillo: 0.9, grano: 0.1, pinta: (u) => { const f = u.x * 14; return f - Math.floor(f) < 0.3 ? OSC : null; } });
  tail.add(T.malla());
  // la aleta y las escamas brillan solas: ella sale de noche
  const F = new Pieza();
  for (const s of [-1, 1]) F.bulto(0x60e0d8, 0.17, 0.02, 0.1, { x: s * 0.13, y: -0.76, z: 0.105, det: 2, rot: [0, 0, s * 0.3], amb: 0.95, brillo: 0.8, pinta: (u) => (Math.sin(u.x * 18) > 0.3 ? 0x40c0b8 : null) });
  for (let k = 0; k < 7; k++) F.bulto(0x7af0e8, 0.02, 0.02, 0.012, { x: -0.08 + (k % 3) * 0.08, y: -0.06 - k * 0.075, z: 0.135 - k * 0.006, det: 0, amb: 1 });
  const aleta = F.malla(); aleta.userData.glow = true; tail.add(aleta);
  const arms = [-1, 1].map((s) => pata(body, s * 0.22, 0.98, 0, [[0, 0.02, 0], [0, -0.17, 0], [0, -0.34, 0.01]], [0.05, 0.04, 0.032], PIEL, (Q, f) => Q.bulto(PIEL, 0.04, 0.05, 0.035, { x: f[0], y: f[1] - 0.03, z: f[2], det: 1 })));
  g.userData = { body, head, tail, arms };
  return g;
}
