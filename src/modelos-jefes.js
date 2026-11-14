// Los modelos de los siete jefes (v8.7), con el kit low-poly. Cada armador devuelve el grupo con el userData que espera su pelea:
// patas, pinzas, cuernos, alas y demás son grupos aparte porque se mueven.
import * as THREE from 'three';
import { Pieza, aplastarPanza, huevo, bandas } from './lowpoly.js';

const G = () => new THREE.Group();
const pivotePata = (x, y, z, giroY, malla) => { const p = G(); p.position.set(x, y, z); p.rotation.y = giroY; p.add(malla); return p; };
// algo que brilla de noche: no lo oscurece la luz del mundo
const brilla = (color, r, x, y, z) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshBasicMaterial({ color })); m.position.set(x, y, z); m.userData.glow = true; return m; };

// ---------- la Reina Bananera ----------
export function armarReina() {
  const g = G(), body = G(); body.position.y = 0.42; g.add(body);
  const P = new Pieza();
  // el abdomen con la corona roja del lomo y las franjas doradas
  P.bulto(0x45291a, 0.34, 0.27, 0.46, { y: 0.1, z: -0.44, det: 4, forma: huevo(-0.2), grano: 0.18, brillo: 0.3, pinta: (u) => {
    if (u.y < 0.1) return null;
    if (Math.abs(Math.abs(u.x) - 0.42) < 0.06) return 0xd8a050;
    const b = u.z * 3 + Math.abs(u.x) * 2.6, f = b - Math.floor(b);
    return f < 0.3 && Math.abs(u.x) < 0.36 ? 0xb0200f : null;
  } });
  // el saco de huevos que carga atrás
  P.bulto(0xf0ead8, 0.2, 0.17, 0.19, { y: 0.14, z: -0.96, det: 3, grano: 0.22, amb: 0.75 });
  for (let i = 0; i < 7; i++) { const a = i * 2.399, r = 0.15; P.bulto(0xfffaf0, 0.05, 0.05, 0.05, { x: Math.cos(a) * r, y: 0.14 + Math.sin(a) * r * 0.8, z: -1 - (i % 3) * 0.03, det: 1, amb: 0.8 }); }
  const cef = new Pieza();
  cef.bulto(0x54341f, 0.26, 0.18, 0.27, { det: 3, brillo: 0.4, grano: 0.14, forma: aplastarPanza(0.7) });
  for (const [x, y, r] of [[0.17, 0.13, 0.026], [0.13, 0.05, 0.022], [0.05, 0.16, 0.024], [0.18, 0.06, 0.018]]) for (const s of [-1, 1]) cef.bulto(0x0a0a0c, r, r, r, { x: s * x, y, z: 0.235, det: 1, brillo: 1.4, amb: 0.9 });
  const cefM = cef.malla(); cefM.position.set(0, 0.04, 0.2);
  for (const s of [-1, 1]) cefM.add(brilla(0xff3020, 0.042, s * 0.08, 0.09, 0.25));
  body.add(P.malla(), cefM);
  const queli = [];
  for (const s of [-1, 1]) {
    const q = G(), Q = new Pieza(); q.position.set(s * 0.09, -0.08, 0.24);
    Q.bulto(0xc83018, 0.08, 0.13, 0.08, { y: -0.06, z: 0.03, det: 2, brillo: 0.9 });
    Q.tubo(0x1a0a08, [[0, -0.17, 0.05], [0, -0.26, 0.07], [-s * 0.05, -0.31, 0.03]], [0.03, 0.018, 0.004], { lados: 5, brillo: 1 });
    q.add(Q.malla()); cefM.add(q); queli.push(q);
  }
  const patas = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const L = i === 0 ? 0.74 : i === 3 ? 0.68 : 0.58, Q = new Pieza();
    Q.tubo(0x4a2c18, [[0, 0, 0], [L * 0.5, L * 0.58, 0], [L * 0.95, L * 0.34, 0], [L * 1.22, -0.46, 0]], [0.06, 0.05, 0.034, 0.012], { lados: 6, pinta: (u) => { const f = u.x * 4 - Math.floor(u.x * 4); return f < 0.16 ? 0xd8a050 : f < 0.28 ? 0xa01c10 : null; } });
    const piv = pivotePata(s * 0.22, 0.04, 0.3 - i * 0.14, s > 0 ? -0.55 + i * 0.37 : Math.PI + 0.55 - i * 0.37, Q.malla());
    body.add(piv); patas.push({ piv, i, s });
  }
  g.userData = { body, patas, cef: cefM, queli, babyScale: 1.6 };
  return g;
}

