// v13.4.2 (generador 29, B3): el lugar típico de cada bioma con identidad que aún no tenía uno. Todo original y tico, todo con cofre y placa; solo hash y el azar de la
// construcción (`c.rnd`), nunca Math.random. Se registran en `TYPES` de estructuras.js con `minV: 29`.
import { BLOCK_BY_KEY as K } from './blocks.js';

const SEA = 62;
const LOOT_NUBOSO = [[360, 6, 16], [299, 1, 3], [1196, 1, 3], [327, 2, 6], [263, 1, 4], [K.torch, 4, 10]]; // colones, agua dulce, orquídea, comida, carbón, antorchas
const LOOT_MANGLAR = [[360, 8, 20], [327, 3, 8], [258, 1, 3], [K.torch, 4, 10], [299, 1, 2]];
const LOOT_PARAMO = [[360, 6, 14], [1192, 1, 3], [258, 1, 3], [259, 1, 2], [K.torch, 4, 12]]; // la esquirla de altura
const LOOT_SELVA = [[360, 6, 16], [1196, 1, 3], [327, 3, 8], [299, 1, 3], [258, 1, 3]];
const LOOT_HACIENDA = [[360, 10, 24], [327, 4, 10], [258, 1, 4], [259, 1, 3], [299, 1, 3], [K.torch, 4, 10]];

// v13.5.1 (generador 31): flora propia de cada lugar, sembrada sobre el terreno natural dentro del radio de la obra (solo donde hay suelo firme y aire encima)
function flora(c, R, n, plantas) {
  if (c.gen.version < 31) return;
  for (let k = 0; k < n; k++) {
    const dx = Math.floor(c.rnd() * (2 * R + 1)) - R, dz = Math.floor(c.rnd() * (2 * R + 1)) - R, p = plantas[Math.floor(c.rnd() * plantas.length)];
    if (Math.hypot(dx, dz) > R) continue;
    const g = c.ground(dx, dz);
    if (g + c.oy <= SEA || c.getMaybe(dx, g, dz) || !c.getMaybe(dx, g + 1, dz)) continue;
    c.set(dx, g + 1, dz, p);
  }
}

// Mirador de la Neblina: una plataforma de tablas entre las copas, sobre cuatro troncos, con escalera de caracol, baranda, farol y un cofre
export function buildMirador(c) {
  c.foundation(-3, -3, 3, 3, K.dirt, K.grass, 18);
  c.clearTrees(5);
  const A = 9;
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) for (let y = 1; y < A; y++) c.set(x, y, z, K.jungle_log);
  c.fill(-3, A, -3, 3, A, 3, K.planks);
  for (let i = -3; i <= 3; i++) for (const [x, z] of [[i, -3], [i, 3], [-3, i], [3, i]]) c.set(x, A + 1, z, K.cerca);
  c.spiral(K.escalera_tablas, 1, A);
  c.set(0, A + 1, 0, K.cerca); c.set(0, A + 2, 0, K.cerca); c.set(0, A + 3, 0, K.farol);
  c.chest(2, A + 1, -2, 3, c.loot(LOOT_NUBOSO, 4));
  flora(c, 9, 45, [K.orquidea, K.bromelia, K.helecho]);
  c.placa(-2, A + 1, 2, 2, 'Mirador de la Neblina', 'Subió por la escalera y la nube quedó abajo. Mire despacio: por aquí pasan los quetzales.');
}

// Muelle del Piangüero: un muelle de tablas sobre el agua del manglar que termina en un palafito de tablas con techo de zinc; red, barriles y cofre
export function buildMuelle(c) {
  const D = SEA + 1 - c.oy; // la cubierta queda a un bloque sobre el mar
  const L = 9;
  c.clearTrees(8);
  for (let z = 0; z <= L; z++) {
    for (const x of [-1, 0, 1]) c.set(x, D, z, K.planks);
    if (z % 3 === 0) for (const x of [-1, 1]) for (let y = D - 4; y < D; y++) c.set(x, y, z, K.log);
    if (z % 2 === 0) for (const x of [-2, 2]) c.set(x, D + 1, z, K.cerca);
  }
  // el palafito al final: 5 x 5 sobre pilotes, paredes de tablas, puerta al muelle y techo de zinc
  const Z0 = L + 1, Z1 = L + 5;
  for (const [x, z] of [[-2, Z0], [2, Z0], [-2, Z1], [2, Z1]]) for (let y = D - 4; y < D; y++) c.set(x, y, z, K.log);
  for (let z = Z0; z <= Z1; z++) for (let x = -2; x <= 2; x++) {
    c.set(x, D, z, K.planks);
    const borde = x === -2 || x === 2 || z === Z0 || z === Z1;
    for (let y = 1; y <= 3; y++) c.set(x, D + y, z, borde ? (y === 2 && (x === 0 || z === (Z0 + Z1) / 2) ? K.glass : K.planks) : 0);
    c.set(x, D + 4, z, K.zinc);
  }
  c.set(0, D + 1, Z0, 0); c.set(0, D + 2, Z0, 0);
  c.chest(1, D + 1, Z1 - 1, 2, c.loot(LOOT_MANGLAR, 4));
  c.set(-1, D + 1, Z1 - 1, K.barril); c.set(1, D + 1, Z0 + 1, K.barril); c.set(-1, D + 1, Z0 + 1, K.net);
  c.set(0, D + 3, Z0 + 2, K.lamp);
  c.placa(2, D + 1, 3, 1, 'Muelle del Piangüero', 'Aquí se cambian piangüas por colones. Pregunte por el encargo de pesca al que esté remendando la red.');
  c.zone(0, D + 1, Z0 + 2, 'muelle', 10);
  if (c.gen.version >= 31) for (let z = 1; z <= L; z += 2) for (const x of [-2, 2]) if (c.getMaybe(x, D + 2, z)) c.set(x, D + 2, z, z % 4 === 1 ? K.bromelia : K.helecho); // flora propia: matas sobre la baranda del muelle
}

