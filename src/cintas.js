// Carrera de cintas (tradición de las fiestas): el arco de cintas se arma con clic derecho donde uno esté (dos postes y
// una viga con cinco cintas de colores colgando, cada una con su argollita). Hay que pasar por debajo A CABALLO, a buena
// velocidad y bien alineado con una cinta para sacarla. Las cintas se mecen con el viento; la que se saca sale volando.
import * as THREE from 'three';
import { BLOCK_BY_KEY as K, AIR } from './blocks.js';

export const ARCO = 488, CINTA = 489;
const COLS = [0xe83a3a, 0xf0c020, 0x2a6ad8, 0x2aa84a, 0xe85ad8];

export function usarArco(g) {
  if (g.dim !== 'tierra') return false;
  const p = g.player.body.pos, w = g.world;
  const yaw = g.player.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  // el arco queda atravesado, 6 bloques enfrente
  const eje = Math.abs(fx) > Math.abs(fz) ? 'z' : 'x';
  const cx = Math.floor(p.x + fx * 6), cz = Math.floor(p.z + fz * 6), y = Math.floor(p.y);
  const pos = (k) => (eje === 'x' ? [cx + k, cz] : [cx, cz + k]);
  for (let k = -3; k <= 3; k++) for (let h = 0; h < 5; h++) { const [x, z] = pos(k); if (w.getBlock(x, y + h, z) !== AIR) { g.ui.toast('Busque un lugar abierto y parejo para el arco de cintas', 1800); return false; } }
  for (const k of [-3, 3]) for (let h = 0; h < 4; h++) { const [x, z] = pos(k); w.setBlock(x, y + h, z, K.planks); }
  for (let k = -3; k <= 3; k++) { const [x, z] = pos(k); w.setBlock(x, y + 4, z, K.planks); }
  if (g.cintas) quitar(g);
  const cintas = [];
  for (let i = 0; i < 5; i++) {
    const off = (i - 2) * 1.05;
    const grp = new THREE.Group();
    const [x, z] = eje === 'x' ? [cx + 0.5 + off, cz + 0.5] : [cx + 0.5, cz + 0.5 + off];
    grp.position.set(x, y + 4, z);
    const cinta = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.02), new THREE.MeshBasicMaterial({ color: COLS[i] }));
    cinta.position.y = -0.65;
    const argolla = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 12), new THREE.MeshBasicMaterial({ color: 0xd8d8d8 }));
    argolla.position.y = -1.4;
    grp.add(cinta, argolla);
    if (eje === 'z') grp.rotation.y = Math.PI / 2;
    g.scene.add(grp);
    cintas.push({ grp, x, z, i, t: Math.random() * 6, caida: null });
  }
  g.cintas = { eje, cx: cx + 0.5, cz: cz + 0.5, y, cintas, lado: null, sacadas: 0 };
  g.ui.toast('🎀 Arco listo: pase por debajo a caballo, alineado con una cinta', 3600);
  g.achieve('arco_cintas', 'Armé el arco de cintas');
  return true;
}

function quitar(g) { for (const c of (g.cintas && g.cintas.cintas) || []) g.scene.remove(c.grp); g.cintas = null; }
export function limpiarCintas(g) { quitar(g); }

export function tickCintas(g, dt) {
  const A = g.cintas;
  if (!A) return;
  const p = g.player.body.pos;
  if (Math.hypot(p.x - A.cx, p.z - A.cz) > 80) { quitar(g); return; }
  // se mecen con el viento; la sacada sale volando y se desvanece
  for (const c of A.cintas) {
    c.t += dt;
    if (c.caida) {
      c.caida.t += dt;
      c.grp.position.x += c.caida.vx * dt; c.grp.position.z += c.caida.vz * dt; c.grp.position.y += (2 - c.caida.t * 6) * dt;
      c.grp.rotation.z += dt * 6; c.grp.scale.setScalar(Math.max(0.01, 1 - c.caida.t));
      if (c.caida.t > 1) { g.scene.remove(c.grp); c.fuera = true; }
      continue;
    }
    c.grp.rotation.x = Math.sin(c.t * 1.8) * 0.12 + (c.empuje || 0);
    c.empuje = (c.empuje || 0) * Math.pow(0.05, dt);
  }
  A.cintas = A.cintas.filter((c) => !c.fuera);
  // ¿cruzó el arco? (de un lado al otro)
  const lat = A.eje === 'x' ? p.x - A.cx : p.z - A.cz;
  const perp = A.eje === 'x' ? p.z - A.cz : p.x - A.cx;
  const lado = Math.sign(perp);
  if (A.lado !== null && lado !== A.lado && Math.abs(lat) < 3 && Math.abs(p.y - A.y) < 2.5) {
    const cab = g.riding && g.riding.type === 'caballo' ? g.riding : null;
    const vel = cab ? Math.hypot(cab.body.vel.x, cab.body.vel.z) : 0;
    let mejor = null, md = Infinity;
    for (const c of A.cintas) { if (c.caida) continue; const off = (c.i - 2) * 1.05; const d = Math.abs(lat - off); if (d < md) { md = d; mejor = c; } }
    if (mejor) {
      if (!cab) g.ui.toast('🐎 ¡Las cintas se sacan a caballo!', 1400);
      else if (vel < 6) { mejor.empuje = 0.5; g.ui.toast('🎀 ¡Muy despacio! Hay que pasar a galope (Ctrl)', 1600); }
      else if (md < 0.42) {
        mejor.caida = { t: 0, vx: (A.eje === 'x' ? 0 : lado) * 3, vz: (A.eje === 'x' ? lado : 0) * 3 };
        A.sacadas++;
        g.giveItem(CINTA, 1);
        g.audio.play('aplausos', { ui: true, vol: 0.45 });
        g.particles.burst(mejor.grp.position.x, A.y + 3, mejor.grp.position.z, [[1, 0.85, 0.2], [1, 1, 1]], 20, 3);
        g.ui.toast(`🎀 ¡SACÓ LA CINTA! (${A.sacadas} de 5)`, 1800);
        g.achieve('cinta', 'Saqué una cinta');
        if (A.sacadas >= 5) { g.achieve('cintas5', 'Mano firme en las cintas'); g.giveItem(360, 15); g.ui.toast('🏆 ¡Sacó las cinco cintas! El pueblo le regala 15 colones', 3200); }
      } else { mejor.empuje = 0.7; g.ui.toast(md < 0.8 ? '🎀 ¡Uyyy, casi! La rozó' : '🎀 Pasó lejos de las cintas', 1400); }
    }
  }
  A.lado = lado;
}