// ---------- Don Cornudo, el escarabajo Hércules ----------
export function armarCornudo() {
  const g = G(), body = G(); body.position.y = 0.6; g.add(body);
  const P = new Pieza();
  // los élitros oliva con las pintas negras, como el Hércules de verdad
  const pintas = [[0.45, 0.8, 0.3], [-0.5, 0.75, 0.1], [0.3, 0.85, -0.4], [-0.25, 0.9, -0.3], [0.65, 0.6, -0.4], [-0.65, 0.55, -0.45], [0.55, 0.65, 0.55], [-0.4, 0.7, 0.6], [0.2, 0.7, -0.7], [-0.15, 0.65, -0.75]].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  P.bulto(0x9a9a40, 0.68, 0.5, 0.86, { y: 0.08, z: -0.32, det: 4, forma: aplastarPanza(0.5), brillo: 1.3, grano: 0.06, pinta: (u) => {
    if (u.y > 0 && Math.abs(u.x) < 0.04) return 0x2a2410;
    for (const q of pintas) if (u.dot(q) > 0.982) return 0x1a1408;
    return null;
  } });
  P.bulto(0x181210, 0.52, 0.36, 0.38, { y: 0.15, z: 0.58, det: 4, forma: aplastarPanza(0.6), brillo: 1.4, grano: 0.04 });
  P.bulto(0x120e0c, 0.26, 0.17, 0.2, { y: 0.02, z: 0.94, det: 2, brillo: 0.8 });
  for (const s of [-1, 1]) P.bulto(0xc0a040, 0.055, 0.055, 0.045, { x: s * 0.2, y: 0.07, z: 1.05, det: 1, brillo: 1.5, amb: 0.9 });
  body.add(P.malla());
  // el cuerno de arriba, largo y curvo, con su barbita; y el de abajo, que sube a su encuentro
  const arriba = G(); arriba.position.set(0, 0.36, 0.7); body.add(arriba);
  const A = new Pieza();
  A.tubo(0x120e0c, [[0, 0, -0.14], [0, 0.12, 0.3], [0, 0.16, 0.76], [0, 0.04, 1.12], [0, -0.16, 1.32]], [0.15, 0.115, 0.085, 0.05, 0.006], { lados: 7, brillo: 1.2 });
  for (let i = 0; i < 16; i++) { const z = 0.22 + i * 0.044, r = (i * 37) % 5; A.tubo(0x8a5a2a, [[(r - 2) * 0.022, 0.05, z], [(r - 2) * 0.03, -0.1, z + 0.02]], [0.016, 0.003], { lados: 3, pasos: 1 }); }
  for (const z of [0.5, 0.86]) A.tubo(0x120e0c, [[0, 0.06, z], [0, -0.1, z + 0.04]], [0.04, 0.004], { lados: 4, pasos: 1, brillo: 1 });
  arriba.add(A.malla());
  const abajo = G(); abajo.position.set(0, -0.02, 1.0); body.add(abajo);
  const B = new Pieza();
  B.tubo(0x120e0c, [[0, 0, 0], [0, 0.02, 0.28], [0, 0.18, 0.52], [0, 0.34, 0.6]], [0.1, 0.075, 0.05, 0.008], { lados: 6, brillo: 1.2 });
  abajo.add(B.malla());
  const patas = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const L = 0.56, Q = new Pieza();
    Q.tubo(0x1a1410, [[0, 0, 0], [L * 0.55, L * 0.42, 0], [L * 1.02, L * 0.12, 0], [L * 1.26, -0.46, 0]], [0.09, 0.085, 0.055, 0.016], { lados: 6, brillo: 0.8 });
    for (const f of [0.72, 0.88, 1.02]) Q.tubo(0x0c0806, [[L * f, L * (0.34 - (f - 0.72) * 0.8), 0], [L * f + 0.09, L * (0.48 - (f - 0.72) * 0.8), 0]], [0.02, 0.003], { lados: 3, pasos: 1 });
    const piv = pivotePata(s * 0.5, -0.14, 0.5 - i * 0.48, s > 0 ? -0.35 + i * 0.35 : Math.PI + 0.35 - i * 0.35, Q.malla());
    body.add(piv); patas.push({ piv, i, s });
  }
  g.userData = { body, patas, arriba, abajo, babyScale: 1.5 };
  return g;
}

