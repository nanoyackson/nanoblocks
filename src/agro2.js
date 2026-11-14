// Más campo (generador v6): el cacaotal bribri del Caribe sur, con su casa cónica de palma, mazorcas que se
// cosechan y el chocolate artesanal; y una lechería de altura con establo, ordeño, tanque de enfriamiento y la
// quesera donde sale el queso Turrialba y la natilla. El frente mira a +z local. Sin gráficos.
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

// árbol de cacao: bajito, con las mazorcas pegadas al tronco (así crecen de verdad)
function cacaoTree(c, x, z, seed) {
  const g = 0; // el terreno ya quedó aplanado por foundation
  const h = 3 + (seed % 2);
  for (let y = g + 1; y <= g + h; y++) c.set(x, y, z, K.log);
  c.circle(2.3, (dx, dz, d) => { c.set(x + dx, g + h + 1, z + dz, K.jungle_leaves); if (d < 1.4) c.set(x + dx, g + h + 2, z + dz, K.jungle_leaves); });
  const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let k = 0; k < 3; k++) {
    const [dx, dz] = sides[(seed + k) % 4];
    c.set(x + dx, g + 1 + ((seed + k) % 2) + 1, z + dz, K.mazorca_cacao);
  }
}

// ---------- cacaotal bribri ----------
export function buildCacaotal(c) {
  c.foundation(-16, -14, 16, 16, K.dirt, K.grass, 16);
  // el cacaotal bajo la sombra de árboles grandes
  for (let z = -12; z <= 14; z += 4) for (let x = 2; x <= 14; x += 4) cacaoTree(c, x, z, Math.floor(hash3(c.ox, x, z, 9) * 8));
  for (const [x, z] of [[8, -6], [8, 10]]) {
    const g = 0;
    for (let y = g + 1; y <= g + 10; y++) c.set(x + 1, y, z, K.jungle_log);
    c.circle(3.5, (dx, dz, d) => { c.set(x + 1 + dx, g + 10, z + dz, K.jungle_leaves); if (d < 2) c.set(x + 1 + dx, g + 11, z + dz, K.jungle_leaves); });
  }
  // la casa cónica de palma (como las de Talamanca): poste central y techo hasta el suelo
  const R = 6;
  for (let y = 0; y <= 9; y++) {
    const r = R * (1 - y / 10);
    c.circle(r + 0.5, (x, z, d) => {
      const cx = x - 8, cz = z;
      if (y === 0) c.set(cx, 0, cz, K.planks);
      else if (d > r - 1.1) c.set(cx, y, cz, (x + y + z) % 3 ? K.pajon : K.jungle_leaves);
      else c.set(cx, y, cz, 0);
    });
  }
  c.fill(-8, 1, 0, -8, 9, 0, K.log);
  for (let y = 1; y <= 2; y++) c.set(-8, y, R - 1, 0);
  c.set(-8, 1, R, 0); c.set(-8, 2, R, 0);
  c.set(-10, 1, -2, K.stove);
  // la mesa donde se secan las semillas y el metate de piedra para molerlas
  c.fill(-14, 1, 9, -4, 1, 13, K.planks);
  for (let z = 9; z <= 13; z++) for (let x = -14; x <= -4; x++) if ((x + z) % 2) c.set(x, 2, z, K.cafe_secado);
  c.set(-2, 1, 11, K.smooth_stone); c.set(-2, 2, 11, K.cobble);
  c.chest(-9, 1, 3, 2, c.loot([[409, 1, 3], [408, 2, 5], [297, 1, 2]], 4));
  c.placa(-3, 1, 14, 0, 'Cacao de Talamanca', 'Para el pueblo bribri el cacao es sagrado: se toma en las ceremonias y se comparte. Las mazorcas crecen pegadas al tronco; adentro, las semillas se fermentan, se secan al sol, se tuestan y se muelen en piedra. Con tapa de dulce sale el chocolate.');
  c.npc(-6, 1, 6, { role: 'sodera', name: 'Doña Cecilia (chocolate artesanal)' });
}

// ---------- lechería de altura ----------
export function buildLecheria(c) {
  c.foundation(-20, -16, 20, 18, K.cobble, K.grass, 16);
  // el establo abierto con los comederos
  for (let z = -12; z <= 0; z++) for (let x = -18; x <= -2; x++) {
    const post = (x === -18 || x === -2) && z % 3 === 0;
    c.set(x, 0, z, K.concreto);
    for (let y = 1; y <= 4; y++) c.set(x, y, z, post ? K.log : 0);
    if (z === -12) for (let y = 1; y <= 4; y++) c.set(x, y, z, K.planks);
    c.set(x, 5, z, K.zinc);
    if (z === -10 && x % 3) c.set(x, 1, z, K.saco_cafe);
  }
  // sala de ordeño y el tanque de enfriamiento
  for (let z = -12; z <= -4; z++) for (let x = 2; x <= 10; x++) {
    const edge = x === 2 || x === 10 || z === -12 || z === -4;
    c.set(x, 0, z, K.smooth_stone);
    for (let y = 1; y <= 3; y++) c.set(x, y, z, edge ? (y === 2 && (x + z) % 2 ? K.glass : K.plaster) : 0);
    c.set(x, 4, z, K.zinc);
  }
  c.door(6, 1, -4, 0);
  c.fill(4, 1, -10, 5, 2, -9, K.tanque_agua);
  c.fill(8, 1, -11, 9, 1, -6, K.planks);
  // la quesera: donde se prensa el queso Turrialba y se hace la natilla
  for (let z = 4; z <= 12; z++) for (let x = 6; x <= 16; x++) {
    const edge = x === 6 || x === 16 || z === 4 || z === 12;
    c.set(x, 0, z, K.planks);
    for (let y = 1; y <= 3; y++) c.set(x, y, z, edge ? (y === 2 && (x + z) % 3 === 0 ? K.glass : K.paint_blue) : 0);
    c.set(x, 4, z, K.teja);
  }
  c.door(11, 1, 4, 2);
  c.be(14, 1, 10, K.stove, { type: 'stove', facing: 0, grid: new Array(9).fill(null) });
  c.fill(8, 1, 10, 11, 1, 10, K.planks);
  c.chest(8, 1, 6, 1, c.loot([[410, 1, 3], [411, 1, 2], [292, 1, 2], [412, 1, 1]], 4));
  // el potrero con las vacas lecheras y la cerca
  for (let x = -18; x <= -2; x++) { c.set(x, 1, 16, K.cerca); }
  for (let z = 4; z <= 16; z++) { c.set(-18, 1, z, K.cerca); c.set(-2, 1, z, z === 10 ? 0 : K.cerca); }
  for (let k = 0; k < 6; k++) c.set(-16 + k * 2 + (k % 2), 1, 6 + (k * 5) % 9, K.bonita);
  c.placa(0, 1, 16, 0, 'Lechería La Vaquita', 'Cooperativa La Vaquita (ficticia): las vacas se ordeñan a las 4 de la mañana, haga frío o haga sol. La leche sale fresca al tanque y de ahí a la quesera: queso Turrialba, natilla y cuajada. Lleve un sombrero de sabanero, que el sol de la tarde pega.');
  c.npc(-10, 1, -6, { role: 'boyero', name: 'Don Eliécer (lechero)' });
  c.npc(12, 1, 8, { role: 'sodera', name: 'Doña Flory (quesera)' });
  for (let k = 0; k < 4; k++) c.npc(-15 + k * 4, 1, 9 + (k % 2) * 3, { mob: 'vaca', name: `vaca lechera ${k}` });
}
