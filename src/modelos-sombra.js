// La Sombra (v8.9), con el kit low-poly: un manto con pliegues que cae en harapos, capucha puntiaguda con la calavera metida adentro,
// mangas anchas y manos de hueso. Las variantes (sombras2.js, arena.js) se le montan encima, así que el userData no cambia.
import * as THREE from 'three';
import { Pieza } from './lowpoly.js';

const TELA = 0x171722, TELA_CLARA = 0x262636, HUESO = 0xc8c4b4;
const G = () => new THREE.Group();
const pliegues = (n, hondo) => (ang, t) => 1 + Math.sin(ang * n + t * 2.2) * hondo * (0.35 + t * 0.65);
// los harapos que cuelgan del ruedo: tiras que terminan en punta y se abren para afuera
function harapos(P, n, radio, y, largo) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.08, L = largo * (0.7 + ((i * 37) % 7) / 16), x = Math.cos(a), z = Math.sin(a);
    P.tubo(i % 3 ? TELA : TELA_CLARA, [[x * radio, y, z * radio], [x * (radio + 0.03), y - L * 0.55, z * (radio + 0.03)], [x * (radio + 0.08), y - L, z * (radio + 0.08)]], [0.1, 0.075, 0.006], { lados: 4, pasos: 2, grano: 0.2 });
  }
}
function calavera() {
  const C = new Pieza(), o = { amb: 1, grano: 0.08 };
  C.bulto(HUESO, 0.19, 0.22, 0.14, { ...o, det: 3, forma: (v) => { if (v.y < 0) { v.x *= 1 + v.y * 0.42; v.z *= 1 + v.y * 0.15; } }, pinta: (u) => {
    // las cuencas, la nariz y la línea de los dientes
    if (u.z > 0.2) {
      if (Math.hypot(Math.abs(u.x) - 0.42, u.y - 0.1) < 0.34) return 0x08080c;
      if (Math.abs(u.x) < 0.12 && u.y < -0.08 && u.y > -0.34) return 0x12121a;
      if (u.y < -0.55 && Math.abs(u.x) < 0.5) return Math.floor((u.x + 1) * 9) % 2 ? 0x2a2a30 : 0xe8e4d4;
    }
    return null;
  } });
  const m = C.malla(); m.position.set(0, -0.03, 0.13); m.userData.glow = true; m.material.color.setRGB(0.52, 0.55, 0.6);
  return m;
}
const hueso = (P, pts, rad) => P.tubo(HUESO, pts, rad, { lados: 4, pasos: 2, amb: 0.9, grano: 0.14 });