// ---------- el Tata Sapo ----------
export function armarTata() {
  const g = G(), body = G(); g.add(body);
  const T = new Pieza();
  T.bulto(0x635a2c, 0.82, 0.58, 0.76, { y: 0.6, det: 4, forma: aplastarPanza(0.7), grano: 0.3, pinta: (u) => (u.y < -0.4 ? 0xa89a68 : null) });
  for (let i = 0; i < 34; i++) {
    const a = i * 2.399, h = 0.15 + ((i * 37) % 17) / 21, r = Math.sqrt(Math.max(0, 1 - h * h)), w = 0.06 + (i % 4) * 0.018;
    T.bulto(i % 3 ? 0x3e3818 : 0x8a7a3a, w, w * 0.65, w, { x: Math.cos(a) * r * 0.82, y: 0.6 + h * 0.58, z: Math.sin(a) * r * 0.76, det: 1, grano: 0.2 });
  }
  for (const s of [-1, 1]) T.bulto(0xc8b050, 0.2, 0.13, 0.32, { x: s * 0.5, y: 1.02, z: 0.26, det: 2, brillo: 0.9, rot: [0, s * 0.3, 0] });
  body.add(T.malla());
  const C = new Pieza();
  C.bulto(0x6a6030, 0.68, 0.3, 0.42, { det: 3, forma: aplastarPanza(0.65), grano: 0.26 });
  for (const s of [-1, 1]) {
    C.bulto(0xe8a820, 0.17, 0.17, 0.17, { x: s * 0.42, y: 0.22, z: 0.06, det: 3, brillo: 1.6, amb: 0.85 });
    C.bulto(0x0a0a0a, 0.1, 0.045, 0.03, { x: s * 0.46, y: 0.25, z: 0.21, det: 1, amb: 0.9 });
  }
  C.tubo(0x2a2010, [[-0.64, -0.03, 0.05], [-0.34, -0.07, 0.36], [0.34, -0.07, 0.36], [0.64, -0.03, 0.05]], [0.02, 0.025, 0.025, 0.02], { lados: 4 });
  const cab = C.malla(); cab.position.set(0, 0.76, 0.88); body.add(cab);
  // el buche que se infla antes de sacar la lengua
  const Bu = new Pieza();
  Bu.bulto(0xd8c890, 0.44, 0.22, 0.28, { det: 3, grano: 0.12, brillo: 0.5 });
  const buche = Bu.malla(); buche.position.set(0, 0.44, 1.02); body.add(buche);
  const lengua = G(); lengua.position.set(0, 0.55, 1.2); body.add(lengua);
  const L = new Pieza();
  L.tubo(0xd04a6a, [[0, 0, 0], [0, 0.02, 0.5], [0, 0, 0.92]], [0.1, 0.09, 0.1], { lados: 6, brillo: 0.6 });
  L.bulto(0xe06a8a, 0.22, 0.12, 0.17, { z: 1, det: 2, brillo: 1 });
  lengua.add(L.malla()); lengua.visible = false;
  const patas = [];
  for (const [x, z, atras] of [[-0.68, 0.56, 0], [0.68, 0.56, 0], [-0.74, -0.42, 1], [0.74, -0.42, 1]]) {
    const s = Math.sign(x), Q = new Pieza(), q = G();
    if (atras) {
      Q.bulto(0x564e24, 0.24, 0.24, 0.44, { x: s * 0.06, y: 0.08, det: 3, grano: 0.25 });
      Q.tubo(0x4a4420, [[s * 0.2, -0.04, -0.3], [s * 0.3, -0.16, 0.12], [s * 0.26, -0.24, 0.42]], [0.11, 0.09, 0.05], { lados: 6 });
    } else Q.tubo(0x4a4420, [[0, 0.2, 0], [s * 0.16, 0.05, 0.08], [s * 0.2, -0.22, 0.16]], [0.12, 0.09, 0.06], { lados: 6 });
    for (const d of [-1, 0, 1]) { const bx = s * (atras ? 0.26 : 0.2), bz = atras ? 0.42 : 0.16, by = atras ? -0.24 : -0.22; Q.tubo(0x5a5228, [[bx, by, bz], [bx + d * 0.16, by - 0.03, bz + 0.2]], [0.045, 0.018], { lados: 4, pasos: 1 }); }
    q.position.set(x, 0.3, z); q.add(Q.malla()); body.add(q); patas.push(q);
  }
  g.userData = { body, buche, lengua, patas, babyScale: 1.3 };
  return g;
}

