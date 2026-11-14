// Más parques nacionales (generador v6): Braulio Carrillo con la Ruta 32 que se cierra por derrumbes y la unión
// del río Sucio (amarillo) con el Honduras (oscuro), el truchero de Juan Castro Blanco y las lapas rojas de
// Carara. Sin gráficos.
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

function arco(c, x, z, title, text) {
  const g = Math.max(c.ground(x, z), 0);
  for (const s of [-1, 1]) c.fill(x + s * 4, g + 1, z, x + s * 4, g + 5, z, K.log);
  c.fill(x - 5, g + 6, z, x + 5, g + 6, z, K.log);
  c.fill(x - 3, g + 5, z, x + 3, g + 5, z, K.planks);
  c.fill(x - 4, g + 7, z, x + 4, g + 7, z, K.teja);
  c.placa(x, g + 4, z, 0, title, text);
}
function tree(c, x, z, h, log = K.jungle_log, leaf = K.jungle_leaves, r = 2.6) {
  const g = c.ground(x, z);
  for (let y = g + 1; y <= g + h; y++) c.set(x, y, z, log);
  c.circle(r, (dx, dz, d) => { c.set(x + dx, g + h, z + dz, leaf); if (d < r - 1) c.set(x + dx, g + h + 1, z + dz, leaf); });
}
// helecho arborescente: tronco delgado con musgo y una corona de frondas
function treeFern(c, x, z, h) {
  const g = c.ground(x, z);
  for (let y = g + 1; y <= g + h; y++) c.set(x, y, z, y % 3 ? K.tronco_musgoso : K.log);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) c.set(x + dx, g + h + (Math.abs(dx) + Math.abs(dz) > 1 ? 0 : 1), z + dz, K.jungle_leaves);
  c.set(x, g + h + 1, z, K.helecho);
}

// ---------- Braulio Carrillo ----------
export function buildBraulio(c) {
  // la selva: árboles altos, helechos arborescentes y sombrillas de pobre
  for (let k = 0; k < 26; k++) {
    const x = Math.floor(hash3(c.ox, k, 1, c.oz) * 56) - 28, z = Math.floor(hash3(c.ox, k, 2, c.oz) * 56) - 28;
    if (Math.abs(z) < 5 || Math.abs(x - 10) < 4) continue;
    if (k % 3 === 0) treeFern(c, x, z, 4 + (k % 3)); else tree(c, x, z, 8 + (k % 5), K.jungle_log, K.jungle_leaves, 3);
  }
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(hash3(c.ox, k, 3, c.oz) * 56) - 28, z = Math.floor(hash3(c.ox, k, 4, c.oz) * 56) - 28;
    if (Math.abs(z) < 4) continue;
    const g = c.ground(x, z);
    c.set(x, g + 1, z, [K.helecho, K.bromelia, K.musgo, K.tall_grass][k % 4]);
  }
  // la Ruta 32: dos carriles con línea amarilla y baranda, en medio de la montaña
  for (let x = -30; x <= 30; x++) {
    const g = c.ground(x, 0);
    for (let z = -3; z <= 3; z++) {
      c.set(x, g, z, Math.abs(z) === 3 ? K.concreto : z === 0 && x % 4 < 2 ? K.asfalto_linea : K.asfalto);
      for (let y = g + 1; y <= g + 7; y++) c.set(x, y, z, 0);
    }
    if (x % 2 === 0) { c.set(x, g + 1, -4, K.barrera); c.set(x, g + 1, 4, K.barrera); }
  }
  // el derrumbe de siempre: tierra y piedras tapando un carril, con conos y la barrera
  for (let x = 16; x <= 26; x++) for (let z = -3; z <= 1; z++) {
    const g = c.ground(x, z);
    const h = Math.round(3 * (1 - Math.abs(x - 21) / 6) + hash3(c.ox, x, z, 5) * 1.5);
    for (let y = 1; y <= h; y++) c.set(x, g + y, z, (x + y + z) % 3 ? K.dirt : K.cobble);
  }
  for (const x of [12, 13, 14]) c.set(x, c.ground(x, -1) + 1, -1, K.cono);
  c.placa(11, c.ground(11, 2) + 1, 2, 0, 'Ruta 32: paso regulado', 'Cierre por derrumbe… otra vez. Tiempo estimado de reapertura: «ya casi». Se recomienda tomar la ruta por Vara Blanca. — Ministerio de Obras Eternas (ficticio)');
  // la unión de los ríos: el Sucio, amarillo por los minerales del volcán, y el Honduras, oscuro y limpio
  for (let z = 6; z <= 28; z++) for (let x = -28; x <= 28; x++) {
    const sucio = Math.abs(x + 12 - (z - 6) * 0.5) <= 2 && z < 18;
    const honduras = Math.abs(x - 12 + (z - 6) * 0.5) <= 2 && z < 18;
    const unidos = z >= 18 && Math.abs(x) <= 3;
    if (!sucio && !honduras && !unidos) continue;
    const g = c.ground(x, z);
    const bed = sucio ? K.sandstone : honduras ? K.basalt : (x < 0 ? K.sandstone : K.basalt);
    c.set(x, g - 2, z, bed);
    c.set(x, g - 1, z, K.water); c.set(x, g, z, K.water);
    for (let y = g + 1; y <= g + 6; y++) c.set(x, y, z, 0);
  }
  c.placa(0, c.ground(-5, 18) + 1, 18, 0, 'Donde se juntan los ríos', 'El río Sucio baja amarillo por los minerales del volcán Barva; el Honduras viene oscuro y limpio. Al juntarse corren un buen rato lado a lado sin mezclarse.');
  arco(c, -18, -8, 'Parque Nacional Braulio Carrillo', 'Entre San José y Limón: montañas cubiertas de bosque lluvioso, cientos de cataratas y neblina casi todo el año. La carretera lo atraviesa por el medio.');
  c.npc(-18, c.ground(-18, -11) + 1, -11, { role: 'guardaparques', name: 'Guardaparques del Braulio' });
  c.npc(-22, c.ground(-22, 12) + 1, 12, { mob: 'mono', name: 'mono congo del Braulio' });
  c.npc(20, c.ground(20, 14) + 1, 14, { mob: 'danta', name: 'danta del Braulio' });
}

