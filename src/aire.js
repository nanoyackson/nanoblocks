// Por el aire: el parapente. Se abre con clic derecho mientras uno va cayendo (tírese de un cerro): planea hacia
// donde mira, baja despacito, en las térmicas (arena caliente, volcanes, de día) sube un poquito y al tocar el piso
// se cierra solo. Con Shift baja más rápido. Sin daño por caída mientras va colgado.
import * as THREE from 'three';
import { influencerEvento } from './influencer.js';

export const PARAPENTE = 476;

function vela() {
  // el origen del grupo son las bandas (a la altura de los hombros): así la vela se mece encima del piloto
  const g = new THREE.Group();
  const N = 11, R = 4.4, H = 4.7, A = 0.85;
  const COL = [0xe83a3a, 0xf8f0e0, 0x2a6ad8, 0xf8f0e0, 0xe8b020, 0x2aa84a];
  const mat = (c) => new THREE.MeshBasicMaterial({ color: c });
  const boca = mat(0x1a1a22), pts = [], frenos = [];
  for (let i = 0; i < N; i++) {
    const f = (i / (N - 1)) * 2 - 1, a = f * A;
    const cuerda = 2.0 * (1 - 0.45 * f * f), grueso = 0.34 * (1 - 0.4 * f * f);
    const ancho = R * (2 * A / (N - 1)) * 1.04;
    const x = Math.sin(a) * R, y = H - R + Math.cos(a) * R;
    const celda = new THREE.Group();
    celda.position.set(x, y, 0.15 * f * f);
    celda.rotation.z = -a;
    const caja = new THREE.Mesh(new THREE.BoxGeometry(ancho, grueso, cuerda), mat(COL[Math.abs(i - 5)]));
    celda.add(caja);
    // la boca de la celda (por donde entra el aire), al frente
    const b = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.8, grueso * 0.55, 0.06), boca);
    b.position.set(0, -grueso * 0.1, cuerda / 2 + 0.01);
    celda.add(b);
    g.add(celda);
    // dos cuerdas por celda (adelante y atrás) hasta la banda de su lado
    const lado = f < 0 || (f === 0 && i < N / 2) ? -1 : 1;
    const by = y - Math.cos(a) * grueso / 2, bx = x + Math.sin(a) * grueso / 2;
    for (const dz of [cuerda * 0.3, -cuerda * 0.25]) pts.push(bx, by, dz, lado * 0.28, 0, 0.05);
    // frenos: del borde de atrás de las puntas a las manos
    if (Math.abs(f) > 0.6) frenos.push(bx, by, -cuerda * 0.45, lado * 0.32, 0.55, -0.05);
  }
  const lineas = (arr, color) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color }));
  };
  g.add(lineas(pts, 0xe8e8e8), lineas(frenos, 0xff8a3a));
  // el arnés: la silla, el respaldo y las cintas hasta las bandas
  const silla = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.16, 0.72), mat(0x2a3a5a));
  silla.position.set(0, -0.9, 0.02);
  const respaldo = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.7, 0.14), mat(0x223048));
  respaldo.position.set(0, -0.55, -0.34);
  const borde = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.74), mat(0xe8b020));
  borde.position.set(0, -0.82, 0.02);
  g.add(silla, respaldo, borde);
  g.add(lineas([-0.28, 0, 0.05, -0.3, -0.85, 0.1, 0.28, 0, 0.05, 0.3, -0.85, 0.1, -0.28, 0, 0.05, -0.3, -0.5, -0.32, 0.28, 0, 0.05, 0.3, -0.5, -0.32], 0x1a1a1a));
  return g;
}

export function abrirParapente(g) {
  const b = g.player.body;
  if (g.parapente) { cerrar(g, '🪂 Cerró el parapente'); return; }
  if (b.onGround || b.inWater) { g.ui.toast('🪂 Tírese de algo alto y ábralo cayendo (clic derecho en el aire)', 2200); return; }
  const mesh = vela();
  g.scene.add(mesh);
  mesh.scale.set(0.15, 0.15, 0.15);
  g.parapente = { mesh, t: 0, x0: b.pos.x, z0: b.pos.z, max: 0, roll: 0, yawPrev: g.player.yaw };
  g.audio.play('dig.cloth', { ui: true, vol: 0.7, pitch: 0.8 });
  g.ui.toast('🪂 Parapente abierto · Shift baja más rápido · clic derecho lo cierra', 3000);
  g.achieve('parapente', 'Vuelo en parapente');
  influencerEvento(g, 'parapente', 22000);
}
function cerrar(g, txt) {
  const P = g.parapente;
  if (!P) return;
  // la vela se pliega y se cae (se anima aparte, ya sin jugador)
  (g.velasCayendo ||= []).push({ mesh: P.mesh, t: 0 });
  g.parapente = null;
  if (txt) g.ui.toast(txt, 1600);
}

