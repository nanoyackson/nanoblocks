// v13.6.0: sitios de los salones (lava para el Culebrón, agua honda para la Anguila). Va aparte de salonfauna.js porque las pruebas de Node cargan cuevavida.js y duenos.js, y estos no pueden traer mar.js (que pide texturas de Vite).
import { FLUID, BLOCK_BY_KEY as K } from './blocks.js';

// el agua de ese punto (nadable): FLUID 1
export const agua = (w, x, y, z) => FLUID[w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))] === 1;
const esLava = (w, x, y, z) => FLUID[w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))] === 2 || w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === K.magma;
// ¿hay lava o magma a menos de r (a pasos de 2) de ahí, entre 3 abajo y 1 arriba?
export function lavaCerca(w, x, y, z, r = 6) {
  for (let dx = -r; dx <= r; dx += 2) for (let dz = -r; dz <= r; dz += 2) for (let dy = -3; dy <= 1; dy++) if (esLava(w, x + dx, y + dy, z + dz)) return true;
  return false;
}
// el primer punto con agua (la Laguna Honda es un charco de 1 de hondo que ocupa el centro del salón, no el lugar), entre 3 y rMax del centro dado, para poner a la anguila (o null)
export function aguaDelSalon(w, cx, cy, cz, rMax = 34) {
  for (let r = 3; r <= rMax; r += 3) for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, x = Math.floor(cx + Math.cos(a) * r), z = Math.floor(cz + Math.sin(a) * r);
    for (let y = cy + 3; y >= cy - 8; y--) if (agua(w, x, y, z) && !FLUID[w.getBlock(x, y + 1, z)] && agua(w, x + 1, y, z) && agua(w, x - 1, y, z) && agua(w, x, y, z + 1) && agua(w, x, y, z - 1)) return { x: x + 0.5, y: y + 0.1, z: z + 0.5 };
  }
  return null;
}

// v13.7.1 (La Hondura): ¿en qué cámara honda está ese punto (o null)? Solo con generador >= 32; la cámara es la elipse del piso hasta el techo de la cúpula.
export function hondoAqui(gen, x, y, z) {
  if (!gen || gen.version < 32 || !gen.v2) return null;
  const RC = 192, gx0 = Math.floor(x / RC), gz0 = Math.floor(z / RC);
  for (let gz = gz0 - 1; gz <= gz0 + 1; gz++) for (let gx = gx0 - 1; gx <= gx0 + 1; gx++) {
    const n = gen.v2.hondoNodo(gx, gz);
    if (!n.cam || y < n.piso - 1 || y > n.piso + n.alto) continue;
    const dx = (x - n.x) / n.rx, dz = (z - n.z) / n.rz;
    if (dx * dx + dz * dz < 0.9) return n;
  }
  return null;
}