// ---------- la Cascabel del Llano ----------
export function armarCascabel(n = 14) {
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // la cabeza triangular de víbora, ancha atrás
  P.bulto(0x9a7a48, 0.28, 0.14, 0.32, { det: 3, brillo: 0.5, grano: 0.2, forma: (v) => { v.x *= 1 - v.z * 0.42; if (v.y < 0) v.y *= 0.6; }, pinta: (u) => (u.y > 0.35 && Math.abs(u.x) < 0.2 && u.z < 0.3 ? 0x3a2a14 : u.y < -0.3 ? 0xd8c8a0 : null) });
  for (const s of [-1, 1]) {
    P.bulto(0xe8b820, 0.05, 0.05, 0.05, { x: s * 0.19, y: 0.08, z: 0.09, det: 2, brillo: 1.5, amb: 0.9 });
    P.bulto(0x0a0a0a, 0.012, 0.04, 0.02, { x: s * 0.228, y: 0.08, z: 0.1, det: 1, amb: 0.9 });
    // las cejas que le dan cara de brava
    P.tubo(0x5a4426, [[s * 0.13, 0.13, 0.17], [s * 0.24, 0.13, 0.03]], [0.025, 0.03], { lados: 4, pasos: 1 });
  }
  const cab = P.malla(); cab.position.set(0, 0.2, 0.4); body.add(cab);
  const Ln = new Pieza();
  Ln.tubo(0x8a1020, [[0, 0, 0], [0, 0, 0.14]], [0.014, 0.01], { lados: 4, pasos: 1 });
  for (const s of [-1, 1]) Ln.tubo(0x8a1020, [[0, 0, 0.14], [s * 0.05, -0.01, 0.22]], [0.01, 0.002], { lados: 3, pasos: 1 });
  const lenguita = Ln.malla(); lenguita.position.set(0, -0.04, 0.3); cab.add(lenguita);
  const segs = [];
  for (let i = 0; i < n; i++) {
    const s = G(), S = new Pieza(), ancho = 0.2 - Math.abs(i - 3) * 0.009, cola = i >= n - 3;
    if (cola) {
      // los anillos del cascabel
      const r = 0.1 - (i - (n - 3)) * 0.018;
      for (const dz of [-0.09, 0, 0.09]) S.bulto(0xe0d0a8, r, r * 0.9, 0.055, { y: 0.14, z: dz, det: 2, brillo: 0.9, grano: 0.14 });
    } else S.bulto(0x9a7a48, ancho, 0.12, 0.2, { y: 0.14, det: 2, brillo: 0.5, grano: 0.2, pinta: (u) => {
      if (u.y < -0.25) return 0xd8c8a0;
      const rombo = Math.abs(u.x) + Math.abs(u.z) * 0.8;
      return u.y > 0 ? (rombo < 0.42 ? 0x3a2a14 : rombo < 0.6 ? 0xe0cca0 : null) : null;
    } });
    s.add(S.malla()); g.add(s); segs.push(s);
  }
  g.userData = { body, cab, segs, lenguita, rastro: [], babyScale: 1.6 };
  return g;
}

