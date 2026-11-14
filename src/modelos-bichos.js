// Los modelos de los bichos del monte (v8.6), hechos con el kit low-poly: cuerpos redondeados, patas articuladas que se afinan,
// caparazones con brillo y dibujos propios de cada especie. Cada armador devuelve el grupo con el userData que espera su animación.
import * as THREE from 'three';
import { Pieza, aplastarPanza, huevo, bandas } from './lowpoly.js';

const G = () => new THREE.Group();
// una pata en su pivote; el pivote se gira en Y para apuntar afuera y en Z para caminar
function pivotePata(x, y, z, giroY, malla) { const p = G(); p.position.set(x, y, z); p.rotation.y = giroY; p.add(malla); return p; }

export function armarBananera() {
  const g = G(), body = G(); body.position.y = 0.3; g.add(body);
  const P = new Pieza();
  // el abdomen con las cheurones del lomo
  P.bulto(0x5e3e26, 0.2, 0.16, 0.28, { y: 0.06, z: -0.27, det: 3, forma: huevo(-0.22), grano: 0.2, pinta: (u) => {
    if (u.y < 0.15) return null;
    const b = u.z * 2.6 + Math.abs(u.x) * 2.4, f = b - Math.floor(b);
    return f < 0.3 ? 0x24160e : f < 0.45 ? 0xc0a070 : null;
  } });
  P.bulto(0x6e4e32, 0.16, 0.115, 0.18, { y: 0.03, z: 0.08, det: 2, brillo: 0.25, grano: 0.16 });
  // los quelíceros rojos que enseña al levantarse, y los palpos
  for (const s of [-1, 1]) {
    P.bulto(0xc03018, 0.05, 0.08, 0.055, { x: s * 0.058, y: -0.05, z: 0.25, det: 1, brillo: 0.7 });
    P.tubo(0x1a0e08, [[s * 0.058, -0.11, 0.27], [s * 0.05, -0.16, 0.28], [s * 0.03, -0.18, 0.25]], [0.016, 0.01, 0.003], { lados: 4, pasos: 2 });
    P.tubo(0x6e4e32, [[s * 0.09, 0.02, 0.2], [s * 0.15, 0.07, 0.3], [s * 0.13, -0.02, 0.38]], [0.022, 0.018, 0.012], { pinta: bandas(0xc8a070, 2, 0.25) });
  }
  // ocho ojitos con brillo
  for (const [x, y, r] of [[0.05, 0.1, 0.024], [0.1, 0.075, 0.018], [0.035, 0.06, 0.018], [0.11, 0.035, 0.014]]) for (const s of [-1, 1]) P.bulto(0x0a0a0c, r, r, r, { x: s * x, y, z: 0.235, det: 1, brillo: 1.4, amb: 0.9 });
  const cef = P.malla(); body.add(cef);
  const patas = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const L = i === 0 ? 0.5 : i === 3 ? 0.46 : 0.38, Q = new Pieza();
    Q.tubo(0x5a3a22, [[0, 0, 0], [L * 0.5, L * 0.55, 0], [L * 0.95, L * 0.3, 0], [L * 1.25, -0.3, 0]], [0.036, 0.03, 0.02, 0.008], { pinta: bandas(0xc8a070, 4, 0.22) });
    patas.push({ piv: pivotePata(s * 0.13, 0.02, 0.17 - i * 0.09, s > 0 ? -0.5 + i * 0.35 : Math.PI + 0.5 - i * 0.35, Q.malla()), i, s });
    body.add(patas[patas.length - 1].piv);
  }
  g.userData = { body, patas, cef };
  return g;
}