// ---------- Juan Castro Blanco: el parque del agua y el truchero ----------
export function buildJuanCastro(c) {
  c.foundation(-18, -16, 18, 16, K.stone, K.grass, 12);
  // tres estanques de truchas con muro de piedra y un canal que los une
  for (const [ox, oz] of [[-12, -8], [-2, -8], [8, -8]]) {
    for (let z = oz; z <= oz + 6; z++) for (let x = ox; x <= ox + 7; x++) {
      const edge = x === ox || x === ox + 7 || z === oz || z === oz + 6;
      c.set(x, 0, z, edge ? K.smooth_stone : K.water);
      if (!edge) c.set(x, -1, z, K.water);
      c.set(x, -2, z, K.gravel);
    }
  }
  for (let x = -11; x <= 14; x++) c.set(x, 0, -9, K.water);
  // la naciente: una caída de agua desde un cerrito de piedra con musgo
  c.fill(10, 1, 4, 16, 6, 12, K.mossy);
  c.fill(12, 1, 4, 13, 6, 4, K.water_fall);
  c.fill(11, 0, 1, 14, 0, 3, K.water);
  for (let k = 0; k < 18; k++) c.set(10 + Math.floor(c.rnd() * 7), 7, 4 + Math.floor(c.rnd() * 9), k % 2 ? K.helecho : K.musgo);
  // soda del truchero
  for (let x = -14; x <= -6; x++) for (let z = 4; z <= 11; z++) {
    const edge = x === -14 || x === -6 || z === 4 || z === 11;
    c.set(x, 0, z, K.planks);
    for (let y = 1; y <= 3; y++) c.set(x, y, z, edge && (y === 3 || x === -14 || z === 11) ? K.planks : 0);
    c.set(x, 4, z, K.zinc);
  }
  for (const [x, z] of [[-14, 4], [-6, 4], [-6, 11], [-14, 11]]) c.fill(x, 1, z, x, 3, z, K.log);
  c.fill(-12, 1, 8, -8, 1, 8, K.planks);
  c.be(-13, 1, 10, K.stove, { type: 'stove', facing: 0, grid: new Array(9).fill(null) });
  c.chest(-7, 1, 10, 2, c.loot([[394, 1, 3], [365, 2, 5], [375, 1, 2]], 3));
  c.placa(-10, 1, 3, 0, 'Truchero «La Naciente»', 'Pesque su propia trucha y se la fríen con patacones. Se cobra por kilo. (Hay caña en el cofre de la soda)');
  c.placa(0, 1, 13, 0, 'Parque Nacional Juan Castro Blanco', 'En Alajuela, entre volcanes dormidos: el «parque del agua». Aquí nacen ríos que le dan agua a media Zona Norte.');
  c.npc(-10, 1, 6, { role: 'sodera', name: 'Doña Marta (truchero)' });
  c.npc(2, 1, 0, { role: 'guardaparques', name: 'Guardaparques de Juan Castro' });
  for (let k = 0; k < 3; k++) c.npc(-9 + k * 10, 0, -5, { mob: 'pez', name: `trucha ${k}` });
}

