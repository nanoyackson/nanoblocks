// El tren fantasma: algunas noches, en las estaciones del tren, se oye un pito que no es de ningún horario y pasa un tren que ya no
// existe: la locomotora negra con su farol verde y tres vagones con ventanas que alumbran verde, con siluetas sentadas adentro. No
// para. Si a uno lo agarra en la vía, le pasa a través: solo frío. Estado: g.trenFantasma (no se guarda), g.trenFantasmaNoche.
import * as THREE from 'three';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { structuresNear } from './estructuras.js';
import { disposeModel } from './models.js';

const VEL = 14, TRAMO = 75;
const mb = (c, o = 0.85) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: o > 0.8, fog: false });
function pieza(g, w, h, d, c, x, y, z, o) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c, o)); m.position.set(x, y, z); g.add(m); return m; }
function tren() {
  const g = new THREE.Group();
  // la locomotora
  pieza(g, 2.2, 0.4, 7, 0x141418, 0, 0.5, 0);
  pieza(g, 1.8, 1.8, 4.2, 0x1e1e24, 0, 1.6, 1.2); // la caldera
  pieza(g, 0.6, 1.2, 0.6, 0x141418, 0, 3, 2.6); // la chimenea
  pieza(g, 2.2, 2.4, 2.2, 0x26262c, 0, 1.9, -2.2); // la cabina
  pieza(g, 0.6, 0.6, 0.1, 0x8affaa, 0, 2.1, 3.36, 1); // el farol verde
  pieza(g, 2, 0.5, 0.6, 0x3a3a40, 0, 0.4, 3.6); // el quitapiedras
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) pieza(g, 0.15, 1, 1, 0x3a1a1a, s * 1.15, 0.5, 2.5 - i * 1.6);
  // los vagones
  for (let v = 1; v <= 3; v++) {
    const z0 = -v * 7.6;
    pieza(g, 2.4, 2.6, 7, 0x3a2418, 0, 1.7, z0);
    pieza(g, 2.6, 0.2, 7.2, 0x1e140c, 0, 3.05, z0);
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
      pieza(g, 0.05, 0.9, 1.1, 0x8affaa, s * 1.22, 2, z0 - 2.6 + k * 1.75, 0.65); // ventanas que alumbran verde
      if ((k + v) % 2) pieza(g, 0.06, 0.6, 0.4, 0x0a140e, s * 1.24, 1.9, z0 - 2.6 + k * 1.75, 0.9); // alguien sentado
    }
    for (const s of [-1, 1]) for (const t of [-1, 1]) pieza(g, 0.15, 0.9, 0.9, 0x1a1a1a, s * 1.2, 0.45, z0 + t * 2.4);
  }
  return g;
}
// la vía de la estación: los rieles que hay cerca
function via(g, s) {
  const w = g.world, xs = [], zs = [];
  let y = null;
  for (let dx = -30; dx <= 30; dx += 2) for (let dz = -30; dz <= 30; dz += 2) {
    const x = Math.floor(s.x + dx), z = Math.floor(s.z + dz);
    if (!w.isLoaded(x, z)) continue;
    for (let yy = 110; yy > 50; yy--) if (w.getBlock(x, yy, z) === K.rieles) { xs.push(x); zs.push(z); y = yy; break; }
  }
  if (xs.length < 6) return null;
  const rx = Math.max(...xs) - Math.min(...xs), rz = Math.max(...zs) - Math.min(...zs), eje = rx >= rz ? 'x' : 'z';
  const prom = (a) => a.reduce((q, v) => q + v, 0) / a.length;
  return { eje, x: prom(xs) + 0.5, z: prom(zs) + 0.5, y };
}
export function limpiarTrenFantasma(g) {
  const T = g.trenFantasma;
  if (!T) return;
  g.scene.remove(T.grupo); disposeModel(T.grupo);
  g.trenFantasma = null;
}
function empezar(g, V) {
  const grupo = tren(); g.scene.add(grupo);
  const sentido = Math.random() < 0.5 ? 1 : -1;
  g.trenFantasma = { grupo, V, s: -TRAMO, sentido, paso: false };
  g.trenFantasmaNoche = g.day || 1;
  g.audio.play('tren', { pos: { x: V.x, y: V.y + 2, z: V.z }, vol: 1, pitch: 0.7 });
  g.ui.toast('🚂 Se oye el pito de un tren… pero a esta hora no pasa ningún tren', 3600);
}
// cada segundo
export function tickTrenFantasma(g) {
  if (g.trenFantasma || g.dim !== 'tierra' || g.daylight > 0.2 || g.trenFantasmaNoche === (g.day || 1) || Math.random() > 1 / 90) return;
  const p = g.player.body.pos, s = structuresNear(g.world.gen, p.x, p.z, 70, new Set(['estacion'])).find((q) => Math.hypot(q.x - p.x, q.z - p.z) < 55);
  if (!s) return;
  const V = via(g, s);
  if (V) empezar(g, V);
}
// cada cuadro
export function cuadroTrenFantasma(g, dt) {
  const T = g.trenFantasma;
  if (!T) return;
  T.s += VEL * dt;
  const V = T.V, ax = V.eje === 'x' ? 1 : 0, az = V.eje === 'z' ? 1 : 0, d = T.s * T.sentido;
  const x = V.x + ax * d, z = V.z + az * d;
  T.grupo.position.set(x, V.y, z);
  T.grupo.rotation.y = Math.atan2(ax * T.sentido, az * T.sentido);
  if (Math.random() < dt * 20) { const cx = x + ax * T.sentido * 2.6, cz = z + az * T.sentido * 2.6; g.particles.spawn(cx, V.y + 3.7, cz, [0.6, 0.9, 0.7], (Math.random() - 0.5) * 0.5, 1.8, (Math.random() - 0.5) * 0.5, 2.5, -0.2, true); }
  // ¿lo agarró en la vía? le pasa a través
  const p = g.player.body.pos, u = (p.x - V.x) * ax + (p.z - V.z) * az, lat = Math.abs((p.x - V.x) * az + (p.z - V.z) * ax);
  if (!T.paso && lat < 1.6 && Math.abs(p.y - V.y) < 2.5 && Math.abs(u - d) < 1.5) {
    T.paso = true;
    g.addEffect('escalofrio', 20); g.addEffect('miedo', 4); g.shake = Math.max(g.shake || 0, 0.6);
    g.ui.toast('🚂 ¡El tren le pasó por encima… y a través! No sintió nada más que un frío de muerte', 4200);
    g.achieve('tren_fantasma_encima', 'Me atravesó el tren fantasma');
  }
  if (T.s > TRAMO + 30) {
    if (Math.hypot(p.x - V.x, p.z - V.z) < 60) g.achieve('tren_fantasma', 'Vi pasar el tren fantasma');
    limpiarTrenFantasma(g);
  }
}
export function pruebaTrenFantasma(g) {
  limpiarTrenFantasma(g);
  const p = g.player.body.pos, s = structuresNear(g.world.gen, p.x, p.z, 1500, new Set(['estacion'])).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
  if (!s) return 'No hay estación del tren cerca';
  if (Math.hypot(s.x - p.x, s.z - p.z) > 55) return `La estación más cercana está en ${Math.round(s.x)}, ${Math.round(s.z)}: vaya allá (de noche) y repita`;
  const V = via(g, s);
  if (!V) return 'No encontré los rieles: acérquese más a la estación';
  empezar(g, V);
  return 'El tren fantasma viene por la vía';
}
