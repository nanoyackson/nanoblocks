// El cuerpo humano (v10.8): cadera, cintura, costillas, pecho, hombros que caen y cuello, hechos por secciones con sombreado suave.
// Lo usan el personaje y la gente. Las medidas van en dieciseisavos de bloque; `s` es cuánto vale cada uno y `y0` dónde queda la cadera.
// complexion: { hombro, cintura, cadera } multiplican el ancho, para que no todos salgan del mismo molde.
import * as THREE from 'three';

const SECCIONES = (c) => [
  { y: 0, rx: 3.3 * c.cadera, rz: 2.05 },
  { y: 1.4, rx: 3.55 * c.cadera, rz: 2.2 },
  { y: 3, rx: 3.3 * c.cadera, rz: 2.05 },
  { y: 4.8, rx: 3.05 * c.cintura, rz: 1.9 },
  { y: 6.6, rx: 3.3 * c.cintura, rz: 2.05, z: 0.05 },
  { y: 8.4, rx: 3.9 * c.hombro, rz: 2.3, z: 0.14 },
  { y: 9.9, rx: 4.45 * c.hombro, rz: 2.35, z: 0.14 },
  { y: 11, rx: 4.6 * c.hombro, rz: 2.05, z: 0.04 },
  { y: 11.9, rx: 3.6 * c.hombro, rz: 1.65 },
  { y: 12.6, rx: 2, rz: 1.45 },
  { y: 13.6, rx: 1.65, rz: 1.45 },
];
const BASE = { hombro: 1, cintura: 1, cadera: 1 };
// a qué distancia queda el frente del torso a una altura: para pegarle botones, bolsas y hebillas sin que floten
export function frenteTorso(yU, complexion = BASE) {
  const S = SECCIONES({ ...BASE, ...complexion });
  for (let i = 0; i < S.length - 1; i++) if (yU <= S[i + 1].y) { const t = (yU - S[i].y) / (S[i + 1].y - S[i].y); return (S[i].z || 0) + ((S[i + 1].z || 0) - (S[i].z || 0)) * t + S[i].rz + (S[i + 1].rz - S[i].rz) * t; }
  return 1.45;
}
export function torsoHumano(P, { color, pinta, s, y0 = 0, complexion = BASE, lados = 24, pasos = 3 }) {
  const secciones = SECCIONES({ ...BASE, ...complexion }).map((q) => ({ y: y0 + q.y * s, rx: q.rx * s, rz: q.rz * s, z: (q.z || 0) * s }));
  P.loft(color, secciones, { lados, pasos, cuadrado: 2.25, pinta: pinta ? (u) => pinta({ ...u, yu: (u.y - y0) / s }) : undefined });
}
// el brazo cuelga un poquito abierto: del hombro, que entra en el torso, al codo, al antebrazo y a la muñeca. `lado` es -1 o 1
// con `abajo` (otra Pieza) el brazo sale en dos: del codo para arriba en P y antebrazo y mano en `abajo`; devuelve dónde queda la junta
export function brazoHumano(P, { s, lado, tela, piel, manga = -6.6, puno = null, lados = 14, pasos = 2, fuerte = 1, pinta, abajo = null }) {
  const dentro = -1.6 * lado * s, afuera = -0.75 * lado * s, r = (v) => v * s * fuerte;
  const S = [
    { y: -10 * s, rx: r(1.05), rz: r(1.0), x: afuera },
    { y: -9.2 * s, rx: r(1.1), rz: r(1.05), x: afuera },
    { y: -7.6 * s, rx: r(1.42), rz: r(1.4), x: afuera * 1.05 },
    { y: -6 * s, rx: r(1.3), rz: r(1.32), x: afuera * 1.3 },
    { y: -4 * s, rx: r(1.45), rz: r(1.5), x: dentro * 0.72 },
    { y: -2.4 * s, rx: r(1.55), rz: r(1.62), x: dentro * 0.86 },
    { y: -1.2 * s, rx: r(1.62), rz: r(1.68), x: dentro * 0.96 },
    { y: -0.4 * s, rx: r(1.3), rz: r(1.4), x: dentro },
    { y: 0.05 * s, rx: r(0.45), rz: r(0.5), x: dentro },
  ];
  const opc = { lados, pasos, cuadrado: 2, pinta: (u) => { const yu = u.y / s; if (puno && yu < manga + 0.55 && yu >= manga - 0.1) return puno; if (yu < manga) return piel; return pinta ? pinta({ ...u, yu }) : null; } };
  let junta = null, M = P;
  if (abajo) {
    // el codo: las dos mitades terminan redondas y se montan una sobre la otra, para que al doblar no se abra un hueco
    const jy = -5 * s, jx = (afuera * 1.3 + dentro * 0.72) / 2;
    junta = { x: jx, y: jy, z: 0 };
    abajo.loft(tela, [...S.slice(0, 4), { y: jy, rx: r(1.38), rz: r(1.42), x: jx }, { y: jy + 0.6 * s, rx: r(1.1), rz: r(1.12), x: jx }, { y: jy + 0.9 * s, rx: r(0.4), rz: r(0.4), x: jx }], opc);
    P.loft(tela, [{ y: jy - 0.9 * s, rx: r(0.4), rz: r(0.4), x: jx }, { y: jy - 0.6 * s, rx: r(1.1), rz: r(1.12), x: jx }, { y: jy, rx: r(1.38), rz: r(1.42), x: jx }, ...S.slice(4)], opc);
    M = abajo;
  } else P.loft(tela, S, opc);
  // la mano: palma, cuatro dedos y el pulgar
  const x = afuera;
  M.bulto(piel, 1.25 * s, 1.35 * s, 0.85 * s, { x, y: -10.7 * s, det: 2, grano: 0.04 });
  for (const d of [-1, -0.33, 0.33, 1]) M.tubo(piel, [[x + d * 0.95 * s, -11.4 * s, 0.15 * s], [x + d * 1.02 * s, -12.3 * s, 0.3 * s], [x + d * 0.98 * s, -12.95 * s, 0.5 * s]], [0.34 * s, 0.3 * s, 0.2 * s], { lados: 4, pasos: 2, grano: 0.04 });
  M.tubo(piel, [[x - lado * 1.05 * s, -10.2 * s, 0.6 * s], [x - lado * 1.45 * s, -11 * s, 1.1 * s], [x - lado * 1.4 * s, -11.7 * s, 1.35 * s]], [0.42 * s, 0.34 * s, 0.22 * s], { lados: 4, pasos: 2, grano: 0.04 });
  return junta;
}
// la pierna: muslo, rodilla, pantorrilla y tobillo
export function piernaHumana(P, { s, tela, piel = null, hasta = null, lados = 14, pasos = 2, fuerte = 1, pinta, abajo = null }) {
  const r = (v) => v * s * fuerte;
  const S = [
    { y: -11.6 * s, rx: r(1.2), rz: r(1.3) },
    { y: -9.6 * s, rx: r(1.3), rz: r(1.4) },
    { y: -7.4 * s, rx: r(1.65), rz: r(1.8), z: -0.15 * s },
    { y: -5.6 * s, rx: r(1.55), rz: r(1.6), z: 0.08 * s },
    { y: -3.4 * s, rx: r(1.85), rz: r(2.0), z: 0.1 * s },
    { y: -1 * s, rx: r(2.05), rz: r(2.2) },
    { y: 0.6 * s, rx: r(1.9), rz: r(2.05) },
    { y: 1.2 * s, rx: r(0.6), rz: r(0.6) },
  ];
  const opc = { lados, pasos, cuadrado: 2, pinta: (u) => { const yu = u.y / s; if (pinta) { const c = pinta({ ...u, yu }); if (c != null) return c; } return piel != null && hasta != null && yu < hasta ? piel : null; } };
  if (!abajo) { P.loft(tela, S, opc); return null; }
  // la rodilla, igual que el codo
  const jy = -5.6 * s, jz = 0.08 * s;
  abajo.loft(tela, [...S.slice(0, 3), { y: jy, rx: r(1.55), rz: r(1.6), z: jz }, { y: jy + 0.6 * s, rx: r(1.25), rz: r(1.3), z: jz }, { y: jy + 0.95 * s, rx: r(0.45), rz: r(0.45), z: jz }], opc);
  P.loft(tela, [{ y: jy - 0.95 * s, rx: r(0.45), rz: r(0.45), z: jz }, { y: jy - 0.6 * s, rx: r(1.25), rz: r(1.3), z: jz }, { y: jy, rx: r(1.55), rz: r(1.6), z: jz }, ...S.slice(4)], opc);
  return { x: 0, y: jy, z: jz };
}
// monta las dos mitades en un miembro: la de arriba en el grupo y la de abajo en `grupo.junta`, que es lo que se dobla.
// El grupo de la junta se conserva si el personaje se rearma, porque la armadura también cuelga de ahí.
export function articular(grupo, arriba, abajo, junta, marca = false) {
  let q = grupo.junta;
  if (!q) { q = new THREE.Group(); grupo.junta = q; grupo.add(q); }
  q.position.set(junta.x, junta.y, junta.z);
  const a = arriba.malla(), b = abajo.malla();
  b.geometry.translate(-junta.x, -junta.y, -junta.z);
  if (marca) { a.userData.pj = true; b.userData.pj = true; }
  grupo.add(a); q.add(b);
  return q;
}
// el paso: la rodilla se dobla cuando la pierna va hacia adelante; sentado, según qué tan alto tenga el muslo
export function doblarRodilla(pierna, fase, amp, dt, enAire = 0) {
  if (!pierna.junta) return;
  const paso = Math.max(0, -Math.cos(fase)) * amp, sentado = -pierna.rotation.x > 0.8 ? -pierna.rotation.x : 0;
  const meta = Math.max(0.04 + paso, enAire * 0.55, sentado);
  pierna.junta.rotation.x += (meta - pierna.junta.rotation.x) * Math.min(1, dt * 16);
}
// el codo acompaña al brazo: casi estirado atrás, más doblado adelante. Con algo agarrado va derecho, porque lo agarrado cuelga del brazo
export function doblarCodo(brazo, dt, libre = true) {
  if (!brazo.junta) return;
  const meta = !libre ? 0 : brazo.codoMeta ?? -(0.14 + Math.min(0.8, Math.max(0, -brazo.rotation.x) * 0.5)); // codoMeta: un gesto que pide su propio doblez
  brazo.junta.rotation.x += (meta - brazo.junta.rotation.x) * Math.min(1, dt * 12);
}