// ---------- Carara: las lapas rojas y el sendero del bosque de transición ----------
export function buildCarara(c) {
  // un almendro gigante donde duermen las lapas
  const g0 = c.ground(0, 0);
  for (let y = g0 + 1; y <= g0 + 14; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) c.set(dx, y, dz, K.log);
  c.circle(6, (dx, dz, d) => { c.set(dx, g0 + 14, dz, K.leaves); if (d < 4.5) c.set(dx, g0 + 15, dz, K.leaves); if (d < 2.5) c.set(dx, g0 + 16, dz, K.leaves); });
  for (const [dx, dz] of [[-3, 0], [4, 1], [0, -3], [1, 4]]) c.set(dx, g0 + 1, dz, K.log);
  // sendero en círculo con barandas y bancas
  c.circle(14, (dx, dz, d) => {
    if (d < 12.5 || d > 14) return;
    const g = c.ground(dx, dz);
    c.set(dx, g, dz, K.gravel);
    for (let y = g + 1; y <= g + 4; y++) c.set(dx, y, dz, 0);
  });
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + 0.2, r = 18 + (k % 3) * 3;
    const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
    tree(c, x, z, 7 + (k % 4), k % 2 ? K.jungle_log : K.log, k % 2 ? K.jungle_leaves : K.leaves, 2.6);
  }
  // laguna con cocodrilos al borde del bosque
  for (let z = 16; z <= 24; z++) for (let x = -24; x <= -14; x++) {
    if (Math.hypot(x + 19, z - 20) > 5) continue;
    const g = c.ground(x, z);
    c.set(x, g, z, K.water); c.set(x, g - 1, z, K.lodo);
    for (let y = g + 1; y <= g + 3; y++) c.set(x, y, z, 0);
  }
  c.placa(0, c.ground(0, -13) + 1, -13, 0, 'Parque Nacional Carara', 'En el Pacífico central, donde el bosque seco del norte se junta con el lluvioso del sur. Al atardecer las lapas rojas vuelan en parejas gritando hacia la costa.');
  for (let k = 0; k < 4; k++) c.npc(Math.round(Math.cos(k * 1.6) * 3), g0 + 17, Math.round(Math.sin(k * 1.6) * 3), { mob: 'lapa', name: `lapa roja ${k}` });
  c.npc(-19, c.ground(-19, 20) + 1, 20, { mob: 'cocodrilo', name: 'cocodrilo de la laguna' });
  c.npc(4, c.ground(4, -12) + 1, -12, { role: 'guardaparques', name: 'Guía de aves de Carara' });
}