export function armarEscarabajo() {
  const g = G(), body = G(); body.position.y = 0.36; g.add(body);
  const P = new Pieza();
  // los élitros: una sola concha lustrosa con su costura al medio
  P.bulto(0x34201a, 0.41, 0.3, 0.52, { y: 0.06, z: -0.2, det: 4, forma: aplastarPanza(0.5), brillo: 1.2, grano: 0.05, pinta: (u) => (u.y > 0 && Math.abs(u.x) < 0.05 ? 0x120a08 : Math.abs(Math.abs(u.x) - 0.5) < 0.04 && u.y > 0 ? 0x241410 : null) });
  // el pronoto y la cabeza
  P.bulto(0x2c1a14, 0.34, 0.23, 0.25, { y: 0.1, z: 0.33, det: 3, forma: aplastarPanza(0.6), brillo: 1.2, grano: 0.05 });
  P.bulto(0x20140e, 0.17, 0.11, 0.13, { y: -0.04, z: 0.56, det: 2, brillo: 0.7 });
  // el cuerno del pronoto, para adelante
  P.tubo(0x241812, [[0, 0.28, 0.34], [0, 0.4, 0.52], [0, 0.39, 0.7]], [0.06, 0.04, 0.006], { lados: 6, brillo: 0.9 });
  for (const s of [-1, 1]) P.bulto(0xb09a70, 0.035, 0.035, 0.03, { x: s * 0.13, y: -0.01, z: 0.63, det: 1, brillo: 1.4 });
  body.add(P.malla());
  // el cuerno grande, curvo y ahorquillado: se mueve aparte cuando escarba
  const cuerno = G(); cuerno.position.set(0, -0.02, 0.62); body.add(cuerno);
  const H = new Pieza();
  H.tubo(0x241812, [[0, 0, -0.04], [0, 0.04, 0.2], [0, 0.22, 0.36], [0, 0.46, 0.38]], [0.075, 0.06, 0.04, 0.02], { lados: 6, brillo: 1 });
  for (const s of [-1, 1]) H.tubo(0x241812, [[0, 0.44, 0.38], [s * 0.05, 0.53, 0.36], [s * 0.07, 0.6, 0.3]], [0.022, 0.014, 0.003], { lados: 4, pasos: 2, brillo: 1 });
  cuerno.add(H.malla());
  const patas = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const L = 0.34, Q = new Pieza();
    Q.tubo(0x2a1e16, [[0, 0, 0], [L * 0.55, L * 0.42, 0], [L * 1.05, L * 0.12, 0], [L * 1.3, -0.28, 0]], [0.05, 0.05, 0.032, 0.01], { lados: 5, brillo: 0.6 });
    // las espinas de la canilla
    for (const f of [0.75, 0.95]) Q.tubo(0x1a1008, [[L * f, L * 0.26 - (f - 0.75) * 0.3, 0], [L * f + 0.05, L * 0.34 - (f - 0.75) * 0.3, 0]], [0.012, 0.002], { lados: 3, pasos: 1 });
    patas.push({ piv: pivotePata(s * 0.32, -0.08, 0.3 - i * 0.3, s > 0 ? -0.3 + i * 0.3 : Math.PI + 0.3 - i * 0.3, Q.malla()), i, s });
    body.add(patas[patas.length - 1].piv);
  }
  g.userData = { body, patas, cuerno };
  return g;
}

export function armarSapo() {
  const g = G(), body = G(); g.add(body);
  const T = new Pieza();
  // el lomo verrugoso y la panza clara
  T.bulto(0x75653a, 0.31, 0.22, 0.3, { det: 3, forma: aplastarPanza(0.7), grano: 0.3, pinta: (u) => (u.y < -0.35 ? 0xb8aa78 : null) });
  for (let i = 0; i < 18; i++) {
    const a = i * 2.399, h = 0.25 + ((i * 37) % 11) / 16, r = Math.sqrt(Math.max(0, 1 - h * h));
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    T.bulto(i % 3 ? 0x54442a : 0x8a7844, 0.032, 0.022, 0.032, { x: x * 0.31, y: h * 0.22, z: z * 0.3, det: 1, grano: 0.2 });
  }
  // las glándulas de donde sale el veneno
  for (const s of [-1, 1]) T.bulto(0xd0c060, 0.075, 0.05, 0.13, { x: s * 0.18, y: 0.15, z: 0.1, det: 2, brillo: 0.8, rot: [0, s * 0.3, 0] });
  const tronco = T.malla(); tronco.position.y = 0.24; body.add(tronco);
  const C = new Pieza();
  C.bulto(0x7a6a3e, 0.25, 0.12, 0.17, { det: 3, forma: aplastarPanza(0.65), grano: 0.26 });
  for (const s of [-1, 1]) {
    // los ojos dorados con la pupila acostada
    C.bulto(0xe0b030, 0.062, 0.062, 0.062, { x: s * 0.15, y: 0.085, z: 0.03, det: 2, brillo: 1.5, amb: 0.85 });
    C.bulto(0x0c0c0c, 0.038, 0.016, 0.012, { x: s * 0.165, y: 0.095, z: 0.087, det: 1, amb: 0.9 });
  }
  // la bocota de lado a lado
  C.tubo(0x2a1c10, [[-0.23, -0.015, 0.02], [-0.12, -0.03, 0.135], [0.12, -0.03, 0.135], [0.23, -0.015, 0.02]], [0.008, 0.01, 0.01, 0.008], { lados: 4 });
  const cab = C.malla(); cab.position.set(0, 0.28, 0.3); body.add(cab);
  const patas = [];
  for (const [x, z, atras] of [[-0.25, 0.18, 0], [0.25, 0.18, 0], [-0.26, -0.16, 1], [0.26, -0.16, 1]]) {
    const s = Math.sign(x), Q = new Pieza(), q = G();
    if (atras) {
      Q.bulto(0x6a5a32, 0.09, 0.08, 0.17, { x: s * 0.03, y: 0.02, z: 0, det: 2, grano: 0.25 });
      Q.tubo(0x5a4a2a, [[s * 0.07, -0.04, -0.12], [s * 0.11, -0.08, 0.04], [s * 0.1, -0.1, 0.16]], [0.04, 0.032, 0.02]);
    } else Q.tubo(0x5a4a2a, [[0, 0.05, 0], [s * 0.06, 0, 0.03], [s * 0.07, -0.08, 0.06]], [0.042, 0.032, 0.022]);
    // la mano con sus dedos separados
    for (const d of [-1, 0, 1]) { const bx = s * (atras ? 0.1 : 0.07), bz = atras ? 0.16 : 0.06; Q.tubo(0x6a5a32, [[bx, atras ? -0.1 : -0.08, bz], [bx + d * 0.06, atras ? -0.115 : -0.095, bz + 0.08]], [0.016, 0.008], { lados: 4, pasos: 1 }); }
    q.position.set(x, 0.12, z); q.add(Q.malla()); body.add(q); patas.push(q);
  }
  g.userData = { body, patas, tronco };
  return g;
}

