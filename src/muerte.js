// La muerte con su momento: antes la pantalla de «Se murió» salía de golpe. Ahora el mundo va en cámara lenta un instante, el
// personaje trastabilla y se va de espaldas hacia el lado contrario del golpe (rebota contra el suelo y queda con los brazos
// abiertos), la cámara sale del cuerpo y se aleja girando despacito, la imagen pierde el color y suena el último latido.
// Después, la pantalla de siempre. Estado: g.muerte (no se guarda).
import * as THREE from 'three';
import { BLOCKS, SOLID } from './blocks.js';
import { tintModel } from './models.js';

const DURA = 2.4;
// el HUD se desvanece mientras cae y vuelve con la pantalla de muerte
export function hud(v) { const h = typeof document !== 'undefined' && document.getElementById('hud'); if (h) { h.style.transition = 'opacity .4s'; h.style.opacity = v ? '' : '0'; } }
const clamp = (v) => Math.max(0, Math.min(1, v));

export function empezarMuerte(g, fromX, fromZ, mostrar) {
  const p = g.player, b = p.body.pos, d = p.lookDir();
  const golpe = fromX !== null && fromX !== undefined;
  let cdx = golpe ? b.x - fromX : -d.x, cdz = golpe ? b.z - fromZ : -d.z;
  const l = Math.hypot(cdx, cdz) || 1;
  cdx /= l; cdz /= l;
  // cae hacia donde hay espacio para el cuerpo entero (si no, en un escalón queda metido en el bloque)
  const a0 = Math.atan2(cdx, cdz), w = g.world, y0 = Math.floor(b.y + 0.3);
  for (let i = 0; i < 8 && w; i++) {
    const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 4), dx = Math.sin(a), dz = Math.cos(a);
    if ([0.6, 1.2, 1.8].every((r) => !SOLID[w.getBlock(Math.floor(b.x + dx * r), y0, Math.floor(b.z + dz * r))])) { cdx = dx; cdz = dz; break; }
  }
  g.muerte = { t: 0, cdx, cdz, eye: { x: b.x, y: b.y + 1.62, z: b.z }, mira: { x: b.x + d.x * 5, y: b.y + 1.62 + d.y * 5, z: b.z + d.z * 5 }, mostrar, mostrada: false };
  g.audio.play('latido', { ui: true, vol: 0.8, pitch: 0.8 });
  hud(0); // sin barras ni textos mientras cae
}
// cada cuadro (con el tiempo real): devuelve cuánto se frena el mundo
export function tickMuerte(g, realDt) {
  const M = g.muerte;
  if (!M) return 1;
  M.t += realDt;
  if (!M.latido2 && M.t > 0.9) { M.latido2 = true; g.audio.play('latido', { ui: true, vol: 0.5, pitch: 0.7 }); }
  // el cuerpo sigue el empujón del golpe y cae al suelo (antes quedaba congelado en el aire)
  const b = g.player.body;
  if (g.world && g.world.isLoaded(b.pos.x, b.pos.z)) {
    const f = Math.max(0, 1 - realDt * 4);
    b.vel.x *= f; b.vel.z *= f;
    b.step(g.world, realDt * (M.t < 0.8 ? 0.45 : 1));
  }
  if (!M.mostrada && M.t > DURA) { M.mostrada = true; hud(1); M.mostrar(); }
  return M.t < 0.8 ? 0.3 + M.t * 0.6 : 1;
}
export const muriendo = (g) => !!(g.muerte && !g.muerte.mostrada);
// ¿hasta dónde llega la cámara sin chocar? (fracción del camino del cuerpo a la toma)
function despejado(g, cx, cy, cz, tx, ty, tz) {
  const w = g.world;
  if (!w) return 1;
  const L = Math.hypot(tx - cx, ty - cy, tz - cz) || 1;
  for (let s = Math.min(0.5, 0.7 / L); s <= 1.04; s += 0.04) {
    const x = cx + (tx - cx) * s, y = cy + (ty - cy) * s, z = cz + (tz - cz) * s;
    for (const [ox, oy, oz] of [[0, 0, 0], [0.2, 0, 0], [-0.2, 0, 0], [0, 0.2, 0], [0, -0.2, 0], [0, 0, 0.2], [0, 0, -0.2]]) {
      const B = BLOCKS[w.getBlock(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))];
      if (B && B.solid && B.render !== 'cross' && !B.leafy) return Math.max(0, s - 0.1);
    }
  }
  return 1;
}
const toma = (M, b, e) => {
  // «arriba»: entre árboles o en un hueco, la toma va casi en picada
  const cx = b.x + M.cdx * 0.8, cy = b.y + 0.4, cz = b.z + M.cdz * 0.8, ang = M.ang0 + e * 1.1 * M.giro, r = M.arriba ? 0.5 + e * 0.6 : 1.2 + e * 3, h = M.arriba ? 1.8 + e * 3 : 1.5 + e * 2.2;
  return { cx, cy, cz, tx: cx + Math.sin(ang) * r, ty: cy + h, tz: cz + Math.cos(ang) * r };
};
// la cámara: sale de los ojos y se aleja girando, mirando el cuerpo
export function camaraMuerte(g) {
  const M = g.muerte, cam = g.camera, b = g.player.body.pos;
  // la primera vez escoge el lado más despejado (en un cerro o junto a una pared, la toma de lado choca)
  if (M.giro === undefined) {
    let mejor = -1;
    for (const arriba of [false, true]) for (let i = 0; i < 16; i++) for (const giro of [1, -1]) {
      const a = Math.atan2(M.cdx, M.cdz) + Math.PI / 2 + (i * Math.PI) / 8, T = { ...M, ang0: a, giro, arriba };
      const f = Math.min(...[0.4, 0.7, 1].map((e) => { const q = toma(T, b, e); return despejado(g, q.cx, q.cy, q.cz, q.tx, q.ty, q.tz); }));
      const nota = f - i * 0.004 - (arriba ? 0.3 : 0); // a igual despeje, la de lado
      if (nota > mejor) { mejor = nota; M.ang0 = a; M.giro = giro; M.arriba = arriba; }
    }
    M.frac = 1;
  }
  const k = clamp(M.t / DURA), e = 1 - Math.pow(1 - k, 3), salir = clamp(M.t / 0.9);
  const q = toma(M, b, e);
  // si algo se atraviesa, se acerca rápido; cuando se despeja, vuelve despacio
  const f = despejado(g, q.cx, q.cy, q.cz, q.tx, q.ty, q.tz);
  M.frac = f < M.frac ? f : M.frac + (f - M.frac) * 0.05;
  const fr = Math.max(0.25, M.frac);
  const tx = q.cx + (q.tx - q.cx) * fr, ty = q.cy + (q.ty - q.cy) * fr, tz = q.cz + (q.tz - q.cz) * fr;
  const E = M.eye, m = M.mira, s = salir * salir * (3 - 2 * salir);
  cam.position.set(E.x + (tx - E.x) * s, E.y + (ty - E.y) * s, E.z + (tz - E.z) * s);
  cam.lookAt(new THREE.Vector3(m.x + (q.cx - m.x) * s, m.y + (q.cy - m.y) * s, m.z + (q.cz - m.z) * s));
}
// el filtro: se va el color
export const filtroMuerte = (g) => (g.muerte ? ` grayscale(${Math.min(0.85, g.muerte.t * 0.45).toFixed(2)}) contrast(1.08)` : '');
// la pose del personaje (avatar.js la llama en vez de su animación normal)
export function poseMuerte(A, g, dt) {
  const M = g.muerte, P = A.P, r = A.root, b = g.player.body.pos, t = M.t;
  const k = (v, meta, vel = 10) => v + (meta - v) * Math.min(1, dt * vel);
  const tropieza = clamp(t / 0.3), cae = clamp((t - 0.22) / 0.55), cE = cae * cae, suelo = t > 0.77;
  const rebote = suelo ? Math.sin((t - 0.77) * 16) * 0.12 * Math.exp(-(t - 0.77) * 6) : 0;
  r.rotation.order = 'YXZ';
  r.rotation.y = Math.atan2(-M.cdx, -M.cdz); // de frente a quien le pegó: cae de espaldas
  r.rotation.x = -(Math.PI / 2) * cE + rebote;
  r.rotation.z = 0;
  r.position.set(b.x, b.y + 0.14 * cE, b.z);
  // trastabilla con los brazos arriba; en el suelo, brazos y piernas abiertos y la cabeza de lado
  P.body.rotation.x = k(P.body.rotation.x, suelo ? 0 : -0.3 * tropieza, 12);
  P.body.rotation.z = k(P.body.rotation.z, 0, 8);
  P.armL.rotation.x = k(P.armL.rotation.x, suelo ? -0.3 : -1.5 * tropieza, 10); P.armR.rotation.x = k(P.armR.rotation.x, suelo ? -0.5 : -1.8 * tropieza, 10);
  P.armL.rotation.z = k(P.armL.rotation.z, suelo ? -1.15 : -0.4, 8); P.armR.rotation.z = k(P.armR.rotation.z, suelo ? 1.05 : 0.4, 8);
  P.legL.rotation.x = k(P.legL.rotation.x, suelo ? 0.1 : -0.35 * tropieza, 10); P.legR.rotation.x = k(P.legR.rotation.x, suelo ? -0.15 : 0.2 * tropieza, 10);
  P.legL.rotation.z = k(P.legL.rotation.z, suelo ? 0.22 : 0, 8); P.legR.rotation.z = k(P.legR.rotation.z, suelo ? -0.18 : 0, 8);
  P.head.rotation.x = k(P.head.rotation.x, suelo ? 0 : 0.5 * tropieza, 10);
  P.head.rotation.y = k(P.head.rotation.y || 0, suelo ? 0.7 : 0, 6);
  if (A.heldObj) A.heldObj.visible = !suelo; // al caer se le zafa de la mano
  if (suelo && !M.polvo) { M.polvo = true; g.particles.burst(b.x + M.cdx, b.y + 0.2, b.z + M.cdz, [[0.55, 0.5, 0.42], [0.4, 0.36, 0.3]], 14, 1.6); g.audio.play('dig.cloth', { pos: { x: b.x, y: b.y, z: b.z }, vol: 0.8, pitch: 0.6 }); }
  tintModel(r, Math.max(0.2, g.daylight), 0);
}