// Cairn de los Antiguos: una pirámide de piedra apilada a mano en lo alto, con un círculo de piedras, un banco y un cofre al pie
export function buildCairn(c) {
  c.foundation(-5, -5, 5, 5, K.cobble, K.gravel, 12);
  c.clearTrees(6);
  c.circle(4.6, (x, z, d) => { if (d > 3.6) c.set(x, 1, z, (x + z) % 2 ? K.mossy : K.cobble); });
  const H = 7;
  for (let y = 1; y <= H; y++) {
    const r = Math.max(0, 2.8 - y * 0.38);
    c.circle(r, (x, z, d) => { if (d <= r) c.set(x, y, z, (x * 3 + z * 5 + y) % 4 === 0 ? K.mossy : K.cobble); });
  }
  c.set(0, H + 1, 0, K.cobble); c.set(0, H + 2, 0, K.farol);
  c.fill(-4, 1, 3, -2, 1, 3, K.planks);
  c.chest(3, 1, -3, 3, c.loot(LOOT_PARAMO, 4));
  flora(c, 8, 110, [K.musgo, K.flower_yellow, K.pajon]);
  c.placa(0, 1, -4, 0, 'Cairn de los Antiguos', 'Cada piedra la dejó alguien que subió hasta aquí. Deje la suya y mire el valle.');
}

// Campamento del botánico: una carpa de lona, una mesa con sus notas, una fogata y un cofre con muestras; el botánico se fue y dejó todo
export function buildBotanico(c) {
  c.foundation(-5, -5, 5, 5, K.dirt, K.grass, 10);
  c.clearTrees(7);
  // carpa en dos aguas: cuatro filas de lona
  for (let z = -3; z <= 1; z++) { for (let k = 0; k <= 2; k++) { c.set(-2 + k, 1 + k, z, K.wool); c.set(2 - k, 1 + k, z, K.wool); } c.set(0, 3, z, K.wool); }
  for (let y = 1; y <= 2; y++) for (const x of [-2, 2]) for (const z of [-3, 1]) c.set(x, y, z, K.log);
  c.set(0, 1, -1, K.bed); c.set(-1, 1, 0, K.barril);
  c.chest(1, 1, -2, 3, c.loot(LOOT_SELVA, 4));
  c.set(-3, 1, 3, K.table); c.set(-2, 1, 3, K.bookshelf);
  c.set(2, 1, 4, K.fogata); c.set(4, 1, 3, K.barril);
  flora(c, 9, 150, [K.orquidea, K.helecho, K.bromelia, K.mata_flor]);
  c.placa(0, 1, 3, 0, 'Campamento del botánico', 'Notas: orquídea de la sombra, flor abierta de noche; cacao silvestre río arriba. No me esperen para cenar.');
}

// Hacienda vieja con trapiche: la casa de adobe caída, el corredor sin techo, un trapiche que aún muele y un cofre bajo los escombros
export function buildHaciendaVieja(c) {
  c.foundation(-9, -7, 9, 8, K.dirt, K.grass, 12);
  c.clearTrees(10);
  // la casa: paredes de adobe medio caídas, 11 x 7
  for (let z = -5; z <= 1; z++) for (let x = -5; x <= 5; x++) {
    const borde = x === -5 || x === 5 || z === -5 || z === 1;
    c.set(x, 0, z, K.losa_adobe);
    if (!borde) continue;
    const alto = 1 + Math.floor(c.rnd() * 3);
    for (let y = 1; y <= alto; y++) if (!(z === 1 && x >= -1 && x <= 1 && y < 3)) c.set(x, y, z, K.adobe);
  }
  // restos de techo de teja sobre una esquina
  for (let x = -5; x <= -2; x++) for (let z = -5; z <= -3; z++) c.set(x, 3, z, K.planks);
  c.chest(4, 1, -4, 3, c.loot(LOOT_HACIENDA, 5));
  c.set(-4, 1, -2, K.barril); c.set(3, 1, 0, K.barril);
  // el corredor con bancas y el trapiche en el patio
  for (let x = -4; x <= 4; x++) c.set(x, 1, 3, x % 2 ? K.cerca : 0);
  c.set(0, 1, 5, K.trapiche);
  c.fill(-3, 1, 6, -2, 2, 6, K.saco_cafe); c.fill(2, 1, 6, 3, 1, 6, K.saco_cafe);
  for (let k = 0; k < 6; k++) { const x = -8 + Math.floor(c.rnd() * 17), z = 2 + Math.floor(c.rnd() * 6); if (c.getMaybe(x, 1, z)) c.set(x, 1, z, K.cane); }
  flora(c, 13, 50, [K.cane, K.flower_yellow, K.flower_red, K.pajon]);
  c.placa(6, 1, 3, 3, 'Hacienda vieja', 'La casa se cayó pero el trapiche sigue sano. Con tres cañas y un balde, guarapo para el camino.');
}
