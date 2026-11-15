// v13.1.1 (C3 de cuevas, generador 22): tres sitios kársticos con nombre tico, escondidos bajo tierra. Cada uno tiene una boca de piedra en la
// superficie (con su placa y dos antorchas), un pozo con escalera de caracol y una sala propia con un cofre de botín. Se construyen con la misma
// herramienta que la Caverna del Rey (estructuras.js: Ctx), así que son deterministas por semilla: todo azar sale de c.rnd (semilla + posición)
// y de hash3, nunca de Math.random. El botín de los cofres sale de c.loot, igual en todas las máquinas (los cofres compartidos son del anfitrión).
import { BLOCK_BY_KEY as K } from './blocks.js';
import { hash3 } from './noise.js';

// la boca: anillo de piedra musgosa, dos antorchas y la placa
function boca(c, titulo, texto) {
  c.circle(4.5, (x, z, d) => { if (d > 3.2) { c.set(x, 0, z, K.mossy); c.set(x, 1, z, d > 3.8 && (x + z) % 3 === 0 ? K.mossy : 0); } });
  c.placa(3, 1, 4, 2, titulo, texto);
  c.set(-4, 1, 0, K.torch); c.set(4, 1, 0, K.torch);
}
// el pozo de entrada con la escalera de caracol, hasta el piso D bajo la superficie
function pozo(c, D) {
  c.fill(-2, -D, -2, 2, 0, 2, 0);
  c.spiral(K.escalera_piedra, -D, -1, K.cobble);
  for (let y = -D; y <= -1; y += 5) c.set(2, y + 2, 2, K.torch);
}
// un hueco con agua al fondo, forrado de piedra para que el agua no se escape a una cueva vecina
function poza(c, x, z, r, y0, hondo) {
  c.fill(x - r - 1, y0 - hondo - 1, z - r - 1, x + r + 1, y0 - 1, z + r + 1, K.stone);
  c.fill(x - r, y0 - hondo, z - r, x + r, y0, z + r, 0);
  c.fill(x - r, y0 - hondo, z - r, x + r, y0 - hondo + 1, z + r, K.water);
}
const h3 = (c, x, y, z, s = 0) => hash3(c.gen.seed + s, c.ox + x, y, c.oz + z);

