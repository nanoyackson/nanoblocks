// La marabunta: las hormigas guerreras salen de día en la selva y el bosque y cruzan el monte como una alfombra que avanza.
// Se oye el crujido de las hojas y se ven los pajaritos que las siguen comiéndose lo que espantan. Quien se queda encima, lo
// pican; los animales salen corriendo. El fuego (una antorcha o una fogata) las hace cambiar de rumbo.
// Estado: g.marabunta (no se guarda); meta.marabuntaCd.
import * as THREE from 'three';
import { BLOCK_BY_KEY as K, SOLID, BLOCKS } from './blocks.js';

const N = 760, LARGO = 7, ANCHO = 3.2, VEL = 1.1, DURA = 110, CADA = 900;
const FUEGO = new Set(['fogata', 'torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'farol', 'lava'].map((k) => K[k]).filter(Boolean));
let malla = null;
const alturas = new Map();
function piso(g, x, z) {
  const k = x + ',' + z, c = alturas.get(k);
  if (c && c.t > (g.clock || 0)) return c.y;
  const w = g.world;
  let y = g.world.gen.column(x, z).h + 4;
  for (let n = 0; n < 12; n++, y--) { const id = w.getBlock(x, y, z), b = BLOCKS[id]; if (SOLID[id] && !(b && b.leafy)) break; }
  alturas.set(k, { y: y + 1, t: (g.clock || 0) + 8 });
  if (alturas.size > 4000) alturas.clear();
  return y + 1;
}
// ¿está (x,z) dentro de la alfombra? (una elipse alargada en el sentido en que avanza)
function dentro(M, x, z) {
  const dx = x - M.x, dz = z - M.z, a = dx * M.dx + dz * M.dz, b = -dx * M.dz + dz * M.dx;
  return (a * a) / (LARGO * LARGO) + (b * b) / (ANCHO * ANCHO) <= 1;
}
// cada segundo
export function tickMarabunta(g) {
  if (g.dim !== 'tierra' || !g.meta) return;
  const P = g.player, p = P.body.pos, M = g.marabunta;
  if (!M) {
    const bio = g.env && g.env.biome;
    if (g.mode !== 'survival' || g.daylight < 0.55 || !['jungle', 'forest'].includes(bio) || (g.clock || 0) < (g.meta.marabuntaCd || 0) || (g.day || 1) < 2 || Math.random() > 1 / 240) return;
    // sale a 22–30 bloques y viene más o menos hacia uno, pero no derecho
    const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 8;
    const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    const ang = Math.atan2(p.z - z, p.x - x) + (Math.random() - 0.5) * 1.2;
    g.marabunta = { x, z, dx: Math.cos(ang), dz: Math.sin(ang), t: DURA, pico: 0, avisado: false, picado: false };
    g.meta.marabuntaCd = (g.clock || 0) + CADA;
    return;
  }
  M.t--;
  const d = Math.hypot(p.x - M.x, p.z - M.z);
  if (!M.avisado && d < 32) { M.avisado = true; g.ui.toast('🐜 Crujen las hojas: viene una marabunta (🐜 en la brújula). Apártese', 3600); }
  // el fuego las desvía
  const w = g.world, fx = Math.floor(M.x + M.dx * (LARGO + 1)), fz = Math.floor(M.z + M.dz * (LARGO + 1)), fy = piso(g, fx, fz);
  let fuego = false;
  for (let ox = -2; ox <= 2 && !fuego; ox++) for (let oz = -2; oz <= 2 && !fuego; oz++) for (let oy = -1; oy <= 2; oy++) if (FUEGO.has(w.getBlock(fx + ox, fy + oy, fz + oz))) { fuego = true; break; }
  const h = g.inventory.held;
  if (!fuego && h && (h.id === K.torch || h.id === K.lamp) && Math.hypot(p.x - (M.x + M.dx * LARGO), p.z - (M.z + M.dz * LARGO)) < 3) fuego = true;
  if (fuego) {
    const giro = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1), c = Math.cos(giro), s = Math.sin(giro);
    [M.dx, M.dz] = [M.dx * c - M.dz * s, M.dx * s + M.dz * c];
    if (!M.desvio) { M.desvio = true; g.ui.toast('🔥 Las hormigas le sacaron el cuerpo al fuego', 2200); g.achieve('marabunta_fuego', 'Con fuego se desvían'); }
  }
  // los animales salen corriendo
  for (const m of g.entities.mobs) if (!m.dead && !m.kind.hostile && !m.tamed && !m.kind.ghostly && dentro(M, m.body.pos.x, m.body.pos.z) && Math.abs(m.body.pos.y - piso(g, Math.floor(m.body.pos.x), Math.floor(m.body.pos.z))) < 1.5) { m.panic = 3; if (m.health <= 4) m.hurt(1, M.x, M.z); }
  // y a quien se queda encima lo pican
  if (g.mode === 'survival' && P.alive && dentro(M, p.x, p.z) && Math.abs(p.y - piso(g, Math.floor(p.x), Math.floor(p.z))) < 1.5) {
    M.pico++; M.picado = true;
    g.damagePlayer(1, null, null, 'Picaduras de la marabunta', true, false);
    if (M.pico === 1) g.ui.toast('🐜 ¡Está encima de la marabunta! Salga de lado, rápido', 2400);
  }
  if (M.t <= 0) {
    g.marabunta = null;
    if (malla) malla.count = 0;
    if (M.avisado && !M.picado && P.alive) { g.ui.toast('🐜 La marabunta pasó y siguió su camino', 2400); g.achieve('marabunta', 'Vi pasar la marabunta'); }
  }
}
// cada cuadro: avanza y se dibuja
export function dibujarMarabunta(g, dt) {
  const M = g.marabunta;
  if (!M || g.dim !== 'tierra') { if (malla) malla.count = 0; return; }
  M.x += M.dx * VEL * dt; M.z += M.dz * VEL * dt;
  if (!malla || malla.parent !== g.scene) {
    malla = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.07, 0.22), new THREE.MeshBasicMaterial({ color: 0x4a140c }), N);
    malla.frustumCulled = false; malla.count = 0; g.scene.add(malla);
    M.semillas = null;
  }
  if (!M.semillas) M.semillas = Array.from({ length: N }, () => ({ a: Math.random() * 2 - 1, b: Math.random() * 2 - 1, f: Math.random() * 10 }));
  const p = g.player.body.pos;
  if (Math.hypot(p.x - M.x, p.z - M.z) > 60) { malla.count = 0; return; }
  const t = (g.clock || 0), m4 = dibujarMarabunta.m4 || (dibujarMarabunta.m4 = new THREE.Matrix4()), q = dibujarMarabunta.q || (dibujarMarabunta.q = new THREE.Quaternion()), e = dibujarMarabunta.e || (dibujarMarabunta.e = new THREE.Euler()), v = dibujarMarabunta.v || (dibujarMarabunta.v = new THREE.Vector3()), s = dibujarMarabunta.s || (dibujarMarabunta.s = new THREE.Vector3(1, 1, 1));
  let n = 0;
  const ang = Math.atan2(M.dx, M.dz);
  for (const S of M.semillas) {
    // cada hormiga va y viene dentro de la elipse, más tupida en el centro
    if (S.a * S.a + S.b * S.b > 1) continue;
    const ia = S.a * LARGO + Math.sin(t * 3 + S.f) * 0.4, ib = S.b * ANCHO + Math.cos(t * 2.3 + S.f) * 0.3;
    const x = M.x + M.dx * ia - M.dz * ib, z = M.z + M.dz * ia + M.dx * ib;
    const y = piso(g, Math.floor(x), Math.floor(z));
    e.set(0, ang + Math.sin(t * 7 + S.f) * 0.6, 0); q.setFromEuler(e);
    v.set(x, y + 0.03, z); m4.compose(v, q, s);
    malla.setMatrixAt(n++, m4);
  }
  malla.count = n;
  malla.instanceMatrix.needsUpdate = true;
  // los pajaritos hormigueros, adelante, brincando
  if (Math.random() < dt * 6) { const k = LARGO + 1 + Math.random() * 2, l = (Math.random() - 0.5) * 4, x = M.x + M.dx * k - M.dz * l, z = M.z + M.dz * k + M.dx * l; g.particles.spawn(x, piso(g, Math.floor(x), Math.floor(z)) + 0.3, z, Math.random() < 0.5 ? [0.1, 0.1, 0.1] : [0.6, 0.3, 0.15], 0, 2.5, 0, 0.5, 12); }
}
export function marcaMarabunta(g) { return g.marabunta && g.dim === 'tierra' ? { x: g.marabunta.x, z: g.marabunta.z } : null; }
export function limpiarMarabunta(g) { g.marabunta = null; if (malla) malla.count = 0; alturas.clear(); }
export function pruebaMarabunta(g) {
  const p = g.player.body.pos, l = g.player.lookDir(), n = Math.hypot(l.x, l.z) || 1, d = { x: l.x / n, z: l.z / n };
  g.marabunta = { x: p.x + d.x * 16, z: p.z + d.z * 16, dx: -d.x, dz: -d.z, t: 60, pico: 0, avisado: false, picado: false };
  g.time = 0.15;
  return 'Una marabunta a 16 bloques, viniendo hacia usted. Hágase a un lado, o póngale una antorcha adelante';
}