export function armarCiempies() {
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  P.bulto(0x9a2414, 0.155, 0.08, 0.14, { y: 0.12, z: 0.3, det: 2, brillo: 0.9, forma: aplastarPanza(0.6) });
  for (const s of [-1, 1]) {
    P.bulto(0x0a0a0a, 0.026, 0.026, 0.026, { x: s * 0.09, y: 0.16, z: 0.39, det: 1, brillo: 1.4, amb: 0.9 });
    P.tubo(0xe08030, [[s * 0.07, 0.14, 0.42], [s * 0.2, 0.26, 0.58], [s * 0.3, 0.22, 0.74]], [0.016, 0.01, 0.003], { lados: 4, pinta: bandas(0x7a3010, 5, 0.3) });
    // las pinzas de veneno
    P.tubo(0x1a0a08, [[s * 0.1, 0.08, 0.4], [s * 0.1, 0.06, 0.5], [s * 0.02, 0.05, 0.54]], [0.03, 0.022, 0.004], { lados: 4, brillo: 1 });
  }
  const cab = P.malla(); body.add(cab);
  const segs = [];
  for (let i = 0; i < 10; i++) {
    const s = G(), S = new Pieza(), rx = 0.16 - i * 0.005, oscuro = i % 2 === 1;
    s.position.set(0, 0.12, 0.08 - i * 0.2); g.add(s);
    S.bulto(oscuro ? 0x2a1610 : 0x9a2414, rx, 0.075, 0.125, { det: 2, brillo: 0.9, forma: aplastarPanza(0.6), pinta: (u) => (u.y > 0.3 && Math.abs(u.x) < 0.22 ? (oscuro ? 0x5a2a18 : 0xc84a24) : null) });
    s.add(S.malla());
    const piernas = [];
    for (const lado of [-1, 1]) {
      const Q = new Pieza(), piv = G(); piv.position.set(lado * rx * 0.8, -0.02, 0);
      Q.tubo(0xe0802a, [[0, 0, 0], [lado * 0.1, 0.04, 0], [lado * 0.2, -0.1, 0.02]], [0.02, 0.014, 0.004], { lados: 4, pasos: 2 });
      piv.add(Q.malla()); s.add(piv); piernas.push(piv);
    }
    s.userData.piernas = piernas;
    segs.push(s);
  }
  g.userData = { body, cab, segs, rastro: [] };
  return g;
}