// ---------- Parque Internacional La Amistad: robledales en la cordillera de Talamanca y el mojón de la frontera ----------
function roble(c, x, z, h) {
  const g = c.ground(x, z);
  for (let y = g + 1; y <= g + h; y++) c.set(x, y, z, y % 4 === 0 ? K.tronco_musgoso : K.log);
  // ramas gruesas con musgo, bromelias y barbas de viejo colgando
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let k = 1; k <= 3; k++) c.set(x + dx * k, g + h - 2 + (k >> 1), z + dz * k, k === 3 ? K.tronco_musgoso : K.log);
    c.set(x + dx * 2, g + h, z + dz * 2, K.bromelia);
    c.set(x + dx * 3, g + h - 3, z + dz * 3, K.vine);
  }
  c.circle(4.5, (dx, dz, d) => { c.set(x + dx, g + h + 1, z + dz, K.leaves); if (d < 3.4) c.set(x + dx, g + h + 2, z + dz, K.leaves); if (d < 2) c.set(x + dx, g + h + 3, z + dz, K.leaves); });
}
export function buildAmistadParque(c) {
  // robledal: robles altos y viejos, helechos y musgo por todo lado
  const spots = [[-18, -14], [-6, -20], [10, -16], [20, -4], [16, 14], [-16, 12], [-22, 0], [4, 20]];
  spots.forEach(([x, z], i) => roble(c, x, z, 11 + (i % 3) * 2));
  for (let k = 0; k < 50; k++) {
    const x = Math.floor(c.rnd() * 48) - 24, z = Math.floor(c.rnd() * 48) - 24;
    if (Math.abs(x) < 7 && Math.abs(z) < 7) continue;
    const g = c.ground(x, z);
    if (c.rnd() < 0.5) c.set(x, g, z, K.musgo);
    c.set(x, g + 1, z, [K.helecho, K.helecho, K.bromelia, K.tall_grass][k % 4]);
  }
  // el mojón de la frontera: pilar de concreto con las banderas a cada lado
  const g0 = c.ground(0, 0);
  c.fill(-1, g0 + 1, -1, 1, g0 + 1, 1, K.concreto);
  c.fill(0, g0 + 2, 0, 0, g0 + 4, 0, K.concreto);
  c.set(0, g0 + 5, 0, K.lamp);
  // banderas: Costa Rica (azul, blanco, rojo) a un lado y Panamá (cuarteles blanco/rojo/azul) al otro
  c.fill(-4, g0 + 1, 3, -4, g0 + 7, 3, K.cerca);
  [K.paint_blue, K.plaster, K.repello_rojo, K.repello_rojo, K.plaster, K.paint_blue].forEach((id, i) => c.fill(-3, g0 + 7 - i, 3, 0 - 1, g0 + 7 - i, 3, id));
  c.fill(4, g0 + 1, 3, 4, g0 + 7, 3, K.cerca);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) c.set(j + 5, g0 + 7 - i, 3, (i < 3) === (j < 2) ? K.plaster : (i < 3 ? K.repello_rojo : K.paint_blue));
  c.placa(0, g0 + 1, 2, 0, 'Parque Internacional La Amistad', 'Compartido entre Costa Rica y Panamá: el bosque más grande y salvaje del país, en lo alto de la cordillera de Talamanca, territorio ancestral de los pueblos bribri y cabécar. Aquí la frontera no tiene muro: tiene robles de 50 metros, dantas y quetzales.');
  // la estación de los guardaparques
  for (let z = 8; z <= 13; z++) for (let x = -12; x <= -6; x++) {
    const edge = x === -12 || x === -6 || z === 8 || z === 13;
    const g = c.ground(-9, 10);
    c.set(x, g, z, K.planks);
    for (let y = 1; y <= 3; y++) c.set(x, g + y, z, edge ? (y === 2 && (x + z) % 2 ? K.glass : K.paint_green) : 0);
    c.set(x, g + 4, z, K.zinc);
  }
  const gs = c.ground(-9, 10);
  c.door(-9, gs + 1, 8, 2);
  c.set(-11, gs + 1, 12, K.bed); c.set(-7, gs + 1, 12, K.stove);
  c.chest(-7, gs + 1, 9, 2, c.loot([[278, 1, 2], [262, 2, 4], [263, 2, 4], [282, 1, 1]], 4));
  c.npc(-9, gs + 1, 6, { role: 'guardaparques', name: 'Don Heriberto (guardaparques de La Amistad)' });
  c.npc(14, c.ground(14, 8) + 1, 8, { mob: 'danta', name: 'danta de Talamanca' });
  c.npc(-14, c.ground(-14, -8) + 8, -8, { mob: 'quetzal', name: 'quetzal del robledal' });
  c.npc(8, c.ground(8, -10) + 8, -10, { mob: 'quetzal', name: 'quetzal del robledal 2' });
}

