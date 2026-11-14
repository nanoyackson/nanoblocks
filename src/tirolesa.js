// Tirolesa (canopy): con una polea en la mano, clic derecho a un cable y uno sale colgando a lo largo de la línea de
// cables (en x o en z; puede bajar o subir de a un bloque). La gravedad acelera en las bajadas y el roce frena en lo
// plano; al final de la línea uno se suelta con el impulso. Espacio frena; Shift se suelta antes.
import { BLOCK_BY_KEY as K } from './blocks.js';

export const POLEA = 415;
const isCable = (id) => id === K.cable || id === K.cable_z;

// la línea de cables desde (x, y, z) hacia un lado (sx, sz)
function follow(w, x, y, z, sx, sz) {
  const pts = [];
  let cx = x, cy = y, cz = z;
  for (let k = 0; k < 400; k++) {
    const nx = cx + sx, nz = cz + sz;
    let ny = null;
    for (const dy of [0, -1, 1]) if (isCable(w.getBlock(nx, cy + dy, nz))) { ny = cy + dy; break; }
    if (ny === null) break;
    cx = nx; cy = ny; cz = nz;
    pts.push({ x: cx + 0.5, y: cy + 0.75, z: cz + 0.5 });
  }
  return pts;
}

export function startZip(g, t) {
  const w = g.world;
  const axis = t.id === K.cable_z ? [0, 1] : [1, 0];
  const a = follow(w, t.x, t.y, t.z, axis[0], axis[1]), b = follow(w, t.x, t.y, t.z, -axis[0], -axis[1]);
  const here = { x: t.x + 0.5, y: t.y + 0.75, z: t.z + 0.5 };
  // se va hacia el lado que baja (o el más largo si los dos son planos)
  const drop = (pts) => (pts.length ? here.y - pts[pts.length - 1].y : -1e9);
  let pts = drop(a) > drop(b) || (drop(a) === drop(b) && a.length >= b.length) ? a : b;
  // si mira claramente hacia un lado, va para ese lado
  const d = g.player.lookDir();
  const along = d.x * axis[0] + d.z * axis[1];
  if (Math.abs(along) > 0.5) pts = along > 0 ? a : b;
  if (pts.length < 3) { g.ui.toast('🪢 La línea de cable es muy cortita para tirarse', 1800); return false; }
  g.zip = { pts: [here, ...pts], s: 0, v: 3, len: pts.length };
  g.player.flying = false;
  g.audio.play('swish', { ui: true, vol: 0.6, pitch: 0.8 });
  g.ui.toast('🪢 ¡Yujuuu! Espacio frena · Shift se suelta', 2200);
  g.achieve('tirolesa', '¡Canopy!');
  return true;
}

export function zipUpdate(g, dt, input) {
  const Z = g.zip, p = g.player, b = p.body;
  const n = Z.pts.length - 1;
  const i = Math.min(n - 1, Math.floor(Z.s)), f = Z.s - i;
  const A = Z.pts[i], B = Z.pts[i + 1];
  // pendiente del tramo: baja = acelera; plano = roce
  const slope = A.y - B.y; // 1 = baja un bloque por bloque
  Z.v += (slope * 9.5 - 0.6) * dt;
  if (input.jump) Z.v -= 9 * dt;
  Z.v = Math.max(1.5, Math.min(17, Z.v));
  Z.s += Z.v * dt;
  const done = Z.s >= n;
  const x = A.x + (B.x - A.x) * f, y = A.y + (B.y - A.y) * f, z = A.z + (B.z - A.z) * f;
  // colgado debajo del cable, con un vaivén al acelerar
  b.pos.x = x; b.pos.z = z; b.pos.y = y - 2.05 + Math.sin(g.clock * 3) * 0.04;
  b.vel.x = b.vel.y = b.vel.z = 0; b.onGround = false; b.fallStart = null;
  // el viento y la polea suenan según la velocidad
  g.audio.setEmitter('zip', 'loop.tirolesa', { x, y, z }, Math.min(0.9, 0.2 + Z.v / 20));
  g.audio.setEmitter('zipviento', 'loop.wind', { x, y, z }, Math.min(0.6, Z.v / 30));
  if (Math.random() < Z.v / 60) g.particles.spawn(x, y + 0.1, z, [1, 0.85, 0.4], (Math.random() - 0.5), 0.4, (Math.random() - 0.5), 0.25, 3, true);
  g.zipDist = (g.zipDist || 0) + Z.v * dt;
  if (Z.v > 15) g.achieve('tirolesa_rapida', 'A toda velocidad por el canopy');
  if (done || input.sneak) {
    const dx = B.x - A.x, dz = B.z - A.z, l = Math.hypot(dx, dz) || 1;
    g.zip = null;
    g.audio.setEmitter('zip', 'loop.tirolesa', null); g.audio.setEmitter('zipviento', 'loop.wind', null);
    b.vel.x = (dx / l) * Math.min(Z.v, 9); b.vel.z = (dz / l) * Math.min(Z.v, 9); b.vel.y = 2;
    g.addEffect('pluma', 3);
    if (done && Z.len >= 25) g.achieve('canopy_largo', 'Una tirolesa larguísima');
  }
}