export function armarTenaza() {
  const g = G(), body = G(); body.position.y = 0.26; g.add(body);
  const P = new Pieza();
  // el caparazón ancho adelante, con su borde claro y sus pecas
  P.bulto(0xd8601e, 0.39, 0.15, 0.28, { y: 0.06, det: 3, brillo: 0.7, grano: 0.1, forma: (v) => { v.x *= 1 + v.z * 0.16; if (v.y < 0) v.y *= 0.5; }, pinta: (u) => {
    if (u.z > 0.72 && u.y > -0.1) return 0xf4c890;
    const f = Math.sin(u.x * 19) * Math.sin(u.z * 17);
    return u.y > 0.4 && f > 0.72 ? 0x9a3a10 : null;
  } });
  for (const s of [-1, 1]) {
    P.tubo(0xc04a14, [[s * 0.12, 0.14, 0.2], [s * 0.13, 0.28, 0.23]], [0.024, 0.018], { lados: 5, pasos: 1 });
    P.bulto(0x0a0a0a, 0.042, 0.05, 0.042, { x: s * 0.13, y: 0.32, z: 0.23, det: 1, brillo: 1.4, amb: 0.9 });
  }
  body.add(P.malla());
  // la tenaza grande: brazo, palma, dedo fijo y el dedo que muerde
  const grande = G(); grande.position.set(-0.36, 0.08, 0.26); body.add(grande);
  const T = new Pieza();
  T.tubo(0xd8601e, [[0, 0, -0.04], [-0.04, 0.03, 0.12], [-0.04, 0.05, 0.26]], [0.07, 0.075, 0.09], { lados: 6, brillo: 0.6 });
  T.bulto(0xe06a24, 0.17, 0.16, 0.19, { x: -0.04, y: 0.07, z: 0.38, det: 3, brillo: 0.9, grano: 0.08, pinta: (u) => (u.y < -0.45 ? 0xf8e0c0 : null) });
  T.tubo(0xf0d0a8, [[-0.08, -0.02, 0.52], [-0.08, -0.03, 0.68], [-0.01, 0.02, 0.8]], [0.075, 0.05, 0.006], { lados: 6, brillo: 0.8 });
  grande.add(T.malla());
  const dedo = G(); dedo.position.set(-0.03, 0.16, 0.52); grande.add(dedo);
  const D = new Pieza();
  D.tubo(0xe86a28, [[0, 0, -0.02], [0, 0.03, 0.14], [-0.04, -0.06, 0.27]], [0.06, 0.045, 0.005], { lados: 6, brillo: 0.9 });
  dedo.add(D.malla());
  // la chiquita, del otro lado
  const chica = G(); chica.position.set(0.32, 0.04, 0.26); body.add(chica);
  const K = new Pieza();
  K.tubo(0xe06a28, [[0, 0, -0.02], [0.03, 0.02, 0.12]], [0.04, 0.05], { lados: 5, pasos: 1 });
  K.bulto(0xe06a28, 0.07, 0.06, 0.09, { x: 0.03, y: 0.03, z: 0.18, det: 2, brillo: 0.7 });
  for (const d of [-1, 1]) K.tubo(0xf0d0a8, [[0.03 + d * 0.025, 0.03, 0.24], [0.03 + d * 0.01, 0.03, 0.34]], [0.024, 0.004], { lados: 4, pasos: 1 });
  chica.add(K.malla());
  const patas = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const L = 0.28, Q = new Pieza();
    Q.tubo(0xd85a20, [[0, 0, 0], [L * 0.55, L * 0.42, 0], [L * 1, L * 0.12, 0], [L * 1.2, -0.26, 0]], [0.042, 0.038, 0.026, 0.006], { lados: 5, brillo: 0.5, pinta: (u) => (u.x > 0.8 ? 0x7a2a0c : null) });
    patas.push({ piv: pivotePata(s * 0.34, 0, 0.1 - i * 0.16, s > 0 ? -0.2 : Math.PI + 0.2, Q.malla()), i, s });
    body.add(patas[patas.length - 1].piv);
  }
  g.userData = { body, patas, grande, dedo };
  return g;
}

const PECAS = [[0.3, 0.8, 0.5], [-0.55, 0.7, 0.3], [0.1, 0.75, -0.65], [-0.3, 0.55, -0.75], [0.75, 0.5, -0.3], [-0.75, 0.45, -0.4], [0.6, 0.45, 0.65], [-0.15, 0.95, 0.05]].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
export function armarHongo() {
  const g = G(), body = G(); g.add(body);
  const P = new Pieza();
  // el pie que se ensancha abajo, con su faldita
  P.tubo(0xe8dcc0, [[0, 0, 0], [0, 0.18, 0], [0, 0.46, 0]], [0.18, 0.115, 0.13], { lados: 9, grano: 0.14 });
  P.tubo(0xd8c8a4, [[0, 0.3, 0], [0, 0.33, 0]], [0.17, 0.12], { lados: 9, pasos: 1 });
  body.add(P.malla());
  const som = G(); som.position.y = 0.46; body.add(som);
  const S = new Pieza();
  S.bulto(0xa83a6e, 0.44, 0.3, 0.44, { det: 4, brillo: 0.5, grano: 0.08, forma: (v) => { if (v.y < 0) v.y *= 0.22; }, pinta: (u, n) => {
    if (n.y < -0.5) { const a = Math.atan2(u.z, u.x) * 12; return a - Math.floor(a) < 0.4 ? 0xb8a488 : 0xe8d8c0; } // las laminillas de abajo
    for (const q of PECAS) if (u.dot(q) > 0.975) return 0xf4ecd0;
    return u.y < 0.25 ? 0x7a2850 : null;
  } });
  som.add(S.malla());
  g.userData = { body, som };
  return g;
}
