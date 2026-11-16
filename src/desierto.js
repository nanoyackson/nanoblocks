// v13.4.0 (B3 del plan de contenido, generador 27): construcciones del desierto. Hasta aquí el desierto era dunas y cactus sin nada que encontrar
// (0 estructuras en 22 500 trozos). Tres lugares chicos, todo original y de arrieros: el Oasis con ruina, el Pozo del Arriero y la Carreta de la
// sequía. Se registran en `TYPES` de estructuras.js con `minV: 27`; solo hash y el azar de la construcción (`c.rnd`), nunca Math.random.
import { BLOCK_BY_KEY as K } from './blocks.js';

const LOOT = [[360, 5, 15], [259, 1, 3], [258, 1, 3], [327, 4, 10], [299, 1, 2], [1197, 2, 4]]; // colones, hierro, comida, agua dulce y tuna

// una palmera: tronco de 4-6 con copa de hojas (la jungla da la forma más cerca de una palma)
function palma(c, x, z, alto) {
  for (let y = 1; y <= alto; y++) c.set(x, y, z, K.jungle_log);
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) c.set(x + dx, alto + 1 - (Math.abs(dx) + Math.abs(dz) > 1 ? 1 : 0), z + dz, K.jungle_leaves);
}

// Oasis con ruina: un charco con palmeras y, al lado, una casa de adobe caída con un cofre del último arriero que pasó
export function buildOasis(c) {
  c.foundation(-9, -9, 9, 9, K.sand, K.sand, 12);
  c.clearTrees(10);
  // el charco, dos bloques hondo, con orilla de pasto
  c.circle(4.6, (x, z, d) => { c.set(x, 0, z, d > 3.4 ? K.grass : K.sand); });
  c.circle(3.4, (x, z) => { c.set(x, -1, z, K.water); c.set(x, 0, z, K.water); c.set(x, -2, z, K.sand); });
  palma(c, -4, 3, 4 + Math.floor(c.rnd() * 2)); palma(c, 4, -3, 5); palma(c, -3, -5, 4 + Math.floor(c.rnd() * 2)); palma(c, 5, 4, 5);
  // la ruina de adobe, al este: paredes de tres bloques con huecos (caída), sin techo
  for (let z = -3; z <= 3; z++) for (let x = 6; x <= 9; x++) {
    const borde = x === 6 || x === 9 || z === -3 || z === 3;
    c.set(x, 0, z, K.losa_adobe);
    if (!borde) continue;
    const alto = 1 + Math.floor(c.rnd() * 3);
    for (let y = 1; y <= alto; y++) if (!(x === 6 && z === 0 && y < 3)) c.set(x, y, z, K.adobe); // el hueco de la puerta
  }
  c.chest(8, 1, 0, 3, c.loot(LOOT, 4));
  c.set(7, 1, 1, K.barril);
  c.placa(6, 1, -4, 0, 'Oasis de los Arrieros', 'El agua es de todos; el cofre, del último que pasó. Deje algo.');
  c.zone(0, 1, 0, 'oasis', 14);
}

// Pozo del Arriero: un brocal con balde, una sombra de palos y lona, y un banco; agua dulce abajo
export function buildPozo(c) {
  c.foundation(-5, -5, 5, 5, K.sand, K.sand, 8);
  c.clearTrees(6);
  c.fill(-1, 0, -1, 1, 0, 1, K.sandstone);
  c.set(0, 0, 0, K.water); c.set(0, -1, 0, K.water); c.set(0, -2, 0, K.water);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.set(x, 1, z, K.sandstone);
  // la sombra: cuatro postes y la lona
  for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) for (let y = 1; y <= 3; y++) c.set(x, y, z, K.log);
  c.fill(-3, 4, -3, 3, 4, 3, K.wool);
  c.set(-2, 1, 2, K.planks); c.set(-1, 1, 2, K.planks); c.set(2, 1, -2, K.barril);
  c.chest(3, 1, 0, 3, c.loot(LOOT, 3));
  c.placa(0, 1, -4, 0, 'Pozo del Arriero', 'Hondo y dulce. Saque, tome y deje la soga como la encontró.');
}

// Carreta de la sequía: una carreta volcada con la carga regada y un cofre bajo la lona; los huesos de los bueyes
export function buildCarretaSeca(c) {
  c.foundation(-5, -5, 6, 5, K.sand, K.sand, 8);
  c.clearTrees(6);
  c.fill(-2, 1, -1, 2, 1, 1, K.planks);
  c.fill(-2, 2, -1, -2, 2, 1, K.planks); c.fill(2, 2, 0, 2, 2, 0, K.planks);
  for (const [x, z] of [[-3, -2], [3, 2]]) { for (let y = 1; y <= 3; y++) c.set(x, y, z, K.planks); } // una rueda de pie
  c.set(0, 2, 0, K.wool); c.set(1, 2, 1, K.wool);
  c.chest(0, 1, 2, 0, c.loot(LOOT, 3));
  for (let k = 0; k < 6; k++) { const x = -5 + Math.floor(c.rnd() * 11), z = -4 + Math.floor(c.rnd() * 9); if (c.getMaybe(x, 1, z)) c.set(x, 1, z, K.cactus); }
  c.placa(4, 1, 0, 3, 'Carreta de la sequía', 'Se quedó sin agua a media jornada. El Pozo del Arriero queda al norte.');
}
