// Portones y cortinas que se abren de verdad (v11): el bloque cambia de una vez, pero mientras tanto se esconde en el chunk
// y una pieza suelta hace el recorrido. Las puertas ya se animan aparte en stations.js.
import * as THREE from 'three';
import { atlasTexture, tileUV } from './textures.js';
import { calmaActiva } from './calma.js';

function caja(tile) {
  const g = new THREE.BoxGeometry(1, 1, 1), t = tileUV(tile), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, t.u0 + (t.u1 - t.u0) * uv.getX(i), t.v0 + (t.v1 - t.v0) * (1 - uv.getY(i)));
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: atlasTexture, alphaTest: 0.4 }));
}
// una cortina cerrada es un paño: se parte en dos para que cada mitad corra a su lado
function mitades(boxes) {
  if (boxes.length > 1) return boxes;
  const [x0, y0, z0, x1, y1, z1] = boxes[0];
  if (x1 - x0 >= z1 - z0) { const m = (x0 + x1) / 2; return [[x0, y0, z0, m, y1, z1], [m, y0, z0, x1, y1, z1]]; }
  const m = (z0 + z1) / 2;
  return [[x0, y0, z0, x1, y1, m], [x0, y0, m, x1, y1, z1]];
}
const centro = (q) => [(q[0] + q[3]) / 32, (q[1] + q[4]) / 32, (q[2] + q[5]) / 32];

export function animarAbrir(g, x, y, z, b, destino) {
  const porton = b.key.startsWith('porton'), cortina = b.key.startsWith('cortina');
  if ((!porton && !cortina) || !b.boxes || !destino.boxes || calmaActiva(g)) return;
  const p = g.player.body.pos;
  if (Math.hypot(p.x - x, p.z - z) > 40) return;
  const tile = b.tex.side, piezas = [];
  if (porton) {
    const A = b.boxes[0], B = destino.boxes[0], largoX = (q) => q[3] - q[0] >= q[5] - q[2];
    const m = caja(tile), largo = Math.max(A[3] - A[0], A[5] - A[2]) / 16, grueso = Math.min(A[3] - A[0], A[5] - A[2]) / 16;
    m.scale.set(largo, (A[4] - A[1]) / 16, grueso);
    const a0 = largoX(A) ? 0 : Math.PI / 2, a1 = largoX(B) ? 0 : Math.PI / 2, cA = centro(A), cB = centro(B);
    piezas.push({ m, pintar: (e) => { m.position.set(x + cA[0] + (cB[0] - cA[0]) * e, y + cA[1], z + cA[2] + (cB[2] - cA[2]) * e); m.rotation.y = a0 + (a1 - a0) * e; } });
  } else {
    const A = mitades(b.boxes), B = mitades(destino.boxes);
    A.forEach((qa, i) => {
      const qb = B[i], m = caja(tile);
      piezas.push({ m, pintar: (e) => {
        const q = qa.map((v, k) => v + (qb[k] - v) * e);
        m.scale.set((q[3] - q[0]) / 16, (q[4] - q[1]) / 16, (q[5] - q[2]) / 16);
        m.position.set(x + (q[0] + q[3]) / 32, y + (q[1] + q[4]) / 32, z + (q[2] + q[5]) / 32);
      } });
    });
  }
  // si ese mismo portón ya venía animándose (abrir y cerrar rápido), la animación vieja se corta aquí: si no, al terminar
  // destapaba el bloque mientras la nueva seguía en curso y parpadeaba
  g.portones = (g.portones || []).filter((a) => {
    if (a.x !== x || a.y !== y || a.z !== z) return true;
    for (const q of a.piezas) { g.scene.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); }
    return false;
  });
  const luz = g.entities.lightAt(x + 0.5, y + 0.5, z + 0.5);
  for (const q of piezas) { q.m.material.color.setScalar(luz); q.pintar(0); g.scene.add(q.m); }
  g.world.ocultarBloque(x, y, z, true, false); // sin remallar: el setBlock que viene en el mismo cuadro ya lo hace
  g.portones.push({ x, y, z, piezas, t: 0, dur: porton ? 0.26 : 0.3, listo: false });
}
export function tickPortones(g, dt) {
  if (!g.portones || !g.portones.length) return;
  g.portones = g.portones.filter((a) => {
    a.t += dt;
    const k = Math.min(1, a.t / a.dur), e = k * k * (3 - 2 * k);
    for (const q of a.piezas) q.pintar(e);
    if (k >= 1 && !a.listo) { a.listo = true; g.world.ocultarBloque(a.x, a.y, a.z, false); }
    // queda un momentito más quieta, mientras el chunk vuelve a dibujar el bloque, para que no parpadee
    if (a.t < a.dur + 0.12) return true;
    for (const q of a.piezas) { g.scene.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); }
    return false;
  });
}
