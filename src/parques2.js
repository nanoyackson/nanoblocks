// Más parques nacionales (generador v6): Cahuita (arrecife y casitas caribeñas), Tenorio con el río Celeste y sus
// teñideros, la reserva de Monteverde en el bosque nuboso, el humedal de Palo Verde y la Isla del Coco con la
// leyenda del tesoro de Lima. Sin gráficos.
import { hash3 } from './noise.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

const SEA = 62;

function arco(c, x, z, title, text) {
  for (const s of [-1, 1]) c.fill(x + s * 4, 1, z, x + s * 4, 5, z, K.log);
  c.fill(x - 5, 6, z, x + 5, 6, z, K.log);
  c.fill(x - 3, 5, z, x + 3, 5, z, K.planks);
  c.fill(x - 4, 7, z, x + 4, 7, z, K.teja);
  c.placa(x, 4, z, 0, title, text);
}
function tree(c, x, z, h, log = K.jungle_log, leaf = K.jungle_leaves, r = 2.6) {
  const g = c.ground(x, z);
  for (let y = g + 1; y <= g + h; y++) c.set(x, y, z, log);
  c.circle(r, (dx, dz, d) => { c.set(x + dx, g + h, z + dz, leaf); if (d < r - 1) c.set(x + dx, g + h + 1, z + dz, leaf); });
}
function palm(c, x, z, h = 6) {
  const g = c.ground(x, z);
  for (let y = g + 1; y <= g + h; y++) c.set(x, y, z, K.jungle_log);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1], [1, -1], [-1, 1]]) c.set(x + dx, g + h + (Math.abs(dx) + Math.abs(dz) > 1 ? 0 : 1), z + dz, K.jungle_leaves);
  c.set(x, g + h + 1, z, K.jungle_leaves);
}

// ---------- Cahuita: sendero entre la selva y la playa, arrecife de coral y casitas caribeñas ----------
export function buildCahuita(c) {
  const top = SEA - c.oy;
  c.foundation(-20, -22, 20, -2, K.sand, K.sand, 12);
  arco(c, 0, -18, 'Parque Nacional Cahuita', 'En el Caribe sur, en Limón: un sendero entre la selva y el mar lleva hasta Punta Cahuita. Afuera está el arrecife de coral más grande del Caribe costarricense. La entrada es por donación voluntaria.');
  for (let z = -22; z <= -3; z++) c.set(0, 0, z, K.planks);
  for (const [x, z] of [[-14, -6], [-8, -12], [9, -5], [15, -14], [-17, -16]]) palm(c, x, z, 6);
  // casita caribeña de madera en pilotes, de colores
  for (const [x, z] of [[-16, -8], [-11, -8], [-16, -3], [-11, -3]]) c.fill(x, 0, z, x, 1, z, K.log);
  for (let z = -8; z <= -3; z++) for (let x = -16; x <= -11; x++) {
    const edge = x === -16 || x === -11 || z === -8 || z === -3;
    c.set(x, 2, z, K.planks);
    for (let y = 3; y <= 5; y++) c.set(x, y, z, edge ? (y === 4 && (x + z) % 2 ? K.glass : (x + y) % 2 ? K.paint_yellow : K.paint_green) : 0);
    c.set(x, 6, z, K.repello_rojo);
  }
  c.door(-13, 3, -3, 0);
  c.placa(-10, 3, -2, 0, 'Rondón y pan bon', 'En Cahuita se come rondón (sopa de coco con mariscos), rice and beans y pan bon. Y se baila calipso. (Easter egg: el cofre de la casita tiene coco)');
  c.chest(-15, 3, -7, 0, c.loot([[382, 3, 6], [275, 4, 8], [365, 1, 3], [360, 5, 12]], 4));
  // arrecife de coral bajo el agua
  for (let z = 6; z <= 30; z++) for (let x = -18; x <= 18; x++) {
    if (hash3(c.ox, x, z, 77) > 0.42) continue;
    const g = c.ground(x, z);
    if (g >= top - 1) continue;
    const col = [K.coral_red, K.coral_orange, K.coral_yellow, K.coral_purple][Math.floor(hash3(c.oz, x, z, 78) * 4)];
    c.set(x, g + 1, z, col); if (hash3(x, z, c.ox, 79) < 0.4 && g + 2 < top - 1) c.set(x, g + 2, z, col);
  }
  c.npc(-4, 1, -10, { role: 'guardaparques', name: 'Guardaparques de Cahuita' });
  c.npc(6, 1, -8, { mob: 'perezoso', name: 'perezoso de Cahuita' });
  c.npc(-6, 1, -14, { mob: 'cara_blanca', name: 'mono de Cahuita' });
}

