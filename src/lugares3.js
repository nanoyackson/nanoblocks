// Más lugares (generador v6): Cerro de la Muerte con su soda de carretera y antenas, Playa Conchal de conchitas
// blancas, el Volcán Turrialba echando ceniza y la Isla San Lucas, la vieja cárcel del golfo de Nicoya. Sin gráficos.
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

const SEA = 62;

// ---------- Cerro de la Muerte ----------
export function buildCerroMuerte(c) {
  c.foundation(-14, -12, 14, 12, K.stone, K.grass, 14);
  // soda de carretera de madera con chimenea humeante
  for (let x = -8; x <= 2; x++) for (let z = -8; z <= -1; z++) {
    const edge = x === -8 || x === 2 || z === -8 || z === -1;
    c.set(x, 0, z, K.planks);
    for (let y = 1; y <= 3; y++) c.set(x, y, z, edge ? (y === 2 && x % 2 ? K.glass : K.paint_green) : 0);
    c.set(x, 4, z, K.zinc);
  }
  c.door(-3, 1, -1, 0);
  c.fill(-7, 1, -7, -7, 6, -7, K.bricks);
  c.be(-5, 1, -6, K.stove, { type: 'stove', facing: 0, grid: new Array(9).fill(null) });
  c.fill(-6, 1, -3, -1, 1, -3, K.planks);
  // antenas de radio y televisión, cruz y pajonal
  for (const [x, z, h] of [[8, -6, 18], [11, 4, 14]]) { c.fill(x, 1, z, x, h, z, K.andamio); c.set(x, h + 1, z, K.lamp); }
  c.fill(6, 1, 8, 6, 5, 8, K.plaster); c.fill(5, 4, 8, 7, 4, 8, K.plaster);
  for (let k = 0; k < 30; k++) c.set(Math.floor(c.rnd() * 26) - 13, 1, Math.floor(c.rnd() * 22) - 11, k % 2 ? K.pajon : K.helecho);
  c.placa(0, 1, 1, 0, 'Cerro de la Muerte', 'El punto más alto de la carretera Interamericana, a más de 3400 metros. Hace un frío… y la neblina no deja ver ni la mano. La soda tiene el mejor agua dulce del camino.');
  c.npc(-4, 1, -4, { role: 'sodera', name: 'Doña Lidia (soda del cerro)' });
  c.zone(0, 2, 0, 'fumarola', 6);
}

// ---------- Playa Conchal ----------
export function buildConchal(c) {
  const top = SEA - c.oy;
  // la arena es de conchitas molidas: blanca y con pedacitos de colores
  for (let z = -16; z <= 18; z++) for (let x = -24; x <= 24; x++) {
    const g = c.ground(x, z);
    if (g < top - 3 || g > top + 3) continue;
    const id = (x * 7 + z * 13) % 11 === 0 ? K.calcite : (x + z * 3) % 17 === 0 ? K.coral_orange : K.sand;
    if (g >= top - 1) c.set(x, g, z, id === K.coral_orange ? K.calcite : id === K.sand ? K.calcite : id);
    else c.set(x, g, z, K.calcite);
  }
  for (const [x, z] of [[-20, -12], [-12, -14], [16, -12], [21, -8]]) {
    const g = c.ground(x, z);
    for (let y = g + 1; y <= g + 6; y++) c.set(x, y, z, K.jungle_log);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) c.set(x + dx, g + 7, z + dz, K.jungle_leaves);
  }
  c.placa(0, 1, -14, 0, 'Playa Conchal', 'En Guanacaste: la arena no es arena, son millones de conchitas molidas por el mar. El agua es tan clara que parece una piscina. No se lleve conchas, ¡déjelas para los demás!');
  c.npc(-4, 1, -10, { role: 'turista', name: 'Turista en Conchal' });
  c.npc(4, 1, -8, { role: 'frutero', name: 'Pipero de la playa' });
}