// ---------- Cueva de Barra Honda: galería caliza con estalactitas gigantes y pozos ----------
export function buildCuevaBarraHonda(c) {
  const D = 20, S0 = -D - 1, ALTO = 9;
  boca(c, 'Cueva de Barra Honda', 'En la península de Nicoya, bajo el cerro de Barra Honda, la roca caliza guarda galerías con columnas de piedra que gotean desde hace miles de años. Baje despacio: hay pozos, y no todos tienen fondo a la vista.');
  // la roca de alrededor (para que la sala no quede abierta a otras cuevas) y la galería oval
  c.fill(-11, S0 - 1, -24, 11, S0 + ALTO + 2, -1, K.stone);
  pozo(c, D);
  for (let z = -3; z >= -22; z--) for (let x = -10; x <= 10; x++) {
    const e = (x / 9.5) ** 2 + ((z + 12.5) / 10) ** 2;
    if (e > 1) continue;
    const techo = S0 + ALTO - Math.floor(e * 2.5);
    c.set(x, S0, z, h3(c, x, S0, z) < 0.35 ? K.calcite : K.stone);
    for (let y = S0 + 1; y <= techo; y++) c.set(x, y, z, 0);
    if (e > 0.82) for (let y = S0 + 1; y <= techo; y++) if (h3(c, x, y, z, 1) < 0.45) c.set(x, y, z, K.calcite);
  }
  // estalactitas gigantes colgando del techo (con su estalagmita debajo) y columnas que ya se unieron
  const cols = [[-6, -8], [-3, -17], [2, -6], [5, -13], [7, -19], [-7, -15], [0, -20], [4, -9]];
  cols.forEach(([x, z], i) => {
    const e = (x / 9.5) ** 2 + ((z + 12.5) / 10) ** 2, techo = S0 + ALTO - Math.floor(e * 2.5);
    const L = 3 + Math.floor(h3(c, x, 5, z) * 4);
    if (i % 3 === 0) { for (let y = S0 + 1; y <= techo; y++) c.set(x, y, z, K.calcite); return; } // columna entera
    for (let y = techo; y > techo - L; y--) c.set(x, y, z, K.calcite);
    c.set(x, techo - L, z, K.stalactite);
    const A = 2 + Math.floor(h3(c, x, 6, z) * 3);
    for (let y = S0 + 1; y < S0 + A; y++) c.set(x, y, z, K.calcite);
    c.set(x, S0 + A, z, K.stalagmite);
  });
  // tres pozos con agua al fondo, uno cerca de la entrada y dos más adentro
  for (const [x, z] of [[-4, -6], [5, -15], [-5, -19]]) poza(c, x, z, 1, S0, 4);

  // hongos que alumbran y un poco de cristal
  const POZAS = [[-4, -6], [5, -15], [-5, -19]];
  for (let k = 0; k < 24; k++) {
    const x = Math.floor(h3(c, k, 7, 0) * 17) - 8, z = -3 - Math.floor(h3(c, k, 8, 0) * 19);
    const e = (x / 9.5) ** 2 + ((z + 12.5) / 10) ** 2;
    if (e > 0.8 || cols.some(([a, b]) => Math.abs(a - x) < 2 && Math.abs(b - z) < 2) || POZAS.some(([a, b]) => Math.abs(a - x) < 3 && Math.abs(b - z) < 3) || (Math.abs(x) < 4 && z < -19)) continue;
    c.set(x, S0 + 1, z, k % 3 ? K.glow_mushroom : K.cristal);
  }
  // el fondo: una repisa de calcita con el cofre, entre cristal
  c.fill(-3, S0 + 1, -21, 3, S0 + 1, -20, K.calcite);
  c.fill(-1, S0 + 2, -22, 1, S0 + 2, -22, K.quartz_block);
  c.chest(0, S0 + 2, -21, 0, c.loot([[258, 3, 8], [259, 2, 5], [272, 4, 10], [257, 6, 14], [260, 0, 2], [273, 1, 3], [360, 15, 40]], 7));
  for (const [x, z] of [[-3, -20], [3, -20], [-2, -22], [2, -22]]) c.set(x, S0 + 2, z, K.cristal);
  c.set(0, S0 + 1, -4, K.torch);
  c.zone(0, S0 + 2, -12, 'cueva_barra_honda', 14);
}