// después del combate (que limpia forcedVel): manda la velocidad del siguiente cuadro
export function tickParapente(g, dt) {
  const P = g.parapente;
  if (!P) return;
  const pl = g.player, b = pl.body;
  const held = g.inventory.held;
  if (!pl.alive || b.inWater || !held || held.id !== PARAPENTE) { cerrar(g, b.inWater ? '🪂 Aterrizó en el agua… ¡splash!' : null); return; }
  if (b.onGround) {
    const d = Math.hypot(b.pos.x - P.x0, b.pos.z - P.z0);
    cerrar(g, `🪂 ¡Aterrizaje! Voló ${Math.round(d)} bloques`);
    if (d >= 150) g.achieve('parapente_lejos', 'Piloto de parapente');
    g.audio.play('soltar', { ui: true, vol: 0.6 });
    return;
  }
  P.t += dt;
  const sneak = g.keys && (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight'));
  const fx = -Math.sin(pl.yaw), fz = -Math.cos(pl.yaw);
  const vel = sneak ? 6 : 9;
  pl.forcedVel = { x: fx * vel, z: fz * vel };
  // térmicas: de día sobre arena, roca caliente o cerca de los volcanes
  const col = g.world.gen.column(Math.floor(b.pos.x), Math.floor(b.pos.z));
  const termica = g.daylight > 0.5 && ['desert', 'beach', 'volcano', 'paramo', 'bosque_seco'].includes(col.biome) && b.pos.y - col.h < 40;
  const caida = sneak ? -5 : termica ? 0.6 : -1.6;
  // al abrir frena de golpe; después mantiene la bajada (la gravedad del siguiente cuadro casi no alcanza a sumar)
  b.vel.y = P.t < 0.6 ? b.vel.y + (caida - b.vel.y) * Math.min(1, dt * 6) : caida;
  b.fallStart = null;
  if (termica && !P.termica) { P.termica = true; g.ui.toast('🌬 ¡Una térmica! El aire caliente lo sube', 1600); g.achieve('termica', 'A la caza de térmicas'); }
  if (!termica) P.termica = false;
  P.max = Math.max(P.max, b.pos.y - col.h);
  // la vela encima, inclinada con el giro
  // se despliega con un rebotito y se inclina hacia adentro al doblar
  const ab = Math.min(1, P.t / 0.55), e = ab - 1, esc = 1 + 2.2 * e * e * e + 1.2 * e * e;
  P.mesh.scale.set(esc, Math.max(0.15, esc), esc);
  const yawV = g.foto ? g.foto.yaw : pl.yaw;
  let giro = yawV - P.yawPrev;
  while (giro > Math.PI) giro -= Math.PI * 2;
  while (giro < -Math.PI) giro += Math.PI * 2;
  P.yawPrev = yawV;
  P.roll += (Math.max(-0.35, Math.min(0.35, giro / Math.max(dt, 1e-4) * 0.2)) - P.roll) * Math.min(1, dt * 3);
  // colgado de las bandas: la vela se mece encima, se va un poquito adelante al frenar y atrás al acelerar (Shift)
  P.cabeceo = (P.cabeceo || 0) + ((sneak ? 0.18 : -0.06) - (P.cabeceo || 0)) * Math.min(1, dt * 2);
  P.mesh.position.set(b.pos.x, b.pos.y + 1.45, b.pos.z);
  P.mesh.rotation.set(0, (g.foto ? g.foto.yaw : pl.yaw) + Math.PI, 0);
  P.mesh.rotateZ(-P.roll + Math.sin(P.t * 0.8) * 0.035);
  P.mesh.rotateX(-P.cabeceo + Math.sin(P.t * 1.1) * 0.025);
  // viento en los oídos (partículas que pasan)
  if (Math.random() < dt * 10) g.particles.spawn(b.pos.x + fx * 6 + (Math.random() - 0.5) * 4, b.pos.y + 1 + (Math.random() - 0.5) * 3, b.pos.z + fz * 6 + (Math.random() - 0.5) * 4, [0.95, 0.97, 1], -fx * 12, 0, -fz * 12, 0.5, 0);
}
export function limpiarAire(g) { cerrar(g, null); for (const v of g.velasCayendo || []) g.scene.remove(v.mesh); g.velasCayendo = []; }
// las velas que se cierran: se pliegan y caen despacito antes de desaparecer
export function tickVelas(g, dt) {
  if (!g.velasCayendo || !g.velasCayendo.length) return;
  g.velasCayendo = g.velasCayendo.filter((v) => {
    v.t += dt;
    const k = Math.min(1, v.t / 0.7);
    v.mesh.scale.set(1 - k * 0.85, 1 - k * 0.9, 1 - k * 0.6);
    v.mesh.position.y -= dt * (2 + k * 6);
    v.mesh.rotateZ(dt * 1.5);
    if (k >= 1) { g.scene.remove(v.mesh); return false; }
    return true;
  });
}
