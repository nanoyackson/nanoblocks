// La armadura hecha a la medida del cuerpo (v11.2): cascos, pecheras con hombreras, grebas con rodillera, botas y escudos,
// armados con el kit low-poly encima de las secciones de anatomia.js. Lo de la pierna y el antebrazo cuelga de la junta,
// para que se doble con el cuerpo. Todo comparte un material, porque el vestidor anima la pieza entera.
import { Pieza, cubico } from './lowpoly.js';

const U = 1 / 16;
const hexDe = (c) => (typeof c === 'string' ? parseInt(c.slice(1), 16) : c);
const tono = (hex, k) => {
  const f = (v) => Math.min(255, Math.round(v * k));
  return (f((hex >> 16) & 255) << 16) | (f((hex >> 8) & 255) << 8) | f(hex & 255);
};
const secc = (lista) => lista.map((q) => ({ y: q.y * U, rx: q.rx * U, rz: q.rz * U, x: (q.x || 0) * U, z: (q.z || 0) * U }));
const ribete = (c, mat) => (mat === 'leather' || mat === 'arpia' ? tono(c, 0.5) : tono(c, 1.45));
const acabado = (mat) => (mat === 'leather' || mat === 'arpia' ? { grano: 0.1 } : { brillo: 0.9 });

function sombreroAla(Q, c, ala) {
  const cinta = tono(c, 0.55);
  Q.bulto(c, ala * U, 0.4 * U, ala * U, { y: 7.9 * U, det: 3, grano: 0.14, forma: (v) => { const r = Math.hypot(v.x, v.z); v.y += r * r * 0.8; } });
  Q.loft(c, secc([{ y: 7.6, rx: 4.55, rz: 4.5 }, { y: 9.2, rx: 4.4, rz: 4.35 }, { y: 10.6, rx: 3.6, rz: 3.5 }, { y: 11.2, rx: 2.4, rz: 2.3 }, { y: 11.4, rx: 0.1, rz: 0.1 }]), { lados: 16, pasos: 2, cuadrado: 2.5, grano: 0.1 });
  Q.loft(cinta, secc([{ y: 8.3, rx: 4.62, rz: 4.56 }, { y: 9, rx: 4.56, rz: 4.5 }]), { lados: 16, pasos: 1, cuadrado: 2.5 });
}
function mascarada(Q, c) {
  // la cabezota de la mascarada: encima de la cabeza, con ojos saltones, cachetes y boca roja
  Q.bulto(c, 6.8 * U, 7 * U, 6.4 * U, { y: 6.2 * U, det: 4, grano: 0.05, forma: cubico(0.85) });
  for (const s of [-1, 1]) {
    Q.bulto(0xf4f0e6, 1.6 * U, 1.6 * U, 0.8 * U, { x: s * 2.5 * U, y: 8 * U, z: 5.6 * U, det: 2, amb: 1 });
    Q.bulto(0x141414, 0.8 * U, 0.8 * U, 0.4 * U, { x: s * 2.5 * U, y: 8 * U, z: 6.25 * U, det: 2, amb: 0.9 });
    Q.bulto(0xd0605a, 1.5 * U, 1.1 * U, 0.5 * U, { x: s * 3.8 * U, y: 5.2 * U, z: 5.1 * U, det: 2, amb: 0.95 });
    Q.bulto(tono(c, 0.85), 1 * U, 1.8 * U, 0.8 * U, { x: s * 7 * U, y: 6.6 * U, det: 2 });
  }
  Q.bulto(tono(c, 0.9), 1 * U, 1.3 * U, 1.3 * U, { y: 6.2 * U, z: 6.4 * U, det: 2 });
  Q.tubo(0x7a0a2a, [[-2.4 * U, 3.7 * U, 5.7 * U], [0, 3 * U, 6.2 * U], [2.4 * U, 3.7 * U, 5.7 * U]], [0.3 * U, 0.65 * U, 0.3 * U], { lados: 5, pasos: 3 });
}
function casco(Q, c, mat) {
  const metal = mat !== 'leather', oscuro = tono(c, 0.62), claro = tono(c, 1.2), o = acabado(mat);
  Q.loft(c, secc([{ y: 5.85, rx: 4.72, rz: 4.78 }, { y: 6.6, rx: 4.82, rz: 4.82 }, { y: 8, rx: 4.5, rz: 4.48 }, { y: 9.2, rx: 3.4, rz: 3.32 }, { y: 9.9, rx: 1.9, rz: 1.8 }, { y: 10.15, rx: 0.1, rz: 0.1 }]), { lados: 20, pasos: 2, cuadrado: 2.5, ...o, pinta: (u) => {
    const y = u.y / U;
    if (y < 6.5) return oscuro;
    if (metal && Math.abs(u.a - 0.25) < 0.018) return claro;
    return null;
  } });
  // la nuca y las carrilleras dejan la cara libre
  Q.bulto(c, 4.5 * U, 2.8 * U, 0.95 * U, { y: 4 * U, z: -4.3 * U, det: 2, forma: cubico(0.7), ...o });
  for (const s of [-1, 1]) Q.bulto(metal ? c : tono(c, 0.85), 0.75 * U, 2.5 * U, 2.1 * U, { x: s * 4.4 * U, y: 3.9 * U, z: 0.3 * U, det: 2, forma: cubico(0.7), ...o });
  Q.tubo(ribete(c, mat), [[-4.6 * U, 6.5 * U, 1.2 * U], [-3 * U, 6.45 * U, 4 * U], [0, 6.4 * U, 4.8 * U], [3 * U, 6.45 * U, 4 * U], [4.6 * U, 6.5 * U, 1.2 * U]], [0.3 * U, 0.3 * U, 0.3 * U, 0.3 * U, 0.3 * U], { lados: 4, pasos: 2, ...o, amb: 1 }); // la banda de la frente
  if (metal) {
    Q.bulto(oscuro, 0.5 * U, 2 * U, 0.35 * U, { y: 5.1 * U, z: 4.55 * U, det: 1, ...o }); // el nasal
    for (const s of [-1, 1]) for (const a of [0.45, 1.05]) Q.bulto(claro, 0.26 * U, 0.26 * U, 0.2 * U, { x: Math.sin(a) * s * 4.6 * U, y: 6.15 * U, z: Math.cos(a) * 4.65 * U, det: 1, amb: 1 });
  } else for (const s of [-1, 1]) Q.tubo(tono(c, 1.35), [[s * 4.5 * U, 6.5 * U, 1.8 * U], [s * 4.7 * U, 6.5 * U, -1.8 * U]], [0.08 * U, 0.08 * U], { lados: 3, pasos: 1, amb: 1 });
  if (mat === 'diamond' || mat === 'jade') Q.tubo(claro, [[0, 9.5 * U, 2.9 * U], [0, 10.9 * U, 0.2 * U], [0, 9.7 * U, -3 * U]], [0.3 * U, 0.55 * U, 0.2 * U], { lados: 4, pasos: 4, brillo: 1.3 });
}
const TORSO_PLACA = [{ y: 3, rx: 3.65, rz: 2.4 }, { y: 4.8, rx: 3.5, rz: 2.3 }, { y: 6.6, rx: 3.75, rz: 2.45, z: 0.05 }, { y: 8.4, rx: 4.3, rz: 2.7, z: 0.14 }, { y: 9.9, rx: 4.8, rz: 2.75, z: 0.14 }, { y: 11, rx: 4.9, rz: 2.45, z: 0.04 }, { y: 11.9, rx: 3.9, rz: 2.05 }, { y: 12.45, rx: 2.4, rz: 1.85 }, { y: 12.6, rx: 1.9, rz: 1.6 }];
function pechera(Q, c, mat) {
  const metal = mat !== 'leather' && mat !== 'arpia', oscuro = tono(c, 0.62), claro = tono(c, 1.2), o = acabado(mat);
  Q.loft(c, secc(TORSO_PLACA), { lados: 22, pasos: 2, cuadrado: 2.25, ...o, pinta: (u) => {
    const y = u.y / U;
    if (y < 3.5 || y > 12.2) return oscuro;
    if (metal && y < 7.2 && Math.floor(y / 1.35) % 2 === 0) return tono(c, 0.82); // las láminas de la barriga
    if (metal && y > 7.2 && Math.abs(u.a - 0.25) < 0.012) return claro;
    return null;
  } });
  const rb = ribete(c, mat);
  Q.tubo(oscuro, [[0, 11.6 * U, 2.45 * U], [0, 9.4 * U, 2.95 * U], [0, 6.2 * U, 2.65 * U]], [0.25 * U, 0.55 * U, 0.3 * U], { lados: 5, pasos: 3, ...o }); // la quilla del pecho
  Q.bulto(rb, 0.75 * U, 0.75 * U, 0.3 * U, { y: 9.3 * U, z: 3.05 * U, det: 2, brillo: 1.4, amb: 1 }); // la gema
  Q.loft(rb, secc([{ y: 12, rx: 3.2, rz: 2.3 }, { y: 12.5, rx: 3.5, rz: 2.4 }, { y: 13, rx: 2.5, rz: 1.9 }]), { lados: 18, pasos: 1, cuadrado: 2.25, ...o }); // la gorguera (el cuello)
  for (const y of [3.2, 5.1]) Q.loft(rb, secc([{ y: y - 0.12, rx: 3.75, rz: 2.5 }, { y: y + 0.12, rx: 3.75, rz: 2.5 }]), { lados: 22, pasos: 1, cuadrado: 2.25, amb: 1 }); // los filos de las láminas
  if (!metal) for (let i = 0; i < 4; i++) { const y = 10.5 - i * 1.7; Q.tubo(tono(c, 1.4), [[-0.7 * U, y * U, 2.7 * U], [0.7 * U, (y - 0.4) * U, 2.7 * U]], [0.1 * U, 0.1 * U], { lados: 3, pasos: 1, amb: 1 }); } // el amarre
}
function hombrera(Q, c, mat, lado) {
  const o = acabado(mat), oscuro = tono(c, 0.62), x = -0.95 * lado * U;
  Q.bulto(c, 2.3 * U, 1.7 * U, 2.3 * U, { x, y: -0.45 * U, det: 3, ...o, forma: (v) => { if (v.y < 0) v.y *= 0.35; } });
  Q.bulto(oscuro, 2.15 * U, 0.6 * U, 2.15 * U, { x, y: -1.3 * U, det: 2, ...o });
  Q.bulto(c, 2.45 * U, 0.5 * U, 2.45 * U, { x, y: -2.1 * U, det: 2, ...o }); // las láminas que cuelgan
  Q.bulto(oscuro, 2.5 * U, 0.4 * U, 2.5 * U, { x, y: -2.8 * U, det: 2, ...o });
  Q.bulto(ribete(c, mat), 1.1 * U, 0.3 * U, 1.1 * U, { x, y: 0.9 * U, det: 1, brillo: 1.3, amb: 1 }); // el remache de arriba
}
function capaArpia(Q, c) {
  for (let i = 0; i < 9; i++) {
    const x = (-4 + i) * U, largo = 10.5 + (i % 3) * 1.1;
    Q.tubo(i % 2 ? c : tono(c, 0.75), [[x * 0.9, 11.8 * U, -2.5 * U], [x, 7 * U, -3.3 * U], [x * 1.15, (11.8 - largo) * U, -3.6 * U]], [0.8 * U, 0.75 * U, 0.08 * U], { lados: 4, pasos: 3, grano: 0.14 });
  }
  for (const s of [-1, 1]) Q.bulto(tono(c, 0.8), 2.1 * U, 1 * U, 2.6 * U, { x: s * 3.7 * U, y: 12 * U, z: -0.4 * U, det: 2, grano: 0.2 });
}
function faja(Q, c, mat) {
  const o = acabado(mat);
  Q.loft(c, secc([{ y: 0.2, rx: 3.55, rz: 2.3 }, { y: 1.4, rx: 3.8, rz: 2.45 }, { y: 2.8, rx: 3.55, rz: 2.3 }]), { lados: 18, pasos: 2, cuadrado: 2.25, ...o });
  Q.bulto(ribete(c, mat), 0.95 * U, 0.75 * U, 0.3 * U, { y: 1.8 * U, z: 2.5 * U, det: 1, ...o });
  Q.bulto(tono(c, 0.9), 1.9 * U, 0.9 * U, 0.35 * U, { y: -0.2 * U, z: 2.4 * U, det: 2, ...o }); // los faldones: uno al frente
  Q.bulto(tono(c, 0.78), 1.6 * U, 0.7 * U, 0.35 * U, { y: -1.2 * U, z: 2.3 * U, det: 2, ...o });
  for (const s of [-1, 1]) Q.bulto(tono(c, 0.85), 0.35 * U, 1.1 * U, 1.7 * U, { x: s * 3.7 * U, y: -0.3 * U, det: 2, ...o }); // y uno en cada cadera
}
const MUSLO = [{ y: -6.4, rx: 0.6, rz: 0.6, z: 0.08 }, { y: -6.1, rx: 1.5, rz: 1.55, z: 0.08 }, { y: -5.6, rx: 1.85, rz: 1.9, z: 0.08 }, { y: -3.4, rx: 2.15, rz: 2.33, z: 0.1 }, { y: -1, rx: 2.35, rz: 2.52 }, { y: 0.6, rx: 2.2, rz: 2.35 }, { y: 1.1, rx: 0.8, rz: 0.8 }];
const CANILLA = [{ y: -8.6, rx: 1.7, rz: 1.8, z: -0.1 }, { y: -8.3, rx: 1.95, rz: 2.05, z: -0.15 }, { y: -7.4, rx: 2.05, rz: 2.17, z: -0.15 }, { y: -5.6, rx: 1.85, rz: 1.9, z: 0.08 }, { y: -5.1, rx: 1.5, rz: 1.55, z: 0.08 }, { y: -4.8, rx: 0.6, rz: 0.6, z: 0.08 }];
function grebas(arriba, abajo, c, mat) {
  const metal = mat !== 'leather', o = acabado(mat), oscuro = tono(c, 0.62);
  const raya = (u) => { const y = u.y / U; if (y < -8 || (y > 0.2 && y < 0.8)) return oscuro; return metal && y > -5 && Math.floor(y / 1.5) % 2 === 0 ? tono(c, 0.84) : null; };
  arriba.loft(c, secc(MUSLO), { lados: 16, pasos: 2, cuadrado: 2, ...o, pinta: raya });
  abajo.loft(c, secc(CANILLA), { lados: 16, pasos: 2, cuadrado: 2, ...o, pinta: raya });
  abajo.bulto(metal ? tono(c, 1.15) : tono(c, 0.8), 1.6 * U, 1.4 * U, 0.95 * U, { y: -5.6 * U, z: 1.85 * U, det: 2, ...o }); // la rodillera
  abajo.tubo(ribete(c, mat), [[0, -4.9 * U, 2.2 * U], [0, -5.7 * U, 3 * U], [0, -6.6 * U, 2.3 * U]], [0.2 * U, 0.4 * U, 0.15 * U], { lados: 4, pasos: 2, ...o }); // la aleta de la rodilla
  arriba.bulto(tono(c, 0.8), 2.3 * U, 0.35 * U, 2.45 * U, { y: -3.2 * U, det: 2, ...o }); // un filo en el muslo
}
function botas(Q, c, mat) {
  const o = acabado(mat), oscuro = tono(c, 0.55);
  Q.loft(c, secc([{ y: -12.3, rx: 2, rz: 2.1, z: 0.1 }, { y: -10.9, rx: 1.95, rz: 2.02 }, { y: -9.4, rx: 1.92, rz: 2 }, { y: -8.7, rx: 2.12, rz: 2.2 }, { y: -8.45, rx: 1.6, rz: 1.7 }]), { lados: 16, pasos: 2, ...o, pinta: (u) => (u.y / U > -9.1 ? oscuro : null) });
  Q.bulto(c, 2 * U, 1.15 * U, 3 * U, { y: -11.2 * U, z: 0.85 * U, det: 2, ...o });
  Q.bulto(oscuro, 2.1 * U, 0.38 * U, 3.1 * U, { y: -12 * U, z: 0.85 * U, det: 1 });
  Q.bulto(ribete(c, mat), 1.5 * U, 0.75 * U, 0.9 * U, { y: -11.1 * U, z: 3.4 * U, det: 2, ...o }); // la puntera
  Q.loft(ribete(c, mat), secc([{ y: -8.55, rx: 2.18, rz: 2.26 }, { y: -9, rx: 2.1, rz: 2.18 }]), { lados: 16, pasos: 1, amb: 1 }); // el borde del caño
}
function canillera(Q, c, mat, lado) {
  const o = acabado(mat), x = -0.8 * lado;
  Q.bulto(ribete(c, mat), 1.2 * U, 0.7 * U, 1.1 * U, { x: x * 0.9, y: -6.4 * U, z: -1.7 * U, det: 2, ...o }); // la codera
  for (const y of [-7.4, -8.4]) Q.bulto(ribete(c, mat), 0.3 * U, 0.3 * U, 0.2 * U, { x: x * 1.0, y: y * U, z: 1.85 * U, det: 1, amb: 1 }); // remaches
  Q.loft(c, secc([{ y: -9.1, rx: 1.55, rz: 1.6, x }, { y: -8.6, rx: 1.78, rz: 1.84, x }, { y: -7, rx: 1.74, rz: 1.8, x }, { y: -6.5, rx: 1.3, rz: 1.35, x }]), { lados: 12, pasos: 2, ...o });
}
function escudo(Q, c, mat) {
  const oscuro = tono(c, 0.6), claro = tono(c, 1.25), o = acabado(mat);
  // redondeado y un poquito combo, con borde y el umbo al centro; pegado al antebrazo (v11.11.1: antes quedaba 5 cm afuera)
  Q.bulto(c, 0.7 * U, 5.3 * U, 4.7 * U, { x: -2.35 * U, y: -6 * U, z: 1 * U, det: 4, ...o, forma: (v) => { v.x -= (v.y * v.y + v.z * v.z) * 0.45; }, pinta: (u) => (Math.hypot(u.y, u.z) > 0.86 ? oscuro : null) });
  Q.bulto(claro, 0.8 * U, 1.35 * U, 1.35 * U, { x: -2.9 * U, y: -6 * U, z: 1 * U, det: 2, ...o });
}