// ---------- el Cangrejo Rey ----------
export function armarCangrejoRey() {
  const g = G(), body = G(); body.position.y = 0.7; g.add(body);
  const P = new Pieza();
  P.bulto(0xd0501c, 1, 0.38, 0.74, { y: 0.2, det: 4, brillo: 0.8, grano: 0.1, forma: (v) => { v.x *= 1 + v.z * 0.16; if (v.y < 0) v.y *= 0.55; }, pinta: (u) => {
    if (u.z > 0.74 && u.y > -0.1) return 0xf4c890;
    return u.y > 0.35 && Math.sin(u.x * 15) * Math.sin(u.z * 13) > 0.74 ? 0x8a2e0c : null;
  } });
  for (const s of [-1, 1]) {
    P.tubo(0xa83a12, [[s * 0.3, 0.46, 0.56], [s * 0.33, 0.84, 0.64]], [0.06, 0.045], { lados: 5, pasos: 1 });
    P.bulto(0x0a0a0a, 0.1, 0.12, 0.1, { x: s * 0.33, y: 0.94, z: 0.64, det: 2, brillo: 1.5, amb: 0.9 });
  }
  body.add(P.malla());
  // la concha de caracol gigante que carga encima: una espiral de verdad
  const concha = G(); concha.position.set(0, 0.7, -0.2); body.add(concha);
  const K = new Pieza(), puntos = [], radios = [];
  for (let i = 0; i <= 26; i++) { const t = i / 26, a = t * Math.PI * 5.2, r = 0.72 * (1 - t) ** 1.25; puntos.push([Math.cos(a) * r * 0.9, 0.2 + t * 1.36, Math.sin(a) * r * 0.9 - 0.05]); radios.push(0.48 * (1 - t) ** 0.85 + 0.015); }
  K.tubo(0xe0d0b0, puntos, radios, { lados: 10, pasos: 2, brillo: 0.7, grano: 0.1, pinta: (u) => { const f = u.x * 24 - Math.floor(u.x * 24); return f < 0.25 ? 0x9a7a5a : f < 0.42 ? 0xf4e8d0 : null; } });
  concha.add(K.malla());
  const pinzas = [];
  for (const s of [-1, 1]) {
    const p = G(), T = new Pieza(); p.position.set(s * 0.9, 0.1, 0.7); body.add(p);
    T.tubo(0xc8481a, [[0, 0, -0.1], [s * 0.05, 0.04, 0.2], [0, 0.08, 0.44]], [0.15, 0.15, 0.2], { lados: 7, brillo: 0.7 });
    T.bulto(0xd8541e, 0.34, 0.31, 0.4, { y: 0.1, z: 0.72, det: 3, brillo: 1, grano: 0.08, pinta: (u) => (u.y < -0.45 ? 0xf8e8d0 : null) });
    T.tubo(0xf0d8b8, [[-s * 0.1, -0.04, 1], [-s * 0.1, -0.06, 1.3], [s * 0.04, 0.03, 1.5]], [0.15, 0.1, 0.012], { lados: 7, brillo: 0.9 });
    T.tubo(0xd8541e, [[s * 0.08, 0.28, 1], [s * 0.08, 0.3, 1.28], [-s * 0.02, 0.13, 1.48]], [0.13, 0.09, 0.012], { lados: 7, brillo: 0.9 });
    for (const z of [1.1, 1.24]) T.bulto(0xfff4e0, 0.035, 0.05, 0.035, { x: -s * 0.08, y: 0.08, z, det: 1, brillo: 1 });
    p.add(T.malla()); pinzas.push(p);
  }
  const patas = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const L = 0.62, Q = new Pieza();
    Q.tubo(0xc8481a, [[0, 0, 0], [L * 0.55, L * 0.44, 0], [L * 1.02, L * 0.14, 0], [L * 1.26, -0.7, 0]], [0.1, 0.09, 0.06, 0.012], { lados: 6, brillo: 0.6, pinta: (u) => (u.x > 0.8 ? 0x6a240a : null) });
    const piv = pivotePata(s * 0.9, 0, 0.2 - i * 0.4, s > 0 ? -0.2 : Math.PI + 0.2, Q.malla());
    body.add(piv); patas.push({ piv, i, s });
  }
  g.userData = { body, concha, pinzas, patas, babyScale: 1.2 };
  return g;
}