// ---------- Cueva de Venado: un río subterráneo con puentes de piedra ----------
export function buildCuevaVenado(c) {
  const D = 18, S0 = -D - 1;
  boca(c, 'Cueva de Venado', 'Cerca de Venado, en San Carlos, un río corre por dentro de la montaña. Las cuevas son de piedra caliza y el agua es fría y limpia. Se cruza por unos puentes de piedra y se oye antes de verse.');
  c.fill(-11, S0 - 3, -35, 11, S0 + 9, -1, K.stone);
  pozo(c, D);
  // la sala larga (techo irregular) con el cauce en medio
  for (let z = -3; z >= -33; z--) for (let x = -9; x <= 9; x++) {
    if (Math.abs(x) > 7 + (h3(c, x, 2, z) < 0.4 ? 1 : 0)) continue;
    const techo = S0 + 5 + Math.floor(h3(c, x, 3, z) * 3);
    c.set(x, S0, z, h3(c, x, S0, z) < 0.2 ? K.mossy : K.stone);
    for (let y = S0 + 1; y <= techo; y++) c.set(x, y, z, 0);
  }
  // el cauce (3 de ancho, 2 de hondo) con agua que no desborda: tapado por piedra a los lados y en los extremos
  c.fill(-3, S0 - 3, -34, 3, S0 - 2, -6, K.stone);
  c.fill(-2, S0 - 2, -33, 2, S0 - 2, -7, K.stone);
  c.fill(-1, S0 - 1, -33, 1, S0, -7, K.water);
  c.fill(-2, S0, -34, 2, S0 + 2, -34, K.stone); c.fill(-2, S0, -6, 2, S0, -6, K.stone);
  // dos puentes de piedra sobre el agua (arco bajo: queda agua debajo)
  for (const z of [-13, -24]) c.fill(-1, S0, z, 1, S0, z + 1, K.cobble);
  // estalactitas, musgo y hongos
  for (let k = 0; k < 26; k++) {
    const x = Math.floor(h3(c, k, 9, 0) * 15) - 7, z = -4 - Math.floor(h3(c, k, 10, 0) * 28);
    if (Math.abs(x) <= 1) continue;
    const techo = S0 + 5 + Math.floor(h3(c, x, 3, z) * 3);
    if (k % 2) c.set(x, techo, z, K.stalactite); else c.set(x, S0 + 1, z, K.glow_mushroom);
  }
  // el cofre, en la orilla del fondo, sobre un banco de piedra
  c.fill(4, S0 + 1, -31, 7, S0 + 1, -29, K.cobble);
  c.chest(5, S0 + 2, -30, 3, c.loot([[258, 4, 9], [259, 2, 6], [273, 1, 3], [369, 1, 3], [440, 2, 4], [461, 1, 3], [360, 15, 40]], 7));
  c.set(4, S0 + 2, -30, K.glow_mushroom);
  c.set(0, S0 + 1, -4, K.torch);
  c.zone(0, S0 + 1, -18, 'cueva_venado', 18);
}

// ---------- Geoda mayor: una esfera de cuarzo y cristal con un cofre en el centro ----------
export function buildGeodaMayor(c) {
  const D = 14, CY = -D + 2, CZ = -10, R = 8;
  boca(c, 'Geoda mayor', 'Una geoda del tamaño de una sala: por fuera, basalto y caliza; por dentro, cuarzo y cristal que brilla con cualquier luz. Cuentan que los viejos mineros de Abangares la oyeron cantar y nunca la encontraron.');
  pozo(c, D);
  for (let dy = -R - 1; dy <= R + 1; dy++) for (let dz = -R - 1; dz <= R + 1; dz++) for (let dx = -R - 1; dx <= R + 1; dx++) {
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + h3(c, dx, CY + dy, CZ + dz) * 0.5;
    if (d > R) continue;
    const x = dx, y = CY + dy, z = CZ + dz;
    if (d > R - 0.8) c.set(x, y, z, K.basalt);
    else if (d > R - 1.6) c.set(x, y, z, K.calcite);
    else if (d > R - 2.3) c.set(x, y, z, K.quartz_block);
    else c.set(x, y, z, 0);
  }
  // la boca de la geoda: un túnel desde el pozo
  c.fill(-1, -D, -4, 1, -D + 2, -2, 0);
  // cristal: racimos en el piso y las paredes del interior
  for (let k = 0; k < 70; k++) {
    const a = h3(c, k, 11, 0) * 6.2832, b = Math.acos(2 * h3(c, k, 12, 0) - 1), r = R - 2.4;
    const x = Math.round(Math.sin(b) * Math.cos(a) * r), y = CY + Math.round(Math.cos(b) * r), z = CZ + Math.round(Math.sin(b) * Math.sin(a) * r);
    c.set(x, y, z, k % 5 ? K.cristal : K.cristal_bloque);
  }
  // el cofre sobre un pedestal de cuarzo, en el centro
  c.set(0, CY - 5, CZ, K.quartz_block);
  c.chest(0, CY - 4, CZ, 0, c.loot([[272, 8, 16], [260, 1, 3], [274, 1, 2], [259, 3, 6], [273, 2, 4], [360, 20, 50]], 6));
  c.set(0, CY - 3, CZ + 2, K.cristal); c.set(0, CY - 3, CZ - 2, K.cristal); c.set(2, CY - 3, CZ, K.cristal); c.set(-2, CY - 3, CZ, K.cristal);
  c.zone(0, CY - 4, CZ, 'geoda_mayor', 10);
}