// ---------- Tenorio: el río Celeste, la catarata y los teñideros ----------
export function buildTenorio(c) {
  c.foundation(-20, -24, 20, 24, K.dirt, K.grass, 18);
  // dos quebradas transparentes que se juntan y se vuelven celestes
  const river = (x, z) => {
    if (z < -2 && Math.abs(x + 6 + z * 0.4) <= 1.5) return 'clara';
    if (z < -2 && Math.abs(x - 6 - z * 0.4) <= 1.5) return 'clara';
    if (z >= -3 && Math.abs(x - Math.sin(z * 0.2) * 2) <= 2.5) return 'celeste';
    return null;
  };
  for (let z = -24; z <= 24; z++) for (let x = -20; x <= 20; x++) {
    const r = river(x, z);
    if (!r) continue;
    c.set(x, -2, z, K.sand);
    c.set(x, -1, z, r === 'celeste' ? K.agua_celeste : K.water);
    c.set(x, 0, z, r === 'celeste' ? K.agua_celeste : K.water);
    for (let y = 1; y <= 4; y++) c.set(x, y, z, 0);
  }
  // catarata celeste al final, en un farallón
  for (let x = -8; x <= 8; x++) for (let y = -8; y <= 0; y++) for (let z = 22; z <= 24; z++) c.set(x, y, z, (x + y) % 4 ? K.stone : K.mossy);
  for (let z = 18; z <= 24; z++) for (let x = -3; x <= 3; x++) for (let y = -9; y <= -2; y++) c.set(x, y, z, z === 24 ? K.stone : 0);
  for (let x = -1; x <= 1; x++) for (let y = -8; y <= 0; y++) c.set(x, y, 21, K.agua_celeste);
  c.circle(4, (dx, dz) => { c.set(dx, -9, 19 + dz, K.agua_celeste); c.set(dx, -10, 19 + dz, K.stone); });
  // puente y mirador sobre los teñideros
  for (let x = -5; x <= 5; x++) { c.set(x, 2, -2, K.planks); c.set(x, 3, -3, K.cerca); c.set(x, 3, -1, K.cerca); }
  for (const s of [-1, 1]) c.fill(s * 5, 1, -2, s * 5, 1, -2, K.log);
  for (const [x, z] of [[-14, -16], [13, -12], [-12, 10], [14, 14], [-16, 0], [16, 2]]) tree(c, x, z, 8);
  for (let k = 0; k < 30; k++) c.set(Math.floor(c.rnd() * 36) - 18, 1, Math.floor(c.rnd() * 44) - 22, k % 3 ? K.helecho : K.bromelia);
  arco(c, 0, -22, 'Parque Nacional Volcán Tenorio', 'El río Celeste: dos quebradas de agua transparente se juntan en los teñideros y, por los minerales del volcán, el agua se vuelve azul celeste. Dice la leyenda que Dios pintó el cielo y aquí lavó los pinceles.');
  c.placa(3, 3, -4, 0, 'Los teñideros', 'Aquí se juntan la quebrada Buenavista y el río Quebrada Agria. Fíjese bien: de un lado el agua es transparente y del otro… celeste. (Easter egg: Dios lavó los pinceles aquí)');
  c.npc(-4, 1, -18, { role: 'guardaparques', name: 'Guardaparques del Tenorio' });
  c.npc(8, 1, 6, { mob: 'tucan', name: 'tucán del Tenorio' });
}

