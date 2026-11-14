// Cada arma se mueve a su manera en la mano (v4.97). La espada corta de lado, de revés y remata con una estocada; el hacha baja en
// diagonal y después un tajo ancho; el mazo y el garrote van de arriba, de lado y rematan con un mazazo al suelo; la lanza da
// estocadas largas; el cuchillo, puñaladas cortitas. El golpe fuerte es el remate con más vuelo. Cubrirse sin escudo cruza el arma
// delante de la cara. Todo va como diferencias sobre la pose de reposo de cada ítem, así sirve para cualquier dibujo.
// El machete tiene su propia animación (macheteHand en game.js).
import * as THREE from 'three';
import { armarBrazoMano } from './personaje.js';

// cada paso: armado (U) y final del golpe (E), en diferencias de posición (p) y giro (r) sobre la pose
const K = (p, r) => ({ p, r });
const DERECHA = { U: K([0.3, 0.06, 0.08], [0.25, 0.7, -0.9]), E: K([-0.5, -0.16, -0.18], [-0.45, -0.75, 1.0]), estela: 1 };
const REVES = { U: K([-0.35, 0.02, 0.05], [0.2, -0.6, 1.0]), E: K([0.2, -0.12, -0.2], [-0.4, 0.7, -0.8]), estela: -1 };
const ESTOCADA = { U: K([0.04, 0.02, 0.24], [0.2, 0, 0]), E: K([-0.12, 0.06, -0.62], [-0.3, 0, 0.05]), estela: 0 };
const ARRIBA = { U: K([0.12, 0.34, 0.14], [1.05, 0.25, -0.3]), E: K([-0.3, -0.12, -0.25], [-1.05, -0.1, 0.35]), estela: 2 };
const MAZAZO = { U: K([0.02, 0.5, 0.22], [1.4, 0, -0.1]), E: K([-0.3, -0.15, -0.3], [-1.2, 0, 0.25]), estela: 2 };
const JAB = { U: K([0.06, -0.06, 0.16], [0.15, 0.15, -0.1]), E: K([-0.16, 0.08, -0.5], [-0.15, -0.1, 0.1]), estela: 0 };
const JAB_IZQ = { izq: true, estela: 0 };
const GANCHO = { U: K([0.16, -0.26, 0.16], [-0.3, 0.3, -0.4]), E: K([-0.22, 0.28, -0.42], [0.7, -0.2, 0.3]), estela: 0 };
const PUNAL = { U: K([0.05, -0.04, 0.12], [0.1, 0.1, 0]), E: K([-0.08, 0.04, -0.4], [-0.2, -0.05, 0]), estela: 0 };
export const MOVIDAS = {
  puno: [JAB, JAB_IZQ, GANCHO],
  espada: [DERECHA, REVES, ESTOCADA],
  hacha: [ARRIBA, DERECHA],
  garrote: [ARRIBA, REVES, MAZAZO],
  mazo: [ARRIBA, DERECHA, MAZAZO],
  lanza: [ESTOCADA, ESTOCADA, { ...ESTOCADA, E: K([-0.14, 0.06, -0.85], [-0.32, 0, 0.05]) }],
  cuchillo: [PUNAL, { ...PUNAL, E: K([0.1, 0.02, -0.38], [-0.15, 0.2, 0]) }, { ...PUNAL, E: K([-0.04, 0.1, -0.5], [-0.4, 0, 0]) }],
};
const GUARDIA = K([-0.28, 0.14, 0.06], [0.25, 0.25, 1.35]);