// arma las mallas de una pieza. Devuelve la lista para que el vestidor las anime
export function armarArmadura(slot, def, P, mat) {
  const c = hexDe(def.color), out = [];
  const poner = (grupo, pieza) => {
    const m = pieza.malla();
    m.material.dispose(); m.material = mat;
    if (grupo.esJunta) m.geometry.translate(-grupo.position.x, -grupo.position.y, -grupo.position.z);
    grupo.add(m); out.push(m);
  };
  const junta = (miembro) => { if (miembro.junta) miembro.junta.esJunta = true; return miembro.junta || miembro; };
  if (slot === 0) {
    const Q = new Pieza();
    if (def.mat === 'mascarada') mascarada(Q, c);
    else if (def.mat === 'sabanero') sombreroAla(Q, c, 7.6);
    else if (def.mat === 'tule') sombreroAla(Q, c, 10.2);
    else if (/sombrero/.test(def.key)) sombreroAla(Q, c, 7);
    else casco(Q, c, def.mat);
    poner(P.head, Q);
  } else if (slot === 1) {
    const T = new Pieza();
    pechera(T, c, def.mat);
    if (def.mat === 'arpia') capaArpia(T, c);
    poner(P.body, T);
    for (const [brazo, lado] of [[P.armL, -1], [P.armR, 1]]) {
      const H = new Pieza(); hombrera(H, c, def.mat, lado); poner(brazo, H);
      const A = new Pieza(); canillera(A, c, def.mat, lado); poner(junta(brazo), A);
    }
  } else if (slot === 2) {
    const F = new Pieza(); faja(F, c, def.mat); poner(P.body, F);
    for (const pierna of [P.legL, P.legR]) { const A = new Pieza(), B = new Pieza(); grebas(A, B, c, def.mat); poner(pierna, A); poner(junta(pierna), B); }
  } else if (slot === 3) {
    for (const pierna of [P.legL, P.legR]) { const B = new Pieza(); botas(B, c, def.mat); poner(junta(pierna), B); }
  } else {
    const E = new Pieza(); escudo(E, c, def.mat); poner(P.armL, E);
  }
  return out;
}