// ---------- el Ciempiés Rey ----------
export function armarCiempiesRey() {
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(0x901c12, 0.37, 0.2, 0.32, { det: 3, brillo: 1, forma: aplastarPanza(0.6), pinta: (u) => (u.y > 0.4 && Math.abs(u.x) < 0.25 ? 0xb83418 : null) });
  for (const s of [-1, 1]) P.tubo(0xe08030, [[s * 0.16, 0.08, 0.26], [s * 0.42, 0.34, 0.64], [s * 0.62, 0.26, 1.04]], [0.04, 0.024, 0.006], { lados: 5, pinta: bandas(0x6a2a10, 7, 0.3) });
  const cab = P.malla(); cab.position.set(0, 0.3, 0.5); body.add(cab);
  for (const s of [-1, 1]) cab.add(brilla(0xffa020, 0.06, s * 0.2, 0.1, 0.27));
  const garras = [];
  for (const s of [-1, 1]) {
    const q = G(), Q = new Pieza(); q.position.set(s * 0.22, -0.1, 0.3);
    Q.tubo(0x1a0806, [[0, 0, -0.04], [s * 0.05, 0, 0.24], [-s * 0.12, -0.02, 0.44]], [0.08, 0.06, 0.008], { lados: 6, brillo: 1.2, pinta: (u) => (u.x > 0.72 ? 0xd88a20 : null) });
    q.add(Q.malla()); cab.add(q); garras.push(q);
  }
  const segs = [];
  for (let i = 0; i < 18; i++) {
    const s = G(), S = new Pieza(), rx = 0.36 - i * 0.007, oscuro = i % 2 === 1;
    S.bulto(oscuro ? 0x241814 : 0x901c12, rx, 0.17, 0.25, { y: 0.3, det: 2, brillo: 1, forma: aplastarPanza(0.6), pinta: (u) => (u.y > 0.35 && Math.abs(u.x) < 0.22 ? (oscuro ? 0x54281a : 0xc03a1c) : null) });
    s.add(S.malla());
    const patas = [];
    // las patas van en blanco: el color lo pone el material, que la pelea cambia cuando el anillo se cierra
    for (const lado of [-1, 1]) {
      const Q = new Pieza();
      Q.tubo(0xffffff, [[0, 0, 0], [lado * 0.26, 0.08, 0], [lado * 0.5, -0.24, 0.04]], [0.05, 0.034, 0.008], { lados: 5, pasos: 2 });
      const malla = Q.malla(); malla.material.color.setHex(0xe0802a); malla.position.set(lado * rx * 0.82, 0.24, 0);
      s.add(malla); patas.push(malla);
    }
    s.userData.patas = patas;
    g.add(s); segs.push(s);
  }
  g.userData = { body, cab, garras, segs, rastro: [], babyScale: 1.2 };
  return g;
}