const easeOut = (k) => 1 - (1 - k) * (1 - k), easeIn = (k) => k * k * k, easeIO = (k) => k * k * (3 - 2 * k);
export const movidaDe = (A) => { const L = A && MOVIDAS[A.clase]; return L ? L[Math.max(0, Math.min(L.length - 1, A.heavy ? L.length - 1 : A.paso))] : null; };
// la curva del golpe, compartida: 0 en reposo, 1 armado, -1 al final
export function curvaGolpe(g) {
  const A = g.golpeAnim;
  if (!A || !(g.swing > 0)) return 0;
  const t = 1 - g.swing, tu = A.heavy ? 0.3 : 0.18;
  if (t < tu) return easeOut(t / tu);
  if (t < tu + 0.22) { const k = (t - tu) / 0.22; return 1 - 2 * k * k; }
  if (t < tu + 0.36) return -1;
  return -(1 - easeIO((t - tu - 0.36) / (1 - tu - 0.36)));
}
const CERO = { yaw: 0, pitch: 0, roll: 0 };
// la vista acompaña el golpe: se carga hacia un lado y se va con el arma
export function golpeCamara(g) {
  const a = curvaGolpe(g);
  if (!a) return CERO;
  const M = movidaDe(g.golpeAnim), H = g.golpeAnim.heavy ? 1.6 : 1, dir = M ? M.estela : 1;
  if (dir === 2) return { yaw: 0, pitch: a * 0.045 * H, roll: 0 };
  if (dir === 0) return { yaw: 0, pitch: a * 0.012 * H, roll: 0 };
  return { yaw: -a * 0.032 * dir * H, pitch: 0, roll: a * 0.028 * dir * H };
}
// se mete en el golpe: da un paso hacia adelante, más con lo que llega lejos, menos con lo que pesa
const PASO = { puno: 1.6, cuchillo: 2.6, machete: 2.4, espada: 2.6, hacha: 1.8, garrote: 1.6, mazo: 1.2, lanza: 3.4, pico: 1, herramienta: 1 };
export function empujarAlGolpe(g, clase, heavy) {
  const b = g.player.body;
  if (!b.onGround || g.mode !== 'survival') return;
  const v = (PASO[clase] || 1.4) * (heavy ? 1.7 : 1), y = g.player.yaw;
  b.vel.x += -Math.sin(y) * v; b.vel.z += -Math.cos(y) * v;
}
// ¿todavía le llega? Un poquito de gracia en la distancia, y tiene que estar más o menos al frente
export function golpeLlega(g, m, alcance) {
  const p = g.player.body.pos, q = m.body.pos, dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), y = g.player.yaw;
  if (d > alcance + (m.kind.w || 0.6) * 0.5 + 0.9 || Math.abs(q.y - p.y) > 3.5) return false;
  return d < 1 || (dx / d) * -Math.sin(y) + (dz / d) * -Math.cos(y) > 0.2;
}
// la mano izquierda, para los puñetazos: aparece, pega y se va
function manoIzquierda(g, A, t) {
  const on = !!A && t < 1;
  if (g.manoIzq) g.manoIzq.visible = on;
  if (!on) return;
  // se arma con la apariencia de ahora: si cambió (vestidor u otro mundo), la vieja se libera y se hace otra
  const apK = JSON.stringify((g.meta && g.meta.apariencia) || {});
  if (g.manoIzq && g.manoIzq.userData.apK !== apK) {
    g.handScene.remove(g.manoIzq);
    g.manoIzq.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((x) => x.dispose()); });
    g.manoIzq = null;
  }
  if (!g.manoIzq) {
    const m = armarBrazoMano(JSON.parse(apK));
    m.scale.x = -1; m.userData.apK = apK;
    g.handScene.add(m); g.manoIzq = m;
  }
  const m = g.manoIzq, tu = 0.18;
  m.visible = true;
  let z = 0.1, y = -0.42;
  if (t < tu) { const k = easeOut(t / tu); z = 0.1 + k * 0.12; y = -0.42 - k * 0.03; }
  else if (t < tu + 0.22) { const k = easeIn((t - tu) / 0.22); z = 0.22 - k * 0.92; y = -0.45 + k * 0.18; }
  else if (t < tu + 0.36) { z = -0.7; y = -0.27; }
  else { const k = easeIO((t - tu - 0.36) / (1 - tu - 0.36)); z = -0.7 + k * 1.1; y = -0.27 - k * 0.3; }
  m.position.set(-0.3, y, z - 0.25);
  const luz = g.player ? g.entities.lightAt(g.player.body.pos.x, g.player.body.pos.y + 1, g.player.body.pos.z) : 1;
  m.material.color.setScalar(luz);
}
// devuelve true si se encargó de la mano
export function animarArma(g, root, pose, dt, bob, amp, drop) {
  const A = g.golpeAnim;
  const izq = A && g.swing > 0 && movidaDe(A) && movidaDe(A).izq;
  if (izq || g.manoIzq) manoIzquierda(g, izq ? A : null, izq ? 1 - g.swing : 1);
  // cubrirse con el arma (sin escudo): el arma cruzada delante
  g.guardiaK = (g.guardiaK || 0) + ((g.blocking && !g.shieldMesh?.visible ? 1 : 0) - (g.guardiaK || 0)) * Math.min(1, dt * 14);
  const golpe = A && g.swing > 0 && MOVIDAS[A.clase];
  if (!golpe && g.guardiaK < 0.01) { if (g.armaFx) g.armaFx.visible = false; if (!(g.swing > 0)) g.golpeAnim = null; return false; }
  if (g.eating) return false;
  let dp = [0, 0, 0], dr = [0, 0, 0], t = 1, M = null;
  if (golpe) {
    const L = MOVIDAS[A.clase];
    M = L[Math.max(0, Math.min(L.length - 1, A.heavy ? L.length - 1 : A.paso))];
    const H = A.heavy ? 1.3 : 1;
    t = 1 - g.swing;
    // armado, golpe (rapidísimo), se queda un instante al final y vuelve
    const Z = K([0, 0, 0], [0, 0, 0]), U = M.izq ? K([0.05, -0.08, 0.14], [0.1, 0, 0]) : M.U, E = M.izq ? K([0.08, -0.06, 0.16], [0.1, 0, 0]) : M.E; // si pega la izquierda, la derecha se guarda
    let a = Z, b = Z, k = 0;
    const tu = A.heavy ? 0.3 : 0.18;
    if (t < tu) { a = Z; b = U; k = easeOut(t / tu); } else if (t < tu + 0.22) { a = U; b = E; k = easeIn((t - tu) / 0.22); } else if (t < tu + 0.36) { a = E; b = E; } else { a = E; b = Z; k = easeIO((t - tu - 0.36) / (1 - tu - 0.36)); }
    for (let i = 0; i < 3; i++) { dp[i] = (a.p[i] + (b.p[i] - a.p[i]) * k) * H; dr[i] = (a.r[i] + (b.r[i] - a.r[i]) * k) * H; }
    // el temblor del impacto
    if (t >= tu + 0.22 && t < tu + 0.36) dp[0] += Math.sin(t * 140) * 0.008;
  }
  const gk = g.guardiaK;
  for (let i = 0; i < 3; i++) { dp[i] += GUARDIA.p[i] * gk; dr[i] += GUARDIA.r[i] * gk; }
  const lag = g.handLag || { x: 0, y: 0 };
  root.position.set(pose.p[0] + dp[0] + Math.sin(bob) * 0.025 * amp + lag.x, pose.p[1] + dp[1] - Math.abs(Math.cos(bob)) * 0.03 * amp - drop + lag.y + (g.handAire || 0), pose.p[2] + dp[2]);
  root.rotation.set(pose.r[0] + dr[0], pose.r[1] + dr[1], pose.r[2] + dr[2]);
  lag.x *= Math.pow(0.002, dt); lag.y *= Math.pow(0.002, dt);
  estela(g, M, t, A && A.heavy);
  return true;
}
// la estela del filo: un arco que se dibuja con el corte (de lado, de revés o de arriba para abajo)
function estela(g, M, t, heavy) {
  if (!g.armaFx) {
    g.armaFx = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, color: 0xdff0ff }));
    g.armaFx.renderOrder = 10;
    g.handScene.add(g.armaFx);
  }
  const fx = g.armaFx, tu = heavy ? 0.3 : 0.18;
  const on = !!M && M.estela !== 0 && t > tu && t < tu + 0.48;
  fx.visible = on;
  if (!on) return;
  const grow = Math.min(1, (t - tu) / 0.22), len = Math.PI * 0.9 * grow;
  let start;
  if (M.estela === 2) { start = Math.PI / 2 - len; fx.rotation.set(0, 0.5, 0); fx.position.set(-0.05, -0.25, -1.0); } // de arriba para abajo
  else { start = M.estela > 0 ? 0.5 : Math.PI - 0.5 - len; fx.rotation.set(-1.25, 0, 0); fx.position.set(0.1, -0.3, -0.85); } // de lado
  fx.geometry.dispose();
  fx.geometry = new THREE.RingGeometry(0.42, 0.42 + 0.13 * (0.4 + grow * 0.6), 28, 1, start, Math.max(0.01, len));
  fx.material.opacity = t < tu + 0.22 ? (heavy ? 0.75 : 0.5) : (heavy ? 0.75 : 0.5) * (1 - (t - tu - 0.22) / 0.26);
}