// ---------- Rincón de la Vieja, sector Las Pailas: catarata La Cangreja, volcancito de lodo y fumarolas ----------
export function buildRinconParque(c) {
  c.foundation(-22, -22, 22, 22, K.dirt, K.grass, 14);
  // sendero en anillo de lastre
  c.circle(15, (x, z, d) => { if (d > 13.6) c.set(x, 0, z, K.gravel); });
  // la catarata La Cangreja: farallón de basalto, la caída y la poza celeste
  for (let x = -6; x <= 6; x++) for (let y = 1; y <= 14; y++) for (let z = -22; z <= -18; z++) c.set(x, y, z, (x + y) % 5 ? K.basalt : K.mossy);
  for (let y = 1; y <= 13; y++) c.set(0, y, -17, K.water_fall);
  c.set(0, 14, -18, K.water); c.set(0, 14, -19, K.water);
  c.circle(4.6, (x, z, d) => { const zz = z - 12; c.set(x, 0, zz, K.agua_celeste); c.set(x, -1, zz, K.agua_celeste); c.set(x, -2, zz, K.calcite); if (d > 3.8) c.set(x, 0, zz, K.travertino); });
  // el volcancito: un cono de lodo que borbotea
  c.circle(4.2, (x, z, d) => {
    const hh = Math.round(3 * (1 - d / 4.2));
    for (let y = 1; y <= hh; y++) c.set(x + 10, y, z + 6, y === hh ? (d < 1.2 ? K.lodo : K.dirt) : K.dirt);
  });
  c.zone(10, 3, 6, 'lodo', 3);
  // fumarolas: azufre y vapor entre las piedras
  for (const [x, z] of [[-10, 6], [-12, 9], [-8, 11]]) { c.set(x, 0, z, K.azufre_bloque); c.set(x + 1, 0, z, K.ceniza); }
  c.zone(-10, 1, 8, 'fumarola', 6);
  // árboles del bosque seco: guanacastes y madera negra
  for (const [x, z] of [[16, -14], [-17, -6], [18, 14], [-15, 17], [6, 18]]) {
    for (let y = 1; y <= 6; y++) c.set(x, y, z, K.log);
    c.circle(3.4, (dx, dz, d) => { c.set(x + dx, 7, z + dz, K.leaves); if (d < 2) c.set(x + dx, 8, z + dz, K.leaves); });
  }
  // el puesto de guardaparques
  for (let z = 14; z <= 19; z++) for (let x = -6; x <= 2; x++) {
    const edge = x === -6 || x === 2 || z === 14 || z === 19;
    for (let y = 1; y <= 3; y++) c.set(x, y, z, edge ? (y === 2 && (x + z) % 2 ? K.glass : K.paint_yellow) : 0);
    c.set(x, 4, z, K.teja);
  }
  c.door(-2, 1, 14, 2);
  c.placa(2, 1, -6, 0, 'Rincón de la Vieja · sector Las Pailas', 'En Guanacaste: el sendero pasa por pailas de lodo que hierven, fumarolas que huelen a huevo podrido, un volcancito de barro y la catarata La Cangreja, con su poza azul celeste por el cobre de las rocas. ¡No se meta en el lodo, que quema!');
  c.npc(-2, 1, 12, { role: 'guardaparques', name: 'Doña Yorleny (guardaparques de Las Pailas)' });
  c.npc(8, 1, -2, { mob: 'pizote', name: 'pizote de Las Pailas' });
  c.npc(-14, 1, -12, { mob: 'cara_blanca', name: 'mono cara blanca de Las Pailas' });
}