// ---------- el Rey Zopilote ----------
const NEGRO = 0x20202a, BLANCO = 0xe0e0d8, GRIS = 0x8a8a92;
// un abanico de plumas largas sobre el eje X del ala
function plumas(P, s, desde, hasta, n, largo, colores) {
  for (let k = 0; k < n; k++) {
    const t = k / Math.max(1, n - 1), x = s * (desde + (hasta - desde) * t), L = largo(t);
    P.bulto(colores(t, k), (hasta - desde) / n * 0.78, 0.035, L, { x, y: 0.01 * k * s, z: -L * 0.72, det: 1, rot: [0, s * t * 0.18, 0], grano: 0.14, brillo: 0.5 });
  }
}
export function armarRey() {
  const g = G(), body = G(); body.position.y = 1.2; g.add(body);
  const P = new Pieza();
  P.bulto(NEGRO, 0.6, 0.56, 0.96, { det: 4, brillo: 0.7, grano: 0.12, forma: huevo(0.12), pinta: (u) => (u.y < -0.2 && u.z > -0.6 ? BLANCO : null) });
  // el collar de plumas grises, en dos vueltas
  for (let r = 0; r < 2; r++) for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + r * 0.17, R = 0.5 - r * 0.1;
    P.tubo(r ? GRIS : 0x6a6a72, [[Math.cos(a) * R * 0.5, 0.42 + Math.sin(a) * R * 0.4, 0.74 + r * 0.06], [Math.cos(a) * R * 1.05, 0.38 + Math.sin(a) * R * 0.92, 0.6 + r * 0.08]], [0.11, 0.015], { lados: 4, pasos: 1, grano: 0.2 });
  }
  // el cuello pelado y la cola en abanico
  P.tubo(0xd86a3a, [[0, 0.34, 0.78], [0, 0.56, 0.96], [0, 0.72, 1.12]], [0.24, 0.17, 0.2], { lados: 8 });
  for (let i = 0; i < 9; i++) { const t = i / 8 - 0.5; P.bulto(i % 2 ? NEGRO : 0x30303a, 0.11, 0.035, 0.68, { x: t * 0.95, y: 0.05, z: -1.42, det: 1, rot: [0, t * 0.7, 0], grano: 0.14, brillo: 0.5 }); }
  body.add(P.malla());
  const cabeza = G(); cabeza.position.set(0, 0.75, 1.15); body.add(cabeza);
  const C = new Pieza();
  // la cabeza calva de colores: naranja, rojo, morado y la carúncula amarilla arrugada
  C.bulto(0xe8702a, 0.3, 0.26, 0.34, { det: 3, brillo: 0.5, grano: 0.2, pinta: (u) => (u.y > 0.55 ? 0xd02830 : u.y < -0.15 && u.z < 0.2 ? 0x7a3a8a : null) });
  for (let i = 0; i < 7; i++) C.bulto(i % 2 ? 0xf0d040 : 0xe8b030, 0.075 - i * 0.004, 0.06, 0.075, { x: (i - 3) * 0.05, y: 0.2 + Math.abs(i - 3) * -0.03, z: 0.3 - Math.abs(i - 3) * 0.04, det: 1, brillo: 0.6, grano: 0.2 });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) C.bulto(0xc83030, 0.05, 0.04, 0.05, { x: s * (0.14 + i * 0.05), y: 0.2 - i * 0.035, z: -0.14 + i * 0.07, det: 1, grano: 0.2 });
    C.bulto(0xf4f4f0, 0.07, 0.07, 0.05, { x: s * 0.25, y: 0.08, z: 0.14, det: 2, amb: 1 });
  }
  const cabM = C.malla(); cabeza.add(cabM);
  for (const s of [-1, 1]) cabeza.add(brilla(0x101010, 0.035, s * 0.29, 0.08, 0.17));
  const pico = G(); pico.position.set(0, -0.02, 0.32); cabeza.add(pico);
  const Pi = new Pieza();
  Pi.tubo(0xe8a040, [[0, 0.02, -0.06], [0, 0.03, 0.18], [0, -0.02, 0.32]], [0.14, 0.11, 0.08], { lados: 7, brillo: 0.9 });
  Pi.tubo(0x2a2010, [[0, -0.01, 0.3], [0, -0.03, 0.42], [0, -0.17, 0.46]], [0.08, 0.05, 0.006], { lados: 6, brillo: 1.1 });
  pico.add(Pi.malla());
  // las alas: tres tramos que se doblan, hechos de plumas
  const alas = [-1, 1].map((s) => {
    const hombro = G(); hombro.position.set(s * 0.55, 0.3, 0.2); body.add(hombro);
    const A1 = new Pieza();
    A1.tubo(NEGRO, [[0, 0, 0.3], [s * 0.7, 0.04, 0.34], [s * 1.4, 0, 0.3]], [0.2, 0.13, 0.1], { lados: 7, brillo: 0.6 });
    plumas(A1, s, 0.06, 1.42, 7, (t) => 0.62 + t * 0.06, (t, k) => (k % 2 ? NEGRO : 0x2c2c36));
    hombro.add(A1.malla());
    const codo = G(); codo.position.set(s * 1.4, 0, 0); hombro.add(codo);
    const A2 = new Pieza();
    A2.tubo(NEGRO, [[0, 0, 0.3], [s * 0.7, 0.02, 0.26], [s * 1.4, 0, 0.18]], [0.1, 0.08, 0.06], { lados: 6, brillo: 0.6 });
    plumas(A2, s, 0.06, 1.42, 7, (t) => 0.7 - t * 0.05, (t, k) => (t > 0.72 ? BLANCO : k % 2 ? NEGRO : 0x2c2c36));
    codo.add(A2.malla());
    const punta = G(); punta.position.set(s * 1.4, 0, 0); codo.add(punta);
    const A3 = new Pieza();
    // las primarias, separadas como dedos
    for (let k = 0; k < 6; k++) { const a = -0.15 + k * 0.26, L = 1.15 - k * 0.09; A3.tubo(k > 1 ? BLANCO : NEGRO, [[s * 0.05, 0, 0.14 - k * 0.04], [s * (0.1 + Math.sin(a + 0.3) * L * 0.55), 0.03, 0.14 - Math.cos(a + 0.3) * L * 0.55], [s * (0.16 + Math.sin(a + 0.45) * L), 0, 0.14 - Math.cos(a + 0.45) * L]], [0.1, 0.11, 0.015], { lados: 4, grano: 0.14 }); }
    punta.add(A3.malla());
    return { hombro, codo, punta, s };
  });
  const patas = [-1, 1].map((s) => {
    const q = G(), Q = new Pieza(); q.position.set(s * 0.3, -0.5, 0.1);
    Q.tubo(0xb8b0a0, [[0, 0.1, 0], [0, -0.3, 0.02], [0, -0.68, 0.05]], [0.12, 0.08, 0.08], { lados: 6, grano: 0.2 });
    for (const a of [-0.55, 0, 0.55, Math.PI]) Q.tubo(0x2a2a2a, [[0, -0.68, 0.05], [Math.sin(a) * 0.2, -0.68, 0.05 + Math.cos(a) * 0.2], [Math.sin(a) * 0.3, -0.72, 0.05 + Math.cos(a) * 0.3]], [0.05, 0.035, 0.004], { lados: 4, pasos: 2 });
    q.add(Q.malla()); body.add(q); return q;
  });
  g.userData = { body, cabeza, alas, patas, babyScale: 1.4 };
  return g;
}
