// El templo hundido (generador v14): ruinas de piedra musgosa en el fondo del mar poco hondo, con columnas
// quebradas, coral, cristales que alumbran y un santuario con un cofre. De noche, cerca, aparece la Sirena.
import { BLOCK_BY_KEY as K } from './blocks.js';

export function buildTemplo(c) {
  const W = K.water;
  const piedra = () => (c.rnd() < 0.35 ? K.mossy : K.cobble);
  // plataforma
  for (let x = -8; x <= 8; x++) for (let z = -8; z <= 8; z++) {
    c.set(x, 0, z, piedra());
    for (let y = 1; y <= 9; y++) c.set(x, y, z, W);
    // escalones alrededor
    if (Math.max(Math.abs(x), Math.abs(z)) === 8) c.set(x, 1, z, c.rnd() < 0.7 ? piedra() : W);
  }
  // columnas quebradas en las esquinas y a los lados
  for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6], [0, -7], [0, 7], [-7, 0], [7, 0]]) {
    const h = 2 + Math.floor(c.rnd() * 5);
    for (let y = 1; y <= h; y++) c.set(x, y, z, y === h && c.rnd() < 0.5 ? K.mossy : K.smooth_stone || K.cobble);
  }
  // el santuario del centro: paredes con puerta, techo a medio caer
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) for (let y = 1; y <= 4; y++) {
    const borde = Math.abs(x) === 3 || Math.abs(z) === 3;
    const puerta = z === 3 && x === 0 && y <= 2;
    if (borde && !puerta) c.set(x, y, z, c.rnd() < 0.12 ? W : piedra());
  }
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) if (c.rnd() < 0.6) c.set(x, 5, z, piedra());
  // adentro: cristales que alumbran y el cofre
  c.set(-2, 1, -2, K.cristal_bloque || K.glowstone || K.mossy); c.set(2, 1, -2, K.cristal_bloque || K.mossy);
  c.set(-2, 2, -2, K.cristal || W); c.set(2, 2, -2, K.cristal || W);
  c.chest(0, 1, -1, 0, c.loot([[259, 4, 9], [369, 3, 8], [260, 1, 3], [274, 1, 3], [464, 1, 2], [451, 1, 1], [444, 1, 1], [360, 20, 50]], 7));
  // coral alrededor
  const CORAL = [K.coral_red, K.coral_orange, K.coral_yellow, K.coral_purple].filter(Boolean);
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(c.rnd() * 22) - 11, z = Math.floor(c.rnd() * 22) - 11;
    if (Math.max(Math.abs(x), Math.abs(z)) < 9) continue;
    c.set(x, 0, z, piedra());
    if (CORAL.length) c.set(x, 1, z, CORAL[Math.floor(c.rnd() * CORAL.length)]);
  }
  c.zone(0, 1, 0, 'templo_hundido', 24);
}

// cerca del templo, de noche, la Sirena aparece encima del santuario (una vez por noche)
export function tickTemplo(g, zn, d) {
  if (d > zn.r + 10 || g.daylight > 0.3 || g.mode !== 'survival') return;
  const st = (g.temploNoche = g.temploNoche || {});
  if (st[zn.id] === g.day) return;
  if (g.entities.mobs.some((m) => m.type === 'sirena' && !m.dead)) return;
  st[zn.id] = g.day;
  // en la superficie del agua sobre el templo
  const w = g.world;
  let y = zn.y;
  while (y < zn.y + 30 && w.getBlock(Math.floor(zn.x), y + 1, Math.floor(zn.z)) === K.water) y++;
  g.entities.spawnMob('sirena', zn.x + 0.5, y + 0.6, zn.z + 0.5);
}
