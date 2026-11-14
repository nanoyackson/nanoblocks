// El buhonero: cada 4 días, de mañana, Don Carlos llega a la casa con su carreta. Compra la cosecha ahí mismo y
// vende cosas difíciles de hallar, así la finca da plata sin tener que bajar al pueblo. La tienda vive en SHOPS.buhonero (pueblo.js).
import * as THREE from 'three';
import { SOLID } from './blocks.js';

const ANCHO = 9, FONDO = 7, CADA = 4;
const mb = (c) => new THREE.MeshBasicMaterial({ color: c });
const caja = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(x, y, z); return m; };
function carretilla(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.add(caja(1.3, 0.1, 0.9, 0x8a6438, 0, 0.55, 0), caja(1.3, 0.3, 0.06, 0x7a5630, 0, 0.72, 0.42), caja(1.3, 0.3, 0.06, 0x7a5630, 0, 0.72, -0.42), caja(0.06, 0.3, 0.9, 0x7a5630, -0.62, 0.72, 0));
  for (const s of [-1, 1]) g.add(caja(0.56, 0.56, 0.08, 0x4a3420, 0.1, 0.28, s * 0.5));
  g.add(caja(1.1, 0.06, 0.06, 0x7a5630, 1.1, 0.6, 0.3), caja(1.1, 0.06, 0.06, 0x7a5630, 1.1, 0.6, -0.3));
  // la carga: bananos, sacos y una lata
  g.add(caja(0.4, 0.26, 0.3, 0xe0c840, -0.28, 0.8, 0.14), caja(0.34, 0.3, 0.34, 0xb8a070, 0.2, 0.82, -0.12), caja(0.16, 0.26, 0.16, 0x70747a, 0.34, 0.82, 0.22));
  return g;
}
function llegar(g, H) {
  const w = g.world, x = H.casa.x - 3, z = H.casa.z + FONDO + 1;
  let y = H.casa.y + 8;
  while (y > H.casa.y - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: 'Don Carlos (buhonero)', role: 'buhonero', vid: 'hist:buhonero', seed: 19332, buhonero: true });
  if (m.kind.dress) m.kind.dress(m);
  const c = carretilla(x + 2, y, z); g.scene.add(c);
  return { m, c };
}
function irse(g, B) {
  g.scene.remove(B.c);
  if (B.m && !B.m.dead) B.m.data.irse = 3;
  g.buhonero = null;
}
// cada segundo
export function tickBuhonero(g) {
  if (g.mode !== 'survival' || !g.meta) return;
  const B = g.buhonero, t = g.time || 0, dia = g.day || 1;
  const H = g.meta.hist;
  const toca = dia >= 4 && dia % CADA === 0 && t > 0.04 && t < 0.34 && g.dim === 'tierra';
  if (B) { if (!toca || !H || !H.casa || !B.m || B.m.dead) irse(g, B); return; }
  if (!toca || !H || !H.hogar || !H.casa || g.asedio) return;
  const p = g.player.body.pos;
  if (Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 50 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  const n = llegar(g, H);
  if (!n) return;
  g.buhonero = n;
  if (g.meta.buhoneroDia !== dia) {
    g.meta.buhoneroDia = dia;
    g.ui.toast('🛒 Llegó Don Carlos con la carretilla: compra cosecha y vende lo difícil', 4200);
    g.achieve('buhonero', 'Llegó el buhonero');
  }
}
export function limpiarBuhonero(g) { if (g.buhonero) { g.scene.remove(g.buhonero.c); if (g.buhonero.m) g.buhonero.m.dead = true; g.buhonero = null; } }