// ---------- Volcán Turrialba ----------
export function buildTurrialba(c) {
  const R = 18;
  c.circle(R + 4, (x, z, d) => {
    const g = c.ground(x, z);
    const coneH = Math.round(14 * Math.max(0, 1 - d / (R + 4)));
    const crater = d < 5 ? Math.round(9 * (1 - d / 5)) : 0;
    const top = Math.max(g, coneH) - crater;
    for (let y = Math.min(g, top) - 1; y <= top; y++) c.set(x, y, z, y === top ? (d < 9 ? K.ceniza : (x + z) % 4 ? K.ceniza : K.basalt) : K.stone);
    for (let y = top + 1; y <= top + 10; y++) c.set(x, y, z, 0);
    if (d < 2.5) c.set(x, top, z, K.azufre_bloque);
  });
  // árboles secos por la ceniza y el mirador de los guardaparques
  for (const [x, z] of [[-14, -8], [12, 10], [-6, 15]]) { const g = Math.max(c.ground(x, z), 0); for (let y = g + 1; y <= g + 5; y++) c.set(x, y, z, K.log); c.set(x + 1, g + 4, z, K.log); }
  c.placa(3, Math.max(c.ground(3, R + 2), 0) + 1, R + 2, 0, 'Volcán Turrialba', 'En Cartago. Despertó en 2010 y desde entonces echa ceniza que a veces llega hasta San José y cierra el aeropuerto. Los guardaparques lo vigilan de cerca.');
  c.zone(0, 8, 0, 'fumarola', 70);
  c.zone(0, 8, 0, 'erupcion', 80);
}

// ---------- Isla San Lucas: islita frente a la costa ----------
export function placeSanLucas(gen, gx, gz) {
  const cell = 2400;
  if (hash3(gen.seed, gx, 9050, gz) > 0.4) return null;
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(gx * cell + 150 + hash3(gen.seed, gx, 9100 + k, gz) * (cell - 300));
    const z = Math.floor(gz * cell + 150 + hash3(gen.seed, gx, 9200 + k, gz) * (cell - 300));
    const c = gen.column(x, z);
    if (c.biome !== 'ocean' || c.h > SEA - 3 || c.h < SEA - 14) continue;
    let ok = true, coast = false;
    for (let a = 0; a < 12 && ok; a++) {
      const cc = gen.column(Math.round(x + Math.cos(a * 0.52) * 26), Math.round(z + Math.sin(a * 0.52) * 26));
      if (cc.h >= SEA) ok = false;
      const far = gen.column(Math.round(x + Math.cos(a * 0.52) * 70), Math.round(z + Math.sin(a * 0.52) * 70));
      if (far.h >= SEA) coast = true;
    }
    if (ok && coast) return { x, z, y: SEA, rot: 0, id: `san_lucas@${x},${z}`, type: 'san_lucas' };
  }
  return null;
}
export function buildSanLucas(c) {
  const R = 18;
  for (let z = -R - 2; z <= R + 2; z++) for (let x = -R - 2; x <= R + 2; x++) {
    const d = Math.hypot(x, z) + hash3(c.ox, x, z, 3) * 2;
    if (d > R) continue;
    const g = c.ground(x, z);
    const h = Math.round(1 + 6 * (1 - d / R));
    for (let y = g; y <= h; y++) c.set(x, y, z, y === h ? (d > R - 3 ? K.sand : K.grass) : K.stone);
  }
  // el penal: muros de piedra, celdas con barrotes y la casa del director
  for (let x = -8; x <= 8; x++) for (let z = -8; z <= 4; z++) {
    const edge = Math.abs(x) === 8 || z === -8 || z === 4;
    const h = 5;
    for (let y = 1; y <= 4; y++) {
      if (y === 1) c.set(x, y + h - 1, z, K.cobble);
      if (edge) c.set(x, y + h, z, (y + x) % 5 === 0 ? K.mossy : K.cobble);
      else c.set(x, y + h, z, 0);
    }
  }
  for (let x = -6; x <= 6; x += 3) { c.fill(x, 6, -7, x, 8, -4, K.cobble); c.set(x + 1, 6, -4, K.verja); c.set(x + 1, 7, -4, K.verja); }
  for (let x = -1; x <= 1; x++) for (let y = 6; y <= 7; y++) c.set(x, y, 4, 0);
  c.fill(-3, 9, -8, 3, 9, 4, 0);
  for (let k = 0; k < 20; k++) c.set(Math.floor(c.rnd() * 14) - 7, 6 + Math.floor(c.rnd() * 3), Math.floor(c.rnd() * 10) - 7, K.vine);
  c.chest(5, 6, -6, 2, c.loot([[360, 8, 20], [368, 1, 2], [369, 1, 2], [374, 1, 3]], 4));
  c.placa(2, 6, 6, 0, 'Isla San Lucas', 'En el golfo de Nicoya: por casi cien años fue una cárcel temida. Los presos escribieron en las paredes de las celdas. Hoy es refugio de vida silvestre y museo. (Easter egg: busque el cofre de un preso)');
  for (let z = R - 3; z <= R + 8; z++) c.set(0, 1, z, K.planks);
  c.npc(0, 6, 6, { role: 'guardaparques', name: 'Guía de la Isla San Lucas' });
}