// ---------- Monteverde: la reserva del bosque nuboso ----------
export function buildMonteverde(c) {
  c.foundation(-18, -18, 18, 18, K.dirt, K.grass, 20);
  arco(c, 0, 14, 'Reserva Biológica Bosque Nuboso Monteverde', 'Arriba en la cordillera de Tilarán: árboles cubiertos de musgo, bromelias y orquídeas, quetzales y colibríes. Aquí vivía el sapo dorado, que no se ve desde 1989.');
  // centro de visitantes de madera
  for (let z = 4; z <= 10; z++) for (let x = -16; x <= -8; x++) {
    const edge = x === -16 || x === -8 || z === 4 || z === 10;
    c.set(x, 0, z, K.planks);
    for (let y = 1; y <= 4; y++) c.set(x, y, z, edge ? (y === 2 && (x + z) % 2 ? K.glass : K.planks) : 0);
    c.set(x, 5, z, K.zinc);
  }
  c.door(-12, 1, 10, 0); c.set(-12, 4, 7, K.lamp);
  // comederos de colibríes
  for (const [x, z] of [[-6, 11], [-4, 11]]) { c.set(x, 1, z, K.cerca); c.set(x, 2, z, K.cerca); c.set(x, 3, z, K.repello_rojo); }
  // árboles musgosos con bromelias y helechos
  for (const [x, z] of [[6, 6], [12, -4], [-4, -8], [10, -14], [-12, -6], [2, -14], [14, 10]]) {
    const g = c.ground(x, z);
    for (let y = g + 1; y <= g + 9; y++) c.set(x, y, z, K.tronco_musgoso);
    c.set(x + 1, g + 5, z, K.bromelia); c.set(x - 1, g + 7, z, K.bromelia);
    c.circle(3.4, (dx, dz, d) => { c.set(x + dx, g + 9, z + dz, K.leaves); if (d < 2.4) c.set(x + dx, g + 10, z + dz, K.leaves); });
  }
  for (let z = -16; z <= 13; z++) c.set(0, 0, z, K.gravel);
  for (let k = 0; k < 50; k++) c.set(Math.floor(c.rnd() * 32) - 16, 1, Math.floor(c.rnd() * 32) - 16, k % 2 ? K.helecho : K.musgo);
  // easter egg: el sapo dorado (una estatuita de oro escondida entre los helechos)
  c.set(15, 1, -15, K.oro_volcanico);
  c.placa(14, 1, -15, 1, '¿Un sapo dorado?', 'El sapo dorado (Incilius periglenes) solo vivía aquí y no se ve desde 1989. Si lo encontró, ojalá fuera de verdad… (Easter egg)');
  c.npc(-10, 1, 2, { role: 'guardaparques', name: 'Guía de Monteverde' });
  c.npc(4, 2, 0, { mob: 'quetzal', name: 'quetzal de Monteverde' });
  c.npc(-5, 2, 9, { mob: 'colibri', name: 'colibrí' });
  c.npc(-3, 2, 9, { mob: 'colibri', name: 'colibrí 2' });
}

// ---------- Palo Verde: humedal con aves y cocodrilos ----------
export function buildPaloVerde(c) {
  c.foundation(-22, -22, 22, 22, K.dirt, K.grass, 14);
  c.circle(15, (x, z, d) => {
    const n = hash3(c.ox, x, z, 91);
    if (d + n * 3 > 15) return;
    c.set(x, -1, z, K.dirt); c.set(x, 0, z, K.water);
    if (d > 10 && n < 0.3) c.set(x, 1, z, K.tall_grass);
    if (d < 13 && n > 0.9) c.set(x, 1, z, K.cane);
  });
  // torre de observación de aves
  for (const [x, z] of [[16, 16], [19, 16], [16, 19], [19, 19]]) c.fill(x, 1, z, x, 9, z, K.log);
  for (let x = 16; x <= 19; x++) for (let z = 16; z <= 19; z++) { c.set(x, 10, z, K.planks); c.set(x, 13, z, K.zinc); }
  for (let x = 16; x <= 19; x++) { c.set(x, 11, 16, K.cerca); c.set(x, 11, 19, K.cerca); }
  for (let i = 0; i < 9; i++) c.stair(K.escalera_tablas, 20, 1 + i, 19 - i, 2);
  c.placa(14, 1, 18, 0, 'Torre de observación', 'Desde aquí se ven garzas, patos, espátulas rosadas y el jabirú, la cigüeña más grande de América. En verano llegan miles de aves migratorias.');
  arco(c, 0, 20, 'Parque Nacional Palo Verde', 'Humedal en Guanacaste, entre el río Tempisque y el bosque seco. En la estación seca las lagunas se llenan de aves y los cocodrilos se asolean en el barro.');
  for (const [x, z] of [[-18, -18], [18, -16], [-19, 12]]) tree(c, x, z, 6, K.log, K.leaves, 3);
  c.npc(-4, 0, -2, { mob: 'cocodrilo', name: 'cocodrilo de Palo Verde' });
  c.npc(6, 0, 4, { mob: 'cocodrilo', name: 'cocodrilo 2' });
  c.npc(-8, 1, 14, { role: 'guardaparques', name: 'Guardaparques de Palo Verde' });
  c.npc(10, 1, -12, { mob: 'iguana', name: 'iguana' });
}