export function armarSombra() {
  const g = G(), body = G(); g.add(body);
  // el manto en tres tramos, que ondean por aparte
  const tramos = [
    { y: 0.12, alto: 0.44, r: [0.54, 0.47], hara: true },
    { y: 0.5, alto: 0.46, r: [0.47, 0.38] },
    { y: 0.9, alto: 0.42, r: [0.38, 0.3] },
  ];
  const cloth = tramos.map(({ y, alto, r, hara }, i) => {
    const P = new Pieza();
    P.tubo(i === 2 ? TELA_CLARA : TELA, [[0, 0, 0], [0, alto / 2, 0], [0, alto, 0]], [r[0], (r[0] + r[1]) / 2, r[1]], { lados: 14, pasos: 1, grano: 0.14, pliegue: pliegues(7, 0.1) });
    if (hara) harapos(P, 13, 0.46, 0.06, 0.3);
    const m = P.malla(); m.position.y = y; body.add(m);
    return m;
  });
  // la capucha, con la punta caída para atrás y el hueco oscuro adelante
  const hood = G(); hood.position.set(0, 1.5, 0);
  const H = new Pieza();
  H.bulto(TELA_CLARA, 0.34, 0.36, 0.35, { det: 3, grano: 0.14, forma: (v) => { if (v.z > 0.42 && v.y < 0.5 && Math.abs(v.x) < 0.68) v.z = 0.05; else if (v.y > 0) { v.y *= 1 + v.y * 0.5; v.z -= v.y * v.y * 0.42; } }, pinta: (u) => (u.z > 0.42 && u.y < 0.5 && Math.abs(u.x) < 0.68 ? 0x050508 : null) });
  // el borde de la capucha, y lo que cae sobre los hombros
  H.tubo(TELA, [[-0.28, -0.26, 0.22], [-0.3, 0.1, 0.29], [0, 0.34, 0.3], [0.3, 0.1, 0.29], [0.28, -0.26, 0.22]], [0.05, 0.06, 0.06, 0.06, 0.05], { lados: 5, grano: 0.14 });
  H.tubo(TELA, [[0, -0.42, 0], [0, -0.3, 0], [0, -0.14, 0]], [0.42, 0.36, 0.27], { lados: 12, pasos: 1, grano: 0.14, pliegue: pliegues(6, 0.08) });
  hood.add(H.malla(), calavera());
  // dos brasas en las cuencas (parpadean) y su resplandor
  const eyes = G(); eyes.position.set(0, -0.02, 0.255);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.042, 1), new THREE.MeshBasicMaterial({ color: 0xffb340 })); e.position.set(sx * 0.085, 0.015, 0); e.userData.glow = true; eyes.add(e); }
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshBasicMaterial({ color: 0xff9a20, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.set(0, -0.02, 0.3); glow.scale.set(0.55, 0.4, 1); glow.userData.glow = true;
  hood.add(eyes, glow);
  // algunas son «Sombras del monte»: más grandes y con cornamenta de venado
  const monte = Math.random() < 0.22;
  if (monte) {
    const A = new Pieza();
    for (const s of [-1, 1]) {
      hueso(A, [[s * 0.2, 0.28, -0.04], [s * 0.34, 0.5, -0.08], [s * 0.42, 0.74, -0.02], [s * 0.58, 0.92, 0.06]], [0.04, 0.032, 0.024, 0.006]);
      hueso(A, [[s * 0.33, 0.48, -0.08], [s * 0.2, 0.62, 0.02], [s * 0.16, 0.76, 0.1]], [0.026, 0.02, 0.005]);
      hueso(A, [[s * 0.42, 0.72, -0.02], [s * 0.32, 0.86, 0.05], [s * 0.3, 0.98, 0.12]], [0.022, 0.016, 0.004]);
    }
    hood.add(A.malla());
  }
  const babyScale = monte ? 1.18 : 0.94 + Math.random() * 0.14; // el tamaño lo aplica la criatura cada cuadro
  body.add(hood);
  const arms = [];
  for (const x of [-0.42, 0.42]) {
    const s = Math.sign(x), a = G(); a.position.set(x, 1.25, 0.05);
    const M = new Pieza();
    // la manga se abre hacia el puño y termina en jirones
    M.tubo(TELA, [[0, 0.08, 0], [s * 0.02, -0.26, 0], [s * 0.03, -0.56, 0.01]], [0.11, 0.13, 0.18], { lados: 8, pasos: 2, grano: 0.14, pliegue: pliegues(4, 0.08) });
    for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2, cx = Math.cos(an) * 0.15, cz = Math.sin(an) * 0.15; M.tubo(i % 2 ? TELA : TELA_CLARA, [[s * 0.03 + cx, -0.54, cz], [s * 0.03 + cx * 1.15, -0.72 - (i % 3) * 0.05, cz * 1.15]], [0.055, 0.006], { lados: 4, pasos: 1 }); }
    // la mano de hueso con garras largas
    M.bulto(HUESO, 0.065, 0.055, 0.05, { x: s * 0.03, y: -0.62, z: 0.02, det: 1, amb: 0.9 });
    for (const fx of [-0.05, 0, 0.05]) hueso(M, [[s * 0.03 + fx, -0.66, 0.03], [s * 0.03 + fx * 1.2, -0.76, 0.06], [s * 0.03 + fx * 1.1, -0.86, 0.13]], [0.018, 0.014, 0.003]);
    a.add(M.malla()); body.add(a); arms.push(a);
  }
  g.userData = { body, head: hood, eyes, arms, cloth, monte, babyScale };
  return g;
}