// ---------- Isla del Coco: isla en alta mar con cataratas y el tesoro ----------
export function placeIslaCoco(gen, gx, gz) {
  const cell = 3000;
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(gx * cell + 200 + hash3(gen.seed, gx, 7100 + k, gz) * (cell - 400));
    const z = Math.floor(gz * cell + 200 + hash3(gen.seed, gx, 7200 + k, gz) * (cell - 400));
    const c = gen.column(x, z);
    if (c.biome !== 'ocean' || c.h > SEA - 8) continue;
    let ok = true;
    // alta mar: agua honda en todas direcciones hasta lejos
    for (const r of [40, 90, 150]) for (let a = 0; a < 12 && ok; a++) { const cc = gen.column(Math.round(x + Math.cos(a * 0.52) * r), Math.round(z + Math.sin(a * 0.52) * r)); if (cc.biome !== 'ocean' || cc.h > SEA - 4) ok = false; }
    if (ok) return { x, z, y: SEA, rot: 0, id: `isla_coco@${x},${z}`, type: 'isla_coco' };
  }
  return null;
}
export function buildIslaCoco(c) {
  const R = 24;
  // isla alta de acantilados, cubierta de selva
  for (let z = -R - 2; z <= R + 2; z++) for (let x = -R - 2; x <= R + 2; x++) {
    const d = Math.hypot(x, z * 1.2) + hash3(c.ox, x, z, 5) * 2.5;
    if (d > R) continue;
    const g = c.ground(x, z);
    const h = Math.round(2 + 18 * Math.pow(1 - d / R, 0.6));
    for (let y = g; y <= h; y++) c.set(x, y, z, y === h ? K.grass : y > h - 3 ? K.dirt : (x + y) % 5 ? K.stone : K.mossy);
    if (d > R - 2.5) for (let y = 1; y <= h; y++) c.set(x, y, z, (x + y + z) % 3 ? K.stone : K.basalt);
  }
  // cataratas que caen al mar por el acantilado norte
  for (const x of [-6, 5]) { const zf = Math.round(-R / 1.2) + 1; for (let y = 0; y <= 14; y++) c.set(x, y, zf, K.water_fall); c.set(x, 15, zf + 1, K.water); }
  // selva
  for (let k = 0; k < 26; k++) {
    const x = Math.floor(hash3(c.ox, k, 1, 9) * 30) - 15, z = Math.floor(hash3(c.oz, k, 2, 9) * 30) - 15;
    if (Math.hypot(x, z * 1.2) > R - 5) continue;
    const h = Math.round(2 + 18 * Math.pow(1 - (Math.hypot(x, z * 1.2)) / R, 0.6));
    for (let y = h + 1; y <= h + 6; y++) c.set(x, y, z, K.jungle_log);
    c.circle(2.5, (dx, dz) => { c.set(x + dx, h + 6, z + dz, K.jungle_leaves); c.set(x + dx, h + 7, z + dz, dx === 0 || dz === 0 ? K.jungle_leaves : 0); });
  }
  // playa chiquita con muelle de los guardaparques
  for (let z = R - 4; z <= R + 6; z++) for (let x = -2; x <= 2; x++) c.set(x, 1, z, K.planks);
  // easter egg: el tesoro de Lima, en una cueva
  for (let y = 2; y <= 4; y++) for (let x = -2; x <= 2; x++) for (let z = 8; z <= 14; z++) c.set(x, y, z, 0);
  c.chest(0, 2, 13, 2, c.loot([[259, 10, 30], [260, 3, 8], [369, 3, 6], [360, 40, 64], [274, 1, 3], [285, 1, 1]], 9));
  c.set(-1, 3, 13, K.lamp);
  c.placa(1, 2, 9, 2, 'El tesoro de Lima', 'Cuenta la leyenda que en 1820 unos piratas escondieron en la Isla del Coco el tesoro de las iglesias de Lima. Más de 300 expediciones lo buscaron… y usted lo encontró. (Easter egg)');
  c.placa(1, 2, R + 5, 0, 'Parque Nacional Isla del Coco', 'A 550 km de la costa, en el Pacífico: llueve casi todos los días, hay más de 200 cataratas y en sus aguas nadan tiburones martillo. Patrimonio de la Humanidad.');
  c.npc(0, 2, R + 2, { role: 'guardaparques', name: 'Guardaparques de la Isla del Coco' });
  c.npc(8, -4, R + 10, { mob: 'tiburon', name: 'tiburón martillo' });
}
